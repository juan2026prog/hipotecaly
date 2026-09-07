import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getApplicationsList } from '../../lib/backofficeService';
import {
  Plus,
  ChevronRight,
  FolderKanban,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTenant } from '../../contexts/TenantContext';

export const ApplicationsPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();
  const isTenantPath = location.pathname.startsWith('/demo/');
  const baseRoute = isTenantPath ? `/demo/${tenant.slug || 'estudio-nova'}/admin` : '/app';

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [propTypeFilter, setPropTypeFilter] = useState('all');

  useEffect(() => {
    async function fetchApps() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const data = await getApplicationsList({
        organizationId: tenant.id,
        useDemoMode: isDemo,
        status: statusFilter,
        department: deptFilter,
        search,
      });
      setApplications(data);
      setLoading(false);
    }
    fetchApps();
  }, [tenant.id, tenant.demo_mode, statusFilter, deptFilter, search]);

  const filteredApps = applications.filter((app) => {
    if (propTypeFilter === 'all') return true;
    return app.property?.property_type?.toLowerCase() === propTypeFilter.toLowerCase();
  });

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
              OPERACIONES & CRÉDITO
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
              Solicitudes y Expedientes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Gestión de operaciones hipotecarias, legajos notariales y porcentaje de financiación.
            </p>
          </div>

          <Link to="/solicitar">
            <Button variant="primary" size="md" className="!bg-[#102d49] hover:!bg-[#173a5e] !text-white !font-bold text-xs shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Nueva Solicitud
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center">
          <div className="w-full md:flex-1">
            <SearchInput
              placeholder="Buscar por ID, cliente o padrón..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto text-xs">
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos los estados' },
                  { value: 'draft', label: 'Borrador' },
                  { value: 'submitted', label: 'Recibida' },
                  { value: 'info_review', label: 'En revisión' },
                  { value: 'evaluation', label: 'En evaluación' },
                  { value: 'approved', label: 'Aprobada' },
                  { value: 'formalization', label: 'Formalización' },
                  { value: 'rejected', label: 'Rechazada' },
                ]}
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos los depts' },
                  { value: 'Montevideo', label: 'Montevideo' },
                  { value: 'Canelones', label: 'Canelones' },
                  { value: 'Maldonado', label: 'Maldonado' },
                  { value: 'Colonia', label: 'Colonia' },
                  { value: 'San José', label: 'San José' },
                  { value: 'Rocha', label: 'Rocha' },
                  { value: 'Otros', label: 'Otros departamentos' },
                ]}
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={propTypeFilter}
                onChange={(e) => setPropTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Tipo de garantía' },
                  { value: 'casa', label: 'Casa' },
                  { value: 'apartamento', label: 'Apartamento' },
                  { value: 'terreno', label: 'Terreno / Solar' },
                  { value: 'comercial', label: 'Local Comercial' },
                  { value: 'campo', label: 'Campo / Fracción' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Tabla / Listado */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Cargando solicitudes...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                icon={FolderKanban}
                title="No se encontraron solicitudes"
                description="No hay operaciones que coincidan con los filtros aplicados."
              />
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Expediente</th>
                      <th className="py-3 px-4">Solicitante</th>
                      <th className="py-3 px-4">Garantía Inmobiliaria</th>
                      <th className="py-3 px-4">Monto Solicitado</th>
                      <th className="py-3 px-4">Financiación</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map((app) => {
                      const estValue = app.property?.estimated_value || 240000;
                      const reqAmount = Number(app.requested_amount) || 80000;
                      const finPct = estValue > 0 ? ((reqAmount / estValue) * 100).toFixed(1) : '33.3';

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-[#102d49]">
                              {app.public_id}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {app.borrower
                                ? `${app.borrower.first_name} ${app.borrower.last_name}`
                                : 'Borrador'}
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              {app.borrower?.email || 'Sin correo asignado'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800 capitalize">
                              {app.property?.property_type || 'Inmueble'}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {app.property?.neighborhood ? `${app.property.neighborhood}, ` : ''}
                              {app.property?.department || 'Montevideo'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-extrabold text-[#102d49]">
                            USD {reqAmount.toLocaleString('es-UY')}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              {finPct}%
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Val: USD {estValue.toLocaleString('es-UY')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge status={app.status} size="sm" />
                          </td>

                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString('es-UY') : 'Hoy'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`${baseRoute}/solicitudes/${app.id}`}
                              className="inline-flex items-center text-xs font-bold text-[#102d49] hover:underline"
                            >
                              Ver detalle <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const estValue = app.property?.estimated_value || 240000;
                  const reqAmount = Number(app.requested_amount) || 80000;
                  const finPct = estValue > 0 ? ((reqAmount / estValue) * 100).toFixed(1) : '33.3';

                  return (
                    <Link
                      key={app.id}
                      to={`${baseRoute}/solicitudes/${app.id}`}
                      className="p-4 block hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-[#102d49] block">
                            {app.public_id}
                          </span>
                          <span className="text-xs text-slate-800 font-semibold mt-0.5 block">
                            {app.borrower
                              ? `${app.borrower.first_name} ${app.borrower.last_name}`
                              : 'Borrador'}
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-[#102d49]">
                          USD {reqAmount.toLocaleString('es-UY')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500 capitalize">
                          {app.property?.property_type || 'Casa'} · Financiación {finPct}%
                        </span>
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </BackofficeLayout>
  );
};
