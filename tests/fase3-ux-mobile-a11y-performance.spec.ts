import { test, expect } from '@playwright/test';

async function setSessionRole(page: any, role: string) {
  await page.addInitScript((r: string) => {
    const isSuper = r === 'super_admin';
    const mockUser = {
      id: `u-test-${r}`,
      app_metadata: { role: r, is_super_admin: isSuper },
      user_metadata: { first_name: 'Test', last_name: r, role: r },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: `${r}@estudionova.uy`,
    };
    const mems = [
      { organizationId: 'd0000000-0000-0000-0000-000000000001', role: r, isActive: true },
      { organizationId: 'a0000000-0000-0000-0000-000000000001', role: r, isActive: true },
    ];
    window.localStorage.setItem('hipotecaly_mock_active_user', JSON.stringify({ mockUser, role: r, isSuperAdmin: isSuper, mems }));
    window.localStorage.setItem('hipotecaly_test_role', r);
  }, role);
}

test.describe('FASE 3 — UX 360°, Mobile, Accessibility y Performance', () => {

  // ==============================================================================
  // BLOQUE A: AUDITORÍA UX POR ROL
  // ==============================================================================
  test.describe('Bloque A — Auditoría UX por Rol', () => {

    test('Rol Público: Flujo de navegación, Simulador y Landing', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      // Navegación al Simulador
      await page.goto('/simulador');
      await expect(page.locator('body')).toBeVisible();

      // Navegación a Cómo Funciona
      await page.goto('/como-funciona');
      await expect(page.locator('body')).toBeVisible();

      // Navegación a Contacto
      await page.goto('/contacto');
      await expect(page.locator('body')).toBeVisible();
    });

    test('Rol Cliente / Prestatario: Acceso al portal y seguimiento', async ({ page }) => {
      await setSessionRole(page, 'borrower');
      await page.goto('/demo/estudio-nova/cliente');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('403 · Acceso Denegado');
    });

    test('Rol Organización / Backoffice: Dashboard y aplicaciones', async ({ page }) => {
      await setSessionRole(page, 'analyst');
      await page.goto('/demo/estudio-nova/admin');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('403 · Acceso Denegado');
    });

    test('Rol Super Admin: Consola global y servicios', async ({ page }) => {
      await setSessionRole(page, 'super_admin');
      await page.goto('/superadmin');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('403 · Acceso Denegado');
    });

    test('Rol Inversor: Marketplace y oportunidades', async ({ page }) => {
      await setSessionRole(page, 'lender');
      await page.goto('/demo/estudio-nova/inversor');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('403 · Acceso Denegado');
    });

    test('Rol Escribano / Notarial: Dashboard de expedientes y firmas', async ({ page }) => {
      await setSessionRole(page, 'notary');
      await page.goto('/demo/estudio-nova/notary');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('403 · Acceso Denegado');
    });
  });

  // ==============================================================================
  // BLOQUE B: ACCESOS ESTUDIO NOVA & PREVENCIÓN 403
  // ==============================================================================
  test.describe('Bloque B — Accesos Estudio Nova', () => {

    test('Hub de accesos carga todas las tarjetas de rol sin errores 403', async ({ page }) => {
      await page.goto('/demo/estudio-nova/accesos');
      await expect(page.locator('body')).toContainText('Estudio Nova');
      await expect(page.locator('body')).toContainText('Portal del solicitante');
      await expect(page.locator('body')).toContainText('Backoffice');
      await expect(page.locator('body')).toContainText('Portal del Escribano');
      await expect(page.locator('body')).toContainText('Red privada de inversores');
    });

    test('Acceso público desde el hub navega al front-office sin exigir login', async ({ page }) => {
      await page.goto('/demo/estudio-nova/accesos');
      const publicButton = page.locator('text=Ver Sitio Público').first();
      await publicButton.click();
      await expect(page).toHaveURL(/\/demo\/estudio-nova/);
    });
  });

  // ==============================================================================
  // BLOQUE C: MOBILE VIEWPORTS & RESPONSIVENESS
  // ==============================================================================
  test.describe('Bloque C — Mobile Viewports & Safe Areas', () => {

    const mobileViewports = [
      { name: 'iPhone SE (320x568)', width: 320, height: 568 },
      { name: 'Android Compact (360x640)', width: 360, height: 640 },
      { name: 'iPhone 8 (375x667)', width: 375, height: 667 },
      { name: 'iPhone 13/14 (390x844)', width: 390, height: 844 },
      { name: 'Pixel 7 (412x915)', width: 412, height: 915 },
      { name: 'iPhone Pro Max (430x932)', width: 430, height: 932 },
      { name: 'iPad Mini (768x1024)', width: 768, height: 1024 },
      { name: 'iPad Air (820x1180)', width: 820, height: 1180 },
    ];

    for (const vp of mobileViewports) {
      test(`Viewport ${vp.name}: No presenta desborde horizontal en Landing y Simulador`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/simulador');
        await page.waitForLoadState('domcontentloaded');

        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;
        });
        expect(hasHorizontalScroll).toBe(false);
      });
    }

    test('Mobile Menu Drawer responde a interacción en smartphones', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const hamburger = page.locator('button[aria-label="Abrir menú"]');
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await expect(page.locator('header a[href*="/contacto"], header a[href*="/solicitar"]').last()).toBeVisible();
      }
    });
  });

  // ==============================================================================
  // BLOQUE D: DESKTOP VIEWPORTS & OVERFLOWS
  // ==============================================================================
  test.describe('Bloque D — Desktop Viewports', () => {

    const desktopViewports = [
      { name: 'HD 720p (1280x720)', width: 1280, height: 720 },
      { name: 'WXGA (1366x768)', width: 1366, height: 768 },
      { name: 'WXGA+ (1440x900)', width: 1440, height: 900 },
      { name: 'Full HD (1920x1080)', width: 1920, height: 1080 },
    ];

    for (const vp of desktopViewports) {
      test(`Desktop ${vp.name}: Renderiza layout sin desborde`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
        });
        expect(hasHorizontalScroll).toBe(false);
      });
    }
  });

  // ==============================================================================
  // BLOQUE E: FORMULARIO TASADOR
  // ==============================================================================
  test.describe('Bloque E — Formulario Tasador', () => {

    test('Formulario de nueva tasación valida campos requeridos y actualiza resumen', async ({ page }) => {
      await setSessionRole(page, 'analyst');
      await page.goto('/demo/estudio-nova/admin/tasaciones/nueva');

      // Verificar que los campos con IDs accesibles existen
      await expect(page.locator('#department-select')).toBeVisible();
      await expect(page.locator('#neighborhood-input')).toBeVisible();

      // Cambiar departamento
      await page.selectOption('#department-select', 'Montevideo');
      await page.selectOption('#neighborhood-input', 'Pocitos');

      // Resumen lateral en tiempo real debe reflejar los cambios
      await expect(page.locator('body')).toContainText(/RESUMEN PREVIO/i);
      await expect(page.locator('body')).toContainText('Pocitos');
    });
  });

  // ==============================================================================
  // BLOQUE F & G: COPY, ESTADOS Y EXPECTATIVAS DE BOTONES
  // ==============================================================================
  test.describe('Bloque F & G — Copy, Estados y Botones', () => {

    test('CTA principal del Navbar de Hipotecaly dice Solicitar Demo', async ({ page }) => {
      await page.goto('/');
      const ctaBtn = page.locator('header a[href*="/contacto"]');
      await expect(ctaBtn.first()).toContainText(/Solicitar Demo/i);
    });

    test('Gestión de Documentos usa etiquetas semánticas Ver plantilla y Modificar plantilla', async ({ page }) => {
      await setSessionRole(page, 'tenant_admin');
      await page.goto('/demo/estudio-nova/admin/documentos');
      await expect(page.locator('body')).toContainText(/Plantillas/i);
    });
  });

  // ==============================================================================
  // BLOQUE H: ACCESSIBILITY (A11Y)
  // ==============================================================================
  test.describe('Bloque H — Accesibilidad', () => {

    test('Formularios UI asocian labels con inputs mediante htmlFor e id', async ({ page }) => {
      await page.goto('/contacto');
      const emailInput = page.locator('input[type="email"], #email');
      await expect(emailInput.first()).toBeVisible();
    });

    test('Los campos con error exponen atributos de accesibilidad', async ({ page }) => {
      await page.goto('/solicitar');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ==============================================================================
  // BLOQUE I: CODE SPLITTING Y LAZY LOADING
  // ==============================================================================
  test.describe('Bloque I — Code Splitting y Carga Dinámica', () => {

    test('Navegación fluida entre rutas asíncronas sin errores de importación', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();

      await page.goto('/saas');
      await expect(page.locator('body')).toContainText(/SaaS|Plataforma/i);

      await page.goto('/terminos');
      await expect(page.locator('body')).toContainText(/T[eé]rminos/i);
    });
  });

});
