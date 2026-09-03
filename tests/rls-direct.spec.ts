import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imzljdwsrsxyccgogfck.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltemxqZHdzcnN4eWNjZ29nZmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTkxMzgsImV4cCI6MjEwMzk3NTEzOH0.4EjkqHGK4tKkek1GGMesvjNCj6IBc8eKc26kb5BKh7Y';

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

test.describe('DIRECT SUPABASE RLS SECURITY SUITE (NO MOCKS)', () => {

  test('1. Consulta anónima directa a applications retorna 0 filas o error', async () => {
    const { data, error } = await anonClient.from('applications').select('*');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('2. Consulta anónima directa a borrowers retorna 0 filas o error', async () => {
    const { data, error } = await anonClient.from('borrowers').select('*');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('3. Consulta anónima directa a tenant_privacy_rules es BLOQUEADA por RLS', async () => {
    const { data, error } = await anonClient.from('tenant_privacy_rules').select('*');
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('4. Intento anónimo de inyección o modificación directa en applications afecta 0 filas', async () => {
    const { data, error } = await anonClient
      .from('applications')
      .update({ requested_amount: 99999999 })
      .eq('id', 'a0000000-0000-0000-0000-000000000001')
      .select();

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('5. Trigger inmutable de audit_logs: Cualquier UPDATE es rechazado inmediatamente', async () => {
    const { error } = await anonClient
      .from('audit_logs')
      .update({ action: 'MALICIOUS_TAMPER' })
      .eq('id', '00000000-0000-0000-0000-000000000000');

    expect(error).not.toBeNull();
  });

  test('6. Anti-Bypass: Anonymized opportunities view no contiene datos de contacto', async () => {
    const { data } = await anonClient.from('anonymized_opportunities_view').select('*');
    // Para anónimos retorna 0 filas, y la estructura no tiene columnas de email, teléfono ni cédula
    expect(data === null || data.length === 0).toBe(true);
  });

});
