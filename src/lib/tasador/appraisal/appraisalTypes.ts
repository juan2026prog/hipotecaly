// ==============================================================================
// HIPOTECALY TASADOR IA - TIPOS Y MODELO DE DATOS DE TASACIÓN OPERATIVA
// Estructura de inmueble objetivo, estados, comparables y persistencia multi-tenant
// ==============================================================================

export type AppraisalStatus =
  | 'DRAFT'
  | 'READY_FOR_COMPARABLES'
  | 'COMPARABLES_FOUND'
  | 'COMPARABLES_REVIEWED'
  | 'READY_FOR_VALUATION'
  | 'VALUATED'
  | 'REPORT_GENERATED'
  | 'FINALIZED';

export type AppraisalSetQuality = 'ALTA' | 'MEDIA' | 'BAJA';

export type AppraisalPropertyType =
  | 'apartamento'
  | 'casa'
  | 'terreno'
  | 'local_comercial'
  | 'oficina'
  | 'campo'
  | 'ph';

export type BuildingCondition =
  | 'excelente'
  | 'muy_bueno'
  | 'bueno'
  | 'regular'
  | 'a_reciclar';

export interface AppraisalPhoto {
  id: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  isPrimary: boolean;
  order: number;
}

export interface AppraisalLocation {
  country: string;
  department: string;
  city: string;
  neighborhood: string;
  streetName: string;
  streetNumber: string;
  unitOrApt?: string;
  floor?: string;
  cadastralNumber?: string;
  latitude?: number | null;
  longitude?: number | null;
  isGeocodedExact: boolean;
}

export interface AppraisalSurfaces {
  totalAreaM2: number;
  coveredAreaM2: number;
  builtAreaM2: number;
  landAreaM2?: number;
  ownAreaM2?: number;
  balconyOrTerraceM2?: number;
}

export interface AppraisalLayout {
  bedrooms: number;
  rooms?: number;
  bathrooms: number;
  toilettes?: number;
  garages: number;
  floorsCount?: number;
  floorLevel?: number;
}

export interface AppraisalAmenities {
  balcony: boolean;
  terrace: boolean;
  patio: boolean;
  garden: boolean;
  barbecue: boolean;
  pool: boolean;
  elevator: boolean;
  concierge: boolean;
  security24h: boolean;
  heating: boolean;
  airConditioning: boolean;
  gym: boolean;
  seaFront: boolean;
  openView: boolean;
  storage: boolean;
}

export interface AppraisalPropertyInput {
  title?: string;
  propertyType: AppraisalPropertyType;
  subType?: string;
  horizontalProperty: boolean;
  operationType: 'SALE';
  location: AppraisalLocation;
  surfaces: AppraisalSurfaces;
  layout: AppraisalLayout;
  amenities: AppraisalAmenities;
  condition: BuildingCondition;
  constructionYear?: number;
  ageYears?: number;
  photos: AppraisalPhoto[];
  observations?: string;
}

export interface ComparableScoreFactor {
  factor: string;
  status: 'match' | 'partial' | 'miss' | 'penalty';
  label: string;
  detail: string;
  score: number;
  maxScore: number;
}

export interface ComparableCandidateData {
  id: string;
  propertyMasterId?: string;
  sourceListingId: string;
  sourceCode: string;
  sourceName: string;
  originalUrl?: string;
  title: string;
  propertyType: string;
  department: string;
  city: string;
  neighborhood: string;
  streetName?: string;
  latitude?: number | null;
  longitude?: number | null;
  builtAreaM2: number;
  totalAreaM2: number;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  constructionYear?: number;
  priceUsd: number;
  pricePerM2Usd: number;
  adjustedPriceUsd: number;
  askingPriceAdjustmentApplied: boolean;
  publicationDate?: string;
  daysSincePublication: number;
  dataQualityScore: number;
  comparableEligibility: 'ELIGIBLE' | 'PARTIAL';
  distanceMeters?: number | null;
  primaryPhotoUrl?: string;
}

export interface AppraisalComparableItem {
  id: string;
  appraisalId: string;
  propertyMasterId?: string;
  listingId?: string;
  similarityScore: number;
  scoreBreakdown: {
    locationScore: number;
    propertyTypeScore: number;
    surfaceScore: number;
    bedroomsScore: number;
    bathroomsScore: number;
    garageScore: number;
    ageScore: number;
    recencyScore: number;
    dataQualityScore: number;
    finalSimilarityScore: number;
    factors: ComparableScoreFactor[];
  };
  selected: boolean;
  status?: 'INCLUDED' | 'EXCLUDED';
  exclusionReason?: string | null;
  analystNote?: string | null;
  excludedAt?: string;
  rank: number;
  candidateData: ComparableCandidateData;
}

export interface AppraisalDescriptiveStats {
  selectedCount: number;
  totalCandidates: number;
  minPriceUsd: number;
  maxPriceUsd: number;
  medianPriceUsd: number;
  minPricePerM2Usd: number;
  maxPricePerM2Usd: number;
  medianPricePerM2Usd: number;
  dispersionPercentage: number;
  averageDistanceMeters: number;
  warnings: string[];
}

export interface AppraisalValuationRun {
  id: string;
  appraisalId: string;
  organizationId: string;
  runNumber: number;
  createdBy?: string | null;
  creatorEmail?: string | null;
  engineVersion: string;
  configurationVersion: number;
  targetPropertySnapshot: AppraisalPropertyInput;
  comparableSetSnapshot: AppraisalComparableItem[];
  comparablesUsedCount: number;
  excludedComparablesCount: number;
  estimatedMarketValue: number;
  estimatedPricePerM2Usd: number;
  valueRangeMin: number;
  valueRangeMax: number;
  confidenceLevel: 'ALTA' | 'MEDIA' | 'BAJA';
  methodEstimators: any[];
  favorableFactors: string[];
  considerationFactors: string[];
  warnings: string[];
  notes?: string | null;
  createdAt: string;
}

export interface AppraisalAuditLog {
  id: string;
  appraisalId: string;
  organizationId: string;
  userId?: string | null;
  userEmail?: string | null;
  eventType: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AppraisalReportMetadata {
  id: string;
  appraisalId: string;
  runId?: string | null;
  organizationId: string;
  version: number;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  fileHashSha256: string;
  brandingUsed?: {
    organizationName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  createdBy?: string | null;
  createdAt: string;
}

export interface AppraisalRecord {
  id: string;
  organizationId: string;
  createdBy?: string | null;
  creatorEmail?: string | null;
  status: AppraisalStatus;
  propertyInput: AppraisalPropertyInput;
  location: AppraisalLocation;
  selectedComparablesCount: number;
  setQuality: AppraisalSetQuality;
  descriptiveStats?: AppraisalDescriptiveStats;
  estimatedValue?: number | null;
  valuationData?: Record<string, any>;
  comparables?: AppraisalComparableItem[];
  currentRun?: AppraisalValuationRun;
  runs?: AppraisalValuationRun[];
  auditLogs?: AppraisalAuditLog[];
  reports?: AppraisalReportMetadata[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchComparablesFilterParams {
  radiusMeters?: number;
  surfaceTolerancePct?: number; // e.g. 20 for +/-20%
  exactBedrooms?: boolean;
  minQualityScore?: number;
  allowPartialEligibility?: boolean;
  maxListingAgeDays?: number;
}
