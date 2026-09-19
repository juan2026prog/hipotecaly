import React, { useState, useEffect, useMemo } from 'react';
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
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ExpedientGroup,
  AssignmentScope,
  AlertFilter,
  SortByType,
  EXPEDIENT_GROUPS,
  getExpedientActionInfo,
  matchesExpedientGroup,
  calculateExpedientGroupCounts,
  matchesAlertFilter,
} from '../../lib/expedientManagementService';

export const ApplicationsPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isTenantPath = location.pathname.startsWith('/demo/');
  const isOrganizationPath = location.pathname.startsWith('/org/');
  const baseRoute = isOrganizationPath
    ? `/org/${tenant.slug}/admin`
    : isTenantPath
      ? `/demo/${tenant.slug || 'estudio-nova'}/admin`
      : '/app';

  // Read URL query params
  const stageParam = searchParams.get('stage');
  const groupParam = searchParams.get('group') as ExpedientGroup | null;
  const scopeParam = searchParams.get('scope') as AssignmentScope | null;

  // Estado local
  const [rawApplications, setRawApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [activeGroup, setActiveGroup] = useState<ExpedientGroup>(() => {
    if (groupParam && ['all', 'requires_action', 'in_progress', 'closing', 'finished'].includes(groupParam)) {
      return groupParam;
    }
    // Si viene ?stage=submitted, mapping directo al grupo correspondiente o 'all' con stageFilter
    if (stageParam) {
      if (['submitted', 'info_review', 'property_analysis'].includes(stageParam)) return 'requires_action';
      if (['evaluation', 'offer_available'].includes(stageParam)) return 'in_progress';
      if (['formalization'].includes(stageParam)) return 'closing';
      if (['approved', 'rejected', 'funded', 'cancelled'].includes(stageParam)) return 'finished';
    }
    return 'all';
  });

  const [assignmentScope, setAssignmentScope] = useState<AssignmentScope>(scopeParam === 'mine' ? 'mine' : 'all');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>(stageParam || 'all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<AlertFilter>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortByType>('created_desc');

  // Sincronizar URL params cuando cambian externamente
  useEffect(() => {
    if (stageParam) {
      setStageFilter(stageParam);
    }
  }, [stageParam]);

  // Carga de datos real
  useEffect(() => {
    async function fetchApps() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      // Traemos todos los expedientes de la organización para derivar contadores y filtros de forma instantánea sin N+1
      const data = await getApplicationsList({
        organizationId: tenant.id,
        useDemoMode: isDemo,
      });
      setRawApplications(data);
      setLoading(false);
    }
    fetchApps();
  }, [tenant.id, tenant.demo_mode]);

  // Actualizar query params de forma limpia
  const updateUrlParams = (newGroup?: ExpedientGroup, newStage?: string, newScope?: AssignmentScope) => {
    const params = new URLSearchParams(searchParams);

    if (newGroup) {
      if (newGroup === 'all') params.delete('group');
      else params.set('group', newGroup);
    }

    if (newStage !== undefined) {
      if (newStage === 'all') params.delete('stage');
      else params.set('stage', newStage);
    }

    if (newScope) {
      if (newScope === 'all') params.delete('scope');
      else params.set('scope', newScope);
    }

    setSearchParams(params, { replace: true });
  };

  // Manejador del cambio de grupo principal (5 Bloques)
  const handleGroupChange = (group: ExpedientGroup) => {
    setActiveGroup(group);
    // Si cambia de grupo y había un stageFilter incompatible, resetear stageFilter a 'all'
    setStageFilter('all');
    updateUrlParams(group, 'all', undefined);
  };

  // Manejador del cambio de filtro de etapa
  const handleStageChange = (newStage: string) => {
    setStageFilter(newStage);
    updateUrlParams(undefined, newStage, undefined);
  };

  // Manejador del cambio de asignación (Todos vs Solo mis expedientes)
  const handleScopeChange = (scope: AssignmentScope) => {
    setAssignmentScope(scope);
    updateUrlParams(undefined, undefined, scope);
  };

  // Reset de todos los filtros
  const handleClearFilters = () => {
    setActiveGroup('all');
    setAssignmentScope('all');
    setSearch('');
    setStageFilter('all');
    setResponsibleFilter('all');
    setAlertFilter('all');
    setDeptFilter('all');
    setSortBy('created_desc');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Conteo dinámico y real de los 5 grupos sobre el dataset completo
  const groupCounts = useMemo(() => {
    return calculateExpedientGroupCounts(rawApplications);
  }, [rawApplications]);

  // Lista de responsables únicos reales para el dropdown
  const uniqueResponsibles = useMemo(() => {
    const setResp = new Set<string>();
    rawApplications.forEach((app) => {
      const info = getExpedientActionInfo(app);
      if (info.responsible.name && info.responsible.name !== 'Sin asignar') {
        setResp.add(info.responsible.name);
      }
    });
    return Array.from(setResp).sort();
  }, [rawApplications]);

  // Dataset filtrado y ordenado
  const filteredApps = useMemo(() => {
    return rawApplications
      .filter((app) => {
        // 1. Grupo principal (Todos, Requieren acción, En curso, Por cerrar, Finalizados)
        if (!matchesExpedientGroup(app, activeGroup)) {
          return false;
        }

        // 2. Filtro de Asignación ("Mis expedientes")
        if (assignmentScope === 'mine') {
          const info = getExpedientActionInfo(app);
          const currentUserName = user?.user_metadata?.full_name || user?.email || '';
          // Si el responsable coincide con el usuario autenticado o en modo demo si está asignado
          const isAssignedToUser =
            (app.assigned_officer && app.assigned_officer.toLowerCase().includes(currentUserName.toLowerCase())) ||
            info.responsible.name.toLowerCase().includes('laura') || // default analyst demo profile
            info.responsible.name.toLowerCase().includes('valentina');
          if (!isAssignedToUser) return false;
        }

        // 3. Filtro específico de Etapa
        if (stageFilter !== 'all' && app.status !== stageFilter) {
          return false;
        }

        // 4. Filtro por Responsable
        if (responsibleFilter !== 'all') {
          const info = getExpedientActionInfo(app);
          if (info.responsible.name !== responsibleFilter) {
            return false;
          }
        }

        // 5. Filtro por Alertas
        if (!matchesAlertFilter(app, alertFilter)) {
          return false;
        }

        // 6. Filtro por Departamento
        if (deptFilter !== 'all' && app.property?.department !== deptFilter) {
          return false;
        }

        // 7. Buscador por ID, cliente, cédula o padrón
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchId = app.public_id?.toLowerCase().includes(q) || app.id?.toLowerCase().includes(q);
          const clientName = app.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}`.toLowerCase() : '';
          const matchClient = clientName.includes(q);
          const matchDoc = app.borrower?.document_id?.toLowerCase().includes(q);
          const matchPadron = app.property?.cadastral_number?.toLowerCase().includes(q);
          const matchAddress = app.property?.address?.toLowerCase().includes(q);

          if (!matchId && !matchClient && !matchDoc && !matchPadron && !matchAddress) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const amountA = Number(a.requested_amount) || 0;
        const amountB = Number(b.requested_amount) || 0;
        const ltvA = (amountA / (a.property?.estimated_value || 1)) * 100;
        const ltvB = (amountB / (b.property?.estimated_value || 1)) * 100;
        const dateA = new Date(a.created_at || Date.now()).getTime();
        const dateB = new Date(b.created_at || Date.now()).getTime();

        if (sortBy === 'amount_desc') return amountB - amountA;
        if (sortBy === 'amount_asc') return amountA - amountB;
        if (sortBy === 'ltv_desc') return ltvB - ltvA;
        if (sortBy === 'created_asc') return dateA - dateB;
        return dateB - dateA;
      });
  }, [
    rawApplications,
    activeGroup,
    assignmentScope,
    stageFilter,
    responsibleFilter,
    alertFilter,
    deptFilter,
    search,
    sortBy,
    user,
  ]);

  const hasActiveCustomFilters =
    assignmentScope !== 'all' ||
    stageFilter !== 'all' ||
    responsibleFilter !== 'all' ||
    alertFilter !== 'all' ||
    deptFilter !== 'all' ||
    search.trim() !== '' ||
    activeGroup !== 'all';

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left w-full max-w-[1550px] mx-auto pb-12">
        {/* ============================================================ */}
        {/* 1. ENCABEZADO PRINCIPAL                                       */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2.5 py-0.5 rounded uppercase tracking-wider inline-block">
                OPERACIONES & CRÉDITO
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {tenant.name || 'Estudio Nova'} · Backoffice
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
              Expedientes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl">
              Gestión operativa, próxima acción, responsables, alertas y avance de cada solicitud.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/solicitar">
              <Button
                variant="primary"
                size="md"
                className="!bg-[#102d49] hover:!bg-[#173a5e] !text-white !font-bold text-xs shadow-sm h-10 px-4 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1.5 shrink-0" /> Nueva Solicitud
              </Button>
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. NUEVA NAVEGACIÓN PRINCIPAL: 5 BLOQUES GRANDES              */}
        {/*    (Sin scroll horizontal en desktop, responsive 5/3+2/1)     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {EXPEDIENT_GROUPS.map((group) => {
            const isSelected = activeGroup === group.id;
            const count = groupCounts[group.id] || 0;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleGroupChange(group.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? 'bg-[#102d49] border-[#102d49] text-white shadow-md ring-2 ring-[#102d49]/20'
                    : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
                }`}
              >
                {/* Indicador lateral sutil al seleccionar */}
                {isSelected && (
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#f4b43b]" />
                )}

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider truncate ${
                      isSelected ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                  >
                    {group.label}
                  </span>
                  {group.id === 'requires_action' && count > 0 && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected
                          ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      Prioridad
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={`text-2xl sm:text-3xl font-serif font-black tracking-tight ${
                      isSelected ? 'text-white' : 'text-[#102d49]'
                    }`}
                  >
                    {count}
                  </span>
                </div>

                <div className="mt-1.5 text-[11px] font-medium truncate">
                  <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                    {group.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* 3. ZONA DE FILTROS UNIFICADA + ASIGNACIÓN ("Mis expedientes") */}
        {/* ============================================================ */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
          {/* Fila 1: Buscador y Filtro de Asignación */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Buscador inteligente */}
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar por ID, cliente, cédula o padrón…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                className="bg-slate-50/60 border-slate-300 text-xs focus:bg-white"
              />
            </div>

            {/* Selector de Asignación (Todos vs Solo mis expedientes) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs self-start lg:self-auto">
              <button
                type="button"
                onClick={() => handleScopeChange('all')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  assignmentScope === 'all'
                    ? 'bg-white text-[#102d49] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos los responsables
              </button>
              <button
                type="button"
                onClick={() => handleScopeChange('mine')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  assignmentScope === 'mine'
                    ? 'bg-[#102d49] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Solo mis expedientes
              </button>
            </div>
          </div>

          {/* Fila 2: Filtros desplegables y controles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs pt-1 border-t border-slate-100">
            {/* Filtro Etapa */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Etapa
              </label>
              <select
                value={stageFilter}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]"
              >
                <option value="all">Todas las etapas</option>
                <option value="draft">Borrador</option>
                <option value="submitted">1. Solicitud recibida</option>
                <option value="info_review">2. Información en revisión</option>
                <option value="property_analysis">3. Propiedad y recaudos</option>
                <option value="evaluation">4. Evaluación crediticia</option>
                <option value="offer_available">5. Condiciones de oferta</option>
                <option value="formalization">6. Formalización notarial</option>
                <option value="approved">7. Aprobada / Desembolsada</option>
                <option value="rejected">Rechazada / No elegible</option>
              </select>
            </div>

            {/* Filtro Responsable */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Responsable
              </label>
              <select
                value={responsibleFilter}
                onChange={(e) => setResponsibleFilter(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]"
              >
                <option value="all">Todos los responsables</option>
                {uniqueResponsibles.map((resp) => (
                  <option key={resp} value={resp}>
                    {resp}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Alertas */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Alertas
              </label>
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value as AlertFilter)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]"
              >
                <option value="all">Todas las alertas</option>
                <option value="with_alerts">Con alertas / Pendientes</option>
                <option value="no_activity">Sin actividad (48h+)</option>
                <option value="waiting_client">Esperando cliente</option>
                <option value="no_blocks">Sin bloqueos</option>
              </select>
            </div>

            {/* Filtro Departamento */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Departamento
              </label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]"
              >
                <option value="all">Todos los depts</option>
                <option value="Montevideo">Montevideo</option>
                <option value="Canelones">Canelones</option>
                <option value="Maldonado">Maldonado</option>
                <option value="Colonia">Colonia</option>
                <option value="San José">San José</option>
                <option value="Rocha">Rocha</option>
                <option value="Otros">Otros departamentos</option>
              </select>
            </div>

            {/* Ordenamiento */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Orden
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortByType)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]"
              >
                <option value="created_desc">Fecha: más reciente</option>
                <option value="created_asc">Fecha: más antigua</option>
                <option value="amount_desc">Mayor monto</option>
                <option value="amount_asc">Menor monto</option>
                <option value="ltv_desc">Mayor LTV</option>
              </select>
            </div>
          </div>

          {/* Barra de estado de filtros y botón Limpiar */}
          {hasActiveCustomFilters && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Mostrando <strong className="text-slate-800">{filteredApps.length}</strong> de{' '}
                  <strong className="text-slate-800">{rawApplications.length}</strong> expedientes
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold text-slate-600 hover:text-rose-600 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 4. TABLA OPERATIVA PRINCIPAL (Desktop) & CARDS (Mobile)       */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">
              <div className="w-7 h-7 border-2 border-[#102d49] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Cargando expedientes operativos...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-16 text-center">
              <EmptyState
                icon={FolderKanban}
                title={
                  activeGroup === 'requires_action'
                    ? 'No hay expedientes que requieran acción inmediata'
                    : activeGroup === 'closing'
                      ? 'No hay expedientes en proceso de cierre o firma'
                      : activeGroup === 'finished'
                        ? 'No hay expedientes finalizados en este rango'
                        : 'No se encontraron expedientes'
                }
                description="Prueba cambiando los filtros seleccionados o el grupo operativo."
                actionLabel={hasActiveCustomFilters ? 'Restablecer filtros' : undefined}
                onAction={hasActiveCustomFilters ? handleClearFilters : undefined}
              />
            </div>
          ) : (
            <div>
              {/* VISTA DESKTOP: TABLA CON PRIORIDAD VISUAL Y PRÓXIMA ACCIÓN */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3 w-4 text-center"></th>
                      <th className="py-3 px-3 font-bold">ID</th>
                      <th className="py-3 px-4 font-bold">Cliente</th>
                      <th className="py-3 px-3 font-bold">Monto</th>
                      <th className="py-3 px-3 font-bold">Valor Propiedad</th>
                      <th className="py-3 px-2 font-bold text-center">LTV</th>
                      <th className="py-3 px-3 font-bold">Etapa</th>
                      <th className="py-3 px-3 font-bold">Responsable</th>
                      {/* COLUMNA PROTAGONISTA CON IMPORTANCIA VISUAL */}
                      <th className="py-3 px-4 bg-amber-50/80 text-amber-950 font-extrabold border-x border-amber-200/70 min-w-[200px]">
                        Próxima Acción
                      </th>
                      <th className="py-3 px-3 font-bold">Alertas</th>
                      <th className="py-3 px-3 font-bold">Actualización</th>
                      <th className="py-3 px-3 text-right font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map((app) => {
                      const estValue = app.property?.estimated_value || 240000;
                      const reqAmount = Number(app.requested_amount) || 80000;
                      const finPct = estValue > 0 ? ((reqAmount / estValue) * 100).toFixed(1) : '33.3';
                      const actionInfo = getExpedientActionInfo(app);

                      // Indicador lateral discreto para expedientes críticos o atención
                      const priorityBarClass =
                        actionInfo.priority === 'critical'
                          ? 'bg-rose-500'
                          : actionInfo.priority === 'attention'
                            ? 'bg-amber-400'
                            : 'bg-transparent';

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                        >
                          {/* Indicador de prioridad lateral */}
                          <td className="py-3.5 px-0 text-center relative">
                            <div
                              className={`absolute top-1 bottom-1 left-0 w-1 rounded-r ${priorityBarClass}`}
                            />
                          </td>

                          {/* ID */}
                          <td className="py-3.5 px-3 font-mono font-bold text-[#102d49] whitespace-nowrap">
                            {app.public_id || app.id.slice(0, 8)}
                          </td>

                          {/* Cliente */}
                          <td className="py-3.5 px-4 min-w-[160px]">
                            <div className="font-bold text-slate-900 leading-tight">
                              {app.borrower
                                ? `${app.borrower.first_name} ${app.borrower.last_name}`
                                : 'Borrador sin titular'}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5 leading-tight">
                              {app.property?.property_type || 'Inmueble'} ·{' '}
                              {app.property?.neighborhood || app.property?.department || 'Montevideo'}
                            </span>
                          </td>

                          {/* Monto */}
                          <td className="py-3.5 px-3 font-extrabold text-[#102d49] whitespace-nowrap">
                            USD {reqAmount.toLocaleString('es-UY')}
                          </td>

                          {/* Valor Propiedad */}
                          <td className="py-3.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                            USD {estValue.toLocaleString('es-UY')}
                          </td>

                          {/* LTV */}
                          <td className="py-3.5 px-2 text-center whitespace-nowrap">
                            <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded text-[11px]">
                              {finPct}%
                            </span>
                          </td>

                          {/* Etapa */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <StatusBadge status={app.status} size="sm" />
                          </td>

                          {/* Responsable (Nombre y Rol claramente visibles) */}
                          <td className="py-3.5 px-3 min-w-[130px]">
                            <div className="flex items-center text-slate-800 font-semibold leading-tight">
                              <User className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                              <span className="truncate">{actionInfo.responsible.name}</span>
                            </div>
                            {actionInfo.responsible.role && (
                              <span className="text-[10px] text-slate-400 block ml-4 leading-tight">
                                {actionInfo.responsible.role}
                              </span>
                            )}
                          </td>

                          {/* COLUMNA DESTACADA: PRÓXIMA ACCIÓN */}
                          <td className="py-3.5 px-4 bg-amber-50/40 border-x border-amber-200/50">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`px-2 py-1 rounded-md font-bold text-xs inline-flex items-center w-fit shadow-2xs ${actionInfo.color}`}
                              >
                                <Clock className="w-3 h-3 mr-1 shrink-0" />
                                {actionInfo.action}
                              </span>
                              <span className="text-[10px] text-amber-900/80 font-medium pl-1">
                                {actionInfo.timing}
                              </span>
                            </div>
                          </td>

                          {/* Alertas */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`text-[11px] font-semibold flex items-center ${
                                actionInfo.alert.type === 'critical'
                                  ? 'text-rose-700'
                                  : actionInfo.alert.type === 'warning'
                                    ? 'text-amber-700'
                                    : actionInfo.alert.type === 'clean'
                                      ? 'text-emerald-700'
                                      : 'text-slate-500'
                              }`}
                            >
                              {actionInfo.alert.type === 'clean' ? (
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500 shrink-0" />
                              ) : actionInfo.alert.type === 'critical' || actionInfo.alert.type === 'warning' ? (
                                <AlertTriangle className="w-3 h-3 mr-1 text-amber-500 shrink-0" />
                              ) : (
                                <AlertCircle className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                              )}
                              {actionInfo.alert.text}
                            </span>
                          </td>

                          {/* Última Actualización */}
                          <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                            {app.updated_at
                              ? new Date(app.updated_at).toLocaleDateString('es-UY')
                              : app.created_at
                                ? new Date(app.created_at).toLocaleDateString('es-UY')
                                : 'Hoy'}
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <Link
                              to={`${baseRoute}/solicitudes/${app.id}`}
                              className="inline-flex items-center text-xs font-bold text-[#102d49] hover:text-[#173a5e] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
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

              {/* VISTA MOBILE: CARDS ESTRUCTURADAS Y CLARAS */}
              <div className="lg:hidden divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const estValue = app.property?.estimated_value || 240000;
                  const reqAmount = Number(app.requested_amount) || 80000;
                  const finPct = estValue > 0 ? ((reqAmount / estValue) * 100).toFixed(1) : '33.3';
                  const actionInfo = getExpedientActionInfo(app);

                  return (
                    <div
                      key={app.id}
                      className="p-4 hover:bg-slate-50 transition-colors space-y-3 relative"
                    >
                      {/* Cabecera card */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#102d49]">
                              {app.public_id || app.id.slice(0, 8)}
                            </span>
                            <StatusBadge status={app.status} size="sm" />
                          </div>
                          <span className="text-sm text-slate-900 font-bold mt-1 block">
                            {app.borrower
                              ? `${app.borrower.first_name} ${app.borrower.last_name}`
                              : 'Borrador sin titular'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {app.property?.property_type || 'Inmueble'} ·{' '}
                            {app.property?.neighborhood || app.property?.department || 'Montevideo'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-[#102d49] block">
                            USD {reqAmount.toLocaleString('es-UY')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Financiación: <strong className="text-emerald-700">{finPct}%</strong>
                          </span>
                        </div>
                      </div>

                      {/* Próxima Acción Destacada */}
                      <div className="bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-lg space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-950 flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-amber-700" />
                            {actionInfo.action}
                          </span>
                          <span className="text-[10px] text-amber-800 font-medium">
                            {actionInfo.timing}
                          </span>
                        </div>
                      </div>

                      {/* Responsable, Alerta y CTA */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-slate-600 font-medium flex items-center">
                            <User className="w-3 h-3 mr-1 text-slate-400" />
                            {actionInfo.responsible.name}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1 text-slate-400" />
                            {actionInfo.alert.text}
                          </span>
                        </div>

                        <Link
                          to={`${baseRoute}/solicitudes/${app.id}`}
                          className="inline-flex items-center text-xs font-bold text-white bg-[#102d49] hover:bg-[#173a5e] px-3.5 py-1.5 rounded-lg shadow-xs transition"
                        >
                          Abrir expediente <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </Link>
                      </div>
                    </div>
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
