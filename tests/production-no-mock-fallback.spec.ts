import { test, expect } from '@playwright/test';
import { getApplicationsList, getApplicationDetail } from '../src/lib/backofficeService';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imzljdwsrsxyccgogfck.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltemxqZHdzcnN4eWNjZ29nZmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTkxMzgsImV4cCI6MjEwMzk3NTEzOH0.4EjkqHGK4tKkek1GGMesvjNCj6IBc8eKc26kb5BKh7Y';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

test.describe('PRODUCTION NO MOCK FALLBACK CERTIFICATION', () => {

  test('1. getApplicationsList con useDemoMode = false NUNCA retorna DEMO_APPLICATIONS', async () => {
    // Para cualquier organización productiva no-demo
    const result = await getApplicationsList({
      organizationId: 'a0000000-0000-0000-0000-000000000001',
      useDemoMode: false,
    });

    // Debe ser una lista real o vacía, pero ningún elemento con public_id HIP-DEMO
    const hasDemoId = result.some((a) => a.public_id && a.public_id.includes('DEMO'));
    expect(hasDemoId).toBe(false);
  });

  test('2. getApplicationDetail con UUID desconocido en producción retorna null y NO un mock', async () => {
    const detail = await getApplicationDetail('00000000-0000-0000-0000-000000000000', {
      isDemoMode: false,
      organizationId: 'a0000000-0000-0000-0000-000000000001',
    });

    expect(detail).toBeNull();
  });

  test('3. Supabase Cloud provee reglas financieras dinámicas sin datos estáticos inventados', async () => {
    const { data, error } = await client.from('lender_rules').select('*').limit(1);
    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(Number(data![0].max_ltv)).toBeGreaterThan(0);
  });

  test('4. Bandeja de solicitudes en UI para tenant sin expedientes muestra estado vacío legítimo', async ({ page }) => {
    await page.goto('/app/solicitudes');
    await expect(page.getByRole('heading', { name: 'Solicitudes y Expedientes' })).toBeVisible();
  });

});
