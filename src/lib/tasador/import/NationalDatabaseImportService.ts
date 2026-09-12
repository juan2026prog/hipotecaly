// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE IMPORTACIÓN Y STAGING DE BASE NACIONAL (BLOQUE 3)
// Staging Seguro -> Validación -> Normalización -> Dedup -> Property Master -> Listings
// Reglas de Integridad: NULL != NULL, Sin Automerge Débil, Trazabilidad por Batch
// ==============================================================================

import {
  CanonicalImportPayload,
  ImportBatchStatus,
  ImportBatchSummary,
  ImportPreviewResult,
  ImportRecordStatus,
  ImportValidationIssue,
  StagedImportRecord,
} from './nationalImportTypes';
import { PropertyMasterResolver } from '../master/PropertyMasterResolver';
import { NormalizationEngine } from '../normalization/NormalizationEngine';
import { RawListingPayload } from '../types/tasadorPipelineTypes';
import { IngestionEngine } from '../crawler/IngestionEngine';

export class NationalDatabaseImportService {
  private static instance: NationalDatabaseImportService;

  public batches: Map<string, ImportBatchSummary> = new Map();
  public stagedRecords: Map<string, StagedImportRecord[]> = new Map();

  private constructor() {}

  public static getInstance(): NationalDatabaseImportService {
    if (!NationalDatabaseImportService.instance) {
      NationalDatabaseImportService.instance = new NationalDatabaseImportService();
    }
    return NationalDatabaseImportService.instance;
  }

  /**
   * 1. Carga un dataset en STAGING (CSV / JSON) sin tocar la base productiva
   */
  public stageDataset(params: {
    datasetName: string;
    sourceCode: string;
    sourceAgencyName: string;
    sourceType: 'CSV' | 'JSON' | 'AUDITED_RESEARCH_DATASET';
    records: Array<Record<string, unknown>>;
    userId: string;
  }): ImportBatchSummary {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const stagedList: StagedImportRecord[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let missingPrice = 0;
    let missingArea = 0;
    let missingLoc = 0;
    let invalidCoords = 0;
    let unsupportedTypes = 0;
    let exactDups = 0;
    let possibleDups = 0;
    let newMasters = 0;
    let matchedMasters = 0;

    const masterResolver = PropertyMasterResolver.getInstance();

    for (let idx = 0; idx < params.records.length; idx++) {
      const row = params.records[idx];
      const rowNum = idx + 1;
      const issues: ImportValidationIssue[] = [];

      // Mapeo seguro a CanonicalImportPayload
      const canonical = this.parseToCanonical(row, params.sourceCode, params.sourceAgencyName, issues);

      let recordStatus: ImportRecordStatus = 'PENDING';
      let matchedMasterId: string | null = null;
      let isPossibleDup = false;
      let dupNotes: string | null = null;
      let qualityScore = 0;
      let eligibility: 'ELIGIBLE' | 'PARTIAL' | 'EXCLUDED' = 'EXCLUDED';

      if (canonical && issues.filter((i) => i.severity === 'ERROR').length === 0) {
        recordStatus = 'VALID';
        validCount++;

        // Normalización y Chequeo de Deduplicación contra la Base Inmobiliaria existente
        const rawPayload: RawListingPayload = {
          sourceCode: canonical.sourceCode,
          sourceListingId: canonical.sourceListingId,
          sourceListingKey: `${canonical.sourceCode}_${canonical.sourceListingId}`,
          originalUrl: canonical.sourceUrl || '',
          titleRaw: canonical.title,
          descriptionRaw: canonical.description,
          departmentRaw: canonical.department,
          neighborhoodRaw: canonical.neighborhood,
          addressRaw: canonical.addressRaw,
          cadastralNumberRaw: canonical.cadastralNumber,
          priceTextRaw: `${canonical.priceAmount}`,
          currentPriceRaw: canonical.priceAmount,
          currencyRaw: canonical.currency,
          builtAreaM2Raw: canonical.builtAreaM2,
          totalAreaM2Raw: canonical.totalAreaM2,
          bedroomsRaw: canonical.bedrooms,
          bathroomsRaw: canonical.bathrooms,
          garagesRaw: canonical.garages,
          propertyTypeRaw: canonical.propertyType,
          operationTypeRaw: canonical.operationType,
          latitudeRaw: canonical.latitude,
          longitudeRaw: canonical.longitude,
        };

        const normalized = NormalizationEngine.normalize(rawPayload);
        qualityScore = normalized.dataQualityScore ?? 0;
        eligibility = ((normalized as any).comparableEligibility ?? 'ELIGIBLE') as 'ELIGIBLE' | 'PARTIAL' | 'EXCLUDED';

        // Evaluar coincidencia con Property Masters existentes
        const uniqueListingKey = normalized.sourceListingKey || normalized.sourceListingId;
        const dedupHash = masterResolver.calculateDedupHash(
          normalized.normalizedAddress,
          normalized.department,
          normalized.cadastralNumber,
          {
            streetName: normalized.streetName,
            streetNumber: normalized.streetNumber,
            unit: normalized.unit,
            propertyType: normalized.propertyType,
            uniqueKey: uniqueListingKey,
          }
        );

        const existingMaster = Array.from(masterResolver.masters.values()).find(
          (m) =>
            (dedupHash && m.dedupHash === dedupHash) ||
            (normalized.cadastralNumber && m.cadastralNumber === normalized.cadastralNumber)
        );

        if (existingMaster) {
          // Si el hash o padrón coincide con alta certeza -> MATCHED_MASTER
          if (existingMaster.listingIds.includes(uniqueListingKey)) {
            recordStatus = 'DUPLICATE_EXACT';
            exactDups++;
          } else {
            recordStatus = 'MATCHED_MASTER';
            matchedMasterId = existingMaster.id;
            matchedMasters++;
          }
        } else {
          // Chequeo de duda de duplicación sin datos concluyentes (Regla NULL != NULL)
          // Comprobar tanto contra masters existentes como contra otros registros previos del mismo lote (in-batch)
          const doubtfulMatchExisting = Array.from(masterResolver.masters.values()).find(
            (m) =>
              m.department.toLowerCase() === normalized.department.toLowerCase() &&
              m.neighborhood?.toLowerCase() === normalized.neighborhood?.toLowerCase() &&
              m.propertyType === normalized.propertyType &&
              m.builtAreaM2 &&
              normalized.builtAreaM2 &&
              Math.abs(m.builtAreaM2 - normalized.builtAreaM2) <= 2 &&
              !normalized.streetNumber &&
              !m.streetNumber
          );

          const doubtfulMatchInBatch = stagedList.find(
            (prev) =>
              prev.canonicalPayload &&
              prev.canonicalPayload.department.toLowerCase() === normalized.department.toLowerCase() &&
              prev.canonicalPayload.neighborhood?.toLowerCase() === normalized.neighborhood?.toLowerCase() &&
              prev.canonicalPayload.propertyType === normalized.propertyType &&
              prev.canonicalPayload.builtAreaM2 &&
              normalized.builtAreaM2 &&
              Math.abs(prev.canonicalPayload.builtAreaM2 - normalized.builtAreaM2) <= 2 &&
              !normalized.streetNumber &&
              !prev.canonicalPayload.streetNumber
          );

          const doubtfulMatch = doubtfulMatchExisting || doubtfulMatchInBatch;

          if (doubtfulMatch) {
            isPossibleDup = true;
            possibleDups++;
            recordStatus = 'POSSIBLE_DUPLICATE';
            dupNotes = `Similitud morfológica en ${normalized.neighborhood}, pero sin dirección exacta ni padrón verificado (Regla NULL != NULL).`;
            issues.push({
              field: 'address',
              code: 'POSSIBLE_CROSS_SOURCE_DUPLICATE',
              message: dupNotes,
              severity: 'WARNING',
            });
            newMasters++; // Mantiene master independiente de forma conservadora
          } else {
            newMasters++;
          }
        }
      } else {
        recordStatus = 'INVALID';
        invalidCount++;
      }

      // Conteo de errores específicos
      for (const issue of issues) {
        if (issue.code === 'MISSING_PRICE') missingPrice++;
        if (issue.code === 'MISSING_AREA') missingArea++;
        if (issue.code === 'MISSING_LOCATION') missingLoc++;
        if (issue.code === 'INVALID_COORDINATES') invalidCoords++;
        if (issue.code === 'UNSUPPORTED_PROPERTY_TYPE') unsupportedTypes++;
      }

      const stagedRec: StagedImportRecord = {
        id: `stg_${batchId}_${rowNum}`,
        batchId,
        rowNumber: rowNum,
        rawJson: row,
        canonicalPayload: canonical,
        status: recordStatus,
        validationIssues: issues,
        matchedPropertyMasterId: matchedMasterId,
        isPossibleDuplicate: isPossibleDup,
        duplicateNotes: dupNotes,
        dataQualityScore: qualityScore,
        comparableEligibility: eligibility,
        createdAt: now,
      };

      stagedList.push(stagedRec);
    }

    const summary: ImportBatchSummary = {
      batchId,
      datasetName: params.datasetName,
      sourceType: params.sourceType,
      sourceCode: params.sourceCode,
      sourceAgencyName: params.sourceAgencyName,
      totalRows: params.records.length,
      validRows: validCount,
      invalidRows: invalidCount,
      exactDuplicates: exactDups,
      possibleDuplicates: possibleDups,
      newMastersProjected: newMasters,
      matchedMastersProjected: matchedMasters,
      status: 'VALIDATED',
      importedByUserId: params.userId,
      importedAt: now,
      validationReport: {
        missingPriceCount: missingPrice,
        missingAreaCount: missingArea,
        missingLocationCount: missingLoc,
        invalidCoordinatesCount: invalidCoords,
        unsupportedTypeCount: unsupportedTypes,
      },
    };

    this.batches.set(batchId, summary);
    this.stagedRecords.set(batchId, stagedList);

    return summary;
  }

  /**
   * 2. Previsualización detallada para aprobación de Super Admin
   */
  public previewBatch(batchId: string): ImportPreviewResult {
    const batch = this.batches.get(batchId);
    if (!batch) throw new Error(`Batch no encontrado: ${batchId}`);

    const records = this.stagedRecords.get(batchId) || [];
    const conflicts = records
      .filter((r) => r.isPossibleDuplicate || r.status === 'INVALID')
      .slice(0, 20)
      .map((r) => ({
        rowNumber: r.rowNumber,
        title: r.canonicalPayload?.title || `Fila ${r.rowNumber}`,
        reason: r.duplicateNotes || r.validationIssues.map((i) => i.message).join(' | '),
        existingMasterId: r.matchedPropertyMasterId || undefined,
      }));

    return {
      batch,
      sampleRecords: records.slice(0, 15),
      conflicts,
    };
  }

  /**
   * 3. Commit Server-Side: Inserta los registros válidos al pipeline oficial
   * EXCLUSIVO SUPER ADMIN
   */
  public commitBatch(batchId: string, superAdminUserId: string): {
    committedListings: number;
    resolvedMasters: number;
    status: ImportBatchStatus;
  } {
    const batch = this.batches.get(batchId);
    if (!batch) throw new Error(`Batch no encontrado: ${batchId}`);
    if (batch.status === 'COMMITTED') throw new Error(`El batch ${batchId} ya fue comprometido.`);

    const records = this.stagedRecords.get(batchId) || [];
    const validRecords = records.filter(
      (r) => r.status === 'VALID' || r.status === 'MATCHED_MASTER' || r.status === 'POSSIBLE_DUPLICATE'
    );

    const ingestionEngine = IngestionEngine.getInstance();
    let listingsCount = 0;
    let mastersCount = 0;

    for (const stg of validRecords) {
      if (!stg.canonicalPayload) continue;

      const c = stg.canonicalPayload;
      const rawPayload: RawListingPayload = {
        sourceCode: c.sourceCode,
        sourceListingId: c.sourceListingId,
        sourceListingKey: `${c.sourceCode}_${c.sourceListingId}`,
        originalUrl: c.sourceUrl || '',
        titleRaw: c.title,
        descriptionRaw: c.description,
        departmentRaw: c.department,
        cityRaw: c.city,
        neighborhoodRaw: c.neighborhood,
        addressRaw: c.addressRaw,
        streetNameRaw: c.streetName,
        streetNumberRaw: c.streetNumber,
        unitRaw: c.unit,
        floorRaw: c.floor,
        cadastralNumberRaw: c.cadastralNumber,
        priceTextRaw: `${c.priceAmount}`,
        currentPriceRaw: c.priceAmount,
        currencyRaw: c.currency,
        builtAreaM2Raw: c.builtAreaM2,
        totalAreaM2Raw: c.totalAreaM2,
        landAreaM2Raw: c.landAreaM2,
        bedroomsRaw: c.bedrooms,
        bathroomsRaw: c.bathrooms,
        garagesRaw: c.garages,
        constructionYearRaw: c.constructionYear,
        conditionRaw: c.buildingCondition,
        propertyTypeRaw: c.propertyType,
        operationTypeRaw: c.operationType,
        latitudeRaw: c.latitude,
        longitudeRaw: c.longitude,
      };

      // Ingestión oficial determinística
      const normalized = NormalizationEngine.normalize(rawPayload);
      (normalized as any).importBatchId = batchId; // Trazabilidad inmutable por lote
      (normalized as any).importedBy = superAdminUserId;

      const listingKey = normalized.sourceListingKey || normalized.sourceListingId;
      ingestionEngine.normalizedListings.set(listingKey, normalized);
      const res = ingestionEngine.masterResolver.resolveMaster(normalized);
      stg.status = 'COMMITTED';
      stg.matchedPropertyMasterId = res.master.id;

      listingsCount++;
      if (res.isNew) mastersCount++;
    }

    batch.status = 'COMMITTED';
    batch.committedAt = new Date().toISOString();

    return {
      committedListings: listingsCount,
      resolvedMasters: mastersCount,
      status: 'COMMITTED',
    };
  }

  /**
   * Helper para sanitizar y mapear filas a CanonicalImportPayload
   */
  private parseToCanonical(
    row: Record<string, unknown>,
    defaultSource: string,
    _agencyName: string,
    issues: ImportValidationIssue[]
  ): CanonicalImportPayload | null {
    const title = String(row.title || row.titulo || row.name || 'Propiedad sin título').trim();
    const sourceListingId = String(row.source_listing_id || row.id || row.codigo || Date.now());
    const sourceCode = String(row.source_code || row.source || defaultSource).trim().toLowerCase();

    // Precios
    const priceAmount = Number(row.price || row.precio || row.price_usd || row.price_amount || 0);
    if (!priceAmount || priceAmount <= 0) {
      issues.push({ field: 'price', code: 'MISSING_PRICE', message: 'Precio monetario ausente o menor a cero.', severity: 'ERROR' });
    }

    const currencyRaw = String(row.currency || row.moneda || 'USD').toUpperCase();
    const currency: 'USD' | 'UYU' = currencyRaw.includes('UY') || currencyRaw.includes('$') && !currencyRaw.includes('U$S') ? 'UYU' : 'USD';

    // Ubicación
    const department = String(row.department || row.departamento || 'Montevideo').trim();
    const neighborhood = row.neighborhood || row.barrio ? String(row.neighborhood || row.barrio).trim() : null;
    if (!department) {
      issues.push({ field: 'department', code: 'MISSING_LOCATION', message: 'Departamento geográfico obligatorio.', severity: 'ERROR' });
    }

    // Superficie
    const builtArea = Number(row.built_area || row.built_area_m2 || row.superficie_edificada || row.area || 0);
    const totalArea = Number(row.total_area || row.total_area_m2 || row.superficie_total || builtArea);
    if (builtArea <= 0 && totalArea <= 0) {
      issues.push({ field: 'built_area_m2', code: 'MISSING_AREA', message: 'Metraje edificado o total ausente.', severity: 'ERROR' });
    }

    // Tipología
    const typeRaw = String(row.property_type || row.tipo || 'APARTMENT').toUpperCase();
    let propertyType: any = 'APARTMENT';
    if (typeRaw.includes('CASA') || typeRaw.includes('HOUSE')) propertyType = 'HOUSE';
    else if (typeRaw.includes('TERRENO') || typeRaw.includes('LAND')) propertyType = 'LAND';
    else if (typeRaw.includes('LOCAL') || typeRaw.includes('COMMERCIAL')) propertyType = 'COMMERCIAL';
    else if (typeRaw.includes('OFICINA') || typeRaw.includes('OFFICE')) propertyType = 'OFFICE';
    else if (typeRaw.includes('APTO') || typeRaw.includes('APART')) propertyType = 'APARTMENT';

    // Coordenadas
    let lat: number | null = null;
    let lng: number | null = null;
    if (row.latitude || row.lat) {
      lat = Number(row.latitude || row.lat);
      lng = Number(row.longitude || row.lng);
      // Validar bounding box Uruguay (-30 a -35 lat / -53 a -59 lng)
      if (lat > -29 || lat < -36 || lng > -52 || lng < -60) {
        issues.push({ field: 'coordinates', code: 'INVALID_COORDINATES', message: 'Coordenadas GPS fuera del territorio de Uruguay.', severity: 'ERROR' });
        lat = null;
        lng = null;
      }
    }

    return {
      sourceCode,
      sourceListingId,
      sourceUrl: row.url || row.source_url ? String(row.url || row.source_url) : null,
      operationType: 'SALE',
      propertyType,
      department,
      city: row.city ? String(row.city) : department,
      neighborhood,
      addressRaw: row.address ? String(row.address) : null,
      streetName: row.street_name ? String(row.street_name) : null,
      streetNumber: row.street_number ? String(row.street_number) : null,
      unit: row.unit ? String(row.unit) : null,
      floor: row.floor ? String(row.floor) : null,
      cadastralNumber: row.cadastral_number || row.padron ? String(row.cadastral_number || row.padron) : null,
      latitude: lat,
      longitude: lng,
      priceAmount,
      currency,
      builtAreaM2: builtArea > 0 ? builtArea : null,
      totalAreaM2: totalArea > 0 ? totalArea : null,
      bedrooms: row.bedrooms || row.dormitorios ? Number(row.bedrooms || row.dormitorios) : null,
      bathrooms: row.bathrooms || row.banos ? Number(row.bathrooms || row.banos) : null,
      garages: row.garages || row.cocheras ? Number(row.garages || row.cocheras) : null,
      constructionYear: row.construction_year || row.ano ? Number(row.construction_year || row.ano) : null,
      title,
      description: row.description ? String(row.description) : null,
      parserVersion: 'v2.1-national-import',
    };
  }

  public clearAll(): void {
    this.batches.clear();
    this.stagedRecords.clear();
  }
}
