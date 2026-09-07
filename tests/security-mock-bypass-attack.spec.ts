import { test, expect } from '@playwright/test';

// Ejecutar ataques contra entorno productivo
const TARGET_URL = process.env.BASE_URL || 'https://hipotecaly.vercel.app';

test.describe('HIPOTECALY — Verificación de Microcierre de Seguridad (Ataques Mock Bypass)', () => {

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('Ataque 1: Inyección de hipotecaly_test_role=super_admin en /admin debe ser DENEGADO / REDIRIGIDO', async ({ page }) => {
    // Inyectar ataque en localStorage antes de cargar la página
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'super_admin');
    });

    await page.goto(`${TARGET_URL}/admin`);

    // En producción, debe redirigir a /ingresar sin dar acceso a la consola Super Admin
    await expect(page).toHaveURL(/.*\/ingresar/);
    await expect(page.locator('text=Ingresar a tu cuenta').first()).toBeVisible();
    await expect(page.locator('text=Consola Maestra Super Admin')).not.toBeVisible();
  });

  test('Ataque 2: Inyección de hipotecaly_test_role=tenant_admin en /demo/estudio-nova/admin debe ser DENEGADO / REDIRIGIDO', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto(`${TARGET_URL}/demo/estudio-nova/admin`);

    await expect(page).toHaveURL(/.*\/ingresar/);
    await expect(page.locator('text=Ingresar a tu cuenta').first()).toBeVisible();
  });

  test('Ataque 3: Inyección de hipotecaly_test_role=lender en /demo/estudio-nova/inversor debe ser DENEGADO / REDIRIGIDO', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'lender');
    });

    await page.goto(`${TARGET_URL}/demo/estudio-nova/inversor`);

    await expect(page).toHaveURL(/.*\/ingresar/);
    await expect(page.locator('text=Ingresar a tu cuenta').first()).toBeVisible();
  });

  test('Ataque 4: Inyección de hipotecaly_test_role=borrower en /demo/estudio-nova/cliente debe ser DENEGADO / REDIRIGIDO', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'borrower');
    });

    await page.goto(`${TARGET_URL}/demo/estudio-nova/cliente`);

    await expect(page).toHaveURL(/.*\/ingresar/);
    await expect(page.locator('text=Ingresar a tu cuenta').first()).toBeVisible();
  });

  test('Aislamiento Cross-Tenant: Inyección de rol local no permite acceso a otros tenants', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto(`${TARGET_URL}/demo/inmo-alpha/admin`);

    await expect(page).toHaveURL(/.*\/ingresar/);
  });

  test('Ataque 5: Intento de escalación con user_metadata.role="super_admin" en /admin debe ser DENEGADO', async ({ page }) => {
    // Simular inyección en cliente de sesión con user_metadata.role modificado
    await page.addInitScript(() => {
      // Intentar inyectar sesión adulterada en Supabase localStorage key
      const fakeSession = {
        access_token: 'fake-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'fake-refresh',
        user: {
          id: 'u-hacker-test',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'hacker@test.com',
          user_metadata: {
            role: 'super_admin',
            first_name: 'Hacker',
            last_name: 'Malicious'
          },
          app_metadata: {
            provider: 'email',
            providers: ['email']
          }
        }
      };
      // Inyectar en todas las keys potenciales de supabase
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.includes('auth-token')) {
          window.localStorage.setItem(key, JSON.stringify(fakeSession));
        }
      }
    });

    await page.goto(`${TARGET_URL}/admin`);
    // Debe denegar acceso y redirigir
    await expect(page).toHaveURL(/.*\/ingresar/);
  });

  test('Ataque 6: Intento de escalación con user_metadata.role="tenant_admin" en /demo/estudio-nova/admin/configuracion debe ser DENEGADO', async ({ page }) => {
    await page.goto(`${TARGET_URL}/demo/estudio-nova/admin/configuracion`);
    await expect(page).toHaveURL(/.*\/ingresar/);
  });

});
