// ==============================================================================
// HIPOTECALY TASADOR IA - PANTALLA DE SELECCIÓN Y VALIDACIÓN DE COMPARABLES (PARTE 2)
// Human-in-the-Loop: Mapa interactivo, tarjetas, tabla comparativa, exclusiones y métricas
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { useTenant } from '../../contexts/TenantContext';
import { AppraisalService } from '../../lib/tasador/appraisal/AppraisalService';
import { ValuationResultView } from '../../components/tasador/ValuationResultView';
import { AppraisalDossierView } from '../../components/tasador/AppraisalDossierView';
import {
  AppraisalRecord,
  AppraisalComparableItem,
  SearchComparablesFilterParams,
  AppraisalValuationRun,
  AppraisalAuditLog,
  AppraisalReportMetadata,
} from '../../lib/tasador/appraisal/appraisalTypes';
import { InteractiveMap } from '../../components/tasador/InteractiveMap';
import { ComparableCard } from '../../components/tasador/ComparableCard';
import { ComparablesTable } from '../../components/tasador/ComparablesTable';
import { ExclusionModal } from '../../components/tasador/ExclusionModal';
import { SetQualityIndicator } from '../../components/tasador/SetQualityIndicator';
import {
  Compass,
  SlidersHorizontal,
  CheckCircle2,
  Calculator,
  ArrowLeft,
  Filter,
  Sparkles,
  Layers,
} from 'lucide-react';

export const TasadorComparablesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const baseRoute = `/demo/${tenant.slug || 'estudio-nova'}/admin`;

  const [appraisal, setAppraisal] = useState<AppraisalRecord | null>(null);
  const [comparables, setComparables] = useState<AppraisalComparableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedMapCompId, setSelectedMapCompId] = useState<string | null>(null);

  // Etapas del Flujo (Parte 2 vs Parte 3)
  const [activeStage, setActiveStage] = useState<'comparables' | 'valuation' | 'dossier'>('comparables');
  const [runs, setRuns] = useState<AppraisalValuationRun[]>([]);
  const [currentRun, setCurrentRun] = useState<AppraisalValuationRun | null>(null);
  const [auditLogs, setAuditLogs] = useState<AppraisalAuditLog[]>([]);
  const [reports, setReports] = useState<AppraisalReportMetadata[]>([]);
  const [isCalculatingValuation, setIsCalculatingValuation] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Modal de Exclusión
  const [modalComp, setModalComp] = useState<AppraisalComparableItem | null>(null);
  const [isExclusionModalOpen, setIsExclusionModalOpen] = useState(false);

  // Filtros del Analista
  const [showFilters, setShowFilters] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(2500);
  const [surfaceTolerancePct, setSurfaceTolerancePct] = useState(25);
  const [exactBedrooms, setExactBedrooms] = useState(false);
  const [minQualityScore, setMinQualityScore] = useState(70);
  const [allowPartial, setAllowPartial] = useState(true);

  // Notificación de éxito
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (id && tenant.id) {
      loadAppraisalAndSearch();
    }
  }, [id, tenant.id]);

  const loadAppraisalAndSearch = async () => {
    if (!id) return;
    setLoading(true);
    const service = AppraisalService.getInstance();
    try {
      const record = await service.getAppraisal(id, tenant.id);
      if (!record) {
        setLoading(false);
        return;
      }
      setAppraisal(record);

      // Cargar historial de runs, auditoría y reportes asociados
      const recRuns = service.getValuationRuns(id);
      setRuns(recRuns);
      if (recRuns.length > 0) {
        setCurrentRun(recRuns[recRuns.length - 1]);
      } else if (record.currentRun) {
        setCurrentRun(record.currentRun);
      }
      setAuditLogs(service.getAuditLogs(id));
      setReports(service.getReports(id));

      if (['VALUATED', 'REPORT_GENERATED', 'FINALIZED'].includes(record.status)) {
        setActiveStage('valuation');
      }

      // Si ya tiene comparables guardados, mostrarlos directamente
      if (record.comparables && record.comparables.length > 0) {
        setComparables(record.comparables);
        setLoading(false);
      } else {
        // Ejecutar búsqueda server-side de comparables
        await executeSearch(record);
      }
    } catch (err) {
      console.error('[TasadorComparablesPage] Error loading appraisal:', err);
      setLoading(false);
    }
  };

  const executeSearch = async (currentAppraisal?: AppraisalRecord) => {
    const target = currentAppraisal || appraisal;
    if (!target) return;

    setSearching(true);
    const service = AppraisalService.getInstance();
    const filterParams: SearchComparablesFilterParams = {
      radiusMeters,
      surfaceTolerancePct,
      exactBedrooms,
      minQualityScore,
      allowPartialEligibility: allowPartial,
    };

    try {
      const searchRes = await service.searchComparablesServerSide({
        targetProperty: target.propertyInput,
        organizationId: tenant.id,
        filters: filterParams,
      });

      setComparables(searchRes.candidates);

      // Guardar comparables asociados
      const updated = await service.saveComparablesReview({
        appraisalId: target.id,
        organizationId: tenant.id,
        comparables: searchRes.candidates,
        stats: searchRes.stats,
        setQuality: searchRes.setQuality,
        nextStatus: 'COMPARABLES_FOUND',
      });

      if (updated) {
        setAppraisal(updated);
      }
    } catch (err) {
      console.error('[TasadorComparablesPage] Error searching comparables:', err);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  // Human-in-the-Loop: Abrir modal de exclusión
  const handleOpenExclusionModal = (comp: AppraisalComparableItem) => {
    setModalComp(comp);
    setIsExclusionModalOpen(true);
  };

  // Human-in-the-Loop: Confirmar exclusión
  const handleConfirmExclusion = async (reason: string, note?: string) => {
    if (!modalComp || !appraisal) return;

    const updated = comparables.map((c) =>
      c.id === modalComp.id
        ? {
            ...c,
            selected: false,
            exclusionReason: reason,
            analystNote: note || null,
          }
        : c
    );

    setComparables(updated);
    setIsExclusionModalOpen(false);
    setModalComp(null);

    // Recalcular estadísticas del set
    const service = AppraisalService.getInstance();
    const newStats = service.calculateDescriptiveStats(updated);
    const newQuality =
      newStats.selectedCount >= 4 && newStats.dispersionPercentage < 20 ? 'ALTA' : 'MEDIA';

    await service.saveComparablesReview({
      appraisalId: appraisal.id,
      organizationId: tenant.id,
      comparables: updated,
      stats: newStats,
      setQuality: newQuality,
      nextStatus: 'COMPARABLES_REVIEWED',
    });

    setAppraisal((prev) =>
      prev
        ? {
            ...prev,
            comparables: updated,
            descriptiveStats: newStats,
            setQuality: newQuality,
            selectedComparablesCount: newStats.selectedCount,
            status: 'COMPARABLES_REVIEWED',
          }
        : null
    );
  };

  // Human-in-the-Loop: Re-incluir comparable
  const handleReInclude = async (id: string) => {
    if (!appraisal) return;

    const updated = comparables.map((c) =>
      c.id === id
        ? {
            ...c,
            selected: true,
            exclusionReason: null,
            analystNote: null,
          }
        : c
    );

    setComparables(updated);

    const service = AppraisalService.getInstance();
    const newStats = service.calculateDescriptiveStats(updated);
    const newQuality =
      newStats.selectedCount >= 4 && newStats.dispersionPercentage < 20 ? 'ALTA' : 'MEDIA';

    await service.saveComparablesReview({
      appraisalId: appraisal.id,
      organizationId: tenant.id,
      comparables: updated,
      stats: newStats,
      setQuality: newQuality,
      nextStatus: 'COMPARABLES_REVIEWED',
    });

    setAppraisal((prev) =>
      prev
        ? {
            ...prev,
            comparables: updated,
            descriptiveStats: newStats,
            setQuality: newQuality,
            selectedComparablesCount: newStats.selectedCount,
            status: 'COMPARABLES_REVIEWED',
          }
        : null
    );
  };

  // Finalizar Parte 2 y dejar preparado el set definitivo para el motor
  const handlePrepareForValuation = async () => {
    if (!appraisal) return;
    const service = AppraisalService.getInstance();
    const stats = service.calculateDescriptiveStats(comparables);

    if (stats.selectedCount < 1) {
      alert('Debes mantener al menos 1 comparable seleccionado para continuar a la tasación.');
      return;
    }

    const updated = await service.saveComparablesReview({
      appraisalId: appraisal.id,
      organizationId: tenant.id,
      comparables,
      stats,
      setQuality: appraisal.setQuality,
      nextStatus: 'READY_FOR_VALUATION',
    });

    if (updated) {
      setAppraisal(updated);
      setSuccessNotice('Conjunto de comparables validado con éxito. Estado: LISTO PARA TASACIÓN (READY_FOR_VALUATION).');
      setTimeout(() => setSuccessNotice(null), 5000);
    }
  };

  // Ejecutar Valoración Definitiva (Parte 3)
  const handleCalculateValuation = async () => {
    if (!appraisal) return;
    const includedCount = comparables.filter((c) => c.selected || c.status === 'INCLUDED').length;
    if (includedCount < 3) {
      alert('Se requieren al menos 3 comparables seleccionados para ejecutar la tasación matemática certificada (N >= 3).');
      return;
    }

    setIsCalculatingValuation(true);
    try {
      const service = AppraisalService.getInstance();
      const res = await service.calculateValuation({
        appraisalId: appraisal.id,
        organizationId: tenant.id,
        userEmail: 'analista@estudio-nova.com',
      });
      setAppraisal(res.appraisal);
      setCurrentRun(res.run);
      setRuns(service.getValuationRuns(appraisal.id));
      setAuditLogs(service.getAuditLogs(appraisal.id));
      setActiveStage('valuation');
      setSuccessNotice(`Valoración ejecutada con éxito (RUN #${res.run.runNumber}). Valor central estimado: USD ${res.run.estimatedMarketValue.toLocaleString('es-UY')}`);
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err: any) {
      console.error('[handleCalculateValuation] Error:', err);
      alert(err.message || 'Error al calcular valoración.');
    } finally {
      setIsCalculatingValuation(false);
    }
  };

  // Descarga del Informe Técnico PDF (Parte 3)
  const handleDownloadPdf = async () => {
    if (!appraisal || !currentRun) return;
    setIsDownloadingPdf(true);
    try {
      const service = AppraisalService.getInstance();
      const { report, pdfBytes } = await service.generateReportPdf({
        appraisalId: appraisal.id,
        organizationId: tenant.id,
        runId: currentRun.id,
        userEmail: 'analista@estudio-nova.com',
        branding: {
          organizationName: tenant.name || 'Hipotecaly Private Banking',
          primaryColorHex: '#102d49',
          reportTitle: `INFORME TÉCNICO DE TASACIÓN - ${appraisal.propertyInput.propertyType.toUpperCase()} EN ${appraisal.location.neighborhood?.toUpperCase() || appraisal.location.city?.toUpperCase()}`,
        },
      });

      const updated = await service.getAppraisal(appraisal.id, tenant.id);
      if (updated) setAppraisal(updated);
      setReports(service.getReports(appraisal.id));
      setAuditLogs(service.getAuditLogs(appraisal.id));

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessNotice(`Informe PDF generado y descargado: ${report.fileName}`);
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err: any) {
      console.error('[handleDownloadPdf] Error:', err);
      alert(err.message || 'Error al generar informe PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Finalización Formal de la Tasación (Parte 3)
  const handleFinalizeAppraisal = async () => {
    if (!appraisal) return;
    const confirm = window.confirm(
      '¿Confirmas el cierre formal y archivo definitivo de esta tasación? El estado pasará a FINALIZADA.'
    );
    if (!confirm) return;

    try {
      const service = AppraisalService.getInstance();
      const updated = await service.finalizeAppraisal({
        appraisalId: appraisal.id,
        organizationId: tenant.id,
        userEmail: 'analista@estudio-nova.com',
      });
      setAppraisal(updated);
      setAuditLogs(service.getAuditLogs(appraisal.id));
      setSuccessNotice('Tasación finalizada y archivada formalmente con éxito.');
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error al finalizar tasación.');
    }
  };

  if (loading) {
    return (
      <BackofficeLayout>
        <div className="p-16 text-center text-xs text-slate-400">
          <div className="w-8 h-8 border-2 border-[#102d49] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Cargando tasación y consultando la Base Inmobiliaria...
        </div>
      </BackofficeLayout>
    );
  }

  if (!appraisal) {
    return (
      <BackofficeLayout>
        <div className="p-16 text-center space-y-3">
          <h3 className="text-base font-bold text-slate-700">Tasación no encontrada</h3>
          <p className="text-xs text-slate-500">
            La tasación solicitada no existe o no pertenece a esta organización.
          </p>
          <button
            onClick={() => navigate(`${baseRoute}/tasaciones`)}
            className="px-4 py-2 bg-[#102d49] text-white rounded-xl text-xs font-bold"
          >
            Volver a Tasaciones
          </button>
        </div>
      </BackofficeLayout>
    );
  }

  const prop = appraisal.propertyInput;
  const loc = appraisal.location;
  const stats =
    appraisal.descriptiveStats ||
    AppraisalService.getInstance().calculateDescriptiveStats(comparables);

  return (
    <BackofficeLayout>
      <div className="max-w-7xl mx-auto space-y-6 text-left pb-16">
        {/* Breadcrumb y Controles Superiores */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
              <button
                onClick={() => navigate(`${baseRoute}/tasaciones`)}
                className="hover:text-[#102d49] transition-colors flex items-center space-x-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Tasador IA</span>
              </button>
              <span>/</span>
              <span className="text-slate-600 font-semibold truncate max-w-xs">
                {prop.propertyType} en {loc.neighborhood || loc.city}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
                {activeStage === 'comparables'
                  ? 'Selección y Validación de Comparables'
                  : activeStage === 'valuation'
                  ? 'Dictamen de Valoración Técnica'
                  : 'Expediente Inmutable y Auditoría'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
                {appraisal.status}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {activeStage === 'comparables'
                ? 'Revisa los inmuebles candidatos encontrados en la Base Inmobiliaria y ajusta el conjunto de evidencia.'
                : activeStage === 'valuation'
                ? 'Estimación de valor de mercado certificada basada en evidencia estadística de mercado.'
                : 'Registro completo de trazabilidad, historial de ejecuciones y certificaciones documentales.'}
            </p>
          </div>

          {activeStage === 'comparables' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition-all ${
                  showFilters
                    ? 'bg-[#102d49] text-white border-[#102d49]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtros</span>
              </button>

              {/* Alternador de Vista Tarjetas vs Tabla */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-[#102d49] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tarjetas & Mapa
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-[#102d49] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Matriz Tabla
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selector de Etapa del Flujo (Parte 2 vs Parte 3) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveStage('comparables')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeStage === 'comparables'
                ? 'bg-[#102d49] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>1. Comparables & Evidencia ({stats.selectedCount})</span>
          </button>

          <button
            onClick={() => {
              if (currentRun) {
                setActiveStage('valuation');
              } else {
                handleCalculateValuation();
              }
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeStage === 'valuation'
                ? 'bg-[#102d49] text-white shadow-sm'
                : currentRun
                ? 'text-slate-600 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#f4b43b]" />
            <span>2. Resultado de Valoración</span>
            {currentRun && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-900 text-[10px] font-mono">
                USD {currentRun.estimatedMarketValue.toLocaleString('es-UY')}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveStage('dossier')}
            disabled={!currentRun && runs.length === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              activeStage === 'dossier'
                ? 'bg-[#102d49] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Expediente Inmutable</span>
            {runs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                {runs.length} {runs.length === 1 ? 'RUN' : 'RUNS'}
              </span>
            )}
          </button>
        </div>

        {/* Notificación de Éxito */}
        {successNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-3 text-xs animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successNotice}</span>
          </div>
        )}

        {/* VISTA 1: COMPARABLES & EVIDENCIA */}
        {activeStage === 'comparables' && (
          <>
            {/* Ficha Resumen del Inmueble Objetivo */}
            <div className="bg-[#102d49] text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-[#102d49] bg-[#f4b43b] px-2 py-0.5 rounded uppercase tracking-wider">
                    INMUEBLE A TASAR
                  </span>
                  <span className="text-xs text-slate-300 capitalize font-medium">
                    {prop.propertyType} • {prop.surfaces?.totalAreaM2 || prop.surfaces?.builtAreaM2} m²
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold">
                  {[loc.streetName, loc.streetNumber].filter(Boolean).join(' ') || 'Dirección no declarada'}, {loc.neighborhood || loc.city}, {loc.department}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-0.5">
                  <span>{prop.layout?.bedrooms} dorms</span>
                  <span>•</span>
                  <span>{prop.layout?.bathrooms} baños</span>
                  <span>•</span>
                  <span>{prop.layout?.garages ? `${prop.layout.garages} garaje(s)` : 'Sin garaje'}</span>
                  <span>•</span>
                  <span className="capitalize">{prop.condition}</span>
                  {prop.constructionYear && (
                    <>
                      <span>•</span>
                      <span>Año {prop.constructionYear}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                <button
                  onClick={() => navigate(`${baseRoute}/tasaciones/nueva`)}
                  className="text-xs text-slate-300 hover:text-white underline"
                >
                  Editar datos del inmueble
                </button>
              </div>
            </div>

            {/* Panel Desplegable de Filtros del Analista */}
            {showFilters && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-[#102d49]" />
                    <h4 className="font-bold text-[#102d49]">Parámetros de Búsqueda de Comparables</h4>
                  </div>
                  <button
                    onClick={() => executeSearch()}
                    disabled={searching}
                    className="bg-[#102d49] text-white px-4 py-1.5 rounded-xl font-bold text-xs hover:bg-[#153a5e] transition-all"
                  >
                    {searching ? 'Buscando...' : 'Aplicar y Recalcular'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Radio Máximo: {(radiusMeters / 1000).toFixed(1)} km
                    </label>
                    <input
                      type="range"
                      min="500"
                      max="10000"
                      step="500"
                      value={radiusMeters}
                      onChange={(e) => setRadiusMeters(Number(e.target.value))}
                      className="w-full accent-[#102d49]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>500 m</span>
                      <span>10 km</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Tolerancia Superficie: ±{surfaceTolerancePct}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={surfaceTolerancePct}
                      onChange={(e) => setSurfaceTolerancePct(Number(e.target.value))}
                      className="w-full accent-[#102d49]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>±10%</span>
                      <span>±50%</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Calidad Mínima Dato: {minQualityScore} pts
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      step="5"
                      value={minQualityScore}
                      onChange={(e) => setMinQualityScore(Number(e.target.value))}
                      className="w-full accent-[#102d49]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>50 pts</span>
                      <span>90 pts</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center space-x-2 text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exactBedrooms}
                        onChange={(e) => setExactBedrooms(e.target.checked)}
                        className="rounded accent-[#102d49]"
                      />
                      <span>Mismo nº de dormitorios</span>
                    </label>
                    <label className="flex items-center space-x-2 text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowPartial}
                        onChange={(e) => setAllowPartial(e.target.checked)}
                        className="rounded accent-[#102d49]"
                      />
                      <span>Permitir elegibilidad parcial</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Indicador de Calidad del Set y Métricas Descriptivas */}
            <SetQualityIndicator
              stats={stats}
              quality={appraisal.setQuality}
            />

            {/* Selector de Contenido: Mapa + Tarjetas O Tabla Matriz */}
            {viewMode === 'cards' ? (
              <div className="space-y-6">
                {/* Mapa Interactivo con Polígono de Radio y Marcadores */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#102d49] uppercase tracking-wider">
                      Distribución Espacial de Comparables
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Radio activo: {(radiusMeters / 1000).toFixed(1)} km
                    </span>
                  </div>
                  <InteractiveMap
                    targetLocation={loc}
                    comparables={comparables}
                    selectedCandidateId={selectedMapCompId}
                    onSelectCandidate={(candId: string) => setSelectedMapCompId(candId)}
                  />
                </div>

                {/* Listado de Tarjetas de Comparables */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#102d49]">
                      Candidatos Comparables Encontrados ({comparables.length})
                    </h3>
                    <span className="text-xs text-slate-500">
                      Ordenados determinísticamente por score de similitud
                    </span>
                  </div>

                  {comparables.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <Compass className="w-10 h-10 text-slate-300 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-700">
                        No encontramos suficientes comparables confiables con los criterios actuales
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Intenta ampliar el radio de búsqueda, relajar la tolerancia de superficie o permitir elegibilidad parcial.
                      </p>
                      <button
                        onClick={() => {
                          setRadiusMeters(5000);
                          setSurfaceTolerancePct(35);
                          setAllowPartial(true);
                          executeSearch();
                        }}
                        className="px-4 py-2 bg-[#102d49] text-white rounded-xl text-xs font-bold hover:bg-[#153a5e] transition-all"
                      >
                        Ampliar Búsqueda Automáticamente
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {comparables.map((comp) => (
                        <ComparableCard
                          key={comp.id}
                          comparable={comp}
                          isSelectedForMap={selectedMapCompId === comp.id}
                          onSelectForMap={() => setSelectedMapCompId(comp.id)}
                          onToggleInclude={() => handleReInclude(comp.id)}
                          onExcludeWithReason={() => handleOpenExclusionModal(comp)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <ComparablesTable
                target={prop}
                comparables={comparables}
                onToggleInclude={(compId) => handleReInclude(compId)}
                onExcludeWithReason={(comp) => handleOpenExclusionModal(comp)}
              />
            )}

            {/* Barra Inferior Fija de Cierre de Parte 2 y Ejecución de Parte 3 */}
            <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-300 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
                  {stats.selectedCount}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#102d49]">
                    {stats.selectedCount} comparables seleccionados para la tasación
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Mediana: USD {stats.medianPriceUsd.toLocaleString('es-UY')} (USD {stats.medianPricePerM2Usd}/m²)
                    {stats.selectedCount < 3 && (
                      <span className="ml-2 text-rose-600 font-bold">
                        (Mínimo 3 requeridos para valuar)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(`${baseRoute}/tasaciones`)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Guardar y Salir
                </button>
                <button
                  onClick={handlePrepareForValuation}
                  disabled={stats.selectedCount === 0}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs tracking-wide transition-all disabled:opacity-50"
                >
                  Guardar Set
                </button>
                <button
                  onClick={handleCalculateValuation}
                  disabled={stats.selectedCount < 3 || isCalculatingValuation}
                  className="px-6 py-2.5 bg-[#102d49] hover:bg-[#153a5e] text-white rounded-xl font-bold text-xs tracking-wide shadow-md flex items-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCalculatingValuation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Calculando Tasación...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#f4b43b]" />
                      <span>Calcular Valoración Definitiva</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* VISTA 2: RESULTADO DE VALORACIÓN (PARTE 3) */}
        {activeStage === 'valuation' && (
          <>
            {currentRun ? (
              <ValuationResultView
                appraisal={appraisal}
                run={currentRun}
                onModifyComparables={() => setActiveStage('comparables')}
                onDownloadPdf={handleDownloadPdf}
                onFinalizeAppraisal={handleFinalizeAppraisal}
                onViewDossier={() => setActiveStage('dossier')}
                isDownloadingPdf={isDownloadingPdf}
              />
            ) : (
              <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <Sparkles className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-base font-bold text-[#102d49]">
                  Aún no se ha calculado la valoración definitiva
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  El conjunto de comparables cuenta con {stats.selectedCount} unidades seleccionadas. Ejecuta el cálculo matemático certificado para obtener el valor central y el rango.
                </p>
                <button
                  onClick={handleCalculateValuation}
                  disabled={stats.selectedCount < 3 || isCalculatingValuation}
                  className="px-6 py-2.5 bg-[#102d49] hover:bg-[#153a5e] text-white rounded-xl font-bold text-xs tracking-wide shadow-md inline-flex items-center space-x-2"
                >
                  <Calculator className="w-4 h-4 text-[#f4b43b]" />
                  <span>Ejecutar Valoración Ahora</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* VISTA 3: EXPEDIENTE INMUTABLE Y AUDITORÍA (PARTE 3) */}
        {activeStage === 'dossier' && (
          <AppraisalDossierView
            appraisal={appraisal}
            runs={runs}
            auditLogs={auditLogs}
            reports={reports}
            onBackToResult={() => setActiveStage('valuation')}
            onDownloadPdf={handleDownloadPdf}
            isDownloadingPdf={isDownloadingPdf}
          />
        )}

        {/* Modal de Exclusión */}
        <ExclusionModal
          isOpen={isExclusionModalOpen}
          comparable={modalComp}
          onConfirm={handleConfirmExclusion}
          onCancel={() => {
            setIsExclusionModalOpen(false);
            setModalComp(null);
          }}
        />
      </div>
    </BackofficeLayout>
  );
};
