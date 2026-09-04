// ==============================================================================
// HIPOTECALY: Super Admin QA Tools Card
// Panel de control de Acceso QA / Inspección Directa para Super Administradores
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Clock,
  Building2,
  User,
  ArrowRight,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { adminQaService, QaActiveSessionInfo } from '../../lib/adminQaService';
import { getAllRegisteredTenants } from '../../lib/tenantService';

export const SuperAdminQaToolsCard: React.FC = () => {
  const [qaEnabled, setQaEnabled] = useState<boolean>(true);
  const [selectedRole, setSelectedRole] = useState<string>('borrower');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('a0000000-0000-0000-0000-000000000001');
  const [selectedDuration, setSelectedDuration] = useState<number>(8);
  const [keepOnDevice, setKeepOnDevice] = useState<boolean>(true);
  const [activeSessions, setActiveSessions] = useState<QaActiveSessionInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tenants = getAllRegisteredTenants();

  const roleOptions = [
    { value: 'borrower', label: 'Solicitante', targetPath: '/mi-cuenta', emailHint: 'qa.applicant@hipotecaly.local' },
    { value: 'analyst', label: 'Operador / Backoffice', targetPath: '/app', emailHint: 'qa.operator@hipotecaly.local' },
    { value: 'tenant_admin', label: 'Administrador de Tenant', targetPath: '/app', emailHint: 'qa.tenantadmin@hipotecaly.local' },
    { value: 'lender', label: 'Prestamista', targetPath: '/lender', emailHint: 'qa.lender@hipotecaly.local' },
    { value: 'super_admin', label: 'Super Admin', targetPath: '/platform-admin', emailHint: 'qa.superadmin@hipotecaly.local' },
  ];

  const durationOptions = [
    { value: 1, label: '1 hora' },
    { value: 4, label: '4 horas' },
    { value: 8, label: '8 horas (Recomendado)' },
    { value: 24, label: '24 horas' },
  ];

  const loadQaStatus = async () => {
    try {
      const status = await adminQaService.getStatus();
      setQaEnabled(status.enabled);
      setActiveSessions(status.activeSessions || []);
    } catch {
      // Usar defaults si es ejecución local aislada
    }
  };

  useEffect(() => {
    loadQaStatus();
  }, []);

  const handleToggleQaFeature = async () => {
    try {
      const next = !qaEnabled;
      const res = await adminQaService.toggleQaFeature(next);
      setQaEnabled(res);
      setActionMessage({
        type: 'success',
        text: `Acceso QA ${res ? 'habilitado' : 'deshabilitado'} globalmente.`,
      });
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al cambiar estado de QA.' });
    }
  };

  const handleLaunchSession = async (overrideRole?: string, overrideTenantId?: string, overridePath?: string) => {
    setLoading(true);
    setActionMessage(null);

    const role = overrideRole || selectedRole;
    const tenantId = overrideTenantId || selectedTenantId;
    const roleOpt = roleOptions.find((r) => r.value === role) || roleOptions[0];
    const path = overridePath || roleOpt.targetPath;

    try {
      await adminQaService.createSession({
        role,
        tenantId,
        durationHours: selectedDuration,
        keepOnDevice,
      });

      setActionMessage({
        type: 'success',
        text: `Sesión QA creada para ${roleOpt.label}. Redirigiendo a ${path}...`,
      });

      setTimeout(() => {
        window.location.assign(path);
      }, 300);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al crear sesión QA.' });
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await adminQaService.revokeSession(sessionId);
      await loadQaStatus();
      setActionMessage({ type: 'success', text: 'Sesión QA revocada exitosamente.' });
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Error al revocar sesión.' });
    }
  };

  const currentRoleOpt = roleOptions.find((r) => r.value === selectedRole) || roleOptions[0];

  return (
    <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-6 text-left" data-testid="qa-tools-card">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              Super Admin Tools
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              {qaEnabled ? '● Disponible' : '● Deshabilitado'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-navy tracking-tight mt-1 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-amber-600" />
            Acceso QA / Inspección Directa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingreso directo controlado a portales y roles mediante sesiones Supabase Auth reales sin bypass inseguro.
          </p>
        </div>

        {/* Master Switch de QA */}
        <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
          <span className="text-xs font-bold text-slate-700">Permitir acceso directo</span>
          <button
            type="button"
            onClick={handleToggleQaFeature}
            className={`transition-colors p-1 rounded ${qaEnabled ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            {qaEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mensajes de Estado */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 animate-fadeIn ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Formulario de Configuración de Acceso */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Entrar como */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center">
            <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Entrar como
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={!qaEnabled || loading}
            className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-navy focus:border-navy focus:bg-white transition-all"
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Tenant */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center">
            <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Tenant
          </label>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            disabled={!qaEnabled || loading}
            className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-navy focus:border-navy focus:bg-white transition-all"
          >
            <option value="a0000000-0000-0000-0000-000000000001">HIPOTECALY Central</option>
            {tenants
              .filter((t) => t.id !== 'a0000000-0000-0000-0000-000000000001')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
          </select>
        </div>

        {/* 3. Duración */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Duración
          </label>
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            disabled={!qaEnabled || loading}
            className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-navy focus:border-navy focus:bg-white transition-all"
          >
            {durationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Usuario QA Resuelto */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Usuario QA Aprovisionado
          </label>
          <div className="p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 truncate">
            {currentRoleOpt.emailHint}
          </div>
        </div>

      </div>

      {/* Checkbox de Persistencia & Botón Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
        <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={keepOnDevice}
            onChange={(e) => setKeepOnDevice(e.target.checked)}
            disabled={!qaEnabled}
            className="w-4 h-4 text-navy rounded border-slate-300 focus:ring-navy"
          />
          <span>Mantener acceso QA en este dispositivo (sin solicitar login en rutas protegidas)</span>
        </label>

        <Button
          variant="primary"
          size="md"
          disabled={!qaEnabled || loading}
          onClick={() => handleLaunchSession()}
          className="bg-navy hover:bg-slate-800 text-white font-bold text-xs shrink-0 shadow-sm"
        >
          <Zap className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : 'text-amber-400'}`} />
          Abrir portal como {currentRoleOpt.label}
        </Button>
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Accesos Rápidos Directos (1-Click)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Genera sesión Supabase y navega inmediatamente
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          <button
            type="button"
            disabled={!qaEnabled || loading}
            onClick={() => handleLaunchSession('borrower', 'a0000000-0000-0000-0000-000000000001', '/mi-cuenta')}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-navy hover:shadow-xs text-left transition-all group"
          >
            <span className="text-xs font-bold text-navy group-hover:text-brand-green flex items-center justify-between">
              Solicitante
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-green" />
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">/mi-cuenta</span>
          </button>

          <button
            type="button"
            disabled={!qaEnabled || loading}
            onClick={() => handleLaunchSession('analyst', 'a0000000-0000-0000-0000-000000000001', '/app')}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-navy hover:shadow-xs text-left transition-all group"
          >
            <span className="text-xs font-bold text-navy group-hover:text-brand-green flex items-center justify-between">
              Operador
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-green" />
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">/app</span>
          </button>

          <button
            type="button"
            disabled={!qaEnabled || loading}
            onClick={() => handleLaunchSession('lender', 'a0000000-0000-0000-0000-000000000001', '/lender')}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-navy hover:shadow-xs text-left transition-all group"
          >
            <span className="text-xs font-bold text-navy group-hover:text-brand-green flex items-center justify-between">
              Prestamista
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-green" />
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">/lender</span>
          </button>

          <button
            type="button"
            disabled={!qaEnabled || loading}
            onClick={() => handleLaunchSession('tenant_admin', 'd0000000-0000-0000-0000-000000000001', '/demo/nova/full')}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:border-navy hover:shadow-xs text-left transition-all group"
          >
            <span className="text-xs font-bold text-navy group-hover:text-brand-green flex items-center justify-between">
              Tenant NOVA
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-green" />
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">/demo/nova/full</span>
          </button>

        </div>
      </div>

      {/* Tabla de Sesiones Activas & Auditoría */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Sesiones QA Registradas & Auditoría
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={loadQaStatus}
            className="text-[11px] py-1 px-2.5 h-auto border-slate-200 text-slate-600"
          >
            <RefreshCw className="w-3 h-3 mr-1 text-slate-400" />
            Actualizar
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-2.5 px-3">Rol QA</th>
                <th className="py-2.5 px-3">Tenant</th>
                <th className="py-2.5 px-3">Inicio</th>
                <th className="py-2.5 px-3">Expira</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                    No hay sesiones QA activas registradas en este momento.
                  </td>
                </tr>
              ) : (
                activeSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-white transition-colors">
                    <td className="py-2.5 px-3 font-bold text-navy capitalize">
                      {s.role}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {s.tenant_name || s.tenant_id.slice(0, 8)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(s.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'revoked'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.status === 'active' ? '● Activa' : s.status === 'revoked' ? 'Revocada' : 'Expirada'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {s.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(s.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold hover:underline inline-flex items-center text-[11px]"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Revocar
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
  );
};
