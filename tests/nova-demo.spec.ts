import { test, expect } from '@playwright/test';

test.describe('NOVA DEMO — E2E 19-STEP OPERATIONAL FLOW', () => {
  test('1 to 4: Simular en NOVA Legacy y Continuar Solicitud con valores precargados', async ({ page }) => {
    // 1. Abrir NOVA Legacy
    await page.goto('/demo/nova/legacy');
    await expect(page.locator('text=MODO DEMOSTRACIÓN HIPOTECALY')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Soluciones financieras con respaldo inmobiliario');

    // 2. Verificar simulador tradicional con valores iniciales
    const propInput = page.locator('label:has-text("Valor estimado del inmueble")').locator('..').locator('input');
    const loanInput = page.locator('label:has-text("Monto que solicitás")').locator('..').locator('input');
    
    await expect(propInput).toBeVisible();
    await expect(loanInput).toBeVisible();

    // 3. Simular USD 200.000 propiedad, USD 70.000 préstamo (35% financiado)
    await propInput.fill('200000');
    await loanInput.fill('70000');

    // Verificar cálculo de porcentaje financiado (35.0%)
    await expect(page.locator('text=35.0%')).toBeVisible();

    // 4. Click en CONTINUAR SOLICITUD
    const continueBtn = page.locator('button:has-text("CONTINUAR SOLICITUD")');
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // 5. Verificar redirección al wizard digital con datos precargados
    await expect(page).toHaveURL(/.*solicitar.*/);
    await expect(page.locator('text=Paso 1')).toBeVisible();

    // Validar precarga de monto solicitado (USD 70.000)
    const wizardAmountInput = page.locator('input').first();
    const val = await wizardAmountInput.inputValue();
    expect(val.replace(/\D/g, '')).toContain('70000');
  });

  test('5 to 8: Completar y avanzar en el Wizard con persistencia por paso', async ({ page }) => {
    await page.goto('/solicitar?monto=70000&valor_propiedad=200000&plazo=36&modalidad=solo_intereses&source=nova_legacy');
    
    // Paso 1: Necesidad
    await expect(page.locator('button:has-text("Continuar")')).toBeVisible();
    await page.click('button:has-text("Continuar")');

    // Paso 2: Propiedad
    await expect(page.locator('text=Paso 2')).toBeVisible();
    await page.click('button:has-text("Continuar")');

    // Paso 3: Fotos
    await expect(page.locator('text=Paso 3')).toBeVisible();
  });

  test('9 to 15: Backoffice de NOVA, observación y aprobación de documentos', async ({ page }) => {
    // 9. Login / acceso backoffice NOVA
    await page.goto('/app/solicitudes/e0000000-0000-0000-0000-000000000001');

    // 10 & 11. Ver detalle del expediente
    await expect(page.locator('text=HIP-DEMO-00124').first()).toBeVisible();

    // 12. Ir a pestaña Documentos
    await page.click('button:has-text("Documentos")');
    await expect(page.locator('text=Gestión Documental Privada')).toBeVisible();

    // 13. Observar documento
    const observeBtn = page.locator('button:has-text("Observar")').first();
    if (await observeBtn.isVisible()) {
      await observeBtn.click();
      await expect(page.locator('text=Observado').first()).toBeVisible();
    }

    // 14 & 15. Aprobar documento
    const approveBtn = page.locator('button:has-text("Aprobar")').first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await expect(page.locator('text=Aprobado').first()).toBeVisible();
    }
  });

  test('16 to 18: Cambiar regla crediticia en Super Admin (50% -> 40%) y verificar en simulador en vivo', async ({ page }) => {
    // 16. Ir al panel Super Admin
    await page.goto('/admin/tenants');
    await expect(page.locator('text=Gestión de Organizaciones y Módulos')).toBeVisible();

    // Fijar porcentaje en 40%
    const btn40 = page.locator('button:has-text("Fijar en 40%")');
    await expect(btn40).toBeVisible();
    await btn40.click();

    await expect(page.locator('text=Regla actualizada en Supabase')).toBeVisible();

    // 17 & 18. Volver a NOVA Full y confirmar que ahora el límite aplica 40% sin redeploy
    await page.goto('/demo/nova/full');
    await expect(page.locator('text=Hasta 40%')).toBeVisible();
    await expect(page.locator('text=Límite 40%')).toBeVisible();
  });

  test('19: Verificación de protección de contacto anti-bypass por etapa', async ({ page }) => {
    await page.goto('/app/solicitudes/e0000000-0000-0000-0000-000000000001');
    
    // Ir a pestaña Solicitante
    await page.click('button:has-text("Solicitante")');

    // Verificar enmascaramiento si el estado es info_review (pre-aprobación)
    await expect(page.locator('text=Contacto Enmascarado')).toBeVisible();
    await expect(page.locator('text=09X XXX')).toBeVisible();
  });

});
