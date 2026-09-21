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
  totalAreaM2?: number;
  coveredAreaM2?: number;
  builtAreaM2?: number;
  landAreaM2?: number;
  ownAreaM2?: number;
  balconyOrTerraceM2?: number;
}

export interface AppraisalLayout {
  bedrooms?: number;
  rooms?: number;
  bathrooms?: number;
  toilettes?: number;
  garages?: number;
  floorsCount?: number;
  floorLevel?: number;
}

export type AppraisalAmenities = Partial<Record<
  | 'balcony'
  | 'terrace'
  | 'patio'
  | 'garden'
  | 'barbecue'
  | 'pool'
  | 'elevator'
  | 'concierge'
  | 'security24h'
  | 'heating'
  | 'airConditioning'
  | 'gym'
  | 'seaFront'
  | 'openView'
  | 'storage',
  boolean
>> & Record<string, boolean | undefined>;

export interface AppraisalPropertyInput {
  title?: string;
  propertyType: AppraisalPropertyType;
  subType?: string;
  horizontalProperty?: boolean;
  operationType: 'SALE';
  location: AppraisalLocation;
  surfaces: AppraisalSurfaces;
  layout: AppraisalLayout;
  amenities: AppraisalAmenities;
  condition?: BuildingCondition;
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

export interface BuildAppraisalTargetPropertyParams {
  propertyType: AppraisalPropertyType;
  subType?: string;
  horizontalProperty?: boolean;
  location: AppraisalLocation;
  totalAreaM2?: number | '';
  builtAreaM2?: number | '';
  coveredAreaM2?: number | '';
  landAreaM2?: number | '';
  balconyOrTerraceM2?: number | '';
  bedrooms?: number | '';
  bathrooms?: number | '';
  toilettes?: number | '';
  garages?: number | '';
  floorLevel?: number | '';
  amenities?: Record<string, boolean | undefined>;
  condition?: BuildingCondition | '';
  constructionYear?: number | '';
  photos?: AppraisalPhoto[];
  observations?: string;
}

/**
 * Pure builder function for AppraisalPropertyInput enforcing ZERO HIDDEN DEFAULTS
 * and ZERO INFERRED SURFACES (UNKNOWN != INFERRED).
 */
export function buildAppraisalTargetProperty(
  params: BuildAppraisalTargetPropertyParams
): AppraisalPropertyInput {
  const {
    propertyType,
    subType,
    horizontalProperty,
    location,
    totalAreaM2,
    builtAreaM2,
    coveredAreaM2,
    landAreaM2,
    balconyOrTerraceM2,
    bedrooms,
    bathrooms,
    toilettes,
    garages,
    floorLevel,
    amenities = {},
    condition,
    constructionYear,
    photos = [],
    observations,
  } = params;

  return {
    title: `${propertyType.toUpperCase()}${
      location.neighborhood || location.city || location.department
        ? ` en ${location.neighborhood || location.city || location.department}`
        : ''
    }`,
    propertyType,
    subType: subType || undefined,
    horizontalProperty: horizontalProperty !== undefined ? horizontalProperty : undefined,
    operationType: 'SALE',
    location: {
      country: location.country || 'Uruguay',
      department: location.department,
      city: location.city || location.department,
      neighborhood: location.neighborhood,
      streetName: location.streetName,
      streetNumber: location.streetNumber,
      unitOrApt: location.unitOrApt || undefined,
      floor: location.floor || undefined,
      cadastralNumber: location.cadastralNumber || undefined,
      latitude: location.latitude,
      longitude: location.longitude,
      isGeocodedExact: Boolean(location.isGeocodedExact),
    },
    surfaces: {
      totalAreaM2: typeof totalAreaM2 === 'number' && !isNaN(totalAreaM2) ? totalAreaM2 : undefined,
      builtAreaM2: typeof builtAreaM2 === 'number' && !isNaN(builtAreaM2) ? builtAreaM2 : undefined,
      coveredAreaM2: typeof coveredAreaM2 === 'number' && !isNaN(coveredAreaM2) ? coveredAreaM2 : undefined,
      landAreaM2: typeof landAreaM2 === 'number' && !isNaN(landAreaM2) ? landAreaM2 : undefined,
      balconyOrTerraceM2:
        typeof balconyOrTerraceM2 === 'number' && !isNaN(balconyOrTerraceM2) ? balconyOrTerraceM2 : undefined,
    },
    layout: {
      bedrooms: typeof bedrooms === 'number' && !isNaN(bedrooms) ? bedrooms : undefined,
      bathrooms: typeof bathrooms === 'number' && !isNaN(bathrooms) ? bathrooms : undefined,
      toilettes: typeof toilettes === 'number' && !isNaN(toilettes) ? toilettes : undefined,
      garages: typeof garages === 'number' && !isNaN(garages) ? garages : undefined,
      floorLevel: typeof floorLevel === 'number' && !isNaN(floorLevel) ? floorLevel : undefined,
    },
    amenities: Object.keys(amenities).length > 0 ? amenities : {},
    condition: condition ? condition : undefined,
    constructionYear:
      typeof constructionYear === 'number' && !isNaN(constructionYear) ? constructionYear : undefined,
    photos,
    observations: observations || undefined,
  };
}
