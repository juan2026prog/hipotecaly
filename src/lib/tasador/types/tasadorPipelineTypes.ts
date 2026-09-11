// ==============================================================================
// HIPOTECALY TASADOR IA - PIPELINE TYPES (FASE 1 + FASE 2)
// Ingesta Real, Normalización, Deduplicación Multi-Fuente, Data Quality,
// Snapshots, Medios, Historial de Precios y Lifecycle
// ==============================================================================

export type SourceCapability =
  | 'API_OFFICIAL'
  | 'PUBLIC_STRUCTURED_ENDPOINT'
  | 'PUBLIC_HTML'
  | 'MANUAL_IMPORT_ONLY'
  | 'REQUIRES_AUTHORIZATION'
  | 'BLOCKED'
  | 'NOT_SUPPORTED';

export type CrawlerRunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED'
  | 'RATE_LIMITED'
  | 'BLOCKED'
  | 'CANCELLED';

export type CrawlerRunType =
  | 'SCHEDULED'
  | 'MANUAL'
  | 'ON_DEMAND'
  | 'DISCOVERY'
  | 'REFRESH'
  | 'MEDIA_REFRESH'
  | 'HEALTHCHECK';

export type OperationType =
  | 'SALE'
  | 'RENT'
  | 'TEMPORARY_RENT'
  | 'AUCTION'
  | 'UNKNOWN';

export type PropertyTypeNormalized =
  | 'HOUSE'
  | 'APARTMENT'
  | 'LAND'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'WAREHOUSE'
  | 'RURAL'
  | 'GARAGE'
  | 'BUILDING'
  | 'PH'
  | 'OTHER'
  | 'UNKNOWN';

export type LocationPrecision =
  | 'EXACT'
  | 'STREET'
  | 'BLOCK'
  | 'NEIGHBORHOOD'
  | 'LOCALITY'
  | 'CITY'
  | 'DEPARTMENT'
  | 'APPROXIMATE'
  | 'UNKNOWN';

export type ListingStatus =
  | 'ACTIVE'
  | 'MISSING_TEMPORARILY'
  | 'SOLD_OR_REMOVED_UNKNOWN'
  | 'CONFIRMED_SOLD'
  | 'INACTIVE'
  | 'UNKNOWN';

export type PriceEventType =
  | 'FIRST_SEEN'
  | 'PRICE_CHANGED'
  | 'PRICE_CORRECTED'
  | 'CURRENCY_CHANGED'
  | 'OBSERVED';

export type MediaType = 'IMAGE' | 'VIDEO' | 'FLOOR_PLAN' | 'DOCUMENT' | 'OTHER';

export type CandidateConfidenceLevel =
  | 'VERY_HIGH_CONFIDENCE'
  | 'HIGH_CONFIDENCE'
  | 'REVIEW'
  | 'LOW_CONFIDENCE';

export type CandidateDecision = 'PENDING' | 'MATCH' | 'NO_MATCH' | 'UNCERTAIN';

export type QualityWarningCode =
  | 'MISSING_AREA'
  | 'MISSING_LOCATION'
  | 'AMBIGUOUS_PRICE'
  | 'AREA_INCONSISTENCY'
  | 'CURRENCY_UNKNOWN'
  | 'LOCATION_APPROXIMATE'
  | 'POSSIBLE_DUPLICATE'
  | 'OUTLIER_VALUE'
  | 'COORDINATES_OUT_OF_BOUNDS'
  | 'NEGATIVE_ROOMS_OR_BATHS';

export interface RawMediaItem {
  sourceUrl: string;
  normalizedUrl?: string;
  mediaType: MediaType;
  position: number;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  sha256Hash?: string | null;
  perceptualHash?: string | null;
}

export interface RawListingPayload {
  sourceCode: string;
  sourceListingId: string;
  sourceListingKey?: string | null;
  originalUrl: string;
  canonicalUrl?: string | null;
  titleRaw: string;
  descriptionRaw?: string | null;
  priceTextRaw?: string | null;
  currentPriceRaw?: number | null;
  currencyRaw?: string | null;
  expensesRaw?: number | null;
  expensesCurrencyRaw?: string | null;
  taxesRaw?: number | null;
  departmentRaw?: string | null;
  cityRaw?: string | null;
  localityRaw?: string | null;
  neighborhoodRaw?: string | null;
  subNeighborhoodRaw?: string | null;
  addressRaw?: string | null;
  streetNameRaw?: string | null;
  streetNumberRaw?: string | null;
  unitRaw?: string | null;
  floorRaw?: string | null;
  postalCodeRaw?: string | null;
  latitudeRaw?: number | null;
  longitudeRaw?: number | null;
  cadastralNumberRaw?: string | null;
  propertyTypeRaw?: string | null;
  operationTypeRaw?: string | null;
  totalAreaM2Raw?: number | null;
  builtAreaM2Raw?: number | null;
  landAreaM2Raw?: number | null;
  bedroomsRaw?: number | null;
  bathroomsRaw?: number | null;
  toiletsRaw?: number | null;
  garagesRaw?: number | null;
  parkingSpacesRaw?: number | null;
  constructionYearRaw?: number | null;
  conditionRaw?: string | null;
  orientationRaw?: string | null;
  agencyNameRaw?: string | null;
  agentNameRaw?: string | null;
  agentIdRaw?: string | null;
  agentPhoneRaw?: string | null;
  amenitiesRaw?: Record<string, boolean | string | number> | null;
  mediaRaw?: RawMediaItem[];
  sourcePublishedAt?: string | null;
  sourceUpdatedAt?: string | null;
  rawJson?: Record<string, unknown>;
  contentHash?: string;
}

export interface NormalizedField<T> {
  rawValue: unknown;
  normalizedValue: T;
  method: string;
  confidence: number; // 0 - 100
  source: string;
}

export interface NormalizedListing {
  sourceCode: string;
  sourceListingId: string;
  sourceListingKey?: string | null;
  propertyMasterId?: string | null;
  originalUrl: string;
  canonicalUrl?: string | null;
  title?: string | null;
  titleNormalized: string;
  descriptionNormalized?: string | null;
  publicationDate?: string | null;
  dataQualityScore?: number | null;
  operationType: OperationType;
  propertyType: PropertyTypeNormalized;
  country: string;
  countryCode: string;
  department: string;
  city?: string | null;
  locality?: string | null;
  neighborhood?: string | null;
  subNeighborhood?: string | null;
  normalizedAddress: string;
  streetName?: string | null;
  streetNumber?: string | null;
  unit?: string | null;
  floor?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationPrecision: LocationPrecision;
  cadastralNumber?: string | null;
  horizontalPropertyUnit?: string | null;
  currentPrice: number;
  currentCurrency: string;
  priceUsd: number;
  priceUyu?: number | null;
  pricePerM2Usd?: number | null;
  expensesAmount?: number | null;
  expensesCurrency?: string | null;
  taxesAmount?: number | null;
  totalAreaM2?: number | null;
  builtAreaM2?: number | null;
  landAreaM2?: number | null;
  internalAreaM2?: number | null;
  coveredAreaM2?: number | null;
  semiCoveredAreaM2?: number | null;
  uncoveredAreaM2?: number | null;
  terraceAreaM2?: number | null;
  balconyAreaM2?: number | null;
  gardenAreaM2?: number | null;
  garageAreaM2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  toilets?: number | null;
  garages?: number | null;
  parkingSpaces?: number | null;
  propertyFloor?: number | null;
  totalFloors?: number | null;
  constructionYear?: number | null;
  approximateAge?: number | null;
  condition?: string | null;
  orientation?: string | null;
  disposition?: string | null;
  occupancyStatus?: string | null;
  agencyName?: string | null;
  agentName?: string | null;
  agentId?: string | null;
  agentPhone?: string | null;
  amenities: {
    pool?: boolean | null;
    barbecue?: boolean | null;
    garden?: boolean | null;
    patio?: boolean | null;
    terrace?: boolean | null;
    balcony?: boolean | null;
    elevator?: boolean | null;
    security?: boolean | null;
    doorman?: boolean | null;
    heating?: boolean | null;
    airConditioning?: boolean | null;
    fireplace?: boolean | null;
    laundry?: boolean | null;
    storage?: boolean | null;
    gym?: boolean | null;
    eventRoom?: boolean | null;
    seaView?: boolean | null;
    waterfront?: boolean | null;
    petFriendly?: boolean | null;
    furnished?: boolean | null;
    coveredParking?: boolean | null;
    solarPanels?: boolean | null;
    underfloorHeating?: boolean | null;
  };
  media: RawMediaItem[];
  fieldEvidence: Record<string, NormalizedField<unknown>>;
  sourcePublishedAt?: string | null;
  sourceUpdatedAt?: string | null;
  rawPayload: RawListingPayload;
}

export interface DedupScoreBreakdown {
  totalScore: number; // 0 - 100
  cadastralScore: number;
  addressScore: number;
  geoScore: number;
  photoScore: number;
  priceScore: number;
  areaScore: number;
  bedroomsScore: number;
  textScore: number;
  confidenceLevel: CandidateConfidenceLevel;
  matchReasons: string[];
  evidenceDetails: Record<string, unknown>;
}

export interface DataQualityReport {
  qualityScore: number; // 0 - 100
  warnings: QualityWarningCode[];
  completeness: {
    location: number; // 0 - 100
    surfaces: number; // 0 - 100
    price: number; // 0 - 100
    specs: number; // 0 - 100
    media: number; // 0 - 100
  };
  isOutlier: boolean;
  outlierReasons: string[];
}

export interface HealthCheckResult {
  sourceCode: string;
  healthy: boolean;
  status: number | string;
  responseTimeMs: number;
  capability: SourceCapability;
  message: string;
  testedAt: string;
}

export interface IngestionRunResult {
  runId: string;
  sourceCode: string;
  runType: CrawlerRunType;
  status: CrawlerRunStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  pagesRequested: number;
  listingsDiscovered: number;
  listingsNew: number;
  listingsUpdated: number;
  listingsUnchanged: number;
  listingsRemovedOrUnknown: number;
  mediaDiscovered: number;
  priceEventsCreated: number;
  duplicateCandidatesFound: number;
  propertyMastersResolved: number;
  errorsCount: number;
  rateLimitEvents: number;
  httpStatusSummary: Record<string, number>;
  parserVersion: string;
  errorSummary?: string | null;
  metadata?: Record<string, unknown>;
}
