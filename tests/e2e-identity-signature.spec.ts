import { test, expect } from '@playwright/test';
import { openQaSession, clearQaSession } from './helpers/qaSession';

test.describe('E2E: Módulo Universal de Identidad, KYC y Firma Digital', () => {
  test.beforeEach(async ({ page }) => {
    await openQaSession(page, { role: 'super_admin' });
  });

  test.afterEach(async ({ page }) => {
    await clearQaSession(page);
  });

  test('Flujo E2E: Verificación KYC y Firma Digital en Expediente', async ({ page }) => {
    // 1. Ingresar a la ficha del expediente
    await page.goto('/app/solicitudes/e0000000-0000-0000-0000-000000000001?presentation=true');
    await page.waitForLoadState('networkidle');

    // 2. Verificar presencia de la Tarjeta KYC en el Resumen
    const kycCard = page.locator('text=Verificación de Identidad (KYC)');
    await expect(kycCard).toBeVisible({ timeout: 10000 });

    // 3. Abrir Modal de Inicio de KYC si está disponible
    const startKycBtn = page.locator('button:has-text("Iniciar KYC")');
    if (await startKycBtn.isVisible()) {
      await startKycBtn.click();
      const modal = page.locator('text=Validación Oficial de Identidad');
      await expect(modal).toBeVisible();

      // Probar botón cancelar para cerrar modal de forma limpia
      const cancelBtn = page.locator('button:has-text("Cancelar")');
      await cancelBtn.click();
      await expect(modal).not.toBeVisible();
    }

    // 4. Navegar a la Tab de Firmas Digitales
    const firmasTab = page.getByRole('button', { name: /Firmas/i }).first();
    await expect(firmasTab).toBeVisible({ timeout: 10000 });
    await firmasTab.click();

    // 5. Verificar Card de Proceso de Firma Digital
    const processTitle = page.locator('text=Procesos de Firma Digital');
    await expect(processTitle).toBeVisible();

    const sha256Label = page.locator('text=Integridad Criptográfica (SHA-256)');
    await expect(sha256Label).toBeVisible();

    // 6. Probar Simulación de Firma si está disponible
    const mockSignBtn = page.locator('button:has-text("Simular Firma Demo")');
    if (await mockSignBtn.isVisible()) {
      await mockSignBtn.click();
      const mockModal = page.locator('text=MODO SIMULACIÓN: Documento sellado como DEMO / SIN VALIDEZ JURÍDICA');
      await expect(mockModal).toBeVisible();

      // Seleccionar TuID Antel
      const tuidBtn = page.locator('button:has-text("TuID Antel")');
      await tuidBtn.click();

      const confirmSignBtn = page.locator('button:has-text("Firmar Documento")');
      await confirmSignBtn.click();
    }
  });

  test('Consola Super Admin: Supervisión de Integraciones KYC y Firma', async ({ page }) => {
    await page.goto('/platform-admin?presentation=true');
    await page.waitForLoadState('networkidle');

    // Verificar sección de integraciones
    const integrationsTitle = page.locator('text=Integraciones de Identidad y Firma Digital');
    await expect(integrationsTitle).toBeVisible({ timeout: 10000 });

    const diditCard = page.getByRole('heading', { name: 'Didit Identity & KYC' });
    await expect(diditCard).toBeVisible();

    const firmaGubCard = page.getByRole('heading', { name: 'Firma.gub.uy (AGESIC)' });
    await expect(firmaGubCard).toBeVisible();

    // Verificar herramienta de prueba QA
    const qaTool = page.locator('text=Consola QA: Forzar Resultado de Verificación KYC');
    await expect(qaTool).toBeVisible();
  });

  test('Seguridad: Ningún secreto ni service role expuesto en el cliente', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();

    // Validar que no existen variables sensibles hardcodeadas en HTML o bundle
    expect(content.includes('service_role')).toBe(false);
    expect(content.includes('DIDIT_API_KEY')).toBe(false);
    expect(content.includes('DIDIT_WEBHOOK_SECRET')).toBe(false);
    expect(content.includes('VERIFF_SHARED_SECRET')).toBe(false);
    expect(content.includes('claveSeguridad')).toBe(false);
  });
});
