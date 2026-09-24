import { test, expect } from '@playwright/test';

test.describe('Hipotecaly Public Demo & Commercial Gate Suite', () => {

  test('01 — SaaS Home: Presenta las 3 modalidades de integración con sus CTAs exactos', async ({ page }) => {
    await page.goto('/saas#modalidades');
    
    await expect(page.locator('text=01 — Solo botón')).toBeVisible();
    await expect(page.locator('text=02 — Simulador embebido')).toBeVisible();
    await expect(page.locator('text=03 — Sitio completo')).toBeVisible();
    
    await expect(page.locator('text=En todas las modalidades, la experiencia del solicitante utiliza la identidad de tu organización')).toBeVisible();

    await expect(page.locator('text=Probar integración')).toBeVisible();
    await expect(page.locator('text=Probar simulador en vivo')).toBeVisible();
    await expect(page.locator('text=Ver demo Estudio Nova')).toBeVisible();
  });

  test('02 — Modalidad 01 Solo Botón: Flow completo hasta Gate Comercial', async ({ page }) => {
    await page.goto('/demo/estudio-nova/integraciones/boton');
    
    await expect(page.locator('text=DESARROLLOS DEL SUR')).toBeVisible();
    await expect(page.locator('text=Modalidad Solo Botón:')).toBeVisible();

    await page.click('[data-testid=\ btn-solicitar-financiacion\]');
    await expect(page).toHaveURL(/.*\/demo\/estudio-nova\/simulador.*/);

    const continueBtn = page.locator('button:has-text(\CONTINUAR SOLICITUD\), button:has-text(\Continuar solicitud\)').first();
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    const gateModal = page.locator('[data-testid=\demo-commercial-gate-modal\]');
    await expect(gateModal).toBeVisible();
    await expect(gateModal.locator('text=Estás explorando la demo interactiva')).toBeVisible();
    await expect(gateModal.locator('text=Solicitar demo')).toBeVisible();
    await expect(gateModal.locator('text=Seguir explorando')).toBeVisible();

    await page.click('[data-testid=\btn-gate-keep-exploring\]');
    await expect(gateModal).not.toBeVisible();
  });

  test('03 — Modalidad 02 Simulador Embebido: Flow completo y conversión a Contacto', async ({ page }) => {
    await page.goto('/demo/estudio-nova/integraciones/embebido');
    
    await expect(page.locator('text=INMOBILIARIA DEL ESTE')).toBeVisible();
    const continueBtn = page.locator('button:has-text(\CONTINUAR SOLICITUD\), button:has-text(\Continuar solicitud\)').first();
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    const gateModal = page.locator('[data-testid=\demo-commercial-gate-modal\]');
    await expect(gateModal).toBeVisible();

    await page.click('[data-testid=\btn-gate-request-demo\]');
    await expect(page).toHaveURL(/.*\/contacto\?source=embed_demo.*/);
  });

  test('04 — Modalidad 03 Sitio Completo (Estudio Nova Home): Gate Comercial activo', async ({ page }) => {
    await page.goto('/demo/estudio-nova');
    
    await expect(page.locator('text=Portal del solicitante').first()).toBeVisible();

    const continueBtn = page.locator('button:has-text(\CONTINUAR SOLICITUD\), button:has-text(\Continuar solicitud\)').first();
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    const gateModal = page.locator('[data-testid=\demo-commercial-gate-modal\]');
    await expect(gateModal).toBeVisible();
  });

});
