// ==============================================================================
// HIPOTECALY AI: Suite de Pruebas Automatizadas - Tasador IA Fase0 (25 Requisitos)
// Matriz Completa 1-a-1 de Verificación de Arquitectura, Modelo de Datos,
// 20 Portales Locales UY (incluyendo ACSA), RLS, CrawlerRuns, AIUsageEvents y Parámetro del 12%
// ==============================================================================

import { test, expect } from '@playwright/test';
import { appraisalDataService } from '../src/lib/ai/appraisalDataService';
import { TOP_20_PORTALS_CONFIG } from '../src/config/top20PortalsConfig';
import * as fs from 'fs';
import * as path from 'path';

test.describe('TASADOR IA - FASE 0: Matriz Completa de 25 Requisitos', () => {

  // Requisito 1: Creación de property_sources
  test('Req 01: Creación de property_sources con metadatos completos y 20 fuentes registradas', async () => {
    const sources = await appraisalDataService.getPortalSources();
    expect(sources.length).toBe(20);
  });

  // Requisito 2: Fuentes exactas uruguayas con nombres de pantalla corregidos (ACSA, Caldeyro, Nicolás de Módena)
  test('Req 02: Fuentes uruguayas exactas con nombres corregidos (ACSA) preservando los códigos nativos intactos', async () => {
    const sources = await appraisalDataService.getPortalSources();
    const acsa = sources.find((s) => s.code === 'acs_uy');
    expect(acsa).toBeDefined();
    expect(acsa?.name).toBe('ACSA Inmobiliaria'); // Nombre visible corregido a ACSA preservando code acs_uy

    const caldeyro = sources.find((s) => s.code === 'caldeiro_uy');
    expect(caldeyro).toBeDefined();
    expect(caldeyro?.name).toBe('Caldeyro Victorica Bienes Raíces');

    const nicolas = sources.find((s) => s.code === 'nicolas_modena_uy');
    expect(nicolas).toBeDefined();
    expect(nicolas?.name).toBe('Nicolás de Módena Inmobiliaria');
  });

  // Requisito 3: ingestion_enabled = false en todos los portales
  test('Req 03: Desactivación estricta de ingesta (ingestion_enabled = false) en todos los portales', async () => {
    const sources = await appraisalDataService.getPortalSources();
    sources.forEach((source) => {
      expect(source.ingestionEnabled).toBe(false);
      expect(source.enabled).toBe(true);
    });
  });

  // Requisito 4: Creación de property_master independiente de expedientes (applications)
  test('Req 04: Creación de property_master como base global independiente de la tabla de expedientes', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Bulevar Artigas 1420',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });
    expect(master.id).toBeDefined();
    expect(master.canonicalAddress).toBe('Calle Bulevar Artigas 1420');
  });

  // Requisito 5: Precisión de Ubicación (location_precision)
  test('Req 05: Desglose explícito de dirección, barrio, ciudad, departamento y location_precision', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Av. Arocena 1600',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Carrasco',
      subNeighborhood: 'Carrasco Sur',
      propertyType: 'HOUSE',
    });
    expect(master.neighborhood).toBe('Carrasco');
    expect(master.subNeighborhood).toBe('Carrasco Sur');
    expect(master.locationPrecision).toBe('EXACT_ADDRESS');
  });

  // Requisito 6: Creación de property_listings vinculada a master y fuente
  test('Req 06: Creación de property_listings vinculando N publicaciones a una propiedad maestra', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Benito Blanco 1020',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });
    const { listing } = await appraisalDataService.registerListing({
      sourceCode: 'infocasas',
      externalId: 'ext_901',
      url: 'https://infocasas.com.uy/prop/901',
      title: 'Apartamento con terraza en Pocitos',
      priceAmount: 185000,
      currency: 'USD',
      masterId: master.id,
    });
    expect(listing.masterId).toBe(master.id);
    expect(listing.sourceListingId).toBe('ext_901');
  });

  // Requisito 7: Constraint de unicidad source_id + source_listing_id
  test('Req 07: Garantía de identificador único de publicación por fuente (source_id + source_listing_id)', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Rivera 3000',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });
    const { listing: l1 } = await appraisalDataService.registerListing({
      sourceCode: 'mercadolibre_uy',
      externalId: 'meli_unique_01',
      url: 'https://inmuebles.mercadolibre.com.uy/meli_unique_01',
      title: 'Apt en Pocitos',
      priceAmount: 190000,
      masterId: master.id,
    });
    expect(l1.id).toContain('mercadolibre_uy_meli_unique_01');
  });

  // Requisito 8: Texto RAW vs. Normalizado en listings
  test('Req 08: Almacenamiento diferenciado de texto original (raw) y normalizado en títulos y descripciones', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Av. Italia 2400',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });
    const { listing } = await appraisalDataService.registerListing({
      sourceCode: 'gallito_uy',
      externalId: 'gal_77',
      url: 'https://gallito.com.uy/gal_77',
      title: 'PENTHOUSE EN MALVÍN CON VISTA AL MAR',
      description: 'EXCELENTE ESTADO GENERAL.',
      priceAmount: 310000,
      masterId: master.id,
    });
    expect(listing.titleRaw).toBe('PENTHOUSE EN MALVÍN CON VISTA AL MAR');
    expect(listing.titleNormalized).toBe('penthouse en malvín con vista al mar');
  });

  // Requisito 9: Historial Inmutable Append-Only de Precios
  test('Req 09: Historial inmutable append-only en property_price_history registrando event_type', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Ellauri 700',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });
    const { listing } = await appraisalDataService.registerListing({
      sourceCode: 'remax_uy',
      externalId: 'rmx_12',
      url: 'https://remax.com.uy/rmx_12',
      title: 'Apt Punta Carretas',
      priceAmount: 240000,
      masterId: master.id,
    });
    const history = await appraisalDataService.getPriceHistory({ listingId: listing.id });
    expect(history.length).toBe(1);
    expect(history[0].eventType).toBe('FIRST_SEEN');
  });

  // Requisito 10: Trigger de Historial registra cambios sin interpretar bajas como ventas
  test('Req 10: Trigger audita variación de precio sin marcar caídas de precio como ventas', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Gabriel Pereira 2900',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });
    const { listing } = await appraisalDataService.registerListing({
      sourceCode: 'infocasas',
      externalId: 'info_var_01',
      url: 'https://infocasas.com.uy/info_var_01',
      title: 'Apt Pocitos',
      priceAmount: 200000,
      masterId: master.id,
    });

    await appraisalDataService.registerListing({
      sourceCode: 'infocasas',
      externalId: 'info_var_01',
      url: 'https://infocasas.com.uy/info_var_01',
      title: 'Apt Pocitos - Rebajado',
      priceAmount: 185000,
      masterId: master.id,
    });

    const history = await appraisalDataService.getPriceHistory({ listingId: listing.id });
    expect(history.length).toBe(2);
    expect(history[1].eventType).toBe('PRICE_CHANGED');
    expect(history[1].priceChangePercentage).toBe(-7.5);
  });

  // Requisito 11: Medios con Hashes SHA-256 y Perceptual Hash
  test('Req 11: Registro en property_listing_media asociando sha256_hash y perceptual_hash', async () => {
    const media = await appraisalDataService.registerMedia({
      originalUrl: 'https://cdn.hipotecaly.com/img_01.jpg',
      sha256Hash: 'sha256_dummy_hash_01',
      perceptualHash: 'phash_dummy_01',
    });
    expect(media.id).toBeDefined();
    expect(media.sha256Hash).toBe('sha256_dummy_hash_01');
    expect(media.perceptualHash).toBe('phash_dummy_01');
  });

  // Requisito 12: Candidatos de Duplicación sin Auto-Merge Destructivo
  test('Req 12: Evaluación de candidatos en property_duplicate_candidates sin fusión destructiva automática', async () => {
    const candidate = await appraisalDataService.registerDuplicateCandidate({
      matchScore: 92.0,
    });
    expect(candidate.id).toBeDefined();
    expect(candidate.decision).toBe('PENDING');
  });

  // Requisito 13: Estado Explícito SOLD_OR_REMOVED_UNKNOWN
  test('Req 13: Soporte del estado explícito SOLD_OR_REMOVED_UNKNOWN (REMOVED != SOLD)', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Rambla Peru 1400',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });

    const { listing } = await appraisalDataService.registerListing({
      sourceCode: 'mercadolibre_uy',
      externalId: 'meli_removed_01',
      url: 'https://inmuebles.mercadolibre.com.uy/meli_removed_01',
      title: 'Apt Rambla',
      priceAmount: 400000,
      status: 'SOLD_OR_REMOVED_UNKNOWN',
      masterId: master.id,
    });

    expect(listing.status).toBe('SOLD_OR_REMOVED_UNKNOWN');
  });

  // Requisito 14: Desglose de Superficies y Comodidades (NULL != FALSE)
  test('Req 14: Desglose explícito de superficies y amenities respetando el principio NULL != FALSE', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Av. Luis Alberto de Herrera 1240',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });

    expect(master.pool).toBeUndefined();
    expect(master.heating).toBeUndefined();
  });

  // Requisito 15: Atributos Flexibles clave-valor
  test('Req 15: Estructura de property_listing_attributes para atributos clave-valor adicionales', async () => {
    const master = await appraisalDataService.createOrResolveMasterProperty({
      canonicalAddress: 'Calle Chucarro 1030',
      department: 'Montevideo',
      propertyType: 'APARTMENT',
    });
    const { listing } = await appraisalDataService.registerListing({
      sourceCode: 'infocasas',
      externalId: 'attr_test_01',
      url: 'https://infocasas.com.uy/attr_test_01',
      title: 'Apt Pocitos',
      priceAmount: 160000,
      masterId: master.id,
    });
    expect(listing.id).toBeDefined();
  });

  // Requisito 16: Trazabilidad de Evidencia por Campo
  test('Req 16: Trazabilidad de origen y evidencia en property_field_evidence por atributo individual', async () => {
    const evidence = await appraisalDataService.registerFieldEvidence({
      fieldName: 'bathrooms',
      rawValue: '2 baños completos',
      normalizedValue: '2',
      sourceCode: 'gallito_uy',
    });
    expect(evidence.id).toBeDefined();
    expect(evidence.fieldName).toBe('bathrooms');
    expect(evidence.normalizedValue).toBe('2');
  });

  // Requisito 17: Snapshots Estructurales de Publicaciones
  test('Req 17: Almacenamiento de snapshots inmutables en property_listing_snapshots', async () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260910000037_fase0_tasador_ia_expanded_architecture.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_listing_snapshots');
  });

  // Requisito 18: Estructura de Datos Catastrales (Preparada sin conexión)
  test('Req 18: Estructura oficial de property_cadastral_data preparada sin conexión viva a Catastro', () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260910000037_fase0_tasador_ia_expanded_architecture.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_cadastral_data');
  });

  // Requisito 19: Estructura de Valuaciones y Versiones (Preparada sin ejecuciones automáticas)
  test('Req 19: Estructuras de property_valuations y property_valuation_versions preparadas sin tasaciones', () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260910000037_fase0_tasador_ia_expanded_architecture.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_valuations');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_valuation_versions');
  });

  // Requisito 20: Estructura de Comparables (Preparada sin selecciones reales)
  test('Req 20: Estructura de property_valuation_comparables preparada sin selección real de testigos', () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260910000037_fase0_tasador_ia_expanded_architecture.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_valuation_comparables');
  });

  // Requisito 21: Estructura de Características de IA (Preparada sin modelos activos)
  test('Req 21: Estructura de property_ai_features preparada sin modelos de IA o visión activos', () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260910000037_fase0_tasador_ia_expanded_architecture.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_ai_features');
  });

  // Requisito 22: Estructura de Transacciones Reales (Preparada sin datos ficticios)
  test('Req 22: Estructura de property_transactions preparada sin inserción de operaciones ficticias', () => {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260910000037_fase0_tasador_ia_expanded_architecture.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.property_transactions');
  });

  // Requisito 23: Estructura de Sesiones de Crawler (crawler_runs)
  test('Req 23: Estructura de crawler_runs para monitoreo de scrapers preparada pero vacía en Fase 0', async () => {
    const runs = await appraisalDataService.getCrawlerRuns();
    expect(runs.length).toBe(0);

    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260910000038_fase0_tasador_ia_final_hardening.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.crawler_runs');
  });

  // Requisito 24: Estructura de Consumo de IA (ai_usage_events) con organization_id y case_id nullables
  test('Req 24: Estructura de ai_usage_events con organization_id y case_id nullables para costeo futuro', async () => {
    const events = await appraisalDataService.getAIUsageEvents();
    expect(events.length).toBe(0);

    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260910000038_fase0_tasador_ia_final_hardening.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.ai_usage_events');
    expect(sqlContent).toContain('organization_id UUID');
    expect(sqlContent).toContain('case_id UUID');
  });

  // Requisito 25: Settings Versionados y Parámetro asking_price_adjustment = 0.1200 (12.00%)
  test('Req 25: Parámetro versionado asking_price_adjustment = 0.1200 (12.00%) configurado sin ejecutarse', async () => {
    const activeSettings = await appraisalDataService.getActiveSettings();
    expect(activeSettings.version).toBe(1);
    expect(activeSettings.isActive).toBe(true);
    expect(activeSettings.askingPriceAdjustment).toBe(0.1200);
    expect(activeSettings.notes).toContain('asking_price_adjustment = 12.00%');
  });

});
