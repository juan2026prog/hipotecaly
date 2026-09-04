import { test, expect } from '@playwright/test';

const PROD_URL = 'https://hipotecaly.vercel.app';

test.describe('VERIFICACIÓN EXHAUSTIVA DE PRODUCCIÓN VERCEL POST-DEPLOY (PARTE 5 Y 6)', () => {

  test('1. Verificación de / (Home): H1, Selector Dual, Navbar y Sección B2B', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(PROD_URL, { waitUntil: 'networkidle' });
    
    // No error boundary
    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    await expect(page.locator('text=Ha ocurrido un error inesperado')).not.toBeVisible();

    // H1 Real
    const h1 = await page.locator('h1').first().innerText();
    expect(h1).toContain('Convertimos tu propiedad en la oportunidad');

    // Selector Dual en Hero
    await expect(page.locator('text=Busco Financiación (Propietarios)')).toBeVisible();
    await expect(page.locator('text=Quiero Digitalizar mi Operación (Empresas & Estudios)')).toBeVisible();

    // Top Audience Bar en Header
    await expect(page.locator('text=Para Personas').first()).toBeVisible();
    await expect(page.locator('text=Para Empresas & Estudios').first()).toBeVisible();

    // Sección B2B en Home
    await expect(page.locator('text=HIPOTECALY PARA EMPRESAS · SAAS WHITE-LABEL')).toBeVisible();
    await expect(page.locator('text=Tu negocio hipotecario. Tu marca. Nuestra tecnología.')).toBeVisible();
  });

  test('2. Verificación de /simulador: Componente de cálculo de LTV activo', async ({ page }) => {
    await page.goto(PROD_URL + '/simulador', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Calculá tu capacidad de crédito');
    await expect(page.locator('text=Podrías acceder a hasta:')).toBeVisible();
  });

  test('3. Verificación de /solicitar: Asistente de Solicitud de 8 pasos', async ({ page }) => {
    await page.goto(PROD_URL + '/solicitar', { waitUntil: 'networkidle' });
    await expect(page.locator('button:has-text("Continuar")')).toBeVisible();
    await expect(page.locator('text=Paso 1')).toBeVisible();
  });

  test('4. Verificación de /mi-cuenta: Redirección o login protegido para anónimos', async ({ page }) => {
    await page.goto(PROD_URL + '/mi-cuenta', { waitUntil: 'networkidle' });
    // Al ser anónimo debe redirigir a /ingresar
    await expect(page).toHaveURL(/.*ingresar.*/);
    await expect(page.locator('text=Iniciar Sesión')).toBeVisible();
  });

  test('5. Verificación de /lender: Redirección o login protegido para prestamistas', async ({ page }) => {
    await page.goto(PROD_URL + '/lender', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/.*ingresar.*/);
  });

  test('6. Verificación de /saas: Hub Central B2B con H1 y modalidades', async ({ page }) => {
    await page.goto(PROD_URL + '/saas', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Digitalizá todo tu negocio hipotecario');
    await expect(page.locator('text=LA PLATAFORMA HIPOTECARIA PARA PROFESIONALES')).toBeVisible();
    await expect(page.locator('text=Elegí cómo querés implementar HIPOTECALY')).toBeVisible();
  });

  test('7. Verificación de /saas/integracion: Modalidad A con pipeline y simulador', async ({ page }) => {
    await page.goto(PROD_URL + '/saas/integracion', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Tu web ya genera interés');
    await expect(page.locator('text=MODALIDAD A · YA TENGO SITIO WEB')).toBeVisible();
  });

  test('8. Verificación de /saas/plataforma-completa: Modalidad B Llave en Mano', async ({ page }) => {
    await page.goto(PROD_URL + '/saas/plataforma-completa', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Tu propia plataforma hipotecaria');
    await expect(page.locator('text=MODALIDAD B · WHITE-LABEL COMPLETO DESDE CERO')).toBeVisible();
  });

  test('9. Verificación de /demo/nova/full: Showroom interactivo White-Label', async ({ page }) => {
    await page.goto(PROD_URL + '/demo/nova/full', { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toContainText('Financiamiento hipotecario claro, ágil y garantizado');
    await expect(page.locator('text=NOVA Crédito Hipotecario').first()).toBeVisible();
  });

});
