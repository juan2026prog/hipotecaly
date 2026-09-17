// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/organization-users
// Gestión de usuarios con autorización por permisos explícitos de organización.
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { supabaseAdmin } from '../server/supabase.js';
import { requireAuth } from '../server/security/authGuards.js';
import { requireOrganizationPermission } from '../server/security/permissionGuard.js';

export function computeSHA256Server(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function generateCSPRNGTokenServer(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  return { rawToken, tokenHash: computeSHA256Server(rawToken) };
}

async function requireUserManagement(req: VercelRequest, organizationId: string) {
  return requireOrganizationPermission(req, organizationId, 'organization.users.manage');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método HTTP no permitido. Usar POST.' });
  }

  const {
    action,
    organizationId,
    email,
    role,
    targetMemberId,
    targetEmail,
    newRole,
    newStatus,
    invitationId,
    receivedToken,
    invitationData,
  } = req.body || {};

  try {
    if (action === 'accept-invitation') {
      const auth = await requireAuth(req);
      if (!auth.authorized || !auth.data) {
        return res.status(auth.status || 401).json({ success: false, error: auth.error || 'Autenticación requerida.' });
      }
      if (!receivedToken) {
        return res.status(400).json({ success: false, error: 'Token de invitación no proporcionado.' });
      }

      const authenticatedEmail = auth.data.email;
      if (invitationData?.email && authenticatedEmail && invitationData.email.trim().toLowerCase() !== authenticatedEmail.trim().toLowerCase()) {
        return res.status(403).json({ success: false, error: 'INVITATION_EMAIL_MISMATCH: El correo autenticado no coincide con el destinatario.' });
      }

      const { data, error } = await supabaseAdmin.rpc('accept_organization_invitation_atomic', {
        p_token_hash: computeSHA256Server(receivedToken),
        p_user_id: auth.data.userId,
        p_user_email: authenticatedEmail,
      });
      if (error) return res.status(400).json({ success: false, error: error.message });
      return res.status(data?.success ? 200 : 400).json(data || { success: false, error: 'No se pudo procesar la invitación.' });
    }

    if (!organizationId) {
      return res.status(400).json({ success: false, error: 'organizationId es obligatorio.' });
    }

    const guard = await requireUserManagement(req, organizationId);
    if (!guard.authorized || !guard.data) {
      return res.status(guard.status || 403).json({ success: false, error: guard.error || 'Acceso denegado.' });
    }

    if (action === 'invite') {
      if (!email) return res.status(400).json({ success: false, error: 'email es obligatorio.' });

      let targetTechnicalRole = String(role || 'viewer').toLowerCase();
      if (['administrador', 'admin', 'tenant_admin'].includes(targetTechnicalRole)) targetTechnicalRole = 'tenant_admin';
      else if (['operador', 'operations', 'operator'].includes(targetTechnicalRole)) targetTechnicalRole = 'operator';
      else if (['escribano', 'notary'].includes(targetTechnicalRole)) targetTechnicalRole = 'notary';
      else if (targetTechnicalRole !== 'viewer' && targetTechnicalRole !== 'analyst') targetTechnicalRole = 'viewer';
      if (['tenant_owner', 'owner'].includes(targetTechnicalRole)) {
        return res.status(400).json({ success: false, error: 'OWNER_ASSIGNMENT_PROTECTED' });
      }

      const { rawToken, tokenHash } = generateCSPRNGTokenServer();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabaseAdmin.from('organization_invitations').insert({
        organization_id: organizationId,
        email: String(email).trim().toLowerCase(),
        role: targetTechnicalRole,
        token: `hashed:${tokenHash}`,
        token_hash: tokenHash,
        expires_at: expiresAt,
        status: 'PENDING',
        invited_by: guard.data.email || 'Administrador',
      });
      if (error) return res.status(500).json({ success: false, error: `Error al persistir invitación: ${error.message}` });
      return res.status(200).json({ success: true, rawToken, tokenHash, expiresAt });
    }

    if (action === 'change-role') {
      if (!targetMemberId || !targetEmail) return res.status(400).json({ success: false, error: 'Faltan datos del miembro.' });
      const mapped = newRole === 'Administrador' ? 'tenant_admin' : String(newRole || '').toLowerCase();
      const { data, error } = await supabaseAdmin.rpc('manage_organization_member_atomic', {
        p_organization_id: organizationId,
        p_target_member_id: targetMemberId,
        p_action: 'change-role',
        p_new_role: mapped,
        p_new_status: null,
        p_actor_user_id: guard.data.userId,
      });
      if (error) return res.status(400).json({ success: false, error: error.message });
      return res.status(data?.success ? 200 : 400).json(data || { success: false });
    }

    if (action === 'toggle-status') {
      if (!targetMemberId || !targetEmail) return res.status(400).json({ success: false, error: 'Faltan datos del miembro.' });
      const { data, error } = await supabaseAdmin.rpc('manage_organization_member_atomic', {
        p_organization_id: organizationId,
        p_target_member_id: targetMemberId,
        p_action: 'toggle-status',
        p_new_role: null,
        p_new_status: newStatus,
        p_actor_user_id: guard.data.userId,
      });
      if (error) return res.status(400).json({ success: false, error: error.message });
      return res.status(data?.success ? 200 : 400).json(data || { success: false });
    }

    if (action === 'remove-member' || action === 'delete-member') {
      if (!targetMemberId) return res.status(400).json({ success: false, error: 'targetMemberId es obligatorio.' });
      const { data, error } = await supabaseAdmin.rpc('manage_organization_member_atomic', {
        p_organization_id: organizationId,
        p_target_member_id: targetMemberId,
        p_action: 'remove-member',
        p_new_role: null,
        p_new_status: null,
        p_actor_user_id: guard.data.userId,
      });
      if (error) return res.status(400).json({ success: false, error: error.message });
      return res.status(data?.success ? 200 : 400).json(data || { success: false });
    }

    if (action === 'revoke-invitation') {
      if (!invitationId) return res.status(400).json({ success: false, error: 'invitationId es obligatorio.' });
      const { error } = await supabaseAdmin
        .from('organization_invitations')
        .update({ status: 'REVOKED' })
        .eq('id', invitationId)
        .eq('organization_id', organizationId)
        .eq('status', 'PENDING');
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, error: 'Acción no válida o no soportada.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Error interno server-side.' });
  }
}
