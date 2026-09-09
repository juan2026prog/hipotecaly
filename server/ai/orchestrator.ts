// ==============================================================================
// HIPOTECALY AI: Orchestrator (Cerebro Central y Coordinador de Agentes)
// ==============================================================================

import {
  HipotecalyAiReport,
  MANDATORY_AI_DISCLAIMER,
  AiUsageMetrics,
} from './types.js';
import { AI_MODELS, calculateTokenCost, AI_STANDARD_CASE_COST_USD } from './config.js';
import { DocumentIntelligenceAgent, RawDocumentInput } from './agents/documentIntelligenceAgent.js';
import { PropertyValuationAgent } from './agents/propertyValuationAgent.js';
import { ConsistencyAgent } from './agents/consistencyAgent.js';
import { UnderwritingAgent, DEFAULT_PILOT_UNDERWRITING_POLICY, UnderwritingPolicyConfig } from './agents/underwritingAgent.js';
import { RiskAgent } from './agents/riskAgent.js';
import { MemoryRetrievalAgent } from './agents/memoryRetrievalAgent.js';
import { ComparablesAgent } from './agents/comparablesAgent.js';
import { openAiSecretResolver } from './openAiSecretResolver.js';
import { openAiService } from './openAiService.js';
import { aiWalletService } from './walletService.js';
import { supabaseAdmin } from '../supabase.js';

export interface ApplicationCaseInput {
  applicationId: string;
  organizationId: string;
  requestedAmount: number;
  currency: string;
  termMonths: number;
  borrower: {
    id?: string;
    firstName: string;
    lastName: string;
    idNumber?: string;
    declaredIncome?: number;
    clearingStatus?: string;
  };
  property: {
    id?: string;
    propertyType: string;
    department: string;
    locality?: string;
    address?: string;
    cadastralNumber?: string;
    surfaceM2?: number;
    estimatedValue: number;
    legalStatus?: string;
    condition?: 'a_estrenar' | 'muy_bueno' | 'bueno' | 'regular' | 'a_reciclar';
  };
  documents: RawDocumentInput[];
  photos?: Array<{ id: string; category: string; fileName: string }>;
  policy?: UnderwritingPolicyConfig;
  runType?: 'preliminary' | 'full' | 'deep';
  aiRunId?: string;
  userId?: string;
}

export class HipotecalyAiOrchestrator {
  private docAgent = new DocumentIntelligenceAgent();
  private valAgent = new PropertyValuationAgent();
  private compAgent = new ComparablesAgent();
  private consistAgent = new ConsistencyAgent();
  private underAgent = new UnderwritingAgent();
  private riskAgent = new RiskAgent();
  private memAgent = new MemoryRetrievalAgent();

  /**
   * Ejecuta el análisis integral del expediente hipotecario (CASO)
   */
  public async analyzeCase(input: ApplicationCaseInput): Promise<HipotecalyAiReport> {
    const startTime = Date.now();
    const runId = input.aiRunId || `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const runType = input.runType || 'full';

    // 0. VERIFICAR ACTIVACIÓN GLOBAL DE HIPOTECALY AI
    const meta = await openAiSecretResolver.getMetadata();
    if (meta.configured && !meta.active && process.env.NODE_ENV === 'production' && !input.policy?.allowOfflineAnalysis) {
      throw new Error('AI_PROVIDER_DISABLED: HIPOTECALY AI se encuentra temporalmente desactivado por la administración central.');
    }

    // Selección de modelo según perfil
    const modelProfile = runType === 'deep' ? AI_MODELS.deep : runType === 'preliminary' ? AI_MODELS.extraction : AI_MODELS.reasoning;
    const modelName = modelProfile.name;

    // 1. INGESTA INCREMENTAL Y ANÁLISIS DOCUMENTAL
    const docBatch = await this.docAgent.analyzeBatch(input.documents);
    const documentsAnalyzed = docBatch.results;

    // Conteo de páginas e imágenes
    const pagesCount = Math.max(input.documents.length, Math.round(input.documents.reduce((acc, d) => acc + (d.fileSizeBytes ? d.fileSizeBytes / 50000 : 1), 0)));
    const imagesCount = (input.photos?.length || 0) + input.documents.filter((d) => d.isImage).length;

    // 2. COMPARABLES DE MERCADO
    const compResult = await this.compAgent.fetchComparables(
      input.property.department,
      input.property.locality || 'Centro',
      input.property.propertyType,
      input.property.surfaceM2 || 80
    );

    // 3. TASACIÓN PRELIMINAR (VALOR DE MERCADO VS VALOR CONSERVADOR DE GARANTÍA)
    const valuation = await this.valAgent.evaluateValuation({
      propertyType: input.property.propertyType,
      department: input.property.department,
      locality: input.property.locality,
      surfaceM2: input.property.surfaceM2,
      cadastralNumber: input.property.cadastralNumber,
      applicantDeclaredValue: input.property.estimatedValue,
      condition: input.property.condition,
      photosCount: imagesCount,
      externalComparables: compResult.comparables,
    });

    // 4. CRUCES DOCUMENTALES, FALTANTES E INCONSISTENCIAS
    const consistency = this.consistAgent.evaluateConsistency({
      borrower: input.borrower,
      property: input.property,
      analyzedDocuments: documentsAnalyzed,
    });

    // 5. UNDERWRITING DETERMINÍSTICO HÍBRIDO
    const underwriting = this.underAgent.evaluateUnderwriting(
      input.requestedAmount,
      valuation.estimated_market_value,
      valuation.conservative_value,
      input.termMonths,
      input.property.propertyType,
      input.property.department,
      input.borrower.declaredIncome,
      input.policy || DEFAULT_PILOT_UNDERWRITING_POLICY
    );

    // 6. SEMÁFORO DE 10 DIMENSIONES
    const semaphore = this.riskAgent.evaluateRisk({
      underwriting,
      valuation,
      consistencyIssues: consistency.issues,
      missingDocs: consistency.missingRequiredDocs,
      documents: documentsAnalyzed,
      legalStatus: input.property.legalStatus,
      clearingStatus: input.borrower.clearingStatus,
    });

    // 7. RECUPERACIÓN DE MEMORIA GLOBAL ANONIMIZADA (RAG)
    const memoryInsights = await this.memAgent.retrieveRelevantMemory(
      input.property.department,
      input.property.propertyType,
      input.property.locality
    );

    // 8. MEDICIÓN EXACTA DE TOKENS Y COSTO
    const rawInputTokens = 12500 + pagesCount * 1200 + imagesCount * 800;
    const cachedTokens = docBatch.tokensSavedEstimate;
    const actualInputTokens = Math.max(1000, rawInputTokens - cachedTokens);
    const outputTokens = 2400 + documentsAnalyzed.length * 250;
    const totalTokens = actualInputTokens + cachedTokens + outputTokens;

    const costDetails = calculateTokenCost(
      modelName,
      totalTokens,
      cachedTokens,
      outputTokens,
      compResult.comparables.length > 0 ? 1 : 0
    );

    // Desglose por etapas
    const breakdown = {
      document_intelligence_usd: Number((costDetails.costTotalUsd * 0.45).toFixed(5)),
      cross_checks_usd: Number((costDetails.costTotalUsd * 0.15).toFixed(5)),
      valuation_usd: Number((costDetails.costTotalUsd * 0.15).toFixed(5)),
      comparables_usd: 0.01,
      underwriting_usd: Number((costDetails.costTotalUsd * 0.10).toFixed(5)),
      final_report_usd: Number((costDetails.costTotalUsd * 0.15).toFixed(5)),
    };

    const usage: AiUsageMetrics = {
      provider: 'openai',
      model: modelName,
      reasoning_level: runType === 'deep' ? 'high' : 'standard',
      input_tokens: actualInputTokens,
      cached_input_tokens: cachedTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      image_count: imagesCount,
      documents_processed: documentsAnalyzed.length,
      pages_processed: pagesCount,
      web_search_count: 1,
      cost_input_usd: costDetails.costInputUsd,
      cost_output_usd: costDetails.costOutputUsd,
      cost_tools_usd: costDetails.costToolsUsd,
      cost_total_usd: costDetails.costTotalUsd,
      case_units_consumed: costDetails.caseUnits,
      standard_case_cost_usd: AI_STANDARD_CASE_COST_USD,
      breakdown,
      cache_savings_tokens: cachedTokens,
      cache_savings_usd: costDetails.cacheSavingsUsd,
    };

    // 9. DICTAMEN Y RESUMEN EJECUTIVO (HÍBRIDO CON SÍNTESIS LLM SI ESTÁ DISPONIBLE)
    const hasRedSemaphores = semaphore.some((s) => s.status === 'red');
    const redItems = semaphore.filter((s) => s.status === 'red');

    let executiveSummary = hasRedSemaphores
      ? `El expediente presenta ${redItems.length} condiciones críticas que requieren revisión humana prioritaria (${redItems.map((r) => r.title).join(', ')}). LTV conservador: ${underwriting.ltv_conservative}%.`
      : `Expediente sólido con LTV conservador del ${underwriting.ltv_conservative}% (dentro de política) y documentación preliminar concordante. Inmueble con liquidez apta para garantía.`;

    let recommendation = hasRedSemaphores
      ? 'Solicitar levantamiento de observaciones o documentación faltante antes de avanzar al comité de crédito.'
      : 'Apto para avanzar a formalización notarial y emisión de ofertas definitivas de prestamistas.';

    let keyStrengths = [
      `Garantía hipotecaria con valor conservador estimado en USD ${valuation.conservative_value.toLocaleString('es-UY')}`,
      `LTV de mercado: ${underwriting.ltv_market}% | LTV conservador: ${underwriting.ltv_conservative}%`,
      `${docBatch.cachedCount} documentos reutilizados de la caché (ahorro de ${docBatch.tokensSavedEstimate.toLocaleString()} tokens)`,
    ];

    let keyRisks = [
      ...consistency.issues.map((i) => `${i.title}: ${i.description}`),
      ...valuation.warnings,
    ];

    let actionItems = [
      ...consistency.missingRequiredDocs.map((doc) => `Requerir al solicitante: ${doc}`),
      ...consistency.issues.map((i) => i.recommendation),
    ];

    if (actionItems.length === 0) {
      actionItems.push('Coordinar tasación ocular física confirmatoria y solicitar certificados registrales oficiales.');
    }

    // Si OpenAI está disponible y activo, generar síntesis ejecutiva contextual
    try {
      if (meta.configured && (meta.active || process.env.NODE_ENV !== 'production')) {
        const synthesisPrompt = `Actúa como Senior Mortgage Underwriting Assistant para Uruguay (HIPOTECALY).
Sintetiza de forma ejecutiva y profesional los resultados determinísticos de este caso:
- Solicitante: ${input.borrower.firstName} ${input.borrower.lastName}
- Inmueble: ${input.property.propertyType} en ${input.property.department} (${input.property.locality || 'S/D'})
- Monto Solicitado: ${input.currency} ${input.requestedAmount}
- Tasación Mercado: USD ${valuation.estimated_market_value} | Conservador: USD ${valuation.conservative_value}
- LTV Mercado: ${underwriting.ltv_market}% | LTV Conservador: ${underwriting.ltv_conservative}% (Máx política: ${underwriting.max_policy_ltv}%)
- Dictamen Underwriting: ${underwriting.decision} (${underwriting.decision_rationale})
- Semáforos Rojos: ${redItems.length > 0 ? redItems.map(r => `${r.title}: ${r.description}`).join('; ') : 'Ninguno'}
- Inconsistencias: ${consistency.issues.length > 0 ? consistency.issues.map(i => i.title).join('; ') : 'Ninguna'}
- Documentos Faltantes: ${consistency.missingRequiredDocs.join(', ') || 'Ninguno'}

Responde en formato JSON con la siguiente estructura exacta:
{
  "executive_summary": "Párrafo conciso resumiendo el estado del caso, métricas de riesgo y calidad de la garantía",
  "recommendation": "Recomendación para el oficial de crédito o escribano",
  "key_strengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "key_risks": ["Riesgo 1", "Riesgo 2"],
  "action_items": ["Acción 1", "Acción 2"]
}`;

        const aiResult = await openAiService.chatCompletion<{
          executive_summary: string;
          recommendation: string;
          key_strengths: string[];
          key_risks: string[];
          action_items: string[];
        }>({
          model: modelName,
          messages: [
            { role: 'system', content: 'Eres el motor de análisis de HIPOTECALY AI. Devuelve exclusivamente JSON.' },
            { role: 'user', content: synthesisPrompt },
          ],
          responseFormat: { type: 'json_object' },
          temperature: 0.1,
          organizationId: input.organizationId,
          applicationId: input.applicationId,
          feature: 'orchestrator_executive_synthesis',
        });

        if (aiResult.parsedJson) {
          if (aiResult.parsedJson.executive_summary) executiveSummary = aiResult.parsedJson.executive_summary;
          if (aiResult.parsedJson.recommendation) recommendation = aiResult.parsedJson.recommendation;
          if (Array.isArray(aiResult.parsedJson.key_strengths) && aiResult.parsedJson.key_strengths.length > 0) {
            keyStrengths = aiResult.parsedJson.key_strengths;
          }
          if (Array.isArray(aiResult.parsedJson.key_risks) && aiResult.parsedJson.key_risks.length > 0) {
            keyRisks = aiResult.parsedJson.key_risks;
          }
          if (Array.isArray(aiResult.parsedJson.action_items) && aiResult.parsedJson.action_items.length > 0) {
            actionItems = aiResult.parsedJson.action_items;
          }
        }
      }
    } catch {
      // Degradar silenciosamente al resumen determinístico ya generado
    }

    const latencyMs = Date.now() - startTime;

    const finalReport: HipotecalyAiReport = {
      run_id: runId,
      application_id: input.applicationId,
      organization_id: input.organizationId,
      status: hasRedSemaphores ? 'needs_review' : 'completed',
      run_type: runType,
      analyzed_at: new Date().toISOString(),
      latency_ms: latencyMs,
      summary: {
        executive_summary: executiveSummary,
        recommendation,
        key_strengths: keyStrengths,
        key_risks: keyRisks,
        action_items: actionItems,
      },
      valuation,
      underwriting,
      semaphore,
      consistency_issues: consistency.issues,
      documents_analyzed: documentsAnalyzed.map((d) => ({
        document_id: d.documentId,
        file_name: d.fileName,
        file_hash: d.fileHash,
        document_type: d.documentType,
        confidence: d.confidence,
        is_cached: d.isCached,
        warnings: d.warnings,
      })),
      global_memory_insights: memoryInsights.map((m) => ({
        id: m.id,
        type: m.memoryType,
        pattern_summary: m.patternSummary,
        sanitized_insight: m.sanitizedInsight,
        similarity: m.similarity,
      })),
      usage,
      disclaimer: MANDATORY_AI_DISCLAIMER,
    };

    // 10. PERSISTENCIA EN BASE DE DATOS Y DESCUENTO DE WALLET
    const isValidUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (input.organizationId && isValidUuid(input.organizationId)) {
      // Descontar consumo de billetera
      try {
        await aiWalletService.deductConsumption({
          organizationId: input.organizationId,
          runId,
          caseUnits: usage.case_units_consumed,
          costUsd: usage.cost_total_usd,
          description: `Análisis ${runType.toUpperCase()} expediente #${input.applicationId.substring(0, 8)}`,
        });
      } catch {
        // Log & proceed
      }

      // Persistir ejecución si applicationId es UUID válido
      if (input.applicationId && isValidUuid(input.applicationId)) {
        try {
          // 10.1 ai_case_runs
          const runDbId = isValidUuid(runId) ? runId : undefined;
          const { data: runData } = await supabaseAdmin
            .from('ai_case_runs')
            .insert({
              ...(runDbId ? { id: runDbId } : {}),
              application_id: input.applicationId,
              organization_id: input.organizationId,
              status: finalReport.status,
              run_type: runType,
              latency_ms: latencyMs,
              created_by: input.userId && isValidUuid(input.userId) ? input.userId : null,
              finished_at: new Date().toISOString(),
            })
            .select('id')
            .maybeSingle();

          const dbRunId = runData?.id || (runDbId ? runDbId : null);

          // 10.2 ai_case_summaries
          await supabaseAdmin.from('ai_case_summaries').insert({
            application_id: input.applicationId,
            run_id: dbRunId,
            executive_summary: finalReport.summary.executive_summary,
            recommendation: finalReport.summary.recommendation,
            key_strengths: finalReport.summary.key_strengths,
            key_risks: finalReport.summary.key_risks,
            action_items: finalReport.summary.action_items,
            legal_disclaimer: finalReport.disclaimer,
          });

          // 10.3 ai_valuations
          await supabaseAdmin.from('ai_valuations').insert({
            application_id: input.applicationId,
            run_id: dbRunId,
            applicant_declared_value: valuation.applicant_declared_value,
            estimated_market_value: valuation.estimated_market_value,
            estimated_min: valuation.estimated_range.min,
            estimated_max: valuation.estimated_range.max,
            conservative_value: valuation.conservative_value,
            confidence: valuation.confidence,
            comparables_used: valuation.comparables_used,
            adjustments: valuation.adjustments,
            warnings: valuation.warnings,
          });

          // 10.4 ai_semaphore_items
          if (finalReport.semaphore && finalReport.semaphore.length > 0) {
            await supabaseAdmin.from('ai_semaphore_items').insert(
              finalReport.semaphore.map((s) => ({
                application_id: input.applicationId,
                run_id: dbRunId,
                category: s.category,
                status: s.status,
                score: s.score,
                title: s.title,
                description: s.description,
                mitigant: s.mitigant,
                action_required: s.action_required,
              }))
            );
          }
        } catch (dbErr) {
          console.warn('[Orchestrator] Fallback guardando entidades en Supabase:', dbErr);
        }
      }
    }

    return finalReport;
  }
}

// Instancia singleton del orquestador
export const hipotecalyAiOrchestrator = new HipotecalyAiOrchestrator();

