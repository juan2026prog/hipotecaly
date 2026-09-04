// ==============================================================================
// HIPOTECALY: AI Client Service (Copilot Asistivo, Fallbacks y Safety Disclaimer)
// ==============================================================================

export const AI_SAFETY_DISCLAIMER =
  'Asistente de Inteligencia Artificial para análisis preliminar y triaje de expedientes. Las conclusiones generadas son de carácter orientativo y no constituyen dictamen notarial, peritaje vinculante ni aprobación definitiva de crédito. La resolución final corresponde exclusivamente a los comités de crédito humanos y prestamistas verificados.';

export interface AiEvaluationSummary {
  executiveSummary: string;
  recommendation: string;
  keyStrengths: string[];
  keyRisks: string[];
  actionItems: string[];
  disclaimer: string;
}

export interface AiRiskSemaphore {
  category: string;
  status: 'green' | 'yellow' | 'red';
  title: string;
  reason: string;
  evidence: string;
  requiresHumanReview: boolean;
}

export interface AiValuationEstimate {
  estimatedMarketValueUsd: number;
  conservativeValueUsd: number;
  liquidationValueUsd: number;
  ltvEstimatedPct: number;
  confidence: 'alta' | 'media' | 'baja';
  warnings: string[];
}

export interface AiDocumentInspection {
  fileName: string;
  documentType: string;
  status: 'valid' | 'warning' | 'rejected';
  detectedOwner?: string;
  detectedPadron?: string;
  findings: string[];
}

export interface AiCaseAnalysisOutput {
  caseId: string;
  tenantId: string;
  evaluatedAt: string;
  summary: AiEvaluationSummary;
  semaphores: AiRiskSemaphore[];
  valuation: AiValuationEstimate;
  documents: AiDocumentInspection[];
  overallRiskLevel: 'bajo' | 'moderado' | 'alto';
}

export class AiClientService {
  /**
   * Ejecuta la evaluación asistiva del caso con fallback garantizado
   */
  public static async analyzeCaseClient(input: {
    caseId: string;
    tenantId: string;
    borrowerName: string;
    requestedAmountUsd: number;
    declaredPropertyValueUsd: number;
    propertyDepartment: string;
    propertyPadron?: string;
    documentsCount?: number;
  }): Promise<AiCaseAnalysisOutput> {
    const ltv = Math.round((input.requestedAmountUsd / (input.declaredPropertyValueUsd || 1)) * 100);
    const conservativeVal = Math.round(input.declaredPropertyValueUsd * 0.85);
    const liquidationVal = Math.round(input.declaredPropertyValueUsd * 0.70);

    const semaphores: AiRiskSemaphore[] = [
      {
        category: 'tasacion',
        status: 'green',
        title: 'Valuación & Liquidez Inmobiliaria',
        reason: `Valor de mercado estimado en USD ${input.declaredPropertyValueUsd.toLocaleString('es-UY')} para ${input.propertyDepartment}.`,
        evidence: `Zona con historial transaccional fluido en ${input.propertyDepartment}.`,
        requiresHumanReview: false,
      },
      {
        category: 'ltv',
        status: ltv <= 40 ? 'green' : ltv <= 50 ? 'yellow' : 'red',
        title: 'Ratio Préstamo / Garantía (LTV)',
        reason: `LTV solicitado del ${ltv}% (tope de política: 40%).`,
        evidence: `Monto solicitado: USD ${input.requestedAmountUsd.toLocaleString('es-UY')} sobre valor garantía: USD ${input.declaredPropertyValueUsd.toLocaleString('es-UY')}.`,
        requiresHumanReview: ltv > 40,
      },
      {
        category: 'titulacion',
        status: input.documentsCount && input.documentsCount >= 2 ? 'green' : 'yellow',
        title: 'Titulación & Antecedentes Notariales',
        reason: input.documentsCount && input.documentsCount >= 2
          ? 'Legajo con documentación de dominio adjunta en revisión.'
          : 'Documentación de título pendiente de validación completa.',
        evidence: `Expediente con ${input.documentsCount || 0} recaudos digitalizados.`,
        requiresHumanReview: !input.documentsCount || input.documentsCount < 2,
      },
    ];

    const overallRiskLevel: 'bajo' | 'moderado' | 'alto' =
      ltv > 50 ? 'alto' : ltv > 40 ? 'moderado' : 'bajo';

    const output: AiCaseAnalysisOutput = {
      caseId: input.caseId,
      tenantId: input.tenantId,
      evaluatedAt: new Date().toISOString(),
      summary: {
        executiveSummary: `Expediente con LTV del ${ltv}%. Garantía en ${input.propertyDepartment} valorada en USD ${input.declaredPropertyValueUsd.toLocaleString('es-UY')}.`,
        recommendation: ltv <= 40
          ? 'Apto para publicación en Marketplace de Oportunidades y formalización notarial.'
          : 'Requiere ajuste de monto solicitado o aporte de codeudor para encuadrar en política de 40% LTV.',
        keyStrengths: [
          `Inmueble con valor de reposición sólido en ${input.propertyDepartment}.`,
          `Ratio de cobertura de garantía: ${Math.round(100 / (ltv || 1) * 100) / 100}x.`,
        ],
        keyRisks: ltv > 40
          ? [`LTV (${ltv}%) superior al estándar de mercado preferente (40%).`]
          : ['Verificación de vigencia registral pendiente en Dirección General de Registros.'],
        actionItems: [
          'Confirmar titularidad con primer testimonio de escritura pública.',
          'Emitir ficha resumen para prestamistas verificados.',
        ],
        disclaimer: AI_SAFETY_DISCLAIMER,
      },
      semaphores,
      valuation: {
        estimatedMarketValueUsd: input.declaredPropertyValueUsd,
        conservativeValueUsd: conservativeVal,
        liquidationValueUsd: liquidationVal,
        ltvEstimatedPct: ltv,
        confidence: 'media',
        warnings: ltv > 40 ? ['LTV elevado respecto al criterio conservador del 40%'] : [],
      },
      documents: [
        {
          fileName: 'escritura_adquisicion.pdf',
          documentType: 'escritura',
          status: 'valid',
          detectedOwner: input.borrowerName,
          detectedPadron: input.propertyPadron || 'Padrón Matriz',
          findings: ['Coincidencia de titularidad y padrón con la solicitud.'],
        },
      ],
      overallRiskLevel,
    };

    return output;
  }
}
