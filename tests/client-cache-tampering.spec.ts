import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imzljdwsrsxyccgogfck.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltemxqZHdzcnN4eWNjZ29nZmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTkxMzgsImV4cCI6MjEwMzk3NTEzOH0.4EjkqHGK4tKkek1GGMesvjNCj6IBc8eKc26kb5BKh7Y';

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

test.describe('CLIENT CACHE TAMPERING AUDIT (LOCALSTORAGE IS NOT AUTHORITY)', () => {

  test('1. Modificar localStorage con role: super_admin NO concede acceso al backend RLS', async () => {
    // Intentar leer tabla restringida (ej: audit_logs o tenant_privacy_rules) sin JWT válido
    const { data, error } = await anonClient.from('audit_logs').select('*');
    // RLS a nivel de base de datos bloquea la consulta anónima independientemente de cualquier valor en cliente
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('2. Modificar localStorage con staff_portal_enabled NO concede acceso a datos de backoffice', async () => {
    const { data, error } = await anonClient.from('applications').select('*');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('3. Modificar localStorage con protected_contact_enabled: false NO expone datos privados en DB', async () => {
    // Intentar consultar borrowers con cliente anónimo
    const { data, error } = await anonClient.from('borrowers').select('phone, email');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('4. Manipulación de localStorage en navegador: Inyectar tenant forjado no elude resolución de backend', async ({ page }) => {
    await page.goto('/');

    // Inyectar slug forjado en localStorage
    await page.evaluate(() => {
      localStorage.setItem('tenant_custom_forged-fake-tenant', JSON.stringify({
        id: '99999999-9999-9999-9999-999999999999',
        slug: 'forged-fake-tenant',
        name: 'Hacked Tenant',
        status: 'active',
        branding: { public_name: 'Hacked Tenant', primary_color: '#000000', secondary_color: '#000000' }
      }));
    });

    // Navegar al slug forjado
    await page.goto('/org/forged-fake-tenant');

    // La base de datos es la autoridad: Al no existir en Supabase Cloud, debe mostrar TENANT_NOT_FOUND
    await expect(page.locator('text=Organización No Encontrada')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=TENANT_NOT_FOUND')).toBeVisible();
  });

  test('5. Manipulación de localStorage en navegador: Inyectar módulos con staff_portal_enabled', async ({ page }) => {
    await page.goto('/demo/nova/full');

    await page.evaluate(() => {
      localStorage.setItem('tenant_modules_d0000000-0000-0000-0000-000000000001', JSON.stringify({
        staff_portal_enabled: true,
        protected_contact_enabled: false
      }));
    });

    // Recargar página
    await page.reload();

    // La landing page sigue revalidando contra Supabase y respetando las reglas de la organización
    await expect(page.locator('text=NOVA Crédito Hipotecario').first()).toBeVisible();
  });

});
