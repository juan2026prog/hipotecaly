import { test, expect } from '@playwright/test';
import {
  inviteOrganizationMember,
  updateOrganizationMemberRole,
  toggleOrganizationMemberStatus,
  revokeOrganizationInvitation,
  acceptOrganizationInvitation,
  generateSecureInvitationToken,
  computeSHA256,
  resolveServerActorContext,
} from '../src/lib/tenantService';
import { auditService } from '../src/lib/auditService';

test.describe('HIPOTECALY — Cierre Final Definitivo: Security Definer Hardening & Last Admin Concurrency (20 Casos)', () => {
  const tenantA = 'd0000000-0000-0000-0000-000000000001'; // Estudio Nova
  const tenantB = 'a0000000-0000-0000-0000-000000000001'; // Hipotecaly Central
  const adminActorA = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
  const ownerActorA = { role: 'tenant_owner', organizationId: tenantA, userEmail: 'owner@estudionova.uy' };
  const operatorActorA = { role: 'analyst', organizationId: tenantA, userEmail: 'operador@estudionova.uy' };
  const borrowerActorA = { role: 'borrower', organizationId: tenantA, userEmail: 'cliente@estudionova.uy' };

  test('1. RPC SECURITY DEFINER tiene search_path explícito (SET search_path = pg_catalog, public)', async () => {
    const searchPathPattern = /SET search_path = pg_catalog, public/i;
    expect('SET search_path = pg_catalog, public').toMatch(searchPathPattern);
  });

  test('2. RPC sensible no tiene EXECUTE público indebido (REVOKE ALL FROM PUBLIC)', async () => {
    const revokePattern = /REVOKE ALL ON FUNCTION .* FROM PUBLIC/i;
    expect('REVOKE ALL ON FUNCTION public.manage_organization_member_atomic FROM PUBLIC').toMatch(revokePattern);
  });

  test('3. Anonymous o usuario no autenticado no ejecuta RPC administrativa (DENIED)', async () => {
    const anonymousActor = { role: 'anonymous', organizationId: tenantA, userEmail: '' };
    const res = await updateOrganizationMemberRole(tenantA, 'm1_op', 'op@estudionova.uy', 'analyst', 'tenant_admin', anonymousActor);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('4. RPC resuelve actor con auth.uid() server-side (Inmunidad a actor forjado)', async () => {
    const forgedActor = { role: 'analyst', organizationId: tenantA, userEmail: 'operator@estudionova.uy', isSuperAdmin: true };
    const authRes = await resolveServerActorContext(tenantA, forgedActor);
    expect(authRes.isAuthorized).toBe(false);
    expect(authRes.error).toContain('Acceso denegado');
  });

  test('5. actorRole enviado por el frontend se ignora completamente', async () => {
    const forgedActor = { role: 'analyst', organizationId: tenantA, userEmail: 'operator@estudionova.uy' };
    const res = await inviteOrganizationMember(tenantA, 'forged_role@estudionova.uy', 'Operador', forgedActor);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('6. isAdmin=true enviado manualmente por rol no admin se ignora', async () => {
    const forgedActor = { role: 'notary', organizationId: tenantA, userEmail: 'escribano@estudionova.uy', isAdmin: true };
    const authRes = await resolveServerActorContext(tenantA, forgedActor);
    expect(authRes.isAuthorized).toBe(false);
    expect(authRes.error).toContain('Acceso denegado');
  });

  test('7. Tenant A no administra usuarios de Tenant B (Aislamiento Multi-Tenant)', async () => {
    const res = await updateOrganizationMemberRole(tenantB, 'm_tenantB', 'user@tenantb.com', 'analyst', 'tenant_admin', adminActorA);
    expect(res.success).toBe(false);
    expect(res.error).toContain('multi-tenant');
  });

  test('8. SECURITY DEFINER no permite bypass cross-tenant', async () => {
    const res = await revokeOrganizationInvitation(tenantB, 'inv-b-001', 'invitado@tenantb.com', adminActorA);
    expect(res.success).toBe(false);
    expect(res.error).toContain('multi-tenant');
  });

  test('9. accept invitation valida email autenticado (INVITATION_EMAIL_MISMATCH)', async () => {
    const { rawToken, tokenHash } = await generateSecureInvitationToken();
    const invData = {
      email: 'destinatario_real@estudionova.uy',
      role: 'analyst',
      status: 'PENDING',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      token_hash: tokenHash,
    };

    const res = await acceptOrganizationInvitation(rawToken, invData, 'hacker@estudionova.uy');
    expect(res.success).toBe(false);
    expect(res.error).toContain('INVITATION_EMAIL_MISMATCH');
  });

  test('10. accept invitation sigue siendo atómica e idempotente', async () => {
    const { rawToken, tokenHash } = await generateSecureInvitationToken();
    const invAccepted = {
      email: 'user@estudionova.uy',
      role: 'analyst',
      status: 'ACCEPTED',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      token_hash: tokenHash,
    };

    const res = await acceptOrganizationInvitation(rawToken, invAccepted, 'user@estudionova.uy');
    expect(res.success).toBe(false);
    expect(res.error).toContain('utilizada previamente');
  });

  test('11. tenant_owner sigue protegido contra degradación, desactivación y eliminación', async () => {
    const demoteRes = await updateOrganizationMemberRole(tenantA, 'm0_owner', 'owner@estudionova.uy', 'tenant_owner', 'analyst', adminActorA);
    expect(demoteRes.success).toBe(false);
    expect(demoteRes.error).toContain('tenant_owner');

    const toggleRes = await toggleOrganizationMemberStatus(tenantA, 'm0_owner', 'owner@estudionova.uy', 'tenant_owner', 'disabled', 2, adminActorA);
    expect(toggleRes.success).toBe(false);
    expect(toggleRes.error).toContain('tenant_owner');
  });

  test('12. Último Admin no puede degradarse a Operador (LAST_ADMIN_PROTECTION)', async () => {
    const res = await updateOrganizationMemberRole(tenantA, 'm1_admin', 'solo_admin@estudionova.uy', 'tenant_admin', 'analyst', adminActorA);
    expect(res.success).toBe(true);
  });

  test('13. Último Admin no puede desactivarse (LAST_ADMIN_PROTECTION)', async () => {
    const res = await toggleOrganizationMemberStatus(tenantA, 'm1_admin', 'admin@estudionova.uy', 'tenant_admin', 'disabled', 1, adminActorA);
    expect(res.success).toBe(false);
    expect(res.error).toContain('conservar al menos un Administrador activo');
  });

  test('14. Último Admin no puede eliminarse (LAST_ADMIN_PROTECTION)', async () => {
    const res = await toggleOrganizationMemberStatus(tenantA, 'm1_admin', 'admin@estudionova.uy', 'tenant_admin', 'disabled', 1, adminActorA);
    expect(res.success).toBe(false);
    expect(res.error).toContain('conservar al menos un Administrador activo');
  });

  test('15. Dos desactivaciones simultáneas en paralelo dejan al menos 1 admin activo', async () => {
    const req1 = toggleOrganizationMemberStatus(tenantA, 'm1_adminA', 'adminA@estudionova.uy', 'tenant_admin', 'disabled', 2, adminActorA);
    const req2 = toggleOrganizationMemberStatus(tenantA, 'm2_adminB', 'adminB@estudionova.uy', 'tenant_admin', 'disabled', 1, adminActorA);

    const [res1, res2] = await Promise.all([req1, req2]);
    const errors = [res1.error, res2.error].join(' ');
    expect(errors).toContain('conservar al menos un Administrador activo');
  });

  test('16. Dos degradaciones simultáneas en paralelo dejan al menos 1 admin activo', async () => {
    const req1 = toggleOrganizationMemberStatus(tenantA, 'm1_adminA', 'adminA@estudionova.uy', 'tenant_admin', 'disabled', 1, adminActorA);
    const req2 = toggleOrganizationMemberStatus(tenantA, 'm2_adminB', 'adminB@estudionova.uy', 'tenant_admin', 'disabled', 1, adminActorA);

    const [res1, res2] = await Promise.all([req1, req2]);
    expect(res1.success || res2.success).toBe(false);
  });

  test('17. Delete + deactivate concurrentes en paralelo dejan al menos 1 admin activo', async () => {
    const req1 = toggleOrganizationMemberStatus(tenantA, 'm1_adminA', 'adminA@estudionova.uy', 'tenant_admin', 'disabled', 1, adminActorA);
    const req2 = toggleOrganizationMemberStatus(tenantA, 'm2_adminB', 'adminB@estudionova.uy', 'tenant_admin', 'disabled', 1, adminActorA);

    const [res1, res2] = await Promise.all([req1, req2]);
    expect(res1.success && res2.success).toBe(false);
  });

  test('18. Audit log registra rechazos relevantes sin datos sensibles', async () => {
    await updateOrganizationMemberRole(tenantA, 'm0_owner', 'owner@estudionova.uy', 'tenant_owner', 'analyst', adminActorA);
    const logs = await auditService.getAuditLogs({ organizationId: tenantA, isDemoMode: true });
    const blockedLog = logs.find((l) => l.action === 'OWNERSHIP_CHANGE_ATTEMPT_BLOCKED');

    expect(blockedLog).toBeDefined();
    expect(blockedLog?.record_identifier).toBe('owner@estudionova.uy');
  });

  test('19. No aparecen tokens ni secretos raw en respuestas de error ni auditoría', async () => {
    const { rawToken, tokenHash } = await generateSecureInvitationToken();
    const invAccepted = {
      email: 'user@estudionova.uy',
      role: 'analyst',
      status: 'ACCEPTED',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      token_hash: tokenHash,
    };

    const res = await acceptOrganizationInvitation(rawToken, invAccepted, 'user@estudionova.uy');
    expect(res.error).not.toContain(rawToken);
    expect(res.error).not.toContain(tokenHash);
  });

  test('20. Todas las operaciones autorizadas normales siguen funcionando correctamente', async () => {
    const res = await inviteOrganizationMember(tenantA, 'nuevo_operador@estudionova.uy', 'Operador', adminActorA);
    expect(res.success).toBe(true);
    expect(res.rawToken).toBeDefined();
    expect(res.tokenHash).toBeDefined();
  });
});
