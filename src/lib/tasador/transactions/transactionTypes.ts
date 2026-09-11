// ==============================================================================
// HIPOTECALY TASADOR IA - TIPOS DE TRANSACTION INTELLIGENCE (CLOSED SALES DATA)
// Capa Independiente para el Estudio Empírico del Asking-to-Closing Discount
// ==============================================================================

export type TransactionType = 'SALE' | 'RENT' | 'PRE_CONSTRUCTION_SALE';

export type TransactionEvidenceType =
  | 'OFFICIAL_RECORD'            // Registro público oficial / DNC / Catastro
  | 'AGENCY_CONFIRMED'           // Confirmación formal de inmobiliaria / red
  | 'SELLER_CONFIRMED'           // Confirmación directa por parte vendedora
  | 'PUBLIC_TRANSACTION_SOURCE'  // Fuente pública verificada
  | 'PARTNER_FEED'               // Feed institucional / partner B2B
  | 'MANUAL_VERIFIED'            // Ingreso manual por perito/analista Super Admin auditado
  | 'INFERRED';                  // Inferencia estadística (excluida de calibración)

export type TransactionConfidenceLevel =
  | 'VERIFIED'   // 100% verificado documentalmente (apto para calibración)
  | 'HIGH'       // 85 - 99% alta certeza (apto para calibración)
  | 'MEDIUM'     // 65 - 84% certeza moderada (sólo observacional)
  | 'LOW'        // 40 - 64% baja certeza
  | 'UNVERIFIED';// < 40% no verificado / descartado

export type SegmentCalibrationReadiness =
  | 'INSUFFICIENT_DATA'     // N < 20
  | 'OBSERVATIONAL'         // 20 <= N < 50
  | 'CALIBRATION_CANDIDATE' // 50 <= N < 100
  | 'CERTIFIABLE';          // N >= 100

export type TransactionVerificationStatus =
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface TransactionAuditRecord {
  id: string;
  transactionId: string;
  action: 'CREATED' | 'VERIFIED' | 'UPDATED' | 'REJECTED';
  performedByUserId: string;
  performedByUserEmail?: string | null;
  role: string;
  previousValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  notes?: string | null;
  timestamp: string;
}

export interface PropertyTransaction {
  id: string;
  propertyMasterId: string;
  listingId?: string | null;
  sourceId: string;
  sourceName?: string | null;
  transactionType: TransactionType;
  
  // Ubicación & Tipología
  department: string;
  city?: string | null;
  neighborhood: string;
  propertyType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  builtAreaM2?: number | null;
  totalAreaM2?: number | null;

  // Precios & Descuentos
  askingPriceInitial: number;
  askingPriceLast: number;
  closingPrice: number;
  currency: 'USD' | 'UYU';
  
  // Métricas Derivadas
  discountAbsolute: number;       // askingPriceLast - closingPrice
  discountPercentage: number;     // (askingPriceLast - closingPrice) / askingPriceLast
  initialDiscountPercentage: number; // (askingPriceInitial - closingPrice) / askingPriceInitial
  
  // Fechas & Tiempo en Mercado
  listingFirstSeenAt: string;     // ISO Date
  listingLastSeenAt: string;      // ISO Date
  transactionDate: string;        // ISO Date YYYY-MM-DD
  daysOnMarket: number;           // transactionDate - listingFirstSeenAt
  
  // Evidencia & Gobernanza
  sourceType: 'INTERNAL_OPERATION' | 'EXTERNAL_AGENCY' | 'PUBLIC_REGISTRY' | 'MANUAL_ENTRY';
  evidenceType: TransactionEvidenceType;
  evidenceUrl?: string | null;
  evidenceReference?: string | null;
  confidence: TransactionConfidenceLevel;
  verificationStatus: TransactionVerificationStatus;
  transactionQualityScore: number; // 0 - 100
  
  // Aislamiento Multi-Tenant & Auditoría
  organizationId?: string | null;
  registeredByUserId?: string | null;
  verifiedByUserId?: string | null;
  verifiedAt?: string | null;
  notes?: string | null;
  auditTrail?: TransactionAuditRecord[];
  
  createdAt: string;
  updatedAt: string;
}

export interface SegmentTransactionMetrics {
  segmentKey: string;             // ej: "Montevideo|Pocitos|APARTMENT"
  department: string;
  neighborhood: string;
  propertyType: string;
  sampleSizeN: number;            // N de operaciones verificadas
  readiness: SegmentCalibrationReadiness;
  
  // Estadísticas Robustas de Descuento (Asking to Closing)
  meanDiscountPct: number;
  medianDiscountPct: number;
  p25DiscountPct: number;
  p75DiscountPct: number;
  madDiscountPct: number;         // Median Absolute Deviation
  iqrDiscountPct: number;         // Interquartile Range
  
  // Métricas de Mercado
  medianDaysOnMarket: number;
  medianClosingPriceUsd: number;
  medianPricePerM2Usd: number;
  
  // Comparativa contra Ajuste Global Actual (8.50%)
  currentGlobalAdjustmentPct: number; // 8.50%
  spreadVsGlobalAdjustmentPct: number;// medianDiscountPct - currentGlobalAdjustmentPct
  calibrationReviewRecommended: boolean; // Flag interno si N >= 50 y spread >= 1.5%
  
  timeWindow: '30_DAYS' | '90_DAYS' | '180_DAYS' | '365_DAYS' | 'ALL_TIME';
  lastUpdated: string;
}

export interface TransactionIntelligenceDashboardSummary {
  kpis: {
    totalVerifiedTransactions: number;
    totalUnverifiedTransactions: number;
    closingsLast30Days: number;
    averageDiscountPct: number;
    medianDiscountPct: number;
    medianDaysOnMarket: number;
    activeNeighborhoodsCount: number;
    activePropertyTypesCount: number;
    confidenceDistribution: {
      verified: number;
      high: number;
      medium: number;
      low: number;
      unverified: number;
    };
  };
  globalComparison: {
    currentGlobalAdjustment: number; // 8.50%
    observedMarketMedian: number;    // Mediana empírica si N > 0, o 8.50% baseline
    spreadPercentage: number;
    sampleSizeTotal: number;
    calibrationReviewRecommended: boolean;
  };
  segmentMetrics: SegmentTransactionMetrics[];
  recentTransactions: PropertyTransaction[];
}
