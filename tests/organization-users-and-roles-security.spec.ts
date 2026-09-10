import { test, expect } from '@playwright/test';
import {
  inviteOrganizationMember,
  updateOrganizationMemberRole,
  toggleOrganizationMemberStatus,
  revokeOrganizationInvitation,
  acceptOrganizationInvitation,
} from '../src/lib/tenantService';
import { auditService } from '../src/lib/auditService';

test.describe('HIPOTECALY — Cierre Final de Seguridad: Ownership, Invitaciones Seguras y RBAC Server-Side', () => {

  const tenantA = 'd0000000-0000-0000-0000-000000000001'; // Estudio Nova
  const tenantB = 'a0000000-0000-0000-0000-000000000002'; // Estudio Notarial del Este

  // --------------------------------------------------------------------------
  // 1. REGLAS DE OWNERSHIP E INVITACIONES DE ADMINISTRADORES
  // --------------------------------------------------------------------------
  test('1. Invitar "Administrador" crea siempre tenant_admin', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await inviteOrganizationMember(tenantA, 'nuevo_socio@estudionova.uy', 'Administrador', actor);

    expect(res.success).toBe(true);
    // Verificar en auditoría que el rol asignado sea tenant_admin y no tenant_owner
    const logs = await auditService.getAuditLogs({ organizationId: tenantA, isDemoMode: true });
    const lastInvite = logs.find((l) => l.action === 'USER_INVITED' && l.record_identifier === 'nuevo_socio@estudionova.uy');

    expect(lastInvite).toBeDefined();
    expect(lastInvite?.new_value).toBe('tenant_admin');
  });

  test('2. Invitar "Administrador" NUNCA crea tenant_owner (Blindaje de ownership)', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };

    // Intentar pasar tenant_owner directamente al servicio de invitación
    const res = await inviteOrganizationMember(tenantA, 'hacker@estudionova.uy', 'tenant_owner', actor);
    expect(res.success).toBe(true);

    const logs = await auditService.getAuditLogs({ organizationId: tenantA, isDemoMode: true });
    const lastInvite = logs.find((l) => l.record_identifier === 'hacker@estudionova.uy');

    expect(lastInvite?.new_value).not.toBe('tenant_owner');
    expect(lastInvite?.new_value).toBe('tenant_admin');
  });

  test('3. tenant_admin no puede degradar a tenant_owner (DENIED / OWNERSHIP_CHANGE_ATTEMPT_BLOCKED)', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };

    const res = await updateOrganizationMemberRole(
      tenantA,
      'm-owner-1',
      'owner@estudionova.uy',
      'tenant_owner',
      'analyst',
      actor
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('tenant_owner');

    const logs = await auditService.getAuditLogs({ organizationId: tenantA, isDemoMode: true });
    const blockedLog = logs.find((l) => l.action === 'OWNERSHIP_CHANGE_ATTEMPT_BLOCKED');
    expect(blockedLog).toBeDefined();
  });

  test('4. tenant_admin no puede desactivar a tenant_owner (DENIED)', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };

    const res = await toggleOrganizationMemberStatus(
      tenantA,
      'm-owner-1',
      'owner@estudionova.uy',
      'tenant_owner',
      'disabled',
      2,
      actor
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('tenant_owner');
  });

  test('5. tenant_admin no puede eliminar ni desvincular a tenant_owner', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };

    const res = await updateOrganizationMemberRole(
      tenantA,
      'm-owner-1',
      'owner@estudionova.uy',
      'tenant_owner',
      'disabled',
      actor
    );

    expect(res.success).toBe(false);
  });

  test('6. tenant_admin no puede auto-escalarse a tenant_owner (Privilege Escalation DENIED)', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };

    const res = await updateOrganizationMemberRole(
      tenantA,
      'm-admin-self',
      'admin@estudionova.uy',
      'tenant_admin',
      'tenant_owner',
      actor
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('tenant_owner');
  });

  // --------------------------------------------------------------------------
  // 2. RESTRICCIONES DE ACCESO POR ROL A NIVEL DE SERVICIO / API DIRECTO
  // --------------------------------------------------------------------------
  test('7. Operador (analyst/operator) no puede invitar usuarios vía API directa (DENIED)', async () => {
    const actorOp = { role: 'analyst', organizationId: tenantA, userEmail: 'valeria@estudionova.uy' };

    const res = await inviteOrganizationMember(tenantA, 'invitadopor_op@estudionova.uy', 'Operador', actorOp);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('8. Operador no puede cambiar roles vía request manual (DENIED)', async () => {
    const actorOp = { role: 'analyst', organizationId: tenantA, userEmail: 'valeria@estudionova.uy' };

    const res = await updateOrganizationMemberRole(
      tenantA,
      'm2',
      'valeria@estudionova.uy',
      'analyst',
      'tenant_admin',
      actorOp
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('9. Escribano (notary) no puede administrar usuarios vía API directa (DENIED)', async () => {
    const actorNotary = { role: 'notary', organizationId: tenantA, userEmail: 'maria@escribania.com' };

    const res = await inviteOrganizationMember(tenantA, 'test@escribania.com', 'Escribano', actorNotary);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('10. Cliente (borrower) no puede administrar usuarios vía API directa (DENIED)', async () => {
    const actorBorrower = { role: 'borrower', organizationId: tenantA, userEmail: 'cliente@gmail.com' };

    const res = await inviteOrganizationMember(tenantA, 'colab@gmail.com', 'Operador', actorBorrower);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('11. Inversor (lender) no puede administrar usuarios vía API directa (DENIED)', async () => {
    const actorLender = { role: 'lender', organizationId: tenantA, userEmail: 'inversor@capital.uy' };

    const res = await inviteOrganizationMember(tenantA, 'colab@capital.uy', 'Operador', actorLender);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  // --------------------------------------------------------------------------
  // 3. AISLAMIENTO MULTI-TENANT Y PROTECCIÓN DEL ÚLTIMO ADMIN
  // --------------------------------------------------------------------------
  test('12. Tenant A no puede cambiar roles de usuarios de Tenant B (Cross-tenant DENIED)', async () => {
    const actorTenantA = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };

    const res = await updateOrganizationMemberRole(
      tenantB,
      'm-tenantB-user',
      'user@estudiodeleste.uy',
      'analyst',
      'tenant_admin',
      actorTenantA
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('multi-tenant');
  });

  test('13. Tenant A no puede revocar invitaciones de Tenant B (Cross-tenant DENIED)', async () => {
    const actorTenantA = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };

    const res = await revokeOrganizationInvitation(tenantB, 'inv-b-999', 'userB@estudiodeleste.uy', actorTenantA);
    expect(res.success).toBe(false);
    expect(res.error).toContain('multi-tenant');
  });

  test('14. Último Administrador activo no puede ser desactivado', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };

    const res = await toggleOrganizationMemberStatus(
      tenantA,
      'm1',
      'admin@estudionova.uy',
      'tenant_admin',
      'disabled',
      1, // activeAdminsCount = 1
      actor
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('conservar al menos un Administrador activo');
  });

  // --------------------------------------------------------------------------
  // 4. INVITACIONES SEGURAS, SECTOR DE TOKENS Y CICLO DE VIDA
  // --------------------------------------------------------------------------
  test('15. Token secreto real NO aparece en la interfaz gráfica', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await page.click('button:has-text("Invitaciones")');

    const tableContent = await page.locator('table').innerText();
    expect(tableContent).not.toContain('inv_tok_');
    expect(tableContent).not.toContain('raw_token');
    expect(tableContent).not.toContain('secret');
  });

  test('16. Token secreto real NO aparece en metadatos de auditoría', async () => {
    await auditService.logAction({
      organizationId: tenantA,
      userId: 'u1',
      userName: 'Admin',
      userRole: 'tenant_admin',
      action: 'USER_INVITED',
      module: 'Usuarios',
      recordIdentifier: 'prueba_audit@estudionova.uy',
      metadata: {
        token: 'secret_token_12345',
        raw_token: 'secret_raw_67890',
        email: 'prueba_audit@estudionova.uy',
      },
    });

    const logs = await auditService.getAuditLogs({ organizationId: tenantA, isDemoMode: true });
    const log = logs.find((l) => l.record_identifier === 'prueba_audit@estudionova.uy');

    expect(log).toBeDefined();
    expect(log?.metadata?.token).toBeUndefined();
    expect(log?.metadata?.raw_token).toBeUndefined();
  });

  test('17. Invitación expirada NO puede ser aceptada (EXPIRED DENIED)', async () => {
    const expiredData = {
      expires_at: new Date(Date.now() - 3600000 * 24).toISOString(), // Venció ayer
      status: 'PENDING',
      role: 'analyst',
      email: 'expirado@estudionova.uy',
    };

    const res = await acceptOrganizationInvitation('expired_token_123', expiredData);
    expect(res.success).toBe(false);
    expect(res.error).toContain('expirado');
  });

  test('18. Invitación revocada NO puede ser aceptada (REVOKED DENIED)', async () => {
    const revokedData = {
      expires_at: new Date(Date.now() + 3600000 * 24).toISOString(),
      status: 'REVOKED',
      role: 'analyst',
      email: 'revocado@estudionova.uy',
    };

    const res = await acceptOrganizationInvitation('revoked_token_123', revokedData);
    expect(res.success).toBe(false);
    expect(res.error).toContain('revocada');
  });

  test('19. Invitación aceptada NO puede reutilizarse (Idempotencia / ACCEPTED DENIED)', async () => {
    const acceptedData = {
      expires_at: new Date(Date.now() + 3600000 * 24).toISOString(),
      status: 'ACCEPTED',
      role: 'analyst',
      email: 'usado@estudionova.uy',
    };

    const res = await acceptOrganizationInvitation('used_token_123', acceptedData);
    expect(res.success).toBe(false);
    expect(res.error).toContain('utilizada previamente');
  });

  test('20. Cambio Operador -> Administrador crea tenant_admin (nunca tenant_owner) y genera log ADMIN_GRANTED', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };

    const res = await updateOrganizationMemberRole(
      tenantA,
      'm2',
      'valeria@estudionova.uy',
      'analyst',
      'Administrador',
      actor
    );

    expect(res.success).toBe(true);

    const logs = await auditService.getAuditLogs({ organizationId: tenantA, isDemoMode: true });
    const changeLog = logs.find(
      (l) => l.action === 'ADMIN_GRANTED' || (l.action === 'USER_ROLE_CHANGED' && l.record_identifier === 'valeria@estudionova.uy')
    );

    expect(changeLog).toBeDefined();
    expect(changeLog?.new_value).not.toBe('tenant_owner');
  });

});
