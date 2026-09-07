import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Building,
  Home,
  Trees,
  ChevronDown,
  User,
  AlertCircle,
  FileCheck2,
  FileText,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Menu,
  X,
} from 'lucide-react';
import {
  getTenantLendingRules,
  subscribeToTenantRules,
  TenantLendingRules,
  DEFAULT_NOVA_LENDING_RULES,
} from '../../../lib/tenantRulesService';
import { Button } from '../../../components/ui/Button';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';

export const EstudioNovaPage: React.FC = () => {
  const navigate = useNavigate();
  const tenantId = 'd0000000-0000-0000-0000-000000000001';

  const [rules, setRules] = useState<TenantLendingRules>(DEFAULT_NOVA_LENDING_RULES);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Estados del simulador
  const [propertyValue, setPropertyValue] = useState<number>(200000);
  const [loanAmount, setLoanAmount] = useState<number>(70000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [repaymentMode, setRepaymentMode] = useState<'solo_intereses' | 'amortizable'>('solo_intereses');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Estudio Nova — Financiación & inversión';

    getTenantLendingRules(tenantId).then((r) => setRules(r));

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

  const handleStartApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverPercentage || isOverAmount) return;

    navigate(
      `/solicitar?monto=${loanAmount}&valor_propiedad=${propertyValue}&plazo=${termMonths}&modalidad=${repaymentMode}&source=estudio_nova&source_mode=full`,
      {
        state: {
          requestedAmount: loanAmount,
          propertyValue: propertyValue,
          termMonths: termMonths,
          repaymentMode: repaymentMode,
          source: 'estudio_nova',
          sourceMode: 'full',
          organizationId: tenantId,
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#27384a] font-sans antialiased selection:bg-[#f4b43b] selection:text-[#102d49]">
      
      {/* ============================================================== */}
      {/* 1. TOPBAR INSTITUCIONAL                                        */}
      {/* ============================================================== */}
      <div className="bg-[#102d49] text-slate-200 text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-[#173a5e]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-[11px] sm:text-xs">
            <span className="flex items-center text-slate-300">
              <Phone className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
              +598 2916 4455
            </span>
            <span className="flex items-center text-slate-300">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
              contacto@estudionova.uy
            </span>
            <span className="hidden md:flex items-center text-slate-300">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
              Montevideo, Uruguay
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] sm:text-xs text-slate-300">
            <span className="hidden lg:flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-[#f4b43b]" />
              Lun a Vie 09:00 – 18:00 hs
            </span>
            <Link
              to="/mi-cuenta"
              className="flex items-center text-slate-200 hover:text-[#f4b43b] font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5 mr-1 text-[#f4b43b]" />
              Portal de clientes
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. HEADER Y NAVEGACIÓN PRINCIPAL                               */}
      {/* ============================================================== */}
      <header className="bg-white border-b border-[#dfe5ea] sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* LOGO ESTUDIO NOVA */}
          <a href="#inicio" className="flex items-center space-x-3 group">
            {/* Monograma N: cuadrado azul con detalle amarillo */}
            <div className="relative w-11 h-11 rounded-lg bg-[#173a5e] flex items-center justify-center text-white font-serif font-black text-2xl shadow-sm transition-transform group-hover:scale-105">
              <span>N</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f4b43b]" />
            </div>
            <div className="text-left">
              <span className="text-xl font-serif font-extrabold tracking-tight text-[#173a5e] block leading-none">
                ESTUDIO NOVA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#245f91] block mt-1">
                Financiación & inversión
              </span>
            </div>
          </a>

          {/* Menú de Navegación Desktop */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-bold tracking-wider uppercase text-[#27384a]">
            <a href="#inicio" className="hover:text-[#245f91] transition-colors py-2">
              INICIO
            </a>
            <a href="#financiacion" className="hover:text-[#245f91] transition-colors py-2">
              FINANCIACIÓN
            </a>
            <a href="#como-funciona" className="hover:text-[#245f91] transition-colors py-2">
              CÓMO FUNCIONA
            </a>
            <a href="#inversionistas" className="hover:text-[#245f91] transition-colors py-2">
              INVERSIONISTAS
            </a>
            <a href="#faq" className="hover:text-[#245f91] transition-colors py-2">
              FAQ
            </a>
            <a href="#contacto" className="hover:text-[#245f91] transition-colors py-2">
              CONTACTO
            </a>
          </nav>

          {/* Acciones Header */}
          <div className="hidden sm:flex items-center space-x-3">
            <a
              href="#simulador"
              className="text-xs font-bold uppercase tracking-wider text-[#173a5e] hover:text-[#245f91] px-3 py-2 transition-colors"
            >
              SIMULAR AHORA
            </a>
            <Link
              to="/solicitar?source=estudio_nova"
              className="bg-[#173a5e] hover:bg-[#102d49] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center"
            >
              SOLICITAR FINANCIACIÓN
            </Link>
          </div>

          {/* Botón Móvil */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden p-2 rounded-lg text-[#173a5e] hover:bg-[#f5f7f9]"
            aria-label="Abrir menú"
          >
            {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menú Móvil Desplegable */}
        {mobileNavOpen && (
          <div className="lg:hidden bg-white border-b border-[#dfe5ea] px-4 pt-3 pb-6 space-y-3 text-left shadow-xl animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2 text-xs font-bold uppercase tracking-wider text-[#27384a]">
              <a
                href="#inicio"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
              >
                INICIO
              </a>
              <a
                href="#financiacion"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
              >
                FINANCIACIÓN
              </a>
              <a
                href="#como-funciona"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
              >
                CÓMO FUNCIONA
              </a>
              <a
                href="#inversionistas"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
              >
                INVERSIONISTAS
              </a>
              <a
                href="#faq"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
              >
                FAQ
              </a>
              <a
                href="#contacto"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
              >
                CONTACTO
              </a>
            </nav>
            <div className="pt-3 border-t border-[#dfe5ea] flex flex-col gap-2">
              <a
                href="#simulador"
                onClick={() => setMobileNavOpen(false)}
                className="w-full text-center bg-[#f5f7f9] text-[#173a5e] py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                SIMULAR AHORA
              </a>
              <Link
                to="/solicitar?source=estudio_nova"
                onClick={() => setMobileNavOpen(false)}
                className="w-full text-center bg-[#173a5e] text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                SOLICITAR FINANCIACIÓN
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 3. HERO INSTITUCIONAL URUGUAYO                                 */}
      {/* ============================================================== */}
      <section id="inicio" className="relative bg-gradient-to-b from-[#102d49] via-[#173a5e] to-[#102d49] text-white py-16 sm:py-24 overflow-hidden text-left">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f4b43b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#f4b43b]/20 text-[#f4b43b] border border-[#f4b43b]/30">
              <span>FINANCIACIÓN CON GARANTÍA HIPOTECARIA</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-extrabold text-white tracking-tight leading-[1.14]">
              Convertí el valor de tu inmueble en capital para avanzar.
            </h1>

            <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed font-light">
              Accedé a una evaluación clara y ordenada de tu operación. Viviendas, locales comerciales y campos como respaldo para una financiación adaptada a cada caso.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a
                href="#simulador"
                className="bg-[#f4b43b] hover:bg-[#db9820] text-[#0b2238] font-bold text-sm px-8 py-3.5 rounded-lg shadow-lg transition-all flex items-center justify-center uppercase tracking-wider"
              >
                SIMULAR FINANCIACIÓN <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              <a
                href="#como-funciona"
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-7 py-3.5 rounded-lg border border-white/25 transition-all flex items-center justify-center uppercase tracking-wider"
              >
                CÓMO FUNCIONA
              </a>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 pt-3 border-t border-white/15">
              Evaluación inicial online · Proceso documentado · Seguimiento de la operación
            </p>
          </div>

          {/* Imagen Hero: Plaza Independencia / Montevideo Urbana Financiera */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <img
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80"
                alt="Arquitectura patrimonial y financiera en Montevideo, Uruguay"
                className="w-full h-80 sm:h-96 object-cover object-center brightness-95 transform hover:scale-105 transition-transform duration-700"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b2238]/90 via-[#0b2238]/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#0b2238]/80 backdrop-blur-sm border border-white/10 text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#f4b43b] block">
                  Plaza Independencia · Montevideo
                </span>
                <span className="text-xs font-serif font-semibold text-white block mt-0.5">
                  Estructuración con respaldo en activos inmobiliarios en Uruguay
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. MÉTRICAS DEL TENANT                                         */}
      {/* ============================================================== */}
      <section className="bg-white py-10 border-b border-[#dfe5ea] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#dfe5ea]">
            
            <div className="pt-4 sm:pt-0 sm:px-4 space-y-1">
              <span className="text-2xl sm:text-3xl font-serif font-black text-[#173a5e] block">
                Hasta {rules.maxFinancedPercentage}%
              </span>
              <span className="text-xs text-[#718096] font-medium block">
                del valor de la garantía
              </span>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-4 space-y-1">
              <span className="text-2xl sm:text-3xl font-serif font-black text-[#173a5e] block">
                USD {rules.maxLoanAmount.toLocaleString()}
              </span>
              <span className="text-xs text-[#718096] font-medium block">
                monto máximo de referencia
              </span>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-4 space-y-1">
              <span className="text-2xl sm:text-3xl font-serif font-black text-[#173a5e] block">
                {rules.minTermMonths}–{rules.maxTermMonths} meses
              </span>
              <span className="text-xs text-[#718096] font-medium block">
                plazos según la operación
              </span>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-4 space-y-1">
              <span className="text-2xl sm:text-3xl font-serif font-black text-[#245f91] block">
                100% online
              </span>
              <span className="text-xs text-[#718096] font-medium block">
                para iniciar la evaluación
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SOLUCIONES NOVA                                             */}
      {/* ============================================================== */}
      <section id="financiacion" className="py-16 sm:py-24 bg-[#f5f7f9] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#245f91] bg-white px-3 py-1 rounded-full border border-[#dfe5ea] inline-block">
              GARANTÍAS INMOBILIARIAS
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#173a5e]">
              Inmuebles admitidos para estructuración
            </h2>
            <p className="text-sm sm:text-base text-[#718096] max-w-xl mx-auto">
              Analizamos operaciones respaldadas por diversos tipos de activos con títulos en regla y tasación técnica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Tarjeta 1: Viviendas */}
            <div className="bg-white rounded-2xl p-8 border border-[#dfe5ea] shadow-sm hover:shadow-md transition-all space-y-4 text-left group">
              <div className="w-12 h-12 rounded-xl bg-[#173a5e]/10 text-[#173a5e] flex items-center justify-center font-bold group-hover:bg-[#173a5e] group-hover:text-white transition-colors">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#173a5e]">Viviendas</h3>
              <p className="text-sm text-[#718096] leading-relaxed">
                Propiedades residenciales utilizadas como garantía: casas urbanas, apartamentos en propiedad horizontal y chalets.
              </p>
              <ul className="text-xs text-[#27384a] space-y-2 pt-3 border-t border-[#dfe5ea]">
                <li className="flex items-center">✓ Zonas consolidadas de todo el país</li>
                <li className="flex items-center">✓ Evaluación según estado y metraje</li>
              </ul>
            </div>

            {/* Tarjeta 2: Locales comerciales */}
            <div className="bg-white rounded-2xl p-8 border border-[#dfe5ea] shadow-sm hover:shadow-md transition-all space-y-4 text-left group">
              <div className="w-12 h-12 rounded-xl bg-[#173a5e]/10 text-[#173a5e] flex items-center justify-center font-bold group-hover:bg-[#173a5e] group-hover:text-white transition-colors">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#173a5e]">Locales comerciales</h3>
              <p className="text-sm text-[#718096] leading-relaxed">
                Inmuebles comerciales, oficinas céntricas, depósitos industriales y unidades aptas para renta u operativa comercial.
              </p>
              <ul className="text-xs text-[#27384a] space-y-2 pt-3 border-t border-[#dfe5ea]">
                <li className="flex items-center">✓ Puntos comerciales estratégicos</li>
                <li className="flex items-center">✓ Análisis de flujo y tasación comercial</li>
              </ul>
            </div>

            {/* Tarjeta 3: Campos */}
            <div className="bg-white rounded-2xl p-8 border border-[#dfe5ea] shadow-sm hover:shadow-md transition-all space-y-4 text-left group">
              <div className="w-12 h-12 rounded-xl bg-[#173a5e]/10 text-[#173a5e] flex items-center justify-center font-bold group-hover:bg-[#173a5e] group-hover:text-white transition-colors">
                <Trees className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold text-[#173a5e]">Campos</h3>
              <p className="text-sm text-[#718096] leading-relaxed">
                Propiedades rurales, chacras productivas y fracciones de campo con potencial productivo o de inversión.
              </p>
              <ul className="text-xs text-[#27384a] space-y-2 pt-3 border-t border-[#dfe5ea]">
                <li className="flex items-center">✓ Índice CONEAT y aptitud del suelo</li>
                <li className="flex items-center">✓ Estudio de antecedentes dominiales</li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. SIMULADOR EN VIVO (CONECTADO A REGLAS DEL TENANT)          */}
      {/* ============================================================== */}
      <section id="simulador" className="py-16 sm:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#173a5e]/10 text-[#173a5e]">
                <span>SIMULADOR INTERACTIVO</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#173a5e] leading-tight">
                Calculá tu cuota y condiciones de referencia.
              </h2>

              <p className="text-sm sm:text-base text-[#718096] leading-relaxed">
                Ingresá el valor aproximado del bien ofrecido en garantía y el importe que necesitás. Podrás simular la cuota mensual y avanzar de forma documentada en un único expediente digital.
              </p>

              <div className="p-5 rounded-2xl bg-[#f5f7f9] border border-[#dfe5ea] space-y-3 text-xs text-[#27384a]">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-[#245f91] shrink-0 mt-0.5" />
                  <span>Tasación preliminar por peritaje técnico sobre el inmueble.</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-[#245f91] shrink-0 mt-0.5" />
                  <span>Amortización flexible: modalidad Solo Intereses o Cuota Fija.</span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-[#245f91] shrink-0 mt-0.5" />
                  <span>Sin costo de apertura inicial para comenzar la evaluación.</span>
                </div>
              </div>
            </div>

            {/* Formulario de Simulación */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#dfe5ea] text-left space-y-6">
                
                <div className="border-b border-[#dfe5ea] pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#245f91] block">
                    Simulación de Financiación
                  </span>
                  <h3 className="text-xl font-serif font-bold text-[#173a5e] mt-0.5">
                    Estudio Nova · Cotizador
                  </h3>
                </div>

                <form onSubmit={handleStartApplication} className="space-y-5">
                  <div>
                    <CurrencyInput
                      label="Valor estimado del inmueble (USD)"
                      value={propertyValue}
                      onChange={(val) => setPropertyValue(val)}
                    />
                    <div className="flex justify-between text-[11px] text-[#718096] mt-1">
                      <span>Garantía ofrecida</span>
                      <span className="font-semibold text-[#27384a]">Valor de referencia</span>
                    </div>
                  </div>

                  <div>
                    <CurrencyInput
                      label="Monto solicitado (USD)"
                      value={loanAmount}
                      onChange={(val) => setLoanAmount(val)}
                    />
                    <div className="flex justify-between text-[11px] text-[#718096] mt-1">
                      <span>Mín: USD {rules.minLoanAmount.toLocaleString()}</span>
                      <span>Máx: USD {rules.maxLoanAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#27384a] mb-1">
                        Plazo
                      </label>
                      <select
                        value={termMonths}
                        onChange={(e) => setTermMonths(Number(e.target.value))}
                        className="w-full h-10 px-3 border border-[#dfe5ea] rounded-lg text-xs font-semibold text-[#27384a] bg-white focus:outline-none focus:border-[#173a5e]"
                      >
                        {rules.availableTerms.map((t) => (
                          <option key={t} value={t}>
                            {t} meses ({t / 12} {t === 12 ? 'año' : 'años'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#27384a] mb-1">
                        Modalidad
                      </label>
                      <select
                        value={repaymentMode}
                        onChange={(e) => setRepaymentMode(e.target.value as 'solo_intereses' | 'amortizable')}
                        className="w-full h-10 px-3 border border-[#dfe5ea] rounded-lg text-xs font-semibold text-[#27384a] bg-white focus:outline-none focus:border-[#173a5e]"
                      >
                        <option value="solo_intereses">Solo Intereses</option>
                        <option value="amortizable">Cuota Amortizable</option>
                      </select>
                    </div>
                  </div>

                  {/* Alertas si supera reglas */}
                  {isOverPercentage && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Porcentaje financiado ({financedPercentage.toFixed(1)}%) supera el tope de referencia del {rules.maxFinancedPercentage}%.
                      </span>
                    </div>
                  )}

                  {isOverAmount && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Monto solicitado supera el límite de USD {rules.maxLoanAmount.toLocaleString()}.
                      </span>
                    </div>
                  )}

                  {/* Resumen del cálculo */}
                  <div className="bg-[#f5f7f9] rounded-xl p-4 border border-[#dfe5ea] space-y-2.5">
                    <div className="flex justify-between text-xs text-[#718096]">
                      <span>Porcentaje sobre el valor:</span>
                      <strong className={`font-mono ${isOverPercentage ? 'text-amber-600' : 'text-[#27384a]'}`}>
                        {financedPercentage.toFixed(1)}% (Límite {rules.maxFinancedPercentage}%)
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs text-[#718096]">
                      <span>Tasa anual referencial:</span>
                      <strong className="font-mono text-[#27384a]">{rules.defaultRate}% fija USD</strong>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-[#dfe5ea]">
                      <span className="text-xs font-bold text-[#173a5e]">Cuota mensual estimada:</span>
                      <span className="text-2xl font-black text-[#173a5e] font-mono">
                        USD {estimatedMonthlyPayment.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    disabled={isOverPercentage || isOverAmount}
                    className="w-full bg-[#173a5e] hover:bg-[#102d49] text-white font-bold py-3.5 shadow-md uppercase tracking-wider"
                  >
                    CONTINUAR SOLICITUD <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <p className="text-[10px] text-center text-[#718096]">
                    Cálculo preliminar sujeto a verificación notarial y peritaje del inmueble.
                  </p>
                </form>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. CÓMO FUNCIONA (4 PASOS)                                     */}
      {/* ============================================================== */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-[#f5f7f9] text-left border-y border-[#dfe5ea]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#245f91]">
              PASO A PASO
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#173a5e]">
              Cómo funciona el proceso
            </h2>
            <p className="text-sm sm:text-base text-[#718096]">
              Cuatro etapas ordenadas desde la primera simulación hasta la recepción de la propuesta definitiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-[#dfe5ea] shadow-sm space-y-3 text-left relative">
              <div className="w-10 h-10 rounded-full bg-[#173a5e] text-white flex items-center justify-center font-serif font-bold text-base">
                1
              </div>
              <h4 className="text-lg font-serif font-bold text-[#173a5e]">Simulá</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                Ingresá el valor del inmueble y el monto necesario para conocer las cuotas y plazos de referencia.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#dfe5ea] shadow-sm space-y-3 text-left relative">
              <div className="w-10 h-10 rounded-full bg-[#173a5e] text-white flex items-center justify-center font-serif font-bold text-base">
                2
              </div>
              <h4 className="text-lg font-serif font-bold text-[#173a5e]">Completá tu solicitud</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                Cargá los datos del bien y la documentación básica en tu expediente digital protegido.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#dfe5ea] shadow-sm space-y-3 text-left relative">
              <div className="w-10 h-10 rounded-full bg-[#173a5e] text-white flex items-center justify-center font-serif font-bold text-base">
                3
              </div>
              <h4 className="text-lg font-serif font-bold text-[#173a5e]">Evaluamos</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                Realizamos el análisis pericial de tasación y el estudio notarial preliminar del título.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#dfe5ea] shadow-sm space-y-3 text-left relative">
              <div className="w-10 h-10 rounded-full bg-[#f4b43b] text-[#0b2238] flex items-center justify-center font-serif font-black text-base">
                4
              </div>
              <h4 className="text-lg font-serif font-bold text-[#173a5e]">Recibí la propuesta</h4>
              <p className="text-xs text-[#718096] leading-relaxed">
                Te presentamos las condiciones formales para coordinar la firma notarial y formalización.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. BLOQUE "UNA OPERACIÓN, TODO ORDENADO" (SPLIT)              */}
      {/* ============================================================== */}
      <section className="py-16 sm:py-24 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 relative">
              <div className="rounded-3xl overflow-hidden shadow-xl border border-[#dfe5ea]">
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80"
                  alt="Gestión estructurada de expedientes hipotecarios"
                  className="w-full h-80 sm:h-[420px] object-cover object-center"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#245f91] block">
                UNA OPERACIÓN, TODO ORDENADO
              </span>
              
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#173a5e] leading-tight">
                Información clara desde el primer paso.
              </h2>

              <p className="text-sm sm:text-base text-[#718096] leading-relaxed">
                Estructuramos cada operación para que solicitantes, profesionales y escribanos cuenten con un flujo predecible y documentado.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#173a5e]/10 text-[#173a5e] flex items-center justify-center shrink-0 mt-0.5">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-[#173a5e]">Evaluación preliminar de la propiedad</h5>
                    <p className="text-xs text-[#718096] mt-0.5">Cotejo de valores de mercado y análisis de relación préstamo/garantía.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#173a5e]/10 text-[#173a5e] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-[#173a5e]">Documentación en un único expediente</h5>
                    <p className="text-xs text-[#718096] mt-0.5">Títulos, planos, certificados y recibos organizados digitalmente.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#173a5e]/10 text-[#173a5e] flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-[#173a5e]">Seguimiento de estados</h5>
                    <p className="text-xs text-[#718096] mt-0.5">Visualización del avance de cada etapa sin incertidumbre ni llamados innecesarios.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#173a5e]/10 text-[#173a5e] flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-[#173a5e]">Proceso preparado para validaciones y firma</h5>
                    <p className="text-xs text-[#718096] mt-0.5">Coordinación notarial lista para la confección de escrituras e inscripciones.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. INVERSIONISTAS                                              */}
      {/* ============================================================== */}
      <section id="inversionistas" className="py-16 sm:py-24 bg-[#102d49] text-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f4b43b] block">
              ÁREA DE INVERSIÓN
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              Capital respaldado por activos reales.
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Estudio Nova estructura operaciones de financiamiento con garantía hipotecaria formalizada en Uruguay.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-[#173a5e] p-6 rounded-2xl border border-white/10 space-y-3">
              <span className="text-[10px] font-bold text-[#f4b43b] uppercase tracking-wider block">GARANTÍA</span>
              <h4 className="text-base font-serif font-bold text-white">Inmueble identificado</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cada operación cuenta con una propiedad raíz determinada con títulos verificados por escribano.
              </p>
            </div>

            <div className="bg-[#173a5e] p-6 rounded-2xl border border-white/10 space-y-3">
              <span className="text-[10px] font-bold text-[#f4b43b] uppercase tracking-wider block">VALUACIÓN</span>
              <h4 className="text-base font-serif font-bold text-white">Análisis de respaldo</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Peritaje técnico para asegurar una adecuada relación entre el capital financiado y el activo.
              </p>
            </div>

            <div className="bg-[#173a5e] p-6 rounded-2xl border border-white/10 space-y-3">
              <span className="text-[10px] font-bold text-[#f4b43b] uppercase tracking-wider block">EXPEDIENTE</span>
              <h4 className="text-base font-serif font-bold text-white">Información estructurada</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Legajo completo con antecedentes del solicitante, certificados registrales y condiciones.
              </p>
            </div>

            <div className="bg-[#173a5e] p-6 rounded-2xl border border-white/10 space-y-3">
              <span className="text-[10px] font-bold text-[#f4b43b] uppercase tracking-wider block">SEGUIMIENTO</span>
              <h4 className="text-base font-serif font-bold text-white">Proceso documentado</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Trazabilidad notarial y contractual continua a lo largo de toda la vigencia de la operación.
              </p>
            </div>

          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 text-center max-w-3xl mx-auto text-xs text-slate-300 leading-relaxed">
            <p>
              <strong>Aviso legal:</strong> Toda inversión implica riesgo. Las condiciones y documentación deben analizarse para cada operación particular.
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 10. PREGUNTAS FRECUENTES (FAQ ACORDEÓN)                        */}
      {/* ============================================================== */}
      <section id="faq" className="py-16 sm:py-24 bg-white text-left border-b border-[#dfe5ea]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#245f91]">
              INFORMACIÓN CLARA
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#173a5e]">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: '¿Qué porcentaje del inmueble se puede financiar?',
                a: `Como referencia inicial hasta el ${rules.maxFinancedPercentage}%, sujeto a la evaluación técnica del inmueble y capacidad de pago.`,
              },
              {
                q: '¿Qué propiedades pueden utilizarse como garantía?',
                a: 'Viviendas, locales comerciales y campos situados en el territorio nacional con títulos en condiciones de escrituración.',
              },
              {
                q: '¿Puedo iniciar una solicitud si estoy en Clearing?',
                a: 'Sí. El Clearing no bloquea automáticamente el inicio de la evaluación; se analiza el contexto global de la operación y el activo de garantía.',
              },
              {
                q: '¿Qué documentación de ingresos se solicita?',
                a: 'Recibo de sueldo o certificado de contador según corresponda a la actividad del solicitante (dependiente o independiente).',
              },
              {
                q: '¿Cómo funciona el proceso para inversionistas?',
                a: 'Presentación de la operación estructurada, tasación de la garantía y antecedentes legales para su debido análisis previo.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-[#f5f7f9] border border-[#dfe5ea] rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-[#173a5e] hover:bg-[#dfe5ea]/40 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#245f91] shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-[#718096] border-t border-[#dfe5ea] bg-white leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 11. CONTACTO & ACCESOS RÁPIDOS                                 */}
      {/* ============================================================== */}
      <section id="contacto" className="py-16 sm:py-20 bg-[#f5f7f9] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#dfe5ea] shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#245f91] block">SOLICITAR FINANCIACIÓN</span>
              <h4 className="text-lg font-serif font-bold text-[#173a5e]">Calculá tu crédito online</h4>
              <p className="text-xs text-[#718096]">Comenzá con la simulación paramétrica y enviá tu solicitud.</p>
              <a href="#simulador" className="inline-flex items-center text-xs font-bold text-[#173a5e] hover:text-[#245f91]">
                Simular ahora <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#dfe5ea] shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#245f91] block">HABLAR CON NOSOTROS</span>
              <h4 className="text-lg font-serif font-bold text-[#173a5e]">Atención personalizada</h4>
              <p className="text-xs text-[#718096]">Escribinos a contacto@estudionova.uy o llamanos al +598 2916 4455.</p>
              <a href="mailto:contacto@estudionova.uy" className="inline-flex items-center text-xs font-bold text-[#173a5e] hover:text-[#245f91]">
                Contactar por email <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#dfe5ea] shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#245f91] block">INVERSIONISTAS</span>
              <h4 className="text-lg font-serif font-bold text-[#173a5e]">Estructuración con garantía</h4>
              <p className="text-xs text-[#718096]">Información sobre expedientes con respaldo hipotecario.</p>
              <a href="#inversionistas" className="inline-flex items-center text-xs font-bold text-[#173a5e] hover:text-[#245f91]">
                Ver información <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 12. FOOTER INSTITUCIONAL                                       */}
      {/* ============================================================== */}
      <footer className="bg-[#0b2238] text-slate-400 text-xs py-12 border-t border-[#102d49] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="relative w-8 h-8 rounded bg-[#173a5e] flex items-center justify-center text-white font-serif font-bold text-base">
                <span>N</span>
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#f4b43b]" />
              </div>
              <span className="text-base font-serif font-bold text-white">ESTUDIO NOVA</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Financiación & inversión con respaldo inmobiliario en Uruguay. Estructuración legal y notarial de operaciones.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Atención & Canales</h5>
            <ul className="space-y-2">
              <li>Teléfono: +598 2916 4455</li>
              <li>Email: contacto@estudionova.uy</li>
              <li>Montevideo, Uruguay</li>
              <li>Horario: Lun a Vie 09:00 - 18:00 hs</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Navegación</h5>
            <ul className="space-y-2">
              <li><a href="#inicio" className="hover:text-white">Inicio</a></li>
              <li><a href="#financiacion" className="hover:text-white">Financiación</a></li>
              <li><a href="#simulador" className="hover:text-white">Simulador en Línea</a></li>
              <li><a href="#como-funciona" className="hover:text-white">Cómo Funciona</a></li>
              <li><a href="#inversionistas" className="hover:text-white">Inversionistas</a></li>
              <li><Link to="/mi-cuenta" className="hover:text-white">Portal de Clientes</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Marco Institucional</h5>
            <p className="text-slate-500 leading-relaxed">
              Estudio Nova opera como tenant de demostración y laboratorio funcional para originación y gestión de préstamos hipotecarios.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <span>© 2026 ESTUDIO NOVA S.A.S. — Financiación & inversión.</span>
          <span className="mt-2 sm:mt-0 font-mono text-slate-400">
            Tecnología provista por HIPOTECALY Core Multi-Tenant
          </span>
        </div>
      </footer>

    </div>
  );
};
