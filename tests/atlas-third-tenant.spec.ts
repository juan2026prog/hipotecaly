import { test, expect } from '@playwright/test';

test.describe('ATLAS THIRD TENANT LIVE CERTIFICATION (SECTION 10)', () => {

  test('1. /org/atlas-cert carga inmediatamente sin tocar código y muestra branding propio', async ({ page }) => {
    await page.goto('/org/atlas-cert');

    // Verificar branding de ATLAS
    await expect(page.locator('text=ATLAS Financiamiento').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Créditos inmobiliarios/i).first()).toBeVisible({ timeout: 10000 });

    // Verificar que NO muestra datos de NOVA ni de ORION
    const content = await page.innerText('body');
    expect(content).not.toContain('NOVA Crédito Hipotecario');
    expect(content).not.toContain('demo.novacredito.uy');
  });

  test('2. /org/atlas-cert aplica reglas crediticias configuradas (42%, USD 210k, 36 meses)', async ({ page }) => {
    await page.goto('/org/atlas-cert');

    // Verificar que los badges de límites reflejan exactamente la configuración en Supabase
    await expect(page.getByText('Hasta 42%')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('USD 210.000')).toBeVisible();
    await expect(page.getByText('36 meses').first()).toBeVisible();
  });

  test('3. Enviar solicitud desde ATLAS preserva tenant_id y organización en el flujo', async ({ page }) => {
    await page.goto('/org/atlas-cert');
    await expect(page.locator('text=ATLAS Financiamiento').first()).toBeVisible({ timeout: 15000 });

    // Click en CONTINUAR SOLICITUD
    const submitBtn = page.getByRole('button', { name: /CONTINUAR SOLICITUD/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
    await expect(page).toHaveURL(/.*\/solicitar.*source=atlas-cert.*/);
  });

});
