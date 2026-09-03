import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Home,
  Building,
  Store,
  Trees,
  ChevronDown,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  getTenantLendingRules,
  subscribeToTenantRules,
  calculateFormalizationCosts,
  getTenantCostConfigurations,
  TenantLendingRules,
  TenantCostItem,
  DEFAULT_NOVA_LENDING_RULES,
  DEFAULT_NOVA_COSTS,
} from '../../../lib/tenantRulesService';
import { Button } from '../../../components/ui/Button';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';

export const NovaFullWhiteLabelSite: React.FC = () => {
  const navigate = useNavigate();
  const tenantId = 'd0000000-0000-0000-0000-000000000001';

  const [rules, setRules] = useState<TenantLendingRules>(DEFAULT_NOVA_LENDING_RULES);
  const [costItems, setCostItems] = useState<TenantCostItem[]>(DEFAULT_NOVA_COSTS);

  // Estados del simulador
  const [propertyValue, setPropertyValue] = useState<number>(250000);
  const [loanAmount, setLoanAmount] = useState<number>(80000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [repaymentMode, setRepaymentMode] = useState<'solo_intereses' | 'amortizable'>('solo_intereses');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Carga reactiva de reglas de NOVA
  useEffect(() => {
    getTenantLendingRules(tenantId).then((r) => setRules(r));
    getTenantCostConfigurations(tenantId).then((c) => setCostItems(c));

    // Suscripción en tiempo real: si un Super Admin actualiza max_financed_percentage 50 -> 40,
    // se refleja inmediatamente sin recargar ni redeployar.
    const unsubscribe = subscribeToTenantRules((updatedTenantId, updatedRules) => {
      if (updatedTenantId === tenantId) {
        setRules(updatedRules);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const formalization = calculateFormalizationCosts(loanAmount, costItems);

  const handleStartApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverPercentage || isOverAmount) return;

    navigate(
      `/solicitar?monto=${loanAmount}&valor_propiedad=${propertyValue}&plazo=${termMonths}&modalidad=${repaymentMode}&source=nova_full&source_mode=full`,
      {
        state: {
          requestedAmount: loanAmount,
          propertyValue: propertyValue,
          termMonths: termMonths,
          repaymentMode: repaymentMode,
          source: 'nova_full',
          sourceMode: 'full',
          organizationId: tenantId,
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
      
      {/* 0. DISCRETO BANNER DE MODO DEMOSTRACIÓN */}
      <div className="bg-navy text-white text-xs py-2 px-4 border-b border-navy-light/40 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            <span className="font-mono uppercase tracking-wider font-semibold text-slate-300">
              MODO DEMOSTRACIÓN HIPOTECALY
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-300 font-medium">
              Caso C: Plataforma White-Label Completa Desde Cero para NOVA
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/saas" className="text-brand-green hover:underline text-xs font-bold">
              ← Volver a Hipotecaly SaaS
            </Link>
          </div>
        </div>
      </div>

      {/* NAVBAR PREMIUM DE NOVA */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand NOVA */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-lg bg-[#0A3A60] flex items-center justify-center text-white font-serif font-black text-2xl shadow-md">
              N
            </div>
            <div>
              <span className="text-xl font-serif font-extrabold tracking-tight text-[#0A3A60] block leading-none">
                NOVA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#16A184] block mt-1">
                Crédito Hipotecario
              </span>
            </div>
          </div>

          {/* Menú */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-700">
            <a href="#simulador" className="hover:text-[#0A3A60] transition-colors">
              Simulador
            </a>
            <a href="#beneficios" className="hover:text-[#0A3A60] transition-colors">
              Beneficios
            </a>
            <a href="#propiedades" className="hover:text-[#0A3A60] transition-colors">
              Garantías
            </a>
            <a href="#costos" className="hover:text-[#0A3A60] transition-colors">
              Costos Transparentes
            </a>
            <a href="#faq" className="hover:text-[#0A3A60] transition-colors">
              FAQ
            </a>
          </div>

          {/* Acciones */}
          <div className="flex items-center space-x-3">
            <Link
              to="/mi-cuenta"
              className="hidden sm:flex items-center text-xs font-bold text-slate-700 hover:text-[#0A3A60] px-3 py-2 rounded transition-colors"
            >
              <User className="w-4 h-4 mr-1.5 text-slate-500" />
              Portal Clientes
            </Link>
            <a
              href="#simulador"
              className="bg-[#0A3A60] hover:bg-[#072844] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              Iniciar Solicitud
            </a>
          </div>
        </div>
      </nav>

      {/* HERO PREMIUM */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-3.5 py-1 text-xs font-bold text-[#0A3A60]">
              <ShieldCheck className="w-4 h-4 text-[#16A184]" />
              <span>PLATAFORMA HIPOTECARIA PRIVADA</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-extrabold text-[#0A3A60] tracking-tight leading-[1.15]">
              Financiamiento hipotecario claro, ágil y garantizado.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-light">
              Transformamos el valor de tu propiedad en liquidez inmediata con las mejores condiciones del mercado. Tasaciones técnicas profesionales y formalización notarial de principio a fin.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a
                href="#simulador"
                className="bg-[#0A3A60] hover:bg-[#072844] text-white font-bold text-sm px-8 py-3.5 rounded-lg shadow-md transition-all flex items-center justify-center"
              >
                Simular mi crédito ahora <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              <Link
                to="/mi-cuenta"
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-6 py-3.5 rounded-lg border border-slate-300 transition-all flex items-center justify-center"
              >
                Acceder a mi expediente
              </Link>
            </div>

            {/* Badges de confianza */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 text-left">
              <div>
                <span className="text-xl sm:text-2xl font-black text-[#0A3A60] block font-mono">
                  Hasta {rules.maxFinancedPercentage}%
                </span>
                <span className="text-xs text-slate-500 font-medium">Porcentaje financiado</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-[#0A3A60] block font-mono">
                  USD {rules.maxLoanAmount.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">Monto máximo</span>
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black text-[#0A3A60] block font-mono">
                  {rules.maxTermMonths} meses
                </span>
                <span className="text-xs text-slate-500 font-medium">Plazo disponible</span>
              </div>
            </div>
          </div>

          {/* SIMULADOR EN VIVO (CONECTADO A SUPABASE) */}
          <div id="simulador" className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 text-left space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#16A184] block">
                  Simulador Parametrizado en Tiempo Real
                </span>
                <h3 className="text-xl font-serif font-bold text-[#0A3A60] mt-0.5">
                  Calculá tu Crédito NOVA
                </h3>
              </div>

              <form onSubmit={handleStartApplication} className="space-y-5">
                
                <div>
                  <CurrencyInput
                    label="Valor estimado de la propiedad (USD)"
                    value={propertyValue}
                    onChange={(val) => setPropertyValue(val)}
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>Inmueble ofrecido en garantía</span>
                    <span className="font-semibold text-slate-700">Tasación oficial</span>
                  </div>
                </div>

                <div>
                  <CurrencyInput
                    label="Monto solicitado (USD)"
                    value={loanAmount}
                    onChange={(val) => setLoanAmount(val)}
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>Mín: USD {rules.minLoanAmount.toLocaleString()}</span>
                    <span>Máx: USD {rules.maxLoanAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Plazo
                    </label>
                    <select
                      value={termMonths}
                      onChange={(e) => setTermMonths(Number(e.target.value))}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                    >
                      {rules.availableTerms.map((t) => (
                        <option key={t} value={t}>
                          {t} meses ({t / 12} {t === 12 ? 'año' : 'años'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Modalidad
                    </label>
                    <select
                      value={repaymentMode}
                      onChange={(e) => setRepaymentMode(e.target.value as 'solo_intereses' | 'amortizable')}
                      className="w-full h-10 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                    >
                      <option value="solo_intereses">Solo Intereses</option>
                      <option value="amortizable">Amortizable</option>
                    </select>
                  </div>
                </div>

                {/* Alertas de regla */}
                {isOverPercentage && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Porcentaje financiado ({financedPercentage.toFixed(1)}%) supera el tope admitido del {rules.maxFinancedPercentage}%.
                    </span>
                  </div>
                )}

                {/* Resumen de cálculo */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Porcentaje financiado:</span>
                    <strong className={`font-mono ${isOverPercentage ? 'text-amber-600' : 'text-slate-900'}`}>
                      {financedPercentage.toFixed(1)}% (Límite {rules.maxFinancedPercentage}%)
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Tasa anual referencial:</span>
                    <strong className="font-mono text-slate-900">{rules.defaultRate}% fija USD</strong>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-[#0A3A60]">Cuota mensual estimada:</span>
                    <span className="text-2xl font-black text-emerald-700 font-mono">
                      USD {estimatedMonthlyPayment.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={isOverPercentage || isOverAmount}
                  className="w-full bg-[#0A3A60] hover:bg-[#072844] text-white font-bold py-3.5 shadow-md"
                >
                  CONTINUAR SOLICITUD <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-[10px] text-center text-slate-400">
                  Cálculo preliminar sujeto a verificación pericial y estudio de títulos.
                </p>

              </form>
            </div>
          </div>

        </div>
      </section>

      {/* BENEFICIOS Y PROPUESTA */}
      <section id="beneficios" className="py-16 bg-white border-t border-slate-100 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16A184]">
              RESPALDO INSTITUCIONAL
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#0A3A60]">
              ¿Por qué formalizar tu crédito con NOVA?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#0A3A60] text-white flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base">Escribanía y Legajo Digital</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Toda la documentación se gestiona mediante expedientes protegidos. Olvidate de llevar papeles sueltos y papeles físicos a múltiples oficinas.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#0A3A60] text-white flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-base">Transparencia Total de Costos</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sin sorpresas. Conocé con exactitud los gastos de escribano, registros y el importe líquido neto que se desembolsará en tu cuenta bancaria.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#0A3A60] text-white flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base">Portal de Autogestión 24/7</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accedé a tu portal en todo momento para ver el estado de avance, descargar comprobantes y revisar tu calendario de vencimientos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TIPOS DE PROPIEDADES ADMITIDAS */}
      <section id="propiedades" className="py-16 bg-slate-50 border-t border-slate-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0A3A60]">
              GARANTÍAS REALES
            </span>
            <h2 className="text-3xl font-serif font-bold text-slate-900">
              Inmuebles admitidos para estructuración
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center space-y-3 shadow-sm">
              <Home className="w-8 h-8 text-[#0A3A60] mx-auto" />
              <h5 className="font-bold text-sm text-slate-900">Vivienda Familiar</h5>
              <p className="text-xs text-slate-500">Casas y chalets en zonas urbanas consolidadas.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center space-y-3 shadow-sm">
              <Building className="w-8 h-8 text-[#0A3A60] mx-auto" />
              <h5 className="font-bold text-sm text-slate-900">Propiedad Horizontal</h5>
              <p className="text-xs text-slate-500">Apartamentos y unidades individuales registradas.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center space-y-3 shadow-sm">
              <Store className="w-8 h-8 text-[#0A3A60] mx-auto" />
              <h5 className="font-bold text-sm text-slate-900">Locales Comerciales</h5>
              <p className="text-xs text-slate-500">Inmuebles comerciales, oficinas y depósitos.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center space-y-3 shadow-sm">
              <Trees className="w-8 h-8 text-[#0A3A60] mx-auto" />
              <h5 className="font-bold text-sm text-slate-900">Inmuebles Rurales</h5>
              <p className="text-xs text-slate-500">Fracciones de campo y chacras productivas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COSTOS TRANSPARENTES */}
      <section id="costos" className="py-16 bg-white border-t border-slate-200 text-left">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16A184]">
              TRANSPARENCIA TOTAL
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#0A3A60]">
              Estimación de Gastos de Formalización
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Simulación de aranceles notariales, peritajes e inscripciones para una operación de USD {loanAmount.toLocaleString()}.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4">
            <div className="space-y-3 divide-y divide-slate-200">
              {formalization.breakdown.map((item) => (
                <div key={item.key} className="pt-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="font-mono font-bold text-slate-900">USD {item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t-2 border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs text-slate-500 block">Total estimado de gastos de cierre</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  USD {formalization.totalFormalizationCosts.toLocaleString()}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-xs text-emerald-700 font-bold block uppercase">Neto líquido a desembolsar</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  USD {formalization.netDisbursed.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-2">
              * Estimaciones indicativas acordadas según el arancel de la Asociación de Escribanos del Uruguay e intendencias locales.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-slate-50 border-t border-slate-200 text-left">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2 mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0A3A60]">
              PREGUNTAS FRECUENTES
            </span>
            <h2 className="text-3xl font-serif font-bold text-slate-900">
              Todo lo que necesitás saber
            </h2>
          </div>

          {[
            {
              q: '¿Qué porcentaje financiado otorga NOVA?',
              a: `Actualmente financiamos hasta el ${rules.maxFinancedPercentage}% del valor de tasación del inmueble según las directivas del comité crediticio.`,
            },
            {
              q: '¿Cómo se formaliza la operación?',
              a: 'Mediante escritura pública de préstamo hipotecario autorizada por escribano público e inscripta en la Dirección General de Registros.',
            },
            {
              q: '¿Qué ocurre una vez enviada mi solicitud?',
              a: 'Se crea de inmediato tu expediente digital. Podrás subir tu documentación y realizar el seguimiento paso a paso desde el Portal de Clientes.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-slate-900 hover:bg-slate-50"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 border-t border-slate-100 bg-slate-50/50">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-[#0A3A60] flex items-center justify-center text-white font-serif font-bold">
                N
              </div>
              <span className="text-base font-serif font-bold text-white">NOVA Crédito Hipotecario</span>
            </div>
            <p className="text-slate-400">
              Plataforma digital especializada en estructuración de créditos con garantía real en Uruguay.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase mb-3">Atención y Canales</h5>
            <ul className="space-y-2">
              <li>Línea directa: +598 2916 4455</li>
              <li>Soporte: contacto@novacredito.uy</li>
              <li>Montevideo, Uruguay</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase mb-3">Accesos Rápidos</h5>
            <ul className="space-y-2">
              <li><a href="#simulador" className="hover:text-white">Simulador en Línea</a></li>
              <li><Link to="/mi-cuenta" className="hover:text-white">Portal del Solicitante</Link></li>
              <li><Link to="/app" className="hover:text-white">Acceso del Estudio</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase mb-3">Aviso de Demostración</h5>
            <p className="text-slate-500 leading-relaxed">
              Empresa ficticia de demostración operativa para HIPOTECALY White-Label. Los valores y reglas se leen de forma dinámica de Supabase.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-800 flex justify-between text-[11px] text-slate-500">
          <span>© 2026 NOVA Inversiones Hipotecarias S.A.S.</span>
          <span>Desarrollado sobre HIPOTECALY Core Multi-Tenant</span>
        </div>
      </footer>

    </div>
  );
};
