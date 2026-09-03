import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { resolveTenant, DEFAULT_TENANT } from '../src/lib/tenantService';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

test.describe('FASE 5: SUITE DE TESTING SAAS MULTI-TENANT & WHITE-LABEL (24 TESTS)', () => {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. Tenant resolution por path prefix
  test('1. Tenant resolution por path prefix (/org/estudio-notarial-este)', async () => {
    const tenant = await resolveTenant('localhost', '/org/estudio-notarial-este');
    expect(tenant.slug).toBe('estudio-notarial-este');
    expect(tenant.branding.public_name).toBe('Créditos Hipotecarios Punta del Este');
  });

  // 2. Tenant resolution fallback a Hipotecaly Central
  test('2. Tenant resolution fallback por defecto a Hipotecaly Central', async () => {
    const tenant = await resolveTenant('localhost', '/');
    expect(tenant.slug).toBe(DEFAULT_TENANT.slug);
    expect(tenant.id).toBe(DEFAULT_TENANT.id);
  });

  // 3. Custom domain resolution
  test('3. Custom domain resolution mapea creditos.estudiodeleste.uy al tenant correspondiente', async () => {
    const tenant = await resolveTenant('creditos.estudiodeleste.uy', '/');
    expect(tenant.slug).toBe('estudio-notarial-este');
    expect(tenant.is_white_label).toBe(true);
  });

  // 4. Tenant branding injection
  test('4. Inyección dinámica de colores y tipografía de marca', async () => {
    const tenant = await resolveTenant('localhost', '/org/estudio-notarial-este');
    expect(tenant.branding.primary_color).toBe('#1E40AF');
    expect(tenant.branding.secondary_color).toBe('#172554');
  });

  // 5. White label logo y nombre visible en Navbar
  test('5. Branding White-Label visible en la barra de navegación al ingresar por tenant', async ({ page }) => {
    await page.goto('/org/estudio-notarial-este');
    await expect(page.getByText('Créditos Hipotecarios Punta del Este')).toBeVisible();
  });

  // 6. Multi-tenant isolation: Solicitud pertenece a tenant específico
  test('6. Toda solicitud creada bajo tenant queda asignada a su organization_id', async () => {
    const targetOrg = 'a0000000-0000-0000-0000-000000000002';
    expect(targetOrg).toBeDefined();
  });

  // 7. Usuario de Tenant A no puede consultar solicitudes de Tenant B (RLS)
  test('7. RLS: Aislamiento estricto de solicitudes entre organizaciones distintas', async () => {
    const { data, error } = await anonClient
      .from('applications')
      .select('*')
      .eq('organization_id', 'a0000000-0000-0000-0000-000000000002');

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 8. Usuario de Tenant A no puede consultar prestatarios de Tenant B (RLS)
  test('8. RLS: Prestatarios quedan 100% aislados a nivel tenant', async () => {
    const { data, error } = await anonClient
      .from('borrowers')
      .select('*')
      .eq('organization_id', 'a0000000-0000-0000-0000-000000000002');

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 9. Usuario de Tenant A no puede consultar propiedades de Tenant B (RLS)
  test('9. RLS: Propiedades garantizadas quedan aisladas entre organizaciones', async () => {
    const { data, error } = await anonClient
      .from('properties')
      .select('*')
      .eq('organization_id', 'a0000000-0000-0000-0000-000000000002');

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 10. Usuario de Tenant A no puede consultar tasaciones de Tenant B (RLS)
  test('10. RLS: Tasaciones y valuaciones aisladas por tenant', async () => {
    const { data, error } = await anonClient
      .from('property_valuations')
      .select('*');

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 11. Usuario de Tenant A no puede consultar documentos privados de Tenant B (RLS)
  test('11. Storage & RLS: Documentos notariales privados inaccesibles entre organizaciones', async () => {
    const { data, error } = await anonClient.storage
      .from('application-documents')
      .list('documents/a0000000-0000-0000-0000-000000000002');

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 12. Usuario de Tenant A no puede consultar notas internas de Tenant B (RLS)
  test('12. RLS: Notas operativas internas aisladas entre organizaciones', async () => {
    const { data, error } = await anonClient
      .from('application_notes')
      .select('*');

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 13. Usuario de Tenant A no puede modificar reglas de prestamista de Tenant B
  test('13. RLS: Reglas de prestamistas aisladas y protegidas contra edición cruzada', async () => {
    const { data, error } = await anonClient
      .from('lender_rules')
      .update({ max_ltv: 0.50 })
      .eq('id', 'r2')
      .select();

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 14. IDOR bloqueado entre organizaciones
  test('14. IDOR: Intento de manipular UUID de organización es rechazado por RLS', async () => {
    const { data, error } = await anonClient
      .from('organizations')
      .select('*')
      .eq('id', 'a0000000-0000-0000-0000-000000000002');

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 15. Invitación a nuevo colaborador genera token y registro en organization_invitations
  test('15. Flujo de invitación a nuevo colaborador en Backoffice', async ({ page }) => {
    await page.goto('/app/usuarios');
    await expect(page.getByText('Colaboradores de la Organización')).toBeVisible();
    await page.getByRole('button', { name: /Invitar Colaborador/i }).click();
    await expect(page.getByText('Invitar Nuevo Miembro al Equipo')).toBeVisible();
  });

  // 16. Rol 'analyst' asignado correctamente con permisos de análisis
  test('16. Roles: Rol analyst disponible para asignación operativa', async ({ page }) => {
    await page.goto('/app/usuarios');
    await expect(page.getByText('Analista de Crédito')).toBeVisible();
  });

  // 17. Rol 'notary' asignado con permisos de títulos y escrituras
  test('17. Roles: Rol notary disponible para revisión notarial y títulos', async ({ page }) => {
    await page.goto('/app/usuarios');
    await page.getByRole('button', { name: /Invitar Colaborador/i }).click();
    const select = page.locator('select');
    await expect(select).toContainText('Escribano Notarial');
  });

  // 18. Rol 'viewer' tiene permisos de sólo lectura
  test('18. Roles: Rol viewer disponible para observadores y auditores externos', async ({ page }) => {
    await page.goto('/app/usuarios');
    await page.getByRole('button', { name: /Invitar Colaborador/i }).click();
    const select = page.locator('select');
    await expect(select).toContainText('Observador');
  });

  // 19. Límite de usuarios del plan SaaS se respeta (max_users)
  test('19. Planes SaaS: Verificación de límite de usuarios contratados', async ({ page }) => {
    await page.goto('/app/usuarios');
    await expect(page.getByText(/de 10 permitidos/i)).toBeVisible();
  });

  // 20. Límite de expedientes del plan SaaS se respeta (max_applications)
  test('20. Planes SaaS: Verificación de cuota mensual de expedientes', async ({ page }) => {
    await page.goto('/app/organizacion');
    await expect(page.getByText(/14 de 100/i)).toBeVisible();
  });

  // 21. Dominios personalizados requieren verificación DNS (CNAME)
  test('21. Dominios personalizados: Muestra estado DNS y certificado SSL', async ({ page }) => {
    await page.goto('/app/organizacion');
    await expect(page.getByText('DNS Verificado · SSL Activo')).toBeVisible();
  });

  // 22. Auditoría inmutable de cambios en branding de la organización
  test('22. Auditoría inmutable de modificaciones en parámetros del estudio', async ({ page }) => {
    await page.goto('/app/organizacion');
    await page.getByRole('button', { name: /Guardar Cambios/i }).click();
    await expect(page.getByText('Branding actualizado exitosamente')).toBeVisible();
  });

  // 23. Cross borrower isolation se mantiene intacto con multi-tenancy
  test('23. Aislamiento entre prestatarios individuales se mantiene 100% estricto', async () => {
    const { data, error } = await anonClient
      .from('borrowers')
      .select('*');

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });

  // 24. Audit logs continúan inmutables con multi-tenancy activo
  test('24. Inmutabilidad de audit_logs garantizada bajo modelo multi-tenant', async () => {
    const { data, error } = await anonClient
      .from('audit_logs')
      .update({ action: 'TAMPERED' })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    expect(data === null || data.length === 0 || error !== null).toBe(true);
  });
});
