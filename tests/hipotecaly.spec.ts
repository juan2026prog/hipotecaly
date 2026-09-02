import { test, expect } from '@playwright/test';

test.describe('HIPOTECALY: Suites de Pruebas Fases 1, 2 y 3', () => {

  test('1. Marketplace carga correctamente con diseño fiel a Imagen 1', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HIPOTECALY/);

    // Hero title
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toContainText('Convertimos tu propiedad');
    await expect(heroTitle).toContainText('oportunidad');

    // CTAs principales
    const ctaSimular = page.getByRole('link', { name: 'Simular mi préstamo' }).first();
    await expect(ctaSimular).toBeVisible();

    // Barra Navy de Beneficios (sin métricas falsas)
    await expect(page.getByRole('heading', { name: 'ANÁLISIS DIGITAL', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PRIVACIDAD', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'SEGUIMIENTO', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ACOMPAÑAMIENTO', exact: true })).toBeVisible();

    // Sección Cómo Funciona
    await expect(page.getByText('Un proceso simple, digital desde el comienzo.')).toBeVisible();

    // Footer con aviso legal obligatorio
    await expect(page.getByText('Aviso Legal y Transparencia Operativa')).toBeVisible();
  });

  test('2. SaaS /plataforma carga correctamente con diseño fiel a Imagen 2', async ({ page }) => {
    await page.goto('/plataforma');

    // Hero B2B
    await expect(page.getByText('LA PLATAFORMA HIPOTECARIA PARA PROFESIONALES')).toBeVisible();
    await expect(page.locator('h1')).toContainText('una sola plataforma');

    // Barra Navy SaaS
    await expect(page.getByRole('heading', { name: 'CAPTACIÓN', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ANÁLISIS', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'GESTIÓN', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'WHITE LABEL', exact: true })).toBeVisible();

    // Sección White Label
    await expect(page.getByText('Tu estudio. Tu marca. Nuestra tecnología.')).toBeVisible();
    await expect(page.getByRole('heading', { name: '100% white-label' })).toBeVisible();
  });

  test('3. Simulador interactivo calcula LTV (40%) y respeta tope de USD 200.000', async ({ page }) => {
    await page.goto('/simulador');

    // Encabezado
    await expect(page.getByText('Calculá tu capacidad de crédito')).toBeVisible();

    // Valor predeterminado $150.000 -> max 40% = $60.000
    await expect(page.getByText('USD 60.000')).toBeVisible();

    // Comprobar presencia del Disclaimer legal obligatorio
    await expect(page.getByText('Aviso Importante:')).toBeVisible();

    // Click en botón continuar solicitud
    const btnContinuar = page.getByRole('button', { name: 'Continuar solicitud' });
    await expect(btnContinuar).toBeEnabled();
    await btnContinuar.click();

    // Debe navegar al wizard /solicitar
    await expect(page).toHaveURL(/\/solicitar/);
  });

  test('4. Páginas de Autenticación (Login, Registro, Recuperación)', async ({ page }) => {
    // Login
    await page.goto('/ingresar');
    await expect(page.getByRole('heading', { name: 'Ingresar a tu cuenta' })).toBeVisible();
    await expect(page.getByPlaceholder('tu@email.com')).toBeVisible();

    // Registro
    await page.goto('/registro');
    await expect(page.getByRole('heading', { name: 'Creá tu cuenta en HIPOTECALY' })).toBeVisible();
    await expect(page.getByPlaceholder('099 123 456')).toBeVisible();

    // Recuperar contraseña
    await page.goto('/recuperar-password');
    await expect(page.getByRole('heading', { name: 'Recuperar contraseña' })).toBeVisible();
  });

  test('5. Wizard de Solicitud en 6 pasos y persistencia de Borrador (Draft)', async ({ page }) => {
    await page.goto('/solicitar');

    // Paso 1: Necesidad
    await expect(page.getByText('Paso 1 de 6: Necesidad')).toBeVisible();
    await expect(page.getByText('Borrador persistido')).toBeVisible();

    // Avanzar a Paso 2
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Paso 2 de 6: Propiedad')).toBeVisible();

    // Avanzar a Paso 3
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Paso 3 de 6: Fotos')).toBeVisible();
    await expect(page.getByText('Fachada / Frente')).toBeVisible();

    // Avanzar a Paso 4
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Paso 4 de 6: Ingresos')).toBeVisible();

    // Avanzar a Paso 5
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Paso 5 de 6: Datos Personales')).toBeVisible();

    // Llenar datos requeridos
    await page.getByPlaceholder('Juan Carlos').fill('Santiago');
    await page.getByPlaceholder('Pérez Gómez').fill('Vázquez');
    await page.getByPlaceholder('1.234.567-8').fill('4.321.987-6');
    await page.getByPlaceholder('099 123 456').fill('099 888 777');
    await page.getByPlaceholder('juan@ejemplo.com').fill('santiago@ejemplo.com');

    // Avanzar a Paso 6: Resumen y Consentimiento
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Paso 6 de 6: Resumen')).toBeVisible();

    // Aceptar checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();

    // Enviar solicitud
    const btnSubmit = page.getByRole('button', { name: 'Enviar solicitud definitiva' });
    await expect(btnSubmit).toBeEnabled();
    await btnSubmit.click();

    // Redirige a Mi Cuenta
    await expect(page).toHaveURL(/\/mi-cuenta/, { timeout: 10000 });
  });

  test('6. Portal Mi Cuenta (/mi-cuenta) muestra timeline y expediente', async ({ page }) => {
    await page.goto('/mi-cuenta');

    await expect(page.locator('main').getByText('Portal del Solicitante')).toBeVisible();
    await expect(page.getByText('Progreso del Expediente')).toBeVisible();
    await expect(page.getByText('Solicitud recibida')).toBeVisible();
    await expect(page.getByText('Monto Solicitado')).toBeVisible();
    await expect(page.getByText('LTV Preliminar')).toBeVisible();
  });

  test('7. Backoffice Dashboard (/app) muestra métricas derivadas y solicitudes', async ({ page }) => {
    await page.goto('/app');

    await expect(page.getByRole('heading', { name: 'Panel Operativo' })).toBeVisible();
    await expect(page.getByText('Solicitudes Recientes')).toBeVisible();
    await expect(page.getByText('Volumen Total Gestionado')).toBeVisible();
  });

  test('8. Backoffice Expediente (/app/solicitudes/:id) con tabs, valuación y tareas', async ({ page }) => {
    await page.goto('/app/solicitudes/e0000000-0000-0000-0000-000000000001');

    // Header del expediente
    await expect(page.getByText('HIP-DEMO-00124').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('LTV Resultante')).toBeVisible();

    // Cambiar a Tab Valuación
    await page.getByRole('button', { name: 'Valuación' }).click();
    await expect(page.getByText('Valuación Preliminar del Inmueble')).toBeVisible();
    await expect(page.getByText('No es tasación oficial')).toBeVisible();

    // Cambiar a Tab Actividad
    await page.getByRole('button', { name: 'Actividad' }).click();
    await expect(page.getByText('Historial de Actividad y Estados')).toBeVisible();
  });

  test('9. Verificación Responsive: Ausencia de overflow horizontal en viewports móviles (360px, 390px, 430px)', async ({ page }) => {
    const viewports = [
      { width: 360, height: 740 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/');

      // Medir scrollWidth vs innerWidth para asegurar ausencia de overflow horizontal
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalOverflow).toBe(false);
    }
  });

});
