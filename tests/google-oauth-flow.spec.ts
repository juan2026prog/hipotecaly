import { test, expect } from '@playwright/test';

test.describe('HIPOTECALY — Google OAuth Authentication & Redirection Flow', () => {

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('1. Pantalla de Login: Botón "Continuar con Google" visible junto a opciones existentes', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'visitor');
    });
    await page.goto('/ingresar');

    // Botón de Google debe ser visible y tener texto claro
    const googleBtn = page.locator('button:has-text("Continuar con Google")');
    await expect(googleBtn).toBeVisible();

    // El formulario de email y contraseña sigue completamente operativo
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Iniciar sesión")')).toBeVisible();

    // Los accesos de demostración rápidos siguen presentes
    await expect(page.locator('text=Acceso Rápido Demo')).toBeVisible();
  });

  test('2. Pantalla de Registro: Botón "Registrarse con Google" visible', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'visitor');
    });
    await page.goto('/registro');

    const googleBtn = page.locator('button:has-text("Registrarse con Google")');
    await expect(googleBtn).toBeVisible();

    // Formulario de registro sigue intacto
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Crear cuenta")')).toBeVisible();
  });

  test('3. Callback Route: /auth/callback renderiza interfaz de verificación segura', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'visitor');
    });
    await page.goto('/auth/callback');

    // Verifica que cargue el shell seguro de Hipotecaly
    await expect(page.locator('text=HIPOTECALY')).toBeVisible();
    await expect(page.locator('text=Iniciando sesión segura').or(page.locator('text=No pudimos completar el acceso'))).toBeVisible();
  });

  test('4. Callback Route: Muestra error amigable si el provider devuelve error', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'visitor');
    });
    await page.goto('/auth/callback?error=access_denied&error_description=El+usuario+cancelo+el+consentimiento');

    await expect(page.locator('text=No pudimos completar el acceso')).toBeVisible();
    await expect(page.locator('text=El usuario cancelo el consentimiento')).toBeVisible();
    await expect(page.locator('button:has-text("Volver al inicio de sesión")')).toBeVisible();
  });

  test('5. Redirección por Perfil: Super Admin accede a /superadmin', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'super_admin');
    });
    await page.goto('/superadmin');
    await expect(page).toHaveURL(/\/superadmin/);
  });

  test('6. Redirección por Perfil: Escribano accede a /notary', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'notary');
    });
    await page.goto('/notary');
    await expect(page).toHaveURL(/\/notary/);
  });

  test('7. Redirección por Perfil: Tenant Admin accede a su Backoffice', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });
    await page.goto('/demo/estudio-nova/admin');
    await expect(page).toHaveURL(/\/demo\/estudio-nova\/admin/);
  });
});

