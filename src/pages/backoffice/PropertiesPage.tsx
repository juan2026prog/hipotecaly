import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getApplicationsList } from '../../lib/backofficeService';
import { useTenant } from '../../contexts/TenantContext';
import {
  Building,
  Home,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Percent,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { SearchInput } from '../../components/ui/SearchInput';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  GuaranteeGroup,
  GuaranteeViewMode,
  LtvRangeFilter,
  GUARANTEE_GROUPS,
  GuaranteeItem,
  mapApplicationToGuarantee,
  calculateGuaranteeKpis,
  calculateGuaranteeGroupCounts,
  filterByLtvRange,
} from '../../lib/guaranteeManagementService';

export const PropertiesPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();

  const isTenantPath = location.pathname.startsWith('/demo/');
  const isOrganizationPath = location.pathname.startsWith('/org/');
  const baseRoute = isOrganizationPath
    ? `/org/${tenant.slug}/admin`
    : isTenantPath
      ? `/demo/${tenant.slug || 'estudio-nova'}/admin`
      : '/app';

  // Datos crudos
  const [guarantees, setGuarantees] = useState<GuaranteeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Navegación y Filtros
  const [activeGroup, setActiveGroup] = useState<GuaranteeGroup>('all');
  const [viewMode, setViewMode] = useState<GuaranteeViewMode>('table');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [legalStatusFilter, setLegalStatusFilter] = useState<string>('all');
  const [appraisalFilter, setAppraisalFilter] = useState<string>('all');
  const [ltvFilter, setLtvFilter] = useState<LtvRangeFilter>('all');
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'ltv_desc' | 'ltv_asc' | 'recent'>('recent');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const apps = await getApplicationsList({ organizationId: tenant.id, useDemoMode: isDemo });

      // Transformar aplicaciones a garantías
      const items = apps
        .filter((app) => app.property)
        .map((app) => mapApplicationToGuarantee(app));

      setGuarantees(items);
      setLoading(false);
    }
    loadData();
  }, [tenant.id, tenant.demo_mode]);

  // KPIs principales
  const kpis = useMemo(() => {
    return calculateGuaranteeKpis(guarantees);
  }, [guarantees]);

  // Contadores por macro-grupo
  const groupCounts = useMemo(() => {
    return calculateGuaranteeGroupCounts(guarantees);
  }, [guarantees]);

  // Lista dinámica de departamentos existentes
  const existingDepartments = useMemo(() => {
    const setDept = new Set<string>();
    guarantees.forEach((g) => {
      if (g.department) setDept.add(g.department);
    });
    return Array.from(setDept).sort();
  }, [guarantees]);

  // Lista dinámica de tipos de inmuebles existentes
  const existingTypes = useMemo(() => {
    const setType = new Set<string>();
    guarantees.forEach((g) => {
      if (g.propertyType) setType.add(g.propertyType);
    });
    return Array.from(setType).sort();
  }, [guarantees]);

  // Reset de todos los filtros
  const handleClearFilters = () => {
    setActiveGroup('all');
    setSearch('');
    setDeptFilter('all');
    setTypeFilter('all');
    setLegalStatusFilter('all');
    setAppraisalFilter('all');
    setLtvFilter('all');
    setSortBy('recent');
  };

  // Garantías filtradas y ordenadas
  const filteredGuarantees = useMemo(() => {
    return guarantees
      .filter((g) => {
        // 1. Grupo principal (Todas, Requieren atención, Liberadas / cerradas)
        if (activeGroup === 'requires_attention' && !g.requiresAttention) {
          return false;
        }
        if (activeGroup === 'released_closed' && !g.isReleasedOrClosed) {
          return false;
        }

        // 2. Departamento
        if (deptFilter !== 'all' && g.department !== deptFilter) {
          return false;
        }

        // 3. Tipo de inmueble
        if (typeFilter !== 'all' && g.propertyType.toLowerCase() !== typeFilter.toLowerCase()) {
          return false;
        }

        // 4. Estado legal
        if (legalStatusFilter !== 'all' && g.legalStatus.status !== legalStatusFilter) {
          return false;
        }

        // 5. Estado de tasación
        if (appraisalFilter !== 'all' && g.appraisalStatus.status !== appraisalFilter) {
          return false;
        }

        // 6. Rango de LTV
        if (!filterByLtvRange(g, ltvFilter)) {
          return false;
        }

        // 7. Buscador por dirección, padrón, cliente o expediente
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchAddress = g.address?.toLowerCase().includes(q) || g.neighborhood?.toLowerCase().includes(q);
          const matchPadron = g.cadastralNumber.toLowerCase().includes(q);
          const matchClient = g.borrowerName.toLowerCase().includes(q);
          const matchPublicId = g.publicId.toLowerCase().includes(q);
          const matchDept = g.department.toLowerCase().includes(q);

          if (!matchAddress && !matchPadron && !matchClient && !matchPublicId && !matchDept) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const valA = a.value || 0;
        const valB = b.value || 0;
        const ltvA = a.ltv || 0;
        const ltvB = b.ltv || 0;

        if (sortBy === 'value_desc') return valB - valA;
        if (sortBy === 'value_asc') return valA - valB;
        if (sortBy === 'ltv_desc') return ltvB - ltvA;
        if (sortBy === 'ltv_asc') return ltvA - ltvB;
        return 0; // default recent/order
      });
  }, [
    guarantees,
    activeGroup,
    deptFilter,
    typeFilter,
    legalStatusFilter,
    appraisalFilter,
    ltvFilter,
    search,
    sortBy,
  ]);

  const hasActiveFilters =
    activeGroup !== 'all' ||
    deptFilter !== 'all' ||
    typeFilter !== 'all' ||
    legalStatusFilter !== 'all' ||
    appraisalFilter !== 'all' ||
    ltvFilter !== 'all' ||
    search.trim() !== '' ||
    sortBy !== 'recent';

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left w-full max-w-[1550px] mx-auto pb-12">
        {/* ============================================================ */}
        {/* 1. CABECERA PRINCIPAL                                         */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2.5 py-0.5 rounded uppercase tracking-wider inline-block">
                GARANTÍAS & PROPIEDADES
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {tenant.name || 'Estudio Nova'} · Registro de Garantías
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
              Garantías hipotecarias
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl">
              Control de inmuebles afectados a operaciones, tasaciones, LTV, documentación y situación jurídica.
            </p>
          </div>

          {/* Toggle de Vista: Tabla | Tarjetas */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                  viewMode === 'table'
                    ? 'bg-white text-[#102d49] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#102d49] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tarjetas</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. CUATRO KPIS PRINCIPALES                                    */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Garantías Activas */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Garantías Activas
              </span>
              <div className="text-2xl sm:text-3xl font-serif font-black text-[#102d49]">
                {loading ? '...' : kpis.activeCount}
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Respaldando solicitudes
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Building className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2: Valor Garantizado */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Valor Garantizado
              </span>
              <div className="text-2xl sm:text-3xl font-serif font-black text-[#102d49]">
                {loading ? '...' : `USD ${(kpis.totalGuaranteedValue / 1000).toLocaleString('es-UY')}k`}
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Total valuación vigente
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3: LTV Promedio */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                LTV Promedio
              </span>
              <div className="text-2xl sm:text-3xl font-serif font-black text-[#102d49]">
                {loading ? '...' : `${kpis.averageLtv}%`}
              </div>
              <span className="text-[11px] text-emerald-700 font-bold block">
                Rango conservador &lt; 50%
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4: Requieren Atención */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Requieren Atención
              </span>
              <div
                className={`text-2xl sm:text-3xl font-serif font-black ${
                  kpis.requiresAttentionCount > 0 ? 'text-amber-700' : 'text-slate-700'
                }`}
              >
                {loading ? '...' : kpis.requiresAttentionCount}
              </div>
              <span
                className={`text-[11px] font-semibold block ${
                  kpis.requiresAttentionCount > 0 ? 'text-amber-700' : 'text-slate-400'
                }`}
              >
                {kpis.requiresAttentionCount > 0
                  ? 'Tasación / Gravamen / Docs'
                  : 'Garantías al día'}
              </span>
            </div>
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                kpis.requiresAttentionCount > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. NAVEGACIÓN PRINCIPAL: 3 MACRO-GRUPOS                       */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {GUARANTEE_GROUPS.map((group) => {
            const isSelected = activeGroup === group.id;
            const count = groupCounts[group.id] || 0;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? 'bg-[#102d49] border-[#102d49] text-white shadow-md ring-2 ring-[#102d49]/20'
                    : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
                }`}
              >
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
                  {group.id === 'requires_attention' && count > 0 && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {count} pendientes
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
        {/* 4. PANEL UNIFICADO DE FILTROS                                 */}
        {/* ============================================================ */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
          {/* Fila 1: Buscador */}
          <div className="w-full">
            <SearchInput
              placeholder="Buscar dirección, padrón, cliente o expediente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              className="bg-slate-50/60 border-slate-300 text-xs focus:bg-white"
            />
          </div>

          {/* Fila 2: Filtros Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs pt-1 border-t border-slate-100">
            {/* Departamento */}
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
                {existingDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Inmueble */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Tipo Inmueble
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]"
              >
                <option value="all">Todos los tipos</option>
                {existingTypes.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado Legal */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Estado Legal
              </label>
              <select
                value={legalStatusFilter}
                onChange={(e) => setLegalStatusFilter(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]"
              >
                <option value="all">Todos los estados</option>
                <option value="libre_gravamenes">Libre de gravámenes</option>
                <option value="en_revision">En revisión jurídica</option>
                <option value="tiene_hipoteca">Gravamen detectado</option>
                <option value="sucesion_en_tramite">Sucesión en trámite</option>
                <option value="desconocido">Sin verificar / N/D</option>
              </select>
            </div>

            {/* Estado de Tasación */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Tasación
              </label>
              <select
                value={appraisalFilter}
                onChange={(e) => setAppraisalFilter(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]"
              >
                <option value="all">Todas las tasaciones</option>
                <option value="vigente">Vigente</option>
                <option value="por_actualizar">Por actualizar (+6m)</option>
                <option value="pendiente">Pendiente de peritaje</option>
                <option value="vencida">Vencida (+12m)</option>
              </select>
            </div>

            {/* LTV */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Rango LTV
              </label>
              <select
                value={ltvFilter}
                onChange={(e) => setLtvFilter(e.target.value as LtvRangeFilter)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]"
              >
                <option value="all">Todos los LTV</option>
                <option value="lt_30">&lt; 30% (Conservador)</option>
                <option value="30_35">30% – 35%</option>
                <option value="35_40">35% – 40%</option>
                <option value="gt_40">&gt; 40% (Alto)</option>
              </select>
            </div>

            {/* Orden */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Orden
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#102d49] bg-white focus:ring-2 focus:ring-[#102d49]"
              >
                <option value="recent">Más recientes</option>
                <option value="value_desc">Mayor valor</option>
                <option value="value_asc">Menor valor</option>
                <option value="ltv_desc">Mayor LTV</option>
                <option value="ltv_asc">Menor LTV</option>
              </select>
            </div>
          </div>

          {/* Barra de estado y limpiar filtros */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Mostrando <strong className="text-slate-800">{filteredGuarantees.length}</strong> de{' '}
                  <strong className="text-slate-800">{guarantees.length}</strong> garantías registradas
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
        {/* 5. VISTA PRINCIPAL (TABLA OPERATIVA O CARDS)                  */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">
              <div className="w-7 h-7 border-2 border-[#102d49] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Cargando registro de garantías...
            </div>
          ) : filteredGuarantees.length === 0 ? (
            <div className="p-16 text-center">
              <EmptyState
                icon={Home}
                title={
                  activeGroup === 'requires_attention'
                    ? 'No hay garantías que requieran atención'
                    : activeGroup === 'released_closed'
                      ? 'No hay garantías en el histórico cerrado'
                      : 'No se encontraron garantías con los filtros aplicados'
                }
                description="Las garantías vinculadas a expedientes hipotecarios se controlan operativamente aquí."
                actionLabel={hasActiveFilters ? 'Restablecer filtros' : undefined}
                onAction={hasActiveFilters ? handleClearFilters : undefined}
              />
            </div>
          ) : viewMode === 'table' ? (
            /* TABLA OPERATIVA DE GARANTÍAS */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold min-w-[200px]">Garantía</th>
                    <th className="py-3.5 px-4 font-bold min-w-[150px]">Expediente / Cliente</th>
                    <th className="py-3.5 px-3 font-bold">Valor Garantía</th>
                    <th className="py-3.5 px-3 font-bold">Financiación</th>
                    <th className="py-3.5 px-3 font-bold text-center">LTV</th>
                    <th className="py-3.5 px-3 font-bold">Tasación</th>
                    <th className="py-3.5 px-3 font-bold">Estado Legal</th>
                    <th className="py-3.5 px-4 font-bold min-w-[170px] bg-amber-50/70 text-amber-950 border-x border-amber-200/60">
                      Próxima Acción
                    </th>
                    <th className="py-3.5 px-3 font-bold">Alertas</th>
                    <th className="py-3.5 px-4 font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGuarantees.map((item) => {
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                      >
                        {/* 1. GARANTÍA */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 leading-tight capitalize">
                            {item.propertyType} en {item.neighborhood || item.department}
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Padrón <strong className="text-slate-700 font-mono">{item.cadastralNumber}</strong> · {item.department}
                            {item.surfaceM2 > 0 && ` · ${item.surfaceM2} m²`}
                          </span>
                        </td>

                        {/* 2. EXPEDIENTE / CLIENTE */}
                        <td className="py-3.5 px-4">
                          <Link
                            to={`${baseRoute}/solicitudes/${item.appId}`}
                            className="font-mono text-xs font-bold text-[#102d49] hover:underline flex items-center gap-1 group-hover:text-brand-green"
                          >
                            {item.publicId} <ExternalLink className="w-3 h-3 text-slate-400 inline" />
                          </Link>
                          <span className="text-[11px] font-semibold text-slate-700 block mt-0.5">
                            {item.borrowerName}
                          </span>
                        </td>

                        {/* 3. VALOR GARANTÍA */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {item.value ? (
                            <div>
                              <span className="font-extrabold text-[#102d49] block">
                                USD {item.value.toLocaleString('es-UY')}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {item.valueSource}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No disponible</span>
                          )}
                        </td>

                        {/* 4. FINANCIACIÓN */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {item.financingAmount > 0 ? (
                            <div>
                              <span className="font-bold text-slate-800 block">
                                USD {item.financingAmount.toLocaleString('es-UY')}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                Solicitado
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Sin operación</span>
                          )}
                        </td>

                        {/* 5. LTV */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {item.ltv !== null ? (
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                                item.ltvLevel === 'critical'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : item.ltvLevel === 'high'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {item.ltvFormatted}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">N/D</span>
                          )}
                        </td>

                        {/* 6. TASACIÓN */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1 border ${item.appraisalStatus.badgeColor}`}
                          >
                            {item.appraisalStatus.status === 'vigente' && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                            {item.appraisalStatus.status === 'por_actualizar' && (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            )}
                            {item.appraisalStatus.status === 'vencida' && (
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                            )}
                            {item.appraisalStatus.status === 'pendiente' && (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                            {item.appraisalStatus.label}
                          </span>
                          {item.appraisalStatus.reviewedAt && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {item.appraisalStatus.reviewedAt}
                            </span>
                          )}
                        </td>

                        {/* 7. ESTADO LEGAL */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1 border ${item.legalStatus.badgeColor}`}
                          >
                            {item.legalStatus.status === 'libre_gravamenes' && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                            {item.legalStatus.status === 'tiene_hipoteca' && (
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                            )}
                            {item.legalStatus.status === 'sucesion_en_tramite' && (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            )}
                            {item.legalStatus.status === 'desconocido' && (
                              <HelpCircle className="w-3 h-3 text-slate-400" />
                            )}
                            {item.legalStatus.label}
                          </span>
                        </td>

                        {/* 8. PRÓXIMA ACCIÓN */}
                        <td className="py-3.5 px-4 bg-amber-50/40 border-x border-amber-200/50">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-xs text-amber-950 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                              {item.nextAction.action}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {item.nextAction.responsible} · {item.nextAction.timing}
                            </span>
                          </div>
                        </td>

                        {/* 9. ALERTAS */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-semibold flex items-center gap-1 ${
                              item.alerts.level === 'critical'
                                ? 'text-rose-700 font-bold'
                                : item.alerts.level === 'warning'
                                  ? 'text-amber-700 font-bold'
                                  : item.alerts.level === 'clean'
                                    ? 'text-emerald-700'
                                    : 'text-slate-500'
                            }`}
                          >
                            {item.alerts.level === 'clean' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            ) : item.alerts.level === 'critical' || item.alerts.level === 'warning' ? (
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
                            )}
                            {item.alerts.text}
                          </span>
                        </td>

                        {/* 10. ACCIONES */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            to={`${baseRoute}/solicitudes/${item.appId}`}
                            className="inline-flex items-center text-xs font-bold text-[#102d49] hover:text-[#173a5e] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                          >
                            Revisar garantía <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* VISTA TARJETAS COMPACTAS Y OPERATIVAS */
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredGuarantees.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-sm transition flex flex-col justify-between space-y-3 relative"
                >
                  {/* Cabecera card */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.propertyType}
                      </span>
                      <Link
                        to={`${baseRoute}/solicitudes/${item.appId}`}
                        className="font-mono text-xs font-bold text-[#102d49] hover:underline flex items-center gap-1"
                      >
                        {item.publicId} <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2 leading-tight capitalize">
                      {item.propertyType} en {item.neighborhood || item.department}
                    </h4>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Padrón <strong className="text-slate-700 font-mono">{item.cadastralNumber}</strong> · {item.department}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 block mt-1">
                      Titular: {item.borrowerName}
                    </span>
                  </div>

                  {/* Grid de Valores y LTV */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Valor</span>
                      <span className="font-extrabold text-[#102d49] block truncate">
                        {item.value ? `USD ${(item.value / 1000).toFixed(0)}k` : 'N/D'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Financiación</span>
                      <span className="font-bold text-slate-700 block truncate">
                        {item.financingAmount > 0 ? `USD ${(item.financingAmount / 1000).toFixed(0)}k` : 'N/D'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">LTV</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded inline-block text-[11px]">
                        {item.ltvFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Estados: Tasación y Legal */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-bold border ${item.appraisalStatus.badgeColor}`}>
                      {item.appraisalStatus.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold border ${item.legalStatus.badgeColor}`}>
                      {item.legalStatus.label}
                    </span>
                  </div>

                  {/* Próxima Acción */}
                  <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs space-y-0.5">
                    <span className="font-bold text-amber-950 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                      {item.nextAction.action}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {item.nextAction.responsible}
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    to={`${baseRoute}/solicitudes/${item.appId}`}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#102d49] font-bold text-xs rounded-lg transition text-center flex items-center justify-center gap-1"
                  >
                    Revisar garantía <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BackofficeLayout>
  );
};
