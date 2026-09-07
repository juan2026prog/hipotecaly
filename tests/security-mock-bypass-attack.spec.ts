import { test, expect } from '@playwright/test';

// Ejecutar ataques contra entorno productivo
const TARGET_URL = process.env.BASE_URL || 'https://hipotecaly.vercel.app';

test.describe('HIPOTECALY — Verificación de Microcierre de Seguridad (Ataques Mock Bypass)', () => {

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('Ataque 1: Inyección de hipotecaly_test_role=super_admin en /admin debe ser DENEGADO / REDIRIGIDO', async ({ page }) => {
    // Inyectar ataque en localStorage antes de cargar la página
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'super_admin');
    });

    await page.goto(`${TARGET_URL}/admin`);

    // En producción, debe redirigir a /ingresar sin dar acceso a la consola Super Admin
    await expect(page).toHaveURL(/.*\/ingresar/);
    await expect(page.locator('text=Ingresar a tu cuenta').first()).toBeVisible();
    await expect(page.locator('text=Consola Maestra Super Admin')).not.toBeVisible();
  });

  test('Ataque 2: Inyección de hipotecaly_test_role=tenant_admin en /demo/estudio-nova/admin debe ser DENEGADO / REDIRIGIDO', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto(`${TARGET_URL}/demo/estudio-nova/admin`);

    await expect(page).toHaveURL(/.*\/ingresar/);
    await expect(page.locator('text=Ingresar a tu cuenta').first()).toBeVisible();
  });

  test('Ataque 3: Inyección de hipotecaly_test_role=lender en /demo/estudio-nova/inversor debe ser DENEGADO / REDIRIGIDO', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'lender');
    });

    await page.goto(`${TARGET_URL}/demo/estudio-nova/inversor`);

    await expect(page).toHaveURL(/.*\/ingresar/);
    await expect(page.locator('text=Ingresar a tu cuenta').first()).toBeVisible();
  });

  test('Ataque 4: Inyección de hipotecaly_test_role=borrower en /demo/estudio-nova/cliente debe ser DENEGADO / REDIRIGIDO', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'borrower');
    });

    await page.goto(`${TARGET_URL}/demo/estudio-nova/cliente`);

    await expect(page).toHaveURL(/.*\/ingresar/);
    await expect(page.locator('text=Ingresar a tu cuenta').first()).toBeVisible();
  });

  test('Aislamiento Cross-Tenant: Inyección de rol local no permite acceso a otros tenants', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto(`${TARGET_URL}/demo/inmo-alpha/admin`);

    await expect(page).toHaveURL(/.*\/ingresar/);
  });

  test('Hub de Accesos Demo (/demo/estudio-nova/accesos) permanece público y navegable sin auth', async ({ page }) => {
    await page.goto(`${TARGET_URL}/demo/estudio-nova/accesos`);
    await expect(page.locator('text=HIPOTECALY').first()).toBeVisible();
    await expect(page.locator('text=Demo · Estudio Nova').first()).toBeVisible();
    await expect(page.locator('text=Sitio público').first()).toBeVisible();
    await expect(page.locator('text=Super Admin').first()).toBeVisible();
  });

});
