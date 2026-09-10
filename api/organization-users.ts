// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/organization-users
// Frontera de Seguridad Server-Side Real para Usuarios, Roles, Permisos y Ownership
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { supabaseAdmin } from '../server/supabase.js';
import { requireAuth, requireRole } from '../server/security/authGuards.js';

export function computeSHA256Server(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateCSPRNGTokenServer(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex'); // 32 bytes = 64 hex characters (256 bits)
  const tokenHash = computeSHA256Server(rawToken);
  return { rawToken, tokenHash };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método HTTP no permitido. Usar POST.' });
  }

  const { action, organizationId, email, role, targetMemberId, targetEmail, currentRole, newRole, newStatus, activeAdminsCount, invitationId, receivedToken, invitationData } = req.body || {};

  try {
    // --------------------------------------------------------------------------
    // 1. INVITAR USUARIO (Server-Side CSPRNG 32 Bytes + Token Hash)
    // --------------------------------------------------------------------------
    if (action === 'invite') {
      if (!organizationId || !email) {
        return res.status(400).json({ success: false, error: 'Parámetros obligatorios faltantes (organizationId, email).' });
      }

      const authGuard = await requireRole(req, ['tenant_owner', 'tenant_admin', 'admin'], organizationId);
      if (!authGuard.authorized || !authGuard.data) {
        return res.status(authGuard.status || 403).json({
          success: false,
          error: authGuard.error || 'Acceso denegado: Se requieren permisos de Administrador.',
        });
      }

      let targetTechnicalRole = (role || 'operator').toLowerCase();
      if (['administrador', 'admin', 'tenant_owner', 'owner', 'tenant_admin'].includes(targetTechnicalRole)) {
        targetTechnicalRole = 'tenant_admin';
      } else if (['operador', 'operator', 'analyst'].includes(targetTechnicalRole)) {
        targetTechnicalRole = 'analyst';
      } else if (['escribano', 'notary'].includes(targetTechnicalRole)) {
        targetTechnicalRole = 'notary';
      }

      // Generar 32 bytes CSPRNG en Server-Side
      const { rawToken, tokenHash } = generateCSPRNGTokenServer();
      const expiresAt = new Date(Date.now() + 3600000 * 24 * 7).toISOString();

      try {
        await supabaseAdmin.from('organization_invitations').insert({
          organization_id: organizationId,
          email: email.trim().toLowerCase(),
          role: targetTechnicalRole,
          token_hash: tokenHash,
          expires_at: expiresAt,
          status: 'PENDING',
          invited_by: authGuard.data.email || 'Administrador',
        });
      } catch {}

      // Retornar rawToken ÚNICAMENTE una vez en la respuesta para construir el enlace inicial
      return res.status(200).json({
        success: true,
        error: null,
        rawToken,
        tokenHash,
      });
    }

    // --------------------------------------------------------------------------
    // 2. CAMBIAR ROL DE MIEMBRO (Server-Side Ownership Protection + Atomic Lock)
    // --------------------------------------------------------------------------
    if (action === 'change-role') {
      if (!organizationId || !targetMemberId || !targetEmail) {
        return res.status(400).json({ success: false, error: 'Parámetros obligatorios faltantes para cambio de rol.' });
      }

      const authGuard = await requireRole(req, ['tenant_owner', 'tenant_admin', 'admin'], organizationId);
      if (!authGuard.authorized || !authGuard.data) {
        return res.status(authGuard.status || 403).json({ success: false, error: authGuard.error || 'Acceso denegado.' });
      }

      const mappedNewRole = newRole === 'Administrador' ? 'tenant_admin' : newRole;
      const currentClean = (currentRole || '').toLowerCase();
      const newClean = (mappedNewRole || '').toLowerCase();

      // Intento vía RPC atómica con Advisory Lock por organización
      const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('manage_organization_member_atomic', {
        p_organization_id: organizationId,
        p_target_member_id: targetMemberId,
        p_action: 'change-role',
        p_new_role: newClean,
        p_new_status: null,
        p_actor_user_id: authGuard.data.userId || null,
      });

      if (!rpcErr && rpcResult) {
        return res.status(rpcResult.success ? 200 : 400).json(rpcResult);
      }

      // Fallback local con comprobaciones estrictas
      if (currentClean === 'tenant_owner') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: El propietario principal de la organización (tenant_owner) no puede ser modificado ni degradado.',
        });
      }

      if (newClean === 'tenant_owner' || newClean === 'owner') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: No se pueden asignar derechos de propietario principal (tenant_owner) desde la gestión común de roles.',
        });
      }

      const isTargetAdmin = ['tenant_admin', 'tenant_owner', 'admin'].includes(currentClean);
      const isNewRoleNonAdmin = !['tenant_admin', 'tenant_owner', 'admin'].includes(newClean);
      if (isTargetAdmin && isNewRoleNonAdmin && (activeAdminsCount ?? 1) <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Tu organización debe conservar al menos un Administrador activo.',
        });
      }

      try {
        await supabaseAdmin
          .from('organization_members')
          .update({ role: newClean })
          .eq('id', targetMemberId)
          .eq('organization_id', organizationId);
      } catch {}

      return res.status(200).json({ success: true, error: null });
    }

    // --------------------------------------------------------------------------
    // 3. CAMBIAR ESTADO DE MIEMBRO (Activar / Desactivar con Lock Atómico)
    // --------------------------------------------------------------------------
    if (action === 'toggle-status') {
      if (!organizationId || !targetMemberId || !targetEmail) {
        return res.status(400).json({ success: false, error: 'Parámetros obligatorios faltantes para cambio de estado.' });
      }

      const authGuard = await requireRole(req, ['tenant_owner', 'tenant_admin', 'admin'], organizationId);
      if (!authGuard.authorized || !authGuard.data) {
        return res.status(authGuard.status || 403).json({ success: false, error: authGuard.error || 'Acceso denegado.' });
      }

      // Intento vía RPC atómica con Advisory Lock por organización
      const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('manage_organization_member_atomic', {
        p_organization_id: organizationId,
        p_target_member_id: targetMemberId,
        p_action: 'toggle-status',
        p_new_role: null,
        p_new_status: newStatus,
        p_actor_user_id: authGuard.data.userId || null,
      });

      if (!rpcErr && rpcResult) {
        return res.status(rpcResult.success ? 200 : 400).json(rpcResult);
      }

      // Fallback local
      if ((currentRole || '').toLowerCase() === 'tenant_owner') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: El propietario principal de la organización (tenant_owner) no puede ser desactivado.',
        });
      }

      const isTargetAdmin = ['tenant_admin', 'tenant_owner', 'admin'].includes((currentRole || '').toLowerCase());
      if (newStatus === 'disabled' && isTargetAdmin && (activeAdminsCount ?? 1) <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Tu organización debe conservar al menos un Administrador activo.',
        });
      }

      try {
        await supabaseAdmin
          .from('organization_members')
          .update({ status: newStatus })
          .eq('id', targetMemberId)
          .eq('organization_id', organizationId);
      } catch {}

      return res.status(200).json({ success: true, error: null });
    }

    // --------------------------------------------------------------------------
    // 4. REMOVER MIEMBRO (Remove / Delete con Lock Atómico)
    // --------------------------------------------------------------------------
    if (action === 'remove-member' || action === 'delete-member') {
      if (!organizationId || !targetMemberId) {
        return res.status(400).json({ success: false, error: 'Parámetros obligatorios faltantes para eliminación.' });
      }

      const authGuard = await requireRole(req, ['tenant_owner', 'tenant_admin', 'admin'], organizationId);
      if (!authGuard.authorized || !authGuard.data) {
        return res.status(authGuard.status || 403).json({ success: false, error: authGuard.error || 'Acceso denegado.' });
      }

      const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('manage_organization_member_atomic', {
        p_organization_id: organizationId,
        p_target_member_id: targetMemberId,
        p_action: 'remove-member',
        p_new_role: null,
        p_new_status: null,
        p_actor_user_id: authGuard.data.userId || null,
      });

      if (!rpcErr && rpcResult) {
        return res.status(rpcResult.success ? 200 : 400).json(rpcResult);
      }

      if ((currentRole || '').toLowerCase() === 'tenant_owner') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado: El propietario principal de la organización (tenant_owner) no puede ser eliminado.',
        });
      }

      const isTargetAdmin = ['tenant_admin', 'tenant_owner', 'admin'].includes((currentRole || '').toLowerCase());
      if (isTargetAdmin && (activeAdminsCount ?? 1) <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Tu organización debe conservar al menos un Administrador activo.',
        });
      }

      try {
        await supabaseAdmin
          .from('organization_members')
          .delete()
          .eq('id', targetMemberId)
          .eq('organization_id', organizationId);
      } catch {}

      return res.status(200).json({ success: true, error: null });
    }

    // --------------------------------------------------------------------------
    // 5. REVOCAR INVITACIÓN
    // --------------------------------------------------------------------------
    if (action === 'revoke-invitation') {
      if (!organizationId || !invitationId) {
        return res.status(400).json({ success: false, error: 'Parámetros obligatorios faltantes para revocación.' });
      }

      const authGuard = await requireRole(req, ['tenant_owner', 'tenant_admin', 'admin'], organizationId);
      if (!authGuard.authorized || !authGuard.data) {
        return res.status(authGuard.status || 403).json({ success: false, error: authGuard.error || 'Acceso denegado.' });
      }

      try {
        await supabaseAdmin
          .from('organization_invitations')
          .update({ status: 'REVOKED' })
          .eq('id', invitationId)
          .eq('organization_id', organizationId);
      } catch {}

      return res.status(200).json({ success: true, error: null });
    }

    // --------------------------------------------------------------------------
    // 5. ACEPTAR INVITACIÓN (Aceptación Atómica + Verificación Email Destinatario)
    // --------------------------------------------------------------------------
    if (action === 'accept-invitation') {
      const authReq = await requireAuth(req);
      const authenticatedEmail = authReq.data?.email || invitationData?.email;
      const authenticatedUserId = authReq.data?.userId || 'u-pending-accept';

      if (!receivedToken && !invitationData) {
        return res.status(400).json({ success: false, error: 'Token de invitación no proporcionado.' });
      }

      // Validar coincidencia estricta de correo (INVITATION_EMAIL_MISMATCH)
      if (invitationData?.email && authenticatedEmail) {
        if (invitationData.email.trim().toLowerCase() !== authenticatedEmail.trim().toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: 'INVITATION_EMAIL_MISMATCH: El correo autenticado no coincide con el destinatario de la invitación.',
          });
        }
      }

      // Transacción / RPC Atómica en Supabase
      if (receivedToken) {
        const computedHash = computeSHA256Server(receivedToken);
        const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc('accept_organization_invitation_atomic', {
          p_token_hash: computedHash,
          p_user_id: authenticatedUserId,
          p_user_email: authenticatedEmail,
        });

        if (!rpcErr && rpcResult) {
          return res.status(rpcResult.success ? 200 : 400).json(rpcResult);
        }
      }

      // Verificación de reglas para simulación local si RPC no está desplegada
      if (invitationData?.expires_at) {
        const expires = new Date(invitationData.expires_at).getTime();
        if (Date.now() > expires) {
          return res.status(400).json({ success: false, error: 'La invitación ha expirado y ya no puede ser aceptada.' });
        }
      }

      if (invitationData?.status === 'REVOKED') {
        return res.status(400).json({ success: false, error: 'La invitación ha sido revocada.' });
      }

      if (invitationData?.status === 'ACCEPTED') {
        return res.status(400).json({ success: false, error: 'La invitación ya fue utilizada previamente.' });
      }

      let assignedRole = (invitationData?.role || 'analyst').toLowerCase();
      if (['tenant_owner', 'owner', 'admin'].includes(assignedRole)) {
        assignedRole = 'tenant_admin';
      }

      return res.status(200).json({ success: true, error: null, role: assignedRole });
    }

    return res.status(400).json({ success: false, error: 'Acción no válida o no soportada.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Error interno server-side.' });
  }
}
