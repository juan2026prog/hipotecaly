import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

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

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        
        {/* Header con CTA de nueva solicitud */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">
              OPERACIONES & EXPEDIENTES
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Solicitudes y Expedientes
            </h1>
            <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
              Gestión centralizada de operaciones hipotecarias y legajos crediticios.
            </p>
          </div>

          <Link to="/solicitar">
            <Button variant="primary" size="md" className="font-bold shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" /> Nueva solicitud
            </Button>
          </Link>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white p-4 rounded-card border border-slate-border shadow-xs flex flex-col md:flex-row gap-3 items-center">
          <div className="w-full md:flex-1">
            <SearchInput
              placeholder="Buscar por código HIP- o nombre del solicitante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos los estados' },
                  { value: 'draft', label: 'Borrador' },
                  { value: 'submitted', label: 'Recibida' },
                  { value: 'info_review', label: 'En análisis' },
                  { value: 'offer_available', label: 'Con propuesta' },
                  { value: 'approved', label: 'Aprobada' },
                  { value: 'rejected', label: 'Rechazada' },
                ]}
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos los deptos.' },
                  { value: 'Montevideo', label: 'Montevideo' },
                  { value: 'Canelones', label: 'Canelones' },
                  { value: 'Maldonado', label: 'Maldonado' },
                  { value: 'Colonia', label: 'Colonia' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Listado Principal */}
        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Cargando solicitudes...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FolderKanban}
                title="No se encontraron solicitudes"
                description="No existen expedientes que coincidan con los filtros de búsqueda seleccionados."
                actionLabel="Crear solicitud"
                onAction={() => window.location.assign('/solicitar')}
              />
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">ID</th>
                      <th className="py-3 px-4 font-semibold">Solicitante</th>
                      <th className="py-3 px-4 font-semibold">Propiedad</th>
                      <th className="py-3 px-4 font-semibold">Monto Solicitado</th>
                      <th className="py-3 px-4 font-semibold">LTV</th>
                      <th className="py-3 px-4 font-semibold">Estado</th>
                      <th className="py-3 px-4 text-right font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app) => {
                      const estValue = app.property?.estimated_value || 0;
                      const reqAmount = Number(app.requested_amount) || 0;
                      const ltv = estValue > 0 ? (reqAmount / estValue) * 100 : 0;
                      const borrowerName = app.borrower
                        ? `${app.borrower.first_name} ${app.borrower.last_name}`
                        : 'Borrador sin titular';

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-navy">
                            {app.public_id}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {borrowerName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 capitalize">
                            {app.property?.property_type || 'Inmueble'} · {app.property?.department || 'Uruguay'}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-navy">
                            USD {reqAmount.toLocaleString('es-UY')}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600">
                            {ltv > 0 ? `${ltv.toFixed(1)}%` : '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={app.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/app/solicitudes/${app.id}`}
                              className="text-xs font-bold text-brand-green hover:underline inline-flex items-center min-h-[36px]"
                            >
                              Abrir <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="sm:hidden divide-y divide-slate-100">
                {applications.map((app) => {
                  const estValue = app.property?.estimated_value || 0;
                  const reqAmount = Number(app.requested_amount) || 0;
                  const ltv = estValue > 0 ? (reqAmount / estValue) * 100 : 0;

                  return (
                    <Link
                      key={app.id}
                      to={`/app/solicitudes/${app.id}`}
                      className="p-4 block hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-navy block">
                            {app.public_id}
                          </span>
                          <span className="text-xs text-slate-700 font-medium mt-0.5 block">
                            {app.borrower
                              ? `${app.borrower.first_name} ${app.borrower.last_name}`
                              : 'Borrador'}
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-navy">
                          USD {reqAmount.toLocaleString('es-UY')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50 text-[11px]">
                        <span className="text-slate-500 capitalize">
                          {app.property?.property_type} · LTV {ltv.toFixed(1)}%
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
