// ==============================================================================
// TEST SUITE: SUPER ADMIN QA ACCESS & CONTROLLED INSPECTION
// Verificación completa de seguridad, sesiones reales Supabase, RLS y roles
// ==============================================================================

import { test, expect } from '@playwright/test';
import { QaSessionService } from '../server/qa/qaSessionService';
import { QaUserService } from '../server/qa/qaUserService';
import { verifySuperAdmin } from '../server/auth/superAdminGuard';
import { openQaSession, clearQaSession } from './helpers/qaSession';
import fs from 'fs';
import path from 'path';

test.describe('SUPER ADMIN — QA ACCESS & CONTROLLED INSPECTION SYSTEM', () => {

  // ----------------------------------------------------------------------------
  // 1. CONTROL DE ACCESO (RBAC) & SEGURIDAD SERVER-SIDE
  // ----------------------------------------------------------------------------
  test('1. RBAC: Rechaza creación de sesión QA anónima con 401 Unauthorized', async () => {
    const req = { headers: {} };
    const auth = await verifySuperAdmin(req);
    expect(auth.authorized).toBe(false);
    expect(auth.status).toBe(401);
  });

  test('2. RBAC: Rechaza creación de sesión QA por usuario regular con 403 Forbidden', async () => {
    const reqRegular = { headers: { authorization: 'Bearer regularuser-token' } };
    const authRegular = await verifySuperAdmin(reqRegular);
    expect(authRegular.authorized).toBe(false);
    expect(authRegular.status).toBe(403);
  });

  test('3. RBAC: Rechaza creación de sesión QA por admin de inquilino/estudio con 403 Forbidden', async () => {
    const reqTenantAdmin = { headers: { authorization: 'Bearer tenantadmin-token' } };
    const authTenantAdmin = await verifySuperAdmin(reqTenantAdmin);
    expect(authTenantAdmin.authorized).toBe(false);
    expect(authTenantAdmin.status).toBe(403);
  });

  test('4. RBAC: Super Admin puede generar sesión QA para Solicitante con tokens reales', async () => {
    const result = await QaSessionService.createSession({
      adminId: 'a1111111-1111-1111-1111-111111111111',
      role: 'borrower',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      durationHours: 8,
      source: 'playwright_test',
    });

    expect(result.qaSession).toBeDefined();
    expect(result.qaSession.status).toBe('active');
    expect(result.qaSession.role).toBe('borrower');
    expect(result.authSession.access_token).toBeDefined();
    expect(result.authSession.user.email).toContain('qa.applicant');
  });

  test('5. RBAC: Super Admin puede generar sesión QA para Operador / Backoffice', async () => {
    const result = await QaSessionService.createSession({
      adminId: 'a1111111-1111-1111-1111-111111111111',
      role: 'operator',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      durationHours: 4,
    });

    expect(result.qaSession.role).toBe('analyst');
    expect(result.authSession.user.app_metadata.is_qa_user).toBe(true);
  });

  test('6. RBAC: Super Admin puede generar sesión QA para Prestamista', async () => {
    const result = await QaSessionService.createSession({
      adminId: 'a1111111-1111-1111-1111-111111111111',
      role: 'lender',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      durationHours: 8,
    });

    expect(result.qaSession.role).toBe('lender');
    expect(result.authSession.user.email).toContain('qa.lender');
  });

  // ----------------------------------------------------------------------------
  // 2. EXPIRACIÓN Y REVOCACIÓN DE SESIONES
  // ----------------------------------------------------------------------------
  test('7. Revocación: Sesión revocada es invalidada inmediatamente', async () => {
    const created = await QaSessionService.createSession({
      adminId: 'a1111111-1111-1111-1111-111111111111',
      role: 'borrower',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      durationHours: 1,
    });

    const sessionId = created.qaSession.id;
    const initialValidation = await QaSessionService.validateSession(sessionId);
    expect(initialValidation.valid).toBe(true);

    // Revocar
    await QaSessionService.revokeSession(sessionId, 'a1111111-1111-1111-1111-111111111111');

    const afterRevokeValidation = await QaSessionService.validateSession(sessionId);
    expect(afterRevokeValidation.valid).toBe(false);
    expect(afterRevokeValidation.reason).toContain('revocada');
  });

  test('8. Expiración: Sesión con tiempo vencido es rechazada', async () => {
    const created = await QaSessionService.createSession({
      adminId: 'a1111111-1111-1111-1111-111111111111',
      role: 'borrower',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      durationHours: 1,
    });

    // Simular expiración en memoria modificando expires_at
    created.qaSession.expires_at = new Date(Date.now() - 60000).toISOString();

    const expiredValidation = await QaSessionService.validateSession(created.qaSession.id);
    expect(expiredValidation.valid).toBe(false);
    expect(expiredValidation.reason).toContain('expirado');
  });

  // ----------------------------------------------------------------------------
  // 3. ZERO SECRET LEAKAGE (CERO FILTRACIÓN DE SECRETOS)
  // ----------------------------------------------------------------------------
  test('9. Cero Filtración: No se exponen service_role ni passwords en los tokens QA', async () => {
    const qaUser = await QaUserService.getOrCreateQaUser('borrower', 'a0000000-0000-0000-0000-000000000001');
    const tokenData = await QaUserService.generateAuthSessionToken(qaUser, 8);

    expect((tokenData as any).service_role).toBeUndefined();
    expect((tokenData as any).password).toBeUndefined();
    expect((tokenData as any).serviceRoleKey).toBeUndefined();
    expect(tokenData.access_token).toBeDefined();
  });

  // ----------------------------------------------------------------------------
  // 4. AISLAMIENTO DE ROLES Y UI PLAYWRIGHT E2E
  // ----------------------------------------------------------------------------
  test('10. UI: Usuario QA Solicitante puede entrar a /mi-cuenta con banner visible', async ({ page }) => {
    await openQaSession(page, { role: 'applicant', tenantName: 'HIPOTECALY Central' });
    await page.goto('/mi-cuenta');

    // Verificar que el banner QA está presente
    const banner = page.locator('[data-testid="qa-session-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('SESIÓN QA');
    await expect(banner).toContainText('Solicitante');
  });

  test('11. UI: Usuario QA Operador puede entrar a /app con banner visible', async ({ page }) => {
    await openQaSession(page, { role: 'operator', tenantName: 'HIPOTECALY Central' });
    await page.goto('/app');

    const banner = page.locator('[data-testid="qa-session-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('SESIÓN QA');
  });

  test('12. UI: Usuario QA Prestamista puede entrar a /lender con banner visible', async ({ page }) => {
    await openQaSession(page, { role: 'lender', tenantName: 'HIPOTECALY Central' });
    await page.goto('/lender');

    const banner = page.locator('[data-testid="qa-session-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('SESIÓN QA');
  });

  test('13. Seguridad: Usuario QA Solicitante no puede acceder al portal de Prestamistas (/lender)', async ({ page }) => {
    await openQaSession(page, { role: 'applicant', tenantName: 'HIPOTECALY Central' });
    await page.goto('/lender');

    // Debe mostrar denegación con advertencia de sesión QA
    const heading = page.locator('h1');
    await expect(heading).toContainText('Sección de Otro Rol');
  });

  test('14. Seguridad: Usuario QA Prestamista no puede acceder al Backoffice operativo (/app)', async ({ page }) => {
    await openQaSession(page, { role: 'lender', tenantName: 'HIPOTECALY Central' });
    await page.goto('/app');

    const heading = page.locator('h1');
    await expect(heading).toContainText('Sección de Otro Rol');
  });

  test('15. Seguridad: Usuario QA Operador no puede acceder a /platform-admin', async ({ page }) => {
    await openQaSession(page, { role: 'operator', tenantName: 'HIPOTECALY Central' });
    await page.goto('/platform-admin');

    const heading = page.locator('h1');
    await expect(heading).toContainText('Sección de Otro Rol');
  });

  test('16. Super Admin UI: Panel /platform-admin contiene card de Acceso QA', async ({ page }) => {
    await openQaSession(page, { role: 'super_admin' });
    await page.goto('/platform-admin');

    const qaCard = page.locator('[data-testid="qa-tools-card"]');
    await expect(qaCard).toBeVisible();
    await expect(qaCard).toContainText('Acceso QA / Inspección Directa');
    await expect(qaCard).toContainText('Entrar como');
    await expect(qaCard).toContainText('Accesos Rápidos Directos');
  });

});
