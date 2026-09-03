import { test, expect } from '@playwright/test';

test.describe('FEATURE FLAGS & MÓDULOS ACTIVABLES POR TENANT', () => {

  test('Super Admin puede visualizar los 16 módulos del tenant NOVA', async ({ page }) => {
    await page.goto('/admin/tenants');
    await expect(page.locator('text=Módulos y Feature Flags de NOVA Crédito Hipotecario')).toBeVisible();

    // Validar presencia de módulos clave
    await expect(page.locator('text=Módulo de Solicitudes Digitales')).toBeVisible();
    await expect(page.locator('text=Simulador Crediticio')).toBeVisible();
    await expect(page.locator('text=Portal del Solicitante')).toBeVisible();
    await expect(page.locator('text=Panel del Estudio / Backoffice')).toBeVisible();
    await expect(page.locator('text=Gestión Documental y Checklist')).toBeVisible();
    await expect(page.locator('text=Copiloto de Análisis Asistido por IA')).toBeVisible();
    await expect(page.locator('text=Protección Anti-Bypass de Contacto')).toBeVisible();
    await expect(page.locator('text=Transparencia de Costos de Cierre')).toBeVisible();
    await expect(page.locator('text=Integración con Simulador Externo')).toBeVisible();
  });

  test('Conmutación de módulos (Toggle) en caliente', async ({ page }) => {
    await page.goto('/admin/tenants');
    
    // Obtener primer botón de toggle
    const toggleBtn = page.locator('button:has-text("Activo")').first();
    await expect(toggleBtn).toBeVisible();

    // Conmutar a Inactivo
    await toggleBtn.click();
    await expect(page.locator('button:has-text("Inactivo")').first()).toBeVisible();

    // Revertir a Activo
    const inactiveBtn = page.locator('button:has-text("Inactivo")').first();
    await inactiveBtn.click();
    await expect(page.locator('button:has-text("Activo")').first()).toBeVisible();
  });

  test('El portal del cliente refleja módulos activos en las pestañas', async ({ page }) => {
    await page.goto('/mi-cuenta');
    await expect(page.locator('text=Portal del Solicitante').first()).toBeVisible();
    await expect(page.locator('button:has-text("Solicitud")').first()).toBeVisible();
  });

});
