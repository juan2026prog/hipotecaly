// ==============================================================================
// TEST SUITE: SUPER ADMIN OPENAI VAULT ACTIVATION & MASTER SWITCH
// Verificación completa de seguridad, cifrado en Vault, RBAC, endpoints y UI
// ==============================================================================

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { openAiSecretResolver } from '../server/ai/openAiSecretResolver';
import { verifySuperAdmin } from '../server/auth/superAdminGuard';

test.describe('SUPER ADMIN — OPENAI VAULT & MASTER SWITCH SYSTEM', () => {

  // ----------------------------------------------------------------------------
  // 1. CONTROL DE ACCESO (RBAC) & PROTECCIÓN DE ENDPOINTS
  // ----------------------------------------------------------------------------
  test('1. RBAC: Rechaza solicitudes anónimas con 401 Unauthorized', async () => {
    const req = { headers: {} };
    const auth = await verifySuperAdmin(req);
    expect(auth.authorized).toBe(false);
    expect(auth.status).toBe(401);
  });

  test('2. RBAC: Rechaza solicitudes de usuarios no administradores con 403 Forbidden', async () => {
    const reqRegular = { headers: { authorization: 'Bearer regularuser-token' } };
    const authRegular = await verifySuperAdmin(reqRegular);
    expect(authRegular.authorized).toBe(false);
    expect(authRegular.status).toBe(403);
  });

  test('3. RBAC: Rechaza solicitudes de administradores de estudio/tenant con 403 Forbidden', async () => {
    const reqTenantAdmin = { headers: { authorization: 'Bearer tenantadmin-token' } };
    const authTenantAdmin = await verifySuperAdmin(reqTenantAdmin);
    expect(authTenantAdmin.authorized).toBe(false);
    expect(authTenantAdmin.status).toBe(403);
  });

  test('4. RBAC: Permite acceso a solicitudes autenticadas con rol SUPER_ADMIN', async () => {
    const reqSuperAdmin = { headers: { authorization: 'Bearer superadmin-valid-token' } };
    const authSuperAdmin = await verifySuperAdmin(reqSuperAdmin);
    expect(authSuperAdmin.authorized).toBe(true);
    expect(authSuperAdmin.adminId).toBeDefined();
  });

  // ----------------------------------------------------------------------------
  // 2. RESOLUCIÓN SEGURA Y ZERO EXPOSICIÓN DE CLAVES
  // ----------------------------------------------------------------------------
  test('5. Cero Exposición: getMetadata nunca retorna la clave en texto plano', async () => {
    openAiSecretResolver.setTestOverride('sk-mock-valid-test-key-for-superadmin-9876');

    const meta = await openAiSecretResolver.getMetadata();
    expect(meta.provider).toBe('openai');
    // Verifica que la clave está enmascarada
    expect(meta.maskedKey).toContain('••••');
    expect(meta.maskedKey?.slice(-4)).toBe('9876');

    // Comprueba que no existe ninguna propiedad con la clave completa
    expect((meta as any).apiKey).toBeUndefined();
    expect((meta as any).secret).toBeUndefined();
    expect((meta as any).decryptedSecret).toBeUndefined();

    openAiSecretResolver.invalidateCache();
  });

  test('6. Inyección de Clave y Caché: getOpenAiApiKey resuelve y cachea temporalmente', async () => {
    openAiSecretResolver.setTestOverride('sk-mock-valid-vault-key-abcde-1234');

    const key1 = await openAiSecretResolver.getOpenAiApiKey();
    expect(key1).toBe('sk-mock-valid-vault-key-abcde-1234');

    // Invalida la caché inmediatamente
    openAiSecretResolver.invalidateCache();

    // Tras invalidar, setea una nueva clave simulando rotación
    openAiSecretResolver.setTestOverride('sk-mock-valid-vault-key-abcde-5678');
    const key2 = await openAiSecretResolver.getOpenAiApiKey();
    expect(key2).toBe('sk-mock-valid-vault-key-abcde-5678');

    openAiSecretResolver.invalidateCache();
  });

  test('7. Falla Segura: Lanza AI_PROVIDER_UNAVAILABLE cuando no hay clave configurada', async () => {
    openAiSecretResolver.invalidateCache();
    const originalEnv = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      await expect(openAiSecretResolver.getOpenAiApiKey()).rejects.toThrow('AI_PROVIDER_UNAVAILABLE');
    } finally {
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      }
    }
  });

  // ----------------------------------------------------------------------------
  // 3. PRUEBAS DE INTERFAZ DE USUARIO (SUPER ADMIN UI EN /admin/ai)
  // ----------------------------------------------------------------------------
  test('8. UI Super Admin: Navegación, visualización de estado y Master Switch', async ({ page }) => {
    // Interceptar llamadas de administración
    await page.route('**/api/admin/ai/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          provider: 'openai',
          configured: true,
          active: true,
          maskedKey: '••••••••••••••••4F2A',
          lastTestedAt: new Date().toISOString(),
          lastTestStatus: 'PASS',
          lastTestMessage: 'Conexión verificada en Supabase Vault.',
          secretSource: 'vault',
          configuredModels: {
            extraction: 'gpt-4o-mini',
            reasoning: 'gpt-4o',
            deep: 'o3-mini',
          },
          modelsStatus: [
            { role: 'Extracción / OCR', model: 'gpt-4o-mini', accessible: true },
            { role: 'Razonamiento / Underwriting', model: 'gpt-4o', accessible: true },
            { role: 'Análisis Profundo', model: 'o3-mini', accessible: true },
          ],
          systemHealth: {
            supabaseConnected: true,
            vaultActive: true,
            memory3Available: true,
            walletCasosActive: true,
          },
        }),
      });
    });

    await page.route('**/api/admin/ai/test-connection', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          success: true,
          status: 'PASS',
          message: 'Conexión exitosa con OpenAI API.',
          testedAt: new Date().toISOString(),
          latencyMs: 125,
          models: [
            { role: 'Extracción / OCR', model: 'gpt-4o-mini', accessible: true },
            { role: 'Razonamiento / Underwriting', model: 'gpt-4o', accessible: true },
            { role: 'Análisis Profundo', model: 'o3-mini', accessible: true },
          ],
        }),
      });
    });

    await page.route('**/api/admin/ai/health-check', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          success: true,
          message: 'HIPOTECALY AI respondió correctamente.',
          reply: 'OK: HIPOTECALY AI CORE en línea y operativo.',
          model: 'gpt-4o-mini',
          tokens: { prompt: 18, completion: 8, total: 26 },
          costUsd: 0.00004,
          latencyMs: 135,
          testedAt: new Date().toISOString(),
        }),
      });
    });

    // 1. Navegar a /admin/ai
    await page.goto('/admin/ai');

    // 2. Verificar que la pestaña "Configuración OpenAI & Vault" está activa
    await expect(page.locator('text=HIPOTECALY AI — Administración Central')).toBeVisible();
    await expect(page.locator('text=PROVEEDOR DE INTELIGENCIA: OpenAI')).toBeVisible();

    // 3. Verificar estado en línea y clave enmascarada
    await expect(page.locator('text=● Conectado & Activo')).toBeVisible();
    await expect(page.locator('text=••••••••••••••••4F2A')).toBeVisible();

    // 4. Probar botón "Probar conexión"
    const testBtn = page.locator('button:has-text("Probar conexión")');
    await expect(testBtn).toBeVisible();
    await testBtn.click();
    await expect(page.locator('text=Conexión con OpenAI verificada con éxito.')).toBeVisible();

    // 5. Verificar estado de modelos
    await expect(page.locator('text=gpt-4o-mini').first()).toBeVisible();
    await expect(page.locator('text=gpt-4o').first()).toBeVisible();
    await expect(page.locator('text=o3-mini').first()).toBeVisible();

    // 6. Probar botón "EJECUTAR PRUEBA AI" (Health Check sin descontar CASOS)
    const healthCheckBtn = page.locator('button:has-text("EJECUTAR PRUEBA AI")');
    await expect(healthCheckBtn).toBeVisible();
    await healthCheckBtn.click();
    await expect(page.locator('text=HIPOTECALY AI respondió correctamente.')).toBeVisible();
    await expect(page.locator('text=0 CASOS descontados')).toBeVisible();
  });

  // ----------------------------------------------------------------------------
  // 4. DEGRADACIÓN CONTROLADA: CASO CUANDO AI ESTÁ DESACTIVADA
  // ----------------------------------------------------------------------------
  test('9. Degradación: Si AI está desactivada, muestra aviso informativo sin romper el expediente', async ({ page }) => {
    // Interceptar ai_provider_settings simulando ai_enabled: false
    await page.route('**/rest/v1/ai_provider_settings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ provider: 'openai', ai_enabled: false, is_configured: true }]),
      });
    });

    // Navegar al expediente de prueba
    await page.goto('/app/solicitudes/e0000000-0000-0000-0000-000000000001');

    // Abrir pestaña HIPOTECALY AI
    const aiTab = page.locator('button:has-text("HIPOTECALY AI")');
    await expect(aiTab).toBeVisible();
    await aiTab.click();

    // Debe mostrar el mensaje amigable
    await expect(page.locator('text=HIPOTECALY AI no está disponible temporalmente.')).toBeVisible();
    await expect(page.locator('text=El resto de las funcionalidades del expediente')).toBeVisible();

    // Verificar que el resto del expediente funciona normalmente (los encabezados del expediente siguen visibles)
    await expect(page.locator('text=María López')).toBeVisible();
  });

  // ----------------------------------------------------------------------------
  // 5. ESCANEO DE SEGURIDAD: CERO FUGAS EN ARCHIVOS DE PRODUCCIÓN
  // ----------------------------------------------------------------------------
  test('10. Auditoría de Bundle: Cero claves de OpenAI ni secretos en el cliente', async () => {
    const dir = 'dist/assets';

    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.js'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        expect(content).not.toContain('OPENAI_API_KEY');
        expect(content).not.toContain('service_role');
        const realSk = content.match(/\bsk-(proj-)?[A-Za-z0-9]{30,}\b/);
        expect(realSk).toBeNull();
      }
    }
  });

});
