// ==============================================================================
// HIPOTECALY TASADOR IA - TIPOS DEL MOTOR DE COMPARABLES Y VALUACIÓN (FASE 3)
// Determinístico, versionado y reproducible
// ==============================================================================

import { PropertyTypeNormalized, LocationPrecision } from '../types/tasadorPipelineTypes';

export type GeographicSearchLevel =
  | 'IMMEDIATE'            // Nivel A: Misma zona inmediata / sub-barrio (< 500m)
  | 'NEIGHBORHOOD'          // Nivel B: Mismo barrio
  | 'ADJACENT_NEIGHBORHOODS'// Nivel C: Barrios limítrofes / comparables
  | 'LOCALITY'             // Nivel D: Misma localidad o ciudad
  | 'DEPARTMENT';          // Nivel E: Todo el departamento / mercado amplio

export type PriceEvidenceHierarchy =
  | 'CONFIRMED_TRANSACTION' // Nivel 1: Transacción real de compraventa registrada
  | 'PROFESSIONAL_APPRAISAL'// Nivel 2: Tasación pericial o profesional verificada
  | 'ADJUSTED_ASKING_PRICE' // Nivel 3: Precio de publicación con factor 12% aplicado exactamente 1 vez
  | 'RAW_ASKING_PRICE';     // Nivel 4: Precio bruto sin ajuste

export type ValuationConfidenceLevel =
  | 'VERY_HIGH'  // 90 - 100
  | 'HIGH'       // 75 - 89
  | 'MEDIUM'     // 60 - 74
  | 'LOW'        // 40 - 59
  | 'VERY_LOW';  // < 40

export type StatisticalValuationMethod =
  | 'WEIGHTED_MEDIAN'
  | 'WEIGHTED_TRIMMED_MEAN'
  | 'WEIGHTED_PRICE_PER_M2'
  | 'DIRECT_COMPARABLE_ADJUSTMENT'
  | 'HYBRID_ROBUST_ENSEMBLE';

export interface ComparableRecencyBucket {
  name: string;
  minDays: number;
  maxDays: number;
  decayFactor: number; // 1.0, 0.90, 0.75, 0.50, 0.25
}

export interface AppraisalSettingsV1 {
  version: number;
  askingPriceAdjustment: number; // 0.0850 (8.50% en V2) / 0.1200 (12.00% en V1)
  minComparables: number;        // Mínimo requerido (e.g. 3)
  targetComparables: number;     // Objetivo ideal (e.g. 8 - 15)
  maxComparables: number;        // Límite superior (e.g. 30)
  maxAgeDays: number;            // 365
  outlierIqrMultiplier: number;  // 1.5
  outlierMadThreshold: number;   // 2.5
  recencyBuckets: ComparableRecencyBucket[];
  weights: {
    location: number;
    propertyType: number;
    totalArea: number;
    builtArea: number;
    bedrooms: number;
    bathrooms: number;
    garage: number;
    age: number;
    condition: number;
    recency: number;
    dataQuality: number;
  };
  methodWeights: {
    weightedMedian: number;
    weightedTrimmedMean: number;
    weightedPricePerM2: number;
    directAdjustment: number;
  };
  confidenceThresholds: {
    veryHigh: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface TargetPropertyInput {
  propertyMasterId?: string;
  propertyType: PropertyTypeNormalized;
  department: string;
  city?: string | null;
  neighborhood?: string | null;
  subNeighborhood?: string | null;
  streetName?: string | null;
  streetNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationPrecision?: LocationPrecision;
  builtAreaM2: number;
  totalAreaM2?: number | null;
  landAreaM2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  garages?: number | null;
  constructionYear?: number | null;
  buildingCondition?: string | null;
  floor?: string | null;
  cadastralNumber?: string | null;
  amenities?: Record<string, boolean | null>;
  declaredAskingPriceUsd?: number | null;
}

export interface ComparableCandidate {
  id: string;
  propertyMasterId: string;
  sourceListingId: string;
  sourceCode: string;
  originalUrl?: string | null;
  title?: string | null;
  propertyType: PropertyTypeNormalized;
  department: string;
  city?: string | null;
  neighborhood?: string | null;
  streetName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  builtAreaM2: number;
  totalAreaM2?: number | null;
  landAreaM2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  garages?: number | null;
  constructionYear?: number | null;
  rawAskingPriceUsd: number;
  currency: string;
  priceEvidenceHierarchy: PriceEvidenceHierarchy;
  isPriceAdjusted: boolean;
  priceAdjustmentPercentage: number;
  effectivePriceUsd: number; // Precio listo para el motor (con 12% aplicado si era asking price)
  pricePerM2Usd: number;
  publicationDate?: string | null;
  daysSincePublication: number;
  dataQualityScore: number;
  distanceMeters?: number | null;
  isConfirmedTransaction?: boolean;
}

export interface DimensionalSimilarityScore {
  locationScore: number;     // 0 - 100
  propertyTypeScore: number; // 0 - 100
  surfaceScore: number;      // 0 - 100
  bedroomsScore: number;     // 0 - 100
  bathroomsScore: number;    // 0 - 100
  garageScore: number;       // 0 - 100
  ageScore: number;          // 0 - 100
  recencyScore: number;      // 0 - 100
  dataQualityScore: number;  // 0 - 100
  finalSimilarityScore: number; // 0 - 100
}

export interface ScoredComparable extends ComparableCandidate {
  similarity: DimensionalSimilarityScore;
  weight: number; // Peso ponderado final (0 - 1)
  isOutlier: boolean;
  outlierReason?: string | null;
  directAdjustmentFactor: number; // Multiplicador de ajuste directo (e.g. 1.05)
  directlyAdjustedPriceUsd: number;
}

export interface OutlierFilterResult {
  acceptedComparables: ScoredComparable[];
  excludedOutliers: ScoredComparable[];
  metricEvaluated: string; // 'price_per_m2_usd'
  lowerThreshold: number;
  upperThreshold: number;
  medianM2: number;
  iqrM2: number;
}

export interface MethodEstimatorResult {
  method: StatisticalValuationMethod;
  estimatedValueUsd: number;
  estimatedPricePerM2Usd: number;
  weight: number;
  effectiveComparablesUsed: number;
  dispersionPercentage: number;
}

export interface ValuationRangeResult {
  estimatedMarketValue: number;
  estimatedRangeLow: number;
  estimatedRangeHigh: number;
  prudentReferenceValue: number; // Percentil 25 o lower bound prudente (NO doble 12%)
  estimatedPricePerM2Usd: number;
  dispersionCoefficient: number; // CV (desviación / media)
}

export interface ValuationConfidenceResult {
  confidenceScore: number; // 0 - 100
  confidenceLevel: ValuationConfidenceLevel;
  breakdown: {
    comparableCountScore: number;     // 0 - 25
    similarityAverageScore: number;   // 0 - 25
    geographicPrecisionScore: number; // 0 - 15
    recencyScore: number;             // 0 - 15
    dispersionScore: number;          // 0 - 10
    dataQualityScore: number;         // 0 - 10
  };
  warnings: string[];
}

export interface ValuationResultReport {
  valuationId: string;
  propertyMasterId?: string;
  version: number;
  generatedAt: string;
  algorithmVersion: string;
  settingsVersion: number;
  targetProperty: TargetPropertyInput;
  estimatedMarketValue: number;
  estimatedRangeLow: number;
  estimatedRangeHigh: number;
  prudentReferenceValue: number;
  currency: 'USD';
  estimatedPricePerM2Usd: number;
  totalComparablesDiscovered: number;
  effectiveComparablesUsed: number;
  outliersExcludedCount: number;
  geographicSearchLevel: GeographicSearchLevel;
  geographicSearchRadiusMeters: number;
  confidence: ValuationConfidenceResult;
  methods: MethodEstimatorResult[];
  selectedComparables: ScoredComparable[];
  excludedOutliers: ScoredComparable[];
  askingPriceAdjustmentApplied: boolean;
  askingPriceAdjustmentPercentage: number;
  warnings: string[];
}
