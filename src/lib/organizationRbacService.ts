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
