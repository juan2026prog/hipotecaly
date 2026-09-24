import { test, expect } from '@playwright/test';

test.describe('HIPOTECALY — Demostración Visual de Modalidades de Integración B2B', () => {

  test('DEMO TEST 0: Selector de Modos de Integración muestra únicamente Simulador+Botón y Solo Botón', async ({ page }) => {
    await page.goto('/demo/estudio-nova/integraciones');
    await page.waitForLoadState('domcontentloaded');

    // Título y contexto comercial
    await expect(page.locator('h1')).toContainText('Tu empresa ya tiene página web');
    await expect(page.getByTestId('integration-card-embed')).toBeVisible();
    await expect(page.getByTestId('integration-card-button')).toBeVisible();

    // Confirmar que solo existen 2 botones de prueba (Embed y Button), no uno de 'Sitio Completo'
    await expect(page.getByRole('button', { name: /PROBAR SIMULADOR \+ BOTÓN/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /PROBAR SOLO BOTÓN/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /PROBAR SITIO COMPLETO/i })).toHaveCount(0);

    // Enlace de retorno a Estudio Nova completo
    const returnLink = page.getByText(/Volver a Estudio Nova/i).first();
    await expect(returnLink).toBeVisible();
  });

  test('DEMO TEST 1: Flujo Demo A — SIMULADOR EMBEBIDO + BOTÓN con simulación real y llegada a Portal', async ({ page }) => {
    // 1. Abrir Selector y navegar a Demo A
    await page.goto('/demo/estudio-nova/integraciones');
    await page.click('text=PROBAR SIMULADOR + BOTÓN');
    await page.waitForURL('**/demo/estudio-nova/integraciones/embebido');

    // 2. Verificar barra de presentación y contenido de web externa
    await expect(page.getByTestId('presentation-bar-embed')).toBeVisible();
    await expect(page.getByText('INMOBILIARIA DEL ESTE').first()).toBeVisible();
    await expect(page.getByText('Financiación para nuestros clientes')).toBeVisible();

    // 3. Verificar Simulador Canónico Embebido y Brand de Estudio Nova
    const simulator = page.getByTestId('canonical-tenant-simulator');
    await expect(simulator).toBeVisible();
    await expect(simulator).toContainText('Estudio Nova · Cotización en Vivo');
    await expect(simulator).toContainText('MOTOR REAL');

    // 4. Modificar valores de la simulación (Dentro del límite de LTV 40%)
    const loanInput = simulator.locator('input').nth(1); // Monto solicitado
    await loanInput.fill('75000');

    // Verificar cálculo dinámico de cuota
    await expect(simulator).toContainText('Cuota mensual estimada:');
    await expect(simulator).toContainText('USD');

    // 5. Presionar CONTINUAR SOLICITUD
    const submitBtn = simulator.getByRole('button', { name: /CONTINUAR SOLICITUD/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click({ force: true });

    // 6. Confirmar llegada al Portal del Solicitante / Wizard con branding de Estudio Nova y parámetros
    await page.waitForURL(/.*\/demo\/estudio-nova\/solicitar.*/);
    expect(page.url()).toContain('monto=75000');
    expect(page.url()).toContain('source=embed_demo');
    expect(page.url()).toContain('source_mode=embed');

    // Verificar que el Wizard mantenga el contexto de Estudio Nova
    await expect(page.locator('body')).toContainText(/Estudio Nova|Solicitud de Financiación/i);
  });

  test('DEMO TEST 2: Flujo Demo B — SOLO BOTÓN con apertura de simulador alojado brandeado y portal', async ({ page }) => {
    // 1. Abrir Selector y navegar a Demo B
    await page.goto('/demo/estudio-nova/integraciones');
    await page.click('text=PROBAR SOLO BOTÓN');
    await page.waitForURL('**/demo/estudio-nova/integraciones/boton');

    // 2. Verificar barra de presentación y contenido de web externa
    await expect(page.getByTestId('presentation-bar-button')).toBeVisible();
    await expect(page.getByText('DESARROLLOS DEL SUR').first()).toBeVisible();
    await expect(page.getByText('¿Necesitás financiación?')).toBeVisible();

    // 3. Presionar botón SOLICITAR FINANCIACIÓN
    const btnSolicitar = page.getByTestId('btn-solicitar-financiacion');
    await expect(btnSolicitar).toBeVisible();
    await btnSolicitar.click();

    // 4. Confirmar apertura del simulador alojado bajo la marca de Estudio Nova
    await page.waitForURL(/.*\/demo\/estudio-nova\/simulador.*/);
    await expect(page.locator('body')).toContainText('Estudio Nova');
    await expect(page.locator('h1')).toContainText(/Simulador de Financiación Hipotecaria/i);

    // 5. Simular y continuar hacia el Wizard
    const continueBtn = page.getByTestId('btn-continuar-solicitud');
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await continueBtn.scrollIntoViewIfNeeded();
    await Promise.all([
      page.waitForURL(/.*\/demo\/estudio-nova\/solicitar.*/, { timeout: 15000 }),
      continueBtn.click({ force: true }),
    ]);
    await expect(page.locator('body')).toContainText(/Estudio Nova|Solicitud de Financiación/i);
  });

  test('DEMO TEST 3: Alternancia fluida entre demos sin pérdida de contexto ni contaminación', async ({ page }) => {
    // 1. Abrir Demo A
    await page.goto('/demo/estudio-nova/integraciones/embebido');
    await expect(page.getByTestId('presentation-bar-embed')).toBeVisible();
    await expect(page.getByText('INMOBILIARIA DEL ESTE').first()).toBeVisible();

    // 2. Alternar a Demo B desde la barra de presentación
    await page.click('text=Probar Solo Botón');
    await page.waitForURL('**/demo/estudio-nova/integraciones/boton');
    await expect(page.getByTestId('presentation-bar-button')).toBeVisible();
    await expect(page.getByText('DESARROLLOS DEL SUR').first()).toBeVisible();

    // 3. Alternar de vuelta a Demo A desde la barra de presentación
    await page.click('text=Probar Simulador Embebido');
    await page.waitForURL('**/demo/estudio-nova/integraciones/embebido');
    await expect(page.getByTestId('presentation-bar-embed')).toBeVisible();
    await expect(page.getByText('INMOBILIARIA DEL ESTE').first()).toBeVisible();

    // 4. Volver al selector de integraciones
    await page.click('text=Volver a Modos de Integración');
    await page.waitForURL('**/demo/estudio-nova/integraciones');
    await expect(page.locator('h1')).toContainText('Tu empresa ya tiene página web');

    // 5. Volver a Estudio Nova completo
    await page.click('text=Volver a Estudio Nova (Sitio Completo)');
    await page.waitForURL('**/demo/estudio-nova');
    await expect(page.locator('body')).toContainText('ESTUDIO NOVA');
  });

});
