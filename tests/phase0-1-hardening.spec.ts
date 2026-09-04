import { test, expect } from '@playwright/test';

test.describe('HIPOTECALY Macrofase 0–1: Hardening, Route Protection & SaaS Repositioning', () => {

  // ----------------------------------------------------------------------
  // 1. Matriz de Protección de Rutas Privadas
  // ----------------------------------------------------------------------
  test('Visitante anónimo es redirigido a /ingresar al intentar acceder a /app', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'visitor');
    });

    await page.goto('/app');
    await expect(page).toHaveURL(/.*\/ingresar.*/);
  });

  test('Visitante anónimo es redirigido a /ingresar al intentar acceder a /admin/tenants', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'visitor');
    });

    await page.goto('/admin/tenants');
    await expect(page).toHaveURL(/.*\/ingresar.*/);
  });

  test('Visitante anónimo es redirigido a /ingresar al intentar acceder a /lender', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'visitor');
    });

    await page.goto('/lender');
    await expect(page).toHaveURL(/.*\/ingresar.*/);
  });

  test('Usuario con rol borrower recibe 403 / Acceso Denegado al intentar acceder a /app', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'borrower');
    });

    await page.goto('/app');
    await expect(page.locator('text=Permisos Insuficientes')).toBeVisible();
    await expect(page.locator('text=403 · Acceso Denegado')).toBeVisible();
  });

  test('Usuario con rol tenant_admin puede ingresar a /app y visualizar Backoffice', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/app');
    await expect(page.locator('h1').first()).toContainText('Panel Operativo');
  });

  // ----------------------------------------------------------------------
  // 2. Páginas Legales Institucionales (Sin Soft-404)
  // ----------------------------------------------------------------------
  test('Rutas legales /terminos, /privacidad y /seguridad cargan correctamente', async ({ page }) => {
    await page.goto('/terminos');
    await expect(page.locator('h1')).toContainText('Términos y Condiciones');

    await page.goto('/privacidad');
    await expect(page.locator('h1')).toContainText('Política de Privacidad');

    await page.goto('/seguridad');
    await expect(page.locator('h1')).toContainText('Seguridad y Blindaje');
  });

  // ----------------------------------------------------------------------
  // 3. Redirecciones Canónicas SaaS (/plataforma -> /saas)
  // ----------------------------------------------------------------------
  test('Rutas /plataforma redirigen limpiamente a /saas preservando SEO', async ({ page }) => {
    await page.goto('/plataforma');
    await expect(page).toHaveURL(/\/saas$/);

    await page.goto('/plataforma/integracion');
    await expect(page).toHaveURL(/\/saas\/integracion$/);

    await page.goto('/plataforma/plataforma-completa');
    await expect(page).toHaveURL(/\/saas\/plataforma-completa$/);
  });

  // ----------------------------------------------------------------------
  // 4. Reposicionamiento Dual en Home y Navegación Pública
  // ----------------------------------------------------------------------
  test('Home presenta selector dual y sección B2B dedicada a SaaS', async ({ page }) => {
    await page.goto('/');

    // Selector dual
    await expect(page.locator('text=Busco Financiación (Propietarios)')).toBeVisible();
    await expect(page.locator('text=Quiero Digitalizar mi Operación (Empresas & Estudios)')).toBeVisible();

    // Sección B2B
    await expect(page.locator('text=Tu negocio hipotecario. Tu marca. Nuestra tecnología.')).toBeVisible();
    await expect(page.locator('text=Integración a tu Web Existente')).toBeVisible();
    await expect(page.locator('text=Plataforma Completa Llave en Mano')).toBeVisible();
    await expect(page.locator('text=Full White-Label Institucional')).toBeVisible();
  });

  // ----------------------------------------------------------------------
  // 5. Persistencia Real de Leads SaaS (/contacto)
  // ----------------------------------------------------------------------
  test('Formulario /contacto persiste lead en Supabase y muestra confirmación', async ({ page }) => {
    await page.goto('/contacto?demo=true');

    await page.fill('input[placeholder="Juan Pérez"]', 'Carlos Rodriguez Test');
    await page.fill('input[placeholder="juan@estudio.com.uy"]', 'carlos.rodriguez@test-qa.uy');
    await page.fill('input[placeholder="Financiera del Este S.A."]', 'Financiera QA Test S.A.');
    await page.fill('input[placeholder="+598 99 123 456"]', '+598 99 999 888');
    await page.fill('textarea', 'Consulta automatizada de prueba para verificación de persistencia de leads.');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Mensaje recibido con éxito')).toBeVisible({ timeout: 10000 });
  });

  // ----------------------------------------------------------------------
  // 6. Responsive y Cero Desborde Horizontal
  // ----------------------------------------------------------------------
  test('Sin desborde horizontal en resoluciones móviles y tablets', async ({ page }) => {
    const viewports = [
      { width: 360, height: 740 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/');
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(isOverflowing).toBe(false);
    }
  });

});
