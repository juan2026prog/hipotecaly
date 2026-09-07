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
    {
      id: 'm3',
      organization_id: tenant.id,
      user_id: 'u-test-notary',
      email: 'escribano@hipotecaly.uy',
      full_name: 'Esc. María Pérez Morales',
      role: 'notary',
      status: 'active',
      created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    },
  ]);
  const [loading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<
    'admin' | 'analyst' | 'notary' | 'appraiser' | 'operations' | 'auditor' | 'viewer'
  >('analyst');
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
      inviteRole as any
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
          role: inviteRole as any,
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
      case 'appraiser':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">Tasador Oficial</span>;
      case 'operations':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">Operaciones</span>;
      case 'auditor':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Auditor / Compliance</span>;
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

        {/* Matriz de Permisos RBAC */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-navy">Matriz de Permisos por Rol (RBAC)</h3>
              <p className="text-[11px] text-slate-500">Privilegios y accesos asignados a cada perfil dentro de la organización.</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Control Granular Activo
            </span>
          </div>
          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Permiso / Capacidad</th>
                  <th className="py-2.5 px-3 text-center">Admin</th>
                  <th className="py-2.5 px-3 text-center">Analista</th>
                  <th className="py-2.5 px-3 text-center">Escribano</th>
                  <th className="py-2.5 px-3 text-center">Tasador</th>
                  <th className="py-2.5 px-3 text-center">Operaciones</th>
                  <th className="py-2.5 px-3 text-center">Auditor</th>
                  <th className="py-2.5 px-3 text-center">Observador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {[
                  { name: 'Ver solicitudes y expedientes', roles: [true, true, true, true, true, true, true] },
                  { name: 'Ver datos personales (PII / KYC)', roles: [true, true, true, false, true, true, false] },
                  { name: 'Editar datos de expediente', roles: [true, true, false, false, true, false, false] },
                  { name: 'Aprobar documentos y recaudos', roles: [true, true, true, false, false, false, false] },
                  { name: 'Asignar / Aprobar tasaciones', roles: [true, true, false, true, false, false, false] },
                  { name: 'Generar minutas y contratos', roles: [true, false, true, false, false, false, false] },
                  { name: 'Revelar identidad a inversor', roles: [true, false, false, false, false, false, false] },
                  { name: 'Modificar políticas White Label', roles: [true, false, false, false, false, false, false] },
                  { name: 'Ver registro de auditoría', roles: [true, false, false, false, false, true, false] },
                  { name: 'Gestionar usuarios y roles', roles: [true, false, false, false, false, false, false] },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 font-sans">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{row.name}</td>
                    {row.roles.map((has, rIdx) => (
                      <td key={rIdx} className="py-2.5 px-3 text-center">
                        {has ? (
                          <span className="inline-block text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="inline-block text-slate-300 font-light">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    <option value="admin">Administrador (Control total de la organización)</option>
                    <option value="analyst">Analista de Crédito (Revisión de riesgo e ingresos)</option>
                    <option value="notary">Escribano Notarial (Títulos, minutas y firmas)</option>
                    <option value="appraiser">Tasador Oficial (Peritaje y valuaciones)</option>
                    <option value="operations">Operaciones (Seguimiento y recaudos)</option>
                    <option value="auditor">Auditor / Compliance (Solo auditoría y trazabilidad)</option>
                    <option value="viewer">Observador (Solo lectura general)</option>
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
