import { test, expect } from '@playwright/test';

test.describe('HIPOTECALY MACROFASE 4B — PUBLIC SAAS PRODUCTIZATION & COMMERCIAL DISCOVERY', () => {

  test('1. Home Dual Audience: Top Bar, Hero Intent Selector & B2B Solutions Section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Sin errores de ErrorBoundary
    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    await expect(page.locator('text=Ha ocurrido un error inesperado')).not.toBeVisible();

    // H1 Real
    const h1 = await page.locator('h1').first().innerText();
    expect(h1).toContain('Convertimos tu propiedad en la oportunidad');

    // Selector Dual en Hero
    await expect(page.locator('text=Para Personas (Simular Crédito)')).toBeVisible();
    await expect(page.locator('text=Para Empresas (Plataforma SaaS & White-Label)')).toBeVisible();

    // Top Audience Bar
    await expect(page.locator('text=Para Personas').first()).toBeVisible();
    await expect(page.locator('text=Para Empresas & Estudios').first()).toBeVisible();

    // Sección B2B con enlaces a Soluciones Especializadas
    await expect(page.locator('text=HIPOTECALY PARA EMPRESAS · SAAS WHITE-LABEL')).toBeVisible();
    await expect(page.locator('text=Prestamistas Privados').first()).toBeVisible();
    await expect(page.locator('text=Financieras y Fondos').first()).toBeVisible();
    await expect(page.locator('text=Estudios Notariales').first()).toBeVisible();
    await expect(page.locator('text=Ver Showroom NOVA').first()).toBeVisible();
  });

  test('2. Solución Vertical: Prestamistas e Inversores (/empresas/prestamistas)', async ({ page }) => {
    await page.goto('/empresas/prestamistas', { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('garantía real');
    expect(h1).toContain('blindaje Anti-Bypass');

    // Pillars & Anti-Bypass
    await expect(page.locator('text=SOLUCIÓN PARA INVERSORES & PRESTAMISTAS PRIVADOS')).toBeVisible();
    await expect(page.locator('text=Blindaje Anti-Bypass').first()).toBeVisible();
    await expect(page.locator('text=Oportunidad Activa')).toBeVisible();

    // CTA con rol=prestamista
    const cta = page.locator('a:has-text("Solicitar Acceso como Prestamista")');
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toContain('rol=prestamista');
  });

  test('3. Solución Vertical: Financieras y Originadores (/empresas/financieras)', async ({ page }) => {
    await page.goto('/empresas/financieras', { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('El core operativo para escalar tu cartera');

    // Módulos institucionales
    await expect(page.locator('text=SOLUCIÓN PARA FINANCIERAS, FONDOS & ORIGINADORES')).toBeVisible();
    await expect(page.locator('text=Sindicación Tranche B')).toBeVisible();
    await expect(page.locator('text=White-Label Integral')).toBeVisible();

    // CTA con rol=financiera
    const cta = page.locator('a:has-text("Solicitar Propuesta Institucional")');
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toContain('rol=financiera');
  });

  test('4. Solución Vertical: Estudios Notariales y Escribanías (/empresas/estudios)', async ({ page }) => {
    await page.goto('/empresas/estudios', { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('Gestión documental y titulación hipotecaria');

    // Pilares notariales
    await expect(page.locator('text=SOLUCIÓN PARA ESCRIBANÍAS & ESTUDIOS JURÍDICOS')).toBeVisible();
    await expect(page.locator('text=Expediente Notarial')).toBeVisible();
    await expect(page.locator('text=Documentos Auditados')).toBeVisible();

    // CTA con rol=estudio
    const cta = page.locator('a:has-text("Sumar mi Estudio Notarial")').first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toContain('rol=estudio');
  });

  test('5. Showroom NOVA: Landing de Demostración Interactiva (/demo/nova & /demo)', async ({ page }) => {
    await page.goto('/demo/nova', { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    const h1 = await page.locator('h1').innerText();
    expect(h1).toContain('Experimentá NOVA');

    // Los 3 niveles de integración
    await expect(page.getByRole('heading', { name: 'Marketplace Participant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Widget Embebido' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Full White-Label Standalone' })).toBeVisible();

    // Botón para lanzar Full White-Label
    const launchBtn = page.locator('a:has-text("Lanzar Portal NOVA Full White-Label")');
    await expect(launchBtn).toBeVisible();
    const href = await launchBtn.getAttribute('href');
    expect(href).toBe('/demo/nova/full');

    // Validar alias /demo
    await page.goto('/demo', { waitUntil: 'networkidle' });
    const aliasH1 = await page.locator('h1').innerText();
    expect(aliasH1).toContain('Experimentá NOVA');
  });

  test('6. Hub SaaS (/saas): Agrupaciones Modulares y Badges (INCLUDED, ADD-ON, COMING SOON)', async ({ page }) => {
    await page.goto('/saas', { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    
    // Badges de estado en el core tecnológico
    await expect(page.locator('text=INCLUDED').first()).toBeVisible();
    await expect(page.locator('text=ADD-ON').first()).toBeVisible();
    await expect(page.locator('text=COMING SOON').first()).toBeVisible();

    // Enlaces a soluciones especializadas
    await expect(page.locator('text=Soluciones Especializadas por Perfil')).toBeVisible();
    await expect(page.locator('text=Prestamistas Privados').first()).toBeVisible();
    await expect(page.locator('text=Financieras & Originadores').first()).toBeVisible();
    await expect(page.locator('text=Estudios Notariales').first()).toBeVisible();
    await expect(page.locator('text=SHOWROOM INTERACTIVO')).toBeVisible();
  });

  test('7. Lead Capture B2B (/contacto): Parámetros de rol y pre-configuración', async ({ page }) => {
    await page.goto('/contacto?demo=true&rol=prestamista', { waitUntil: 'networkidle' });

    await expect(page.locator('text=Algo salió mal')).not.toBeVisible();
    await expect(page.locator('text=Demostración Comercial B2B')).toBeVisible();
    
    // Dropdown preseleccionado como prestamista
    const select = page.locator('select');
    await expect(select).toHaveValue('prestamista');

    // Mensaje preconfigurado
    const textarea = page.locator('textarea');
    const msg = await textarea.inputValue();
    expect(msg).toContain('Anti-Bypass');

    // Comprobar rol financiera
    await page.goto('/contacto?demo=true&rol=financiera', { waitUntil: 'networkidle' });
    await expect(select).toHaveValue('financiera');
    const finMsg = await textarea.inputValue();
    expect(finMsg).toContain('White-Label');

    // Comprobar rol estudio
    await page.goto('/contacto?demo=true&rol=estudio', { waitUntil: 'networkidle' });
    await expect(select).toHaveValue('estudio_notarial');
    const estMsg = await textarea.inputValue();
    expect(estMsg).toContain('notarial');
  });

  test('8. Footer Estructurado en 5 Columnas con Enlaces B2B y Personas', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Columnas verificadas
    await expect(footer.getByRole('heading', { name: 'Para Personas' })).toBeVisible();
    await expect(footer.getByRole('heading', { name: 'Soluciones B2B' })).toBeVisible();
    await expect(footer.getByRole('heading', { name: 'Plataforma SaaS' })).toBeVisible();
    await expect(footer.getByRole('heading', { name: 'Contacto & Legal' })).toBeVisible();

    // Enlaces cruzados presentes
    await expect(footer.locator('a[href="/empresas/prestamistas"]')).toBeVisible();
    await expect(footer.locator('a[href="/empresas/financieras"]')).toBeVisible();
    await expect(footer.locator('a[href="/empresas/estudios"]')).toBeVisible();
    await expect(footer.locator('a[href="/demo/nova"]')).toBeVisible();
    await expect(footer.locator('a[href="/simulador"]')).toBeVisible();
  });

  test('9. Navegación Móvil (Drawer) Equilibrada: Personas & Empresas', async ({ page }) => {
    // Forzar viewport móvil
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Abrir menú móvil
    const menuBtn = page.locator('button[aria-label="Abrir menú"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Validar Bloque B2B dentro del drawer
    const drawer = page.locator('.animate-in');
    await expect(drawer.locator('text=HIPOTECALY PLATFORM (B2B)')).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Prestamistas', exact: true })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Financieras', exact: true })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Escribanías', exact: true })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Demo NOVA', exact: true })).toBeVisible();

    // Validar Bloque Personas
    await expect(drawer.locator('text=Marketplace para Personas')).toBeVisible();
    await expect(drawer.locator('text=Simulador de Cuotas')).toBeVisible();
  });

});
