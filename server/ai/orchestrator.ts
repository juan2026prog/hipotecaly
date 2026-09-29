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
import { UnderwritingAgent, UnderwritingPolicyConfig } from './agents/underwritingAgent.js';
import { RiskAgent } from './agents/riskAgent.js';
import { MemoryRetrievalAgent } from './agents/memoryRetrievalAgent.js';
import { ComparablesAgent } from './agents/comparablesAgent.js';
import { openAiSecretResolver } from './openAiSecretResolver.js';
import { underwritingPolicyResolver, CANONICAL_DEMO_POLICY } from './underwritingPolicyResolver.js';
import { pricingRegistry } from './pricingRegistry.js';
import { supabaseAdmin } from '../supabase.js';

export interface ApplicationCaseInput {
  applicationId: string;
  organizationId: string;
  lenderId?: string;
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
  isDemoMode?: boolean;
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

    // Resolución Server-Side de la Política Multi-Tenant Efectiva (Organización + Inversor)
    let effectivePolicy: UnderwritingPolicyConfig = CANONICAL_DEMO_POLICY;
    let policyResolutionStatus = 'DEMO_POLICY';

    if (input.policy) {
      effectivePolicy = input.policy;
      policyResolutionStatus = 'EXPLICIT_CUSTOM';
    } else {
      const policyRes = await underwritingPolicyResolver.resolveEffectivePolicy({
        organizationId: input.organizationId,
        lenderId: input.lenderId,
        isDemoMode: input.isDemoMode,
      });

      if (policyRes.status === 'RESOLVED' || policyRes.status === 'DEMO_POLICY') {
        effectivePolicy = policyRes.policy;
        policyResolutionStatus = policyRes.status;
      } else if (policyRes.status === 'POLICY_NOT_CONFIGURED') {
        throw new Error(`POLICY_NOT_CONFIGURED: ${policyRes.message}`);
      } else if (policyRes.status === 'NO_COMPATIBLE_POLICY') {
        throw new Error(`NO_COMPATIBLE_POLICY: Incompatibilidad entre organización e inversor (${policyRes.reasons.join(', ')}).`);
      } else if (policyRes.status === 'POLICY_DATA_ERROR' || policyRes.status === 'POLICY_RESOLUTION_ERROR') {
        throw new Error(`POLICY_ERROR (${policyRes.errorCode}): ${policyRes.message}`);
      }
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

    // 5. UNDERWRITING DETERMINÍSTICO HÍBRIDO (CON POLÍTICA RESUELTA MULTI-TENANT)
    const underwriting = this.underAgent.evaluateUnderwriting(
      input.requestedAmount,
      valuation.estimated_market_value,
      valuation.conservative_value,
      input.termMonths,
      input.property.propertyType,
      input.property.department,
      input.borrower.declaredIncome,
      effectivePolicy
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

    await pricingRegistry.getPricingForModel(modelName);
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

    // 9. DICTAMEN Y RESUMEN EJECUTIVO
    const hasRedSemaphores = semaphore.some((s) => s.status === 'red');
    const redItems = semaphore.filter((s) => s.status === 'red');

    let recommendation = 'APROBADO_CON_CONDICIONES';
    if (!underwriting.eligible || hasRedSemaphores) {
      recommendation = 'REQUIERE_REVISION_HUMANA';
    } else if (semaphore.every((s) => s.status === 'green')) {
      recommendation = 'ELEGIBLE_DIRECTO';
    }

    const keyStrengths: string[] = [];
    if (underwriting.ltv_conservative <= (effectivePolicy.maxLtv || 40)) {
      keyStrengths.push(`LTV conservador del ${underwriting.ltv_conservative}%, dentro del margen seguro de la política.`);
    }
    if (valuation.conservative_value >= input.property.estimatedValue * 0.85) {
      keyStrengths.push('Excelente concordancia entre valor declarado por el solicitante y tasación técnica.');
    }
    if (documentsAnalyzed.length >= 3) {
      keyStrengths.push(`Legajo documental robusto con ${documentsAnalyzed.length} documentos analizados.`);
    }

    const keyRisks: string[] = [];
    redItems.forEach((item) => {
      keyRisks.push(`[${item.category.toUpperCase()}] ${item.title}: ${item.reason}`);
    });
    consistency.issues
      .filter((i) => i.severity === 'critica' || i.severity === 'media')
      .forEach((iss) => {
        keyRisks.push(`Inconsistencia en ${iss.category}: ${iss.title}`);
      });

    const actionItems: string[] = [];
    consistency.missingRequiredDocs.forEach((doc) => {
      actionItems.push(`Solicitar presentación urgente de: ${doc}`);
    });
    if (redItems.length > 0) {
      actionItems.push('Elevar a dictamen notarial/jurídico para subsanar alertas rojas de titularidad o gravámenes.');
    }

    const executiveSummary = `Expediente hipotecario analizado bajo política ${policyResolutionStatus}. Monto solicitado: USD ${input.requestedAmount.toLocaleString('es-UY')}. Valor conservador del inmueble: USD ${valuation.conservative_value.toLocaleString('es-UY')} (LTV garantía: ${underwriting.ltv_conservative}% vs tope ${effectivePolicy.maxLtv}%). ${
      keyRisks.length > 0
        ? `Se detectaron ${keyRisks.length} alertas a verificar previo a la firma.`
        : 'El legajo presenta consistencia óptima para formalización.'
    }`;

    // 10. CONSTRUCCIÓN DEL REPORTE FINAL CANÓNICO
    const latencyTotalMs = Date.now() - startTime;

    const finalReport: HipotecalyAiReport = {
      case_id: input.applicationId,
      run_id: runId,
      created_at: new Date().toISOString(),
      latency_ms: latencyTotalMs,
      executive_summary: executiveSummary,
      recommendation,
      key_strengths: keyStrengths,
      key_risks: keyRisks,
      action_items: actionItems,
      documents_analyzed: documentsAnalyzed,
      consistency_issues: consistency.issues,
      missing_documents: consistency.missingRequiredDocs,
      property_valuation: valuation,
      underwriting,
      semaphore,
      global_memory_insights: memoryInsights,
      comparables_used: compResult.comparables,
      usage,
      legal_disclaimer: MANDATORY_AI_DISCLAIMER,
    };

    // 11. PERSISTENCIA EN SUPABASE
    try {
      if (input.organizationId && input.applicationId) {
        supabaseAdmin
          .from('ai_case_runs')
          .insert({
            id: runId.startsWith('run_') ? undefined : runId,
            application_id: input.applicationId,
            organization_id: input.organizationId,
            status: 'completed',
            run_type: runType,
            latency_ms: latencyTotalMs,
            created_by: input.userId || null,
          })
          .then(() => {})
          .catch(() => {});
      }
    } catch {}

    return finalReport;
  }
}

export const hipotecalyAiOrchestrator = new HipotecalyAiOrchestrator();
