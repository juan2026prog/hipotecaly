import { test, expect } from '@playwright/test';

test.describe('SEGURIDAD Y AISLAMIENTO MULTI-TENANT', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'super_admin');
    });
  });

  test('Aislamiento de branding y configuración: NO hay filtración de datos de otro tenant', async ({ page }) => {
    // 1. Visitar tenant Estudio Nova
    await page.goto('/demo/estudio-nova');
    await expect(page.locator('text=ESTUDIO NOVA').first()).toBeVisible();
    await expect(page.locator('text=Estudio Notarial del Este')).not.toBeVisible();

    // 2. Visitar ruta de organización diferente
    await page.goto('/org/estudio-notarial-este');
    await expect(page.locator('text=Créditos Hipotecarios Punta del Este')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=ESTUDIO NOVA')).not.toBeVisible();
  });

  test('Prevención de manipulación de URL: Tenant desconocido no filtra datos de terceros', async ({ page }) => {
    // Visitar un slug de tenant inexistente
    await page.goto('/org/tenant-fantasma-malicioso');
    
    // Debe aplicar fallback seguro al tenant matriz o no revelar información sensible
    const content = await page.content();
    expect(content).not.toContain('ESTUDIO NOVA S.A.S.');
    expect(content).not.toContain('Dr. Balestra');
  });

  test('Aislamiento de expedientes y storage privado en backoffice', async ({ page }) => {
    await page.goto('/app/solicitudes/e0000000-0000-0000-0000-000000000001');

    // Comprobar presencia de documentos
    await page.getByRole('button', { name: /^Documentos$/i }).first().click();
    await expect(page.locator('text=Gestión Documental').first()).toBeVisible();

    // Los documentos sensibles no tienen URLs públicas desprotegidas
    const enlaces = await page.$$eval('a', (as) => as.map((a) => a.href));
    const publicStorageLeaks = enlaces.filter((href) => href.includes('storage.supabase.co/object/public'));
    expect(publicStorageLeaks.length).toBe(0);
  });

  test('Aislamiento de roles y funciones operativas del backoffice', async ({ page }) => {
    // Ingresar al panel operativo
    await page.goto('/app');
    await expect(page.locator('text=Panel Operativo')).toBeVisible();

    // Comprobar que no se exponen credenciales ni tokens de otros tenants en el DOM
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('service_role');
    expect(bodyText).not.toContain('secret_token');
  });

});
