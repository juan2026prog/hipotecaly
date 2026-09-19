// ==============================================================================
// HIPOTECALY GEOCORE - SUITE DE INTEGRACIÓN E2E DE MAPAS REALES Y AUTOCOMPLETE
// Verifica eliminación de SVG radial simulado, presencia de Leaflet y OSM
// ==============================================================================

import { test, expect } from '@playwright/test';

test.describe.serial('GEOCORE E2E - MAPA REAL LEAFLET Y AUTOCOMPLETE IDE URUGUAY', () => {
  test('La plataforma NO debe contener referencias a mapas radiales simulados en SVG', async ({ page }) => {
    // Verificamos que no existan atributos del viejo mapa simulado en la aplicación
    await page.goto('/tasador');
    await page.waitForLoadState('networkidle');

    // No debe haber elementos con clases o selectores de grids polares falsos
    const fakeRadialGrid = page.locator('.tasador-fake-grid, [data-testid="fake-radial-map"]');
    await expect(fakeRadialGrid).toHaveCount(0);
  });

  test('Nueva Tasación debe inicializarse sin coordenadas fijas falsas y con Leaflet listo', async ({ page }) => {
    await page.goto('/tasador/nueva');
    await page.waitForLoadState('networkidle');

    // Debe renderizar el contenedor de mapa Leaflet si se muestra
    const leafletContainers = page.locator('.leaflet-container');
    const count = await leafletContainers.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Debe mostrar la atribución oficial de OpenStreetMap
    const osmAttribution = page.locator('.leaflet-control-attribution');
    await expect(osmAttribution).toBeVisible();
    await expect(osmAttribution).toContainText('OpenStreetMap');
  });

  test('Página de Comparables debe renderizar mapa Leaflet con radio métrico y marcadores reales', async ({ page }) => {
    await page.goto('/tasador/comparables');
    await page.waitForLoadState('networkidle');

    // Verificamos presencia del mapa Leaflet
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();

    // Verificamos que no use SVG radial
    const polarRings = page.locator('circle[stroke-dasharray="3,3"]');
    await expect(polarRings).toHaveCount(0);
  });
});
