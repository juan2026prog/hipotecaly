// ==============================================================================
// HIPOTECALY: Actividad y Bitácora de Plataforma (/admin/actividad)
// Feed en lenguaje natural, exportación CSV/JSON y vista de auditoría inmutable
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
  ChevronDown,
  Info,
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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedEventModal, setSelectedEventModal] = useState<ActivityEvent | null>(null);

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
      title: 'Didit completó una verificación de identidad',
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
      title: 'Se generó un documento para el expediente: Minuta de Compraventa',
      category: 'servicios',
      serviceName: 'Documentos y formularios',
      status: 'success',
      technicalDetails: 'DocFlow generated Minuta-NOV-00124.pdf (Hash SHA-256 verified)',
      ipAddress: '179.27.142.18',
    },
    {
      id: 'act-3',
      timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      clientName: 'HIPOTECALY Central',
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
      title: 'Se utilizó un caso de Inteligencia Artificial para lectura de documento',
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
      clientName: 'HIPOTECALY Central',
      clientSlug: 'hipotecaly',
      userDescription: 'Acceso no autorizado',
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
    {
      id: 'act-8',
      timestamp: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
      clientName: 'Estudio Nova',
      clientSlug: 'estudio-nova',
      userDescription: 'Sistema Automático',
      title: 'La solicitud HIP-2026-00124 cambió de estado a Evaluación Crediticia',
      category: 'servicios',
      serviceName: 'Solicitudes',
      status: 'success',
      technicalDetails: 'Application stage transitioned from intake to underwriting',
      ipAddress: 'Servidor interno',
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

  const exportCsv = () => {
    const headers = 'Fecha,Hora,Cliente,Usuario,Evento,Servicio,Estado,Detalle\n';
    const rows = filteredEvents
      .map((e) => {
        const d = new Date(e.timestamp);
        const date = d.toLocaleDateString('es-UY');
        const time = d.toLocaleTimeString('es-UY');
        return `"${date}","${time}","${e.clientName}","${e.userDescription}","${e.title}","${e.serviceName || ''}","${e.status}","${e.technicalDetails || ''}"`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hipotecaly_actividad_${Date.now()}.csv`);
    link.click();
    setShowExportMenu(false);
  };

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `hipotecaly_actividad_${Date.now()}.json`);
    dl.click();
    setShowExportMenu(false);
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
              <span className="text-xs text-slate-400 font-mono">REGISTRO DE EVENTOS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              Actividad
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Historial de eventos, operaciones de clientes, uso de servicios y seguridad de HIPOTECALY.
            </p>
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-[#09182C] border-[#1E3A5F] text-slate-200 hover:bg-[#152E4D] text-xs font-semibold flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar actividad</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </Button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#09182C] border border-[#152E4D] rounded-xl shadow-2xl py-1 z-30 text-xs text-left">
                <button
                  onClick={exportCsv}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-slate-200 flex items-center justify-between"
                >
                  <span>Descargar como planilla (.CSV)</span>
                  <span className="text-[10px] font-bold text-emerald-400">Recomendado</span>
                </button>
                <button
                  onClick={exportJson}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 text-slate-400 flex items-center justify-between"
                >
                  <span>Descargar técnico (.JSON)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selector de Vista */}
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
              <option value="servicios">Servicios (IA, KYC, Firma, Documentos)</option>
              <option value="clientes">Clientes y Organizaciones</option>
              <option value="seguridad">Seguridad y Permisos</option>
              <option value="admin">Administración y Acceso</option>
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
              <option value="hipotecaly">HIPOTECALY Central</option>
            </select>
          </div>
        </div>

        {/* Vista 1: Feed de Actividad en Lenguaje Humano */}
        {activeTab === 'feed' && (
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl p-8 text-center text-slate-400">
                <p className="font-semibold text-slate-300">Todavía no hay actividad registrada que coincida con los filtros seleccionados.</p>
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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

                  <div className="flex items-center space-x-3 sm:text-right shrink-0 pl-8 sm:pl-0">
                    <div className="text-[11px] text-slate-400">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="block text-[10px] text-slate-500">
                        {new Date(ev.timestamp).toLocaleDateString('es-UY')}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedEventModal(ev)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                      title="Ver detalles técnicos"
                    >
                      <Info className="w-4 h-4" />
                    </button>
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
                    <th className="py-3 px-4">Fecha y hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Evento</th>
                    <th className="py-3 px-4">Detalle técnico</th>
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

        {/* Modal de Detalles Técnicos del Evento */}
        {selectedEventModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09182C] border border-[#152E4D] rounded-2xl max-w-lg w-full p-6 space-y-4 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                <h3 className="font-bold text-base text-white">Detalles técnicos del evento</h3>
                <button onClick={() => setSelectedEventModal(null)} className="text-slate-400 hover:text-white text-lg">×</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <strong className="text-white block">{selectedEventModal.title}</strong>
                  <span className="text-slate-400">{selectedEventModal.clientName} • {selectedEventModal.userDescription}</span>
                </div>

                <div className="p-3 bg-[#071322] rounded-xl border border-[#152E4D] font-mono text-[11px] text-slate-300 space-y-1">
                  <div><strong>ID Evento:</strong> {selectedEventModal.id}</div>
                  <div><strong>Timestamp:</strong> {selectedEventModal.timestamp}</div>
                  <div><strong>IP:</strong> {selectedEventModal.ipAddress || 'Servidor'}</div>
                  <div><strong>Detalle:</strong> {selectedEventModal.technicalDetails}</div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEventModal(null)}
                  className="bg-[#071322] border-[#152E4D] text-slate-300"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </SuperAdminLayout>
  );
};
