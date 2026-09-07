// ==============================================================================
// HIPOTECALY: Actividad y Bitácora de Plataforma (/admin/actividad)
// Feed en lenguaje natural con filtros claros y vista de auditoría inmutable
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import { Button } from '../../components/ui/Button';

interface ActivityEvent {
  id: string;
  timestamp: string;
  clientName: string;
  clientSlug: string;
  userDescription: string;
  title: string;
  category: 'servicios' | 'seguridad' | 'errores' | 'clientes' | 'admin';
  serviceName?: string;
  status: 'success' | 'warning' | 'error';
  technicalDetails?: string;
  ipAddress?: string;
}

export const SuperAdminActivityPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'feed' | 'audit'>('feed');

  useEffect(() => {
    document.title = 'HIPOTECALY | Actividad';
  }, []);

  const [events] = useState<ActivityEvent[]>([
    {
      id: 'act-1',
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      clientName: 'Estudio Nova',
      clientSlug: 'estudio-nova',
      userDescription: 'Ignacio Silva (Solicitante)',
      title: 'Usuario completó validación de identidad KYC',
      category: 'servicios',
      serviceName: 'Identidad y KYC',
      status: 'success',
      technicalDetails: 'Didit Verification session didit-sess-8891 approved with 99% face match',
      ipAddress: '179.27.142.18',
    },
    {
      id: 'act-2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      clientName: 'Estudio Nova',
      clientSlug: 'estudio-nova',
      userDescription: 'Dra. Valentina Ramos (Escribana)',
      title: 'Documento generado: Minuta de Compraventa con Hipoteca',
      category: 'servicios',
      serviceName: 'Documentos',
      status: 'success',
      technicalDetails: 'DocFlow generated Minuta-NOV-00124.pdf (Hash SHA-256 verified)',
      ipAddress: '179.27.142.18',
    },
    {
      id: 'act-3',
      timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      clientName: 'Plataforma Central',
      clientSlug: 'hipotecaly',
      userDescription: 'Super Administrador',
      title: 'Se accedió mediante Ver como cliente con rol Solicitante',
      category: 'admin',
      serviceName: 'Ver como cliente',
      status: 'success',
      technicalDetails: 'QA Session generated for qa.applicant@hipotecaly.local (8h duration)',
      ipAddress: '200.40.18.52',
    },
    {
      id: 'act-4',
      timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      clientName: 'ORION Crédito',
      clientSlug: 'orion-credito',
      userDescription: 'Motor de Inteligencia Artificial',
      title: 'IA procesó expediente para tasación y OCR de cédula',
      category: 'servicios',
      serviceName: 'Inteligencia Artificial',
      status: 'success',
      technicalDetails: 'OpenAI GPT-5.6-luna extracted data with 0.98 confidence (2.3k tokens)',
      ipAddress: 'Servidor interno',
    },
    {
      id: 'act-5',
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      clientName: 'Estudio Notarial del Este',
      clientSlug: 'estudio-notarial-este',
      userDescription: 'Super Administrador',
      title: 'Se creó el cliente Estudio Notarial del Este',
      category: 'clientes',
      serviceName: 'Clientes',
      status: 'success',
      technicalDetails: 'Organization created with slug estudio-notarial-este and RLS tenant_id assigned',
      ipAddress: '200.40.18.52',
    },
    {
      id: 'act-6',
      timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      clientName: 'Plataforma Global',
      clientSlug: 'hipotecaly',
      userDescription: 'Intento externo no autorizado',
      title: 'Acceso bloqueado por reglas de seguridad y aislamiento',
      category: 'seguridad',
      serviceName: 'Seguridad técnica',
      status: 'error',
      technicalDetails: 'PostgreSQL Row-Level Security blocked cross-tenant document query',
      ipAddress: '45.134.140.2',
    },
    {
      id: 'act-7',
      timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      clientName: 'Estudio Nova',
      clientSlug: 'estudio-nova',
      userDescription: 'Mesa de Operaciones',
      title: 'Firma completada con certificado digital',
      category: 'servicios',
      serviceName: 'Firma Digital',
      status: 'success',
      technicalDetails: 'Firma.gub.uy webhook notification verified and applied to mortgage #102',
      ipAddress: '186.54.210.4',
    },
  ]);

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.userDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.serviceName && ev.serviceName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || ev.category === selectedCategory;
    const matchesClient = selectedClient === 'all' || ev.clientSlug === selectedClient;

    return matchesSearch && matchesCat && matchesClient;
  });

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `hipotecaly_actividad_${Date.now()}.json`);
    dl.click();
  };

  return (
    <SuperAdminLayout title="Actividad" activeSection="actividad">
      <div className="space-y-8 max-w-7xl mx-auto text-left">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#152E4D] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                HISTORIAL DEL SISTEMA
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">BITÁCORA EN TIEMPO REAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Actividad
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Registro de eventos, operaciones de clientes, uso de servicios y auditoría de seguridad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={exportJson}
              className="bg-[#09182C] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Exportar registro JSON
            </Button>
          </div>
        </div>

        {/* Selector de Vista: Feed Humano vs Auditoría Técnica */}
        <div className="flex border-b border-[#152E4D] space-x-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 ${
              activeTab === 'feed'
                ? 'border-emerald-500 text-emerald-400 bg-[#09182C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Actividad reciente</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center space-x-2 ${
              activeTab === 'audit'
                ? 'border-emerald-500 text-emerald-400 bg-[#09182C]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Auditoría técnica detallada</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-[#09182C] p-4 rounded-xl border border-[#152E4D] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por evento, usuario o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Todas las categorías</option>
              <option value="servicios">Servicios (IA, KYC, Firma)</option>
              <option value="clientes">Clientes y Organizaciones</option>
              <option value="seguridad">Seguridad y Permisos</option>
              <option value="admin">Administración y QA</option>
            </select>
          </div>

          <div>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full py-2 px-3 bg-[#071322] border border-[#152E4D] rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Todos los clientes</option>
              <option value="estudio-nova">Estudio Nova</option>
              <option value="orion-credito">ORION Crédito</option>
              <option value="estudio-notarial-este">Estudio Notarial del Este</option>
              <option value="hipotecaly">Plataforma Central</option>
            </select>
          </div>
        </div>

        {/* Vista 1: Feed de Actividad en Lenguaje Humano */}
        {activeTab === 'feed' && (
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-8 text-center text-slate-400">
                No se encontraron eventos que coincidan con los filtros seleccionados.
              </div>
            ) : (
              filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 bg-[#09182C] border border-[#152E4D] rounded-xl hover:border-[#1E3A5F] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="mt-0.5">
                      {ev.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : ev.status === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <strong className="text-white text-xs sm:text-sm font-bold">{ev.title}</strong>
                        {ev.serviceName && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {ev.serviceName}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center space-x-2">
                        <span className="font-semibold text-slate-300">{ev.clientName}</span>
                        <span>•</span>
                        <span>{ev.userDescription}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 font-mono text-[11px] text-slate-400 pl-8 sm:pl-0">
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="block text-[10px] text-slate-500">
                      {new Date(ev.timestamp).toLocaleDateString('es-UY')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Vista 2: Tabla de Auditoría Técnica Detallada */}
        {activeTab === 'audit' && (
          <div className="bg-[#09182C] rounded-xl border border-[#152E4D] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#071322] text-slate-400 font-mono border-b border-[#152E4D]">
                  <tr>
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Evento</th>
                    <th className="py-3 px-4">Detalle Técnico</th>
                    <th className="py-3 px-4">IP</th>
                    <th className="py-3 px-4 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#152E4D]">
                  {filteredEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleString('es-UY', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">{ev.clientName}</td>
                      <td className="py-3 px-4 text-slate-300 text-[11px]">{ev.userDescription}</td>
                      <td className="py-3 px-4 font-semibold text-white">{ev.title}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[10px] max-w-xs truncate" title={ev.technicalDetails}>
                        {ev.technicalDetails}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{ev.ipAddress || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        {ev.status === 'success' ? (
                          <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                            Bloqueado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </SuperAdminLayout>
  );
};
