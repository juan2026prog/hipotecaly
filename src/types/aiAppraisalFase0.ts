// ==============================================================================
// HIPOTECALY AI: Tasador IA - Fase0 Domain & Data Model Types (18 Entidades)
// Arquitectura Inmobiliaria Global, Deduplicación, Evidencia, Snapshots,
// CrawlerRuns, AIUsageEvents con organizationId y caseId, y Ajuste Asking Price (12%)
// ==============================================================================

export type LocationPrecision =
  | 'EXACT_ADDRESS'
  | 'APPROXIMATE_ADDRESS'
  | 'COORDINATES_EXACT'
  | 'COORDINATES_APPROXIMATE'
  | 'SUB_NEIGHBORHOOD'
  | 'NEIGHBORHOOD'
  | 'LOCALITY'
  | 'CITY'
  | 'DEPARTMENT'
  | 'UNKNOWN';

export type OperationType = 'SALE' | 'RENT' | 'TEMPORARY_RENT' | 'AUCTION' | 'UNKNOWN';

export type PropertyTypeEnum =
  | 'HOUSE'
  | 'APARTMENT'
  | 'LAND'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'WAREHOUSE'
  | 'RURAL'
  | 'GARAGE'
  | 'BUILDING'
  | 'INDUSTRIAL'
  | 'OTHER'
  | 'UNKNOWN';

export type ListingStatusEnum =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'REMOVED'
  | 'EXPIRED'
  | 'RELISTED'
  | 'UNKNOWN'
  | 'SOLD_OR_REMOVED_UNKNOWN'
  | 'POSSIBLE_SOLD'
  | 'CONFIRMED_SOLD';

export type PriceEventType =
  | 'FIRST_SEEN'
  | 'PRICE_CHANGED'
  | 'PRICE_CORRECTED'
  | 'CURRENCY_CHANGED'
  | 'OBSERVED'
  | 'UNKNOWN';

export type CandidateDecision = 'PENDING' | 'MATCH' | 'NO_MATCH' | 'UNCERTAIN';

export type MediaTypeEnum = 'IMAGE' | 'VIDEO' | 'FLOOR_PLAN' | 'DOCUMENT' | 'OTHER';

export type ValuationTypeEnum =
  | 'HIPOTECALY_AUTOMATED'
  | 'PROFESSIONAL'
  | 'MANUAL_INTERNAL'
  | 'EXTERNAL'
  | 'HISTORICAL_TRANSACTION';

/**
 * Fuente / Portal inmobiliario registrado (Configuración Top 20)
 */
export interface PropertySource {
  id: string;
  code: string;
  name: string;
  domain: string;
  countryCode: string;
  sourceType?: string;
  baseUrl?: string | null;
  isActive: boolean;
  enabled: boolean;
  ingestionEnabled: boolean; // Siempre false en Fase 0
  priority: number;
  trustLevel?: number | null;
  rateLimitPerMinute: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Registro de Sesiones de Crawler (Preparada pero sin ejecuciones en Fase 0)
 */
export interface CrawlerRun {
  id: string;
  sourceId: string;
  runType: 'SCHEDULED' | 'MANUAL' | 'ON_DEMAND';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt?: string | null;
  finishedAt?: string | null;
  listingsFound: number;
  listingsCreated: number;
  listingsUpdated: number;
  errorsCount: number;
  errorLog?: Record<string, unknown>[] | null;
  createdAt: string;
}

/**
 * Registro de Eventos de Consumo de IA (Preparada con organizationId y caseId para costeo futuro)
 */
export interface AIUsageEvent {
  id: string;
  organizationId?: string | null; // Id de la organización para costeo multi-tenant
  caseId?: string | null; // Id del expediente crediticio para costeo por caso
  valuationId?: string | null;
  propertyMasterId?: string | null;
  listingId?: string | null;
  eventType: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  executionTimeMs?: number | null;
  payloadSummary?: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Registro Maestro Canónico Deduplicado (Global Real Estate Entity)
 */
export interface PropertyMaster {
  id: string;
  canonicalAddress: string;
  normalizedAddress: string;
  countryCode: string;
  department: string;
  city: string;
  locality?: string | null;
  neighborhood?: string | null;
  subNeighborhood?: string | null;
  address?: string | null;
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
  propertyType: PropertyTypeEnum | string;
  totalAreaM2?: number | null;
  builtAreaM2?: number | null;
  landAreaM2?: number | null;
  internalAreaM2?: number | null;
  coveredSurfaceM2?: number | null;
  semiCoveredAreaM2?: number | null;
  uncoveredSurfaceM2?: number | null;
  terraceAreaM2?: number | null;
  balconyAreaM2?: number | null;
  gardenAreaM2?: number | null;
  garageAreaM2?: number | null;
  otherAreaM2?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  toilets?: number | null;
  garages?: number | null;
  parkingSpaces?: number | null;
  propertyFloor?: number | null;
  constructionYear?: number | null;
  approximateAge?: number | null;
  condition?: string | null;
  orientation?: string | null;
  disposition?: string | null;
  occupancyStatus?: string | null;
  furnished?: boolean | null;
  petsAllowed?: boolean | null;
  pool?: boolean | null;
  barbecue?: boolean | null;
  garden?: boolean | null;
  terrace?: boolean | null;
  balcony?: boolean | null;
  elevator?: boolean | null;
  doorman?: boolean | null;
  security?: boolean | null;
  heating?: boolean | null;
  airConditioning?: boolean | null;
  dedupHash: string;
  dedupConfidence: number;
  canonicalStatus: string;
  dataQualityScore?: number | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

/**
 * Anuncio u oferta de mercado por portal
 */
export interface PropertyListing {
  id: string;
  masterId?: string | null;
  sourceId: string;
  sourceListingId?: string | null;
  sourceListingKey?: string | null;
  originalUrl: string;
  canonicalUrl?: string | null;
  sourceAgencyName?: string | null;
  sourceAgentId?: string | null;
  titleRaw: string;
  titleNormalized: string;
  descriptionRaw?: string | null;
  descriptionNormalized?: string | null;
  operationType: OperationType;
  departmentRaw?: string | null;
  departmentNormalized?: string | null;
  cityRaw?: string | null;
  cityNormalized?: string | null;
  localityRaw?: string | null;
  localityNormalized?: string | null;
  neighborhoodRaw?: string | null;
  neighborhoodNormalized?: string | null;
  subNeighborhoodRaw?: string | null;
  subNeighborhoodNormalized?: string | null;
  addressRaw?: string | null;
  addressNormalized?: string | null;
  streetName?: string | null;
  streetNumber?: string | null;
  unit?: string | null;
  floor?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationPrecision: LocationPrecision;
  cadastralNumber?: string | null;
  currentPrice: number;
  currentCurrency: string;
  originalPrice?: number | null;
  originalCurrency?: string | null;
  priceUsd?: number | null;
  priceUyu?: number | null;
  pricePerM2?: number | null;
  expensesAmount?: number | null;
  expensesCurrency?: string | null;
  taxesAmount?: number | null;
  taxesCurrency?: string | null;
  priceTextRaw?: string | null;
  status: ListingStatusEnum;
  totalAreaM2?: number | null;
  builtAreaM2?: number | null;
  landAreaM2?: number | null;
  coveredAreaM2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  garages?: number | null;
  furnished?: boolean | null;
  pool?: boolean | null;
  barbecue?: boolean | null;
  elevator?: boolean | null;
  firstSeenAt: string;
  lastSeenAt: string;
  lastScrapedAt?: string | null;
  sourcePublishedAt?: string | null;
  sourceUpdatedAt?: string | null;
  removedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Log Inmutable Append-Only de Historial de Precios
 */
export interface PropertyPriceHistory {
  id: string;
  listingId?: string | null;
  masterId?: string | null;
  observedAt: string;
  price: number;
  currency: string;
  priceUsd?: number | null;
  priceUyu?: number | null;
  pricePerM2?: number | null;
  previousPriceUsd?: number | null;
  priceChangePercentage?: number | null;
  eventType: PriceEventType;
  sourceSnapshotId?: string | null;
  createdAt: string;
}

/**
 * Candidato de Duplicación (Inspección sin fusión destructiva automática)
 */
export interface PropertyDuplicateCandidate {
  id: string;
  propertyAId?: string | null;
  propertyBId?: string | null;
  listingAId?: string | null;
  listingBId?: string | null;
  matchScore?: number | null;
  addressScore?: number | null;
  geoScore?: number | null;
  photoScore?: number | null;
  priceScore?: number | null;
  areaScore?: number | null;
  bedroomsScore?: number | null;
  cadastralScore?: number | null;
  decision: CandidateDecision;
  decisionSource: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fotos y Medios de Publicaciones
 */
export interface PropertyMedia {
  id: string;
  listingId?: string | null;
  masterId?: string | null;
  mediaType: MediaTypeEnum;
  originalUrl: string;
  cachedUrl?: string | null;
  position: number;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
  mimeType?: string | null;
  sha256Hash?: string | null;
  perceptualHash?: string | null;
  sourceMediaId?: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
}

/**
 * Atributo Flexible de Publicación
 */
export interface PropertyListingAttribute {
  id: string;
  listingId: string;
  attributeKey: string;
  rawValue?: string | null;
  normalizedValue?: string | null;
  valueType: string;
  unit?: string | null;
  confidence?: number | null;
  sourceId?: string | null;
  createdAt: string;
}

/**
 * Evidencia Registrada por Campo
 */
export interface PropertyFieldEvidence {
  id: string;
  propertyMasterId?: string | null;
  listingId?: string | null;
  fieldName: string;
  rawValue?: string | null;
  normalizedValue?: string | null;
  sourceId?: string | null;
  evidenceType: string;
  confidence?: number | null;
  observedAt: string;
  createdAt: string;
}

/**
 * Snapshot Estructural de Publicación
 */
export interface PropertyListingSnapshot {
  id: string;
  listingId: string;
  capturedAt: string;
  contentHash?: string | null;
  structuredPayload: Record<string, unknown>;
  parserVersion?: string | null;
  createdAt: string;
}

/**
 * Estructura de Datos Catastrales Oficiales (Preparada sin conexión)
 */
export interface PropertyCadastralData {
  id: string;
  propertyMasterId?: string | null;
  cadastralNumber: string;
  department: string;
  locality?: string | null;
  horizontalPropertyUnit?: string | null;
  landAreaM2?: number | null;
  builtAreaM2?: number | null;
  officialAddress?: string | null;
  source: string;
  sourceUpdatedAt?: string | null;
  retrievedAt: string;
  rawPayload?: Record<string, unknown> | null;
}

/**
 * Estructura de Valuación (Preparada sin ejecuciones automáticas)
 */
export interface PropertyValuation {
  id: string;
  propertyMasterId?: string | null;
  applicationId?: string | null;
  valuationType: ValuationTypeEnum;
  valuationStatus: string;
  marketValue?: number | null;
  probableMinValue?: number | null;
  probableMaxValue?: number | null;
  conservativeValue?: number | null;
  currency: string;
  confidenceScore?: number | null;
  methodologyVersion?: string | null;
  settingsVersionId?: string | null;
  generatedBy?: string | null;
  professionalId?: string | null;
  valuationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyValuationVersion {
  id: string;
  valuationId: string;
  version: number;
  values: Record<string, unknown>;
  methodologyVersion?: string | null;
  settingsVersion?: string | null;
  reason?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface PropertyValuationComparable {
  id: string;
  valuationId: string;
  comparablePropertyId?: string | null;
  comparableListingId?: string | null;
  similarityScore?: number | null;
  distanceMeters?: number | null;
  selected: boolean;
  selectionReason?: string | null;
  sourcePrice?: number | null;
  adjustedPrice?: number | null;
  adjustmentDetails?: Record<string, unknown>;
  createdAt: string;
}

export interface PropertyAIFeature {
  id: string;
  propertyMasterId?: string | null;
  listingId?: string | null;
  mediaId?: string | null;
  featureName: string;
  value?: string | null;
  confidence?: number | null;
  model?: string | null;
  modelVersion?: string | null;
  evidence?: Record<string, unknown> | null;
  generatedAt?: string | null;
  createdAt: string;
}

export interface PropertyTransaction {
  id: string;
  propertyMasterId?: string | null;
  transactionType: string;
  transactionDate: string;
  transactionPrice: number;
  currency: string;
  evidenceType: string;
  evidenceReference?: string | null;
  confidence?: number | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parámetros Versionados del Tasador IA (Fase0)
 */
export interface AppraisalSettings {
  id: string;
  version: number;
  isActive: boolean;
  /**
   * Factor inicial configurable de diferencia entre precio publicado (asking price)
   * y precio real de venta/mercado (closing price). Default: 0.1200 (12.00%).
   */
  askingPriceAdjustment: number;
  safetyMarginPercentage?: number;
  maxDedupDistanceMeters: number;
  similarityThreshold: number;
  minComparablesCount: number;
  maxComparablesAgeDays: number;
  outlierStdDevThreshold: number;
  weights: {
    surface: number;
    location: number;
    rooms: number;
    age: number;
    [key: string]: number;
  };
  status?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface DeduplicationCriteria {
  address: string;
  department: string;
  cadastralNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coveredSurfaceM2?: number | null;
  bedrooms?: number | null;
}

export interface DeduplicationMatchResult {
  isMatch: boolean;
  matchConfidence: number;
  matchedMasterId?: string | null;
  dedupHash: string;
  reason: string;
}
