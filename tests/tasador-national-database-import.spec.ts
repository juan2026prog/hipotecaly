// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE IMPORTACIÓN DE BASE INMOBILIARIA NACIONAL
// Validación de Staging, Schemas Canónicos, NULL != NULL, Duplicados y Trazabilidad por Batch
// ==============================================================================

import { test, expect } from '@playwright/test';
import { NationalDatabaseImportService } from '../src/lib/tasador/import/NationalDatabaseImportService';
import { PropertyMasterResolver } from '../src/lib/tasador/master/PropertyMasterResolver';

test.describe('TASADOR IA — BASE INMOBILIARIA NACIONAL IMPORT PIPELINE', () => {
  const importService = NationalDatabaseImportService.getInstance();
  const masterResolver = PropertyMasterResolver.getInstance();

  test.beforeEach(() => {
    importService.clearAll();
  });

  test('1. Staging Seguro: Carga y validación canónica de dataset sin tocar base productiva directa', () => {
    const rawDataset = [
      {
        source_listing_id: 'inmo_sur_101',
        title: 'Apartamento luminoso en Pocitos con balcón',
        department: 'Montevideo',
        neighborhood: 'Pocitos',
        street_name: 'Av. Brasil',
        street_number: '2800',
        unit: '302',
        property_type: 'APARTAMENTO',
        price: 215000,
        currency: 'USD',
        built_area_m2: 74,
        total_area_m2: 78,
        bedrooms: 2,
        bathrooms: 1,
        garages: 1,
        latitude: -34.915,
        longitude: -56.148,
      },
      {
        source_listing_id: 'inmo_sur_102',
        title: 'Casa amplia en Carrasco Sur',
        department: 'Montevideo',
        neighborhood: 'Carrasco',
        property_type: 'CASA',
        price: 490000,
        currency: 'USD',
        built_area_m2: 240,
        total_area_m2: 450,
        bedrooms: 3,
        bathrooms: 3,
      },
    ];

    const batch = importService.stageDataset({
      datasetName: 'Dataset Auditoría Inmobiliarias Montevideo 2026',
      sourceCode: 'inmobiliaria_sur_uy',
      sourceAgencyName: 'Inmobiliaria del Sur',
      sourceType: 'AUDITED_RESEARCH_DATASET',
      records: rawDataset,
      userId: 'superadmin_1',
    });

    expect(batch).toBeDefined();
    expect(batch.totalRows).toBe(2);
    expect(batch.validRows).toBe(2);
    expect(batch.invalidRows).toBe(0);
    expect(batch.status).toBe('VALIDATED');
    expect(batch.newMastersProjected).toBe(2);
  });

  test('2. Detección y Aislamiento de Registros Inválidos (Sin romper el resto del lote)', () => {
    const corruptDataset = [
      {
        source_listing_id: 'corrupt_01',
        title: 'Publicación sin precio',
        department: 'Montevideo',
        neighborhood: 'Cordón',
        price: 0, // ERROR: Falta precio
        built_area_m2: 50,
      },
      {
        source_listing_id: 'corrupt_02',
        title: 'Publicación con coordenadas fuera de Uruguay',
        department: 'Maldonado',
        neighborhood: 'Punta del Este',
        price: 320000,
        built_area_m2: 80,
        latitude: 40.7128, // Nueva York (Fuera de Uruguay)
        longitude: -74.006,
      },
      {
        source_listing_id: 'valid_01',
        title: 'Apartamento impecable en Centro',
        department: 'Montevideo',
        neighborhood: 'Centro',
        price: 120000,
        built_area_m2: 55,
      },
    ];

    const batch = importService.stageDataset({
      datasetName: 'Lote Mixto con Errores',
      sourceCode: 'caldeiro_uy',
      sourceAgencyName: 'Caldeiro Victorica',
      sourceType: 'CSV',
      records: corruptDataset,
      userId: 'superadmin_1',
    });

    expect(batch.totalRows).toBe(3);
    expect(batch.validRows).toBe(1);
    expect(batch.invalidRows).toBe(2);
    expect(batch.validationReport.missingPriceCount).toBe(1);
    expect(batch.validationReport.invalidCoordinatesCount).toBe(1);
  });

  test('3. Regla Estricta NULL != NULL: Prevenir falsas fusiones automáticas por atributos parciales', () => {
    // 2 propiedades en Pocitos de 70m² pero sin número de puerta ni padrón
    const dataset = [
      {
        source_listing_id: 'inmo_a_01',
        title: 'Apartamento 2 dorm en Pocitos',
        department: 'Montevideo',
        neighborhood: 'Pocitos',
        price: 195000,
        built_area_m2: 70,
        // Sin dirección exacta ni padrón
      },
      {
        source_listing_id: 'inmo_b_01',
        title: 'Apartamento 2 dormitorios Pocitos zona Ombú',
        department: 'Montevideo',
        neighborhood: 'Pocitos',
        price: 198000,
        built_area_m2: 70,
        // Sin dirección exacta ni padrón
      },
    ];

    const batch = importService.stageDataset({
      datasetName: 'Lote Prueba NULL != NULL',
      sourceCode: 'inmo_generica',
      sourceAgencyName: 'Inmobiliaria Genérica',
      sourceType: 'JSON',
      records: dataset,
      userId: 'superadmin_1',
    });

    // La segunda propiedad debe quedar como POSSIBLE_DUPLICATE sin fusionarse automáticamente
    expect(batch.possibleDuplicates).toBe(1);
    expect(batch.newMastersProjected).toBe(2); // Conserva 2 masters independientes de manera conservadora
  });

  test('4. Cross-Source Match Seguro: Fusión determinística ante Padrón Catastral o Dirección Exacta', () => {
    // 1. Crear un Property Master previo con padrón
    const prevMaster = masterResolver.resolveMaster({
      sourceListingId: 'prev_101',
      sourceCode: 'infocasas',
      sourceListingKey: 'infocasas_prev_101',
      title: 'Pocitos Padrón 409922',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      normalizedAddress: 'Av. Brasil 2650 Apto 402',
      streetName: 'Av. Brasil',
      streetNumber: '2650',
      unit: '402',
      cadastralNumber: '409922',
      propertyType: 'APARTMENT',
      builtAreaM2: 95,
      totalAreaM2: 95,
      priceUsd: 245000,
      operationType: 'SALE',
      dataQualityScore: 95,
      comparableEligibility: 'ELIGIBLE',
      publicationDate: new Date().toISOString(),
    } as any);

    expect(prevMaster.master.id).toBeDefined();

    // 2. Importar publicación de nueva inmobiliaria con el mismo padrón exacto
    const batch = importService.stageDataset({
      datasetName: 'Dataset Agencia Nueva',
      sourceCode: 'inmobiliaria_nueva_uy',
      sourceAgencyName: 'Inmobiliaria Nueva',
      sourceType: 'CSV',
      records: [
        {
          source_listing_id: 'new_inmo_888',
          title: 'Exclusivo piso en Pocitos Padrón 409922',
          department: 'Montevideo',
          neighborhood: 'Pocitos',
          address: 'Av. Brasil 2650 Apto 402',
          padron: '409922',
          price: 245000,
          built_area_m2: 95,
        },
      ],
      userId: 'superadmin_1',
    });

    expect(batch.validRows).toBe(1);
    expect(batch.matchedMastersProjected).toBe(1);
    expect(batch.newMastersProjected).toBe(0);
  });

  test('5. Commit Server-Side y Trazabilidad por Batch ID', () => {
    const batch = importService.stageDataset({
      datasetName: 'Lote para Commit',
      sourceCode: 'terramar_uy',
      sourceAgencyName: 'Terramar Propiedades',
      sourceType: 'AUDITED_RESEARCH_DATASET',
      records: [
        {
          source_listing_id: 'terramar_501',
          title: 'Casa en Malvín Próxima a Concepción del Uruguay',
          department: 'Montevideo',
          neighborhood: 'Malvín',
          price: 310000,
          built_area_m2: 130,
          property_type: 'CASA',
        },
      ],
      userId: 'superadmin_1',
    });

    const commitResult = importService.commitBatch(batch.batchId, 'superadmin_1');

    expect(commitResult.status).toBe('COMMITTED');
    expect(commitResult.committedListings).toBe(1);
    expect(commitResult.resolvedMasters).toBe(1);

    const updatedBatch = importService.batches.get(batch.batchId);
    expect(updatedBatch?.status).toBe('COMMITTED');
    expect(updatedBatch?.committedAt).toBeDefined();
  });
});
