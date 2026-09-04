import { test, expect } from '@playwright/test';

test.describe('MACROFASE 5: SAAS MODULE CATALOG & DISCOVERY (/saas/modulos)', () => {

  test('1. Acceso a /saas/modulos: H1, Descripción y Grilla de Módulos', async ({ page }) => {
    await page.goto('/saas/modulos', { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('Catálogo Oficial de Módulos & Add-Ons');

    // Badges de Tiers presentes en las tarjetas
    await expect(page.locator('span:text-is("INCLUDED")').first()).toBeVisible();
    await expect(page.locator('span:text-is("ADD-ON")').first()).toBeVisible();
    await expect(page.locator('span:text-is("ENTERPRISE")').first()).toBeVisible();
    await expect(page.locator('span:text-is("COMING SOON")').first()).toBeVisible();
  });

  test('2. Filtros de Categoría y Tier en el Catálogo', async ({ page }) => {
    await page.goto('/saas/modulos', { waitUntil: 'networkidle' });

    // Filtrar por tier ADD-ON
    const selectTier = page.locator('select');
    await selectTier.selectOption('addon');

    // Verificar que solo se muestran add-ons en tarjetas visibles
    await expect(page.locator('.grid span:text-is("INCLUDED")')).not.toBeVisible();
    await expect(page.locator('span:text-is("ADD-ON")').first()).toBeVisible();

    // Restablecer a todos
    await selectTier.selectOption('all');
    await expect(page.locator('span:text-is("INCLUDED")').first()).toBeVisible();
  });

  test('3. Enlace de Consulta por Módulo hacia Formulario B2B', async ({ page }) => {
    await page.goto('/saas/modulos', { waitUntil: 'networkidle' });

    const consultLink = page.locator('a[href*="/contacto?demo=true&modulo="]').first();
    await expect(consultLink).toBeVisible();
    const href = await consultLink.getAttribute('href');
    expect(href).toContain('modulo=');
  });

});
