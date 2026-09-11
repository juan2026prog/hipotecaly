// ==============================================================================
// HIPOTECALY TASADOR IA - TIPOS DEL MOTOR DE CARACTERÍSTICAS IA Y VISIÓN (FASE 4)
// Trazabilidad, Auditoría de Costos, Shadow Mode y Explicabilidad
// ==============================================================================

export type ConditionQualityGrade =
  | 'EXCELLENT'       // Excelente / A estrenar / Reciclado premium
  | 'VERY_GOOD'       // Muy bueno / Modernizado
  | 'GOOD'            // Bueno / Mantenimiento normal
  | 'FAIR'            // Regular / Requiere mantenimiento menor
  | 'POOR'            // Malo / Para reciclar o reparar
  | 'NOT_DETERMINABLE';// No determinable visualmente

export type FinishQualityGrade =
  | 'LUXURY'          // Terminaciones de lujo
  | 'HIGH'            // Alta calidad
  | 'STANDARD'        // Estándar de mercado
  | 'BASIC'           // Económico / Básico
  | 'NOT_DETERMINABLE';

export type HumidityVisibilityStatus =
  | 'NO_VISIBLE_SIGNS'        // Sin indicios visibles
  | 'APPARENT_SUPERFICIAL'    // Indicios superficiales aparentes
  | 'POSSIBLE_WATER_STAIN'    // Posibles manchas de humedad
  | 'NOT_DETERMINABLE';       // No determinable

export interface QualitativeFeature {
  featureName: string;
  featureValue: string;
  category: 'CONDITION' | 'FINISHES' | 'ENVIRONMENT' | 'STRUCTURE_APPARENT' | 'AMENITY';
  confidence: number; // 0 - 100
  evidenceSource: 'VISION_IMAGE' | 'TEXT_DESCRIPTION' | 'STRUCTURED_DATA';
  evidenceSnippet?: string | null;
  evidenceMediaId?: string | null;
  weightInValuation: number; // En Fase 4 (Shadow Mode): STRICTLY 0.00
  observationalNotes: string;
}

export interface VisionImageAnalysisResult {
  mediaId: string;
  originalUrl: string;
  sha256Hash: string;
  detectedRoomType: 'FACADE' | 'LIVING' | 'KITCHEN' | 'BATHROOM' | 'BEDROOM' | 'BALCONY_TERRACE' | 'GARDEN_PATIO' | 'OTHER';
  apparentCondition: ConditionQualityGrade;
  apparentFinishQuality: FinishQualityGrade;
  naturalLightApparent: 'ABUNDANT' | 'MODERATE' | 'LOW' | 'NOT_DETERMINABLE';
  humiditySigns: HumidityVisibilityStatus;
  visibleHighlights: string[];
  isCached: boolean;
  confidence: number;
}

export interface TextAnalysisResult {
  renovationStatus: 'RECICLADO_A_NUEVO' | 'BUEN_ESTADO' | 'PARA_RECICLAR' | 'A_ESTRENAR' | 'EN_CONSTRUCCION' | 'NO_ESPECIFICADO';
  constructionType: 'TRADICIONAL' | 'STEEL_FRAMING' | 'ISOPANEL' | 'NO_ESPECIFICADO';
  viewOrientation: string | null;
  specialAmenitiesExtracted: string[];
  occupancyStatus: 'LIBRE' | 'CON_RENTA' | 'OCUPADA' | 'NO_ESPECIFICADO';
  confidence: number;
  extractedFeatures: QualitativeFeature[];
}

export interface AIUsageEvent {
  id: string;
  valuationId?: string;
  propertyMasterId?: string;
  eventType: 'TEXT_FEATURE_EXTRACTION' | 'VISION_ANALYSIS' | 'VALUATION_EXPLANATION';
  provider: 'openai' | 'local_heuristic';
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  executionTimeMs: number;
  imagesCount?: number;
  success: boolean;
  errorCode?: string | null;
  createdAt: string;
}

export interface AIAppraisalReportSection {
  executiveSummary: string;
  marketContextExplanation: string;
  propertyStrengths: string[];
  propertyWeaknesses: string[];
  visualObservationsSummary: string[];
  dataLimitations: string[];
  methodologyDescription: string;
  legalDisclaimer: string;
}

export interface AIEnrichmentResult {
  status: 'COMPLETED' | 'FALLBACK_HEURISTIC' | 'UNAVAILABLE';
  textAnalysis?: TextAnalysisResult | null;
  visionAnalyses?: VisionImageAnalysisResult[];
  qualitativeFeatures: QualitativeFeature[];
  reportSections?: AIAppraisalReportSection | null;
  totalAiCostUsd: number;
  totalTokensConsumed: number;
  isShadowMode: true; // Certificación de impacto numérico = 0 en Fase 4
  fallbackReason?: string | null;
}
