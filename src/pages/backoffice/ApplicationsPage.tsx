import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getApplicationsList } from '../../lib/backofficeService';
import {
  Plus,
  ChevronRight,
  FolderKanban,
  AlertCircle,
  Clock,
  User,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get('stage');

  const isTenantPath = location.pathname.startsWith('/demo/');
  const baseRoute = isTenantPath ? `/demo/${tenant.slug || 'estudio-nova'}/admin` : '/app';

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(stageParam || 'all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [propTypeFilter, setPropTypeFilter] = useState('all');

  useEffect(() => {
    if (stageParam) {
      setStatusFilter(stageParam);
    }
  }, [stageParam]);

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

  const getNextActionInfo = (app: any) => {
    switch (app.status) {
      case 'draft':
        return { action: 'Esperando cliente', alert: 'Borrador incompleto', color: 'text-slate-600 bg-slate-100', responsible: 'Solicitante' };
      case 'submitted':
        return { action: 'Revisar documento', alert: 'Doc recién subido', color: 'text-amber-800 bg-amber-50', responsible: 'Mesa de Crédito' };
      case 'info_review':
        return { action: 'Revisar evaluación', alert: 'Recaudos en revisión', color: 'text-blue-800 bg-blue-50', responsible: 'Analista de Riesgo' };
      case 'property_analysis':
        return { action: 'Asignar tasador', alert: 'Peritaje pendiente', color: 'text-purple-800 bg-purple-50', responsible: 'Perito Tasador' };
      case 'evaluation':
        return { action: 'Revisar evaluación', alert: 'Score IA disponible', color: 'text-indigo-800 bg-indigo-50', responsible: 'Oficial de Crédito' };
      case 'offer_available':
        return { action: 'Preparar condiciones', alert: 'Propuesta lista', color: 'text-teal-800 bg-teal-50', responsible: 'Oficial de Crédito' };
      case 'formalization':
        return { action: 'Enviar a firma', alert: 'Minuta redactada', color: 'text-emerald-800 bg-emerald-50', responsible: 'Escribanía Notarial' };
      case 'approved':
        return { action: 'Coordinar desembolso', alert: 'Escritura completada', color: 'text-emerald-800 bg-emerald-100', responsible: 'Administración' };
      case 'rejected':
        return { action: 'Archivar expediente', alert: 'No elegible', color: 'text-rose-800 bg-rose-50', responsible: 'Mesa de Crédito' };
      default:
        return { action: 'Revisar expediente', alert: 'En proceso', color: 'text-slate-700 bg-slate-100', responsible: 'Operador' };
    }
  };

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
              OPERACIONES & CRÉDITO
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
              Listado Operativo de Solicitudes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Gestión y resolución rápida de expedientes con asignación de próxima acción y porcentaje de financiación.
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
              placeholder="Buscar por ID, cliente, cédula o padrón..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto text-xs">
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  if (e.target.value === 'all') {
                    searchParams.delete('stage');
                  } else {
                    searchParams.set('stage', e.target.value);
                  }
                  setSearchParams(searchParams);
                }}
                options={[
                  { value: 'all', label: 'Todas las etapas' },
                  { value: 'draft', label: 'Borrador' },
                  { value: 'submitted', label: '1. Solicitud recibida' },
                  { value: 'info_review', label: '2. Info en revisión' },
                  { value: 'property_analysis', label: '3. Propiedad y docs' },
                  { value: 'evaluation', label: '4. Evaluación' },
                  { value: 'offer_available', label: '5. Condiciones' },
                  { value: 'formalization', label: '6. Formalización' },
                  { value: 'approved', label: '7. Finalizada / Aprobada' },
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
              <div className="w-6 h-6 border-2 border-[#102d49] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
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
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Monto</th>
                      <th className="py-3.5 px-4">Valor Propiedad</th>
                      <th className="py-3.5 px-4">Porcentaje de Financiación</th>
                      <th className="py-3.5 px-4">Etapa</th>
                      <th className="py-3.5 px-4">Responsable</th>
                      <th className="py-3.5 px-4 bg-amber-50/60 text-amber-900 font-bold border-x border-amber-200/50">
                        Próxima Acción
                      </th>
                      <th className="py-3.5 px-4">Alertas</th>
                      <th className="py-3.5 px-4">Última Actualización</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map((app) => {
                      const estValue = app.property?.estimated_value || 240000;
                      const reqAmount = Number(app.requested_amount) || 80000;
                      const finPct = estValue > 0 ? ((reqAmount / estValue) * 100).toFixed(1) : '33.3';
                      const nextInfo = getNextActionInfo(app);

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-[#102d49]">
                            {app.public_id}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {app.borrower
                                ? `${app.borrower.first_name} ${app.borrower.last_name}`
                                : 'Borrador sin titular'}
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              {app.property?.property_type || 'Inmueble'} · {app.property?.department || 'Montevideo'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-extrabold text-[#102d49]">
                            USD {reqAmount.toLocaleString('es-UY')}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            USD {estValue.toLocaleString('es-UY')}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded text-[11px]">
                              {finPct}%
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <StatusBadge status={app.status} size="sm" />
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            <span className="flex items-center text-[11px]">
                              <User className="w-3 h-3 mr-1 text-slate-400" />
                              {nextInfo.responsible}
                            </span>
                          </td>

                          {/* COLUMNA PROTAGONISTA: PRÓXIMA ACCIÓN */}
                          <td className="py-3.5 px-4 bg-amber-50/40 border-x border-amber-200/40">
                            <span className={`px-2.5 py-1 rounded-md font-bold text-xs inline-flex items-center ${nextInfo.color}`}>
                              <Clock className="w-3 h-3 mr-1 shrink-0" />
                              {nextInfo.action}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-[11px] text-slate-500 font-medium flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1 text-amber-500" />
                              {nextInfo.alert}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString('es-UY') : 'Hoy'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`${baseRoute}/solicitudes/${app.id}`}
                              className="inline-flex items-center text-xs font-bold text-[#102d49] hover:text-[#173a5e] bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-md transition"
                            >
                              Ficha <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
                  const nextInfo = getNextActionInfo(app);

                  return (
                    <Link
                      key={app.id}
                      to={`${baseRoute}/solicitudes/${app.id}`}
                      className="p-4 block hover:bg-slate-50 transition-colors space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-[#102d49] block">
                            {app.public_id}
                          </span>
                          <span className="text-xs text-slate-800 font-semibold mt-0.5 block">
                            {app.borrower
                              ? `${app.borrower.first_name} ${app.borrower.last_name}`
                              : 'Borrador sin titular'}
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-[#102d49]">
                          USD {reqAmount.toLocaleString('es-UY')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Valor: USD {estValue.toLocaleString('es-UY')}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Financiación: {finPct}%
                        </span>
                      </div>

                      <div className="bg-amber-50 p-2 rounded-lg flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-amber-900 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-amber-700" />
                          Próxima acción: {nextInfo.action}
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

