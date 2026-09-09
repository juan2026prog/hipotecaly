// ==============================================================================
// HIPOTECALY: Tenant Simulator Page (/demo/:tenantSlug/simulador)
// Simulador transaccional adaptado a las reglas y marca del Tenant
// Con guardado voluntario de simulaciones y enlace directo
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getTenantLendingRules,
  TenantLendingRules,
  DEFAULT_NOVA_LENDING_RULES,
} from '../../lib/tenantRulesService';
import { clientSimulationService } from '../../lib/clientSimulationService';
import { Button } from '../../components/ui/Button';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { WhatsAppFloatingButton } from '../../components/whatsapp/WhatsAppFloatingButton';

export const TenantSimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const { user } = useAuth();

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';
  const accentColor = tenant.branding?.accent_color || '#f4b43b';

  const [rules, setRules] = useState<TenantLendingRules>(DEFAULT_NOVA_LENDING_RULES);
  const [propertyValue, setPropertyValue] = useState<number>(200000);
  const [loanAmount, setLoanAmount] = useState<number>(70000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [repaymentMode, setRepaymentMode] = useState<'solo_intereses' | 'amortizable'>('solo_intereses');

  // Estados de Guardado
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    document.title = `${brandName} | Simulador de Financiación`;
    if (tenant.id) {
      getTenantLendingRules(tenant.id).then((r) => setRules(r));
    }
  }, [tenant.id, brandName]);

  // Cálculos dinámicos
  const financedPercentage = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;
  const isOverPercentage = financedPercentage > rules.maxFinancedPercentage;
  const isOverAmount = loanAmount > rules.maxLoanAmount;

  const annualRate = rules.defaultRate / 100;
  let estimatedMonthlyPayment = 0;
  if (repaymentMode === 'solo_intereses') {
    estimatedMonthlyPayment = Math.round((loanAmount * annualRate) / 12);
  } else {
    const monthlyRate = annualRate / 12;
    const n = termMonths;
    estimatedMonthlyPayment = Math.round(
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n))) / (Math.pow(1 + monthlyRate, n) - 1)
    );
  }

  const handleSaveSimulation = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const simData = {
      requestedAmount: loanAmount,
      currency: 'USD',
      propertyValue: propertyValue,
      termMonths: termMonths,
      propertyType: 'casa',
      department: 'Montevideo',
      repaymentMode: repaymentMode,
      monthlyPaymentEstimated: estimatedMonthlyPayment,
      rateAnnual: rules.defaultRate,
      ltvPercentage: financedPercentage,
      closingCostsEstimated: Math.round(loanAmount * 0.024),
      organizationId: tenant.id,
    };

    if (user?.id) {
      await clientSimulationService.saveSimulation(simData, user.id, tenant.id);
      setSavedSuccessToast(true);
    } else {
      clientSimulationService.savePendingSimulation(simData);
      setAuthModalOpen(true);
    }
  };

  const handleStartApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverPercentage || isOverAmount) return;

    navigate(`/demo/${tenant.slug}/solicitar?monto=${loanAmount}&valor_propiedad=${propertyValue}&plazo=${termMonths}&modalidad=${repaymentMode}`, {
      state: {
        requestedAmount: loanAmount,
        propertyValue: propertyValue,
        termMonths: termMonths,
        repaymentMode: repaymentMode,
        organizationId: tenant.id,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7f9] text-[#27384a]">
      {/* Header White Label */}
      <header className="bg-white border-b border-[#dfe5ea] sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 py-3 flex items-center justify-between">
          <Link to={`/demo/${tenant.slug}`} className="flex items-center space-x-3 group">
            <div
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-white font-serif font-black text-xl shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <span>{brandName.charAt(0)}</span>
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            </div>
            <div className="text-left">
              <span
                className="text-lg font-serif font-extrabold tracking-tight block leading-none"
                style={{ color: primaryColor }}
              >
                {brandName.toUpperCase()}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mt-0.5">
                Simulador Oficial
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <Link
              to={`/demo/${tenant.slug}/cliente`}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 hidden sm:block"
            >
              Portal Clientes
            </Link>
            <Link
              to={`/demo/${tenant.slug}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Main Simulator Card */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 text-left space-y-5">
        
        {/* Toast de Éxito de Guardado */}
        {savedSuccessToast && (
          <div className="p-4 bg-emerald-900 text-white rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between text-xs font-bold animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Simulación guardada en tu cuenta de {brandName}.</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => navigate(`/demo/${tenant.slug}/cliente?tab=simulaciones`)}
                className="underline text-emerald-200 hover:text-white"
              >
                Ver mis simulaciones →
              </button>
              <button type="button" onClick={() => setSavedSuccessToast(false)} className="text-emerald-300 ml-2">✕</button>
            </div>
          </div>
        )}

        <div className="text-center">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: primaryColor }}
          >
            Evaluación preliminar transparente
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
            Simulador de Financiación Hipotecaria
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Calculá las condiciones estimadas de tu operación con respaldo inmobiliario en {brandName}.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8">
          <form onSubmit={handleStartApplication} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Valor de la propiedad */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Valor estimado de tu propiedad (USD)
                </label>
                <CurrencyInput
                  value={propertyValue}
                  onChange={(val) => {
                    setPropertyValue(val);
                    if (loanAmount > (val * rules.maxFinancedPercentage) / 100) {
                      setLoanAmount(Math.round((val * rules.maxFinancedPercentage) / 100));
                    }
                  }}
                  currency="USD"
                  placeholder="200,000"
                />
                <span className="text-[11px] text-slate-500 block">
                  Tope de financiación: {rules.maxFinancedPercentage}% del valor real tasado.
                </span>
              </div>

              {/* Monto a solicitar */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Monto de préstamo solicitado (USD)
                </label>
                <CurrencyInput
                  value={loanAmount}
                  onChange={(val) => setLoanAmount(val)}
                  currency="USD"
                  placeholder="70,000"
                />
                {isOverPercentage && (
                  <span className="text-[11px] text-rose-600 font-medium block">
                    El monto supera el {rules.maxFinancedPercentage}% permitido (porcentaje máximo de financiación).
                  </span>
                )}
                {isOverAmount && (
                  <span className="text-[11px] text-rose-600 font-medium block">
                    El monto supera el límite máximo de USD {rules.maxLoanAmount.toLocaleString()}.
                  </span>
                )}
              </div>
            </div>

            {/* Plazo y Modalidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Plazo del préstamo
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[12, 24, 36, 60].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setTermMonths(months)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        termMonths === months
                          ? 'border-[#173a5e] bg-[#173a5e] text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {months}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Modalidad de amortización
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRepaymentMode('solo_intereses')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
                      repaymentMode === 'solo_intereses'
                        ? 'border-[#173a5e] bg-[#173a5e] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Solo intereses (Bullet)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepaymentMode('amortizable')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
                      repaymentMode === 'amortizable'
                        ? 'border-[#173a5e] bg-[#173a5e] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Cuota Amortizable
                  </button>
                </div>
              </div>
            </div>

            {/* Resultado Estimado Card */}
            <div
              className="rounded-xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ backgroundColor: '#f0f4f8', borderColor: '#d0dbe5' }}
            >
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Cuota mensual estimada
                </span>
                <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
                  USD {estimatedMonthlyPayment.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">/ mes</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Tasa de referencia: {rules.defaultRate}% anual nominal en USD.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleSaveSimulation}
                  className="w-full sm:w-auto text-xs font-bold bg-white border-slate-300 hover:bg-slate-50 flex items-center justify-center !rounded-xl"
                >
                  <Bookmark className="w-4 h-4 mr-1.5 text-slate-600" />
                  Guardar simulación
                </Button>

                <Button
                  type="submit"
                  disabled={isOverPercentage || isOverAmount || loanAmount <= 0}
                  size="lg"
                  className="w-full sm:w-auto shadow-md !rounded-xl text-xs font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Continuar solicitud <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Modal para solicitar Login o Registro al Guardar */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Bookmark className="w-4 h-4 text-amber-700" />
                </div>
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Guardar Simulación en {brandName}
                </h3>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Iniciá sesión para guardar esta simulación por <strong>USD {loanAmount.toLocaleString('es-UY')}</strong> y consultarla o iniciar tu trámite cuando quieras.
              </p>
              <p className="text-[11px] text-slate-400">
                Tus datos calculados ya quedaron protegidos; no tendrás que volver a cargar los valores.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => {
                  setAuthModalOpen(false);
                  navigate(`/ingresar?tenant=${tenant.slug}&action=save_simulation&redirect=simulador`);
                }}
                className="!bg-[#102d49] text-white font-bold text-xs !rounded-xl"
              >
                Iniciar sesión para guardar →
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => {
                  setAuthModalOpen(false);
                  navigate(`/registro?tenant=${tenant.slug}&action=save_simulation&redirect=simulador`);
                }}
                className="text-xs font-bold text-slate-700 hover:bg-slate-50 !rounded-xl"
              >
                Crear una cuenta en {brandName}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {brandName}. Simulador oficial.</span>
          <span className="text-[11px] text-slate-400">
            {tenant.branding?.powered_by_text || 'Tecnología provista por HIPOTECALY'}
          </span>
        </div>
      </footer>

      {/* Botón Flotante de WhatsApp */}
      <WhatsAppFloatingButton tenantId={tenant.id} organizationName={brandName} />
    </div>
  );
};
