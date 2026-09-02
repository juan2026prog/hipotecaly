import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getApplicationsList } from '../../lib/backofficeService';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  Home,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    async function fetchApps() {
      setLoading(true);
      const data = await getApplicationsList({
        status: statusFilter,
        department: deptFilter,
        search,
      });
      setApplications(data);
      setLoading(false);
    }
    fetchApps();
  }, [statusFilter, deptFilter, search]);

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        
        {/* Header con CTA de nueva solicitud */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Solicitudes y Expedientes
            </h1>
            <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
              Gestión centralizada de operaciones hipotecarias.
            </p>
          </div>

          <Link to="/solicitar">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5" /> Nueva Solicitud
            </Button>
          </Link>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-border shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código HIP- o nombre del solicitante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-btn border border-slate-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Estado:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-btn border border-slate-border text-xs bg-white text-slate-text font-medium"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="submitted">Enviada</option>
              <option value="info_review">En análisis documental</option>
              <option value="property_analysis">Análisis de propiedad</option>
              <option value="offer_available">Con propuesta</option>
              <option value="approved">Aprobada</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-btn border border-slate-border text-xs bg-white text-slate-text font-medium"
            >
              <option value="all">Todos los departamentos</option>
              <option value="Montevideo">Montevideo</option>
              <option value="Canelones">Canelones</option>
              <option value="Maldonado">Maldonado</option>
              <option value="Colonia">Colonia</option>
            </select>
          </div>
        </div>

        {/* Listado Principal */}
        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Cargando solicitudes...
            </div>
          ) : applications.length === 0 ? (
            /* Empty State (Regla 61) */
            <div className="p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Home className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-navy">Todavía no hay solicitudes</h3>
                <p className="text-xs text-slate-muted max-w-sm mx-auto">
                  No se encontraron expedientes con los criterios seleccionados.
                </p>
              </div>
              <Link to="/solicitar">
                <Button variant="primary" size="md">
                  Crear solicitud
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              {/* Desktop Table (Regla 37) */}
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
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 capitalize">
                              {app.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/app/solicitudes/${app.id}`}
                              className="text-xs font-bold text-brand-green hover:underline inline-flex items-center"
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

              {/* Mobile Card List (Regla 37) */}
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
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800">
                          {app.status.replace('_', ' ')}
                        </span>
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
