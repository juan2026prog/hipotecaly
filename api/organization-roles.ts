import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { supabaseAdmin } from '../server/supabase.js';
import { requireOrganizationPermission } from '../server/security/permissionGuard.js';

const safeCode = (name: string) => name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 60) || `role_${Date.now()}`;

async function replacePermissions(roleId: string, permissionKeys: string[]) {
  const unique = [...new Set((permissionKeys || []).filter(Boolean))];
  const { error: deleteError } = await supabaseAdmin
    .from('organization_role_permissions')
    .delete()
    .eq('role_id', roleId);
  if (deleteError) throw deleteError;

  if (unique.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('organization_role_permissions')
      .insert(unique.map((permission_key) => ({ role_id: roleId, permission_key })));
    if (insertError) throw insertError;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método HTTP no permitido.' });
  }

  const {
    action,
    organizationId,
    roleId,
    memberId,
    name,
    description,
    permissionKeys,
    isActive,
    email,
  } = req.body || {};

  if (!organizationId || !action) {
    return res.status(400).json({ success: false, error: 'organizationId y action son obligatorios.' });
  }

  const requiredPermission = action === 'assign-role' || action === 'remove-role' || action === 'invite-with-role'
    ? 'organization.users.manage'
    : 'organization.roles.manage';

  const guard = await requireOrganizationPermission(req, organizationId, requiredPermission);
  if (!guard.authorized || !guard.data) {
    return res.status(guard.status || 403).json({ success: false, error: guard.error || 'Acceso denegado.' });
  }

  try {
    if (action === 'create-role') {
      if (!name || !Array.isArray(permissionKeys)) {
        return res.status(400).json({ success: false, error: 'Nombre y permisos son obligatorios.' });
      }

      let code = safeCode(name);
      const { data: exists } = await supabaseAdmin
        .from('organization_roles')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('code', code)
        .maybeSingle();
      if (exists) code = `${code}_${Date.now().toString(36)}`;

      const { data: role, error } = await supabaseAdmin
        .from('organization_roles')
        .insert({
          organization_id: organizationId,
          code,
          name: String(name).trim(),
          description: description ? String(description).trim() : null,
          is_system_template: false,
          is_owner_role: false,
          is_active: true,
          created_by: guard.data.userId,
        })
        .select('*')
        .single();
      if (error) throw error;

      await replacePermissions(role.id, permissionKeys);
      return res.status(200).json({ success: true, role });
    }

    if (action === 'update-role') {
      if (!roleId) return res.status(400).json({ success: false, error: 'roleId es obligatorio.' });

      const { data: role, error: roleError } = await supabaseAdmin
        .from('organization_roles')
        .select('*')
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .single();
      if (roleError || !role) return res.status(404).json({ success: false, error: 'Rol no encontrado.' });
      if (role.is_owner_role) return res.status(400).json({ success: false, error: 'OWNER_ROLE_PROTECTED' });

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name !== undefined) patch.name = String(name).trim();
      if (description !== undefined) patch.description = description ? String(description).trim() : null;
      if (isActive !== undefined) patch.is_active = Boolean(isActive);

      const { error } = await supabaseAdmin
        .from('organization_roles')
        .update(patch)
        .eq('id', roleId)
        .eq('organization_id', organizationId);
      if (error) throw error;

      if (Array.isArray(permissionKeys)) await replacePermissions(roleId, permissionKeys);
      return res.status(200).json({ success: true });
    }

    if (action === 'assign-role' || action === 'remove-role') {
      if (!roleId || !memberId) return res.status(400).json({ success: false, error: 'roleId y memberId son obligatorios.' });

      const { data: role, error: roleError } = await supabaseAdmin
        .from('organization_roles')
        .select('id, is_owner_role')
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .single();
      if (roleError || !role) return res.status(404).json({ success: false, error: 'Rol no encontrado.' });

      const { data: member, error: memberError } = await supabaseAdmin
        .from('organization_members')
        .select('id, role, organization_id')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single();
      if (memberError || !member) return res.status(404).json({ success: false, error: 'Miembro no encontrado.' });

      if (role.is_owner_role && member.role !== 'tenant_owner') {
        return res.status(400).json({ success: false, error: 'OWNER_ASSIGNMENT_PROTECTED' });
      }
      if (member.role === 'tenant_owner' && action === 'remove-role' && role.is_owner_role) {
        return res.status(400).json({ success: false, error: 'OWNER_ROLE_PROTECTED' });
      }

      if (action === 'assign-role') {
        const { error } = await supabaseAdmin
          .from('organization_member_role_assignments')
          .upsert({ member_id: memberId, role_id: roleId, assigned_by: guard.data.userId }, { onConflict: 'member_id,role_id' });
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin
          .from('organization_member_role_assignments')
          .delete()
          .eq('member_id', memberId)
          .eq('role_id', roleId);
        if (error) throw error;
      }

      return res.status(200).json({ success: true });
    }

    if (action === 'invite-with-role') {
      if (!email || !roleId) return res.status(400).json({ success: false, error: 'email y roleId son obligatorios.' });

      const { data: role, error: roleError } = await supabaseAdmin
        .from('organization_roles')
        .select('id, code, is_owner_role')
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single();
      if (roleError || !role) return res.status(404).json({ success: false, error: 'Rol no encontrado.' });
      if (role.is_owner_role) return res.status(400).json({ success: false, error: 'OWNER_ASSIGNMENT_PROTECTED' });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const legacyRole = role.code === 'administrator' ? 'tenant_admin'
        : role.code === 'notary' ? 'notary'
        : role.code === 'operations' ? 'operator'
        : 'viewer';

      const { error } = await supabaseAdmin.from('organization_invitations').insert({
        organization_id: organizationId,
        email: String(email).trim().toLowerCase(),
        role: legacyRole,
        role_id: roleId,
        token: `hashed:${tokenHash}`,
        token_hash: tokenHash,
        status: 'PENDING',
        expires_at: expiresAt,
        invited_by: guard.data.email || 'Administrador',
      });
      if (error) throw error;

      return res.status(200).json({ success: true, rawToken, expiresAt });
    }

    return res.status(400).json({ success: false, error: 'Acción no soportada.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Error interno al gestionar roles.' });
  }
}
