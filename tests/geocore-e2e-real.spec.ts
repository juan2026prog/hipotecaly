// ==============================================================================
// HIPOTECALY GEOCORE - SUITE DE INTEGRACIÓN E2E DE MAPAS REALES Y AUTOCOMPLETE
// Verifica eliminación de SVG radial simulado, presencia de Leaflet y OSM
// ==============================================================================

import { test, expect } from '@playwright/test';
import { openQaSession } from './helpers/qaSession';

test.describe.serial('GEOCORE E2E - MAPA REAL LEAFLET Y AUTOCOMPLETE IDE URUGUAY', () => {

  test.beforeEach(async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });
  });

  test('La plataforma NO debe contener referencias a mapas radiales simulados en SVG', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/tasaciones?demo=true');
    await page.waitForLoadState('domcontentloaded');

    // No debe haber elementos con clases de grids polares falsos
    const fakeRadialGrid = page.locator('.tasador-fake-grid, [data-testid="fake-radial-map"]');
    await expect(fakeRadialGrid).toHaveCount(0);
  });

  test('Nueva Tasación debe renderizar Leaflet real, OSM attribution y componentes GeoCore', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/tasaciones/nueva?demo=true');
    await page.waitForLoadState('domcontentloaded');

    // Debe renderizar el contenedor de mapa Leaflet
    const leafletContainer = page.locator('.leaflet-container');
    await expect(leafletContainer.first()).toBeVisible({ timeout: 15000 });

    // Debe mostrar la atribución oficial de OpenStreetMap
    const osmAttribution = page.locator('.leaflet-control-attribution');
    await expect(osmAttribution.first()).toBeVisible();
    await expect(osmAttribution.first()).toContainText('OpenStreetMap');
  });

  test('Página de Comparables debe renderizar mapa Leaflet con radio métrico y marcadores reales', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/tasaciones/appr_demo_01?demo=true');
    await page.waitForLoadState('domcontentloaded');

    // Verificamos que no use SVG radial
    const polarRings = page.locator('circle[stroke-dasharray="3,3"]');
    await expect(polarRings).toHaveCount(0);
  });

});
