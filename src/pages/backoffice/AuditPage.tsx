import React, { useState } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { useTenant } from '../../contexts/TenantContext';
import { ShieldCheck, Filter, User } from 'lucide-react';

const DEMO_AUDIT_LOGS = [
  { id: 'al-1', user: 'Valeria Rivas', action: 'Cambio de estado de expediente', module: 'Solicitudes', record: 'HPT-2026-00124', old_value: 'info_review', new_value: 'evaluation', timestamp: '2026-09-07T14:32:00Z', ip: '192.168.1.x' },
  { id: 'al-2', user: 'Ignacio Notario (Admin)', action: 'Modificación tasa de interés base', module: 'White Label', record: 'Política v4', old_value: '11.5%', new_value: '12%', timestamp: '2026-09-07T11:10:00Z', ip: '192.168.1.x' },
  { id: 'al-3', user: 'Sistema (DocFlow)', action: 'Documento aprobado', module: 'Documentos', record: 'Cédula Identidad — HPT-2026-00124', old_value: 'in_review', new_value: 'approved', timestamp: '2026-09-07T13:15:00Z', ip: 'Sistema' },
  { id: 'al-4', user: 'Esc. María Pérez Morales', action: 'Firma electrónica completada', module: 'Firma', record: 'Minuta NOV-2026-00089', old_value: 'pending', new_value: 'signed', timestamp: '2026-09-06T16:45:00Z', ip: '192.168.1.x' },
  { id: 'al-5', user: 'Valeria Rivas', action: 'Revelación de identidad a inversor', module: 'Inversores', record: 'HPT-2026-00124 — Inversor #INV-0042', old_value: 'anónimo', new_value: 'revelado', timestamp: '2026-09-06T10:20:00Z', ip: '192.168.1.x' },
  { id: 'al-6', user: 'Ignacio Notario (Admin)', action: 'Invitación de usuario enviada', module: 'Usuarios', record: 'nuevo.operador@novacredito.uy', old_value: null, new_value: 'invited', timestamp: '2026-09-05T09:05:00Z', ip: '192.168.1.x' },
];

export const AuditPage: React.FC = () => {
  const { tenant } = useTenant();
  const [moduleFilter, setModuleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const modules = ['all', ...Array.from(new Set(DEMO_AUDIT_LOGS.map((l) => l.module)))];

  const filtered = DEMO_AUDIT_LOGS.filter((log) => {
    if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      return (
        log.user.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.record.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
            INTELIGENCIA & COMPLIANCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">Auditoría & Trazabilidad</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro inmutable de acciones críticas en la plataforma de {tenant.name}.
          </p>
        </div>

        {/* Info de seguridad */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-800">Registro de Auditoría Activo</p>
            <p className="text-emerald-700">Todas las acciones sobre expedientes, políticas, documentos, firmas, usuarios y configuraciones quedan registradas con trazabilidad completa.</p>
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
          <div className="p-4 border-b border-slate-100">
            <span className="text-xs font-bold text-navy">{filtered.length} registros de auditoría</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Fecha & Hora</th>
                  <th className="py-3 px-4 font-semibold">Usuario</th>
                  <th className="py-3 px-4 font-semibold">Acción</th>
                  <th className="py-3 px-4 font-semibold">Módulo</th>
                  <th className="py-3 px-4 font-semibold">Registro</th>
                  <th className="py-3 px-4 font-semibold">Cambio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('es-UY')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-navy">{log.user}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{log.module}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#102d49]">{log.record}</td>
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
          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">No se encontraron registros con los filtros aplicados.</div>
          )}
        </div>
      </div>
    </BackofficeLayout>
  );
};
