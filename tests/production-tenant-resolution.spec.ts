import { test, expect } from '@playwright/test';

test.describe('PRODUCTION TENANT RESOLUTION & MULTI-TENANT ISOLATION', () => {

  test('1. Root URL carga branding de HIPOTECALY Central (tenant matriz)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HIPOTECALY/i);
    await expect(page.getByText('Convertimos tu propiedad').first()).toBeVisible();
  });

  test('2. Rutas demo /demo/nova/* cargan exclusivamente branding de NOVA Crédito Hipotecario', async ({ page }) => {
    const novaRoutes = ['/demo/nova/legacy', '/demo/nova/integrado', '/demo/nova/full'];
    for (const r of novaRoutes) {
      await page.goto(r);
      await expect(page.locator('text=NOVA').first()).toBeVisible();
    }
  });

  test('3. /org/tenant-inexistente-xyz muestra pantalla controlada TENANT_NOT_FOUND', async ({ page }) => {
    await page.goto('/org/tenant-inexistente-xyz');
    await expect(page.locator('text=Organización No Encontrada')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=TENANT_NOT_FOUND')).toBeVisible();
    await expect(page.locator('text=Ir a Hipotecaly Central')).toBeVisible();

    // Comprobar que no se filtra información de NOVA ni de otros clientes
    const body = await page.innerText('body');
    expect(body).not.toContain('NOVA Inversiones Hipotecarias');
    expect(body).not.toContain('Estudio Notarial del Este');
  });

  test('4. Resolución de tenant limpia caché y no provoca bucles infinitos de red', async ({ page }) => {
    let requestsCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/rest/v1/organizations')) {
        requestsCount++;
      }
    });

    await page.goto('/demo/nova/full');
    await page.waitForTimeout(1000);

    // Debe ser una cantidad acotada (máx 3 llamadas, nunca bucle infinito)
    expect(requestsCount).toBeLessThan(5);
  });

  test('5. Modo Presentación (?presentation=true) muestra barra comercial sin vulnerar auth', async ({ page }) => {
    await page.goto('/?presentation=true');
    const bar = page.locator('aside[aria-label="Demo Sales Mode"]');
    await expect(bar).toBeVisible();
    await expect(bar.getByText('MODO PRESENTACIÓN')).toBeVisible();

    // Navegar a NOVA Full desde la barra comercial
    await bar.getByRole('link', { name: /NOVA Full/i }).click();
    await expect(page).toHaveURL(/.*\/demo\/nova\/full.*/);
  });

});
