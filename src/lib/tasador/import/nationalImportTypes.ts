// ==============================================================================
// HIPOTECALY TASADOR IA - TIPOS DE IMPORTACIÓN DE BASE INMOBILIARIA NACIONAL (BLOQUE 3)
// Esquema Canónico, Staging Seguro, Validación, Lotes y Trazabilidad Rollback
// ==============================================================================

import { LocationPrecision, PropertyTypeNormalized } from '../types/tasadorPipelineTypes';

export type ImportBatchStatus =
  | 'STAGED'            // Lote cargado en staging, pendiente de validación
  | 'VALIDATING'        // Validando y normalizando registros
  | 'VALIDATED'         // Validación completada, listo para preview / commit
  | 'COMMITTING'        // Integrando a Property Master y Listings
  | 'COMMITTED'         // Integración completada exitosamente
  | 'ROLLED_BACK'       // Revertido por Super Admin (trazabilidad auditada)
  | 'REJECTED';         // Rechazado por inconsistencias graves

export type ImportRecordStatus =
  | 'PENDING'           // En staging inicial
  | 'VALID'             // Cumple esquema canónico y reglas geográficas
  | 'INVALID'           // Errores de tipología, precio, coordenadas o superficies
  | 'DUPLICATE_EXACT'   // Match exacto con listing ya existente (idempotente)
  | 'MATCHED_MASTER'    // Se asocia a un Property Master existente sin crear uno nuevo
  | 'POSSIBLE_DUPLICATE'// Duda de duplicación (no fusionar automáticamente)
  | 'COMMITTED'         // Insertado en base productiva
  | 'REJECTED';         // Rechazado

export interface CanonicalImportPayload {
  sourceCode: string;               // ej. "caldeiro_uy", "canepa_uy", "inmobiliaria_sur"
  sourceName?: string;
  sourceListingId: string;
  sourceUrl?: string | null;
  operationType: 'SALE' | 'RENT';
  propertyType: PropertyTypeNormalized;
  
  // Ubicación Uruguay
  department: string;
  city?: string | null;
  neighborhood?: string | null;
  subNeighborhood?: string | null;
  addressRaw?: string | null;
  streetName?: string | null;
  streetNumber?: string | null;
  unit?: string | null;
  floor?: string | null;
  cadastralNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationPrecision?: LocationPrecision;

  // Precios y Monedas
  priceAmount: number;
  currency: 'USD' | 'UYU';
  expensesAmount?: number | null;
  expensesCurrency?: string | null;

  // Metrajes
  totalAreaM2?: number | null;
  builtAreaM2?: number | null;
  landAreaM2?: number | null;

  // Distribución
  bedrooms?: number | null;
  bathrooms?: number | null;
  garages?: number | null;
  constructionYear?: number | null;
  buildingCondition?: string | null;

  // Contenido y Medios
  title: string;
  description?: string | null;
  mediaUrls?: string[];
  amenities?: Record<string, boolean | null>;
  
  // Trazabilidad
  capturedAt?: string;
  parserVersion?: string;
  rawReference?: Record<string, unknown>;
}

export interface ImportValidationIssue {
  field: string;
  code:
    | 'MISSING_PRICE'
    | 'MISSING_AREA'
    | 'MISSING_LOCATION'
    | 'INVALID_COORDINATES'
    | 'UNSUPPORTED_PROPERTY_TYPE'
    | 'INVALID_CURRENCY'
    | 'NEGATIVE_VALUE'
    | 'POSSIBLE_CROSS_SOURCE_DUPLICATE';
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface StagedImportRecord {
  id: string;
  batchId: string;
  rowNumber: number;
  rawJson: Record<string, unknown>;
  canonicalPayload?: CanonicalImportPayload | null;
  status: ImportRecordStatus;
  validationIssues: ImportValidationIssue[];
  matchedPropertyMasterId?: string | null;
  isPossibleDuplicate: boolean;
  duplicateNotes?: string | null;
  dataQualityScore: number;
  comparableEligibility: 'ELIGIBLE' | 'PARTIAL' | 'EXCLUDED';
  createdAt: string;
}

export interface ImportBatchSummary {
  batchId: string;
  datasetName: string;
  sourceType: 'CSV' | 'JSON' | 'AUDITED_RESEARCH_DATASET';
  sourceCode: string;
  sourceAgencyName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  exactDuplicates: number;
  possibleDuplicates: number;
  newMastersProjected: number;
  matchedMastersProjected: number;
  status: ImportBatchStatus;
  importedByUserId: string;
  importedAt: string;
  committedAt?: string | null;
  validationReport: {
    missingPriceCount: number;
    missingAreaCount: number;
    missingLocationCount: number;
    invalidCoordinatesCount: number;
    unsupportedTypeCount: number;
  };
}

export interface ImportPreviewResult {
  batch: ImportBatchSummary;
  sampleRecords: StagedImportRecord[];
  conflicts: Array<{
    rowNumber: number;
    title: string;
    reason: string;
    existingMasterId?: string;
  }>;
}
