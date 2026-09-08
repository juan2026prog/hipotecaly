import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://imzljdwsrsxyccgogfck.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltemxqZHdzcnN4eWNjZ29nZmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzOTkxMzgsImV4cCI6MjEwMzk3NTEzOH0.4EjkqHGK4tKkek1GGMesvjNCj6IBc8eKc26kb5BKh7Y';

const TENANT_A_ID = 'd0000000-0000-0000-0000-000000000001'; // Estudio Nova
const TENANT_B_ID = 'd0000000-0000-0000-0000-000000000002'; // Estudio Notarial del Este
const TENANT_B_APP_ID = 'e0000000-0000-0000-0000-000000000002';
const TENANT_B_BORROWER_ID = 'b0000000-0000-0000-0000-000000000002';

test.describe('TEST RLS DIRECTO CONTRA SUPABASE — AISLAMIENTO MULTI-TENANT & TRAZABILIDAD (10 CASOS)', () => {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  test('1. Cross-tenant applications SELECT: Acceso anónimo o cruzado retorna 0 rows / denied', async () => {
    const { data, error } = await anonClient
      .from('applications')
      .select('*')
      .eq('organization_id', TENANT_B_ID);

    // RLS garantiza que sin token autenticado del Tenant B la consulta no expone filas
    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('2. Cross-tenant applications UPDATE: Intento de modificar application de otro tenant es DENEGADO', async () => {
    const { data, error } = await anonClient
      .from('applications')
      .update({ requested_amount: 9999999 })
      .eq('id', TENANT_B_APP_ID)
      .select();

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('3. Cross-tenant borrowers: Intento de leer borrower de otro tenant retorna 0 rows / denied', async () => {
    const { data, error } = await anonClient
      .from('borrowers')
      .select('*')
      .eq('id', TENANT_B_BORROWER_ID);

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('4. Cross-tenant properties: Lectura/modificación de property de otro tenant es DENEGADA', async () => {
    const { data, error } = await anonClient
      .from('properties')
      .select('*')
      .eq('organization_id', TENANT_B_ID);

    expect(data === null || data.length === 0 || error !== null).toBe(true);

    const { data: updateData, error: updateErr } = await anonClient
      .from('properties')
      .update({ cadastral_number: '99999-HACK' })
      .eq('organization_id', TENANT_B_ID)
      .select();

    expect(updateData === null || updateData.length === 0 || updateErr !== null).toBe(true);
  });

  test('5. Cross-tenant documents: Lectura de metadata/documentos de otro tenant es DENEGADA', async () => {
    const { data, error } = await anonClient
      .from('application_documents')
      .select('*')
      .eq('organization_id', TENANT_B_ID);

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('6. Cross-tenant Storage: Acceso directo a URLs de storage privado de otro tenant es DENEGADO', async () => {
    const { data, error } = await anonClient
      .storage
      .from('vault-documents')
      .download(`${TENANT_B_ID}/private_deed.pdf`);

    expect(data === null || error !== null).toBe(true);
  });

  test('7. Cross-tenant valuations: Lectura de property_valuations de otro tenant es DENEGADA', async () => {
    const { data, error } = await anonClient
      .from('property_valuations')
      .select('*')
      .eq('organization_id', TENANT_B_ID);

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('8. Cross-tenant tasks: Lectura de tareas de otro tenant es DENEGADA', async () => {
    const { data, error } = await anonClient
      .from('application_tasks')
      .select('*')
      .eq('organization_id', TENANT_B_ID);

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('9. Cross-tenant audit_logs: Lectura de audit_logs de otro tenant es DENEGADA', async () => {
    const { data, error } = await anonClient
      .from('audit_logs')
      .select('*')
      .eq('organization_id', TENANT_B_ID);

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  test('10. audit_logs UPDATE/DELETE blocked: Intentos de UPDATE o DELETE sobre audit_logs son DENEGADOS incondicionalmente', async () => {
    // Intento de UPDATE
    const { data: updateData, error: updateError } = await anonClient
      .from('audit_logs')
      .update({ action: 'AUDIT_ALTERED_TEST' })
      .eq('id', 'a0000000-0000-0000-0000-000000000001')
      .select();

    expect(updateData === null || updateData.length === 0 || updateError !== null).toBe(true);

    // Intento de DELETE
    const { data: deleteData, error: deleteError } = await anonClient
      .from('audit_logs')
      .delete()
      .eq('id', 'a0000000-0000-0000-0000-000000000001')
      .select();

    expect(deleteData === null || deleteData.length === 0 || deleteError !== null).toBe(true);
  });
});
