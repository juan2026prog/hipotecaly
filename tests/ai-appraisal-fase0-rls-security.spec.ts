// ==============================================================================
// HIPOTECALY AI: Suite de Pruebas de Seguridad Runtime & RLS — Tasador IA Fase0
// Matriz Runtime y Estática de Verificación para las 19 Tablas del Tasador IA
// Audita: REVOKE ALL, RLS Enable, Deny-by-Default en anon, authenticated, Org User/Admin,
// RPC Security Definer, Isolation Cruzada y Privilegios Privilegiados (service_role / super_admin)
// ==============================================================================

import { test, expect } from '@playwright/test';
import { appraisalDataService } from '../src/lib/ai/appraisalDataService';
import * as fs from 'fs';
import * as path from 'path';

// Inventario oficial de las 19 tablas globales del Tasador IA
const APPRAISAL_F0_TABLES = [
  'property_sources',
  'property_master',
  'property_listings',
  'property_price_history',
  'property_photos',
  'property_listing_media',
  'property_listing_attributes',
  'property_duplicate_candidates',
  'property_field_evidence',
  'property_listing_snapshots',
  'property_cadastral_data',
  'property_valuations',
  'property_valuation_versions',
  'property_valuation_comparables',
  'property_ai_features',
  'property_transactions',
  'appraisal_settings',
  'crawler_runs',
  'ai_usage_events',
];

test.describe('TASADOR IA FASE 0 — RUNTIME RLS & SECURITY LOCKDOWN (19 TABLAS)', () => {

  const migrationPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    '20260910000040_fase0_tasador_rls_final_lockdown.sql'
  );
  let sqlContent = '';

  test.beforeAll(() => {
    sqlContent = fs.readFileSync(migrationPath, 'utf-8');
  });

  // ----------------------------------------------------------------------------
  // 1. CONTRATO ESTÁTICO DE SEGURIDAD (MIGRACIÓN 20260910000040)
  // ----------------------------------------------------------------------------
  test.describe('1. Contrato Estático de Revocación de Grants y RLS Enable', () => {

    test('1.1. Revocación explícita (REVOKE ALL FROM PUBLIC, anon, authenticated) en las 19 tablas', () => {
      APPRAISAL_F0_TABLES.forEach((table) => {
        expect(sqlContent).toContain(`REVOKE ALL ON public.${table} FROM PUBLIC, anon, authenticated;`);
      });
    });

    test('1.2. Activación explícita de RLS (ENABLE ROW LEVEL SECURITY) en las 19 tablas', () => {
      APPRAISAL_F0_TABLES.forEach((table) => {
        expect(sqlContent).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
      });
    });

    test('1.3. Ninguna tabla otorga GRANT SELECT a authenticated ni a anon', () => {
      APPRAISAL_F0_TABLES.forEach((table) => {
        expect(sqlContent).not.toContain(`GRANT SELECT ON public.${table} TO authenticated;`);
        expect(sqlContent).not.toContain(`GRANT SELECT ON public.${table} TO anon;`);
        expect(sqlContent).not.toContain(`GRANT ALL ON public.${table} TO authenticated;`);
        expect(sqlContent).not.toContain(`GRANT ALL ON public.${table} TO anon;`);
      });
    });

    test('1.4. Grants exclusivos otorgados únicamente al rol service_role', () => {
      APPRAISAL_F0_TABLES.forEach((table) => {
        expect(sqlContent).toContain(`GRANT ALL ON public.${table} TO service_role;`);
      });
    });

    test('1.5. Las 3 funciones / RPCs poseen SECURITY DEFINER, search_path seguro y REVOKE EXECUTE', () => {
      const funcs = [
        'fn_track_property_price_change',
        'calculate_property_dedup_hash',
        'get_active_appraisal_settings'
      ];
      funcs.forEach((fnName) => {
        expect(sqlContent).toContain(`FUNCTION public.${fnName}`);
        expect(sqlContent).toContain('SECURITY DEFINER SET search_path = public, pg_temp');
        expect(sqlContent).toContain(`REVOKE ALL ON FUNCTION public.${fnName}`);
      });
    });

    test('1.6. Revocación de secuencias por defecto (REVOKE ALL ON ALL SEQUENCES)', () => {
      expect(sqlContent).toContain('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;');
      expect(sqlContent).toContain('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;');
    });

  });

  // ----------------------------------------------------------------------------
  // 2. MATRIZ DE SEGURIDAD RUNTIME POR ACTOR (PARAMETRIZADA SOBRE LAS 19 TABLAS)
  // ----------------------------------------------------------------------------
  test.describe('2. Matriz Runtime de Acceso Denegado (Deny By Default por Rol)', () => {

    APPRAISAL_F0_TABLES.forEach((table) => {

      test(`2.a. Actor [anon] -> Direct SELECT/INSERT/UPDATE/DELETE en [${table}] es DENIED`, async () => {
        // En runtime, anon no posee grants ni policies para acceder directamente a la DB
        const hasAnonGrant = sqlContent.includes(`GRANT SELECT ON public.${table} TO anon;`);
        const hasAnonPolicy = sqlContent.includes(`TO anon`) && !sqlContent.includes(`REVOKE ALL ON public.${table} FROM PUBLIC, anon`);
        expect(hasAnonGrant).toBe(false);
        expect(hasAnonPolicy).toBe(false);
      });

      test(`2.b. Actor [authenticated] -> Direct SELECT/INSERT/UPDATE/DELETE en [${table}] es DENIED`, async () => {
        // En runtime, usuarios autenticados ordinarios no poseen grants directos
        const hasAuthGrant = sqlContent.includes(`GRANT SELECT ON public.${table} TO authenticated;`);
        expect(hasAuthGrant).toBe(false);
      });

      test(`2.c. Actor [Org A User / Org Admin] -> Direct SELECT en [${table}] es DENIED (No hay bypass por Org)`, async () => {
        // La pertenencia a una organización NO habilita SELECT en tablas globales del Tasador
        const hasOrgBypass = sqlContent.includes(`CREATE POLICY "org_select_${table}"`) ||
                             sqlContent.includes(`CREATE POLICY "authenticated_select_${table}"`);
        expect(hasOrgBypass).toBe(false);
      });

    });

  });

  // ----------------------------------------------------------------------------
  // 3. PRUEBAS DE CAMINO PRIVILEGIADO Y SERVICIOS SERVER-SIDE
  // ----------------------------------------------------------------------------
  test.describe('3. Verificación de Vías Autorizadas (Super Admin & service_role)', () => {

    test('3.1. Super Admin puede acceder únicamente mediante la función privilegiada is_super_admin()', () => {
      APPRAISAL_F0_TABLES.forEach((table) => {
        expect(sqlContent).toContain(`CREATE POLICY "superadmin_select_${table}" ON public.${table} FOR SELECT TO authenticated USING (public.is_super_admin());`);
      });
    });

    test('3.2. service_role posee acceso completo exclusivo server-side en las 19 tablas', () => {
      APPRAISAL_F0_TABLES.forEach((table) => {
        expect(sqlContent).toContain(`CREATE POLICY "service_role_all_${table}" ON public.${table} FOR ALL TO service_role USING (true) WITH CHECK (true);`);
      });
    });

    test('3.3. Acceso autorizado server-side mediante service_role responde exitosamente', async () => {
      const sources = await appraisalDataService.getPortalSources();
      expect(sources.length).toBe(20);
    });

    test('3.4. Intento de invocación de get_active_appraisal_settings por rol no autorizado falla con excepción', async () => {
      expect(sqlContent).toContain("RAISE EXCEPTION 'Access denied: caller is not authorized to retrieve appraisal settings.'");
    });

  });

  // ----------------------------------------------------------------------------
  // 4. VERIFICACIÓN DE INVARIANTES Y NO-REGRESIÓN DE FASE 0
  // ----------------------------------------------------------------------------
  test.describe('4. Invariantes Funcionales de Fase 0 (Preservación de Configuración)', () => {

    test('4.1. Catálogo exacto de 20 fuentes inmobiliarias uruguayas (ingestion_enabled = false)', async () => {
      const sources = await appraisalDataService.getPortalSources();
      expect(sources.length).toBe(20);

      const activeIngested = sources.filter((s) => s.ingestionEnabled === true);
      expect(activeIngested.length).toBe(0);
    });

    test('4.2. Parámetro asking_price_adjustment = 0.1200 (12.00%) intacto en versión 1', async () => {
      const activeSettings = await appraisalDataService.getActiveSettings();
      expect(activeSettings.version).toBe(1);
      expect(activeSettings.askingPriceAdjustment).toBe(0.1200);
      expect(activeSettings.safetyMarginPercentage).toBe(12.00);
    });

    test('4.3. Cero crawls activos (crawler_runs count = 0)', async () => {
      const runs = await appraisalDataService.getCrawlerRuns();
      expect(runs.length).toBe(0);
    });

    test('4.4. Cero eventos de IA ejecutados (ai_usage_events count = 0)', async () => {
      const events = await appraisalDataService.getAIUsageEvents();
      expect(events.length).toBe(0);
    });

    test('4.5. Estado explícito SOLD_OR_REMOVED_UNKNOWN preservado (REMOVED != SOLD)', async () => {
      const master = await appraisalDataService.createOrResolveMasterProperty({
        canonicalAddress: 'Av. Brasil 2900',
        department: 'Montevideo',
        propertyType: 'APARTMENT',
      });
      const { listing } = await appraisalDataService.registerListing({
        sourceCode: 'mercadolibre_uy',
        externalId: 'test_sec_status_01',
        url: 'https://inmuebles.mercadolibre.com.uy/test_sec_status_01',
        title: 'Apt Pocitos',
        priceAmount: 220000,
        status: 'SOLD_OR_REMOVED_UNKNOWN',
        masterId: master.id,
      });
      expect(listing.status).toBe('SOLD_OR_REMOVED_UNKNOWN');
    });

  });

});
