import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { notaryService } from '../../lib/notaryService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  FileText,
  Search,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { getNotaryStatusLabel, getApplicationStatusLabel } from '../../lib/types';

export const NotaryApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();

  const isTenantPath = location.pathname.startsWith('/demo/');
  const basePath = isTenantPath ? `/demo/${tenant.slug}/notary` : '/notary';

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filterTabs: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'under_review', label: 'En estudio' },
    { id: 'observed', label: 'Observados' },
    { id: 'documents_pending', label: 'Esperando documentación' },
    { id: 'drafting', label: 'Preparando escritura' },
    { id: 'ready_to_sign', label: 'Listos para firma' },
    { id: 'signed', label: 'Firmados' },
    { id: 'completed', label: 'Finalizados' },
  ];

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await notaryService.getMyAssignedApplications(
        user?.id || 'u-test-notary',
        tenant.id,
        statusFilter,
        searchQuery
      );
      setApplications(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user?.id, tenant.id, statusFilter, searchQuery]);

  return (
    <NotaryLayout title="Mis Expedientes Notariales">
      {/* Encabezado y Explicación de Alcance */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Mis Expedientes Asignados</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acceso exclusivo a los legajos hipotecarios y notariales donde figuras como Escribana responsable o colaboradora.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>Aislamiento estricto por RLS</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ID HIP, Solicitante, Padrón o Dirección..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs font-bold text-slate-500">Filtrar estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {filterTabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs de Filtro Rápido */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-3">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Expedientes (Tabla Desktop / Cards Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <span>Cargando expedientes asignados...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No se encontraron expedientes</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No tienes expedientes asignados que coincidan con los criterios de búsqueda seleccionados.
            </p>
          </div>
        ) : (
          <>
            {/* TABLA DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Expediente</th>
                    <th className="px-4 py-3.5">Solicitante</th>
                    <th className="px-4 py-3.5">Garantía / Padrón</th>
                    <th className="px-4 py-3.5">Estado Crédito</th>
                    <th className="px-4 py-3.5">Estado Notarial</th>
                    <th className="px-4 py-3.5">Próxima Tarea / Título</th>
                    <th className="px-4 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          to={`${basePath}/expedientes/${app.id}`}
                          className="font-mono font-bold text-teal-700 hover:text-teal-900 underline"
                        >
                          {app.public_id}
                        </Link>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(app.created_at).toLocaleDateString('es-UY')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">
                          {app.borrower?.first_name} {app.borrower?.last_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {app.borrower?.id_number || 'C.I. Registrada'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-800 truncate max-w-[200px]">
                          {app.property?.address || 'Inmueble'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Padrón <span className="font-mono font-bold">{app.property?.cadastral_number}</span> · {app.property?.department}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                          {getApplicationStatusLabel(app.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            app.notary_status === 'ready_to_sign' || app.notary_status === 'signed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.notary_status === 'observed'
                              ? 'bg-rose-100 text-rose-800'
                              : app.notary_status === 'drafting'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {getNotaryStatusLabel(app.notary_status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <div className="text-[11px] font-semibold text-slate-700 truncate">
                          {app.next_task || 'Estudio de títulos en curso'}
                        </div>
                        {app.pending_documents_count > 0 && (
                          <div className="text-[10px] text-amber-600 font-bold mt-0.5 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />
                            <span>{app.pending_documents_count} documentos pendientes</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          to={`${basePath}/expedientes/${app.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm"
                        >
                          <span>Revisar</span>
                          <ChevronRight className="w-3.5 h-3.5 text-teal-400" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CARDS MOBILE */}
            <div className="md:hidden divide-y divide-slate-100">
              {applications.map((app) => (
                <div key={app.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {app.public_id}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        app.notary_status === 'ready_to_sign'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.notary_status === 'observed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {getNotaryStatusLabel(app.notary_status)}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {app.borrower?.first_name} {app.borrower?.last_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {app.property?.address} · Padrón {app.property?.cadastral_number}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700">
                    <span className="font-semibold text-slate-500 block text-[10px] uppercase">Próxima Tarea:</span>
                    {app.next_task}
                  </div>

                  <Link
                    to={`${basePath}/expedientes/${app.id}`}
                    className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    <span>Abrir estudio notarial</span>
                    <ChevronRight className="w-3.5 h-3.5 text-teal-400" />
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </NotaryLayout>
  );
};
