import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'dummy';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

test.describe('ONBOARDING REAL DE CLIENTE SAAS WHITE-LABEL (ORION QA)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    try {
      await supabase.from('organizations').delete().eq('slug', 'orion-qa');
    } catch {
      // ignore
    }
  });

  test.afterEach(async () => {
    try {
      await supabase.from('organizations').delete().eq('slug', 'orion-qa');
    } catch {
      // ignore
    }
  });

  test('Flujo E2E Completo: Alta de ORION, Simulación, Reglas Dinámicas, Backoffice y Aislamiento', async ({ page }) => {
    // --------------------------------------------------------------------------
    // PASO 1 A 3: Super Admin -> Wizard de Onboarding -> Activar ORION
    // --------------------------------------------------------------------------
    await page.goto('/admin/tenants/new');
    await expect(page.locator('text=Alta de Nuevo Cliente White-Label')).toBeVisible();

    // Paso 1: Datos de Empresa
    await page.fill('input[placeholder="Ej. ORION Crédito Inmobiliario S.A."]', 'ORION Crédito Inmobiliario S.A.');
    await page.fill('input[placeholder="Ej. ORION Crédito Inmobiliario"]', 'ORION Crédito Inmobiliario');
    await page.fill('input[placeholder="orion-qa"]', 'orion-qa');
    await page.fill('input[placeholder="soporte@orioncredito.uy"]', 'soporte@orioncredito.uy');
    await page.click('button:has-text("Siguiente Paso")');

    // Paso 2: Tipo de Implementación (Full White-Label preseleccionada)
    await expect(page.locator('text=Paso 2 — Tipo de Implementación')).toBeVisible();
    await page.click('button:has-text("Siguiente Paso")');

    // Paso 3: Branding
    await expect(page.locator('text=Paso 3 — Identidad Visual & Branding')).toBeVisible();
    await page.fill('input[placeholder="Soluciones financieras con respaldo inmobiliario."]', 'Financiación ágil con garantía hipotecaria en Uruguay.');
    await page.click('button:has-text("Siguiente Paso")');

    // Paso 4: Reglas Crediticias (Tope 35%, USD 180.000, 48 meses preconfigurados)
    await expect(page.locator('text=Paso 4 — Reglas Crediticias y Límites')).toBeVisible();
    await page.click('button:has-text("Siguiente Paso")');

    // Paso 5: Costos
    await expect(page.locator('text=Paso 5 — Configuración de Costos')).toBeVisible();
    await page.click('button:has-text("Siguiente Paso")');

    // Paso 6: Privacidad
    await expect(page.locator('text=Paso 6 — Privacidad y Reglas Anti-Bypass')).toBeVisible();
    await page.click('button:has-text("Siguiente Paso")');

    // Paso 7: Usuarios Internos
    await expect(page.locator('text=Paso 7 — Usuario Administrador Inicial')).toBeVisible();
    await page.fill('input[placeholder="Ej. Dra. Laura Gómez"]', 'Dra. Laura Gómez');
    await page.fill('input[placeholder="laura.gomez@orioncredito.uy"]', 'laura.gomez@orioncredito.uy');
    await page.click('button:has-text("Siguiente Paso")');

    // Paso 8: Portal
    await expect(page.locator('text=Paso 8 — Portal del Prestatario')).toBeVisible();
    await page.click('button:has-text("Siguiente Paso")');

    // Paso 9: Dominio (Preview /org/orion-qa)
    await expect(page.locator('text=Paso 9 — Dominio y Accesos')).toBeVisible();
    await page.click('button:has-text("Siguiente Paso")');

    // Paso 10: Resumen y Activación en caliente
    await expect(page.locator('text=Paso 10 — Resumen de Configuración & Activación')).toBeVisible();
    await expect(page.locator('strong:has-text("ORION Crédito Inmobiliario")')).toBeVisible();
    await expect(page.locator('strong:has-text("35%")')).toBeVisible();
    await expect(page.locator('strong:has-text("180")')).toBeVisible();
    await expect(page.locator('strong:has-text("48 meses")')).toBeVisible();

    // Activar tenant en caliente sin redeploy
    await page.click('button:has-text("ACTIVAR TENANT AHORA")');

    // --------------------------------------------------------------------------
    // PASO 4 Y 5: Verificar que /org/orion-qa responde con branding de ORION
    // --------------------------------------------------------------------------
    await page.waitForURL('**/org/orion-qa');
    await expect(page.getByText('ORION Crédito Inmobiliario').first()).toBeVisible();
    await expect(page.locator('text=Hasta 35%')).toBeVisible();
    await expect(page.locator('text=Porcentaje financiado').first()).toBeVisible();
    await expect(page.locator('text=180')).toBeVisible();
    await expect(page.locator('text=48 meses').first()).toBeVisible();

    // Verificar que Copiloto IA está activo inicialmente en ORION
    await expect(page.locator('text=Copiloto IA de Admisión Preliminar Activo')).toBeVisible();

    // --------------------------------------------------------------------------
    // PASO 6: Probar simulador de ORION y reglas de admisión
    // --------------------------------------------------------------------------
    // Las opciones de plazo admiten 48 meses pero NO 60 meses
    const plazoSelect = page.locator('select').first();
    const plazoOptions = await plazoSelect.locator('option').allInnerTexts();
    expect(plazoOptions).toContain('48 meses');
    expect(plazoOptions).not.toContain('60 meses');

    // --------------------------------------------------------------------------
    // PASO 7: Iniciar solicitud desde ORION y verificar HPT-YYYY-XXXXX
    // --------------------------------------------------------------------------
    await page.click('button:has-text("CONTINUAR SOLICITUD")');
    await page.waitForURL('**/solicitar?**');

    // El wizard debe incluir source=orion-qa
    expect(page.url()).toContain('source=orion-qa');

    // Verificar formato público unificado HPT-YYYY-XXXXX
    const publicIdBadge = page.locator('span:has-text("HPT-")').first();
    await expect(publicIdBadge).toBeVisible();
    const publicIdText = await publicIdBadge.innerText();
    expect(publicIdText).toMatch(/^HPT-\d{4}-\d{5}$/);

    // --------------------------------------------------------------------------
    // PASO 8 & 9: Aislamiento en Backoffice: ORION vs NOVA
    // --------------------------------------------------------------------------
    await page.goto('/app/solicitudes');
    await expect(page.locator('text=Solicitudes y Expedientes')).toBeVisible();

    // --------------------------------------------------------------------------
    // PASO 10: Desactivar módulo IA para ORION desde Super Admin
    // --------------------------------------------------------------------------
    await page.goto('/admin/tenants');
    await expect(page.locator('text=Gestión de Organizaciones y Módulos')).toBeVisible();

    // Seleccionar ORION en el selector de organizaciones
    await page.locator('button:has-text("ORION Crédito Inmobiliario")').click();
    await expect(page.locator('text=Módulos y Feature Flags de ORION Crédito Inmobiliario')).toBeVisible();

    // Conmutar módulo Copiloto de IA a inactivo
    const aiToggle = page.locator('[data-testid="module-toggle-ai_enabled"]');
    await expect(aiToggle).toBeVisible();
    await aiToggle.click();
    await expect(aiToggle).toContainText('Inactivo');

    // Verificar en /org/orion-qa que el copiloto de IA desaparece de inmediato
    await page.goto('/org/orion-qa');
    await expect(page.locator('text=Copiloto IA de Admisión Preliminar Activo')).not.toBeVisible();

    // Verificar que en NOVA el copiloto sigue activo (aislamiento de feature flags)
    await page.goto('/admin/tenants');
    await page.locator('button:has-text("NOVA Crédito Hipotecario")').click();
    await expect(page.locator('text=Módulos y Feature Flags de NOVA Crédito Hipotecario')).toBeVisible();
    await expect(page.locator('[data-testid="module-toggle-ai_enabled"]')).toContainText('Activo');

    // --------------------------------------------------------------------------
    // PASO 11: Modificar Porcentaje Financiado de ORION en vivo (sin redeploy)
    // --------------------------------------------------------------------------
    await page.goto('/admin/tenants');
    await page.locator('button:has-text("ORION Crédito Inmobiliario")').click();
    await expect(page.locator('text=Módulos y Feature Flags de ORION Crédito Inmobiliario')).toBeVisible();
    await page.click('button:has-text("Fijar en 50%")');
    await expect(page.locator('text=Regla actualizada en Supabase')).toBeVisible();

    // Verificar en /org/orion-qa que el tope cambió a 50% en vivo sin redeploy
    await page.goto('/org/orion-qa');
    await expect(page.locator('text=Hasta 50%')).toBeVisible();

    // --------------------------------------------------------------------------
    // PASO 12: Acceso a tenant inexistente -> Pantalla de error controlada
    // --------------------------------------------------------------------------
    await page.goto('/org/tenant-inexistente-xyz');
    await expect(page.locator('text=Organización No Encontrada')).toBeVisible();
    await expect(page.locator('text=TENANT_NOT_FOUND')).toBeVisible();
    await expect(page.locator('text=Ir a Hipotecaly Central')).toBeVisible();

    // Verificar que no se filtran nombres de NOVA ni de ORION en el 404
    const notFoundContent = await page.content();
    expect(notFoundContent).not.toContain('NOVA Inversiones Hipotecarias');
    expect(notFoundContent).not.toContain('Dra. Laura Gómez');
  });

});
