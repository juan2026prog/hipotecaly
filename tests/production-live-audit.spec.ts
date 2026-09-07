import { test, expect } from '@playwright/test';

const LIVE_BASE = 'https://hipotecaly.vercel.app';

test.describe('HIPOTECALY — Verificación Real en Producción Vercel (Desktop)', () => {
  test.use({ baseURL: LIVE_BASE, viewport: { width: 1280, height: 720 } });

  test('1. Hub de Accesos Demo (/demo/estudio-nova/accesos)', async ({ page }) => {
    const response = await page.goto('/demo/estudio-nova/accesos', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('text=HIPOTECALY').first()).toBeVisible();
    await expect(page.locator('text=Demo · Estudio Nova').first()).toBeVisible();
    await expect(page.locator('text=Recorré la plataforma desde la perspectiva de cada usuario').first()).toBeVisible();
    await expect(page.locator('text=Sitio público').first()).toBeVisible();
    await expect(page.locator('text=Portal del solicitante').first()).toBeVisible();
    await expect(page.locator('text=Equipo Estudio Nova').first()).toBeVisible();
    await expect(page.locator('text=Red privada de inversores').first()).toBeVisible();
    await expect(page.locator('text=Super Admin').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/prod-desktop-hub.png', fullPage: true });

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('text=HIPOTECALY').first()).toBeVisible();
  });

  test('2. Super Admin (/admin) - Desautenticado redirige a login', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/ingresar/);
    await expect(page.locator('text=Ingresar a tu cuenta').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/prod-desktop-admin-redirect.png' });
  });

  test('3. Portal Cliente (/demo/estudio-nova/cliente) - Con login demo carga TenantClientLayout', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'borrower');
    });
    await page.goto('/demo/estudio-nova/cliente', { waitUntil: 'networkidle' });
    await expect(page.locator('header').locator('text=ESTUDIO NOVA').first()).toBeVisible();
    await expect(page.locator('text=Mi financiación').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/prod-desktop-cliente.png' });
  });

  test('4. Backoffice Nova (/demo/estudio-nova/admin)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });
    await page.goto('/demo/estudio-nova/admin', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Estudio Nova').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/prod-desktop-backoffice.png' });
  });

  test('5. Backoffice Configuración (/demo/estudio-nova/admin/configuracion)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });
    await page.goto('/demo/estudio-nova/admin/configuracion', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Estudio Nova').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/prod-desktop-configuracion.png' });
  });

  test('6. Red de Inversores (/demo/estudio-nova/inversor)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'lender');
    });
    await page.goto('/demo/estudio-nova/inversor', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Red Privada de Inversores').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/prod-desktop-inversor.png' });
  });
});

test.describe('HIPOTECALY — Verificación Real en Producción Vercel (Mobile 390px)', () => {
  test.use({ baseURL: LIVE_BASE, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('7. Mobile: Hub de Accesos (/demo/estudio-nova/accesos)', async ({ page }) => {
    await page.goto('/demo/estudio-nova/accesos', { waitUntil: 'networkidle' });
    await expect(page.locator('text=HIPOTECALY').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/prod-mobile-hub.png' });
  });

  test('8. Mobile: Portal Cliente (/demo/estudio-nova/cliente)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'borrower');
    });
    await page.goto('/demo/estudio-nova/cliente', { waitUntil: 'networkidle' });
    await expect(page.locator('text=ESTUDIO NOVA').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/prod-mobile-cliente.png' });
  });

  test('9. Mobile: Backoffice (/demo/estudio-nova/admin)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });
    await page.goto('/demo/estudio-nova/admin', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Estudio Nova').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/prod-mobile-backoffice.png' });
  });

  test('10. Mobile: Red de Inversores (/demo/estudio-nova/inversor)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'lender');
    });
    await page.goto('/demo/estudio-nova/inversor', { waitUntil: 'networkidle' });
    await expect(page.locator('text=Red Privada de Inversores').first()).toBeVisible();
    await page.screenshot({ path: 'test-results/prod-mobile-inversor.png' });
  });
});
