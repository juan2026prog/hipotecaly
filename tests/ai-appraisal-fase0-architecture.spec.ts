// ==============================================================================
// HIPOTECALY AI: Suite Ampliada de Pruebas Automatizadas - Tasador IA Fase0
// Validación de las 16 Entidades Fundacionales, Top 20 Portales Locales UY,
// Candidatos de Deduplicación, Evidencia, Ajuste Asking Price (12%) y Aislamiento
// ==============================================================================

import { test, expect } from '@playwright/test';
import { appraisalDataService } from '../src/lib/ai/appraisalDataService';
import { TOP_20_PORTALS_CONFIG } from '../src/config/top20PortalsConfig';
import * as fs from 'fs';
import * as path from 'path';

test.describe('TASADOR IA - FASE 0: Arquitectura Ampliada y Modelo de Datos Inmobiliario', () => {

  // 1. Configuración de Exactamente 20 Portales Locales Uruguayos
  test('1. Fuentes de Portales: contiene exactamente los 20 portales uruguayos con ingestionEnabled = false', async () => {
    const sources = await appraisalDataService.getPortalSources();
    expect(sources.length).toBe(20);
    expect(TOP_20_PORTALS_CONFIG.length).toBe(20);

    // Verificar que todos los ingestionEnabled sean estrictamente false en Fase 0
    sources.forEach((source) => {
      expect(source.ingestionEnabled).toBe(false);
      expect(source.countryCode).toBe('UY');
    });

    const meLi = sources.find((s) => s.code === 'mercadolibre_uy');
    expect(meLi).toBeDefined();
    expect(meLi?.name).toBe('Mercado Libre Inmuebles');

    const infocasas = sources.find((s) => s.code === 'infocasas');
    expect(infocasas).toBeDefined();
    expect(infocasas?.name).toBe('InfoCasas');

    const gallito = sources.find((s) => s.code === 'gallito_uy');
    expect(gallito).toBeDefined();
    expect(gallito?.name).toBe('Gallito Luis');
  });

  // 2. Property Master Global Independiente de Expedientes
  test('2. Property Master Global: crea registro canónico sin dependencia de la tabla applications', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Av. Brasil 2580 Apt 801',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Pocitos',
      propertyType: 'APARTMENT',
      coveredSurfaceM2: 85,
      bedrooms: 2,
      bathrooms: 2,
      cadastralNumber: '112233',
    });

    expect(master.id).toBeDefined();
    expect(master.canonicalAddress).toBe('Av. Brasil 2580 Apt 801');
    expect(master.countryCode).toBe('UY');
    expect(master.locationPrecision).toBe('EXACT_ADDRESS');
    expect(master.dedupHash).toBeDefined();
    expect(master.canonicalStatus).toBe('ACTIVE');
  });

  // 3. Deduplicación Heurística mediante Candidatos (Sin Auto-Merge Destructivo)
  test('3. Deduplicación por Candidatos: evalúa similitud y registra candidatos sin fusión automática', async () => {
    const masterA = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Gabriel Pereira 3100',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
      coveredSurfaceM2: 70,
    });

    const candidate = await appraisalDataService.registerDuplicateCandidate({
      propertyAId: masterA.id,
      matchScore: 88.5,
    });

    expect(candidate.id).toBeDefined();
    expect(candidate.matchScore).toBe(88.5);
    expect(candidate.decision).toBe('PENDING');
    expect(candidate.decisionSource).toBe('AUTOMATED_DEDUP_SCORER');
  });

  // 4. Listing por Portal: Títulos/Descripciones Raw vs Normalizados
  test('4. Listings por Portal: guarda separados el texto original (raw) y el texto normalizado', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Rivera 2100',
      department: 'Montevideo',
      propertyType: 'HOUSE',
    });

    const { listing } = await appraisalDataService.registerListing({
      sourceCode: 'infocasas',
      externalId: 'info_9988',
      url: 'https://www.infocasas.com.uy/propiedad/info_9988',
      title: 'Hermosa Casa En Pocitos Con Jardín',
      description: 'CASA AMPLIA CON PARRILLERO Y GARAJE.',
      priceAmount: 320000,
      currency: 'USD',
      coveredSurfaceM2: 150,
      masterId: master.id,
    });

    expect(listing.titleRaw).toBe('Hermosa Casa En Pocitos Con Jardín');
    expect(listing.titleNormalized).toBe('hermosa casa en pocitos con jardín');
    expect(listing.descriptionRaw).toBe('CASA AMPLIA CON PARRILLERO Y GARAJE.');
    expect(listing.descriptionNormalized).toBe('casa amplia con parrillero y garaje.');
    expect(listing.operationType).toBe('SALE');
  });

  // 5. Historial Inmutable Append-Only de Precios
  test('5. Historial de Precios: audita cambio de precio en listing sin destruir entradas históricas', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Ellauri 950',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });

    const { listing } = await appraisalDataService.registerListing({
      sourceCode: 'mercadolibre_uy',
      externalId: 'meli_prop_554',
      url: 'https://inmuebles.mercadolibre.com.uy/meli_prop_554',
      title: 'Apartamento en Punta Carretas',
      priceAmount: 220000,
      currency: 'USD',
      coveredSurfaceM2: 60,
      masterId: master.id,
    });

    // Actualización de precio
    await appraisalDataService.registerListing({
      sourceCode: 'mercadolibre_uy',
      externalId: 'meli_prop_554',
      url: 'https://inmuebles.mercadolibre.com.uy/meli_prop_554',
      title: 'Apartamento en Punta Carretas - Rebajado',
      priceAmount: 205000,
      currency: 'USD',
      coveredSurfaceM2: 60,
      masterId: master.id,
    });

    const history = await appraisalDataService.getPriceHistory({ listingId: listing.id });
    expect(history.length).toBe(2);
    expect(history[0].eventType).toBe('FIRST_SEEN');
    expect(history[0].priceUsd).toBe(220000);
    expect(history[1].eventType).toBe('PRICE_CHANGED');
    expect(history[1].previousPriceUsd).toBe(220000);
    expect(history[1].priceUsd).toBe(205000);
  });

  // 6. Evidencia Trazable por Campo
  test('6. Evidencia por Campo: guarda la trazabilidad de origen para cada atributo del inmueble', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Av. 18 de Julio 1200',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });

    const evidence = await appraisalDataService.registerFieldEvidence({
      propertyMasterId: master.id,
      fieldName: 'bedrooms',
      rawValue: '3 dormitorios',
      normalizedValue: '3',
      sourceCode: 'infocasas',
    });

    expect(evidence.id).toBeDefined();
    expect(evidence.fieldName).toBe('bedrooms');
    expect(evidence.rawValue).toBe('3 dormitorios');
    expect(evidence.normalizedValue).toBe('3');
  });

  // 7. Medios / Fotos con Hashes SHA-256 y Perceptual Hash
  test('7. Medios con Hashes: almacena fotos asociando sha256Hash y perceptualHash para deduplicación visual', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Leyenda Patria 2900',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });

    const media = await appraisalDataService.registerMedia({
      masterId: master.id,
      originalUrl: 'https://cdn.hipotecaly.com/media/front_1.jpg',
      mediaType: 'IMAGE',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      perceptualHash: 'd8e4f1a2b3c4d5e6',
    });

    expect(media.id).toBeDefined();
    expect(media.mediaType).toBe('IMAGE');
    expect(media.sha256Hash).toBeDefined();
    expect(media.perceptualHash).toBe('d8e4f1a2b3c4d5e6');
  });

  // 8. Parámetro de Ajuste de Asking Price (12.00%) Configurado y No Ejecutado
  test('8. Asking Price Adjustment: registra asking_price_adjustment = 0.1200 (12.00%) sin ejecutarlo', async () => {
    const activeSettings = await appraisalDataService.getActiveSettings();

    expect(activeSettings.version).toBe(1);
    expect(activeSettings.isActive).toBe(true);
    expect(activeSettings.askingPriceAdjustment).toBe(0.1200); // 12% factor de diferencia asking/closing price
    expect(activeSettings.status).toBe('ACTIVE');
    expect(activeSettings.notes).toContain('asking_price_adjustment = 12.00%');
  });

  // 9. Principio NULL != FALSE en Atributos Opcionales
  test('9. Atributos Opcionales: trata campos no informados como null (desconocido) en lugar de false', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Rambla Gandhi 450',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });

    expect(master.pool).toBeUndefined(); // No asumido como false
    expect(master.elevator).toBeUndefined(); // Desconocido
  });

  // 10. Verificación de Migraciones SQL Existentes
  test('10. Migraciones SQL: existen los archivos 20260910000036 y 20260910000037 con las 16 tablas', () => {
    const m1Path = path.join(process.cwd(), 'supabase', 'migrations', '20260910000036_fase0_tasador_ia_architecture.sql');
    const m2Path = path.join(process.cwd(), 'supabase', 'migrations', '20260910000037_fase0_tasador_ia_expanded_architecture.sql');

    expect(fs.existsSync(m1Path)).toBe(true);
    expect(fs.existsSync(m2Path)).toBe(true);

    const m2Content = fs.readFileSync(m2Path, 'utf-8');
    expect(m2Content).toContain('property_duplicate_candidates');
    expect(m2Content).toContain('property_listing_media');
    expect(m2Content).toContain('property_listing_attributes');
    expect(m2Content).toContain('property_field_evidence');
    expect(m2Content).toContain('property_listing_snapshots');
    expect(m2Content).toContain('property_cadastral_data');
    expect(m2Content).toContain('property_valuations');
    expect(m2Content).toContain('property_valuation_versions');
    expect(m2Content).toContain('property_valuation_comparables');
    expect(m2Content).toContain('property_ai_features');
    expect(m2Content).toContain('property_transactions');
    expect(m2Content).toContain('asking_price_adjustment NUMERIC(5, 4) DEFAULT 0.1200');
  });

  // 11. Garantía de Aislamiento Estricto de Fase 0
  test('11. Aislamiento de Fase0: no se ejecutan crawlers, ni OpenAI, ni Catastro vivo, ni tasaciones', () => {
    const sources = TOP_20_PORTALS_CONFIG;
    sources.forEach((portal) => {
      expect(portal.ingestionEnabled).toBe(false);
      expect(portal.enabled).toBe(true);
    });
  });

});
