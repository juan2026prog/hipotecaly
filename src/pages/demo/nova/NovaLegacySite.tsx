import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { getTenantLendingRules, TenantLendingRules, DEFAULT_NOVA_LENDING_RULES } from '../../../lib/tenantRulesService';
import { Button } from '../../../components/ui/Button';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';

export const NovaLegacySite: React.FC = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState<TenantLendingRules>(DEFAULT_NOVA_LENDING_RULES);

  // Estados del simulador tradicional de NOVA
  const [propertyValue, setPropertyValue] = useState<number>(200000);
  const [loanAmount, setLoanAmount] = useState<number>(70000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [repaymentMode, setRepaymentMode] = useState<'solo_intereses' | 'amortizable'>('solo_intereses');

  // FAQ toggle
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    getTenantLendingRules('d0000000-0000-0000-0000-000000000001').then((r) => {
      setRules(r);
    });
  }, []);

  // Cálculos crediticios
  const financedPercentage = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;
  const isOverPercentage = financedPercentage > rules.maxFinancedPercentage;
  const isOverAmount = loanAmount > rules.maxLoanAmount;

  // Cuota mensual aproximada según modalidad
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

  // Acción CONTINUAR SOLICITUD
  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverPercentage || isOverAmount) return;

    // Transmitir parámetros tanto en state seguro de React Router como en query params
    const sanitizedParams = {
      requestedAmount: loanAmount,
      propertyValue: propertyValue,
      termMonths: termMonths,
      repaymentMode: repaymentMode,
      source: 'nova_legacy',
      sourceMode: 'integrated',
      organizationId: 'd0000000-0000-0000-0000-000000000001',
    };

    const searchUrl = `/solicitar?monto=${loanAmount}&valor_propiedad=${propertyValue}&plazo=${termMonths}&modalidad=${repaymentMode}&source=nova_legacy&source_mode=integrated`;
    navigate(searchUrl, { state: sanitizedParams });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      
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
              Caso A: Empresa hipotecaria tradicional con web existente
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/saas" className="text-brand-green hover:underline text-xs font-bold">
              ← Volver a Hipotecaly SaaS
            </Link>
          </div>
        </div>
      </div>

      {/* 1. TOPBAR CORPORATIVA TRADICIONAL */}
      <header className="bg-slate-900 text-slate-300 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-6">
            <span className="flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              +598 2916 4455 (Línea central)
            </span>
            <span className="hidden md:flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              consultas@novacredito.uy
            </span>
            <span className="hidden lg:flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Lunes a Viernes 09:30 a 18:00 hs
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Rincón 468, Piso 4, Ciudad Vieja, Montevideo
            </span>
          </div>
        </div>
      </header>

      {/* 2. NAVBAR INSTITUCIONAL DE NOVA */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo NOVA */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-[#0A3A60] flex items-center justify-center text-white font-serif font-black text-xl shadow-sm">
              N
            </div>
            <div>
              <span className="text-xl font-serif font-extrabold tracking-tight text-[#0A3A60] block leading-tight">
                NOVA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
                Crédito Hipotecario
              </span>
            </div>
          </div>

          {/* Menú de navegación tradicional */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-700">
            <a href="#inicio" className="text-[#0A3A60] font-bold hover:text-blue-900 transition-colors">
              Inicio
            </a>
            <a href="#nosotros" className="hover:text-[#0A3A60] transition-colors">
              Nosotros
            </a>
            <a href="#prestamos" className="hover:text-[#0A3A60] transition-colors">
              Préstamos Hipotecarios
            </a>
            <a href="#simulador" className="hover:text-[#0A3A60] transition-colors">
              Simulador
            </a>
            <a href="#faq" className="hover:text-[#0A3A60] transition-colors">
              Preguntas Frecuentes
            </a>
            <a href="#contacto" className="hover:text-[#0A3A60] transition-colors">
              Contacto
            </a>
          </div>

          {/* Acceso / CTA */}
          <div className="flex items-center space-x-3">
            <a
              href="#simulador"
              className="bg-[#0A3A60] hover:bg-[#072844] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded transition-colors shadow-sm"
            >
              Simular Préstamo
            </a>
          </div>
        </div>
      </nav>

      {/* 3. HERO TRADICIONAL INSTITUCIONAL */}
      <section id="inicio" className="relative bg-gradient-to-r from-slate-900 via-[#0A3A60] to-slate-900 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="inline-block bg-white/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded tracking-wide uppercase border border-white/15">
              Trayectoria en Financiamiento con Respaldo Inmobiliario
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
              Soluciones financieras con respaldo inmobiliario en Uruguay.
            </h1>
            <p className="text-slate-200 text-base sm:text-lg leading-relaxed max-w-2xl font-light">
              Estructuramos préstamos hipotecarios ágiles y a medida para personas y empresas. Tasaciones serias, evaluación notarial integral y condiciones acordes a tu capacidad.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#simulador"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded shadow transition-colors flex items-center"
              >
                Calcular mi préstamo <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              <a
                href="#nosotros"
                className="bg-white/10 hover:bg-white/20 text-white font-medium text-sm px-6 py-3 rounded border border-white/20 transition-colors"
              >
                Conocer la firma
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white text-slate-800 rounded-lg p-6 sm:p-8 shadow-2xl border border-slate-100 text-left">
            <div className="border-b border-slate-200 pb-4 mb-4">
              <span className="text-xs font-bold text-[#0A3A60] uppercase tracking-wider block">
                Condiciones Generales
              </span>
              <h3 className="text-xl font-serif font-bold text-slate-900 mt-1">
                Estructuración Hipotecaria
              </h3>
            </div>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 mr-2.5 shrink-0" />
                <span>
                  <strong>Porcentaje financiado:</strong> Hasta el {rules.maxFinancedPercentage}% del valor real del inmueble.
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 mr-2.5 shrink-0" />
                <span>
                  <strong>Montos disponibles:</strong> Desde USD {rules.minLoanAmount.toLocaleString()} hasta USD {rules.maxLoanAmount.toLocaleString()}.
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 mr-2.5 shrink-0" />
                <span>
                  <strong>Plazos flexibles:</strong> De {rules.minTermMonths} a {rules.maxTermMonths} meses.
                </span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 mr-2.5 shrink-0" />
                <span>
                  <strong>Garantías admisibles:</strong> Casas, apartamentos, locales comerciales y campos.
                </span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* 4. SECCIÓN SIMULADOR FUNCIONAL */}
      <section id="simulador" className="py-16 sm:py-20 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0A3A60] bg-blue-100 px-3 py-1 rounded inline-block">
              Simulador en Línea
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
              Calculá tu propuesta estimada en minutos
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Ingresá el valor estimativo de tu inmueble y el importe necesario para conocer la cuota aproximada de acuerdo a nuestras pautas crediticias.
            </p>
          </div>

          {/* Formulario del simulador */}
          <div className="bg-white rounded-lg shadow-md border border-slate-300 p-6 sm:p-10 text-left">
            <form onSubmit={handleContinue} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Valor de la propiedad */}
                <div>
                  <CurrencyInput
                    label="Valor estimado del inmueble (USD)"
                    value={propertyValue}
                    onChange={(val) => setPropertyValue(val)}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Valor de mercado estimado para tasación pericial.
                  </span>
                </div>

                {/* Monto solicitado */}
                <div>
                  <CurrencyInput
                    label="Monto que solicitás (USD)"
                    value={loanAmount}
                    onChange={(val) => setLoanAmount(val)}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Tope admitido: hasta USD {rules.maxLoanAmount.toLocaleString()}.
                  </span>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Plazo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plazo de financiamiento
                  </label>
                  <select
                    value={termMonths}
                    onChange={(e) => setTermMonths(Number(e.target.value))}
                    className="w-full h-11 px-3 border border-slate-300 rounded text-sm text-slate-800 bg-white focus:outline-none focus:border-[#0A3A60]"
                  >
                    {rules.availableTerms.map((t) => (
                      <option key={t} value={t}>
                        {t} meses ({t / 12} {t === 12 ? 'año' : 'años'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modalidad de Pago */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modalidad de amortización
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRepaymentMode('solo_intereses')}
                      className={`h-11 px-3 text-xs font-bold rounded border transition-colors ${
                        repaymentMode === 'solo_intereses'
                          ? 'bg-[#0A3A60] text-white border-[#0A3A60]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Solo Intereses
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepaymentMode('amortizable')}
                      className={`h-11 px-3 text-xs font-bold rounded border transition-colors ${
                        repaymentMode === 'amortizable'
                          ? 'bg-[#0A3A60] text-white border-[#0A3A60]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Cuota Amortizable
                    </button>
                  </div>
                </div>

              </div>

              {/* Alertas de validación */}
              {isOverPercentage && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Porcentaje financiado excedido:</strong> Estás solicitando el{' '}
                    {financedPercentage.toFixed(1)}% del valor del inmueble. El límite máximo autorizado es del{' '}
                    {rules.maxFinancedPercentage}%.
                  </div>
                </div>
              )}

              {isOverAmount && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Monto máximo excedido:</strong> El importe solicitado supera el tope institucional de USD{' '}
                    {rules.maxLoanAmount.toLocaleString()}.
                  </div>
                </div>
              )}

              {/* Panel de Resultados */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500 block">
                    Porcentaje financiado
                  </span>
                  <span
                    className={`text-2xl font-black mt-1 block ${
                      isOverPercentage ? 'text-amber-600' : 'text-slate-900'
                    }`}
                  >
                    {financedPercentage.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-500">Máx. {rules.maxFinancedPercentage}%</span>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase text-slate-500 block">
                    Tasa Referencial
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {rules.defaultRate}%
                  </span>
                  <span className="text-[11px] text-slate-500">Anual en dólares</span>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase text-slate-500 block">
                    Cuota mensual estimada
                  </span>
                  <span className="text-2xl font-black text-emerald-700 mt-1 block">
                    USD {estimatedMonthlyPayment.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {repaymentMode === 'solo_intereses' ? 'Solo intereses' : 'Capital + intereses'}
                  </span>
                </div>
              </div>

              {/* BLOQUE "¿QUERÉS AVANZAR CON TU SOLICITUD?" CON BOTÓN REAL */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-serif font-bold text-[#0A3A60]">
                    ¿Querés avanzar con tu solicitud?
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-md">
                    Iniciá el expediente digital con los datos ya calculados para que nuestro equipo legal y notarial comience el análisis.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={isOverPercentage || isOverAmount}
                  className="w-full sm:w-auto px-8 bg-[#0A3A60] hover:bg-[#072844] text-white shrink-0 font-bold"
                >
                  CONTINUAR SOLICITUD <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

            </form>
          </div>

        </div>
      </section>

      {/* 5. SECCIÓN NOSOTROS */}
      <section id="nosotros" className="py-16 bg-white border-t border-slate-200 text-left">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0A3A60] block">
            Acerca de NOVA
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
            Especialistas en estructuración hipotecaria privada
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            NOVA Crédito Hipotecario nace con el propósito de conectar necesidades de financiamiento de capital de trabajo, refacciones y consolidación de pasivos con esquemas crediticios claros y seguros, respaldados exclusivamente por bienes raíces en Uruguay.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded">
              <Shield className="w-6 h-6 text-[#0A3A60] mb-2" />
              <h4 className="font-bold text-sm text-slate-900">Seguridad Jurídica</h4>
              <p className="text-xs text-slate-600 mt-1">
                Todas las operaciones se formalizan ante escribano público con estricto estudio de títulos e inscripción registral.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded">
              <Building2 className="w-6 h-6 text-[#0A3A60] mb-2" />
              <h4 className="font-bold text-sm text-slate-900">Tasaciones Profesionales</h4>
              <p className="text-xs text-slate-600 mt-1">
                Peritajes técnicos rigurosos que determinan el valor real de mercado del bien ofrecido en garantía.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded">
              <Clock className="w-6 h-6 text-[#0A3A60] mb-2" />
              <h4 className="font-bold text-sm text-slate-900">Respuesta Ágil</h4>
              <p className="text-xs text-slate-600 mt-1">
                Dictamen preliminar en plazos predecibles sin demoras burocráticas innecesarias.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="py-16 bg-slate-50 border-t border-slate-200 text-left">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2 mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0A3A60]">
              Dudas Habituales
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Preguntas Frecuentes
            </h2>
          </div>

          {[
            {
              q: '¿Qué tipo de inmuebles son admitidos como garantía?',
              a: 'Aceptamos casas, apartamentos de propiedad horizontal, locales comerciales y campos en los principales departamentos del país.',
            },
            {
              q: '¿Es necesario contar con ingresos formales demostrables?',
              a: 'Sí. Evaluamos la capacidad de pago del solicitante a través de recibos de sueldo, balances de empresa o certificaciones contables de ingresos.',
            },
            {
              q: '¿Puedo cancelar el crédito de forma anticipada?',
              a: rules.earlyCancellationPolicy || 'Sí, se admite la cancelación anticipada según las condiciones contractuales acordadas.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-slate-900 hover:bg-slate-50"
              >
                <span className="flex items-center">
                  <HelpCircle className="w-4 h-4 mr-2 text-[#0A3A60]" />
                  {item.q}
                </span>
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

      {/* 7. CONTACTO & FOOTER TRADICIONAL */}
      <footer id="contacto" className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-[#0A3A60] flex items-center justify-center text-white font-serif font-black text-base">
                N
              </div>
              <span className="text-base font-serif font-bold text-white">NOVA</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              NOVA Crédito Hipotecario. Soluciones financieras con respaldo inmobiliario en todo el territorio uruguayo.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Atención al Cliente</h5>
            <ul className="space-y-2">
              <li>Línea Central: +598 2916 4455</li>
              <li>WhatsApp: +598 99 234 567</li>
              <li>Email: contacto@novacredito.uy</li>
              <li>Horario: Lun a Vie 09:30 - 18:00 hs</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Oficinas Centrales</h5>
            <p className="leading-relaxed">
              Rincón 468, Piso 4, Edificio Mercosur<br />
              Ciudad Vieja, Montevideo, Uruguay
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Marco Institucional</h5>
            <p className="text-slate-500 leading-relaxed">
              Empresa ficticia de demostración operativa para HIPOTECALY White-Label. Todos los cálculos y condiciones son meramente ilustrativos.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <span>© 2026 NOVA Inversiones Hipotecarias S.A.S. — Todos los derechos reservados.</span>
          <span className="mt-2 sm:mt-0 font-mono text-slate-400">
            Tecnología provista por HIPOTECALY White-Label
          </span>
        </div>
      </footer>

    </div>
  );
};
