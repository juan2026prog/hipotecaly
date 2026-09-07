import { test, expect } from '@playwright/test';

test.describe('HIPOTECALY — Arquitectura Definitiva de Portales, Roles y White Label', () => {

  test.beforeEach(async ({ context }) => {
    // Resetear almacenamiento local para cada prueba
    await context.clearCookies();
  });

  // --------------------------------------------------------------------------
  // 1. Super Admin Hipotecaly (/admin)
  // --------------------------------------------------------------------------
  test('1. Super Admin: Accede a /admin y visualiza consola maestra con SuperAdminLayout', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'super_admin');
    });

    await page.goto('/admin');
    await expect(page.locator('text=Consola Maestra Super Admin').first()).toBeVisible();
    await expect(page.locator('text=PRODUCCIÓN ACTIVA').first()).toBeVisible();
    await expect(page.locator('text=Control global de infraestructura').first()).toBeVisible();
  });

  test('2. Super Admin: Rutas legacy /platform-admin y /admin/qa redirigen correctamente', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'super_admin');
    });

    await page.goto('/platform-admin');
    await expect(page).toHaveURL(/\/admin/);

    await page.goto('/admin/qa');
    await expect(page).toHaveURL(/\/admin\?tab=qa/);
  });

  test('3. Seguridad: Usuario no Super Admin es denegado en /admin', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/admin');
    await expect(page.locator('text=Esta consola de administración requiere privilegios de Super Admin').first()).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 2. Tenant Admin (/demo/estudio-nova/admin)
  // --------------------------------------------------------------------------
  test('4. Tenant Admin: Accede al Backoffice de su tenant pero no a la consola global /admin', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin');
    // Verifica que el dashboard del tenant cargue
    await expect(page.locator('text=Estudio Nova').first()).toBeVisible();

    // Intentar acceder a /admin debe ser bloqueado
    await page.goto('/admin');
    await expect(page.locator('text=Esta consola de administración requiere privilegios de Super Admin').first()).toBeVisible();
  });

  test('5. Tenant Admin: Puede acceder a /demo/estudio-nova/admin/configuracion', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/configuracion');
    // Verifica que no aparezca el bloqueo de permisos
    await expect(page.locator('text=Tu cuenta actual no cuenta con los roles necesarios')).not.toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 3. Analyst / Operador
  // --------------------------------------------------------------------------
  test('6. Analyst: Accede a operaciones del tenant pero es denegado en configuracion', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'analyst');
    });

    await page.goto('/demo/estudio-nova/admin');
    await expect(page.locator('text=Estudio Nova').first()).toBeVisible();

    // Intentar acceder a configuración debe mostrar AccessDenied
    await page.goto('/demo/estudio-nova/admin/configuracion');
    await expect(page.locator('text=Tu cuenta actual no cuenta con los roles necesarios').first()).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 4. Portal Cliente (/demo/estudio-nova/cliente)
  // --------------------------------------------------------------------------
  test('7. Cliente: Accede a su portal con TenantClientLayout y branding de Estudio Nova', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'borrower');
    });

    await page.goto('/demo/estudio-nova/cliente');
    await expect(page.locator('header').locator('text=ESTUDIO NOVA').first()).toBeVisible();
    await expect(page.locator('text=Mi financiación').first()).toBeVisible();
    await expect(page.locator('text=Tecnología provista por HIPOTECALY').first()).toBeVisible();

    // Denegado en /admin
    await page.goto('/admin');
    await expect(page.locator('text=Esta consola de administración requiere privilegios de Super Admin').first()).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 5. Red Privada de Inversores (/demo/estudio-nova/inversor)
  // --------------------------------------------------------------------------
  test('8. Inversor: Accede a su red privada de operaciones cuando el módulo está activo', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'lender');
    });

    await page.goto('/demo/estudio-nova/inversor');
    await expect(page.locator('text=Red Privada de Inversores').first()).toBeVisible();
    await expect(page.locator('header').locator('text=ESTUDIO NOVA').first()).toBeVisible();
    await expect(page.locator('text=Operaciones estructuradas exclusivamente por Estudio Nova').first()).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 6. Simulador y Wizard White Label (/demo/estudio-nova/simulador y /solicitar)
  // --------------------------------------------------------------------------
  test('9. Simulador y Wizard: Carga correctamente con tokens y reglas del tenant', async ({ page }) => {
    await page.goto('/demo/estudio-nova/simulador');
    await expect(page.locator('text=Simulador de Financiación Hipotecaria').first()).toBeVisible();
    await expect(page.locator('text=Estudio Nova').first()).toBeVisible();

    await page.goto('/demo/estudio-nova/solicitar');
    await expect(page.locator('text=Estudio Nova').first()).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 7. Aislamiento Cross-Tenant
  // --------------------------------------------------------------------------
  test('10. Cross-Tenant: Admin de un tenant es bloqueado al intentar entrar a otro tenant sin membresía', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    // Intentar acceder al tenant no perteneciente
    await page.goto('/demo/estudio-notarial-este/admin');
    // Al no tener membresía en ese tenant, ProtectedRoute con requireTenantMatch bloquea el acceso
    await expect(page.locator('text=No pertenecés a la organización').first()).toBeVisible();
  });

});
