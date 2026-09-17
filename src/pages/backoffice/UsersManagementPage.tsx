import React, { useEffect, useMemo, useState } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import {
  PermissionDefinition,
  OrganizationRole,
  OrganizationMemberRbac,
  getPermissionDefinitions,
  getOrganizationRoles,
  getOrganizationMembersRbac,
  createOrganizationRole,
  updateOrganizationRole,
  assignRoleToMember,
  removeRoleFromMember,
  inviteOrganizationMemberWithRole,
} from '../../lib/organizationRbacService';
import { toggleOrganizationMemberStatus } from '../../lib/tenantService';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Plus,
  Pencil,
  CheckCircle2,
  XCircle,
  LockKeyhole,
  RefreshCw,
  Mail,
} from 'lucide-react';

type Tab = 'users' | 'roles' | 'invitations';

type Invitation = {
  id: string;
  email: string;
  status: string;
  role_id?: string | null;
  role?: string;
  created_at: string;
  expires_at?: string;
};

export const UsersManagementPage: React.FC = () => {
  const { tenant } = useTenant();
  const [tab, setTab] = useState<Tab>('users');
  const [members, setMembers] = useState<OrganizationMemberRbac[]>([]);
  const [roles, setRoles] = useState<OrganizationRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);

  const [editingRole, setEditingRole] = useState<OrganizationRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleBusy, setRoleBusy] = useState(false);

  const load = async () => {
    if (!tenant.id) return;
    setLoading(true);
    setError('');
    try {
      const [loadedRoles, loadedPermissions, loadedMembers, invitationResult] = await Promise.all([
        getOrganizationRoles(tenant.id),
        getPermissionDefinitions(),
        getOrganizationMembersRbac(tenant.id),
        supabase
          .from('organization_invitations')
          .select('id,email,status,role_id,role,created_at,expires_at')
          .eq('organization_id', tenant.id)
          .order('created_at', { ascending: false }),
      ]);
      setRoles(loadedRoles);
      setPermissions(loadedPermissions);
      setMembers(loadedMembers);
      setInvitations((invitationResult.data || []) as Invitation[]);
      const firstAssignable = loadedRoles.find((r) => !r.is_owner_role);
      if (!inviteRoleId && firstAssignable) setInviteRoleId(firstAssignable.id);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la administración de accesos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tenant.id]);

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, PermissionDefinition[]>();
    permissions.forEach((permission) => {
      const list = groups.get(permission.category) || [];
      list.push(permission);
      groups.set(permission.category, list);
    });
    return Array.from(groups.entries());
  }, [permissions]);

  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);

  const openNewRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
  };

  const openEditRole = (role: OrganizationRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions || []);
  };

  const saveRole = async () => {
    if (!roleName.trim()) return;
    setRoleBusy(true);
    setError('');
    try {
      if (editingRole) {
        await updateOrganizationRole(tenant.id, editingRole.id, {
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissionKeys: selectedPermissions,
        });
        setNotice('Rol y permisos actualizados.');
      } else {
        await createOrganizationRole(tenant.id, {
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissionKeys: selectedPermissions,
        });
        setNotice('Rol personalizado creado.');
      }
      setEditingRole(null);
      setRoleName('');
      setRoleDescription('');
      setSelectedPermissions([]);
      await load();
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar el rol.');
    } finally {
      setRoleBusy(false);
    }
  };

  const togglePermission = (permissionKey: string) => {
    setSelectedPermissions((current) => current.includes(permissionKey)
      ? current.filter((key) => key !== permissionKey)
      : [...current, permissionKey]);
  };

  const invite = async () => {
    if (!inviteEmail.trim() || !inviteRoleId) return;
    setInviteBusy(true);
    setError('');
    try {
      await inviteOrganizationMemberWithRole(tenant.id, inviteEmail.trim(), inviteRoleId);
      setNotice(`Invitación creada para ${inviteEmail.trim()}.`);
      setInviteEmail('');
      await load();
    } catch (e: any) {
      setError(e?.message || 'No se pudo crear la invitación.');
    } finally {
      setInviteBusy(false);
    }
  };

  const addRole = async (memberId: string, roleId: string) => {
    if (!roleId) return;
    setError('');
    try {
      await assignRoleToMember(tenant.id, memberId, roleId);
      setNotice('Rol asignado.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'No se pudo asignar el rol.');
    }
  };

  const removeRole = async (memberId: string, role: OrganizationRole) => {
    if (role.is_owner_role) return;
    setError('');
    try {
      await removeRoleFromMember(tenant.id, memberId, role.id);
      setNotice('Rol removido.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'No se pudo remover el rol.');
    }
  };

  const toggleMember = async (member: OrganizationMemberRbac) => {
    if (member.legacy_role === 'tenant_owner') return;
    const newStatus = member.is_active ? 'disabled' : 'active';
    try {
      const result = await toggleOrganizationMemberStatus(
        tenant.id,
        member.id,
        member.email || member.user_id,
        member.legacy_role,
        newStatus,
        99,
        { organizationId: tenant.id }
      );
      if (!result.success) throw new Error(result.error || 'No se pudo modificar el acceso.');
      setNotice(newStatus === 'active' ? 'Usuario reactivado.' : 'Usuario desactivado.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'No se pudo modificar el usuario.');
    }
  };

  const tabButton = (value: Tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setTab(value)}
      className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${tab === value ? 'border-brand-green text-brand-green' : 'border-transparent text-slate-500'}`}
    >
      {icon}{label}
    </button>
  );

  return (
    <BackofficeLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12 text-left">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest">Control de acceso</span>
            <h1 className="text-2xl md:text-3xl font-bold text-navy mt-1">Usuarios, roles y permisos</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Cada organización decide cómo trabaja su equipo. Podés tener una sola persona con acceso total, varios administradores o roles personalizados con permisos específicos.
            </p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-white">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900 flex gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong>Modelo flexible activado.</strong> “Administrador”, “Operaciones”, “Solo lectura” y “Escribano” son plantillas iniciales, no puestos obligatorios. Un usuario puede tener varios roles y los roles personalizados pueden combinar cualquier conjunto de permisos. El Propietario sigue protegido.
          </div>
        </div>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex gap-2"><XCircle className="w-4 h-4" />{error}</div>}
        {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex gap-2"><CheckCircle2 className="w-4 h-4" />{notice}</div>}

        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
          {tabButton('users', `Usuarios (${members.length})`, <Users className="w-4 h-4" />)}
          {tabButton('roles', `Roles (${roles.length})`, <ShieldCheck className="w-4 h-4" />)}
          {tabButton('invitations', `Invitaciones (${invitations.filter((i) => i.status === 'PENDING').length})`, <Mail className="w-4 h-4" />)}
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando permisos reales…</div>
        ) : tab === 'users' ? (
          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-navy">Todavía no hay usuarios internos</h3>
                <p className="text-sm text-slate-500 mt-1">Creá el primer usuario real mediante una invitación.</p>
              </div>
            ) : members.map((member) => {
              const assignedIds = new Set(member.roles.map((role) => role.id));
              const availableRoles = roles.filter((role) => !role.is_owner_role && !assignedIds.has(role.id));
              return (
                <div key={member.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-navy">{member.full_name || member.email || member.user_id}</h3>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${member.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {member.is_active ? 'ACTIVO' : 'DESACTIVADO'}
                        </span>
                        {member.legacy_role === 'tenant_owner' && <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">PROPIETARIO</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{member.email || member.user_id}</p>
                    </div>
                    {member.legacy_role !== 'tenant_owner' && (
                      <button onClick={() => toggleMember(member)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold">
                        {member.is_active ? 'Desactivar acceso' : 'Reactivar acceso'}
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="text-xs font-bold text-slate-700">Roles asignados</div>
                        <div className="text-[11px] text-slate-400">Los permisos efectivos son la suma de todos sus roles.</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.roles.map((role) => (
                        <span key={role.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                          {role.is_owner_role && <LockKeyhole className="w-3 h-3 text-amber-600" />}{role.name}
                          {!role.is_owner_role && <button onClick={() => removeRole(member.id, role)} className="text-slate-400 hover:text-rose-600">×</button>}
                        </span>
                      ))}
                      {member.roles.length === 0 && <span className="text-xs text-amber-700">Sin roles asignados.</span>}
                    </div>
                    {member.legacy_role !== 'tenant_owner' && availableRoles.length > 0 && (
                      <select
                        className="mt-3 border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white"
                        defaultValue=""
                        onChange={(e) => { const value = e.target.value; if (value) addRole(member.id, value); e.currentTarget.value = ''; }}
                      >
                        <option value="">+ Agregar otro rol…</option>
                        {availableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : tab === 'roles' ? (
          <div className="grid lg:grid-cols-[1fr_420px] gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-navy">Roles disponibles</h2>
                <button onClick={openNewRole} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-green text-white text-xs font-bold"><Plus className="w-4 h-4" /> Nuevo rol</button>
              </div>
              {roles.map((role) => (
                <div key={role.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-navy">{role.name}</h3>
                      {role.is_owner_role && <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-2 py-0.5">PROTEGIDO</span>}
                      {role.is_system_template && <span className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-500 rounded-full px-2 py-0.5">PLANTILLA</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{role.description}</p>
                    <p className="text-[11px] text-slate-400 mt-2">{role.permissions?.length || 0} permisos</p>
                  </div>
                  {!role.is_owner_role && <button onClick={() => openEditRole(role)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-brand-green"><Pencil className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 h-fit lg:sticky lg:top-6">
              <h2 className="font-bold text-navy">{editingRole ? `Editar: ${editingRole.name}` : 'Crear rol personalizado'}</h2>
              <p className="text-xs text-slate-500 mt-1">Elegí un nombre y exactamente qué puede hacer este rol.</p>
              <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Ej.: Tasaciones, Gerencia, Documentación" className="mt-4 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <textarea value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder="Descripción opcional" className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-20" />
              <div className="mt-4 space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {permissionGroups.map(([category, items]) => (
                  <div key={category}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{category}</div>
                    <div className="space-y-2">
                      {items.map((permission) => (
                        <label key={permission.permission_key} className="flex gap-2 items-start text-xs cursor-pointer">
                          <input type="checkbox" checked={selectedPermissions.includes(permission.permission_key)} onChange={() => togglePermission(permission.permission_key)} className="mt-0.5" />
                          <span><strong className="text-slate-700">{permission.label}</strong><span className="block text-[11px] text-slate-400">{permission.description}</span></span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button disabled={roleBusy || !roleName.trim()} onClick={saveRole} className="flex-1 px-4 py-2 rounded-lg bg-brand-green text-white text-xs font-bold disabled:opacity-50">{roleBusy ? 'Guardando…' : editingRole ? 'Guardar cambios' : 'Crear rol'}</button>
                {editingRole && <button onClick={openNewRole} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold">Cancelar</button>}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[380px_1fr] gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 h-fit">
              <div className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-brand-green" /><h2 className="font-bold text-navy">Invitar usuario</h2></div>
              <p className="text-xs text-slate-500 mt-1">La invitación puede usar cualquier rol de la organización, incluido uno personalizado.</p>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="persona@estudio.com" className="mt-4 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <select value={inviteRoleId} onChange={(e) => setInviteRoleId(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                {roles.filter((role) => !role.is_owner_role).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
              <button disabled={inviteBusy || !inviteEmail.trim() || !inviteRoleId} onClick={invite} className="mt-3 w-full px-4 py-2 rounded-lg bg-brand-green text-white text-xs font-bold disabled:opacity-50">{inviteBusy ? 'Creando invitación…' : 'Crear invitación'}</button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-bold text-navy">Historial de invitaciones</h2></div>
              {invitations.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No hay invitaciones.</div> : invitations.map((invitation) => (
                <div key={invitation.id} className="px-5 py-4 border-b border-slate-100 last:border-0 flex items-center justify-between gap-3">
                  <div><div className="font-semibold text-sm text-navy">{invitation.email}</div><div className="text-[11px] text-slate-400 mt-1">{invitation.role_id ? roleById.get(invitation.role_id)?.name || 'Rol personalizado' : invitation.role || 'Sin rol'} · {new Date(invitation.created_at).toLocaleDateString('es-UY')}</div></div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${invitation.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : invitation.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{invitation.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BackofficeLayout>
  );
};
