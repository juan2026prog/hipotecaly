import { test, expect } from '@playwright/test';

test.describe('INTEGRACIÓN CON SITIOS EXTERNOS & SANITIZACIÓN DE PARÁMETROS', () => {

  test('Integración vía URL con parámetros permitidos y sanitizados', async ({ page }) => {
    // Parámetros válidos desde sitio externo
    await page.goto('/solicitar?monto=85000&valor_propiedad=220000&plazo=48&modalidad=amortizable&source=external_partner');

    // Validar que el wizard recibe y sanitiza el monto
    await expect(page.locator('text=Paso 1')).toBeVisible();
    const amountInput = page.locator('input').first();
    const val = await amountInput.inputValue();
    expect(val.replace(/\D/g, '')).toContain('85000');
  });

  test('Sanitización ante valores absurdos o negativos', async ({ page }) => {
    // Parámetros manipulados o no numéricos
    await page.goto('/solicitar?monto=-5000&valor_propiedad=abc');

    // El wizard no debe crashear, debe aplicar valor por defecto seguro
    await expect(page.locator('text=Paso 1')).toBeVisible();
    const amountInput = page.locator('input').first();
    const val = await amountInput.inputValue();
    expect(Number(val.replace(/\D/g, ''))).toBeGreaterThan(0);
  });

  test('Flujo desde NOVA Integrado: Paso de parámetros entre web existente y expediente', async ({ page }) => {
    await page.goto('/demo/nova/integrado');
    await expect(page.locator('text=Así se conecta la web actual de NOVA con HIPOTECALY')).toBeVisible();

    // Comprobar presencia de pipeline y código de integración
    await expect(page.locator('text=Payload simulado')).toBeVisible();
  });

});
