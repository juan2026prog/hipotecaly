import React, { useState, useEffect } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { useTenant } from '../../contexts/TenantContext';
import { getAuditLogs, AuditLogEntry } from '../../lib/auditService';
import { ShieldCheck, Filter, User, Clock, Lock } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const { tenant } = useTenant();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const data = await getAuditLogs({
        organizationId: tenant.id,
        isDemoMode: isDemo,
      });
      setLogs(data);
      setLoading(false);
    }
    loadLogs();
  }, [tenant.id, tenant.demo_mode]);

  const modules = ['all', ...Array.from(new Set(logs.map((l) => l.module)))];

  const filtered = logs.filter((log) => {
    if (moduleFilter !== 'all' && log.module.toLowerCase() !== moduleFilter.toLowerCase()) return false;
    if (search) {
      const term = search.toLowerCase();
      return (
        log.user_name.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.record_identifier.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
              INTELIGENCIA & COMPLIANCE
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
              Auditoría & Trazabilidad
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro inmutable de acciones críticas en la plataforma de {tenant.name}.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-[#102d49]" />
            <span>Logs Inmutables (Solo Lectura)</span>
          </div>
        </div>

        {/* Info de seguridad */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-800">Trazabilidad y Aislamiento Multi-Tenant Activo</p>
            <p className="text-emerald-700">
              Todas las modificaciones de políticas, aranceles, documentos, firmas, usuarios y expedientes quedan auditadas de forma inmutable bajo el tenant {tenant.name}.
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Buscar por usuario, acción o expediente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-3 pr-4 rounded-lg border border-slate-300 text-xs focus:border-[#102d49]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg h-9 px-3 font-semibold text-navy bg-white"
            >
              {modules.map((m) => (
                <option key={m} value={m}>{m === 'all' ? 'Todos los módulos' : m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de auditoría */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-navy">{filtered.length} eventos registrados</span>
            <span className="text-[10px] text-slate-400 font-mono">Row Level Security Enforced</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Cargando registros de auditoría...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No hay eventos de auditoría registrados.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Las acciones operativas y de configuración realizadas en {tenant.name} se registrarán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Fecha & Hora</th>
                    <th className="py-3 px-4 font-semibold">Usuario</th>
                    <th className="py-3 px-4 font-semibold">Acción</th>
                    <th className="py-3 px-4 font-semibold">Módulo</th>
                    <th className="py-3 px-4 font-semibold">Registro / Entidad</th>
                    <th className="py-3 px-4 font-semibold">Cambio Registrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('es-UY')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-navy">{log.user_name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                            {log.user_role}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{log.action}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{log.module}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-[#102d49]">{log.record_identifier}</td>
                      <td className="py-3 px-4">
                        {log.old_value && (
                          <div className="text-[10px]">
                            <span className="text-rose-600 line-through">{log.old_value}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="text-emerald-700 font-bold">{log.new_value}</span>
                          </div>
                        )}
                        {!log.old_value && (
                          <span className="text-emerald-700 font-bold text-[10px]">{log.new_value}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </BackofficeLayout>
  );
};
