import React, { useState, useEffect } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { Button } from '../../components/ui/Button';
import { useTenant } from '../../contexts/TenantContext';
import {
  getOrganizationMembers,
  inviteOrganizationMember,
  OrganizationMember,
} from '../../lib/tenantService';
import {
  UserPlus,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const { tenant } = useTenant();
  const [members, setMembers] = useState<OrganizationMember[]>([
    {
      id: 'm1',
      organization_id: tenant.id,
      user_id: 'u1',
      email: 'admin@hipotecaly.uy',
      full_name: 'Ignacio Notario',
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'm2',
      organization_id: tenant.id,
      user_id: 'u2',
      email: 'analista@hipotecaly.uy',
      full_name: 'Valeria Rivas',
      role: 'analyst',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ]);
  const [loading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'analyst' | 'notary' | 'viewer'>('analyst');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    getOrganizationMembers(tenant.id).then((data) => {
      if (data && data.length > 0) {
        setMembers(data);
      }
    });
  }, [tenant.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    const res = await inviteOrganizationMember(
      tenant.id,
      inviteEmail,
      inviteRole
    );
    setInviting(false);
    if (res.success) {
      setInviteSuccess(true);
      setMembers((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          organization_id: tenant.id,
          user_id: crypto.randomUUID(),
          email: inviteEmail,
          full_name: 'Pendiente de aceptación',
          role: inviteRole,
          status: 'invited',
          created_at: new Date().toISOString(),
        },
      ]);
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess(false);
        setInviteEmail('');
      }, 1500);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Administrador</span>;
      case 'analyst':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Analista de Crédito</span>;
      case 'notary':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Escribano Notarial</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Observador</span>;
    }
  };

  return (
    <BackofficeLayout title="Gestión de Usuarios y Equipo">
      <div className="space-y-6">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
              Colaboradores de la Organización
            </h2>
            <p className="text-xs sm:text-sm text-slate-muted mt-1">
              Administración de miembros con acceso al backoffice operativo, expedientes y permisos notariales.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Invitar Colaborador
          </Button>
        </div>

        {/* Card de Capacidad del Plan SaaS */}
        <div className="bg-white rounded-card p-5 border border-slate-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Plan SaaS Activo
            </span>
            <div className="text-lg font-black text-navy mt-0.5">
              Plan Professional (White-Label)
            </div>
          </div>
          <div className="text-xs text-slate-600 flex items-center space-x-4">
            <div>
              <span className="text-slate-400 block text-[10px]">Usuarios en uso</span>
              <strong className="text-navy">{members.length} de 10 permitidos</strong>
            </div>
            <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-brand-green" style={{ width: `${(members.length / 10) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Tabla de Miembros */}
        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Cargando usuarios...</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-text">
              <thead className="bg-slate-bg border-b border-slate-border font-bold text-navy uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Colaborador</th>
                  <th className="px-5 py-3.5">Rol Operativo</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5">Fecha de Alta</th>
                  <th className="px-5 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border font-medium">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-navy text-sm">{member.full_name || member.email}</div>
                      <div className="text-[11px] text-slate-400">{member.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="px-5 py-4">
                      {member.status === 'active' ? (
                        <span className="inline-flex items-center text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-600 font-bold text-[11px]">
                          <Clock className="w-3.5 h-3.5 mr-1" /> Invitado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(member.created_at).toLocaleDateString('es-UY')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-slate-400 hover:text-navy text-xs font-semibold">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* MODAL DE INVITACIÓN */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleInvite} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-floating animate-in fade-in">
            <h4 className="text-base font-bold text-navy flex items-center">
              <UserPlus className="w-4 h-4 mr-2 text-brand-green" />
              Invitar Nuevo Miembro al Equipo
            </h4>

            {inviteSuccess ? (
              <div className="p-4 bg-emerald-50 rounded-xl text-emerald-800 text-xs flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-brand-green" />
                Invitación enviada exitosamente.
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-text mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="ejemplo@estudio.com.uy"
                    className="w-full h-10 px-3 border border-slate-border rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-text mb-1">
                    Rol y Nivel de Acceso
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full h-10 px-3 border border-slate-border rounded-lg text-xs bg-white font-semibold text-navy"
                  >
                    <option value="analyst">Analista de Crédito (Revisión y tasación)</option>
                    <option value="notary">Escribano Notarial (Títulos y escrituras)</option>
                    <option value="admin">Administrador (Control total del estudio)</option>
                    <option value="viewer">Observador (Solo lectura)</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowInviteModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={inviting}>
                    {inviting ? 'Enviando...' : 'Enviar Invitación'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

    </BackofficeLayout>
  );
};
