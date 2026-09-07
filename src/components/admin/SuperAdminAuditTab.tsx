import React, { useState } from 'react';
import { Activity, Search, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface AuditLogItem {
  id: string;
  timestamp: string;
  tenantName: string;
  tenantSlug: string;
  userEmail: string;
  action: string;
  module: string;
  targetObject: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'denied';
  details?: string;
}

export const SuperAdminAuditTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [auditLogs] = useState<AuditLogItem[]>([
    {
      id: 'log-001',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      tenantName: 'Estudio Nova',
      tenantSlug: 'estudio-nova',
      userEmail: 'operaciones@estudionova.uy',
      action: 'Documento generado',
      module: 'DOCFLOW',
      targetObject: 'Solicitud-Credito-HPT-00124.pdf',
      ipAddress: '179.27.142.18',
      status: 'success',
      details: 'Formulario de solicitud oficial generado con firma digital preparada',
    },
    {
      id: 'log-002',
      timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      tenantName: 'Estudio Nova',
      tenantSlug: 'estudio-nova',
      userEmail: 'analista@estudionova.uy',
      action: 'Valuación preliminar calculada',
      module: 'TASACIONES',
      targetObject: 'Inmueble Carrasco (Padrón 4129)',
      ipAddress: '179.27.142.18',
      status: 'success',
      details: 'Valor preliminar estimado: USD 240.000 (33.3% financiado)',
    },
    {
      id: 'log-003',
      timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      tenantName: 'Estudio Nova',
      tenantSlug: 'estudio-nova',
      userEmail: 'qa@hipotecaly.uy',
      action: 'Sesión QA iniciada',
      module: 'QA_SYSTEM',
      targetObject: 'Rol: tenant_admin',
      ipAddress: '200.40.18.52',
      status: 'success',
      details: 'Auditoría interna de permisos multi-tenant ejecutada sin bypass',
    },
    {
      id: 'log-004',
      timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      tenantName: 'ORION Crédito Inmobiliario',
      tenantSlug: 'orion-credito',
      userEmail: 'admin@orioncredito.uy',
      action: 'Módulo actualizado',
      module: 'TENANT_CONFIG',
      targetObject: 'investor_portal_enabled = true',
      ipAddress: '167.57.88.10',
      status: 'success',
      details: 'Habilitación de red privada de inversores en caliente',
    },
    {
      id: 'log-005',
      timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
      tenantName: 'Estudio Nova',
      tenantSlug: 'estudio-nova',
      userEmail: 'inversor@privado.uy',
      action: 'Propuesta de financiación emitida',
      module: 'INVERSORES',
      targetObject: 'Operación NOV-2026-00089',
      ipAddress: '186.54.210.4',
      status: 'success',
      details: 'Propuesta emitida por USD 100.000 a tasa 11.5% anual',
    },
    {
      id: 'log-006',
      timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      tenantName: 'Plataforma Global',
      tenantSlug: 'global',
      userEmail: 'security-probe@external',
      action: 'Acceso denegado por RLS',
      module: 'SECURITY_AUTH',
      targetObject: 'Cross-Tenant Document Read',
      ipAddress: '45.134.140.2',
      status: 'denied',
      details: 'PostgreSQL Row-Level Security bloqueó intento de lectura sin tenant_id coincidente',
    },
  ]);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetObject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTenant = selectedTenant === 'all' || log.tenantSlug === selectedTenant;
    const matchesModule = selectedModule === 'all' || log.module === selectedModule;
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;

    return matchesSearch && matchesTenant && matchesModule && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#152E4D] pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <Activity className="w-5 h-5 mr-2 text-emerald-400" />
            Registro Central de Auditoría
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Trazabilidad inmutable de eventos sensibles, operaciones de tenants y accesos de plataforma.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute('href', dataStr);
            dlAnchorElem.setAttribute('download', `hipotecaly_audit_logs_${Date.now()}.json`);
            dlAnchorElem.click();
          }}
          className="bg-[#09182C] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Exportar Auditoría JSON
        </Button>
      </div>

      <div className="bg-[#09182C] p-4 rounded-xl border border-[#152E4D] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción, objeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="w-full py-2 px-3 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Todos los Tenants</option>
            <option value="estudio-nova">Estudio Nova</option>
            <option value="orion-credito">ORION Crédito</option>
            <option value="global">Plataforma Global</option>
          </select>
        </div>

        <div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full py-2 px-3 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Todos los Módulos</option>
            <option value="DOCFLOW">DocFlow</option>
            <option value="TASACIONES">Tasaciones</option>
            <option value="INVERSORES">Inversores</option>
            <option value="QA_SYSTEM">QA & Acceso</option>
            <option value="TENANT_CONFIG">Configuración</option>
            <option value="SECURITY_AUTH">Seguridad & RLS</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="success">Completado Exitoso</option>
            <option value="warning">Advertencia</option>
            <option value="denied">Bloqueado / Denegado</option>
          </select>
        </div>
      </div>

      <div className="bg-[#09182C] rounded-xl border border-[#152E4D] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#071322] text-slate-400 font-mono border-b border-[#152E4D]">
              <tr>
                <th className="py-3 px-4 font-semibold">Fecha / Hora</th>
                <th className="py-3 px-4 font-semibold">Tenant</th>
                <th className="py-3 px-4 font-semibold">Usuario</th>
                <th className="py-3 px-4 font-semibold">Acción</th>
                <th className="py-3 px-4 font-semibold">Módulo</th>
                <th className="py-3 px-4 font-semibold">Objeto / Destino</th>
                <th className="py-3 px-4 font-semibold">IP</th>
                <th className="py-3 px-4 text-right font-semibold">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152E4D]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron registros de auditoría que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('es-UY', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-200">{log.tenantName}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{log.userEmail}</td>
                    <td className="py-3 px-4 font-semibold text-white">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 truncate max-w-[180px]" title={log.targetObject}>
                      {log.targetObject}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{log.ipAddress}</td>
                    <td className="py-3 px-4 text-right">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                        </span>
                      ) : log.status === 'denied' ? (
                        <span className="inline-flex items-center text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <AlertCircle className="w-3 h-3 mr-1" /> Denegado
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <AlertCircle className="w-3 h-3 mr-1" /> Warning
                        </span>
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
