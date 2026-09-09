// ==============================================================================
// HIPOTECALY: Ver como cliente (/admin/ver-como-cliente)
// Flujo ultra simple de 3 pasos para comprobar qué ve cualquier usuario
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Building2,
  ShieldCheck,
  Trash2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { Button } from '../../components/ui/Button';
import { adminQaService, QaActiveSessionInfo } from '../../lib/adminQaService';
import { getAllRegisteredTenants, Tenant } from '../../lib/tenantService';

export const SuperAdminImpersonatePage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('a0000000-0000-0000-0000-000000000001');
  const [selectedRole, setSelectedRole] = useState<string>('borrower');
  
  // Opciones avanzadas colapsables
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(8);
  const [keepOnDevice, setKeepOnDevice] = useState<boolean>(true);
  
  // Sesiones activas y estado
  const [activeSessions, setActiveSessions] = useState<QaActiveSessionInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const roles = [
    {
      id: 'borrower',
      title: 'Solicitante',
      desc: 'Comprueba el portal donde el solicitante pide su préstamo y sube documentación.',
      targetPath: '/mi-cuenta',
      email: 'qa.applicant@hipotecaly.local',
    },
    {
      id: 'analyst',
      title: 'Operador',
      desc: 'Comprueba la bandeja de trabajo de los operadores para revisar expedientes.',
      targetPath: '/demo/estudio-nova/admin',
      email: 'qa.operator@hipotecaly.local',
    },
    {
      id: 'notary',
      title: 'Escribano',
      desc: 'Comprueba el área notarial para revisión de títulos y minutas.',
      targetPath: '/demo/estudio-nova/admin/documentos',
      email: 'qa.notary@hipotecaly.local',
    },
    {
      id: 'lender',
      title: 'Prestamista',
      desc: 'Comprueba el portal privado de los inversores para evaluar oportunidades.',
      targetPath: '/lender',
      email: 'qa.lender@hipotecaly.local',
    },
    {
      id: 'tenant_admin',
      title: 'Administrador del cliente',
      desc: 'Comprueba el panel del administrador del estudio o financiera.',
      targetPath: '/demo/estudio-nova/admin',
      email: 'qa.tenantadmin@hipotecaly.local',
    },
  ];

  const loadSessions = async () => {
    try {
      const status = await adminQaService.getStatus();
      setActiveSessions(status.activeSessions || []);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    document.title = 'HIPOTECALY | Ver como cliente';
    const list = getAllRegisteredTenants();
    setTenants(list);
    loadSessions();
  }, []);

  const handleLaunch = async () => {
    setLoading(true);
    setStatusMessage(null);

    const roleObj = roles.find((r) => r.id === selectedRole) || roles[0];
    const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
    
    // Si es un cliente con marca y rol específico, dirigir a su portal correspondiente
    let target = roleObj.targetPath;
    if (selectedTenant && selectedTenant.slug !== 'hipotecaly') {
      if (selectedRole === 'borrower') target = `/demo/${selectedTenant.slug}/cliente`;
      if (selectedRole === 'tenant_admin' || selectedRole === 'analyst') target = `/demo/${selectedTenant.slug}/admin`;
    }

    try {
      await adminQaService.createSession({
        role: selectedRole,
        tenantId: selectedTenantId,
        durationHours: selectedDuration,
        keepOnDevice,
      });

      setStatusMessage({
        type: 'success',
        text: `Iniciando acceso seguro como ${roleObj.title}...`,
      });

      setTimeout(() => {
        window.location.assign(target);
      }, 400);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'No fue posible iniciar el acceso de inspección.',
      });
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await adminQaService.revokeSession(id);
      await loadSessions();
      setStatusMessage({ type: 'success', text: 'Acceso revocado exitosamente.' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'No se pudo revocar el acceso.' });
    }
  };

  const currentRole = roles.find((r) => r.id === selectedRole) || roles[0];

  return (
    <SuperAdminLayout title="Ver como cliente" activeSection="impersonate">
      <div className="space-y-8 max-w-5xl mx-auto text-left">
        
        {/* Encabezado */}
        <div className="border-b border-[#152E4D] pb-5">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              INSPECCIÓN EN VIVO
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-mono">ACCESO CONTROLADO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center">
            <UserCheck className="w-7 h-7 mr-3 text-emerald-400" />
            Ver como cliente
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Permite comprobar exactamente qué ve un usuario dentro de HIPOTECALY.
          </p>
        </div>

        {/* Notificación de feedback */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Flujo Principal en 3 Pasos */}
        <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-6 sm:p-8 shadow-lg space-y-7">
          
          {/* PASO 1: ELEGIR CLIENTE */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                Elegir cliente
              </h2>
            </div>

            <div className="max-w-md pl-8">
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#071322] border border-[#152E4D] rounded-xl text-slate-200 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="a0000000-0000-0000-0000-000000000001">HIPOTECALY Central</option>
                  {tenants
                    .filter((t) => t.id !== 'a0000000-0000-0000-0000-000000000001')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.custom_domain || t.slug})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* PASO 2: ELEGIR TIPO DE USUARIO */}
          <div className="space-y-3 pt-4 border-t border-[#152E4D]">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                Elegir tipo de usuario
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-8">
              {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                        : 'bg-[#071322] border-[#152E4D] text-slate-300 hover:border-slate-600 hover:bg-[#071322]/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className={`text-xs ${isSelected ? 'text-emerald-300 font-black' : 'text-slate-200'}`}>
                        {role.title}
                      </strong>
                      <span
                        className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-emerald-400 bg-emerald-400' : 'border-slate-500'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      {role.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PASO 3: ENTRAR COMO ESTE USUARIO */}
          <div className="space-y-3 pt-4 border-t border-[#152E4D] pl-8">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                Entrar como este usuario
              </h2>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                Se abrirá la plataforma exactamente con la vista y permisos de <strong className="text-emerald-400">{currentRole.title}</strong>.
              </p>

              <Button
                variant="primary"
                size="md"
                disabled={loading}
                onClick={handleLaunch}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm px-6 py-3 shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <span>{loading ? 'Preparando vista...' : 'Entrar como este usuario →'}</span>
              </Button>
            </div>
          </div>

          {/* Nota de Seguridad */}
          <div className="p-3.5 bg-[#071322] rounded-xl border border-[#152E4D] text-xs text-slate-400 flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Todos los accesos de inspección quedan registrados por seguridad.
            </span>
          </div>

          {/* Sección Colapsable: Opciones Avanzadas */}
          <div className="border-t border-[#152E4D] pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <Sliders className="w-3.5 h-3.5 mr-1" />
              <span>{showAdvanced ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 rounded-xl bg-[#071322] border border-[#152E4D] space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">Duración del acceso:</label>
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(Number(e.target.value))}
                      className="w-full p-2 bg-[#09182C] border border-[#152E4D] rounded-lg text-slate-200 text-xs"
                    >
                      <option value={1}>1 hora</option>
                      <option value={4}>4 horas</option>
                      <option value={8}>8 horas (Recomendado)</option>
                      <option value={24}>24 horas</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">Usuario asignado para inspección:</label>
                    <div className="p-2 bg-[#09182C] border border-[#152E4D] rounded-lg font-mono text-slate-300 text-xs truncate">
                      {currentRole.email}
                    </div>
                  </div>
                </div>

                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={keepOnDevice}
                    onChange={(e) => setKeepOnDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                  <span>Mantener acceso en este dispositivo sin solicitar contraseña nuevamente</span>
                </label>

                {/* Tabla de Sesiones Activas */}
                <div className="pt-3 border-t border-[#152E4D] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Accesos activos registrados</span>
                    <button onClick={loadSessions} className="text-[11px] text-emerald-400 hover:underline flex items-center">
                      <RefreshCw className="w-3 h-3 mr-1" /> Actualizar
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-[#152E4D] text-slate-400">
                          <th className="py-2">Tipo de usuario</th>
                          <th className="py-2">Inicio</th>
                          <th className="py-2">Expira</th>
                          <th className="py-2 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#152E4D]">
                        {activeSessions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-3 text-slate-500 italic text-center">
                              No hay accesos de inspección activos en este momento.
                            </td>
                          </tr>
                        ) : (
                          activeSessions.map((s) => (
                            <tr key={s.id}>
                              <td className="py-2 font-bold text-white capitalize">{s.role}</td>
                              <td className="py-2 text-slate-400">
                                {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2 text-slate-400">
                                {new Date(s.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2 text-right">
                                {s.status === 'active' && (
                                  <button
                                    onClick={() => handleRevoke(s.id)}
                                    className="text-rose-400 hover:underline inline-flex items-center font-bold"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" /> Revocar acceso
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </SuperAdminLayout>
  );
};
