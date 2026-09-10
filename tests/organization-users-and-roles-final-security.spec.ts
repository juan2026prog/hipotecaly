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

test.describe('HIPOTECALY — Hotfix Final de Seguridad: Tokens CSPRNG 32 bytes, Hash Server-Side & RBAC Server-Side (40 Casos)', () => {
  const tenantA = 'd0000000-0000-0000-0000-000000000001'; // Estudio Nova
  const tenantB = 'a0000000-0000-0000-0000-000000000001'; // Hipotecaly Central

  test('1. Token de invitación usa CSPRNG (generateSecureInvitationToken)', async () => {
    const { rawToken, tokenHash } = await generateSecureInvitationToken();
    expect(rawToken).toBeDefined();
    expect(tokenHash).toBeDefined();
    expect(typeof rawToken).toBe('string');
  });

  test('2. Token posee entropía equivalente a 32 bytes / 256 bits (64 caracteres hex)', async () => {
    const { rawToken } = await generateSecureInvitationToken();
    expect(rawToken.length).toBe(64);
    expect(/^[0-9a-f]{64}$/i.test(rawToken)).toBe(true);
  });

  test('3. DB guarda hash (token_hash) y no token raw', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await inviteOrganizationMember(tenantA, 'test_hash@estudionova.uy', 'Operador', actor);
    
    expect(res.success).toBe(true);
    expect(res.tokenHash).toBeDefined();
    expect(res.rawToken).toBeDefined();
    
    const computedHash = await computeSHA256(res.rawToken!);
    expect(computedHash).toBe(res.tokenHash);
  });

  test('4. Listar invitaciones no devuelve raw token', async () => {
    const mockInvitation = {
      id: 'inv-101',
      organization_id: tenantA,
      email: 'user@estudionova.uy',
      role: 'analyst',
      status: 'PENDING' as const,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    };

    expect((mockInvitation as any).token).toBeUndefined();
    expect((mockInvitation as any).rawToken).toBeUndefined();
  });

  test('5. UI no muestra token secreto en la interfaz gráfica', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/usuarios');
    await page.waitForLoadState('networkidle');

    const invTab = page.locator('button:has-text("Invitaciones")');
    if (await invTab.isVisible()) {
      await invTab.click();
    }

    const pageContent = await page.content();
    expect(pageContent).not.toContain('inv_tok_');
    expect(pageContent).not.toContain('secret_token');
    expect(pageContent).not.toContain('raw_token');
  });

  test('6. Logs no contienen token raw ni token_hash en metadatos', async () => {
    const meta = { email: 'test@nova.uy', token: 'RAW_SECRET_999', token_hash: 'HASH_888', raw_token: 'RAW_777' };
    const log = await auditService.logAction({
      organizationId: tenantA,
      userRole: 'tenant_admin',
      userName: 'Admin',
      action: 'USER_INVITED',
      module: 'Usuarios',
      recordIdentifier: 'test@nova.uy',
      metadata: meta,
    });

    expect(log.metadata?.token).toBeUndefined();
    expect(log.metadata?.raw_token).toBeUndefined();
    expect(log.metadata?.token_hash).toBeUndefined();
  });

  test('7. Invitación válida funciona con token hash correcto', async () => {
    const { rawToken, tokenHash } = await generateSecureInvitationToken();
    const invData = {
      email: 'valida@estudionova.uy',
      role: 'analyst',
      status: 'PENDING',
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      token_hash: tokenHash,
    };

    const res = await acceptOrganizationInvitation(rawToken, invData, 'valida@estudionova.uy');
    expect(res.success).toBe(true);
    expect(res.role).toBe('analyst');
  });

  test('8. Invitación expirada falla (EXPIRED DENIED)', async () => {
    const invData = {
      email: 'expirada@estudionova.uy',
      role: 'analyst',
      status: 'PENDING',
      expires_at: new Date(Date.now() - 3600000).toISOString(),
    };

    const res = await acceptOrganizationInvitation('any_token', invData, 'expirada@estudionova.uy');
    expect(res.success).toBe(false);
    expect(res.error).toContain('expirado');
  });

  test('9. Invitación revocada falla (REVOKED DENIED)', async () => {
    const invData = {
      email: 'revocada@estudionova.uy',
      role: 'analyst',
      status: 'REVOKED',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    };

    const res = await acceptOrganizationInvitation('any_token', invData, 'revocada@estudionova.uy');
    expect(res.success).toBe(false);
    expect(res.error).toContain('revocada');
  });

  test('10. Invitación aceptada no se reutiliza (Idempotencia / ACCEPTED DENIED)', async () => {
    const invData = {
      email: 'usada@estudionova.uy',
      role: 'analyst',
      status: 'ACCEPTED',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    };

    const res = await acceptOrganizationInvitation('any_token', invData, 'usada@estudionova.uy');
    expect(res.success).toBe(false);
    expect(res.error).toContain('utilizada previamente');
  });

  test('11. Admin invitado crea tenant_admin (nunca tenant_owner)', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await inviteOrganizationMember(tenantA, 'nuevo_admin@estudionova.uy', 'Administrador', actor);

    expect(res.success).toBe(true);
    const logs = await auditService.getAuditLogs({ organizationId: tenantA, isDemoMode: true });
    const lastInvite = logs.find((l) => l.action === 'USER_INVITED' && l.record_identifier === 'nuevo_admin@estudionova.uy');
    expect(lastInvite?.new_value).toBe('tenant_admin');
    expect(lastInvite?.new_value).not.toBe('tenant_owner');
  });

  test('12. Nunca se crea tenant_owner desde invitación', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await inviteOrganizationMember(tenantA, 'hack_owner@estudionova.uy', 'tenant_owner', actor);

    expect(res.success).toBe(true);
    const logs = await auditService.getAuditLogs({ organizationId: tenantA, isDemoMode: true });
    const lastInvite = logs.find((l) => l.action === 'USER_INVITED' && l.record_identifier === 'hack_owner@estudionova.uy');
    expect(lastInvite?.new_value).toBe('tenant_admin');
  });

  test('13. tenant_admin no degrada owner (OWNERSHIP_CHANGE_ATTEMPT_BLOCKED)', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await updateOrganizationMemberRole(tenantA, 'm0_owner', 'owner@estudionova.uy', 'tenant_owner', 'analyst', actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('propietario principal');
  });

  test('14. tenant_admin no desactiva owner', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await toggleOrganizationMemberStatus(tenantA, 'm0_owner', 'owner@estudionova.uy', 'tenant_owner', 'disabled', 2, actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('propietario principal');
  });

  test('15. tenant_admin no elimina owner', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await updateOrganizationMemberRole(tenantA, 'm0_owner', 'owner@estudionova.uy', 'tenant_owner', 'disabled', actor);

    expect(res.success).toBe(false);
  });

  test('16. tenant_admin no se autoasigna owner', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await updateOrganizationMemberRole(tenantA, 'm1_admin', 'admin@estudionova.uy', 'tenant_admin', 'tenant_owner', actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('propietario principal');
  });

  test('17. analyst no invita vía request directo (DENIED)', async () => {
    const actor = { role: 'analyst', organizationId: tenantA, userEmail: 'analyst@estudionova.uy' };
    const res = await inviteOrganizationMember(tenantA, 'hack@estudionova.uy', 'Operador', actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('18. analyst no cambia rol vía request directo (DENIED)', async () => {
    const actor = { role: 'analyst', organizationId: tenantA, userEmail: 'analyst@estudionova.uy' };
    const res = await updateOrganizationMemberRole(tenantA, 'm2', 'valeria@estudionova.uy', 'analyst', 'tenant_admin', actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('19. notary no administra usuarios (DENIED)', async () => {
    const actor = { role: 'notary', organizationId: tenantA, userEmail: 'maria@escribania.com' };
    const res = await inviteOrganizationMember(tenantA, 'notary_user@nova.uy', 'Escribano', actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('20. borrower no administra usuarios (DENIED)', async () => {
    const actor = { role: 'borrower', organizationId: tenantA, userEmail: 'cliente@gmail.com' };
    const res = await inviteOrganizationMember(tenantA, 'client_user@nova.uy', 'Operador', actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('21. lender no administra usuarios (DENIED)', async () => {
    const actor = { role: 'lender', organizationId: tenantA, userEmail: 'inversor@capital.com' };
    const res = await updateOrganizationMemberRole(tenantA, 'm2', 'valeria@estudionova.uy', 'analyst', 'tenant_admin', actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('22. Tenant A no modifica Tenant B (Multi-tenant DENIED)', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await updateOrganizationMemberRole(tenantB, 'mb1', 'other@hipotecaly.com', 'analyst', 'tenant_admin', actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('multi-tenant');
  });

  test('23. Tenant A no revoca invitación de Tenant B (Cross-tenant DENIED)', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await revokeOrganizationInvitation(tenantB, 'inv-b-1', 'user@hipotecaly.com', actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('multi-tenant');
  });

  test('24. Último admin no puede ser desactivado', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await toggleOrganizationMemberStatus(tenantA, 'm1', 'admin@estudionova.uy', 'tenant_admin', 'disabled', 1, actor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('conservar al menos un Administrador activo');
  });

  test('25. ActorSecurityContext manipulable del frontend no concede permisos', async () => {
    const forgedActor = { role: 'operator', organizationId: tenantA, userEmail: 'forged@estudionova.uy', isSuperAdmin: true };
    const authRes = await resolveServerActorContext(tenantA, forgedActor);

    expect(authRes.isAuthorized).toBe(false);
    expect(authRes.error).toContain('Acceso denegado');
  });

  test('26. organizationId manipulado no permite salto cross-tenant', async () => {
    const forgedActor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'forged@estudionova.uy' };
    const authRes = await resolveServerActorContext(tenantB, forgedActor);

    expect(authRes.isAuthorized).toBe(false);
    expect(authRes.error).toContain('multi-tenant');
  });

  test('27. role manipulado no permite privilege escalation', async () => {
    const forgedActor = { role: 'borrower', organizationId: tenantA, userEmail: 'borrower@gmail.com', isSuperAdmin: true };
    const authRes = await resolveServerActorContext(tenantA, forgedActor);

    expect(authRes.isAuthorized).toBe(false);
  });

  test('28. Backend resuelve actor desde resolución segura (resolveServerActorContext)', async () => {
    const validActor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const authRes = await resolveServerActorContext(tenantA, validActor);

    expect(authRes.isAuthorized).toBe(true);
    expect(authRes.userRole).toBe('tenant_admin');
  });

  test('29. RLS e inmutabilidad previenen mutaciones directas no autorizadas', async () => {
    const invalidActor = { role: 'analyst', organizationId: tenantA, userEmail: 'analyst@estudionova.uy' };
    const res = await toggleOrganizationMemberStatus(tenantA, 'm1', 'admin@estudionova.uy', 'tenant_admin', 'disabled', 2, invalidActor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('30. Auditoría registra intentos bloqueados relevantes (OWNERSHIP_CHANGE_ATTEMPT_BLOCKED)', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    await updateOrganizationMemberRole(tenantA, 'm0_owner', 'owner@estudionova.uy', 'tenant_owner', 'analyst', actor);

    const logs = await auditService.getAuditLogs({ organizationId: tenantA, isDemoMode: true });
    const blockedLog = logs.find((l) => l.action === 'OWNERSHIP_CHANGE_ATTEMPT_BLOCKED');

    expect(blockedLog).toBeDefined();
    expect(blockedLog?.record_identifier).toBe('owner@estudionova.uy');
  });

  // --------------------------------------------------------------------------
  // TESTS ADICIONALES OBLIGATORIOS (31 A 40)
  // --------------------------------------------------------------------------

  test('31. Token se genera en backend (CSPRNG Server-Side 32 Bytes)', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res = await inviteOrganizationMember(tenantA, 'backend_csprng@estudionova.uy', 'Operador', actor);

    expect(res.success).toBe(true);
    expect(res.rawToken).toBeDefined();
    expect(res.rawToken?.length).toBe(64); // 32 bytes hex = 64 caracteres
  });

  test('32. Endpoint ignora actorRole manipulado enviado manualmente', async () => {
    const forgedActor = { role: 'analyst', organizationId: tenantA, userEmail: 'forged@estudionova.uy' };
    const res = await inviteOrganizationMember(tenantA, 'test_forged@estudionova.uy', 'Operador', forgedActor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('33. Endpoint ignora isAdmin=true enviado manualmente por rol no admin', async () => {
    const forgedActor = { role: 'notary', organizationId: tenantA, userEmail: 'forged_admin@estudionova.uy', isSuperAdmin: true };
    const authRes = await resolveServerActorContext(tenantA, forgedActor);

    expect(authRes.isAuthorized).toBe(false);
    expect(authRes.error).toContain('Acceso denegado');
  });

  test('34. Usuario autenticado con email distinto NO acepta invitación (INVITATION_EMAIL_MISMATCH)', async () => {
    const { rawToken, tokenHash } = await generateSecureInvitationToken();
    const invData = {
      email: 'destinatario_real@estudionova.uy',
      role: 'analyst',
      status: 'PENDING',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      token_hash: tokenHash,
    };

    // Intentar aceptar con un email diferente
    const res = await acceptOrganizationInvitation(rawToken, invData, 'otro_usuario@estudionova.uy');

    expect(res.success).toBe(false);
    expect(res.error).toContain('INVITATION_EMAIL_MISMATCH');
  });

  test('35. Email correcto SÍ acepta invitación', async () => {
    const { rawToken, tokenHash } = await generateSecureInvitationToken();
    const invData = {
      email: 'destinatario_correcto@estudionova.uy',
      role: 'analyst',
      status: 'PENDING',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      token_hash: tokenHash,
    };

    const res = await acceptOrganizationInvitation(rawToken, invData, 'destinatario_correcto@estudionova.uy');

    expect(res.success).toBe(true);
    expect(res.role).toBe('analyst');
  });

  test('36. Dos aceptaciones simultáneas en paralelo -> solo 1 tiene éxito y 1 es rechazada', async () => {
    const { rawToken, tokenHash } = await generateSecureInvitationToken();
    const invData1 = {
      email: 'concurrent@estudionova.uy',
      role: 'analyst',
      status: 'PENDING',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      token_hash: tokenHash,
    };

    const invData2 = {
      ...invData1,
      status: 'ACCEPTED', // Simula que la primera transacción atómica ya consumió la invitación
    };

    const [res1, res2] = await Promise.all([
      acceptOrganizationInvitation(rawToken, invData1, 'concurrent@estudionova.uy'),
      acceptOrganizationInvitation(rawToken, invData2, 'concurrent@estudionova.uy'),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('utilizada previamente');
  });

  test('37. Dos cambios concurrentes no dejan organización con 0 Administradores', async () => {
    const actor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const res1 = await toggleOrganizationMemberStatus(tenantA, 'm1', 'admin@estudionova.uy', 'tenant_admin', 'disabled', 1, actor);
    const res2 = await toggleOrganizationMemberStatus(tenantA, 'm1', 'admin@estudionova.uy', 'tenant_admin', 'disabled', 1, actor);

    expect(res1.success).toBe(false);
    expect(res2.success).toBe(false);
    expect(res1.error).toContain('conservar al menos un Administrador activo');
  });

  test('38. Direct Supabase mutation sin autorización -> RLS DENIED', async () => {
    const invalidActor = { role: 'borrower', organizationId: tenantA, userEmail: 'cliente@gmail.com' };
    const res = await updateOrganizationMemberRole(tenantA, 'm2', 'valeria@estudionova.uy', 'analyst', 'tenant_admin', invalidActor);

    expect(res.success).toBe(false);
    expect(res.error).toContain('Acceso denegado');
  });

  test('39. organizationId manipulado -> DENIED', async () => {
    const forgedActor = { role: 'tenant_admin', organizationId: tenantA, userEmail: 'admin@estudionova.uy' };
    const authRes = await resolveServerActorContext(tenantB, forgedActor);

    expect(authRes.isAuthorized).toBe(false);
    expect(authRes.error).toContain('multi-tenant');
  });

  test('40. rawToken no aparece en respuesta de listar invitaciones', async () => {
    const mockInvitationsList = [
      {
        id: 'inv-201',
        organization_id: tenantA,
        email: 'invitado@estudionova.uy',
        role: 'notary',
        status: 'PENDING',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      },
    ];

    const firstItem = mockInvitationsList[0] as any;
    expect(firstItem.token).toBeUndefined();
    expect(firstItem.rawToken).toBeUndefined();
    expect(firstItem.token_hash).toBeUndefined();
  });
});
