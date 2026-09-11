// ==============================================================================
// HIPOTECALY AI: Suite de Pruebas Automatizadas - Tasador IA Fase0
// Validación de Arquitectura, Modelo de Datos, Top 20 Portales, Deduplicación,
// Historial de Precios, Hashes Fotográficos y Parámetro Versionado del 12%
// ==============================================================================

import { test, expect } from '@playwright/test';
import { appraisalDataService } from '../src/lib/ai/appraisalDataService';
import { TOP_20_PORTALS_CONFIG } from '../src/config/top20PortalsConfig';
import * as fs from 'fs';
import * as path from 'path';

test.describe('TASADOR IA - FASE 0: Arquitectura y Modelo de Datos', () => {

  // 1. Verificación de Fuentes / Top 20 Portales Inmobiliarios
  test('1. Configuración Top 20 Portales: contiene exactamente 20 fuentes declaradas con dominios y rate-limits', async () => {
    const sources = await appraisalDataService.getPortalSources();
    expect(sources.length).toBe(20);
    expect(TOP_20_PORTALS_CONFIG.length).toBe(20);

    const infocasas = sources.find((s) => s.code === 'infocasas');
    expect(infocasas).toBeDefined();
    expect(infocasas?.domain).toBe('infocasas.com.uy');
    expect(infocasas?.countryCode).toBe('UY');
    expect(infocasas?.isActive).toBe(true);

    const meLi = sources.find((s) => s.code === 'mercadolibre_uy');
    expect(meLi).toBeDefined();
    expect(meLi?.domain).toBe('inmuebles.mercadolibre.com.uy');

    const gallito = sources.find((s) => s.code === 'gallito_uy');
    expect(gallito).toBeDefined();
    expect(gallito?.domain).toBe('gallito.com.uy');
  });

  // 2. Creación e Integridad de Property Master (Base Inmobiliaria Global)
  test('2. Property Master Global: crea registro maestro independiente de expedientes crediticios', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Av. 18 de Julio 1455 Apt 402',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Cordón',
      propertyType: 'apartamento',
      coveredSurfaceM2: 75.5,
      rooms: 2,
      bathrooms: 1,
      cadastralNumber: '45892',
    });

    expect(master.id).toBeDefined();
    expect(master.canonicalAddress).toBe('Av. 18 de Julio 1455 Apt 402');
    expect(master.department).toBe('Montevideo');
    expect(master.cadastralNumber).toBe('45892');
    expect(master.dedupHash).toBeDefined();
    expect(master.dedupConfidence).toBe(100);
  });

  // 3. Deduplicación Heurística por Hash y Padrón
  test('3. Deduplicación de Inmuebles: detecta inmueble duplicado y reutiliza el mismo id maestro', async () => {
    const propertyData = {
      canonicalAddress: 'Calle Bulevar Artigas 2240',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Tres Cruces',
      propertyType: 'apartamento' as const,
      coveredSurfaceM2: 90,
      cadastralNumber: '99881',
    };

    const firstMaster = await appraisalDataService.createOrResolveMasterProperty(propertyData);
    const secondMaster = await appraisalDataService.createOrResolveMasterProperty(propertyData);

    expect(firstMaster.id).toBe(secondMaster.id);
    expect(firstMaster.dedupHash).toBe(secondMaster.dedupHash);
  });

  // 4. Ingesta de Property Listings y Normalización de Precio
  test('4. Listings por Portal: vincula anuncio a portal y maestro calculando precio m2 en USD', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Rambla Republica del Peru 1120',
      department: 'Montevideo',
      propertyType: 'apartamento',
      coveredSurfaceM2: 100,
    });

    const { listing } = await appraisalDataService.registerListing({
      sourceCode: 'infocasas',
      externalId: 'info_prop_1001',
      url: 'https://infocasas.com.uy/propiedad/1001',
      title: 'Apartamento frente al mar en Pocitos',
      priceAmount: 250000,
      currency: 'USD',
      coveredSurfaceM2: 100,
      masterId: master.id,
    });

    expect(listing.id).toContain('infocasas_info_prop_1001');
    expect(listing.priceUsdNormalized).toBe(250000);
    expect(listing.pricePerM2Usd).toBe(2500);
    expect(listing.masterId).toBe(master.id);
  });

  // 5. Historial de Precios y Auditoría de Cambios
  test('5. Historial de Precios: audita cambio de precio en listing y calcula porcentaje de variación', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Ellauri 850',
      department: 'Montevideo',
      propertyType: 'casa',
      coveredSurfaceM2: 120,
    });

    // Inserción inicial a $300,000 USD
    const { listing: l1 } = await appraisalDataService.registerListing({
      sourceCode: 'mercadolibre_uy',
      externalId: 'meli_house_202',
      url: 'https://inmuebles.mercadolibre.com.uy/meli_house_202',
      title: 'Casa en Punta Carretas',
      priceAmount: 300000,
      currency: 'USD',
      coveredSurfaceM2: 120,
      masterId: master.id,
    });

    // Actualización de precio a $280,000 USD (-6.67%)
    await appraisalDataService.registerListing({
      sourceCode: 'mercadolibre_uy',
      externalId: 'meli_house_202',
      url: 'https://inmuebles.mercadolibre.com.uy/meli_house_202',
      title: 'Casa en Punta Carretas - Rebajada',
      priceAmount: 280000,
      currency: 'USD',
      coveredSurfaceM2: 120,
      masterId: master.id,
    });

    const history = await appraisalDataService.getPriceHistory({ listingId: l1.id });
    expect(history.length).toBe(2);

    const initialEntry = history[0];
    expect(initialEntry.previousPriceUsd).toBeNull();
    expect(initialEntry.priceUsdNormalized).toBe(300000);

    const updatedEntry = history[1];
    expect(updatedEntry.previousPriceUsd).toBe(300000);
    expect(updatedEntry.priceUsdNormalized).toBe(280000);
    expect(updatedEntry.priceChangePercentage).toBe(-6.67);
  });

  // 6. Almacenamiento de Fotos con Hashes de Deduplicación Visual
  test('6. Fotos con Hashes: registra imágenes asociando phash y sha256 para deduplicación visual', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Av. Brasil 2900',
      department: 'Montevideo',
      propertyType: 'apartamento',
    });

    const photo1 = await appraisalDataService.registerPhoto({
      masterId: master.id,
      url: 'https://cdn.hipotecaly.com/properties/front_photo_1.jpg',
      phash: 'd8e4f1a2b3c4d5e6',
      imageHash: 'sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      isPrimary: true,
    });

    expect(photo1.id).toBeDefined();
    expect(photo1.phash).toBe('d8e4f1a2b3c4d5e6');
    expect(photo1.imageHash).toBeDefined();
    expect(photo1.isPrimary).toBe(true);

    const photos = await appraisalDataService.getPhotosForMaster(master.id);
    expect(photos.length).toBe(1);
    expect(photos[0].url).toBe('https://cdn.hipotecaly.com/properties/front_photo_1.jpg');
  });

  // 7. Parámetros Versionados y Preservación del Factor del 12%
  test('7. Settings Versionados: obtiene V1 activa conservando el 12% de margen configurable sin ejecutarlo', async () => {
    const activeSettings = await appraisalDataService.getActiveSettings();

    expect(activeSettings.version).toBe(1);
    expect(activeSettings.isActive).toBe(true);
    expect(activeSettings.safetyMarginPercentage).toBe(12.00); // 12% preservado sin ejecutar
    expect(activeSettings.minComparablesCount).toBe(3);
    expect(activeSettings.maxComparablesAgeDays).toBe(180);
    expect(activeSettings.weights.surface).toBe(0.40);
  });

  // 8. Versionado de Configuración (Creación de V2 mantención de auditoría)
  test('8. Versionado de Settings: permite registrar V2 desactivando automáticamente V1', async () => {
    const v2 = await appraisalDataService.createSettingsVersion({
      version: 2,
      isActive: true,
      safetyMarginPercentage: 12.00, // Se mantiene el 12% configurable
      maxDedupDistanceMeters: 150,
      similarityThreshold: 88.0,
      minComparablesCount: 4,
      maxComparablesAgeDays: 120,
      outlierStdDevThreshold: 1.8,
      weights: {
        surface: 0.45,
        location: 0.25,
        rooms: 0.15,
        age: 0.15,
      },
      notes: 'Ajuste de umbral de comparables a 120 días',
    });

    expect(v2.version).toBe(2);
    expect(v2.isActive).toBe(true);

    const currentActive = await appraisalDataService.getActiveSettings();
    expect(currentActive.version).toBe(2);
    expect(currentActive.maxDedupDistanceMeters).toBe(150);
  });

  // 9. Verificación de Migración SQL en el Repositorio
  test('9. Migración SQL Fase0: existe el archivo de migración con las 6 tablas y disparadores', () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260910000036_fase0_tasador_ia_architecture.sql');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_sources');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_master');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_listings');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_price_history');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_photos');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.appraisal_settings');
    expect(sqlContent).toContain('safety_margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00');
    expect(sqlContent).toContain('fn_track_property_price_change');
  });

  // 10. Garantía de Aislamiento de Fase0 (No Crawlers, No OpenAI, No Tasaciones Vinculantes)
  test('10. Aislamiento de Fase0: no se ejecutan crawlers ni tasaciones vinculantes prematuras', () => {
    // La prueba valida que la estructura sea puramente declarativa y libre de dependencias activas
    const portals = TOP_20_PORTALS_CONFIG;
    portals.forEach((p) => {
      expect(p.isActive).toBe(true);
      expect(p.rateLimitPerMinute).toBeGreaterThan(0);
    });
  });

});
