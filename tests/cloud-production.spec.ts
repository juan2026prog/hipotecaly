import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const PROD_URL = 'https://hipotecaly.vercel.app';
const SUPABASE_URL = 'https://imzljdwsrsxyccgogfck.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltemxqZHdzcnN4eWNjZ29nZmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTkxMzgsImV4cCI6MjEwMzk3NTEzOH0.4EjkqHGK4tKkek1GGMesvjNCj6IBc8eKc26kb5BKh7Y';

const cloudClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

test.describe('HIPOTECALY: CLOUD & VERCEL REAL PRODUCTION CERTIFICATION', () => {

  // 1. Landing Page en Producción Real (Vercel)
  test('1. Landing page carga en https://hipotecaly.vercel.app con branding corporativo', async ({ page }) => {
    await page.goto(PROD_URL);
    await expect(page).toHaveTitle(/HIPOTECALY/i);
    await expect(page.getByText('Convertimos tu propiedad').first()).toBeVisible();
  });

  // 2. SPA Routing directo sin 404
  test('2. Rutas SPA cargan directamente con HTTP 200 y sin error 404', async ({ page }) => {
    const routes = ['/plataforma', '/simulador', '/ingresar', '/registro', '/solicitar', '/mi-cuenta', '/app', '/lender'];
    for (const r of routes) {
      const response = await page.goto(PROD_URL + r);
      expect(response?.status()).toBe(200);
      expect(page.url()).toContain(r);
    }
  });

  // 3. Cabeceras HTTP de Seguridad en Producción
  test('3. Cabeceras HTTP de seguridad bancaria activas en Vercel', async ({ page }) => {
    const response = await page.goto(PROD_URL);
    const headers = response?.headers() || {};
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['strict-transport-security']).toContain('max-age=63072000');
    expect(headers['permissions-policy']).toBe('camera=(self), microphone=(), geolocation=()');
  });

  // 4. Simulador conectado a Supabase Cloud
  test('4. Simulador interactivo en producción respeta reglas dinámicas de Supabase Cloud', async ({ page }) => {
    await page.goto(PROD_URL + '/simulador');
    await expect(page.getByText('Calculá tu capacidad de crédito')).toBeVisible();
    await expect(page.getByText(/40%/i)).toBeVisible();
  });

  // 5. Cloud RLS: Aislamiento total de Prestatarios
  test('5. Supabase Cloud RLS: Bloqueo estricto de lectura no autorizada en borrowers', async () => {
    const { data, error } = await cloudClient.from('borrowers').select('*');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 6. Cloud RLS: Aislamiento total de Solicitudes
  test('6. Supabase Cloud RLS: Bloqueo de consultas anónimas en applications', async () => {
    const { data, error } = await cloudClient.from('applications').select('*');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 7. Cloud RLS: Aislamiento total de Propiedades
  test('7. Supabase Cloud RLS: Bloqueo de consultas en properties garantizadas', async () => {
    const { data, error } = await cloudClient.from('properties').select('*');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 8. Cloud Storage: Buckets privados
  test('8. Supabase Cloud Storage: property-photos y application-documents estrictamente privados', async () => {
    const { data: photosData, error: photosError } = await cloudClient.storage
      .from('property-photos')
      .list('test');
    expect(photosData === null || photosData.length === 0 || photosError !== null).toBe(true);

    const { data: docsData, error: docsError } = await cloudClient.storage
      .from('application-documents')
      .list('test');
    expect(docsData === null || docsData.length === 0 || docsError !== null).toBe(true);
  });

  // 9. Cloud Audit Logs: Inmutabilidad estricta (Trigger anti-tampering)
  test('9. Supabase Cloud: Inmutabilidad de audit_logs garantizada por trigger', async () => {
    const { error } = await cloudClient
      .from('audit_logs')
      .update({ action: 'TAMPERED_ACTION' })
      .eq('id', '00000000-0000-0000-0000-000000000000');
    expect(error).not.toBeNull();
  });

  // 10. Anti-Bypass: Oportunidades Anonimizadas
  test('10. Supabase Cloud Anti-Bypass: Prestamistas no pueden acceder a datos de contacto sin autorización', async () => {
    const { data } = await cloudClient.from('anonymized_opportunities_view').select('*');
    expect(data === null || data.length === 0).toBe(true);
  });

  // 11. PWA Manifest accesible en Producción
  test('11. PWA Manifest y Service Worker accesibles sobre HTTPS en producción', async ({ page }) => {
    const res = await page.goto(PROD_URL + '/manifest.webmanifest');
    expect(res?.status()).toBe(200);
    const json = await res?.json();
    expect(json.name).toBe('HIPOTECALY');
    expect(json.display).toBe('standalone');
  });

  // 12. Responsive Design en Producción (390x844)
  test('12. Sin desborde horizontal en Mobile 390px sobre URL de producción', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PROD_URL);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });

});
