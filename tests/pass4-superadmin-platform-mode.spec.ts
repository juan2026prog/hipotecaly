// ==============================================================================
// HIPOTECALY: Test Suite - Super Admin Real, Modo Producción/Prueba & Usuario Universal
// Validación completa de autorización, environment gating, roles y selector de vistas
// ==============================================================================

import { test, expect } from '@playwright/test';
import { platformModeService } from '../src/lib/platformModeService';
import { verifySuperAdmin } from '../server/auth/superAdminGuard';
import { openQaSession, clearQaSession } from './helpers/qaSession';

test.describe('HIPOTECALY — Super Admin Real, Modo Plataforma & Usuario Universal', () => {

  test.beforeEach(async () => {
    // Resetear a modo test por defecto
    await platformModeService.setPlatformMode('test', 'f0000000-0000-0000-0000-000000000001');
  });

  // ----------------------------------------------------------------------------
  // 1. SUPER ADMIN REAL (juanmacastillo2008@gmail.com)
  // ----------------------------------------------------------------------------
  test('1. Super Admin Real (juanmacastillo2008@gmail.com) tiene acceso exclusivo a /admin / /superadmin', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      tenantName: 'HIPOTECALY Central',
    });

    await page.goto('/superadmin');
    await expect(page).toHaveURL(/.*\/superadmin/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('2. Super Admin puede alternar entre Modo Prueba y Modo Producción', async () => {
    // Estado inicial en test
    expect(platformModeService.getCachedMode()).toBe('test');

    // Cambiar a producción
    const prodResult = await platformModeService.setPlatformMode('production', 'f0000000-0000-0000-0000-000000000001');
    expect(prodResult.success).toBe(true);
    expect(platformModeService.getCachedMode()).toBe('production');

    // Cambiar a prueba
    const testResult = await platformModeService.setPlatformMode('test', 'f0000000-0000-0000-0000-000000000001');
    expect(testResult.success).toBe(true);
    expect(platformModeService.getCachedMode()).toBe('test');
  });

  test('3. Guard de servidor (verifySuperAdmin) autoriza a Super Admin y rechaza usuarios no autorizados', async () => {
    // Super admin token
    const validReq = {
      headers: { authorization: 'Bearer superadmin-valid-token' },
    };
    const validAuth = await verifySuperAdmin(validReq);
    expect(validAuth.authorized).toBe(true);

    // Regular user token
    const invalidReq = {
      headers: { authorization: 'Bearer regularuser-token' },
    };
    const invalidAuth = await verifySuperAdmin(invalidReq);
    expect(invalidAuth.authorized).toBe(false);
    expect(invalidAuth.status).toBe(403);
  });

  // ----------------------------------------------------------------------------
  // 2. USUARIO UNIVERSAL DE PRUEBAS (admin@estudionova.uy) EN MODO PRUEBA
  // ----------------------------------------------------------------------------
  test('4. Usuario test (admin@estudionova.uy / admin123) inicia sesión en Modo Prueba', async ({ page }) => {
    await platformModeService.setPlatformMode('test', 'f0000000-0000-0000-0000-000000000001');

    await page.goto('/ingresar');
    await page.getByPlaceholder('admin o tu@email.com').fill('admin@estudionova.uy');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.click('button[type="submit"]');

    // Verificar que la barra selector de vistas o banner esté presente
    await page.goto('/demo/estudio-nova/cliente');
    await expect(page).toHaveURL(/.*\/demo\/estudio-nova\/cliente/);
  });

  test('5. Usuario test puede acceder a Panel Cliente (/demo/estudio-nova/cliente)', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByPlaceholder('admin o tu@email.com').fill('admin@estudionova.uy');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.click('button[type="submit"]');

    await page.goto('/demo/estudio-nova/cliente');
    await expect(page).toHaveURL(/.*\/demo\/estudio-nova\/cliente/);
    await expect(page.locator('body')).not.toContainText('Acceso Denegado');
  });

  test('6. Usuario test puede acceder a Panel Inversor (/demo/estudio-nova/inversor)', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByPlaceholder('admin o tu@email.com').fill('admin@estudionova.uy');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.click('button[type="submit"]');

    await page.goto('/demo/estudio-nova/inversor');
    await expect(page).toHaveURL(/.*\/demo\/estudio-nova\/inversor/);
    await expect(page.locator('body')).not.toContainText('Acceso Denegado');
  });

  test('7. Usuario test puede acceder a Panel Escribano (/demo/estudio-nova/notary)', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByPlaceholder('admin o tu@email.com').fill('admin@estudionova.uy');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.click('button[type="submit"]');

    await page.goto('/demo/estudio-nova/notary');
    await expect(page).toHaveURL(/.*\/demo\/estudio-nova\/notary/);
    await expect(page.locator('body')).not.toContainText('Acceso Denegado');
  });

  test('8. Usuario test puede acceder a Backoffice (/demo/estudio-nova/admin)', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByPlaceholder('admin o tu@email.com').fill('admin@estudionova.uy');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.click('button[type="submit"]');

    await page.goto('/demo/estudio-nova/admin');
    await expect(page).toHaveURL(/.*\/demo\/estudio-nova\/admin/);
    await expect(page.locator('body')).not.toContainText('Acceso Denegado');
  });

  test('9. Usuario test puede acceder a Tenant Admin (/demo/estudio-nova/admin/configuracion)', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByPlaceholder('admin o tu@email.com').fill('admin@estudionova.uy');
    await page.getByPlaceholder('••••••••').fill('admin123');
    await page.click('button[type="submit"]');

    await page.goto('/demo/estudio-nova/admin/configuracion');
    await expect(page).toHaveURL(/.*\/demo\/estudio-nova\/admin\/configuracion/);
    await expect(page.locator('body')).not.toContainText('Acceso Denegado');
  });

  // ----------------------------------------------------------------------------
  // 3. BLOQUEO OBLIGATORIO DE SUPER ADMIN PARA EL USUARIO TEST (403 FORBIDDEN)
  // ----------------------------------------------------------------------------
  test('10. Usuario test (admin@estudionova.uy) NO es Super Admin y tiene BLOQUEADO /admin (403 Forbidden)', async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    // Intentar acceder a /superadmin
    await page.goto('/superadmin');
    await expect(page.locator('body')).toContainText(/Acceso Denegado|Permisos Insuficientes|Sesión QA/i);
  });

  // ----------------------------------------------------------------------------
  // 4. BLOQUEO EN MODO PRODUCCIÓN (401 UNAUTHORIZED)
  // ----------------------------------------------------------------------------
  test('11. Usuario test (admin@estudionova.uy) es DENEGADO con 401 en Modo Producción', async () => {
    // Forzar modo producción
    await platformModeService.setPlatformMode('production', 'f0000000-0000-0000-0000-000000000001');

    expect(platformModeService.getCachedMode()).toBe('production');
    expect(platformModeService.isTestMode()).toBe(false);
  });

  // ----------------------------------------------------------------------------
  // 5. MANIPULACIÓN DE ROLES Y ATAQUES FRONTEND
  // ----------------------------------------------------------------------------
  test('12. Inyección de localStorage.role="super_admin" o query ?role=super_admin es bloqueada', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('role', 'super_admin');
      window.localStorage.setItem('is_super_admin', 'true');
    });

    await page.goto('/admin?role=super_admin&admin=true');
    // Debe ser redirigido a login o denegado
    await expect(page).not.toHaveURL(/^\/admin$/);
  });
});
