// ==============================================================================
// HIPOTECALY SUPER ADMIN: PESTAÑA OBSERVABILIDAD TASADOR IA (FASES 1 + 2)
// Monitoreo de 20 Fuentes Inmobiliarias, Ingesta Real, Deduplicación y Catastro
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Building,
  FileText,
  TrendingUp,
  Image,
  Copy,
  Landmark,
  Play,
} from 'lucide-react';
import {
  tasadorObservabilityService,
  TasadorObservabilitySummary,
} from '../../lib/tasador/observability/TasadorObservabilityService';
import { HealthCheckResult } from '../../lib/tasador/types/tasadorPipelineTypes';

export const SuperAdminTasadorTab: React.FC = () => {
  const [summary, setSummary] = useState<TasadorObservabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setHealthChecks] = useState<HealthCheckResult[]>([]);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionMessage, setIngestionMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await tasadorObservabilityService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error cargando observabilidad del Tasador:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleHealthCheckAll = async () => {
    setIsHealthChecking(true);
    try {
      const results = await tasadorObservabilityService.runHealthCheckAll();
      setHealthChecks(results);
      await loadData();
    } catch (err) {
      console.error('Error ejecutando healthchecks:', err);
    } finally {
      setIsHealthChecking(false);
    }
  };

  const handleRunPilotIngestion = async () => {
    setIsIngesting(true);
    setIngestionMessage(null);
    try {
      const res = await tasadorObservabilityService.triggerIngestionRun('infocasas', {
        limit: 30,
        department: 'montevideo',
      });
      setIngestionMessage(
        `Ingesta completada: ${res.listingsDiscovered} descubiertos, ${res.listingsNew} nuevos, ${res.propertyMastersResolved} Property Masters resueltos.`
      );
      await loadData();
    } catch (err: any) {
      setIngestionMessage(`Error en ingesta: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const getCapabilityBadge = (capability: string) => {
    switch (capability) {
      case 'PUBLIC_STRUCTURED_ENDPOINT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PUBLIC_HTML':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BLOCKED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'REQUIRES_AUTHORIZATION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-emerald-600" />
        <span>Cargando observabilidad del pipeline Tasador IA...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner de Control y Métricas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Base Inmobiliaria & Pipeline de Ingesta (Fase 1 + 2)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              100% Determinístico (Sin IA)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gobernanza de las 20 fuentes uruguayas, capturas raw, snapshots inmutables, normalización, deduplicación y Property Master.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleHealthCheckAll}
            disabled={isHealthChecking}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isHealthChecking ? 'animate-spin' : ''}`} />
            Auditar Fuentes
          </button>
          <button
            onClick={handleRunPilotIngestion}
            disabled={isIngesting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isIngesting ? 'animate-spin' : ''}`} />
            Ejecutar Ingesta Piloto
          </button>
        </div>
      </div>

      {ingestionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{ingestionMessage}</span>
        </div>
      )}

      {/* Tarjetas de Métricas Globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Publicaciones</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.pipelineSummary.totalListings || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Property Masters</span>
            <Building className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.pipelineSummary.totalMasters || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Snapshots Raw</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.pipelineSummary.totalSnapshots || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Precios Históricos</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.pipelineSummary.totalPriceEvents || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Medios Canónicos</span>
            <Image className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.pipelineSummary.totalMedia || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Duplicados</span>
            <Copy className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.pipelineSummary.totalDuplicateCandidates || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Evidencias</span>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.pipelineSummary.totalFieldEvidences || 0}</div>
        </div>
      </div>

      {/* Auditoría Catastral Oficial */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Landmark className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-slate-900">Estado de Catastro Oficial Uruguayo (DNC / IDEuy)</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {summary?.cadastralAudit.status || 'NOT_CONNECTED'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{summary?.cadastralAudit.legalAndTechnicalSummary}</p>
            <div className="mt-3 text-xs text-slate-500">
              <strong>Autorización Requerida:</strong> {summary?.cadastralAudit.requiredAuthorizationForLiveSync}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Gobernanza de las 20 Fuentes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Matriz de Gobernanza de Fuentes (Top 20 Uruguay)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Control de capabilities, rate limits y feature flags por fuente.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">
            20 Fuentes Registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Fuente / Portal</th>
                <th className="py-3 px-4">Dominio</th>
                <th className="py-3 px-4">Capability Detectada</th>
                <th className="py-3 px-4">Rate Limit</th>
                <th className="py-3 px-4">Habilitado</th>
                <th className="py-3 px-4">Ingesta Real</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary?.sources.map((src) => (
                <tr key={src.code} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">{src.code}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{src.name}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{src.domain}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCapabilityBadge(
                        src.capability
                      )}`}
                    >
                      {src.capability}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{src.rateLimitPerMinute} req/min</td>
                  <td className="py-3 px-4">
                    {src.enabled ? (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Inactivo</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {src.ingestionEnabled ? (
                      <span className="text-xs font-bold text-emerald-600">HABILITADA</span>
                    ) : (
                      <span className="text-xs font-medium text-amber-600">DESHABILITADA (Safe)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial Reciente de Crawler Runs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Historial de Ejecuciones de Ingesta (crawler_runs)</h3>
        </div>
        <div className="overflow-x-auto">
          {summary?.recentRuns && summary.recentRuns.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Run ID</th>
                  <th className="py-3 px-4">Fuente</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Descubiertos</th>
                  <th className="py-3 px-4">Nuevos</th>
                  <th className="py-3 px-4">Duración</th>
                  <th className="py-3 px-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recentRuns.map((run) => (
                  <tr key={run.runId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">{run.runId}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{run.sourceCode}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{run.runType}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{run.listingsDiscovered}</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">+{run.listingsNew}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{run.durationMs} ms</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{new Date(run.startedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">No hay ejecuciones registradas en esta sesión.</div>
          )}
        </div>
      </div>
    </div>
  );
};
