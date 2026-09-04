import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import {
  getTenantLendingRules,
  TenantLendingRules,
  DEFAULT_NOVA_LENDING_RULES,
  subscribeToTenantRules,
} from '../../lib/tenantRulesService';
import { getTenantModules, DEFAULT_MODULES_MAP } from '../../lib/tenantModulesService';
import { TenantNotFoundPage } from '../TenantNotFoundPage';
import { CurrencyInput } from '../../components/ui/CurrencyInput';

export const GenericWhiteLabelLanding: React.FC = () => {
  const { tenant, loading } = useTenant();
  const navigate = useNavigate();

  const [rules, setRules] = useState<TenantLendingRules>(DEFAULT_NOVA_LENDING_RULES);
  const [modules, setModules] = useState(DEFAULT_MODULES_MAP);

  // Formulario del simulador
  const [propertyValue, setPropertyValue] = useState<number>(250000);
  const [requestedAmount, setRequestedAmount] = useState<number>(80000);
  const [selectedTerm, setSelectedTerm] = useState<number>(36);
  const [repaymentMode, setRepaymentMode] = useState<string>('solo_intereses');

  useEffect(() => {
    if (tenant && tenant.id && tenant.status !== 'not_found') {
      getTenantLendingRules(tenant.id).then((r) => {
        setRules(r);
        // Ajustar valores por defecto a los límites del tenant
        const maxFinanced = 250000 * (r.maxFinancedPercentage / 100);
        if (requestedAmount > maxFinanced) {
          setRequestedAmount(Math.min(maxFinanced, r.maxLoanAmount));
        }
        if (r.availableTerms && r.availableTerms.length > 0) {
          setSelectedTerm(r.availableTerms[0]);
        }
      });
      getTenantModules(tenant.id).then((m) => setModules(m));

      const unsub = subscribeToTenantRules((tId, newRules) => {
        if (tId === tenant.id) {
          setRules(newRules);
        }
      });
      return () => unsub();
    }
  }, [tenant.id, tenant.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-brand-green rounded-full animate-spin" />
      </div>
    );
  }

  if (tenant.status === 'not_found') {
    return <TenantNotFoundPage />;
  }

  // Cálculos dinámicos basados en reglas del tenant
  const maxFinancedAllowed = propertyValue * (rules.maxFinancedPercentage / 100);
  const effectiveMaxLoan = Math.min(maxFinancedAllowed, rules.maxLoanAmount);
  const isOverFinanced = requestedAmount > effectiveMaxLoan;

  // Cálculo estimativo de cuota
  const annualRate = rules.defaultRate / 100;
  const monthlyRate = annualRate / 12;
  const estimatedMonthly =
    repaymentMode === 'solo_intereses'
      ? Math.round(requestedAmount * monthlyRate)
      : Math.round(
          (requestedAmount * (monthlyRate * Math.pow(1 + monthlyRate, selectedTerm))) /
            (Math.pow(1 + monthlyRate, selectedTerm) - 1)
        );

  const handleStartApplication = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = Math.min(requestedAmount, effectiveMaxLoan);
    navigate(
      `/solicitar?monto=${finalAmount}&valor_propiedad=${propertyValue}&plazo=${selectedTerm}&modalidad=${repaymentMode}&source=${tenant.slug}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-bg flex flex-col text-slate-text">
      
      {/* ============================================================ */}
      {/* NAVBAR WHITE-LABEL OFICIAL DE LA ORGANIZACIÓN                */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div
              className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center text-white font-black text-base sm:text-lg shadow-sm shrink-0"
              style={{ backgroundColor: tenant.branding.primary_color }}
            >
              {tenant.branding.public_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="text-sm sm:text-xl font-extrabold tracking-tight text-navy block leading-tight">
                {tenant.branding.public_name}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5 truncate max-w-[180px] sm:max-w-none">
                {tenant.branding.tag_line || 'Soluciones con garantía inmobiliaria'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Link
              to="/mi-cuenta"
              className="hidden sm:inline-flex text-xs font-bold text-slate-700 hover:text-navy px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Mi Cuenta
            </Link>
            <a
              href="#simulador"
              className="text-xs font-bold text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-sm transition-all whitespace-nowrap"
              style={{ backgroundColor: tenant.branding.primary_color }}
            >
              Simular Crédito
            </a>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* HERO SECTION CON IDENTIDAD DINÁMICA DEL TENANT               */}
      {/* ============================================================ */}
      <section className="relative py-12 lg:py-20 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-bg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Garantía Hipotecaria Inmobiliaria</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-navy leading-[1.15]">
                Préstamos con Garantía Hipotecaria
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                {tenant.branding.tag_line} Estructuramos créditos privados transparentes con respaldo inmobiliario en Uruguay.
              </p>

              {/* Badges de Reglas de Admisión */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 text-left">
                <div>
                  <span className="text-xl sm:text-2xl font-black text-navy block font-mono">
                    Hasta {rules.maxFinancedPercentage}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Porcentaje financiado</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-navy block font-mono">
                    USD {Number(rules.maxLoanAmount).toLocaleString('es-UY')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Monto máximo</span>
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-navy block font-mono">
                    {rules.maxTermMonths} meses
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Plazo disponible</span>
                </div>
              </div>

              {/* Módulo de Asistente IA (Condicional por Tenant) */}
              {modules.ai_enabled && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-left space-y-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Copiloto IA de Admisión Preliminar Activo
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Evaluación tecnológica preliminar de legajo, LTV e índices zonales en tiempo real.
                  </p>
                  <p className="text-[10px] text-slate-500 italic pt-1 border-t border-emerald-100">
                    * Análisis tecnológico preliminar. No constituye tasación profesional, estudio de títulos, asesoramiento jurídico ni decisión de crédito.
                  </p>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* SIMULADOR EN VIVO (CONECTADO A LAS REGLAS DEL TENANT)    */}
            {/* ======================================================== */}
            <div id="simulador" className="lg:col-span-5">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 text-left space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Simulador en Tiempo Real
                  </span>
                  <h3 className="text-xl font-serif font-bold text-navy mt-0.5">
                    Calculá tu Crédito
                  </h3>
                </div>

                <form onSubmit={handleStartApplication} className="space-y-4">
                  <div>
                    <CurrencyInput
                      label="Valor estimado de tu inmueble (USD)"
                      value={propertyValue}
                      onChange={(val) => {
                        setPropertyValue(val);
                        const maxCap = val * (rules.maxFinancedPercentage / 100);
                        if (requestedAmount > maxCap) setRequestedAmount(Math.min(maxCap, rules.maxLoanAmount));
                      }}
                    />
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Tope {rules.maxFinancedPercentage}% financiado: USD {Math.round(maxFinancedAllowed).toLocaleString('es-UY')}
                    </span>
                  </div>

                  <div>
                    <CurrencyInput
                      label="Monto solicitado (USD)"
                      value={requestedAmount}
                      onChange={(val) => setRequestedAmount(val)}
                      error={isOverFinanced ? `Supera el ${rules.maxFinancedPercentage}% financiado admitido` : undefined}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Plazo</label>
                      <select
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-navy focus:border-navy"
                      >
                        {(rules.availableTerms || [12, 24, 36, 48, 60]).map((term) => (
                          <option key={term} value={term}>
                            {term} meses
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Modalidad</label>
                      <select
                        value={repaymentMode}
                        onChange={(e) => setRepaymentMode(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-navy focus:border-navy"
                      >
                        <option value="solo_intereses">Solo intereses</option>
                        <option value="amortizable">Capital + Interés</option>
                      </select>
                    </div>
                  </div>

                  {/* Resumen de Cuota */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Porcentaje financiado:</span>
                      <strong className="font-mono text-navy">
                        {propertyValue > 0 ? ((requestedAmount / propertyValue) * 100).toFixed(1) : '0'}%
                      </strong>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-xs font-bold text-slate-600 block">Cuota estimada:</span>
                        <span className="text-[10px] text-slate-400">Tasa ref. {rules.defaultRate}% anual</span>
                      </div>
                      <span className="text-2xl font-black text-navy font-mono">
                        USD {estimatedMonthly.toLocaleString('es-UY')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-lg text-white font-bold text-sm shadow-md transition-all flex items-center justify-center"
                    style={{ backgroundColor: tenant.branding.primary_color }}
                  >
                    CONTINUAR SOLICITUD <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer White-Label */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Portal Financiero White-Label. Todos los derechos reservados.</p>
          <p className="text-[11px] text-slate-400 mt-1">Plataforma tecnológica provista por HIPOTECALY Core.</p>
        </div>
      </footer>

    </div>
  );
};
