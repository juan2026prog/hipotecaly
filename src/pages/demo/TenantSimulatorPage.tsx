// ==============================================================================
// HIPOTECALY: Tenant Simulator Page (/demo/:tenantSlug/simulador)
// Simulador transaccional adaptado a las reglas y marca del Tenant
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import {
  getTenantLendingRules,
  TenantLendingRules,
  DEFAULT_NOVA_LENDING_RULES,
} from '../../lib/tenantRulesService';
import { Button } from '../../components/ui/Button';
import { CurrencyInput } from '../../components/ui/CurrencyInput';

export const TenantSimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';
  const accentColor = tenant.branding?.accent_color || '#f4b43b';

  const [rules, setRules] = useState<TenantLendingRules>(DEFAULT_NOVA_LENDING_RULES);
  const [propertyValue, setPropertyValue] = useState<number>(200000);
  const [loanAmount, setLoanAmount] = useState<number>(70000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [repaymentMode, setRepaymentMode] = useState<'solo_intereses' | 'amortizable'>('solo_intereses');

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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 text-left">
        <div className="mb-6 text-center">
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

              <Button
                type="submit"
                disabled={isOverPercentage || isOverAmount || loanAmount <= 0}
                size="lg"
                className="w-full sm:w-auto shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                Continuar con mi solicitud <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {brandName}. Simulador oficial.</span>
          <span className="text-[11px] text-slate-400">
            {tenant.branding?.powered_by_text || 'Tecnología provista por HIPOTECALY'}
          </span>
        </div>
      </footer>
    </div>
  );
};
