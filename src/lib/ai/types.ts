// ==============================================================================
// HIPOTECALY AI CORE: Tipos y Esquemas Estructurados (Zod)
// ==============================================================================

import { z } from 'zod';

// ------------------------------------------------------------------------------
// 1. Descargo Legal Obligatorio
// ------------------------------------------------------------------------------
export const MANDATORY_AI_DISCLAIMER =
  'HIPOTECALY AI proporciona análisis preliminares y herramientas de apoyo. Las decisiones definitivas corresponden al profesional, estudio y/o prestamista responsable.';

// ------------------------------------------------------------------------------
// 2. Esquema Zod de Extracción Documental (Document Intelligence)
// ------------------------------------------------------------------------------
export const DocumentTypeEnum = z.enum([
  'escritura',
  'titulo',
  'recibo_sueldo',
  'certificado_ingresos',
  'constancia_contador',
  'contribucion_inmobiliaria',
  'primaria',
  'tasa_municipal',
  'plano',
  'padron',
  'cedula',
  'certificado',
  'documento_judicial',
  'sucesion',
  'tasacion',
  'comprobante',
  'fotografia_inmueble',
  'otro',
]);

export type DocumentType = z.infer<typeof DocumentTypeEnum>;

export const DocumentExtractionSchema = z.object({
  document_type: DocumentTypeEnum,
  document_date: z.string().nullable().optional(),
  issuer: z.string().nullable().optional(),
  holder: z.string().nullable().optional(),
  property_owner: z.string().nullable().optional(),
  padron: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  locality: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  land_area_m2: z.number().nullable().optional(),
  built_area_m2: z.number().nullable().optional(),
  income: z.number().nullable().optional(),
  currency: z.string().default('UYU'),
  debts: z
    .array(
      z.object({
        creditor: z.string(),
        amount: z.number(),
        currency: z.string().default('UYU'),
        status: z.string().optional(),
      })
    )
    .default([]),
  liens: z
    .array(
      z.object({
        type: z.string(),
        description: z.string(),
        date: z.string().optional(),
        registry_number: z.string().optional(),
      })
    )
    .default([]),
  observations: z.string().nullable().optional(),
  detected_people: z.array(z.string()).default([]),
  detected_entities: z.array(z.string()).default([]),
  important_dates: z
    .array(
      z.object({
        label: z.string(),
        date: z.string(),
      })
    )
    .default([]),
  confidence: z.number().min(0).max(100).default(90),
  warnings: z.array(z.string()).default([]),
});

export type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>;

// ------------------------------------------------------------------------------
// 3. Esquema Zod de Tasación Inmobiliaria (Property Valuation)
// ------------------------------------------------------------------------------
export const ValuationAdjustmentSchema = z.object({
  concept: z.string(),
  factor: z.number(), // ej 0.95 = -5%
  impact_usd: z.number(),
  rationale: z.string(),
});

export const PropertyComparableSchema = z.object({
  id: z.string().optional(),
  source: z.string(),
  url: z.string().optional(),
  title: z.string(),
  department: z.string(),
  locality: z.string(),
  property_type: z.string(),
  surface_m2: z.number(),
  price_usd: z.number(),
  price_per_m2_usd: z.number(),
  comparability_score: z.number().min(0).max(100),
  observed_date: z.string(),
});

export type PropertyComparable = z.infer<typeof PropertyComparableSchema>;

export const PropertyValuationOutputSchema = z.object({
  estimated_market_value: z.number(),
  estimated_min: z.number(),
  estimated_max: z.number(),
  conservative_value: z.number(), // Valor conservador para garantía hipotecaria
  confidence: z.enum(['baja', 'media', 'alta']),
  methodology: z.string(),
  comparables_used: z.array(PropertyComparableSchema).default([]),
  adjustments: z.array(ValuationAdjustmentSchema).default([]),
  warnings: z.array(z.string()).default([]),
});

export type PropertyValuationOutput = z.infer<typeof PropertyValuationOutputSchema>;

// ------------------------------------------------------------------------------
// 4. Esquema Zod de Semáforo Hipotecario (10 Dimensiones)
// ------------------------------------------------------------------------------
export const SemaphoreCategoryEnum = z.enum([
  'tasacion',
  'ltv',
  'titularidad',
  'documentacion',
  'ingresos',
  'deudas',
  'consistencia',
  'propiedad',
  'riesgo',
  'elegibilidad',
]);

export type SemaphoreCategory = z.infer<typeof SemaphoreCategoryEnum>;

export const SemaphoreStatusEnum = z.enum(['green', 'yellow', 'red']);
export type SemaphoreStatus = z.infer<typeof SemaphoreStatusEnum>;

export const SemaphoreItemSchema = z.object({
  id: z.string().optional(),
  category: SemaphoreCategoryEnum,
  status: SemaphoreStatusEnum,
  title: z.string(),
  reason: z.string(),
  evidence: z.string().optional(),
  source_document_ids: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(100).default(90),
  requires_human_review: z.boolean().default(false),
});

export type SemaphoreItem = z.infer<typeof SemaphoreItemSchema>;

// ------------------------------------------------------------------------------
// 5. Esquema Zod de Inconsistencias (Consistency)
// ------------------------------------------------------------------------------
export const ConsistencyIssueSchema = z.object({
  id: z.string(),
  severity: z.enum(['baja', 'media', 'critica']),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  declared_value: z.string(),
  evidenced_value: z.string(),
  source_document_name: z.string().optional(),
  recommendation: z.string(),
});

export type ConsistencyIssue = z.infer<typeof ConsistencyIssueSchema>;

// ------------------------------------------------------------------------------
// 6. Esquema Zod de Underwriting Financiero Híbrido
// ------------------------------------------------------------------------------
export const UnderwritingOutputSchema = z.object({
  loan_amount: z.number(),
  property_value: z.number(),
  conservative_property_value: z.number(),
  ltv_market: z.number(), // % sobre mercado
  ltv_conservative: z.number(), // % sobre conservador
  max_allowed_by_ltv: z.number(),
  policy_limits: z.object({
    max_ltv_allowed: z.number(),
    max_loan_allowed: z.number(),
    min_loan_allowed: z.number(),
    max_term_months: z.number(),
  }),
  eligible: z.boolean(),
  notes: z.string(),
  debt_to_income_ratio: z.number().optional(),
  estimated_monthly_installment_usd: z.number(),
});

export type UnderwritingOutput = z.infer<typeof UnderwritingOutputSchema>;

// ------------------------------------------------------------------------------
// 7. Esquema Zod de Consumo y Costos AI
// ------------------------------------------------------------------------------
export const AiStageBreakdownSchema = z.object({
  document_intelligence_usd: z.number().default(0),
  cross_checks_usd: z.number().default(0),
  valuation_usd: z.number().default(0),
  comparables_usd: z.number().default(0),
  underwriting_usd: z.number().default(0),
  final_report_usd: z.number().default(0),
});

export const AiUsageMetricsSchema = z.object({
  provider: z.string().default('openai'),
  model: z.string(),
  reasoning_level: z.string().default('standard'),
  input_tokens: z.number(),
  cached_input_tokens: z.number(),
  output_tokens: z.number(),
  total_tokens: z.number(),
  image_count: z.number().default(0),
  documents_processed: z.number().default(0),
  pages_processed: z.number().default(0),
  web_search_count: z.number().default(0),
  cost_input_usd: z.number(),
  cost_output_usd: z.number(),
  cost_tools_usd: z.number().default(0),
  cost_total_usd: z.number(),
  case_units_consumed: z.number(), // e.g. 1.36 CASOS
  standard_case_cost_usd: z.number().default(0.50),
  breakdown: AiStageBreakdownSchema.default(() => ({
    document_intelligence_usd: 0,
    cross_checks_usd: 0,
    valuation_usd: 0,
    comparables_usd: 0,
    underwriting_usd: 0,
    final_report_usd: 0,
  })),
  cache_savings_tokens: z.number().default(0),
  cache_savings_usd: z.number().default(0),
});

export type AiUsageMetrics = z.infer<typeof AiUsageMetricsSchema>;

// ------------------------------------------------------------------------------
// 8. Esquema Zod del Dictamen Final de HIPOTECALY AI
// ------------------------------------------------------------------------------
export const HipotecalyAiReportSchema = z.object({
  run_id: z.string(),
  application_id: z.string(),
  organization_id: z.string(),
  status: z.enum([
    'not_started',
    'estimating',
    'queued',
    'processing_documents',
    'analyzing',
    'valuating',
    'retrieving_memory',
    'generating_report',
    'completed',
    'partial',
    'needs_review',
    'failed',
  ]),
  run_type: z.enum(['preliminary', 'full', 'deep']).default('full'),
  analyzed_at: z.string(),
  latency_ms: z.number().default(0),
  summary: z.object({
    executive_summary: z.string(),
    recommendation: z.string(),
    key_strengths: z.array(z.string()),
    key_risks: z.array(z.string()),
    action_items: z.array(z.string()),
  }),
  valuation: PropertyValuationOutputSchema,
  underwriting: UnderwritingOutputSchema,
  semaphore: z.array(SemaphoreItemSchema),
  consistency_issues: z.array(ConsistencyIssueSchema).default([]),
  documents_analyzed: z.array(
    z.object({
      document_id: z.string().optional(),
      file_name: z.string(),
      file_hash: z.string(),
      document_type: z.string(),
      confidence: z.number(),
      is_cached: z.boolean(),
      warnings: z.array(z.string()),
    })
  ),
  global_memory_insights: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      pattern_summary: z.string(),
      sanitized_insight: z.string(),
      similarity: z.number().optional(),
    })
  ).default([]),
  usage: AiUsageMetricsSchema,
  disclaimer: z.string().default(MANDATORY_AI_DISCLAIMER),
});

export type HipotecalyAiReport = z.infer<typeof HipotecalyAiReportSchema>;

// ------------------------------------------------------------------------------
// 9. Billetera y Créditos Promocionales
// ------------------------------------------------------------------------------
export interface AiWalletState {
  organizationId: string;
  promotionalCaseBalance: number;
  purchasedCaseBalance: number;
  totalCaseBalance: number;
  currentPromoMonth: number;
  isFreeTierActive: boolean;
  promoCasesGrantedMonth: number;
}

export interface AiEstimationResult {
  estimatedCaseUnitsMin: number;
  estimatedCaseUnitsMax: number;
  estimatedCostUsdMin: number;
  estimatedCostUsdMax: number;
  currentBalanceCases: number;
  projectedBalanceCasesMin: number;
  projectedBalanceCasesMax: number;
  isHighConsumption: boolean;
  highConsumptionWarning?: string;
  pagesCount: number;
  imagesCount: number;
  documentsCount: number;
  cachedDocumentsCount: number;
}

export interface RawDocumentInput {
  documentId?: string;
  fileName: string;
  fileHash?: string;
  documentType?: string;
  text?: string;
  pagesCount?: number;
  isImage?: boolean;
}

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
  photos?: any[];
  runType?: 'preliminary' | 'full' | 'deep';
  underwritingPolicy?: any;
}

export const AI_STANDARD_CASE_COST_USD = 0.50;

export const AI_MODELS = {
  extraction: 'gpt-5.6-luna',
  reasoning: 'gpt-5.6-terra',
  deep: 'gpt-5.6-sol',
  fallbackExtraction: 'gpt-4o-mini',
  fallbackReasoning: 'gpt-4o',
  fallbackDeep: 'o3-mini',
};

export const DEFAULT_MODEL_PRICING: Record<
  string,
  {
    costInputPerMillionUsd: number;
    costCachedInputPerMillionUsd: number;
    costOutputPerMillionUsd: number;
    costPerSearchUsd: number;
  }
> = {
  'gpt-5.6-luna': {
    costInputPerMillionUsd: 0.15,
    costCachedInputPerMillionUsd: 0.075,
    costOutputPerMillionUsd: 0.60,
    costPerSearchUsd: 0.01,
  },
  'gpt-5.6-terra': {
    costInputPerMillionUsd: 2.50,
    costCachedInputPerMillionUsd: 1.25,
    costOutputPerMillionUsd: 10.00,
    costPerSearchUsd: 0.01,
  },
  'gpt-5.6-sol': {
    costInputPerMillionUsd: 5.00,
    costCachedInputPerMillionUsd: 2.50,
    costOutputPerMillionUsd: 20.00,
    costPerSearchUsd: 0.01,
  },
  'gpt-4o-mini': {
    costInputPerMillionUsd: 0.15,
    costCachedInputPerMillionUsd: 0.075,
    costOutputPerMillionUsd: 0.60,
    costPerSearchUsd: 0.01,
  },
  'gpt-4o': {
    costInputPerMillionUsd: 2.50,
    costCachedInputPerMillionUsd: 1.25,
    costOutputPerMillionUsd: 10.00,
    costPerSearchUsd: 0.01,
  },
  'o3-mini': {
    costInputPerMillionUsd: 1.10,
    costCachedInputPerMillionUsd: 0.55,
    costOutputPerMillionUsd: 4.40,
    costPerSearchUsd: 0.01,
  },
};
