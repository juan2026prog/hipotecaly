// ==============================================================================
// HIPOTECALY TASADOR IA - TIPOS DE INTEGRACIÓN CON EXPEDIENTES (FASE 5)
// Vinculación de colaterales, resoluciones, tasaciones a demanda y flujo humano
// ==============================================================================

import { ValuationResultReport } from '../valuation/valuationTypes';
import { QualitativeFeature } from '../ai/aiTypes';

export type CasePropertyRelationshipType =
  | 'PRIMARY_COLLATERAL'    // Inmueble principal ofrecido en garantía
  | 'SECONDARY_COLLATERAL'  // Inmueble secundario o de refuerzo
  | 'REFERENCE'             // Inmueble testigo o de referencia
  | 'OTHER';

export type CasePropertyResolutionStatus =
  | 'MATCHED'          // Coincidencia exacta o de alta certeza con Property Master
  | 'PROVISIONAL'      // Maestro provisional creado a partir de datos del expediente
  | 'REVIEW_REQUIRED'  // Conflicto de padrón / dirección que requiere validación
  | 'UNRESOLVED';      // Sin datos suficientes para vincular

export type CaseValuationReviewStatus =
  | 'PENDING'
  | 'ACCEPTED_REFERENCE'
  | 'REVALUATION_REQUESTED'
  | 'HUMAN_REVIEW_REQUESTED'
  | 'OVERRIDDEN_PROFESSIONAL';

export type CaseValuationReviewAction =
  | 'ACCEPT_REFERENCE'
  | 'REQUEST_REVALUATION'
  | 'REQUEST_HUMAN_REVIEW';

export type ProfessionalType =
  | 'PERITO_TASADOR'
  | 'ARQUITECTO'
  | 'INGENIERO'
  | 'ESCRIBANO'
  | 'INMOBILIARIA'
  | 'OTRO';

export type ProfessionalVerificationStatus =
  | 'VERIFIED'
  | 'PENDING_DOCUMENT'
  | 'REJECTED';

export interface CasePropertyLink {
  id: string;
  organizationId: string;
  caseId: string;
  propertyMasterId?: string | null;
  relationshipType: CasePropertyRelationshipType;
  isPrimaryCollateral: boolean;
  resolutionStatus: CasePropertyResolutionStatus;
  resolutionScore: number;
  resolutionNotes?: string | null;
  provisionalData?: Record<string, any>;
  linkedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CasePropertyMatchInput {
  caseId: string;
  organizationId: string;
  department: string;
  locality?: string;
  cadastralNumber?: string;
  address?: string;
  streetName?: string;
  streetNumber?: string;
  latitude?: number;
  longitude?: number;
  propertyType: string;
  coveredSurfaceM2?: number;
  totalSurfaceM2?: number;
  bedrooms?: number;
  bathrooms?: number;
  garages?: number;
  yearBuilt?: number;
  notes?: string;
  userId?: string;
}

export interface CasePropertyMatchResult {
  link: CasePropertyLink;
  matchedMasterId?: string | null;
  confidenceScore: number;
  matchType: 'EXACT_CADASTRAL' | 'EXACT_ADDRESS' | 'GEO_PROXIMITY' | 'PROVISIONAL_CREATED' | 'UNRESOLVED';
  details: string;
}

export interface ProfessionalAppraisal {
  id: string;
  organizationId: string;
  caseId?: string | null;
  propertyMasterId?: string | null;
  professionalName: string;
  professionalType: ProfessionalType;
  registrationNumber?: string | null;
  appraisalDate: string;
  appraisedValue: number;
  currency: 'USD' | 'UYU';
  methodology: string;
  documentUrl?: string | null;
  deviationVsAiPercentage?: number | null;
  verificationStatus: ProfessionalVerificationStatus;
  notes?: string | null;
  enteredBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalAppraisalInput {
  organizationId: string;
  caseId?: string;
  propertyMasterId?: string;
  professionalName: string;
  professionalType: ProfessionalType;
  registrationNumber?: string;
  appraisalDate: string;
  appraisedValue: number;
  currency?: 'USD' | 'UYU';
  methodology?: string;
  documentUrl?: string;
  notes?: string;
  enteredBy?: string;
  currentAiValuationUsd?: number;
}

export interface CaseValuationSnapshot {
  valuationId: string;
  caseId: string;
  organizationId: string;
  propertyMasterId: string;
  versionNumber: number;
  idempotencyKey: string;
  reviewStatus: CaseValuationReviewStatus;
  aiStatus: 'COMPLETED' | 'UNAVAILABLE' | 'DISABLED' | 'FAILED';
  estimatedMarketValue: number;
  estimatedRangeLow: number;
  estimatedRangeHigh: number;
  prudentReferenceValue: number;
  currency: 'USD';
  confidenceScore: number;
  confidenceLevel: string;
  report: ValuationResultReport;
  aiFeatures?: QualitativeFeature[] | null;
  professionalAppraisal?: ProfessionalAppraisal | null;
  generatedAt: string;
  settingsVersion: number;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
}
