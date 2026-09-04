// ==============================================================================
// HIPOTECALY AI: Pestaña Integral del Expediente (10 Secciones + UX de Consumo)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Compass,
  Scale,
  Database,
  Check,
  Edit3,
  HelpCircle,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { aiService } from '../../lib/aiService';
import { supabase } from '../../lib/supabase';
import { HipotecalyAiReport, AiEstimationResult, AiWalletState, MANDATORY_AI_DISCLAIMER } from '../../lib/ai/types';

interface HipotecalyAiTabProps {
  app: any;
  onRefresh?: () => void;
}

export const HipotecalyAiTab: React.FC<HipotecalyAiTabProps> = ({ app, onRefresh }) => {
  const [report, setReport] = useState<HipotecalyAiReport | null>(null);
  const [wallet, setWallet] = useState<AiWalletState | null>(null);
  const [estimation, setEstimation] = useState<AiEstimationResult | null>({
    estimatedCaseUnitsMin: 0.15,
    estimatedCaseUnitsMax: 0.35,
    estimatedCostUsdMin: 0.075,
    estimatedCostUsdMax: 0.175,
    currentBalanceCases: 10.0,
    projectedBalanceCasesMin: 9.85,
    projectedBalanceCasesMax: 9.65,
    isHighConsumption: false,
    pagesCount: 10,
    imagesCount: 2,
    documentsCount: 3,
    cachedDocumentsCount: 0,
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [analyzingStage, setAnalyzingStage] = useState('');
  const [showEstimationModal, setShowEstimationModal] = useState(false);
  const [selectedRunType, setSelectedRunType] = useState<'preliminary' | 'full' | 'deep'>('full');
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Estados para corrección humana
  const [activeCorrectionItem, setActiveCorrectionItem] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionSuccessMsg, setCorrectionSuccessMsg] = useState('');
  const [isAiActive, setIsAiActive] = useState(true);

  const orgId = app.organization_id || 'd0000000-0000-0000-0000-000000000001';

  // Cargar saldo y estimación inicial
  useEffect(() => {
    async function loadWalletAndEst() {
      // 0. Verificar si HIPOTECALY AI está activado globalmente
      try {
        const { data, error } = await supabase
          .from('ai_provider_settings')
          .select('ai_enabled')
          .eq('provider', 'openai');


        if (!error && data) {
          const row = Array.isArray(data) ? data[0] : (data as any);
          if (row && (row.ai_enabled === false || row.ai_enabled === 'false')) {
            setIsAiActive(false);
            return;
          } else {
            setIsAiActive(true);
          }
        }
      } catch (e) {
        console.error('[DEBUG AI TAB ERROR]', e);
      }

      const w = await aiService.getWalletState(orgId);
      setWallet(w);

      const docsCount = app.documents?.length || 3;
      const photosCount = app.photos?.length || 2;
      const est = await aiService.estimateCaseConsumption({
        organizationId: orgId,
        pagesCount: Math.max(docsCount * 2, 4),
        imagesCount: photosCount,
        documentsCount: docsCount,
        runType: selectedRunType,
      });
      setEstimation(est);
    }
    loadWalletAndEst();
  }, [app?.id, orgId, selectedRunType]);

  const handleStartAnalysis = async (runType: 'preliminary' | 'full' | 'deep') => {
    setShowEstimationModal(false);
    setAnalyzing(true);
    setAnalyzingProgress(15);
    setAnalyzingStage('Analizando legajo e ingesta incremental...');

    const interval = setInterval(() => {
      setAnalyzingProgress((prev) => {
        if (prev < 40) {
          setAnalyzingStage('Extrayendo datos de padrón y titularidad...');
          return prev + 15;
        }
        if (prev < 75) {
          setAnalyzingStage('Calculando tasación conservadora y comparables...');
          return prev + 15;
        }
        if (prev < 90) {
          setAnalyzingStage('Evaluando underwriting y semáforos de riesgo...');
          return prev + 8;
        }
        return prev;
      });
    }, 300);

    try {
      const docs = (app.documents || []).map((d: any) => ({
        id: d.id,
        fileName: d.file_name || d.name || 'documento.pdf',
        mimeType: d.mime_type,
        fileSizeBytes: d.file_size || 80000,
        contentSnippet: `Padrón: ${app.property?.cadastral_number || '12345'} | Titular: ${app.borrower?.first_name || 'Juan'} ${app.borrower?.last_name || 'Pérez'} | Superficie: ${app.property?.surface_m2 || 85} m2`,
      }));

      // Si no hay documentos cargados en el expediente demo, agregar comprobantes sintéticos
      if (docs.length === 0) {
        docs.push(
          {
            id: 'doc_synth_1',
            fileName: 'Escritura_Compraventa_Inmueble.pdf',
            fileSizeBytes: 120000,
            contentSnippet: `Escritura pública. Padrón número ${app.property?.cadastral_number || '98765'}. Titular: ${app.borrower?.first_name || 'Juan'} ${app.borrower?.last_name || 'Pérez'}. Superficie: ${app.property?.surface_m2 || 80} m2.`,
          },
          {
            id: 'doc_synth_2',
            fileName: 'Recibo_Haberes_BPS.pdf',
            fileSizeBytes: 65000,
            contentSnippet: `Recibo de sueldo. Haberes nominales: UYU 95.000. Descuentos jubilatorios BPS.`,
          }
        );
      }

      const res = await aiService.runCaseAnalysis({
        applicationId: app.id,
        organizationId: orgId,
        requestedAmount: Number(app.requested_amount) || 50000,
        currency: app.currency || 'USD',
        termMonths: app.term_months || 36,
        borrower: {
          id: app.borrower?.id,
          firstName: app.borrower?.first_name || 'Solicitante',
          lastName: app.borrower?.last_name || 'Hipotecario',
          idNumber: app.borrower?.id_number || '4.123.456-7',
          declaredIncome: 95000,
          clearingStatus: app.borrower?.clearing_status || 'verified',
        },
        property: {
          id: app.property?.id,
          propertyType: app.property?.property_type || 'casa',
          department: app.property?.department || 'Montevideo',
          locality: app.property?.city || 'Pocitos',
          address: app.property?.address || 'Av. Brasil 2850',
          cadastralNumber: app.property?.cadastral_number || '98765',
          surfaceM2: Number(app.property?.surface_m2) || 80,
          estimatedValue: Number(app.property?.estimated_value) || 120000,
          legalStatus: app.property?.legal_status || 'libre_gravamenes',
          condition: 'muy_bueno',
        },
        documents: docs,
        photos: app.photos || [],
        runType,
      });

      clearInterval(interval);
      setAnalyzingProgress(100);
      setReport(res.report);

      // Actualizar saldo
      const updatedW = await aiService.getWalletState(orgId);
      setWallet(updatedW);

      if (onRefresh) onRefresh();
    } catch (err) {
      clearInterval(interval);
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCorrectionSubmit = async (itemKey: string, action: 'confirm' | 'correct' | 'request_doc' | 'incorrect_ai') => {
    await aiService.submitHumanCorrection({
      applicationId: app.id,
      itemCategory: itemKey,
      action,
      originalAiOutput: report,
      humanCorrectionText: correctionText || `Acción aplicada: ${action}`,
      correctionReason: correctionReason || 'Validación profesional del analista',
      department: app.property?.department || 'Montevideo',
      propertyType: app.property?.property_type || 'casa',
    });

    setActiveCorrectionItem(null);
    setCorrectionText('');
    setCorrectionReason('');
    setCorrectionSuccessMsg('Retroalimentación registrada e indexada en memoria global.');
    setTimeout(() => setCorrectionSuccessMsg(''), 4000);
  };

  if (!isAiActive) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-navy">HIPOTECALY AI no está disponible temporalmente.</h3>
          <p className="text-xs text-slate-500">
            El resto de las funcionalidades del expediente (legajo, documentos, tasación y workflow) continúan operando con normalidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-slate-800">
      {/* -------------------------------------------------------------------------- */}
      {/* HEADER PRINCIPAL Y BARRA DE SALDO AI */}
      {/* -------------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-navy via-slate-900 to-navy text-white rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-green/20 rounded-xl border border-brand-green/40">
                <Sparkles className="w-6 h-6 text-brand-green animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">HIPOTECALY AI CORE</h2>
                <p className="text-xs text-slate-300">
                  Agente Orquestador Central de Inteligencia Hipotecaria e Inmobiliaria
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Widget de Saldo del Estudio */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-left min-w-[200px]">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Saldo disponible</span>
                <span className="font-bold text-brand-green">{wallet?.totalCaseBalance || 10.0} CASOS</span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden mb-1.5">
                <div
                  className="bg-brand-green h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((wallet?.totalCaseBalance || 10) / 10) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Promo: {wallet?.promotionalCaseBalance || 10.0}</span>
                <span>Comprado: {wallet?.purchasedCaseBalance || 0.0}</span>
              </div>
            </div>

            {/* Botón de Ejecución */}
            <button
              onClick={() => setShowEstimationModal(true)}
              disabled={analyzing}
              className="inline-flex items-center px-5 py-3 rounded-xl font-bold text-sm bg-brand-green hover:bg-emerald-600 text-white shadow-lg shadow-brand-green/20 transition transform active:scale-95 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                  Analizando Caso...
                </>
              ) : report ? (
                <>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Re-analizar Caso
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Ejecutar HIPOTECALY AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notificación Educativa de Créditos Gratuitos */}
        {wallet && wallet.isFreeTierActive && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 font-bold uppercase text-[10px]">
                Mes {wallet.currentPromoMonth} • Onboarding
              </span>
              <span>
                Disfrutás de {wallet.promoCasesGrantedMonth} CASOS promocionales gratuitos este mes.
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">Consumo cubierto por HIPOTECALY al 100%</span>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* MODAL DE ESTIMACIÓN PREVIA Y ALERTA DE CONSUMO ELEVADO */}
      {/* -------------------------------------------------------------------------- */}
      {showEstimationModal && estimation && (
        <div className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 text-left space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-base text-navy">Estimación de Consumo AI</h3>
              </div>
              <button
                onClick={() => setShowEstimationModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Alerta de Consumo Elevado */}
            {estimation.isHighConsumption && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-[11px] mb-1">
                    ⚠ Consumo Elevado Previsto
                  </h4>
                  <p>{estimation.highConsumptionWarning}</p>
                </div>
              </div>
            )}

            {/* Barra Visual de Consumo Estimado */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>CONSUMO ESTIMADO</span>
                <span className="text-navy font-bold">
                  {estimation.estimatedCaseUnitsMin} – {estimation.estimatedCaseUnitsMax} CASOS
                </span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full w-[65%]" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 text-slate-500">
                <div>
                  Costo estimado:{' '}
                  <span className="font-semibold text-slate-700">
                    USD {estimation.estimatedCostUsdMin} – {estimation.estimatedCostUsdMax}
                  </span>
                </div>
                <div className="text-right">
                  Saldo actual:{' '}
                  <span className="font-semibold text-brand-green">{estimation.currentBalanceCases} CASOS</span>
                </div>
                <div>
                  Saldo proyectado:{' '}
                  <span className="font-semibold text-slate-700">
                    {estimation.projectedBalanceCasesMin} – {estimation.projectedBalanceCasesMax} CASOS
                  </span>
                </div>
                <div className="text-right">
                  Expediente:{' '}
                  <span className="font-semibold text-slate-700">
                    {estimation.pagesCount} págs • {estimation.imagesCount} fotos
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de Nivel de Análisis */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-600">Nivel de Análisis:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedRunType('preliminary')}
                  className={`p-2.5 rounded-lg border text-center font-medium transition ${
                    selectedRunType === 'preliminary'
                      ? 'border-brand-green bg-emerald-50 text-emerald-900 font-bold ring-2 ring-brand-green/30'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Preliminar (Luna)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRunType('full')}
                  className={`p-2.5 rounded-lg border text-center font-medium transition ${
                    selectedRunType === 'full'
                      ? 'border-brand-green bg-emerald-50 text-emerald-900 font-bold ring-2 ring-brand-green/30'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Completo (Terra)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRunType('deep')}
                  className={`p-2.5 rounded-lg border text-center font-medium transition ${
                    selectedRunType === 'deep'
                      ? 'border-brand-green bg-emerald-50 text-emerald-900 font-bold ring-2 ring-brand-green/30'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Profundo (Sol)
                </button>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t">
              <button
                onClick={() => setShowEstimationModal(false)}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleStartAnalysis(selectedRunType)}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-brand-green hover:bg-emerald-600 text-white shadow-md transition"
              >
                Confirmar y Analizar ({selectedRunType.toUpperCase()})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* BARRA DE PROGRESO DURANTE EL PROCESAMIENTO */}
      {/* -------------------------------------------------------------------------- */}
      {analyzing && (
        <div className="bg-white rounded-xl p-6 border border-brand-green/30 shadow-md space-y-3 animate-pulse text-left">
          <div className="flex justify-between items-center text-xs font-bold text-navy">
            <span className="flex items-center">
              <Sparkles className="w-4 h-4 text-brand-green mr-2 animate-spin" />
              {analyzingStage}
            </span>
            <span>{analyzingProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-brand-green h-3 rounded-full transition-all duration-300"
              style={{ width: `${analyzingProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Coordinando agentes: Document Intelligence, Property Valuation, Consistency, Underwriting y Memoria 3...
          </p>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* ESTADO SIN ANALIZAR */}
      {/* -------------------------------------------------------------------------- */}
      {!report && !analyzing && (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-brand-green">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-navy">Este expediente aún no ha sido analizado por AI</h3>
            <p className="text-xs text-slate-500">
              Iniciá el orquestador para extraer datos de los documentos, verificar padrones y titularidades, calcular
              la tasación preliminar y evaluar el LTV.
            </p>
          </div>
          <button
            onClick={() => setShowEstimationModal(true)}
            className="inline-flex items-center px-6 py-3 rounded-xl font-bold text-xs bg-navy hover:bg-slate-800 text-white shadow-md transition"
          >
            <Play className="w-4 h-4 mr-2 text-brand-green fill-current" />
            Iniciar Análisis
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* VISTA PRINCIPAL CON EL INFORME COMPLETO (10 SECCIONES) */}
      {/* -------------------------------------------------------------------------- */}
      {report && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Mensaje de Éxito de Corrección */}
          {correctionSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green" />
              <span>{correctionSuccessMsg}</span>
            </div>
          )}

          {/* 1. SECCIÓN: RESUMEN AI Y DICTAMEN EJECUTIVO */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-base text-navy">1. Resumen Ejecutivo AI</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Run: {report.run_id}</span>
            </div>

            <p className="text-sm leading-relaxed text-slate-700 font-medium">
              {report.summary.executive_summary}
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <span className="font-bold text-navy uppercase text-[10px] tracking-wider">
                Recomendación del Asistente:
              </span>
              <p className="text-slate-600">{report.summary.recommendation}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-green mr-1.5" />
                  Fortalezas Clave
                </h4>
                <ul className="text-xs space-y-1.5 text-slate-600">
                  {(report.summary?.key_strengths || []).map((s, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-brand-green font-bold mr-1.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                  Acciones Sugeridas
                </h4>
                <ul className="text-xs space-y-1.5 text-slate-600">
                  {(report.summary?.action_items || []).map((a, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-amber-500 font-bold mr-1.5">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 2. SECCIÓN: TASACIÓN PRELIMINAR (MERCADO VS GARANTÍA) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-base text-navy">2. Tasación Preliminar y Garantía</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Confianza {report.valuation.confidence.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Valor Declarado Solicitante</span>
                <p className="text-lg font-bold text-slate-700">
                  USD {Number((report.valuation as any)?.applicant_declared_value ?? report.underwriting?.property_value ?? 0).toLocaleString('es-UY')}
                </p>
                <span className="text-[10px] text-slate-400">Referencia ingresada</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[11px] font-bold text-emerald-800">VALOR DE MERCADO ESTIMADO</span>
                <p className="text-xl font-bold text-emerald-700">
                  USD {Number(report.valuation?.estimated_market_value ?? 0).toLocaleString('es-UY')}
                </p>
                <span className="text-[10px] text-emerald-600">
                  Rango: USD {Number(report.valuation?.estimated_min ?? (report.valuation as any)?.estimated_range?.min ?? 0).toLocaleString('es-UY')} –{' '}
                  {Number(report.valuation?.estimated_max ?? (report.valuation as any)?.estimated_range?.max ?? 0).toLocaleString('es-UY')}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-navy/5 border border-navy/20 space-y-1">
                <span className="text-[11px] font-bold text-navy">VALOR CONSERVADOR DE GARANTÍA</span>
                <p className="text-xl font-bold text-navy">
                  USD {Number(report.valuation?.conservative_value ?? (report.valuation as any)?.conservative_guarantee_value ?? 0).toLocaleString('es-UY')}
                </p>
                <span className="text-[10px] text-slate-500">Base para cálculo del LTV de underwriting</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1 pt-1">
              <p>
                <span className="font-bold text-slate-700">Metodología:</span> {report.valuation.methodology}
              </p>
              {(report.valuation?.warnings || []).length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg text-amber-900 border border-amber-200">
                  <span className="font-bold">Observaciones de Tasación:</span>
                  <ul className="list-disc list-inside mt-1">
                    {(report.valuation?.warnings || []).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 3. SECCIÓN: SEMÁFORO DE 10 DIMENSIONES (🟢 🟡 🔴) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-base text-navy">3. Semáforo Multidimensional (10 Categorías)</h3>
              </div>
              <span className="text-xs text-slate-400">🔴 = Requiere resolución humana</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(Array.isArray(report.semaphore) ? report.semaphore : Object.values((report.semaphore as any)?.categories || {})).map((item: any) => (
                <div
                  key={item.category}
                  className={`p-4 rounded-xl border transition-all ${
                    item.status === 'green'
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : item.status === 'yellow'
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-rose-200 bg-rose-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">
                        {item.status === 'green' ? '🟢' : item.status === 'yellow' ? '🟡' : '🔴'}
                      </span>
                      <h4 className="text-xs font-bold text-navy uppercase tracking-wider">{item.title}</h4>
                    </div>
                    {item.requires_human_review && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Revisión requerida
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mb-1">{item.reason}</p>
                  {item.evidence && (
                    <p className="text-[11px] text-slate-500 italic">
                      <span className="font-semibold text-slate-600">Evidencia:</span> {item.evidence}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. SECCIÓN: DOCUMENTACIÓN LEÍDA E INGESTA INCREMENTAL */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-base text-navy">4. Documentación Procesada e Ingesta Incremental</h3>
              </div>
              <span className="text-xs text-brand-green font-semibold">
                {(report.documents_analyzed || []).filter((d) => d.is_cached).length} reutilizados de caché
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {(report.documents_analyzed || []).map((doc, idx) => (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-navy">{doc.file_name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        {doc.document_type}
                      </span>
                      {doc.is_cached && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ⚡ Caché (Ahorro)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">Hash: {doc.file_hash.substring(0, 24)}...</p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-500">Confianza: {doc.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. SECCIÓN: INCONSISTENCIAS Y FALTANTES */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-navy">5. Inconsistencias y Faltantes Detectados</h3>
              </div>
              <span className="text-xs text-slate-500">
                {(report.consistency_issues || (report as any).inconsistencies || []).length} incidentes identificados
              </span>
            </div>

            {(report.consistency_issues || (report as any).inconsistencies || []).length === 0 ? (
              <div className="p-4 bg-emerald-50 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                <span>No se detectaron inconsistencias registrales ni documentales críticas.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {(report.consistency_issues || (report as any).inconsistencies || []).map((issue: any) => (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                      issue.severity === 'critica'
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-amber-300 bg-amber-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy">{issue.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                          issue.severity === 'critica' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-slate-700">{issue.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                      <div>
                        <span className="font-semibold text-slate-600">Declarado:</span> {issue.declared_value}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600">Constatado:</span> {issue.evidenced_value}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">
                      <span className="font-bold not-italic">Acción recomendada:</span> {issue.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. SECCIÓN: UNDERWRITING DETERMINÍSTICO */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Scale className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-base text-navy">6. Underwriting Financiero</h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  report.underwriting.eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {report.underwriting.eligible ? 'ELEGIBLE DENTRO DE POLÍTICA' : 'FUERA DE LÍMITES'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="text-slate-400">Monto Solicitado</span>
                <p className="text-base font-bold text-navy">
                  USD {Number(report.underwriting?.loan_amount ?? (report.underwriting as any)?.requested_amount ?? 0).toLocaleString('es-UY')}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="text-slate-400">LTV Conservador</span>
                <p
                  className={`text-base font-bold ${
                    Number(report.underwriting?.ltv_conservative ?? (report.underwriting as any)?.calculated_ltv_pct ?? 0) <=
                    Number(report.underwriting?.policy_limits?.max_ltv_allowed ?? (report.underwriting as any)?.max_ltv_allowed_pct ?? 40)
                      ? 'text-brand-green'
                      : 'text-rose-600'
                  }`}
                >
                  {Number(report.underwriting?.ltv_conservative ?? (report.underwriting as any)?.calculated_ltv_pct ?? 0)}%
                </p>
                <span className="text-[10px] text-slate-400">
                  Tope: {Number(report.underwriting?.policy_limits?.max_ltv_allowed ?? (report.underwriting as any)?.max_ltv_allowed_pct ?? 40)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="text-slate-400">Tope Máximo por LTV</span>
                <p className="text-base font-bold text-slate-700">
                  USD {Number(report.underwriting?.max_allowed_by_ltv ?? 0).toLocaleString('es-UY')}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="text-slate-400">Cuota Mensual Est.</span>
                <p className="text-base font-bold text-navy">
                  USD {Number(report.underwriting?.estimated_monthly_installment_usd ?? 0).toLocaleString('es-UY')}
                </p>
                <span className="text-[10px] text-slate-400">Modalidad intereses</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-700">Dictamen de Riesgo:</span> {report.underwriting.notes}
            </p>
          </div>

          {/* 7. SECCIÓN: COMPARABLES DE MERCADO */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-base text-navy">7. Testigos y Comparables de Mercado</h3>
              </div>
              <span className="text-xs text-slate-400">Trazabilidad externa con fuentes auditadas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {(report.valuation?.comparables_used || (report.valuation as any)?.comparables || (report as any).comparables || []).map((comp: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-navy line-clamp-1">{comp.title}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {comp.comparability_score}% match
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <p>
                      Precio: <span className="font-bold text-slate-800">USD {Number(comp.price_usd || 0).toLocaleString('es-UY')}</span>{' '}
                      ({comp.price_per_m2_usd} USD/m²)
                    </p>
                    <p>Superficie: {comp.surface_m2} m²</p>
                    <p className="text-[11px] text-slate-400 truncate">Fuente: {comp.source}</p>
                  </div>
                  {comp.url && (
                    <a
                      href={comp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[11px] font-semibold text-brand-green hover:underline"
                    >
                      Ver publicación testigo →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 8. SECCIÓN: MEMORIA GLOBAL HISTÓRICA ("MEMORIA 3" ANONIMIZADA) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-base text-navy">8. Patrones Históricos ("Memoria 3")</h3>
              </div>
              <span className="text-xs text-slate-400">RAG Global Anonimizado</span>
            </div>

            <div className="space-y-3">
              {(report.global_memory_insights || (report as any).global_memory_patterns || []).map((mem: any) => (
                <div key={mem.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy capitalize">{mem.type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-brand-green font-semibold">
                      Similitud: {Math.round((mem.similarity || 0.85) * 100)}%
                    </span>
                  </div>
                  <p className="text-slate-700">{mem.pattern_summary}</p>
                  <p className="text-slate-500 italic text-[11px]">{mem.sanitized_insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 9. SECCIÓN: CORRECCIONES HUMANAS Y APRENDIZAJE */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-base text-navy">9. Validación Profesional y Corrección</h3>
              </div>
              <span className="text-xs text-slate-400">Decisión Humana Vinculante</span>
            </div>

            <p className="text-xs text-slate-600">
              Podés ratificar las conclusiones del agente o corregirlas para retroalimentar la memoria global de HIPOTECALY.
            </p>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleCorrectionSubmit('conclusiones_globales', 'confirm')}
                className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
              >
                <Check className="w-3.5 h-3.5 mr-1.5 text-brand-green" />
                [ Confirmar Conclusiones ]
              </button>

              <button
                onClick={() => setActiveCorrectionItem('tasacion')}
                className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                [ Corregir Tasación ]
              </button>

              <button
                onClick={() => setActiveCorrectionItem('documentacion')}
                className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
              >
                <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                [ Solicitar Documentación ]
              </button>

              <button
                onClick={() => setActiveCorrectionItem('inconsistencias')}
                className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                [ IA Incorrecta ]
              </button>
            </div>

            {/* Formulario desplegable si se activa corrección */}
            {activeCorrectionItem && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-navy uppercase">
                  Registrar Corrección sobre: {activeCorrectionItem}
                </h4>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Corrección técnica del analista:
                  </label>
                  <input
                    type="text"
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    placeholder="Ej. Tasación ajustada a USD 135.000 por mejoras en baño y cocina no visibles..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-green/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Motivo técnico / Evidencia documental:
                  </label>
                  <input
                    type="text"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Ej. Se cotejó permiso de construcción municipal 2024..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-green/20"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setActiveCorrectionItem(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:underline"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleCorrectionSubmit(activeCorrectionItem, 'correct')}
                    className="px-4 py-1.5 text-xs font-bold bg-navy text-white rounded-lg hover:bg-slate-800"
                  >
                    Guardar Corrección
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 10. SECCIÓN: CONSUMO REAL, BARRA VISUAL Y DESGLOSE */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-left space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-brand-green" />
                <h3 className="font-bold text-base text-navy">10. Auditoría y Barra de Consumo AI</h3>
              </div>
              <span className="text-xs font-bold text-navy">
                Consumo: {report.usage.case_units_consumed} CASOS
              </span>
            </div>

            {/* Barra Visual de Consumo Real */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-bold text-navy">
                <span>BARRA DE CONSUMO REAL</span>
                <span className="text-brand-green">{report.usage.case_units_consumed} CASOS AI</span>
              </div>
              <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-500 to-navy h-3.5 rounded-full"
                  style={{ width: `${Math.min(100, (report.usage.case_units_consumed / 2.0) * 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                <div>
                  <span className="text-slate-400 text-[11px] block">Costo real API</span>
                  <span className="font-bold text-slate-800">USD {report.usage.cost_total_usd}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Tokens totales</span>
                  <span className="font-bold text-slate-800">{report.usage.total_tokens.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Páginas / Fotos</span>
                  <span className="font-bold text-slate-800">
                    {report.usage.pages_processed} págs • {report.usage.image_count} fotos
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Ahorro por Caché</span>
                  <span className="font-bold text-brand-green flex items-center">
                    <TrendingDown className="w-3.5 h-3.5 mr-1 inline" />
                    {Number(report.usage?.cached_input_tokens ?? (report.usage as any)?.cache_savings_tokens ?? 0).toLocaleString()} tokens
                  </span>
                </div>
              </div>
            </div>

            {/* Detalle Expandible de Costos por Etapa */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-navy transition"
              >
                <span>Ver detalle de consumo por etapa</span>
                {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showBreakdown && (
                <div className="p-4 divide-y divide-slate-100 text-xs text-slate-600 bg-white">
                  <div className="py-2 flex justify-between">
                    <span>1. Lectura e Ingesta Documental</span>
                    <span className="font-mono font-semibold">
                      USD {report.usage.breakdown.document_intelligence_usd}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span>2. Cruces e Inconsistencias</span>
                    <span className="font-mono font-semibold">USD {report.usage.breakdown.cross_checks_usd}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span>3. Tasación Preliminar</span>
                    <span className="font-mono font-semibold">USD {report.usage.breakdown.valuation_usd}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span>4. Búsqueda de Comparables</span>
                    <span className="font-mono font-semibold">USD {report.usage.breakdown.comparables_usd}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span>5. Underwriting y Semáforos</span>
                    <span className="font-mono font-semibold">USD {report.usage.breakdown.underwriting_usd}</span>
                  </div>
                  <div className="py-2 flex justify-between font-bold text-navy pt-2">
                    <span>Informe Final y Síntesis</span>
                    <span className="font-mono">USD {report.usage.breakdown.final_report_usd}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Aviso de CASO Gratuito / Cubierto */}
            {wallet && wallet.isFreeTierActive && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold uppercase text-[10px] bg-emerald-200 px-2 py-0.5 rounded mr-2">
                    CASO GRATUITO
                  </span>
                  <span>
                    Consumo real: <strong>{report.usage.case_units_consumed} CASOS</strong> (USD{' '}
                    {report.usage.cost_total_usd}).
                  </span>
                </div>
                <div className="font-bold text-brand-green">
                  Pagás: USD 0.00 • Cubierto por HIPOTECALY
                </div>
              </div>
            )}
          </div>

          {/* -------------------------------------------------------------------------- */}
          {/* DESCARGO LEGAL OBLIGATORIO */}
          {/* -------------------------------------------------------------------------- */}
          <div className="p-4 rounded-xl bg-slate-100 text-slate-500 text-[11px] leading-relaxed border border-slate-200 text-left flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p>{MANDATORY_AI_DISCLAIMER}</p>
          </div>
        </div>
      )}
    </div>
  );
};
