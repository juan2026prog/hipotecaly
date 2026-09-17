import { supabase } from './supabase';

export interface PermissionDefinition {
  permission_key: string;
  category: string;
  label: string;
  description?: string | null;
  sort_order: number;
}

export interface OrganizationRole {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string | null;
  is_system_template: boolean;
  is_owner_role: boolean;
  is_active: boolean;
  permissions?: string[];
}

export interface MemberRoleAssignment {
  member_id: string;
  role_id: string;
  assigned_at: string;
  role?: OrganizationRole;
}

export interface OrganizationMemberRbac {
  id: string;
  organization_id: string;
  user_id: string;
  is_active: boolean;
  legacy_role: string;
  email?: string;
  full_name?: string;
  roles: OrganizationRole[];
}

export async function getPermissionDefinitions(): Promise<PermissionDefinition[]> {
  const { data, error } = await supabase
    .from('permission_definitions')
    .select('*')
    .order('category')
    .order('sort_order');
  if (error) throw error;
  return (data || []) as PermissionDefinition[];
}

export async function getOrganizationRoles(organizationId: string): Promise<OrganizationRole[]> {
  const { data: roles, error } = await supabase
    .from('organization_roles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('is_owner_role', { ascending: false })
    .order('name');
  if (error) throw error;

  const roleIds = (roles || []).map((r: any) => r.id);
  if (roleIds.length === 0) return [];

  const { data: permissions, error: permError } = await supabase
    .from('organization_role_permissions')
    .select('role_id, permission_key')
    .in('role_id', roleIds);
  if (permError) throw permError;

  const grouped = new Map<string, string[]>();
  for (const row of permissions || []) {
    const list = grouped.get((row as any).role_id) || [];
    list.push((row as any).permission_key);
    grouped.set((row as any).role_id, list);
  }

  return (roles || []).map((role: any) => ({
    ...role,
    permissions: grouped.get(role.id) || [],
  })) as OrganizationRole[];
}

export async function getOrganizationMembersRbac(organizationId: string): Promise<OrganizationMemberRbac[]> {
  const { data: members, error } = await supabase
    .from('organization_members')
    .select('id, organization_id, user_id, role, is_active, profiles(email, first_name, last_name)')
    .eq('organization_id', organizationId)
    .order('created_at');
  if (error) throw error;

  const roles = await getOrganizationRoles(organizationId);
  const roleMap = new Map(roles.map((role) => [role.id, role]));
  const memberIds = (members || []).map((m: any) => m.id);

  const assignmentsByMember = new Map<string, OrganizationRole[]>();
  if (memberIds.length > 0) {
    const { data: assignments, error: assignmentError } = await supabase
      .from('organization_member_role_assignments')
      .select('member_id, role_id')
      .in('member_id', memberIds);
    if (assignmentError) throw assignmentError;

    for (const assignment of assignments || []) {
      const role = roleMap.get((assignment as any).role_id);
      if (!role) continue;
      const list = assignmentsByMember.get((assignment as any).member_id) || [];
      list.push(role);
      assignmentsByMember.set((assignment as any).member_id, list);
    }
  }

  return (members || []).map((member: any) => {
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
    return {
      id: member.id,
      organization_id: member.organization_id,
      user_id: member.user_id,
      is_active: Boolean(member.is_active),
      legacy_role: member.role,
      email: profile?.email || undefined,
      full_name: fullName || profile?.email || undefined,
      roles: assignmentsByMember.get(member.id) || [],
    } as OrganizationMemberRbac;
  });
}

export async function getMemberRoleAssignments(memberId: string): Promise<MemberRoleAssignment[]> {
  const { data, error } = await supabase
    .from('organization_member_role_assignments')
    .select('member_id, role_id, assigned_at, organization_roles(*)')
    .eq('member_id', memberId);
  if (error) throw error;
  return (data || []).map((row: any) => ({
    member_id: row.member_id,
    role_id: row.role_id,
    assigned_at: row.assigned_at,
    role: row.organization_roles,
  }));
}

export async function getMyOrganizationPermissions(organizationId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_my_org_permissions', {
    p_organization_id: organizationId,
  });
  if (error) return [];
  return (data || []).map((row: any) => row.permission_key);
}

async function callRolesApi(payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch('/api/organization-roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.success) throw new Error(body?.error || 'No se pudo actualizar roles y permisos.');
  return body;
}

export function createOrganizationRole(organizationId: string, input: {
  name: string;
  description?: string;
  permissionKeys: string[];
}) {
  return callRolesApi({ action: 'create-role', organizationId, ...input });
}

export function updateOrganizationRole(organizationId: string, roleId: string, input: {
  name?: string;
  description?: string;
  permissionKeys?: string[];
  isActive?: boolean;
}) {
  return callRolesApi({ action: 'update-role', organizationId, roleId, ...input });
}

export function assignRoleToMember(organizationId: string, memberId: string, roleId: string) {
  return callRolesApi({ action: 'assign-role', organizationId, memberId, roleId });
}

export function removeRoleFromMember(organizationId: string, memberId: string, roleId: string) {
  return callRolesApi({ action: 'remove-role', organizationId, memberId, roleId });
}

export function inviteOrganizationMemberWithRole(organizationId: string, email: string, roleId: string) {
  return callRolesApi({ action: 'invite-with-role', organizationId, email, roleId });
}
