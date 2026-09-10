import React, { useState, useEffect } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { Button } from '../../components/ui/Button';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getOrganizationMembers,
  inviteOrganizationMember,
  OrganizationMember,
  OrganizationInvitation,
} from '../../lib/tenantService';
import {
  getCommercialRoleLabel,
  getTechnicalRoleFromCommercial,
  getRoleBadgeStyle,
  COMMERCIAL_ROLE_DESCRIPTIONS,
  STAFF_INVITATION_OPTIONS,
  StaffCommercialRole,
} from '../../lib/roleMapping';
import { auditService } from '../../lib/auditService';
import {
  UserPlus,
  CheckCircle2,
  Clock,
  Shield,
  ShieldCheck,
  AlertTriangle,
  UserX,
  RefreshCw,
  Users,
  Briefcase,
  FileText,
  Building2,
  Mail,
  Info,
  XCircle,
  Slash,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();

  // Estado de pestañas: 'users' | 'roles' | 'invitations'
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'invitations'>('users');

  // Miembros de la organización
  const [members, setMembers] = useState<OrganizationMember[]>([
    {
      id: 'm1',
      organization_id: tenant.id,
      user_id: 'u1',
      email: 'admin@estudionova.uy',
      full_name: 'Ignacio Notario',
      role: 'tenant_admin',
      status: 'active',
      created_at: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
      last_access_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'm2',
      organization_id: tenant.id,
      user_id: 'u2',
      email: 'valeria@estudionova.uy',
      full_name: 'Valeria Rivas',
      role: 'analyst',
      status: 'active',
      created_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
      last_access_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'm3',
      organization_id: tenant.id,
      user_id: 'u3',
      email: 'maria@escribania.com',
      full_name: 'Esc. María Pérez Morales',
      role: 'notary',
      status: 'active',
      created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
      last_access_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ]);

  // Invitaciones pendientes / pasadas
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([
    {
      id: 'inv-1',
      organization_id: tenant.id,
      email: 'ana@escribania.com',
      role: 'notary',
      token: 'inv_tok_991823',
      status: 'PENDING',
      invited_by: 'Ignacio Notario',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 24 * 7).toISOString(),
    },
  ]);

  const [loading, setLoading] = useState(false);

  // Modal Invitar Usuario
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStaffRole, setInviteStaffRole] = useState<StaffCommercialRole>('Operador');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Modal Confirmación Cambio de Rol / Elevación de Privilegios
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [targetMember, setTargetMember] = useState<OrganizationMember | null>(null);
  const [selectedNewCommercialRole, setSelectedNewCommercialRole] = useState<StaffCommercialRole>('Operador');
  const [changingRole, setChangingRole] = useState(false);

  // Modal Alerta Bloqueo Último Admin
  const [showLastAdminBlockModal, setShowLastAdminBlockModal] = useState(false);
  const [lastAdminBlockReason, setLastAdminBlockReason] = useState('');

  // Mensaje Toast / Notificación
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    getOrganizationMembers(tenant.id).then((data) => {
      if (data && data.length > 0) {
        setMembers(data);
      }
      setLoading(false);
    });
  }, [tenant.id]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Cuenta de administradores activos
  const getActiveAdminsCount = (): number => {
    return members.filter(
      (m) => m.status === 'active' && getCommercialRoleLabel(m.role) === 'Administrador'
    ).length;
  };

  // Manejo de Invitación de Usuario Staff
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    const techRole = getTechnicalRoleFromCommercial(inviteStaffRole);

    const res = await inviteOrganizationMember(tenant.id, inviteEmail, techRole as any);
    setInviting(false);

    if (res.success) {
      const newInv: OrganizationInvitation = {
        id: `inv-${Date.now()}`,
        organization_id: tenant.id,
        email: inviteEmail,
        role: techRole,
        token: `inv_${Math.random().toString(36).substring(2, 10)}`,
        status: 'PENDING',
        invited_by: user?.email || 'Administrador',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000 * 24 * 7).toISOString(),
      };

      setInvitations((prev) => [newInv, ...prev]);

      // Agregar miembro como "invited" a la lista de usuarios
      const newMember: OrganizationMember = {
        id: `m-${Date.now()}`,
        organization_id: tenant.id,
        user_id: `u-pending-${Date.now()}`,
        email: inviteEmail,
        full_name: inviteName.trim() || 'Invitación pendiente',
        role: techRole,
        status: 'invited',
        created_at: new Date().toISOString(),
      };

      setMembers((prev) => [...prev, newMember]);

      // Registrar auditoría
      auditService.logAction({
        organizationId: tenant.id,
        userId: user?.id,
        userName: user?.email || 'Administrador',
        userRole: 'tenant_admin',
        action: 'USER_INVITED',
        module: 'Usuarios',
        recordIdentifier: inviteEmail,
        newValue: inviteStaffRole,
        metadata: {
          email: inviteEmail,
          commercial_role: inviteStaffRole,
          technical_role: techRole,
        },
      });

      setInviteSuccess(true);
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess(false);
        setInviteEmail('');
        setInviteName('');
        setInviteStaffRole('Operador');
        showToast('success', `Invitación enviada a ${inviteEmail} como ${inviteStaffRole}.`);
      }, 1200);
    } else {
      showToast('error', res.error || 'No se pudo enviar la invitación.');
    }
  };

  // Iniciar cambio de rol
  const handleOpenRoleModal = (member: OrganizationMember) => {
    const currentCommercial = getCommercialRoleLabel(member.role) as StaffCommercialRole;
    setTargetMember(member);
    setSelectedNewCommercialRole(currentCommercial === 'Administrador' ? 'Operador' : 'Administrador');
    setShowRoleModal(true);
  };

  // Confirmar cambio de rol con verificación de último admin y auditoría
  const handleConfirmRoleChange = async () => {
    if (!targetMember) return;

    const currentCommercial = getCommercialRoleLabel(targetMember.role);

    // Si el usuario actual es Administrador y se lo intenta degradar a Operador o Escribano
    if (currentCommercial === 'Administrador' && selectedNewCommercialRole !== 'Administrador') {
      if (getActiveAdminsCount() <= 1) {
        setShowRoleModal(false);
        setLastAdminBlockReason('Tu organización debe conservar al menos un Administrador activo.');
        setShowLastAdminBlockModal(true);
        return;
      }
    }

    setChangingRole(true);
    const newTechRole = getTechnicalRoleFromCommercial(selectedNewCommercialRole);

    // Actualizar estado local
    setMembers((prev) =>
      prev.map((m) => (m.id === targetMember.id ? { ...m, role: newTechRole } : m))
    );

    // Registrar en auditoría
    const isGrantedAdmin = selectedNewCommercialRole === 'Administrador';
    const isRevokedAdmin = currentCommercial === 'Administrador' && !isGrantedAdmin;

    await auditService.logAction({
      organizationId: tenant.id,
      userId: user?.id,
      userName: user?.email || 'Administrador',
      userRole: 'tenant_admin',
      action: isGrantedAdmin ? 'ADMIN_GRANTED' : isRevokedAdmin ? 'ADMIN_REVOKED' : 'USER_ROLE_CHANGED',
      module: 'Usuarios',
      recordIdentifier: targetMember.email || targetMember.id,
      oldValue: currentCommercial,
      newValue: selectedNewCommercialRole,
      metadata: {
        target_user_id: targetMember.user_id,
        target_email: targetMember.email,
        old_technical_role: targetMember.role,
        new_technical_role: newTechRole,
      },
    });

    setChangingRole(false);
    setShowRoleModal(false);
    showToast('success', `Rol de ${targetMember.full_name || targetMember.email} actualizado a ${selectedNewCommercialRole}.`);
    setTargetMember(null);
  };

  // Desactivar o Reactivar acceso de usuario
  const handleToggleUserStatus = async (member: OrganizationMember) => {
    const isCurrentlyActive = member.status === 'active';
    const currentCommercial = getCommercialRoleLabel(member.role);

    // Protección del último Administrador activo
    if (isCurrentlyActive && currentCommercial === 'Administrador' && getActiveAdminsCount() <= 1) {
      setLastAdminBlockReason('Tu organización debe conservar al menos un Administrador activo.');
      setShowLastAdminBlockModal(true);
      return;
    }

    const nextStatus = isCurrentlyActive ? 'disabled' : 'active';

    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus } : m))
    );

    // Audit log
    await auditService.logAction({
      organizationId: tenant.id,
      userId: user?.id,
      userName: user?.email || 'Administrador',
      userRole: 'tenant_admin',
      action: nextStatus === 'active' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      module: 'Usuarios',
      recordIdentifier: member.email || member.id,
      oldValue: member.status,
      newValue: nextStatus,
      metadata: {
        target_user_id: member.user_id,
        target_email: member.email,
      },
    });

    showToast(
      'success',
      nextStatus === 'active'
        ? `Acceso reactivado para ${member.full_name || member.email}.`
        : `Acceso desactivado para ${member.full_name || member.email}. Trazabilidad e historial conservados.`
    );
  };

  // Revocar invitación pendiente
  const handleRevokeInvitation = async (invitationId: string, email: string) => {
    setInvitations((prev) =>
      prev.map((inv) => (inv.id === invitationId ? { ...inv, status: 'REVOKED' } : inv))
    );
    setMembers((prev) => prev.filter((m) => m.email !== email || m.status !== 'invited'));

    await auditService.logAction({
      organizationId: tenant.id,
      userId: user?.id,
      userName: user?.email || 'Administrador',
      userRole: 'tenant_admin',
      action: 'USER_INVITATION_REVOKED',
      module: 'Usuarios',
      recordIdentifier: email,
      newValue: 'REVOKED',
    });

    showToast('info', `Invitación para ${email} revocada.`);
  };

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">

        {/* NOTIFICACIÓN TOAST */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-card animate-in fade-in transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : notification.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {notification.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 ml-4 font-bold">
              ×
            </button>
          </div>
        )}

        {/* ENCABEZADO DE LA PÁGINA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-[10px] font-bold text-brand-green bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
              ADMINISTRACIÓN DE ACCESOS
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy tracking-tight">
              Usuarios y permisos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Administrá las personas que trabajan en tu organización y definí qué nivel de acceso tiene cada una.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowInviteModal(true)}
            className="shadow-sm hover:shadow transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 mr-2" /> + Invitar usuario
          </Button>
        </div>

        {/* PESTAÑAS PRINCIPALES */}
        <div className="flex items-center space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'border-brand-green text-brand-green bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-navy hover:bg-slate-50 rounded-t-lg'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'roles'
                ? 'border-brand-green text-brand-green bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-navy hover:bg-slate-50 rounded-t-lg'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Roles y permisos</span>
          </button>

          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'invitations'
                ? 'border-brand-green text-brand-green bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-navy hover:bg-slate-50 rounded-t-lg'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Invitaciones ({invitations.filter((i) => i.status === 'PENDING').length})</span>
          </button>
        </div>

        {/* ============================================================================== */}
        {/* PESTAÑA 1: USUARIOS INTERNOS DE LA ORGANIZACIÓN                                */}
        {/* ============================================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Banner Informativo de Capacidad */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-navy">Equipo Interno Habilitado</h3>
                  <p className="text-[11px] text-slate-500">
                    Administradores, Operadores y Escribanos que operan dentro del Backoffice de {tenant.branding.public_name || tenant.name}.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px]">Administradores activos:</span>
                <strong className="text-purple-900 font-bold">{getActiveAdminsCount()}</strong>
              </div>
            </div>

            {/* TABLA / CARDS ADAPTATIVAS DE USUARIOS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-brand-green" />
                  <span>Cargando usuarios de la organización...</span>
                </div>
              ) : members.length === 0 ? (
                /* EMPTY STATE */
                <div className="p-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy">Aún no agregaste otros usuarios a tu organización.</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Invitá a administradores, operadores o escribanos para trabajar juntos en los expedientes y solicitudes.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="w-4 h-4 mr-1.5" /> Invitar usuario
                  </Button>
                </div>
              ) : (
                <>
                  {/* Vista Desktop (Tabla) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-5 py-3.5">Nombre / Email</th>
                          <th className="px-5 py-3.5">Rol</th>
                          <th className="px-5 py-3.5">Estado</th>
                          <th className="px-5 py-3.5">Último Acceso / Alta</th>
                          <th className="px-5 py-3.5 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {members.map((member) => {
                          const badge = getRoleBadgeStyle(member.role);
                          const isCurrentActiveAdmin =
                            member.status === 'active' && badge.label === 'Administrador';

                          return (
                            <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Nombre / Email */}
                              <td className="px-5 py-4">
                                <div className="font-bold text-navy text-sm">
                                  {member.full_name || member.email}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{member.email}</div>
                              </td>

                              {/* Rol Comercial */}
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${badge.bgClass} ${badge.textClass}`}>
                                  {badge.label}
                                </span>
                              </td>

                              {/* Estado */}
                              <td className="px-5 py-4">
                                {member.status === 'active' && (
                                  <span className="inline-flex items-center text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Activo
                                  </span>
                                )}
                                {member.status === 'invited' && (
                                  <span className="inline-flex items-center text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Invitación pendiente
                                  </span>
                                )}
                                {member.status === 'disabled' && (
                                  <span className="inline-flex items-center text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                    <UserX className="w-3.5 h-3.5 mr-1 text-rose-600" /> Acceso desactivado
                                  </span>
                                )}
                              </td>

                              {/* Fecha */}
                              <td className="px-5 py-4 text-slate-500 text-[11px]">
                                {member.last_access_at ? (
                                  <div>
                                    <span className="block font-semibold text-slate-700">
                                      {new Date(member.last_access_at).toLocaleDateString('es-UY')}
                                    </span>
                                    <span className="text-[10px] text-slate-400">Último acceso</span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="block text-slate-600">
                                      {new Date(member.created_at).toLocaleDateString('es-UY')}
                                    </span>
                                    <span className="text-[10px] text-slate-400">Fecha de alta</span>
                                  </div>
                                )}
                              </td>

                              {/* Acciones */}
                              <td className="px-5 py-4 text-right space-x-2">
                                <button
                                  onClick={() => handleOpenRoleModal(member)}
                                  className="text-navy hover:text-brand-green text-xs font-semibold hover:underline bg-slate-100 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                                >
                                  Cambiar rol
                                </button>

                                <button
                                  onClick={() => handleToggleUserStatus(member)}
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors border ${
                                    member.status === 'active'
                                      ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                  }`}
                                  title={
                                    isCurrentActiveAdmin && getActiveAdminsCount() <= 1
                                      ? 'No se puede desactivar el único Administrador activo'
                                      : ''
                                  }
                                >
                                  {member.status === 'active' ? 'Desactivar acceso' : 'Activar acceso'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista Mobile (Cards Adaptativas) */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {members.map((member) => {
                      const badge = getRoleBadgeStyle(member.role);
                      return (
                        <div key={member.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-navy text-sm">{member.full_name || member.email}</div>
                              <div className="text-xs text-slate-400 font-mono">{member.email}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badge.bgClass} ${badge.textClass}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <div>
                              {member.status === 'active' && (
                                <span className="text-emerald-700 font-bold text-[11px] flex items-center">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                                </span>
                              )}
                              {member.status === 'invited' && (
                                <span className="text-amber-600 font-bold text-[11px] flex items-center">
                                  <Clock className="w-3 h-3 mr-1" /> Pendiente
                                </span>
                              )}
                              {member.status === 'disabled' && (
                                <span className="text-rose-600 font-bold text-[11px] flex items-center">
                                  <UserX className="w-3 h-3 mr-1" /> Desactivado
                                </span>
                              )}
                            </div>

                            <div className="space-x-2">
                              <button
                                onClick={() => handleOpenRoleModal(member)}
                                className="text-xs font-semibold text-navy bg-slate-100 px-2 py-1 rounded"
                              >
                                Cambiar rol
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(member)}
                                className={`text-xs font-semibold px-2 py-1 rounded ${
                                  member.status === 'active'
                                    ? 'text-rose-700 bg-rose-50'
                                    : 'text-emerald-700 bg-emerald-50'
                                }`}
                              >
                                {member.status === 'active' ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

          </div>
        )}

        {/* ============================================================================== */}
        {/* PESTAÑA 2: ROLES Y PERMISOS (PANTALLA EXPLICATIVA Y MATRIZ)                   */}
        {/* ============================================================================== */}
        {activeTab === 'roles' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Encabezado Explicativo */}
            <div className="bg-gradient-to-r from-navy to-slate-800 text-white rounded-2xl p-6 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green bg-white/10 px-2.5 py-0.5 rounded">
                ARQUITECTURA DE PERFILES HIPOTECALY
              </span>
              <h2 className="text-xl font-bold tracking-tight">Tipos de usuario y alcance funcional</h2>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                HIPOTECALY organiza su plataforma en 5 perfiles claramente definidos para garantizar el aislamiento de responsabilidades entre el equipo interno de la organización, los solicitantes, los inversores y los profesionales jurídicos.
              </p>
            </div>

            {/* LAS 5 TARJETAS DE USUARIO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* 1. ADMINISTRADOR */}
              <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-sm space-y-3 hover:border-purple-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                    Staff Interno
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Administrador</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    “{COMMERCIAL_ROLE_DESCRIPTIONS.Administrador}”
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-700">Para quién es:</div>
                  <p>Dueño del estudio, socios, gerentes o administradores generales.</p>
                  <div className="font-bold text-slate-700 pt-1">Funciones principales:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                    <li>Acceso total al Backoffice de la organización</li>
                    <li>Gestión e invitación de usuarios internos</li>
                    <li>Configuración de branding, plantillas y WhatsApp</li>
                    <li>Consulta de auditoría y políticas de crédito</li>
                  </ul>
                </div>
              </div>

              {/* 2. OPERADOR */}
              <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm space-y-3 hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    Staff Interno
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Operador</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    “{COMMERCIAL_ROLE_DESCRIPTIONS.Operador}”
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-700">Para quién es:</div>
                  <p>Analistas de crédito, gestores operativos, asistentes de expediente.</p>
                  <div className="font-bold text-slate-700 pt-1">Funciones principales:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                    <li>Ver y actualizar expedientes y solicitudes</li>
                    <li>Solicitar y revisar documentación de clientes</li>
                    <li>Gestión de tareas, agenda y seguimiento</li>
                    <li>Sin acceso a administración de usuarios ni branding</li>
                  </ul>
                </div>
              </div>

              {/* 3. ESCRIBANO */}
              <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm space-y-3 hover:border-amber-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                    Profesional Asignado
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Escribano</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    “{COMMERCIAL_ROLE_DESCRIPTIONS.Escribano}”
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-700">Para quién es:</div>
                  <p>Escribano notarial o estudio jurídico externo encargado del cierre.</p>
                  <div className="font-bold text-slate-700 pt-1">Funciones principales:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                    <li>Acceso al Portal Escribano para expedientes asignados</li>
                    <li>Revisión de títulos y observaciones jurídicas</li>
                    <li>Coordinación y agendamiento de firmas con Google Calendar</li>
                    <li>Recepción de documentación original</li>
                  </ul>
                </div>
              </div>

              {/* 4. CLIENTE */}
              <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm space-y-3 hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    Portal Cliente
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Cliente</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    “{COMMERCIAL_ROLE_DESCRIPTIONS.Cliente}”
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-700">Para quién es:</div>
                  <p>Solicitante de financiación hipotecaria o mutuo con garantía.</p>
                  <div className="font-bold text-slate-700 pt-1">Funciones principales:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                    <li>Simulación e inicio de solicitudes de crédito</li>
                    <li>Carga de documentación y recibos</li>
                    <li>Seguimiento en tiempo real de su expediente</li>
                    <li>Sin acceso al Backoffice ni a otros clientes</li>
                  </ul>
                </div>
              </div>

              {/* 5. INVERSOR */}
              <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-sm space-y-3 hover:border-indigo-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    Portal Inversor
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Inversor</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    “{COMMERCIAL_ROLE_DESCRIPTIONS.Inversor}”
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-700">Para quién es:</div>
                  <p>Prestamistas particulares, fondos o inversores de hipotecas.</p>
                  <div className="font-bold text-slate-700 pt-1">Funciones principales:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                    <li>Acceso al Portal Inversor habilitado por la organización</li>
                    <li>Análisis de garantías y ratio LTV autorizado</li>
                    <li>Confirmación o rechazo de participación</li>
                    <li>Sin acceso al Backoffice ni a datos de otros inversores</li>
                  </ul>
                </div>
              </div>

            </div>

            {/* MATRIZ RESUMIDA DE PERMISOS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-navy">Matriz Resumida de Permisos</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Alcance de visualización y facultades operativas por cada perfil de usuario.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Aislamiento Multi-Tenant Activo
                </span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-navy font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Función / Área</th>
                      <th className="py-3 px-4 text-center text-purple-900 bg-purple-50/50">Administrador</th>
                      <th className="py-3 px-4 text-center text-blue-900 bg-blue-50/50">Operador</th>
                      <th className="py-3 px-4 text-center text-emerald-900 bg-emerald-50/50">Cliente</th>
                      <th className="py-3 px-4 text-center text-indigo-900 bg-indigo-50/50">Inversor</th>
                      <th className="py-3 px-4 text-center text-amber-900 bg-amber-50/50">Escribano</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {[
                      { func: 'Expedientes', admin: 'Todos org.', op: 'Operativos', cli: 'Propios', inv: 'Habilitados', esc: 'Asignados' },
                      { func: 'Clientes', admin: 'Sí', op: 'Sí', cli: 'Solo propio', inv: 'No', esc: 'Limitado' },
                      { func: 'Documentos', admin: 'Sí', op: 'Sí', cli: 'Propios', inv: 'Autorizados', esc: 'Asignados' },
                      { func: 'Agenda', admin: 'Sí', op: 'Sí', cli: 'Propia', inv: 'No', esc: 'Sí' },
                      { func: 'Coordinar firmas', admin: 'Sí', op: 'Sí', cli: 'Consulta', inv: 'No', esc: 'Sí' },
                      { func: 'Usuarios', admin: 'Sí', op: 'No', cli: 'No', inv: 'No', esc: 'No' },
                      { func: 'Configuración', admin: 'Sí', op: 'No', cli: 'No', inv: 'No', esc: 'No' },
                      { func: 'Inversores', admin: 'Sí', op: 'Según permiso', cli: 'No', inv: 'Propio', esc: 'No' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-navy">{row.func}</td>
                        <td className="py-3 px-4 text-center font-bold text-purple-900 bg-purple-50/30">{row.admin}</td>
                        <td className="py-3 px-4 text-center text-slate-800">{row.op}</td>
                        <td className="py-3 px-4 text-center text-slate-600">{row.cli}</td>
                        <td className="py-3 px-4 text-center text-slate-600">{row.inv}</td>
                        <td className="py-3 px-4 text-center text-amber-900 bg-amber-50/30">{row.esc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================================== */}
        {/* PESTAÑA 3: INVITACIONES DE PERSONAL PENDIENTES                                 */}
        {/* ============================================================================== */}
        {activeTab === 'invitations' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-navy">Invitaciones de Colaboradores Envisadas</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estado de los accesos enviados por correo a futuros miembros de tu organización.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
                <UserPlus className="w-4 h-4 mr-1.5" /> + Invitar usuario
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {invitations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No hay invitaciones enviadas actualmente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Email Destinatario</th>
                        <th className="px-5 py-3.5">Rol Asignado</th>
                        <th className="px-5 py-3.5">Enviado por</th>
                        <th className="px-5 py-3.5">Estado</th>
                        <th className="px-5 py-3.5">Expiración</th>
                        <th className="px-5 py-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {invitations.map((inv) => {
                        const badge = getRoleBadgeStyle(inv.role);
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="px-5 py-4 font-bold text-navy">{inv.email}</td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${badge.bgClass} ${badge.textClass}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">{inv.invited_by || 'Administrador'}</td>
                            <td className="px-5 py-4">
                              {inv.status === 'PENDING' && (
                                <span className="inline-flex items-center text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <Clock className="w-3.5 h-3.5 mr-1" /> Pendiente
                                </span>
                              )}
                              {inv.status === 'REVOKED' && (
                                <span className="inline-flex items-center text-slate-500 font-bold text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  <Slash className="w-3.5 h-3.5 mr-1" /> Revocada
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-slate-500 text-[11px]">
                              {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('es-UY') : '7 días'}
                            </td>
                            <td className="px-5 py-4 text-right">
                              {inv.status === 'PENDING' && (
                                <button
                                  onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                                  className="text-rose-600 hover:text-rose-800 text-xs font-semibold hover:underline"
                                >
                                  Revocar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ============================================================================== */}
      {/* MODAL 1: INVITAR USUARIO INTERNO DE LA ORGANIZACIÓN                            */}
      {/* ============================================================================== */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleInviteSubmit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-navy flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-brand-green" />
                Invitar usuario a la organización
              </h4>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-4 bg-emerald-50 rounded-xl text-emerald-800 text-xs flex items-center border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 shrink-0" />
                <span>Invitación registrada exitosamente. Se ha generado la notificación de acceso.</span>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {/* Nombre opcional */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre completo (Opcional)
                    </label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Ej: Esc. Ana Gómez"
                      className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs focus:border-navy focus:ring-2 focus:ring-navy/10"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Correo Electrónico <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="ejemplo@estudionova.uy"
                      className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs font-medium focus:border-navy focus:ring-2 focus:ring-navy/10"
                      required
                    />
                  </div>

                  {/* Selector de Rol comercial RESTINGUIDO a staff interno */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Rol y nivel de acceso <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={inviteStaffRole}
                      onChange={(e) => setInviteStaffRole(e.target.value as StaffCommercialRole)}
                      className="w-full h-10 px-3 border border-slate-300 rounded-xl text-xs bg-white font-bold text-navy focus:border-navy"
                    >
                      {STAFF_INVITATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Solo podés invitar colaboradores de tu equipo interno. Los Clientes e Inversiones se registran desde sus respectivos portales.
                    </p>
                  </div>

                  {/* Descripción Dinámica del Rol Seleccionado */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-navy flex items-center text-[11px]">
                      <Info className="w-3.5 h-3.5 mr-1 text-brand-green" />
                      Permisos para {inviteStaffRole}:
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      “{COMMERCIAL_ROLE_DESCRIPTIONS[inviteStaffRole]}”
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowInviteModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={inviting}>
                    {inviting ? 'Enviando...' : 'Enviar invitación'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 2: CONFIRMACIÓN DE CAMBIO DE ROL / ELEVACIÓN DE PRIVILEGIOS             */}
      {/* ============================================================================== */}
      {showRoleModal && targetMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center space-x-3 text-navy border-b border-slate-100 pb-3">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              <div>
                <h4 className="text-base font-bold">Cambiar rol de usuario</h4>
                <p className="text-xs text-slate-500">{targetMember.full_name || targetMember.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nuevo rol asignado</label>
                <select
                  value={selectedNewCommercialRole}
                  onChange={(e) => setSelectedNewCommercialRole(e.target.value as StaffCommercialRole)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-xl bg-white font-bold text-navy"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Operador">Operador</option>
                  <option value="Escribano">Escribano</option>
                </select>
              </div>

              {/* Advertencia especial si eleva privilegios a Administrador */}
              {selectedNewCommercialRole === 'Administrador' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-amber-900">
                  <div className="font-bold flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" /> Confirmación de Elevación de Privilegios
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Este usuario tendrá permisos de <strong>Administrador</strong> y podrá gestionar usuarios y configuración de la organización.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowRoleModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmRoleChange} disabled={changingRole}>
                {changingRole ? 'Guardando...' : 'Confirmar cambio'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 3: ALERTA DE BLOQUEO DE ÚLTIMO ADMINISTRADOR ACTIVO                      */}
      {/* ============================================================================== */}
      {showLastAdminBlockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in text-left">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-7 h-7 shrink-0 text-rose-600" />
              <h4 className="text-base font-bold text-navy">Acción bloqueada</h4>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-semibold leading-relaxed">
              {lastAdminBlockReason || 'Tu organización debe conservar al menos un Administrador activo.'}
            </div>

            <p className="text-xs text-slate-500">
              Para desactivar o cambiar el rol de este usuario, primero debés nombrar a otro usuario como <strong>Administrador</strong> activo.
            </p>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setShowLastAdminBlockModal(false)}>
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

    </BackofficeLayout>
  );
};
