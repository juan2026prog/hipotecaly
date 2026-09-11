// ==============================================================================
// HIPOTECALY TASADOR IA - COMPONENTE OPERATIVO PARA EXPEDIENTES (FASE 5)
// Vinculación de colateral, tasación a demanda, Human-in-the-Loop y tasación pericial
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Award,
  Info,
} from 'lucide-react';
import { CasePropertyLinkService } from '../../lib/tasador/integration/CasePropertyLinkService';
import { CaseValuationService } from '../../lib/tasador/integration/CaseValuationService';
import { ProfessionalAppraisalService } from '../../lib/tasador/integration/ProfessionalAppraisalService';
import { ValuationFeedbackService } from '../../lib/tasador/calibration/ValuationFeedbackService';
import {
  CasePropertyLink,
  CaseValuationSnapshot,
  CaseValuationReviewAction,
  ProfessionalAppraisal,
} from '../../lib/tasador/integration/casePropertyTypes';
import { ValuationFeedbackType } from '../../lib/tasador/calibration/calibrationTypes';

interface CaseTasadorSectionProps {
  caseId: string;
  organizationId: string;
  applicantName?: string;
  initialPropertyData?: {
    cadastralNumber?: string;
    department?: string;
    locality?: string;
    address?: string;
    propertyType?: string;
    coveredSurfaceM2?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
}

export const CaseTasadorSection: React.FC<CaseTasadorSectionProps> = ({
  caseId,
  organizationId,
  applicantName: _applicantName,
  initialPropertyData,
}) => {
  const [loading, setLoading] = useState(false);
  const [collateralLink, setCollateralLink] = useState<CasePropertyLink | null>(null);
  const [latestValuation, setLatestValuation] = useState<CaseValuationSnapshot | null>(null);
  const [_valuationHistory, setValuationHistory] = useState<CaseValuationSnapshot[]>([]);
  const [professionalAppraisal, setProfessionalAppraisal] = useState<ProfessionalAppraisal | null>(null);

  // Modales
  const [showComparables, setShowComparables] = useState(false);
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Formulario de Tasación Profesional
  const [profName, setProfName] = useState('');
  const [profReg, setProfReg] = useState('');
  const [profDate, setProfDate] = useState(new Date().toISOString().split('T')[0]);
  const [profValue, setProfValue] = useState<number | ''>('');

  // Formulario de Feedback
  const [feedbackType, setFeedbackType] = useState<ValuationFeedbackType>('GOOD_RESULT');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCaseData();
  }, [caseId, organizationId]);

  const loadCaseData = async () => {
    try {
      const linkService = CasePropertyLinkService.getInstance();
      const links = linkService.getCaseCollaterals(caseId, organizationId);
      let currentLink = links.find((l) => l.isPrimaryCollateral) || links[0] || null;

      // Si no existe vinculación y se proporcionaron datos iniciales, auto-vincular
      if (!currentLink && initialPropertyData) {
        const matchRes = await linkService.linkPropertyToCase({
          caseId,
          organizationId,
          department: initialPropertyData.department || 'Montevideo',
          locality: initialPropertyData.locality || 'Centro',
          cadastralNumber: initialPropertyData.cadastralNumber,
          address: initialPropertyData.address || 'Inmueble del expediente',
          propertyType: initialPropertyData.propertyType || 'apartamento',
          coveredSurfaceM2: initialPropertyData.coveredSurfaceM2 || 65,
          bedrooms: initialPropertyData.bedrooms || 2,
          bathrooms: initialPropertyData.bathrooms || 1,
        });
        currentLink = matchRes.link;
      }

      setCollateralLink(currentLink);

      const valService = CaseValuationService.getInstance();
      const history = valService.getCaseValuationHistory(caseId, organizationId);
      setValuationHistory(history);
      setLatestValuation(history.length > 0 ? history[history.length - 1] : null);

      const profService = ProfessionalAppraisalService.getInstance();
      const prof = profService.getLatestForCase(caseId, organizationId);
      setProfessionalAppraisal(prof);
    } catch (err: any) {
      console.warn('Error al cargar datos del tasador para el expediente:', err);
    }
  };

  const handleExecuteValuation = async (forceNew: boolean = false) => {
    if (!collateralLink || !collateralLink.propertyMasterId) {
      setNotification({ type: 'error', text: 'Primero debés vincular un inmueble colateral.' });
      return;
    }

    setLoading(true);
    setNotification(null);

    try {
      const valService = CaseValuationService.getInstance();
      const snapshot = await valService.requestCaseValuation({
        caseId,
        organizationId,
        propertyMasterId: collateralLink.propertyMasterId,
        forceNewVersion: forceNew,
      });

      setLatestValuation(snapshot);
      setValuationHistory(valService.getCaseValuationHistory(caseId, organizationId));
      setNotification({
        type: 'success',
        text: `Tasación IA ejecutada exitosamente (Versión V${snapshot.versionNumber}).`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err?.message || 'Error al ejecutar la tasación.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = (action: CaseValuationReviewAction) => {
    if (!latestValuation) return;

    try {
      const valService = CaseValuationService.getInstance();
      const updated = valService.applyReviewAction({
        caseId,
        organizationId,
        valuationId: latestValuation.valuationId,
        action,
        userId: 'current-user',
        notes: `Acción ${action} ejecutada por el analista.`,
      });

      if (updated) {
        setLatestValuation({ ...updated });
        setNotification({
          type: 'success',
          text: `Estado actualizado a: ${updated.reviewStatus}.`,
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err?.message || 'Error al actualizar el estado.' });
    }
  };

  const handleSaveProfessionalAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profValue || Number(profValue) <= 0 || !profName.trim()) {
      setNotification({ type: 'error', text: 'Completá el nombre del perito y un valor tasado válido.' });
      return;
    }

    try {
      const profService = ProfessionalAppraisalService.getInstance();
      const record = await profService.registerAppraisal({
        organizationId,
        caseId,
        propertyMasterId: collateralLink?.propertyMasterId || undefined,
        professionalName: profName.trim(),
        professionalType: 'PERITO_TASADOR',
        registrationNumber: profReg.trim() || undefined,
        appraisalDate: profDate,
        appraisedValue: Number(profValue),
        currency: 'USD',
        currentAiValuationUsd: latestValuation?.estimatedMarketValue,
      });

      setProfessionalAppraisal(record);
      setShowAppraisalModal(false);
      setNotification({
        type: 'success',
        text: `Tasación profesional registrada con éxito (Desvío vs IA: ${record.deviationVsAiPercentage || 0}%).`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err?.message || 'Error al guardar tasación profesional.' });
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latestValuation) return;

    try {
      const fbService = ValuationFeedbackService.getInstance();
      await fbService.submitFeedback({
        organizationId,
        caseId,
        valuationId: latestValuation.valuationId,
        propertyMasterId: latestValuation.propertyMasterId,
        feedbackType,
        rating: feedbackRating,
        comment: feedbackComment,
      });

      setShowFeedbackModal(false);
      setNotification({
        type: 'success',
        text: '¡Gracias! Tu feedback cualitativo fue registrado para auditoría y observabilidad.',
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err?.message || 'Error registrando feedback.' });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-left space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-navy text-brand-green rounded-2xl shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-black text-navy tracking-tight">Tasador IA — Garantía Inmobiliaria</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                FASE 5 INTEGRADA
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Valuación determinística con comparables normalizados de mercado uruguayo (Máx 40% financiación).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {latestValuation ? (
            <button
              onClick={() => handleExecuteValuation(true)}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-tasar</span>
            </button>
          ) : (
            <button
              onClick={() => handleExecuteValuation(false)}
              disabled={loading}
              className="px-4 py-2.5 bg-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-brand-green" />
              <span>{loading ? 'Calculando Tasación...' : 'Ejecutar Tasación IA'}</span>
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICACIONES */}
      {notification && (
        <div className={`p-3.5 text-xs rounded-xl flex items-center justify-between ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
        </div>
      )}

      {/* INMUEBLE COLATERAL VINCULADO */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Inmueble Ofrecido en Garantía</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              collateralLink?.resolutionStatus === 'MATCHED'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {collateralLink?.resolutionStatus || 'SIN VINCULAR'}
            </span>
          </div>
          <p className="font-bold text-navy">
            {collateralLink?.provisionalData?.address || initialPropertyData?.address || 'Padrón Catastral en Verificación'}
          </p>
          <p className="text-slate-500">
            {initialPropertyData?.department || 'Montevideo'} — {initialPropertyData?.coveredSurfaceM2 || 65} m² edif. — {initialPropertyData?.bedrooms || 2} dorm.
          </p>
        </div>

        {collateralLink?.resolutionNotes && (
          <div className="text-[11px] text-slate-500 max-w-xs italic">
            ℹ️ {collateralLink.resolutionNotes}
          </div>
        )}
      </div>

      {/* RESULTADOS DE LA TASACIÓN */}
      {latestValuation ? (
        <div className="space-y-6">
          {/* TARJETA DE VALOR Y RANGOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-navy to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Valor de Mercado Estimado</span>
              <div className="text-2xl font-black text-brand-green">
                US$ {latestValuation.estimatedMarketValue.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-300">
                <span>US$ {Math.round(latestValuation.report.estimatedPricePerM2Usd).toLocaleString()} / m²</span>
                <span>•</span>
                <span>Versión V{latestValuation.versionNumber}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Rango Probable de Mercado</span>
              <div className="text-lg font-black text-navy">
                US$ {latestValuation.estimatedRangeLow.toLocaleString()} — US$ {latestValuation.estimatedRangeHigh.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500">
                Valor Prudente de Garantía: <span className="font-bold text-navy">US$ {latestValuation.prudentReferenceValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Nivel de Confianza</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  latestValuation.confidenceLevel === 'HIGH'
                    ? 'bg-emerald-100 text-emerald-800'
                    : latestValuation.confidenceLevel === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {latestValuation.confidenceLevel === 'HIGH' ? 'Alta' : latestValuation.confidenceLevel === 'MEDIUM' ? 'Media' : 'Baja'}
                </span>
              </div>
              <div className="text-2xl font-black text-navy">
                {latestValuation.confidenceScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {latestValuation.confidenceLevel === 'HIGH' 
                  ? `Alta: ${latestValuation.report.effectiveComparablesUsed} comparables recientes en misma zona y calidad.`
                  : latestValuation.confidenceLevel === 'MEDIUM'
                  ? `Media: ${latestValuation.report.effectiveComparablesUsed} comparables con ajuste por distancia o tipología.`
                  : `Baja: Pocos comparables disponibles (${latestValuation.report.effectiveComparablesUsed}). Requiere peritaje SAU.`}
              </div>
            </div>
          </div>

          {/* BLOQUE DE LIMITACIONES DE ESTA TASACIÓN */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-700 font-bold">
              <Info className="w-4 h-4 text-slate-500" />
              <span>Limitaciones y consideraciones de esta estimación:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px] pl-1">
              <li>Valuación automatizada calculada mediante comparables de oferta pública normalizados con descuento del 12%.</li>
              <li>No reemplaza una inspección ocular física ni un peritaje estructural/patológico formal.</li>
              <li>El estado de conservación visual proviene de análisis automatizado en modo sombra sin afectación monetaria directa.</li>
              <li>Sujeto a verificación notarial de titularidad, gravámenes y concordancia del padrón catastral en DNC.</li>
            </ul>
          </div>

          {/* ESTADO DE IA Y FALLBACK */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Estado Enriquecimiento Cualitativo:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                latestValuation.aiStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {latestValuation.aiStatus === 'COMPLETED' ? 'COMPLETADO (SHADOW MODE)' : 'FALLBACK (DETERMINÍSTICO EXITOSO)'}
              </span>
            </div>

            <button
              onClick={() => setShowComparables(!showComparables)}
              className="text-navy font-bold hover:underline flex items-center space-x-1"
            >
              <span>{showComparables ? 'Ocultar Comparables' : 'Ver Comparables Seleccionados'}</span>
              {showComparables ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* TABLA DE COMPARABLES DESPLEGABLE */}
          {showComparables && (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
              <h4 className="text-xs font-bold text-navy">Comparables Reales Utilizados en la Muestra</h4>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Título / Dirección</th>
                    <th className="p-2.5 text-center">Barrio</th>
                    <th className="p-2.5 text-right">Precio Publ.</th>
                    <th className="p-2.5 text-right">Precio con 12%</th>
                    <th className="p-2.5 text-center">Similitud</th>
                    <th className="p-2.5 text-center">Peso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {latestValuation.report.selectedComparables.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2.5 font-semibold text-navy max-w-xs truncate">{c.title}</td>
                      <td className="p-2.5 text-center text-slate-600">{c.neighborhood}</td>
                      <td className="p-2.5 text-right text-slate-500">US$ {c.rawAskingPriceUsd.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-bold text-navy">US$ {Math.round(c.directlyAdjustedPriceUsd).toLocaleString()}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-600">{Math.round(c.similarity.finalSimilarityScore)}%</td>
                      <td className="p-2.5 text-center font-mono">{(c.weight * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* REVISIÓN HUMANA (HUMAN-IN-THE-LOOP) & TASACIÓN PROFESIONAL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-navy">Revisión del Analista / Escribano:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-blue-900 border border-blue-200">
                  {latestValuation.reviewStatus}
                </span>
              </div>
              <p className="text-slate-500">
                El Tasador IA estima valor; la aprobación formal y jurídica del crédito es potestad del equipo profesional.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleReviewAction('ACCEPT_REFERENCE')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm"
              >
                Aceptar Referencia
              </button>

              <button
                onClick={() => handleReviewAction('REQUEST_HUMAN_REVIEW')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold border border-slate-200 transition"
              >
                Pedir Peritaje
              </button>

              <button
                onClick={() => setShowAppraisalModal(true)}
                className="px-3 py-1.5 bg-navy hover:bg-slate-800 text-white rounded-xl font-bold transition flex items-center space-x-1"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Ingresar Peritaje</span>
              </button>

              <button
                onClick={() => setShowFeedbackModal(true)}
                className="p-1.5 text-slate-500 hover:text-navy rounded-lg hover:bg-white transition"
                title="Enviar Feedback Cualitativo"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TASACIÓN PROFESIONAL REGISTRADA (SI EXISTE) */}
          {professionalAppraisal && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-navy">Tasación Pericial Registrada:</span>
                  <span className="font-mono text-slate-600">{professionalAppraisal.professionalName}</span>
                </div>
                <p className="text-slate-600">
                  Valor: <span className="font-bold text-navy">US$ {professionalAppraisal.appraisedValue.toLocaleString()}</span> | Fecha: {professionalAppraisal.appraisalDate}
                </p>
              </div>

              {professionalAppraisal.deviationVsAiPercentage !== null && professionalAppraisal.deviationVsAiPercentage !== undefined && (
                <div className="text-right font-bold text-navy">
                  Desvío IA vs Perito:{' '}
                  <span className={Math.abs(professionalAppraisal.deviationVsAiPercentage) > 10 ? 'text-amber-600' : 'text-emerald-600'}>
                    {professionalAppraisal.deviationVsAiPercentage > 0 ? '+' : ''}{professionalAppraisal.deviationVsAiPercentage}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-bold text-navy">No se ha ejecutado ninguna tasación en este expediente</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hacé click en "Ejecutar Tasación IA" para obtener una estimación objetiva de mercado basada en comparables reales.
          </p>
        </div>
      )}

      {/* MODAL PARA INGRESAR TASACIÓN PROFESIONAL */}
      {showAppraisalModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-black text-navy">Registrar Tasación Profesional</h4>
              </div>
              <button onClick={() => setShowAppraisalModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            <form onSubmit={handleSaveProfessionalAppraisal} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre del Perito / Arquitecto / Escribano</label>
                <input
                  type="text"
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  placeholder="Ej: Arq. Fernando Rossi"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Matrícula / Registro Profesional</label>
                <input
                  type="text"
                  value={profReg}
                  onChange={(e) => setProfReg(e.target.value)}
                  placeholder="Ej: SAU-8942"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha Tasación</label>
                  <input
                    type="date"
                    required
                    value={profDate}
                    onChange={(e) => setProfDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor Tasado (USD)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={profValue}
                    onChange={(e) => setProfValue(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ej: 210000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-navy"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900">
                ℹ️ <b>Regla Estricta:</b> La tasación pericial NO recibe ajuste del 12% (representa valor neto de mercado certificado).
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAppraisalModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy text-white rounded-xl font-bold hover:bg-slate-800 transition"
                >
                  Guardar Peritaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA ENVIAR FEEDBACK CUALITATIVO */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                <h4 className="text-sm font-black text-navy">Enviar Feedback Cualitativo</h4>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipo de Observación</label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                >
                  <option value="GOOD_RESULT">Resultado Preciso y Confiable</option>
                  <option value="VALUATION_TOO_HIGH">Tasación Sobreestimada</option>
                  <option value="VALUATION_TOO_LOW">Tasación Subestimada</option>
                  <option value="COMPARABLE_INCORRECT">Comparables no representativos</option>
                  <option value="PROPERTY_DATA_INCORRECT">Datos del inmueble inexactos</option>
                  <option value="RANGE_TOO_WIDE">Rango de mercado excesivamente amplio</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Calificación (1 a 5 estrellas)</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className={`px-3 py-1.5 rounded-xl font-bold ${
                        feedbackRating >= star ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Comentario o Justificación</label>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Detallá cualquier observación sobre la propiedad o comparables..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy text-white rounded-xl font-bold hover:bg-slate-800 transition"
                >
                  Enviar Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
