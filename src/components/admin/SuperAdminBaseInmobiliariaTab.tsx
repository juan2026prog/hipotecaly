// ==============================================================================
// HIPOTECALY SUPER ADMIN: PESTAÑA BASE INMOBILIARIA Y CONTINUOUS INGESTION
// Dashboard General, Gobernanza de 20 Fuentes, Kill Switch e Inspector de Datos
// ==============================================================================

import React, { useState, useEffect, useId } from 'react';
import {
  RefreshCw,
  Play,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface BaseSummary {
  base: {
    totalMasters: number;
    totalListings: number;
    activeListings: number;
    inactiveListings: number;
    newLast24h: number;
    modifiedLast24h: number;
    priceChanges: number;
  };
  sources: {
    total: number;
    operativas?: number;
    readyForAdapter?: number;
    pausedWaf?: number;
    healthy: number;
    paused: number;
    blocked: number;
  };
  quality: {
    avgQualityScore: number;
    eligibleComparablesPct: number;
    eligibleCount: number;
    potentialDuplicates: number;
  };
  pipeline: {
    queued: number;
    processing: number;
    failed: number;
    retry: number;
  };
  scheduler: {
    active: boolean;
    killSwitchActive: boolean;
    killSwitchReason: string | null;
    globalDiscovery: boolean;
    globalIngestion: boolean;
  };
}

export interface SourceRow {
  id: string;
  code: string;
  name: string;
  domain: string;
  capability: string;
  operational_status?: string;
  is_active: boolean;
  enabled: boolean;
  ingestion_enabled: boolean;
  discovery_enabled: boolean;
  frequency: string;
  health_status: string;
  latency_ms: number;
  last_health_check_at: string | null;
  last_discovery_at: string | null;
  discovered_count: number;
  new_count: number;
  modified_count: number;
  error_count: number;
  parser_version: string;
}

export interface InspectorListing {
  id: string;
  master_id: string;
  source_code: string;
  source_name: string;
  source_listing_id: string;
  original_url: string;
  title: string;
  operation_type: string;
  property_type: string;
  status: string;
  department: string;
  city: string;
  neighborhood: string;
  price_usd: number;
  price_amount: number;
  currency: string;
  built_area_m2: number;
  total_area_m2: number;
  bedrooms: number;
  bathrooms: number;
  data_quality_score: number;
  comparable_eligibility: string;
  first_seen_at: string;
  last_seen_at: string;
  updated_at: string;
}

export const SuperAdminBaseInmobiliariaTab: React.FC = () => {
  const searchInputId = useId();
  const sourceSelectId = useId();
  const statusSelectId = useId();
  const eligibilitySelectId = useId();

  const [summary, setSummary] = useState<BaseSummary | null>(null);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [listings, setListings] = useState<InspectorListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtros de Inspector
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEligibility, setFilterEligibility] = useState('');

  // Modal / Drawer de Detalle
  const [selectedListing, setSelectedListing] = useState<InspectorListing | null>(null);
  const [selectedSourceDetail, setSelectedSourceDetail] = useState<SourceRow | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Resumen
      const { data: summaryData, error: sumErr } = await supabase.rpc('fn_superadmin_get_base_inmobiliaria_summary');
      if (!sumErr && summaryData) {
        setSummary(summaryData as BaseSummary);
      }

      // 2. Cargar Fuentes
      const { data: sourcesData, error: srcErr } = await supabase.rpc('fn_superadmin_get_property_sources');
      if (!srcErr && sourcesData) {
        setSources(sourcesData as SourceRow[]);
      }

      // 3. Cargar Listings iniciales para el inspector
      await fetchInspectorListings();
    } catch (err: any) {
      console.error('Error cargando Base Inmobiliaria:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInspectorListings = async () => {
    try {
      const { data, error } = await supabase.rpc('fn_superadmin_list_properties_inspector', {
        p_search: searchTerm.trim() || null,
        p_source_code: filterSource || null,
        p_status: filterStatus || null,
        p_comparable_eligibility: filterEligibility || null,
        p_limit: 30,
        p_offset: 0,
      });
      if (!error && data) {
        setListings(data as InspectorListing[]);
      }
    } catch (err) {
      console.warn('Warning cargando inspector:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInspectorListings();
  };

  // Toggle de switch (por fuente o global)
  const handleToggleSwitch = async (sourceCode: string, field: string, currentValue: boolean) => {
    setActionLoading(`${sourceCode}_${field}`);
    try {
      const { error } = await supabase.rpc('fn_superadmin_toggle_source_switch', {
        p_source_code: sourceCode,
        p_field: field,
        p_value: !currentValue,
      });
      if (error) throw error;

      setNotification({
        type: 'success',
        message: `Interruptor ${field} actualizado para ${sourceCode}.`,
      });
      await loadAllData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Error al alternar switch: ${err.message}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Kill Switch Global
  const handleToggleGlobalKillSwitch = async (currentActive: boolean) => {
    if (!confirm(currentActive ? '¿Deseas desactivar el Kill Switch y reanudar el pipeline?' : '¿Confirmas activar el Kill Switch y detener inmediatamente todas las ingestas y discovery?')) {
      return;
    }

    setActionLoading('global_kill_switch');
    try {
      const { error } = await supabase.rpc('fn_superadmin_toggle_source_switch', {
        p_source_code: 'GLOBAL',
        p_field: 'kill_switch_active',
        p_value: !currentActive,
      });
      if (error) throw error;

      setNotification({
        type: 'success',
        message: currentActive ? 'Kill Switch desactivado: Pipeline reanudado.' : 'Kill Switch ACTIVADO: Pipeline detenido de emergencia.',
      });
      await loadAllData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Error con Kill Switch: ${err.message}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Ejecutar Health Check manual
  const handleRunHealthCheck = async (sourceCode: string) => {
    setActionLoading(`health_${sourceCode}`);
    try {
      const res = await fetch('/api/tasador?action=health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fallo en health check');

      setNotification({
        type: 'success',
        message: `Health Check completado para ${sourceCode}: ${data.report?.message || 'OK'}`,
      });
      await loadAllData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Error en Health Check: ${err.message}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Ejecutar Discovery manual
  const handleRunDiscovery = async (sourceCode: string) => {
    setActionLoading(`discovery_${sourceCode}`);
    try {
      const res = await fetch('/api/tasador?action=discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode, limit: 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fallo en discovery');

      setNotification({
        type: 'success',
        message: data.result?.message || `Discovery finalizado para ${sourceCode}.`,
      });
      await loadAllData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Error en Discovery: ${err.message}`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'BLOCKED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'PAUSED':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'DEGRADED':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'TOS_RESTRICTED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getEligibilityBadge = (eligibility: string) => {
    switch (eligibility) {
      case 'ELIGIBLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PARTIAL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REVIEW_REQUIRED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getOperationalStatus = (src: SourceRow): 'OPERATIVA' | 'READY_FOR_ADAPTER' | 'PAUSED_WAF_PROTECTED' => {
    if (src.operational_status) {
      return src.operational_status as any;
    }
    if (src.code === 'infocasas') return 'OPERATIVA';
    if (
      src.health_status === 'BLOCKED' ||
      src.health_status === 'TOS_RESTRICTED' ||
      src.health_status === 'NOT_SUPPORTED' ||
      src.health_status === 'MANUAL_ONLY' ||
      src.health_status === 'PAUSED_WAF_PROTECTED' ||
      src.code === 'mercadolibre_uy' ||
      src.code === 'gallito_uy'
    ) {
      return 'PAUSED_WAF_PROTECTED';
    }
    return 'READY_FOR_ADAPTER';
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-emerald-600" />
        <span>Cargando Base Inmobiliaria & Continuous Ingestion...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header & Kill Switch Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Base Inmobiliaria — Data Acquisition & Ingestion</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Producción Certificada
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gobernanza continua de las 20 fuentes uruguayas, detección incremental, deduplicación física e historial de precios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>

          {/* Botón Kill Switch Global */}
          <button
            onClick={() => handleToggleGlobalKillSwitch(summary?.scheduler.killSwitchActive || false)}
            disabled={actionLoading === 'global_kill_switch'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${
              summary?.scheduler.killSwitchActive
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            {summary?.scheduler.killSwitchActive ? 'DESACTIVAR KILL SWITCH' : 'KILL SWITCH GLOBAL'}
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline ml-4">
            Cerrar
          </button>
        </div>
      )}

      {/* 2. KPIs del Dashboard General */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Inmuebles Únicos</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.base.totalMasters ?? 0}</div>
          <span className="text-[11px] text-slate-400">Property Masters</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Listings Activos</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary?.base.activeListings ?? 0}</div>
          <span className="text-[11px] text-slate-400">De {summary?.base.totalListings ?? 0} totales</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Nuevas (24h)</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">+{summary?.base.newLast24h ?? 0}</div>
          <span className="text-[11px] text-slate-400">Descubrimientos</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Cambios de Precio</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{summary?.base.priceChanges ?? 0}</div>
          <span className="text-[11px] text-slate-400">Eventos registrados</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Calidad Promedio</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.quality.avgQualityScore ?? 0}/100</div>
          <span className="text-[11px] text-slate-400">Completitud</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Elegibles Comparables</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary?.quality.eligibleComparablesPct ?? 0}%</div>
          <span className="text-[11px] text-slate-400">{summary?.quality.eligibleCount ?? 0} aptas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Cola de Ingesta</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.pipeline.queued ?? 0}</div>
          <span className="text-[11px] text-amber-600 font-medium">
            {summary?.pipeline.processing ?? 0} en proceso
          </span>
        </div>
      </div>

      {/* 3. Tabla de las 20 Fuentes Inmobiliarias */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registro Maestro de 20 Fuentes Canónicas</h3>
            <p className="text-xs text-slate-500 mt-0.5">Control de rate limiting, estado técnico, discovery e ingesta</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              {summary?.sources.operativas ?? sources.filter((s) => getOperationalStatus(s) === 'OPERATIVA').length} Operativa
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              {summary?.sources.readyForAdapter ?? sources.filter((s) => getOperationalStatus(s) === 'READY_FOR_ADAPTER').length} Pendientes de Adapter
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              {summary?.sources.pausedWaf ?? sources.filter((s) => getOperationalStatus(s) === 'PAUSED_WAF_PROTECTED').length} Pausadas / WAF
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Fuente</th>
                <th className="py-3 px-4">Rol Operativo</th>
                <th className="py-3 px-4">Health Técnico</th>
                <th className="py-3 px-4 text-center">Discovery</th>
                <th className="py-3 px-4 text-center">Ingestion</th>
                <th className="py-3 px-4">Salud & Latencia</th>
                <th className="py-3 px-4">Detección</th>
                <th className="py-3 px-4">Último Check</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((src) => (
                <tr key={src.code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{src.name}</div>
                    <div className="text-xs text-slate-400">{src.domain}</div>
                  </td>
                  <td className="py-3 px-4">
                    {getOperationalStatus(src) === 'OPERATIVA' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                        OPERATIVA
                      </span>
                    )}
                    {getOperationalStatus(src) === 'READY_FOR_ADAPTER' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                        READY FOR ADAPTER
                      </span>
                    )}
                    {getOperationalStatus(src) === 'PAUSED_WAF_PROTECTED' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                        PAUSED (WAF)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getHealthBadge(src.health_status)}`}>
                      {src.health_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleSwitch(src.code, 'discovery_enabled', src.discovery_enabled)}
                      disabled={actionLoading === `${src.code}_discovery_enabled`}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        src.discovery_enabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          src.discovery_enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleSwitch(src.code, 'ingestion_enabled', src.ingestion_enabled)}
                      disabled={actionLoading === `${src.code}_ingestion_enabled`}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        src.ingestion_enabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          src.ingestion_enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs font-medium text-slate-700">{src.capability}</div>
                    <div className="text-[11px] text-slate-400">
                      {src.latency_ms > 0 ? `${src.latency_ms} ms` : 'Sin datos'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs font-semibold text-slate-800">{src.discovered_count} avisos</div>
                    <div className="text-[11px] text-slate-400">
                      +{src.new_count} nuevos / ~{src.modified_count} mod
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {src.last_health_check_at
                      ? new Date(src.last_health_check_at).toLocaleTimeString()
                      : 'Nunca'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleRunHealthCheck(src.code)}
                        title="Auditar Salud"
                        disabled={actionLoading === `health_${src.code}`}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === `health_${src.code}` ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleRunDiscovery(src.code)}
                        title="Ejecutar Discovery Controlado"
                        disabled={actionLoading === `discovery_${src.code}` || src.health_status === 'BLOCKED'}
                        className="p-1.5 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Play className={`w-3.5 h-3.5 ${actionLoading === `discovery_${src.code}` ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => setSelectedSourceDetail(src)}
                        title="Ver Detalle"
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Inspector de la Base Inmobiliaria */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Inspector de Inmuebles y Listings</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Búsqueda, auditoría de normalización, trazabilidad de raw snapshots e histórico de precios
          </p>
        </div>

        {/* Barra de Filtros */}
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <label htmlFor={searchInputId} className="sr-only">Buscar por dirección, título o ID</label>
            <input
              id={searchInputId}
              type="text"
              placeholder="Buscar por dirección, título o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div>
            <label htmlFor={sourceSelectId} className="sr-only">Filtrar por fuente</label>
            <select
              id={sourceSelectId}
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todas las Fuentes</option>
              {sources.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={statusSelectId} className="sr-only">Filtrar por estado</label>
            <select
              id={statusSelectId}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos los Estados</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="REMOVED">REMOVED</option>
            </select>
          </div>

          <div className="flex gap-2">
            <label htmlFor={eligibilitySelectId} className="sr-only">Filtrar por elegibilidad comparable</label>
            <select
              id={eligibilitySelectId}
              value={filterEligibility}
              onChange={(e) => setFilterEligibility(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todas las Aptitudes</option>
              <option value="ELIGIBLE">ELIGIBLE</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="NOT_ELIGIBLE">NOT_ELIGIBLE</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Filtrar
            </button>
          </div>
        </form>

        {/* Tabla de Listings */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Propiedad / Título</th>
                <th className="py-2.5 px-3">Fuente</th>
                <th className="py-2.5 px-3">Ubicación</th>
                <th className="py-2.5 px-3">Precio USD</th>
                <th className="py-2.5 px-3">Superficie</th>
                <th className="py-2.5 px-3">Calidad</th>
                <th className="py-2.5 px-3">Comparable</th>
                <th className="py-2.5 px-3 text-right">Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                    No se encontraron publicaciones con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                listings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 truncate max-w-xs">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">ID: {item.source_listing_id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs font-medium text-slate-600">
                      {item.source_name || item.source_code}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-700">
                      {item.neighborhood ? `${item.neighborhood}, ` : ''}{item.department}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      ${item.price_usd?.toLocaleString('es-UY')}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-600">
                      {item.built_area_m2 ? `${item.built_area_m2} m²` : (item.total_area_m2 ? `${item.total_area_m2} m²` : '-')}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{item.data_quality_score}</span>
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, item.data_quality_score)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getEligibilityBadge(item.comparable_eligibility)}`}>
                        {item.comparable_eligibility}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedListing(item)}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        Inspeccionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal de Inspección Detallada de Inmueble */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">Auditoría de Inmueble & Snapshot</h4>
                <p className="text-xs text-slate-500">ID: {selectedListing.source_listing_id} | Fuente: {selectedListing.source_code}</p>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Bloque de Identificación */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                <div className="font-bold text-slate-900">{selectedListing.title}</div>
                <div className="text-xs text-slate-600">
                  Ubicación: <b>{selectedListing.neighborhood || ''}, {selectedListing.city || ''}, {selectedListing.department}</b>
                </div>
                <div className="text-xs text-slate-600">
                  URL Canónica:{' '}
                  <a href={selectedListing.original_url} target="_blank" rel="noreferrer" className="text-emerald-600 underline">
                    {selectedListing.original_url}
                  </a>
                </div>
              </div>

              {/* Métricas Técnicas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500">Precio Normalizado</div>
                  <div className="text-lg font-bold text-slate-900">${selectedListing.price_usd?.toLocaleString('es-UY')} USD</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500">Superficie Total / Útil</div>
                  <div className="text-lg font-bold text-slate-900">{selectedListing.built_area_m2 || selectedListing.total_area_m2 || 0} m²</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500">Dormitorios / Baños</div>
                  <div className="text-lg font-bold text-slate-900">{selectedListing.bedrooms ?? '-'}d / {selectedListing.bathrooms ?? '-'}b</div>
                </div>
              </div>

              {/* Calidad y Comparabilidad */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Score de Calidad Determinístico:</span>
                  <span className="text-sm font-bold text-emerald-700">{selectedListing.data_quality_score} / 100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Elegibilidad como Comparable:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-white text-emerald-800 border border-emerald-300">
                    {selectedListing.comparable_eligibility}
                  </span>
                </div>
              </div>

              {/* Tiempos de Detección */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div>Primera Detección: {new Date(selectedListing.first_seen_at).toLocaleString()}</div>
                <div>Última Verificación: {new Date(selectedListing.last_seen_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedListing(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal de Detalle de Fuente */}
      {selectedSourceDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">{selectedSourceDetail.name}</h4>
                <p className="text-xs text-slate-500">{selectedSourceDetail.domain}</p>
              </div>
              <button
                onClick={() => setSelectedSourceDetail(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500">Estado de Salud</span>
                  <div className="font-bold text-slate-900">{selectedSourceDetail.health_status}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500">Capability</span>
                  <div className="font-bold text-slate-900">{selectedSourceDetail.capability}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500">Latencia</span>
                  <div className="font-bold text-slate-900">{selectedSourceDetail.latency_ms} ms</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500">Parser Version</span>
                  <div className="font-bold text-slate-900">{selectedSourceDetail.parser_version}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div>Publicaciones descubiertas: <b>{selectedSourceDetail.discovered_count}</b></div>
                <div>Nuevas: <b>{selectedSourceDetail.new_count}</b></div>
                <div>Modificadas: <b>{selectedSourceDetail.modified_count}</b></div>
                <div>Errores registrados: <b>{selectedSourceDetail.error_count}</b></div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedSourceDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
