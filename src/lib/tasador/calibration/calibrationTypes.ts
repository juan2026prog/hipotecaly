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

export interface BacktestMetrics {
  sampleCount: number;
  mae: number; // Mean Absolute Error ($)
  mape: number; // Mean Absolute Percentage Error (%)
  mdape: number; // Median Absolute Percentage Error (%)
  bias: number; // Mean Signed Percentage Error (%) (+ sobreestimación, - subestimación)
  coveragePercentage: number; // % de transacciones que cayeron en el rango [low, high]
  rmse: number;
}

export interface AskingDiscountStats {
  sampleCount: number;
  meanDiscount: number;
  medianDiscount: number;
  p25: number;
  p75: number;
  minDiscount: number;
  maxDiscount: number;
  standardDeviation: number;
  baselineDifference: number; // medianDiscount - 0.1200
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
