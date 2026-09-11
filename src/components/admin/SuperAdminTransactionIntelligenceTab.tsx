// ==============================================================================
// HIPOTECALY SUPER ADMIN: PESTAÑA TRANSACTION INTELLIGENCE (CLOSED SALES DATA)
// Visualización de Descuentos asking-to-closing, Segmentación, Muestra N y Auditoría
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Plus,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { TransactionIntelligenceService } from '../../lib/tasador/transactions/TransactionIntelligenceService';
import {
  TransactionIntelligenceDashboardSummary,
  TransactionEvidenceType,
} from '../../lib/tasador/transactions/transactionTypes';

export const SuperAdminTransactionIntelligenceTab: React.FC = () => {
  const [summary, setSummary] = useState<TransactionIntelligenceDashboardSummary | null>(null);
  const [, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Formulario de Ingreso Manual Verificado
  const [manualForm, setManualForm] = useState({
    propertyMasterId: '',
    department: 'Montevideo',
    neighborhood: 'Pocitos',
    propertyType: 'APARTMENT',
    askingPriceInitial: 200000,
    askingPriceLast: 195000,
    closingPrice: 180000,
    currency: 'USD' as const,
    listingFirstSeenAt: '2026-01-10',
    listingLastSeenAt: '2026-04-15',
    transactionDate: '2026-04-20',
    sourceType: 'MANUAL_ENTRY' as const,
    evidenceType: 'AGENCY_CONFIRMED' as TransactionEvidenceType,
    evidenceReference: 'Boleto de Reserva / Escritura Notarial #2026-88',
    notes: 'Operación verificada con agente inmobiliario colegiado.',
  });

  const loadData = () => {
    setLoading(true);
    try {
      const s = TransactionIntelligenceService.getInstance().getDashboardSummary();
      setSummary(s);
    } catch (err) {
      console.error('Error cargando Transaction Intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterManual = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      TransactionIntelligenceService.getInstance().registerTransaction({
        propertyMasterId: manualForm.propertyMasterId || `pm_${manualForm.neighborhood.toLowerCase()}_${Date.now()}`,
        sourceId: 'manual_verified_admin',
        sourceName: 'SuperAdmin Ingreso Verificado',
        department: manualForm.department,
        neighborhood: manualForm.neighborhood,
        propertyType: manualForm.propertyType,
        askingPriceInitial: Number(manualForm.askingPriceInitial),
        askingPriceLast: Number(manualForm.askingPriceLast),
        closingPrice: Number(manualForm.closingPrice),
        currency: manualForm.currency,
        listingFirstSeenAt: new Date(manualForm.listingFirstSeenAt).toISOString(),
        listingLastSeenAt: new Date(manualForm.listingLastSeenAt).toISOString(),
        transactionDate: manualForm.transactionDate,
        sourceType: manualForm.sourceType,
        evidenceType: manualForm.evidenceType,
        evidenceReference: manualForm.evidenceReference,
        notes: manualForm.notes,
        registeredByUserId: 'superadmin_active',
      });
      setNotification('Transacción de cierre registrada y auditada exitosamente.');
      setShowManualModal(false);
      loadData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Error al registrar: ${err.message}`);
    }
  };

  const getReadinessBadge = (readiness: string, n: number) => {
    switch (readiness) {
      case 'CERTIFIABLE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Certificable (N={n})</span>;
      case 'CALIBRATION_CANDIDATE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">Candidato (N={n})</span>;
      case 'OBSERVATIONAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Observacional (N={n})</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">Muestra Insuficiente (N={n})</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 text-white p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <TrendingDown className="w-7 h-7 text-teal-400" />
            <h2 className="text-xl font-bold">Transaction Intelligence (Closed Sales Data)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Observabilidad Empírica
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Estudio formal de la brecha <strong>Asking Price → Closing Price</strong> basado en transacciones reales con evidencia documental.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Registrar Cierre Verificado
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase">Cierres Verificados</span>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary?.kpis.totalVerifiedTransactions || 0}</div>
          <p className="text-xs text-slate-500 mt-1">
            +{summary?.kpis.closingsLast30Days || 0} en los últimos 30 días
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase">Descuento Mediano Observado</span>
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {summary?.kpis.totalVerifiedTransactions ? `${summary.kpis.medianDiscountPct}%` : '8.50% (Baseline)'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Promedio: {summary?.kpis.averageDiscountPct || 8.50}%
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase">Tiempo en Mercado (DOM)</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.kpis.medianDaysOnMarket || 0} <span className="text-sm font-normal text-slate-500">días</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Mediana de publicación a cierre</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase">Cobertura Territorial</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary?.kpis.activeNeighborhoodsCount || 0} <span className="text-sm font-normal text-slate-500">barrios</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {summary?.kpis.activePropertyTypesCount || 0} tipologías analizadas
          </p>
        </div>
      </div>

      {/* Tarjeta de Comparativa: Ajuste Global 8.5% vs Descuento Mediano de Mercado */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-bold">Ajuste Global Certificado vs. Mercado Real Observado</h3>
            </div>
            <p className="text-xs text-slate-300">
              El motor de producción opera con un factor de oferta fijo de <strong>8.50% (V2)</strong>. Transaction Intelligence monitorea continuamente si la evidencia empírica acumulada justifica proponer una recalibración dinámica.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-950/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-center">
              <div className="text-xs text-slate-400">Ajuste Global V2</div>
              <div className="text-2xl font-black text-amber-400">8.50%</div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500" />
            <div className="text-center">
              <div className="text-xs text-slate-400">Mediana Real Observada</div>
              <div className="text-2xl font-black text-emerald-400">
                {summary?.globalComparison.sampleSizeTotal ? `${summary.globalComparison.observedMarketMedian}%` : 'N/D'}
              </div>
              <div className="text-[10px] text-slate-400">N = {summary?.globalComparison.sampleSizeTotal || 0}</div>
            </div>
            <div className="border-l border-slate-700 pl-4 text-center">
              <div className="text-xs text-slate-400">Spread / Desvío</div>
              <div className="text-lg font-bold text-slate-200">
                {summary?.globalComparison.sampleSizeTotal ? `${summary.globalComparison.spreadPercentage}%` : '0.00%'}
              </div>
            </div>
          </div>
        </div>

        {summary?.globalComparison.calibrationReviewRecommended && (
          <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>ALERTA DE GOBERNANZA (CALIBRATION_REVIEW_RECOMMENDED):</strong> Se ha acumulado una muestra estadísticamente sólida (N={summary.globalComparison.sampleSizeTotal}) con un desvío material respecto al 8.50%. Se recomienda revisar una propuesta formal de calibración en la consola de Super Admin.
            </span>
          </div>
        )}
      </div>

      {/* Tabla de Métricas Segmentadas por Barrio */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Métricas de Negociación Asking-to-Closing por Segmento</h3>
            <p className="text-xs text-slate-500 mt-0.5">Desglose paramétrico y no paramétrico (P25, Mediana P50, P75, MAD e IQR).</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg">
              {summary?.segmentMetrics.length || 0} Segmentos Activos
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {summary?.segmentMetrics && summary.segmentMetrics.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Segmento / Barrio</th>
                  <th className="py-3 px-4">Tipología</th>
                  <th className="py-3 px-4">Muestra (N)</th>
                  <th className="py-3 px-4">Estado Madurez</th>
                  <th className="py-3 px-4 text-right">Mediana (P50)</th>
                  <th className="py-3 px-4 text-right">Rango (P25 - P75)</th>
                  <th className="py-3 px-4 text-right">MAD / IQR</th>
                  <th className="py-3 px-4 text-right">DOM Mediano</th>
                  <th className="py-3 px-4 text-right">Spread vs 8.5%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.segmentMetrics.map((seg) => (
                  <tr key={seg.segmentKey} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {seg.neighborhood}, {seg.department}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-600">{seg.propertyType}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{seg.sampleSizeN}</td>
                    <td className="py-3 px-4">{getReadinessBadge(seg.readiness, seg.sampleSizeN)}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700">{seg.medianDiscountPct}%</td>
                    <td className="py-3 px-4 text-right text-xs text-slate-600 font-mono">
                      {seg.p25DiscountPct}% – {seg.p75DiscountPct}%
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-500 font-mono">
                      ±{seg.madDiscountPct}% / {seg.iqrDiscountPct}%
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-medium text-slate-700">{seg.medianDaysOnMarket} d</td>
                    <td className="py-3 px-4 text-right text-xs font-bold">
                      <span className={seg.spreadVsGlobalAdjustmentPct > 0 ? 'text-amber-600' : 'text-slate-600'}>
                        {seg.spreadVsGlobalAdjustmentPct > 0 ? `+${seg.spreadVsGlobalAdjustmentPct}%` : `${seg.spreadVsGlobalAdjustmentPct}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400 text-sm">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No existen transacciones de cierre registradas en producción todavía.
              <p className="text-xs text-slate-400 mt-1">
                La base opera en estado <strong>PRODUCTION_READY_NO_VERIFIED_CLOSING_DATA_YET</strong> preservando la integridad del 8.5% global.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Registro Manual Verificado */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" /> Registrar Precio de Cierre Verificado
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleRegisterManual} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Departamento</label>
                  <input
                    type="text"
                    required
                    value={manualForm.department}
                    onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Barrio</label>
                  <input
                    type="text"
                    required
                    value={manualForm.neighborhood}
                    onChange={(e) => setManualForm({ ...manualForm, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asking Price Inicial (USD)</label>
                  <input
                    type="number"
                    required
                    value={manualForm.askingPriceInitial}
                    onChange={(e) => setManualForm({ ...manualForm, askingPriceInitial: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Último Asking Price (USD)</label>
                  <input
                    type="number"
                    required
                    value={manualForm.askingPriceLast}
                    onChange={(e) => setManualForm({ ...manualForm, askingPriceLast: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">Precio Real de Cierre (USD)</label>
                  <input
                    type="number"
                    required
                    value={manualForm.closingPrice}
                    onChange={(e) => setManualForm({ ...manualForm, closingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-emerald-400 bg-emerald-50 rounded-lg text-sm font-bold text-emerald-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Primer Publicación</label>
                  <input
                    type="date"
                    required
                    value={manualForm.listingFirstSeenAt}
                    onChange={(e) => setManualForm({ ...manualForm, listingFirstSeenAt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Retiro Publicación</label>
                  <input
                    type="date"
                    required
                    value={manualForm.listingLastSeenAt}
                    onChange={(e) => setManualForm({ ...manualForm, listingLastSeenAt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Transacción / Escritura</label>
                  <input
                    type="date"
                    required
                    value={manualForm.transactionDate}
                    onChange={(e) => setManualForm({ ...manualForm, transactionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Evidencia Documental</label>
                  <select
                    value={manualForm.evidenceType}
                    onChange={(e) => setManualForm({ ...manualForm, evidenceType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="AGENCY_CONFIRMED">AGENCY_CONFIRMED (Inmobiliaria / Red)</option>
                    <option value="OFFICIAL_RECORD">OFFICIAL_RECORD (Registro Público / Catastro)</option>
                    <option value="SELLER_CONFIRMED">SELLER_CONFIRMED (Parte Vendedora)</option>
                    <option value="MANUAL_VERIFIED">MANUAL_VERIFIED (Perito / Analista Hipotecaly)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Referencia Documental</label>
                  <input
                    type="text"
                    required
                    value={manualForm.evidenceReference}
                    onChange={(e) => setManualForm({ ...manualForm, evidenceReference: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notas de Auditoría y Verificación</label>
                <textarea
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Guardar y Auditar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
