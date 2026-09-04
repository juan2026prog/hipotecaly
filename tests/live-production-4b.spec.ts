import { test, expect } from '@playwright/test';

const PROD_URL = 'https://hipotecaly.vercel.app';

test.describe('VERIFICACIÓN EN VIVO DE PRODUCCIÓN VERCEL (MACROFASE 4B)', () => {

  test('1. Live Production Home: Dual Selector & B2B Solutions Section', async ({ page }) => {
    await page.goto(PROD_URL, { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    
    // Top Audience Bar
    await expect(page.locator('text=Para Personas').first()).toBeVisible();
    await expect(page.locator('text=Para Empresas & Estudios').first()).toBeVisible();

    // Dual Intent Selector en Hero
    await expect(page.locator('text=Para Personas (Simular Crédito)')).toBeVisible();
    await expect(page.locator('text=Para Empresas (Plataforma SaaS & White-Label)')).toBeVisible();

    // Sección B2B
    await expect(page.locator('text=HIPOTECALY PARA EMPRESAS · SAAS WHITE-LABEL')).toBeVisible();
    await expect(page.locator('text=Prestamistas Privados').first()).toBeVisible();
    await expect(page.locator('text=Financieras y Fondos').first()).toBeVisible();
    await expect(page.locator('text=Estudios Notariales').first()).toBeVisible();
    await expect(page.locator('text=Ver Showroom NOVA').first()).toBeVisible();
  });

  test('2. Live Production: Solución Prestamistas (/empresas/prestamistas)', async ({ page }) => {
    await page.goto(`${PROD_URL}/empresas/prestamistas`, { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('garantía real');
    expect(h1).toContain('blindaje Anti-Bypass');

    await expect(page.locator('text=Oportunidad Activa')).toBeVisible();
  });

  test('3. Live Production: Solución Financieras (/empresas/financieras)', async ({ page }) => {
    await page.goto(`${PROD_URL}/empresas/financieras`, { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('El core operativo para escalar tu cartera');

    await expect(page.locator('text=Sindicación Tranche B')).toBeVisible();
  });

  test('4. Live Production: Solución Estudios Notariales (/empresas/estudios)', async ({ page }) => {
    await page.goto(`${PROD_URL}/empresas/estudios`, { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('Gestión documental y titulación hipotecaria');

    await expect(page.locator('text=Expediente Notarial')).toBeVisible();
  });

  test('5. Live Production: Showroom NOVA (/demo/nova)', async ({ page }) => {
    await page.goto(`${PROD_URL}/demo/nova`, { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('Experimentá NOVA');

    await expect(page.getByRole('heading', { name: 'Marketplace Participant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Widget Embebido' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Full White-Label Standalone' })).toBeVisible();
  });

  test('6. Live Production: SaaS Hub Modular Badges (/saas)', async ({ page }) => {
    await page.goto(`${PROD_URL}/saas`, { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    await expect(page.locator('text=INCLUDED').first()).toBeVisible();
    await expect(page.locator('text=ADD-ON').first()).toBeVisible();
    await expect(page.locator('text=COMING SOON').first()).toBeVisible();
  });

  test('7. Live Production: Lead Capture Prefill (/contacto?demo=true&rol=financiera)', async ({ page }) => {
    await page.goto(`${PROD_URL}/contacto?demo=true&rol=financiera`, { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    await expect(page.locator('select')).toHaveValue('financiera');
  });

});
