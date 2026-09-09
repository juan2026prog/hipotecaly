import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Building,
  Home as HomeIcon,
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
import { useTenant } from '../../../contexts/TenantContext';
import {
  getTenantLendingRules,
  subscribeToTenantRules,
  TenantLendingRules,
  DEFAULT_NOVA_LENDING_RULES,
} from '../../../lib/tenantRulesService';
import {
  getOrganizationHomeSettings,
  subscribeToOrganizationHomeSettings,
  OrganizationHomeSettings,
  DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS,
} from '../../../lib/organizationHomeService';
import { OrganizationHero } from '../../../components/organization/OrganizationHero';
import { Button } from '../../../components/ui/Button';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';
import { WhatsAppFloatingButton } from '../../../components/whatsapp/WhatsAppFloatingButton';

export const EstudioNovaPage: React.FC = () => {
  const { tenant } = useTenant();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const navigate = useNavigate();

  // Resolución dinámica de organización
  const effectiveOrgId = tenant?.id && tenant.id !== '00000000-0000-0000-0000-000000000000'
    ? tenant.id
    : 'd0000000-0000-0000-0000-000000000001';

  const effectiveSlug = tenantSlug || tenant?.slug || 'estudio-nova';
  const orgName = tenant?.branding?.public_name || tenant?.name || 'Estudio Nova';
  const orgTagline = tenant?.branding?.tag_line || 'Financiación & inversión';
  const supportPhone = '+598 2916 4455';
  const supportEmail = tenant?.settings?.sender_email || 'contacto@estudionova.uy';
  const primaryColor = tenant?.branding?.primary_color || '#173a5e';
  const secondaryColor = tenant?.branding?.secondary_color || '#102d49';
  const accentColor = tenant?.branding?.accent_color || '#f4b43b';

  const [rules, setRules] = useState<TenantLendingRules>(DEFAULT_NOVA_LENDING_RULES);
  const [homeSettings, setHomeSettings] = useState<OrganizationHomeSettings>(DEFAULT_ESTUDIO_NOVA_HOME_SETTINGS);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Estados del simulador
  const [propertyValue, setPropertyValue] = useState<number>(200000);
  const [loanAmount, setLoanAmount] = useState<number>(70000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [repaymentMode, setRepaymentMode] = useState<'solo_intereses' | 'amortizable'>('solo_intereses');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = `${orgName} — ${orgTagline}`;

    // 1. Cargar Reglas Crediticias del Tenant
    getTenantLendingRules(effectiveOrgId).then((r) => setRules(r));
    const unsubscribeRules = subscribeToTenantRules((updatedTenantId, updatedRules) => {
      if (updatedTenantId === effectiveOrgId) {
        setRules(updatedRules);
      }
    });

    // 2. Cargar Configuración de Home de la Organización
    getOrganizationHomeSettings(effectiveOrgId).then((h) => setHomeSettings(h));
    const unsubscribeHome = subscribeToOrganizationHomeSettings((updatedOrgId, updatedSettings) => {
      if (updatedOrgId === effectiveOrgId) {
        setHomeSettings(updatedSettings);
      }
    });

    return () => {
      unsubscribeRules();
      unsubscribeHome();
    };
  }, [effectiveOrgId, orgName, orgTagline]);

  // Cálculos dinámicos del simulador
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
      `/demo/${effectiveSlug}/solicitar?monto=${loanAmount}&valor_propiedad=${propertyValue}&plazo=${termMonths}&modalidad=${repaymentMode}`,
      {
        state: {
          requestedAmount: loanAmount,
          propertyValue: propertyValue,
          termMonths: termMonths,
          repaymentMode: repaymentMode,
          organizationId: effectiveOrgId,
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#27384a] font-sans antialiased selection:bg-[#f4b43b] selection:text-[#102d49]">
      
      {/* ============================================================== */}
      {/* 1. TOPBAR INSTITUCIONAL                                        */}
      {/* ============================================================== */}
      <div
        className="text-slate-200 text-xs py-2 px-4 sm:px-6 lg:px-8 border-b"
        style={{
          backgroundColor: secondaryColor,
          borderColor: `${primaryColor}60`,
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-[11px] sm:text-xs">
            <a href={`tel:${supportPhone.replace(/\s+/g, '')}`} className="flex items-center text-slate-300 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 mr-1.5" style={{ color: accentColor }} />
              {supportPhone}
            </a>
            <a href={`mailto:${supportEmail}`} className="flex items-center text-slate-300 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 mr-1.5" style={{ color: accentColor }} />
              {supportEmail}
            </a>
            <span className="hidden md:flex items-center text-slate-300">
              <MapPin className="w-3.5 h-3.5 mr-1.5" style={{ color: accentColor }} />
              Montevideo, Uruguay
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] sm:text-xs text-slate-300">
            <span className="hidden lg:flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5" style={{ color: accentColor }} />
              Lun a Vie 09:00 – 18:00 hs
            </span>
            <Link
              to={`/demo/${effectiveSlug}/inversor`}
              className="flex items-center font-semibold transition-colors hover:text-white"
              style={{ color: accentColor }}
            >
              <Building className="w-3.5 h-3.5 mr-1" style={{ color: accentColor }} />
              Red de Inversores
            </Link>
            <Link
              to={`/demo/${effectiveSlug}/cliente`}
              className="flex items-center text-slate-200 hover:text-white font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5 mr-1" style={{ color: accentColor }} />
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
          
          {/* LOGO DE LA ORGANIZACIÓN */}
          <a href="#inicio" className="flex items-center space-x-3 group">
            {tenant?.branding?.logo_url ? (
              <img
                src={tenant.branding.logo_url}
                alt={orgName}
                className="h-11 w-auto object-contain rounded-lg transition-transform group-hover:scale-105"
              />
            ) : (
              <div
                className="relative w-11 h-11 rounded-lg flex items-center justify-center text-white font-serif font-black text-2xl shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{orgName.charAt(0)}</span>
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            )}
            <div className="text-left">
              <span
                className="text-xl font-serif font-extrabold tracking-tight block leading-none"
                style={{ color: primaryColor }}
              >
                {orgName.toUpperCase()}
              </span>
              <span
                className="text-[10px] uppercase font-bold tracking-widest block mt-1"
                style={{ color: '#245f91' }}
              >
                {orgTagline}
              </span>
            </div>
          </a>

          {/* Menú de Navegación Desktop */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-bold tracking-wider uppercase text-[#27384a]">
            <a href="#inicio" className="hover:text-[#245f91] transition-colors py-2">
              INICIO
            </a>
            {homeSettings.showPropertyTypes && (
              <a href="#financiacion" className="hover:text-[#245f91] transition-colors py-2">
                FINANCIACIÓN
              </a>
            )}
            {homeSettings.showHowItWorks && (
              <a href="#como-funciona" className="hover:text-[#245f91] transition-colors py-2">
                CÓMO FUNCIONA
              </a>
            )}
            {homeSettings.showInvestorSection && (
              <a href="#inversionistas" className="hover:text-[#245f91] transition-colors py-2">
                INVERSIONISTAS
              </a>
            )}
            {homeSettings.showFaq && (
              <a href="#faq" className="hover:text-[#245f91] transition-colors py-2">
                FAQ
              </a>
            )}
            {homeSettings.showContact && (
              <a href="#contacto" className="hover:text-[#245f91] transition-colors py-2">
                CONTACTO
              </a>
            )}
          </nav>

          {/* Acciones Header */}
          <div className="hidden sm:flex items-center space-x-3">
            {homeSettings.showSimulator && (
              <a
                href="#simulador"
                className="text-xs font-bold uppercase tracking-wider px-3 py-2 transition-colors hover:text-[#245f91]"
                style={{ color: primaryColor }}
              >
                SIMULAR AHORA
              </a>
            )}
            <Link
              to={`/demo/${effectiveSlug}/solicitar`}
              className="text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center hover:opacity-95 active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}
            >
              SOLICITAR FINANCIACIÓN
            </Link>
          </div>

          {/* Botón Menú Móvil */}
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
              {homeSettings.showPropertyTypes && (
                <a
                  href="#financiacion"
                  onClick={() => setMobileNavOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
                >
                  FINANCIACIÓN
                </a>
              )}
              {homeSettings.showHowItWorks && (
                <a
                  href="#como-funciona"
                  onClick={() => setMobileNavOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
                >
                  CÓMO FUNCIONA
                </a>
              )}
              {homeSettings.showInvestorSection && (
                <a
                  href="#inversionistas"
                  onClick={() => setMobileNavOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
                >
                  INVERSIONISTAS
                </a>
              )}
              {homeSettings.showFaq && (
                <a
                  href="#faq"
                  onClick={() => setMobileNavOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
                >
                  FAQ
                </a>
              )}
              {homeSettings.showContact && (
                <a
                  href="#contacto"
                  onClick={() => setMobileNavOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-[#f5f7f9]"
                >
                  CONTACTO
                </a>
              )}
              <Link
                to={`/demo/${effectiveSlug}/inversor`}
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-lg font-bold"
                style={{ backgroundColor: secondaryColor, color: accentColor }}
              >
                RED DE INVERSORES
              </Link>
            </nav>
            <div className="pt-3 border-t border-[#dfe5ea] flex flex-col gap-2">
              <Link
                to={`/demo/${effectiveSlug}/simulador`}
                onClick={() => setMobileNavOpen(false)}
                className="w-full text-center bg-[#f5f7f9] text-[#173a5e] py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                SIMULAR AHORA
              </Link>
              <Link
                to={`/demo/${effectiveSlug}/solicitar`}
                onClick={() => setMobileNavOpen(false)}
                className="w-full text-center text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: primaryColor }}
              >
                SOLICITAR FINANCIACIÓN
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 3. HERO MAESTRO FULL-BLEED (REUTILIZABLE Y EDITABLE)            */}
      {/* ============================================================== */}
      <OrganizationHero
        branding={tenant?.branding}
        homeSettings={homeSettings}
      />

      {/* ============================================================== */}
      {/* 4. MÉTRICAS DEL TENANT                                         */}
      {/* ============================================================== */}
      {homeSettings.showMetrics && (
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
      )}

      {/* ============================================================== */}
      {/* 5. INMUEBLES ADMITIDOS (SOLUCIONES)                            */}
      {/* ============================================================== */}
      {homeSettings.showPropertyTypes && (
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
                  <HomeIcon className="w-6 h-6" />
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
      )}

      {/* ============================================================== */}
      {/* 6. SIMULADOR EN VIVO (CONECTADO A REGLAS DEL TENANT)          */}
      {/* ============================================================== */}
      {homeSettings.showSimulator && (
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
                      {orgName} · Cotizador
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
                      className="w-full text-white font-bold py-3.5 shadow-md uppercase tracking-wider"
                      style={{ backgroundColor: primaryColor }}
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
      )}

      {/* ============================================================== */}
      {/* 7. CÓMO FUNCIONA (4 PASOS)                                     */}
      {/* ============================================================== */}
      {homeSettings.showHowItWorks && (
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
                <div
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center font-serif font-bold text-base"
                  style={{ backgroundColor: primaryColor }}
                >
                  1
                </div>
                <h4 className="text-lg font-serif font-bold text-[#173a5e]">Simulá</h4>
                <p className="text-xs text-[#718096] leading-relaxed">
                  Ingresá el valor del inmueble y el monto necesario para conocer las cuotas y plazos de referencia.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#dfe5ea] shadow-sm space-y-3 text-left relative">
                <div
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center font-serif font-bold text-base"
                  style={{ backgroundColor: primaryColor }}
                >
                  2
                </div>
                <h4 className="text-lg font-serif font-bold text-[#173a5e]">Completá tu solicitud</h4>
                <p className="text-xs text-[#718096] leading-relaxed">
                  Cargá los datos del bien y la documentación básica en tu expediente digital protegido.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#dfe5ea] shadow-sm space-y-3 text-left relative">
                <div
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center font-serif font-bold text-base"
                  style={{ backgroundColor: primaryColor }}
                >
                  3
                </div>
                <h4 className="text-lg font-serif font-bold text-[#173a5e]">Evaluamos</h4>
                <p className="text-xs text-[#718096] leading-relaxed">
                  Realizamos el análisis pericial de tasación y el estudio notarial preliminar del título.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#dfe5ea] shadow-sm space-y-3 text-left relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-serif font-black text-base"
                  style={{ backgroundColor: accentColor, color: '#0b2238' }}
                >
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
      )}

      {/* ============================================================== */}
      {/* 8. BLOQUE "UNA OPERACIÓN, TODO ORDENADO" (SPLIT)              */}
      {/* ============================================================== */}
      {homeSettings.showOperationSection && (
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
      )}

      {/* ============================================================== */}
      {/* 9. INVERSIONISTAS                                              */}
      {/* ============================================================== */}
      {homeSettings.showInvestorSection && (
        <section
          id="inversionistas"
          className="py-16 sm:py-24 text-white text-left"
          style={{ backgroundColor: secondaryColor }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest block" style={{ color: accentColor }}>
                ÁREA DE INVERSIÓN
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                Capital respaldado por activos reales.
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                {orgName} estructura operaciones de financiamiento con garantía hipotecaria formalizada en Uruguay.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-6 rounded-2xl border border-white/10 space-y-3" style={{ backgroundColor: `${primaryColor}CC` }}>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: accentColor }}>GARANTÍA</span>
                <h4 className="text-base font-serif font-bold text-white">Inmueble identificado</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cada operación cuenta con una propiedad raíz determinada con títulos verificados por escribano.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 space-y-3" style={{ backgroundColor: `${primaryColor}CC` }}>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: accentColor }}>VALUACIÓN</span>
                <h4 className="text-base font-serif font-bold text-white">Análisis de respaldo</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Peritaje técnico para asegurar una adecuada relación entre el capital financiado y el activo.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 space-y-3" style={{ backgroundColor: `${primaryColor}CC` }}>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: accentColor }}>EXPEDIENTE</span>
                <h4 className="text-base font-serif font-bold text-white">Información estructurada</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Legajo completo con antecedentes del solicitante, certificados registrales y condiciones.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 space-y-3" style={{ backgroundColor: `${primaryColor}CC` }}>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: accentColor }}>SEGUIMIENTO</span>
                <h4 className="text-base font-serif font-bold text-white">Proceso documentado</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Trazabilidad notarial y contractual continua a lo largo de toda la vigencia de la operación.
                </p>
              </div>

            </div>

            <div className="text-center pt-2">
              <Link to={`/demo/${effectiveSlug}/inversor`}>
                <Button
                  size="lg"
                  className="font-bold shadow-lg text-xs sm:text-sm px-8 min-h-[48px]"
                  style={{ backgroundColor: accentColor, color: '#102d49' }}
                >
                  Acceder al Panel Inversor de {orgName} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 text-center max-w-3xl mx-auto text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>Aviso legal:</strong> Toda inversión implica riesgo. Las condiciones y documentación deben analizarse para cada operación particular.
              </p>
            </div>

          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 10. PREGUNTAS FRECUENTES (FAQ ACORDEÓN)                        */}
      {/* ============================================================== */}
      {homeSettings.showFaq && (
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
      )}

      {/* ============================================================== */}
      {/* 11. CONTACTO & ACCESOS RÁPIDOS                                 */}
      {/* ============================================================== */}
      {homeSettings.showContact && (
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
                <p className="text-xs text-[#718096]">Escribinos a {supportEmail} o llamanos al {supportPhone}.</p>
                <a href={`mailto:${supportEmail}`} className="inline-flex items-center text-xs font-bold text-[#173a5e] hover:text-[#245f91]">
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
      )}

      {/* ============================================================== */}
      {/* 12. FOOTER INSTITUCIONAL                                       */}
      {/* ============================================================== */}
      <footer className="bg-[#0b2238] text-slate-400 text-xs py-12 border-t border-[#102d49] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {tenant?.branding?.logo_url ? (
                <img src={tenant.branding.logo_url} alt={orgName} className="h-8 w-auto object-contain rounded" />
              ) : (
                <div
                  className="relative w-8 h-8 rounded flex items-center justify-center text-white font-serif font-bold text-base"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>{orgName.charAt(0)}</span>
                  <span
                    className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              )}
              <span className="text-base font-serif font-bold text-white">{orgName.toUpperCase()}</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Financiación & inversión con respaldo inmobiliario en Uruguay. Estructuración legal y notarial de operaciones.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Atención & Canales</h5>
            <ul className="space-y-2">
              <li>Teléfono: {supportPhone}</li>
              <li>Email: {supportEmail}</li>
              <li>Montevideo, Uruguay</li>
              <li>Horario: Lun a Vie 09:00 - 18:00 hs</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Navegación</h5>
            <ul className="space-y-2">
              <li><a href="#inicio" className="hover:text-white">Inicio</a></li>
              {homeSettings.showPropertyTypes && <li><a href="#financiacion" className="hover:text-white">Financiación</a></li>}
              {homeSettings.showSimulator && <li><Link to={`/demo/${effectiveSlug}/simulador`} className="hover:text-white">Simulador en Línea</Link></li>}
              {homeSettings.showInvestorSection && <li><Link to={`/demo/${effectiveSlug}/inversor`} className="hover:text-white">Red de Inversores</Link></li>}
              <li><Link to={`/demo/${effectiveSlug}/cliente`} className="hover:text-white">Portal de Clientes</Link></li>
              <li><Link to={`/demo/${effectiveSlug}/admin`} className="hover:text-white">Acceso Operativo (Backoffice)</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider mb-3">Marco Institucional</h5>
            <p className="text-slate-500 leading-relaxed">
              {orgName} opera como plataforma de originación y gestión de préstamos hipotecarios bajo la infraestructura tecnológica de HIPOTECALY Core.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <span>© 2026 {orgName.toUpperCase()} — Financiación & inversión.</span>
          <span className="mt-2 sm:mt-0 font-mono text-slate-400">
            Tecnología provista por HIPOTECALY Core Multi-Tenant
          </span>
        </div>
      </footer>

      {/* Botón Flotante de WhatsApp Oficial */}
      <WhatsAppFloatingButton tenantId={effectiveOrgId} organizationName={orgName} />

    </div>
  );
};
