// ==============================================================================
// HIPOTECALY AI: Tasador IA - Fase0 Domain & Data Model Types
// Arquitectura y Modelo de Datos Inmobiliario Global (Separado de Expedientes)
// ==============================================================================

/**
 * Fuente / Portal inmobiliario registrado (Configuración Top 20)
 */
export interface PropertySource {
  id: string;
  code: string;
  name: string;
  domain: string;
  countryCode: string; // e.g. 'UY', 'AR', 'MX'
  isActive: boolean;
  crawlerConfig: {
    scraperType?: 'api' | 'html' | 'feed';
    selectors?: Record<string, string>;
    headers?: Record<string, string>;
    [key: string]: unknown;
  };
  rateLimitPerMinute: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Registro Maestro Canónico Deduplicado (Global Real Estate Entity)
 */
export interface PropertyMaster {
  id: string;
  canonicalAddress: string;
  normalizedAddress: string;
  department: string;
  city: string;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  propertyType: 'apartamento' | 'casa' | 'terreno' | 'local' | 'oficina' | 'chacra' | 'otros';
  coveredSurfaceM2?: number | null;
  uncoveredSurfaceM2?: number | null;
  totalSurfaceM2?: number | null;
  rooms?: number | null;
  bathrooms?: number | null;
  garages?: number | null;
  yearBuilt?: number | null;
  buildingCondition?: 'excelente' | 'bueno' | 'regular' | 'a_reciclar' | null;
  cadastralNumber?: string | null; // Padrón catastral
  dedupHash: string;
  dedupConfidence: number; // 0-100
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Anuncio u oferta de mercado por portal
 */
export interface PropertyListing {
  id: string;
  masterId?: string | null;
  sourceId: string;
  externalId: string;
  url: string;
  title: string;
  description?: string | null;
  priceAmount: number;
  currency: 'USD' | 'UYU';
  priceUsdNormalized: number;
  pricePerM2Usd?: number | null;
  publicationDate?: string | null;
  status: 'active' | 'inactive' | 'sold' | 'removed';
  rawData?: Record<string, unknown>;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Audit Log de Historial de Precios
 */
export interface PropertyPriceHistory {
  id: string;
  listingId?: string | null;
  masterId?: string | null;
  priceAmount: number;
  currency: string;
  priceUsdNormalized: number;
  pricePerM2Usd?: number | null;
  previousPriceUsd?: number | null;
  priceChangePercentage?: number | null;
  detectedAt: string;
  createdAt: string;
}

/**
 * Fotos con Hash para Deduplicación Visual
 */
export interface PropertyPhoto {
  id: string;
  listingId?: string | null;
  masterId?: string | null;
  url: string;
  phash?: string | null; // Perceptual image hash
  imageHash?: string | null; // Content/SHA hash
  isPrimary: boolean;
  displayOrder: number;
  caption?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Parámetros Versionados del Tasador IA (Fase0)
 */
export interface AppraisalSettings {
  id: string;
  version: number;
  isActive: boolean;
  /**
   * Margen de seguridad / liquidación rápida (%): 12.00% por defecto.
   * Preservado como parámetro configurable sin ejecutar valuaciones en Fase0.
   */
  safetyMarginPercentage: number;
  maxDedupDistanceMeters: number;
  similarityThreshold: number; // e.g. 85.0%
  minComparablesCount: number; // e.g. 3
  maxComparablesAgeDays: number; // e.g. 180 días
  outlierStdDevThreshold: number; // e.g. 2.0
  weights: {
    surface: number;
    location: number;
    rooms: number;
    age: number;
    [key: string]: number;
  };
  notes?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

/**
 * Criterios de deduplicación de propiedad
 */
export interface DeduplicationCriteria {
  address: string;
  department: string;
  cadastralNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coveredSurfaceM2?: number | null;
  rooms?: number | null;
}

/**
 * Resultado de evaluación de deduplicación
 */
export interface DeduplicationMatchResult {
  isMatch: boolean;
  matchConfidence: number; // 0 - 100
  matchedMasterId?: string | null;
  dedupHash: string;
  reason: string;
}
