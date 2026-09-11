// ==============================================================================
// HIPOTECALY TASADOR IA - TIPOS DE GROUND TRUTH, BACKTESTING Y CALIBRACIÓN (FASE 6)
// Observaciones empíricas, jerarquía de certeza, propuestas shadow y ciclo de vida
// ==============================================================================

import { AppraisalSettingsV1 } from '../valuation/valuationTypes';

export type GroundTruthHierarchyLevel = 1 | 2 | 3 | 4;

export type GroundTruthType =
  | 'CONFIRMED_CLOSING'  // Nivel 1: Transacción real cerrada y escriturada
  | 'DOCUMENT_VERIFIED'  // Nivel 2: Tasación profesional pericial documentada
  | 'BROKER_REPORTED'   // Nivel 3: Operación reportada por inmobiliaria verificada
  | 'CLIENT_REPORTED';   // Nivel 4: Reporte no verificado (excluido de calibración)

export type ValuationFeedbackType =
  | 'VALUATION_TOO_HIGH'
  | 'VALUATION_TOO_LOW'
  | 'COMPARABLE_INCORRECT'
  | 'PROPERTY_DATA_INCORRECT'
  | 'VISUAL_FEATURE_INCORRECT'
  | 'RANGE_TOO_WIDE'
  | 'RANGE_TOO_NARROW'
  | 'GOOD_RESULT'
  | 'PROFESSIONAL_OVERRIDE'
  | 'OTHER';

export interface ConfirmedTransaction {
  id: string;
  propertyMasterId: string;
  department: string;
  neighborhood: string;
  propertyType: string;
  transactionDate: string; // YYYY-MM-DD
  transactionPriceUsd: number;
  askingPriceUsd?: number;
  observedDiscount?: number; // (asking - closing) / asking
  hierarchyLevel: GroundTruthHierarchyLevel;
  groundTruthType: GroundTruthType;
  source: string;
  verified: boolean;
  notes?: string;
  createdAt: string;
}

export interface ValuationFeedback {
  id: string;
  organizationId: string;
  caseId?: string | null;
  valuationId: string;
  valuationVersionId?: string | null;
  propertyMasterId?: string | null;
  feedbackType: ValuationFeedbackType;
  rating?: number | null; // 1-5
  comment?: string | null;
  suggestedValue?: number | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface CalibrationObservation {
  id: string;
  valuationId: string;
  propertyMasterId: string;
  transactionId?: string | null;
  professionalAppraisalId?: string | null;
  groundTruthType: GroundTruthType;
  groundTruthLevel: GroundTruthHierarchyLevel;
  predictedValue: number;
  actualValue: number;
  absoluteError: number;
  percentageError: number; // |predicted - actual| / actual
  signedPercentageError: number; // (predicted - actual) / actual
  valuationDate: string;
  transactionDate: string;
  daysBetweenValuationAndTransaction: number;
  department: string;
  neighborhood: string;
  propertyType: string;
  priceBand: string; // '<100k', '100k-200k', '200k-350k', '>350k'
  confidenceAtPrediction: number;
  settingsVersion: number;
  createdAt: string;
}

export type SampleMaturityLevel =
  | 'NO_DATA'              // n = 0
  | 'INSUFFICIENT'         // n = 1 - 9
  | 'EARLY_SIGNAL'         // n = 10 - 29
  | 'USABLE_WITH_CAUTION'  // n = 30 - 74
  | 'STATISTICALLY_USEFUL' // n = 75 - 199
  | 'STRONG_EVIDENCE';     // n >= 200

export type ValidationStrategyType =
  | 'TRADITIONAL_HOLDOUT'     // N >= 30 (70% Calibración / 30% Holdout)
  | 'LEAVE_ONE_OUT_CV'        // 3 <= N < 30 (LOOCV Exploratorio)
  | 'K_FOLD_CV'               // K-Fold Cross Validation exploratorio
  | 'INSUFFICIENT_FOR_SPLIT'; // N < 3

export type ProposalStrength =
  | 'EXPLORATORY' // n < 30 (Prohibida activación en producción)
  | 'PRELIMINARY' // 30 <= n < 75 (Requiere escrutinio profundo)
  | 'ACTIONABLE'  // 75 <= n < 200 (Apta para aprobación Super Admin)
  | 'STRONG';     // n >= 200 (Evidencia robusta de mercado)

export type SignedErrorClassification =
  | 'OVERVALUATION'  // predicted > actual (signed_error > 0)
  | 'UNDERVALUATION' // predicted < actual (signed_error < 0)
  | 'EXACT_MATCH';   // predicted == actual (signed_error == 0)

export interface MaturityThresholdsConfig {
  version: number;
  noDataMax: number;          // 0
  insufficientMax: number;    // 9
  earlySignalMax: number;     // 29
  usableWithCautionMax: number;// 74
  statisticallyUsefulMax: number; // 199
  // >= 200 => STRONG_EVIDENCE
  minMetricSample: number;             // 3 (Mínimo para cálculo exploratorio)
  minGlobalCalibrationSample: number;  // 30 (Mínimo para calibración formal)
  minSegmentCalibrationSample: number; // 15 (Mínimo por segmento)
  minHoldoutSample: number;            // 20 (Mínimo para split holdout tradicional)
  minActivationSample: number;         // 75 (Mínimo para activar nueva versión en prod)
}

export const DEFAULT_MATURITY_THRESHOLDS: MaturityThresholdsConfig = {
  version: 1,
  noDataMax: 0,
  insufficientMax: 9,
  earlySignalMax: 29,
  usableWithCautionMax: 74,
  statisticallyUsefulMax: 199,
  minMetricSample: 3,
  minGlobalCalibrationSample: 30,
  minSegmentCalibrationSample: 15,
  minHoldoutSample: 20,
  minActivationSample: 75,
};

export interface BootstrapConfidenceInterval {
  metricName: string;
  pointEstimate: number;
  ciLow: number | null; // Percentil 2.5
  ciHigh: number | null; // Percentil 97.5
  confidenceLevel: number; // 0.95
  iterations: number;
  status: 'RELIABLE' | 'UNCERTAINTY_NOT_RELIABLE';
}

export interface MetricMetadata {
  metricName: string;
  value: number;
  sampleSize: number;
  algorithmVersion: string;
  settingsVersion: number;
  timeWindow: string;
  validationStrategy: ValidationStrategyType;
  sampleMaturity: SampleMaturityLevel;
  generatedAt: string;
  bootstrap?: BootstrapConfidenceInterval;
}

export interface BacktestMetrics {
  sampleCount: number;
  mae: number; // Mean Absolute Error ($)
  mape: number; // Mean Absolute Percentage Error (%)
  mdape: number; // Median Absolute Percentage Error (%)
  rmse: number; // Root Mean Squared Error ($)
  meanSignedError: number; // Mean Signed Error ($) = sum(pred - actual) / n
  medianSignedError: number; // Median Signed Error ($)
  meanSignedPercentageError: number; // MSPE (%) = sum((pred - actual)/actual) / n * 100
  bias: number; // Alias explícito de meanSignedPercentageError
  overvaluationRate: number; // % de predicciones > real
  undervaluationRate: number; // % de predicciones < real
  exactMatchRate?: number;
  coveragePercentage: number; // % de transacciones dentro del rango [low, high]
  algorithmVersion: string;
  settingsVersion: number;
  timeWindow: string;
  validationStrategy: ValidationStrategyType;
  maturityLevel: SampleMaturityLevel;
  bootstrap?: {
    mape?: BootstrapConfidenceInterval;
    mdape?: BootstrapConfidenceInterval;
    bias?: BootstrapConfidenceInterval;
    coverage?: BootstrapConfidenceInterval;
  };
  status: SampleMaturityLevel;
}

export interface AskingDiscountStats {
  sampleCount: number;
  meanDiscount: number;
  medianDiscount: number;
  p25: number;
  p50: number;
  p75: number;
  minDiscount: number;
  maxDiscount: number;
  standardDeviation: number;
  baselineDifference: number; // medianDiscount - 0.1200
  maturityLevel: SampleMaturityLevel;
  usableForCalibration: boolean;
  status: SampleMaturityLevel;
}

export interface SegmentSufficiencyEvaluation {
  segmentKey: string;
  segmentType: 'GLOBAL' | 'DEPARTMENT' | 'CITY' | 'NEIGHBORHOOD' | 'PROPERTY_TYPE' | 'PRICE_BAND' | 'SURFACE_BAND';
  sampleSize: number;
  maturityLevel: SampleMaturityLevel;
  usableForCalibration: boolean;
  usableForReporting: boolean;
  usableForActivation: boolean;
  warnings: string[];
}

export interface GlobalSufficiencyReport {
  totalSampleSize: number;
  globalMaturity: SampleMaturityLevel;
  thresholdsVersion: number;
  validationStrategy: ValidationStrategyType;
  usableForGlobalCalibration: boolean;
  usableForGlobalActivation: boolean;
  segments: Record<string, SegmentSufficiencyEvaluation>;
  warnings: string[];
  evaluatedAt: string;
}

export type CalibrationProposalStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUPERSEDED';

export interface CalibrationProposal {
  id: string;
  runId: string;
  parameterName: string;
  parameterPath: string;
  currentValue: any;
  proposedValue: any;
  sampleSize: number;
  proposalStrength: ProposalStrength;
  isEligibleForActivation: boolean;
  evidence: {
    metricsBefore: BacktestMetrics;
    metricsAfter: BacktestMetrics;
    zoneBreakdown?: Record<string, any>;
    explanation: string;
  };
  expectedImpact: string;
  status: CalibrationProposalStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

export type CalibrationRunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'INSUFFICIENT_DATA'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export interface CalibrationRun {
  id: string;
  scope: string; // 'GLOBAL' | 'ZONE_POCITOS' | 'PROPERTY_APARTMENT'
  targetParameter: string;
  cutoffDate?: string;
  sampleSize: number;
  trainingSampleSize: number;
  validationSampleSize: number;
  currentSettingsVersion: number;
  candidateSettingsVersion?: number;
  metricsBefore: BacktestMetrics;
  metricsAfter: BacktestMetrics;
  proposals: CalibrationProposal[];
  status: CalibrationRunStatus;
  runBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  notes?: string;
  createdAt: string;
}

export interface SettingsVersionRecord {
  version: number;
  settings: AppraisalSettingsV1;
  status: 'DRAFT' | 'SHADOW_TESTING' | 'ACTIVE' | 'DEPRECATED' | 'ROLLED_BACK';
  effectiveFrom: string;
  effectiveTo?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  changeSummary: string;
  calibrationRunId?: string | null;
}
