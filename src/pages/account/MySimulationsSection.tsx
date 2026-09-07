// ==============================================================================
// HIPOTECALY: Sección 2 - Mis Simulaciones
// Listado de simulaciones que el usuario decidió guardar voluntariamente,
// vista detallada, inicio de solicitud con precarga y vínculo a solicitud.
// ==============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  ArrowRight,
  Trash2,
  Eye,
  CheckCircle2,
  Calendar,
  Building2,
  Scale,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  SavedSimulation,
  clientSimulationService,
} from '../../lib/clientSimulationService';
import { useTenant } from '../../contexts/TenantContext';

interface MySimulationsSectionProps {
  simulations: SavedSimulation[];
  onRefresh: () => void;
  onOpenApplication?: (publicId: string) => void;
}

export const MySimulationsSection: React.FC<MySimulationsSectionProps> = ({
  simulations,
  onRefresh,
  onOpenApplication,
}) => {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const [selectedSim, setSelectedSim] = useState<SavedSimulation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isNova = tenant.slug.includes('nova');

  const handleDelete = (simId: string) => {
    clientSimulationService.deleteSimulation(simId);
    setDeleteConfirmId(null);
    showToast('Simulación eliminada.');
    onRefresh();
  };

  const handleStartApplication = (sim: SavedSimulation) => {
    const isWhiteLabel = tenant.is_white_label || isNova;
    const targetUrl = isWhiteLabel
      ? `/demo/${tenant.slug}/solicitar?monto=${sim.requestedAmount}&valor_propiedad=${sim.propertyValue}&plazo=${sim.termMonths}&source=${tenant.slug}&simulation_id=${sim.id}`
      : `/solicitar?monto=${sim.requestedAmount}&valor_propiedad=${sim.propertyValue}&plazo=${sim.termMonths}&simulation_id=${sim.id}`;

    navigate(targetUrl, {
      state: {
        requestedAmount: sim.requestedAmount,
        propertyValue: sim.propertyValue,
        termMonths: sim.termMonths,
        propertyType: sim.propertyType,
        department: sim.department,
        legalStatus: sim.legalStatus || 'libre_gravamenes',
        incomeType: sim.incomeType || 'dependiente',
        repaymentMode: sim.repaymentMode || 'solo_intereses',
        simulationId: sim.id,
        organizationId: tenant.id,
      },
    });
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast de Notificación */}
      {toastMessage && (
        <div className="p-4 bg-emerald-900 text-white rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-200">✕</button>
        </div>
      )}

      {/* Header de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#245f91]">
            Cotizaciones Guardadas
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-0.5">
            Mis simulaciones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Las simulaciones que decidiste guardar para comparar o iniciar tu solicitud cuando lo desees.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(isNova ? `/demo/${tenant.slug}/simulador` : '/simulador')}
          className="self-start sm:self-auto text-xs font-bold flex items-center !bg-[#102d49] text-white !rounded-xl shadow-xs"
        >
          <Calculator className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
          Nueva simulación
        </Button>
      </div>

      {/* ============================================================ */}
      {/* LISTADO DE SIMULACIONES GUARDADAS                            */}
      {/* ============================================================ */}
      {simulations.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Calculator className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-slate-900">
              No tenés simulaciones guardadas
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Las simulaciones solo se guardan cuando presionás expresamente <strong>"Guardar simulación"</strong> después de calcular tu crédito.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(isNova ? `/demo/${tenant.slug}/simulador` : '/simulador')}
            className="!bg-[#102d49] text-white text-xs font-bold !rounded-xl"
          >
            Ir al Simulador Online →
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {simulations.map((sim) => {
            const hasAppLinked = Boolean(sim.applicationPublicId);

            return (
              <div
                key={sim.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-left"
              >
                {/* Columna Principal con Datos Clave de la Simulación */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg sm:text-xl font-mono font-bold text-slate-900">
                      {sim.currency} {sim.requestedAmount.toLocaleString('es-UY')}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {sim.termMonths} meses
                    </span>
                    {hasAppLinked && (
                      <span className="text-[11px] font-bold text-[#102d49] bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-amber-700" />
                        Solicitud iniciada: {sim.applicationPublicId}
                      </span>
                    )}
                  </div>

                  {/* Resumen secundario limpio */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="capitalize font-medium text-slate-700 flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {sim.propertyType.replace('_', ' ')} · Valor USD {sim.propertyValue.toLocaleString('es-UY')}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-slate-700">
                      Financiación: {sim.ltvPercentage.toFixed(0)}%
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 flex items-center text-[11px]">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Guardada: {formatDate(sim.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  {hasAppLinked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (onOpenApplication && sim.applicationPublicId) {
                          onOpenApplication(sim.applicationPublicId);
                        }
                      }}
                      className="text-xs font-bold text-[#102d49] border-slate-200 hover:bg-slate-50 !rounded-xl"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Ver solicitud
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartApplication(sim)}
                      className="text-xs font-bold !bg-[#102d49] text-white !rounded-xl shadow-xs"
                    >
                      Iniciar solicitud <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSim(sim)}
                    className="text-xs font-semibold text-slate-600 hover:bg-slate-50 !rounded-xl"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Ver simulación
                  </Button>

                  <button
                    onClick={() => setDeleteConfirmId(sim.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Eliminar simulación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DETALLE DE LA SIMULACIÓN                             */}
      {/* ============================================================ */}
      {selectedSim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#245f91]">
                  Ficha de Simulación
                </span>
                <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
                  {selectedSim.currency} {selectedSim.requestedAmount.toLocaleString('es-UY')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSim(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bloques de Datos */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Valor del Inmueble
                </span>
                <strong className="text-slate-900 text-sm font-bold block font-mono">
                  USD {selectedSim.propertyValue.toLocaleString('es-UY')}
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Porcentaje Financiado
                </span>
                <strong className="text-slate-900 text-sm font-bold block">
                  {selectedSim.ltvPercentage.toFixed(1)}% del valor
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Plazo del Préstamo
                </span>
                <strong className="text-slate-900 font-semibold block">
                  {selectedSim.termMonths} meses ({selectedSim.termMonths / 12} años)
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Modalidad de Amortización
                </span>
                <strong className="text-slate-900 font-semibold block capitalize">
                  {selectedSim.repaymentMode === 'amortizable' ? 'Cuota Amortizable' : 'Solo Intereses (Bullet)'}
                </strong>
              </div>
            </div>

            {/* Cuota Estimada */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#102d49] to-[#173a5e] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-300 block">Cuota mensual estimada</span>
                <div className="text-2xl font-bold font-mono text-[#f4b43b]">
                  USD {selectedSim.monthlyPaymentEstimated.toLocaleString('es-UY')}
                  <span className="text-xs text-slate-300 font-normal ml-1">/ mes</span>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-300">
                <span>Tasa de referencia: {selectedSim.rateAnnual}% anual</span>
              </div>
            </div>

            {/* Gastos Notariales Estimados */}
            {selectedSim.closingCostsEstimated && selectedSim.closingCostsEstimated > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center">
                  <Scale className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  Gastos notariales e inscripciones estimadas:
                </span>
                <strong className="text-slate-900 font-mono">
                  USD {selectedSim.closingCostsEstimated.toLocaleString('es-UY')}
                </strong>
              </div>
            )}

            {/* Acciones del Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSim(null)}
              >
                Cerrar
              </Button>

              {!selectedSim.applicationPublicId && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const sim = selectedSim;
                    setSelectedSim(null);
                    handleStartApplication(sim);
                  }}
                  className="!bg-[#102d49] text-white font-bold"
                >
                  Iniciar solicitud con estos datos <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">¿Eliminar simulación?</h3>
              <p className="text-xs text-slate-500">
                Esta cotización se quitará de tu lista. Podés volver a calcularla cuando quieras.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                className="!bg-rose-600 hover:!bg-rose-700 text-white font-bold"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
