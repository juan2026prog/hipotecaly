// ==============================================================================
// HIPOTECALY TASADOR IA - CONSOLA DE CALIBRACIÓN Y GROUND TRUTH (SUPER ADMIN)
// Análisis Asking vs Closing, Backtesting sin Data Leakage, Propuestas Shadow y Rollback
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  TrendingDown,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Calendar,
  RotateCcw,
  Lock,
  Layers,
  Scale,
} from 'lucide-react';
import { GroundTruthService } from '../../lib/tasador/calibration/GroundTruthService';
import { AskingDiscountAnalyzer } from '../../lib/tasador/calibration/AskingDiscountAnalyzer';
import { CalibrationEngine } from '../../lib/tasador/calibration/CalibrationEngine';
import { SettingsLifecycleService } from '../../lib/tasador/calibration/SettingsLifecycleService';
import { SampleSufficiencyEngine } from '../../lib/tasador/calibration/SampleSufficiencyEngine';
import {
  BacktestMetrics,
  CalibrationProposal,
  CalibrationRun,
  SettingsVersionRecord,
  GlobalSufficiencyReport,
} from '../../lib/tasador/calibration/calibrationTypes';

export const SuperAdminCalibrationTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeSubSection, setActiveSubSection] = useState<'groundtruth' | 'backtest' | 'calibration' | 'sufficiency' | 'versions'>('groundtruth');

  // Estados de datos
  const [zoneAnalysis, setZoneAnalysis] = useState<any>(null);
  const [sufficiencyReport, setSufficiencyReport] = useState<GlobalSufficiencyReport | null>(null);
  const [backtestResult, setBacktestResult] = useState<{
    metrics: BacktestMetrics;
    details: any[];
  } | null>(null);
  const [selectedCutoffDate, setSelectedCutoffDate] = useState<string>('2026-03-01');
  const [selectedDept, setSelectedDept] = useState<string>('Montevideo');
  const [_latestRun, setLatestRun] = useState<CalibrationRun | null>(null);
  const [proposals, setProposals] = useState<CalibrationProposal[]>([]);
  const [versionHistory, setVersionHistory] = useState<SettingsVersionRecord[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const breakdown = AskingDiscountAnalyzer.generateZoneBreakdown();
      setZoneAnalysis(breakdown);

      const gtService = GroundTruthService.getInstance();
      const allTx = gtService.getVerifiedTransactions();
      const suffReport = SampleSufficiencyEngine.getInstance().generateGlobalSufficiencyReport(allTx);
      setSufficiencyReport(suffReport);

      const lifecycle = SettingsLifecycleService.getInstance();
      setVersionHistory(lifecycle.getVersionHistory());

      const calibEngine = CalibrationEngine.getInstance();
      const existingProposals = Array.from(calibEngine.proposals.values());
      setProposals(existingProposals);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error cargando datos de calibración.');
    }
  };

  const handleRunBacktest = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const engine = CalibrationEngine.getInstance();
      const res = await engine.runBacktest({
        cutoffDate: selectedCutoffDate,
        department: selectedDept === 'ALL' ? undefined : selectedDept,
      });
      setBacktestResult(res);
      setSuccessMsg(`Backtesting ejecutado exitosamente sobre ${res.metrics.sampleCount} transacciones.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al ejecutar backtesting.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProposal = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const engine = CalibrationEngine.getInstance();
      const run = await engine.generateCalibrationRun('GLOBAL');
      setLatestRun(run);
      setProposals(Array.from(engine.proposals.values()));
      setSuccessMsg(`Propuesta Shadow generada. Se encontraron ${run.proposals.length} ajustes evaluables.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al generar propuesta de calibración.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProposal = (proposalId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const lifecycle = SettingsLifecycleService.getInstance();
      const newVersion = lifecycle.approveAndPromoteProposal({
        proposalId,
        superAdminUserId: 'super-admin-root',
        notes: 'Aprobado manualmente desde la Consola Super Admin tras validación empírica.',
      });

      setVersionHistory(lifecycle.getVersionHistory());
      setProposals(Array.from(CalibrationEngine.getInstance().proposals.values()));
      setSuccessMsg(`¡Versión V${newVersion.version} promovida exitosamente a PRODUCCIÓN!`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error aprobando propuesta.');
    }
  };

  const handleRollback = (targetVersion: number) => {
    if (!window.confirm(`¿Confirmás el rollback a los parámetros de la versión V${targetVersion}?`)) {
      return;
    }

    try {
      const lifecycle = SettingsLifecycleService.getInstance();
      const newVersion = lifecycle.rollbackToVersion({
        targetVersion,
        superAdminUserId: 'super-admin-root',
        reason: `Rollback preventivo a versión V${targetVersion} ejecutado por Super Admin.`,
      });

      setVersionHistory(lifecycle.getVersionHistory());
      setSuccessMsg(`Rollback completado. La configuración activa ahora es V${newVersion.version} (parámetros de V${targetVersion}).`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error ejecutando rollback.');
    }
  };

  const verifiedTxCount = GroundTruthService.getInstance().getVerifiedTransactions().length;
  const activeVersion = SettingsLifecycleService.getInstance().getActiveVersion();

  return (
    <div className="space-y-6 text-left">
      {/* HEADER DE LA SECCIÓN */}
      <div className="bg-gradient-to-r from-navy via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SUPER ADMIN CONSOLE — GOBERNANZA & MADUREZ ESTADÍSTICA</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Calibración, Ground Truth & Backtesting Temporal
            </h2>
            <p className="text-slate-300 text-xs max-w-2xl">
              Monitoreo empírico de negociación en Uruguay (Asking vs Closing), validación adaptativa LOOCV / Holdout, bootstrap de incertidumbre y gobernanza estricta de parámetros.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="text-right">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Versión Activa</span>
              <span className="text-sm font-black text-emerald-400">V{activeVersion.version} (12% Baseline)</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Ground Truth Verificado</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-navy">{verifiedTxCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Niveles 1, 2 y 3 (Escrituras + Peritajes)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Madurez Estadística</span>
            <Scale className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-navy">
            {sufficiencyReport?.globalMaturity || 'EARLY_SIGNAL'}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            N={verifiedTxCount} (Exploratorio temprano)
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Estrategia Validación</span>
            <History className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-black text-navy">
            {sufficiencyReport?.validationStrategy === 'LEAVE_ONE_OUT_CV' ? 'LOOCV Adaptativo' : 'Holdout'}
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">
            {verifiedTxCount < 20 ? 'Muestra < 20 (Sin split arbitrario)' : 'Split 70/30'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Gobernanza de Activación</span>
            <Lock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-black text-rose-600">
            {sufficiencyReport?.usableForGlobalActivation ? 'HABILITADA' : 'BLOQUEADA'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Requiere N ≥ 75 (Actual N={verifiedTxCount})
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        {[
          { id: 'groundtruth', label: '1. Descuento Oferta vs Cierre', icon: TrendingDown },
          { id: 'backtest', label: '2. Backtesting & Métricas Robustas', icon: History },
          { id: 'sufficiency', label: '3. Suficiencia por Segmento', icon: Layers },
          { id: 'calibration', label: '4. Propuestas Shadow & Gobernanza', icon: Sliders },
          { id: 'versions', label: '5. Historial de Versiones & Rollback', icon: RotateCcw },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubSection(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition ${
                isActive
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBSECCIÓN 1: ANÁLISIS DE DESCUENTO ASKING VS CLOSING */}
      {activeSubSection === 'groundtruth' && zoneAnalysis && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-navy">Análisis Empírico de Descuento de Negociación por Zona</h3>
              <p className="text-xs text-slate-500">
                Comparación sistemática de <code>observed_discount = (asking - closing) / asking</code> vs el baseline del 12.00%.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-xl text-xs font-semibold">
              {zoneAnalysis.interpretation}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Barrio / Zona</th>
                  <th className="p-3 text-center">Muestra Real</th>
                  <th className="p-3 text-center">Descuento Mediano</th>
                  <th className="p-3 text-center">Rango P25 - P75</th>
                  <th className="p-3 text-center">Mín / Máx</th>
                  <th className="p-3 text-center">Desvío vs 12% Baseline</th>
                  <th className="p-3 text-right">Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(zoneAnalysis.byNeighborhood).map(([neigh, stats]: [string, any]) => (
                  <tr key={neigh} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-navy flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>{neigh}</span>
                    </td>
                    <td className="p-3 text-center font-semibold">{stats.sampleCount}</td>
                    <td className="p-3 text-center font-bold text-navy">
                      {(stats.medianDiscount * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-center text-slate-600">
                      {(stats.p25 * 100).toFixed(1)}% — {(stats.p75 * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-center text-slate-500">
                      {(stats.minDiscount * 100).toFixed(1)}% / {(stats.maxDiscount * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-center font-semibold">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                        Math.abs(stats.baselineDifference) <= 0.02
                          ? 'bg-emerald-100 text-emerald-800'
                          : stats.baselineDifference > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {stats.baselineDifference > 0 ? '+' : ''}
                        {(stats.baselineDifference * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-600">
                      {Math.abs(stats.baselineDifference) <= 0.02
                        ? '✓ Calibrado'
                        : stats.baselineDifference > 0
                        ? 'Mayor negociación'
                        : 'Menor descuento'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBSECCIÓN 2: BACKTESTING TEMPORAL */}
      {activeSubSection === 'backtest' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy">Backtesting Histórico con Fecha de Corte</h3>
              <p className="text-xs text-slate-500">
                Garantía estricta de CERO DATA LEAKAGE: para cada transacción en fecha <i>t</i>, solo se usan datos previos a <i>t</i>.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={selectedCutoffDate}
                  onChange={(e) => setSelectedCutoffDate(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 font-semibold"
              >
                <option value="ALL">Todos los Departamentos</option>
                <option value="Montevideo">Montevideo</option>
                <option value="Maldonado">Maldonado</option>
              </select>

              <button
                onClick={handleRunBacktest}
                disabled={loading}
                className="px-4 py-2 bg-navy text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Ejecutar Backtest</span>
              </button>
            </div>
          </div>

          {backtestResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Muestra</span>
                  <span className="text-lg font-black text-slate-700">{backtestResult.metrics.sampleCount} tx</span>
                  <span className="text-[9px] font-semibold text-amber-600 block">{backtestResult.metrics.maturityLevel}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">MAE ($)</span>
                  <span className="text-lg font-black text-navy">US$ {backtestResult.metrics.mae.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-400 block">Error absoluto medio</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">MAPE (%)</span>
                  <span className="text-lg font-black text-emerald-600">{backtestResult.metrics.mape}%</span>
                  <span className="text-[9px] text-slate-400 block">
                    {backtestResult.metrics.bootstrap?.mape?.status === 'RELIABLE'
                      ? `IC 95%: [${backtestResult.metrics.bootstrap.mape.ciLow}%, ${backtestResult.metrics.bootstrap.mape.ciHigh}%]`
                      : 'Bootstrap N<10'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">MdAPE (%)</span>
                  <span className="text-lg font-black text-emerald-600">{backtestResult.metrics.mdape}%</span>
                  <span className="text-[9px] text-slate-400 block">Mediana APE</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sesgo (MSPE)</span>
                  <span className="text-lg font-black text-navy">
                    {backtestResult.metrics.bias > 0 ? '+' : ''}{backtestResult.metrics.bias}%
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {backtestResult.metrics.meanSignedError > 0 ? '+' : ''}US$ {Math.round(backtestResult.metrics.meanSignedError).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sobrevaluación</span>
                  <span className="text-lg font-black text-amber-600">{backtestResult.metrics.overvaluationRate}%</span>
                  <span className="text-[9px] text-slate-400 block">Pred &gt; Real</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Subvaluación</span>
                  <span className="text-lg font-black text-blue-600">{backtestResult.metrics.undervaluationRate}%</span>
                  <span className="text-[9px] text-slate-400 block">Pred &lt; Real</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cobertura</span>
                  <span className="text-lg font-black text-indigo-600">{backtestResult.metrics.coveragePercentage}%</span>
                  <span className="text-[9px] text-slate-400 block">En rango [min, max]</span>
                </div>
              </div>

              {/* BOOTSTRAP 95% CONFIDENCE INTERVALS BANNER */}
              {backtestResult.metrics.bootstrap?.mape?.status === 'RELIABLE' ? (
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-indigo-950">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span>Intervalos de Incertidumbre Bootstrap (500 iteraciones, 95% Confianza):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-indigo-900">
                    <div>
                      • <b>MAPE 95% CI:</b> [{backtestResult.metrics.bootstrap.mape.ciLow}%, {backtestResult.metrics.bootstrap.mape.ciHigh}%] (Puntual: {backtestResult.metrics.bootstrap.mape.pointEstimate}%)
                    </div>
                    <div>
                      • <b>Sesgo (MSPE) 95% CI:</b> [{backtestResult.metrics.bootstrap.bias?.ciLow}%, {backtestResult.metrics.bootstrap.bias?.ciHigh}%] (Puntual: {backtestResult.metrics.bootstrap.bias?.pointEstimate}%)
                    </div>
                    <div>
                      • <b>Cobertura 95% CI:</b> [{backtestResult.metrics.bootstrap.coverage?.ciLow}%, {backtestResult.metrics.bootstrap.coverage?.ciHigh}%] (Puntual: {backtestResult.metrics.bootstrap.coverage?.pointEstimate}%)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <b>Incertidumbre no confiable para Bootstrap:</b> Se requiere un mínimo de N ≥ 10 observaciones para calcular intervalos de confianza no sesgados (muestra evaluada N={backtestResult.metrics.sampleCount}).
                  </span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">ID Transacción</th>
                      <th className="p-3">Barrio</th>
                      <th className="p-3 text-right">Precio Real</th>
                      <th className="p-3 text-right">Tasación Estimada</th>
                      <th className="p-3 text-right">Error con Signo</th>
                      <th className="p-3 text-center">Clasificación Error</th>
                      <th className="p-3 text-center">Error Absoluto %</th>
                      <th className="p-3 text-center">¿En Rango?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {backtestResult.details.map((d) => (
                      <tr key={d.txId} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono text-[11px] text-slate-500">{d.txId}</td>
                        <td className="p-3 font-bold text-navy">{d.neighborhood}</td>
                        <td className="p-3 text-right font-semibold text-slate-700">US$ {d.actualPrice.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-navy">US$ {d.predictedPrice.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-semibold">
                          <span className={d.signedError > 0 ? 'text-amber-700' : d.signedError < 0 ? 'text-blue-700' : 'text-slate-700'}>
                            {d.signedError > 0 ? '+' : ''}US$ {d.signedError.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.signedError > 0
                              ? 'bg-amber-100 text-amber-800'
                              : d.signedError < 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {d.signedError > 0 ? 'SOBREVALUACIÓN' : d.signedError < 0 ? 'SUBVALUACIÓN' : 'EXACTO'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600">{d.pctError}%</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.withinRange ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {d.withinRange ? '✓ SÍ' : '✗ FUERA'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBSECCIÓN 3: SUFICIENCIA POR SEGMENTO */}
      {activeSubSection === 'sufficiency' && sufficiencyReport && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy">Matriz de Suficiencia y Madurez Estadística por Segmento</h3>
              <p className="text-xs text-slate-500">
                Gobernanza de granularidad: sólo se permite calibración o activación segmentada si el grupo cumple los umbrales mínimos de observaciones ($N \ge 15$).
              </p>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold border border-amber-200">
              Muestra Total: N={sufficiencyReport.totalSampleSize} ({sufficiencyReport.globalMaturity})
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Segmento</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-center">Muestra (N)</th>
                  <th className="p-3 text-center">Nivel Madurez</th>
                  <th className="p-3 text-center">¿Apto Reportes?</th>
                  <th className="p-3 text-center">¿Apto Calibración?</th>
                  <th className="p-3 text-center">¿Apto Activación?</th>
                  <th className="p-3">Diagnóstico / Advertencias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.values(sufficiencyReport.segments).map((seg) => (
                  <tr key={seg.segmentKey} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-navy">{seg.segmentKey}</td>
                    <td className="p-3 text-slate-500 font-mono">{seg.segmentType}</td>
                    <td className="p-3 text-center font-bold">{seg.sampleSize}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        seg.maturityLevel === 'STRONG_EVIDENCE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : seg.maturityLevel === 'STATISTICALLY_USEFUL'
                          ? 'bg-blue-100 text-blue-800'
                          : seg.maturityLevel === 'USABLE_WITH_CAUTION'
                          ? 'bg-teal-100 text-teal-800'
                          : seg.maturityLevel === 'EARLY_SIGNAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {seg.maturityLevel}
                      </span>
                    </td>
                    <td className="p-3 text-center font-semibold">
                      {seg.usableForReporting ? (
                        <span className="text-emerald-600">✓ Sí (N≥3)</span>
                      ) : (
                        <span className="text-rose-500">✗ No</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-semibold">
                      {seg.usableForCalibration ? (
                        <span className="text-emerald-600">✓ Sí</span>
                      ) : (
                        <span className="text-slate-400">✗ Muestra baja</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-semibold">
                      {seg.usableForActivation ? (
                        <span className="text-emerald-600">✓ Sí</span>
                      ) : (
                        <span className="text-rose-600 font-mono">🔒 Bloqueado</span>
                      )}
                    </td>
                    <td className="p-3 text-[11px] text-slate-500">
                      {seg.warnings.length > 0 ? seg.warnings.join('; ') : 'Muestra adecuada.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBSECCIÓN 4: PROPUESTAS SHADOW DE CALIBRACIÓN & GOBERNANZA */}
      {activeSubSection === 'calibration' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy">Propuestas de Calibración en Modo Shadow</h3>
              <p className="text-xs text-slate-500">
                Ninguna propuesta se aplica automáticamente en producción. Requiere muestra madura ($N \ge 75$) y aprobación explícita de un Super Admin.
              </p>
            </div>

            <button
              onClick={handleGenerateProposal}
              disabled={loading}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Generar Propuesta Shadow</span>
            </button>
          </div>

          {proposals.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Sliders className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No hay propuestas de calibración pendientes</p>
              <p className="text-[11px] text-slate-500">
                Hacé click en "Generar Propuesta Shadow" para evaluar posibles optimizaciones sobre los datos reales confirmados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((prop) => (
                <div
                  key={prop.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl font-mono text-xs font-bold">
                        {prop.id}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-navy">
                          Ajuste de Parámetros: {prop.parameterName}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono">{prop.parameterPath}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        prop.proposalStrength === 'STRONG'
                          ? 'bg-emerald-100 text-emerald-800'
                          : prop.proposalStrength === 'ACTIONABLE'
                          ? 'bg-blue-100 text-blue-800'
                          : prop.proposalStrength === 'PRELIMINARY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        FUERZA: {prop.proposalStrength} (N={prop.sampleSize})
                      </span>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        prop.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : prop.status === 'PENDING_REVIEW'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {prop.status === 'PENDING_REVIEW' ? '● PENDIENTE DE REVISIÓN' : prop.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Métricas Actuales (Antes)</span>
                      <div className="font-semibold text-slate-700">
                        MAPE: {prop.evidence.metricsBefore.mape}% | Cobertura: {prop.evidence.metricsBefore.coveragePercentage}% | Sesgo: {prop.evidence.metricsBefore.bias}%
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-1">Métricas Proyectadas (Después)</span>
                      <div className="font-bold text-emerald-700">
                        MAPE: {prop.evidence.metricsAfter.mape}% | Cobertura: {prop.evidence.metricsAfter.coveragePercentage}% | Sesgo: {prop.evidence.metricsAfter.bias}%
                      </div>
                    </div>
                  </div>

                  {/* BLOQUEO DE GOBERNANZA PARA MUESTRAS EXPLORATORIAS */}
                  {prop.proposalStrength === 'EXPLORATORY' && (
                    <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start space-x-2">
                      <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Bloqueo de Gobernanza Estadística Activo:</span>
                        <span className="text-[11px] text-rose-700">
                          Esta propuesta tiene fuerza <b>EXPLORATORY</b> con muestra N={prop.sampleSize}. Hipotecaly exige un mínimo de N ≥ 75 transacciones verificadas para autorizar la promoción de parámetros a producción. La propuesta puede inspeccionarse como evidencia exploratoria pero no puede activarse.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-600 font-medium">
                      💡 {prop.expectedImpact}
                    </p>

                    {prop.status === 'PENDING_REVIEW' && (
                      <button
                        onClick={() => handleApproveProposal(prop.id)}
                        disabled={prop.proposalStrength === 'EXPLORATORY' || !prop.isEligibleForActivation}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
                          prop.proposalStrength === 'EXPLORATORY' || !prop.isEligibleForActivation
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            : 'bg-navy text-white hover:bg-slate-800'
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${prop.proposalStrength === 'EXPLORATORY' ? 'text-slate-400' : 'text-emerald-400'}`} />
                        <span>Aprobar y Promover a Producción</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBSECCIÓN 4: HISTORIAL DE VERSIONES & ROLLBACK */}
      {activeSubSection === 'versions' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-navy">Historial de Versiones de Configuración del Tasador</h3>
            <p className="text-xs text-slate-500">
              Inmutabilidad garantizada: las tasaciones históricas conservan sus parámetros originales. Podés ejecutar un Rollback a cualquier versión previa en cualquier momento.
            </p>
          </div>

          <div className="space-y-3">
            {versionHistory.map((v) => (
              <div
                key={v.version}
                className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                  v.status === 'ACTIVE'
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl font-black text-sm ${
                    v.status === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    V{v.version}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-navy">
                        Factor Asking: {(v.settings.askingPriceAdjustment * 100).toFixed(2)}%
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'DEPRECATED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {v.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{v.changeSummary}</p>
                    <span className="text-[10px] text-slate-400">
                      Desde: {new Date(v.effectiveFrom).toLocaleDateString()} {v.effectiveTo ? `hasta ${new Date(v.effectiveTo).toLocaleDateString()}` : '(Vigente)'}
                    </span>
                  </div>
                </div>

                {v.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleRollback(v.version)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rollback a V{v.version}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
