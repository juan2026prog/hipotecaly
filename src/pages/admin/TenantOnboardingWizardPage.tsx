import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Palette,
  Sliders,
  DollarSign,
  Lock,
  UserPlus,
  Globe,
  Layout,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import {
  OFFICIAL_TEMPLATES,
  createTenantWithOnboarding,
  TenantOnboardingPayload,
} from '../../lib/tenantOnboardingService';
import { TenantModuleKey, DEFAULT_MODULES_MAP } from '../../lib/tenantModulesService';
import { TenantCostItem, DEFAULT_NOVA_COSTS } from '../../lib/tenantRulesService';

export const TenantOnboardingWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Paso 1: Datos de Empresa
  const [companyName, setCompanyName] = useState('');
  const [commercialName, setCommercialName] = useState('');
  const [slug, setSlug] = useState('');
  const [country] = useState('UY');
  const [timezone] = useState('America/Montevideo');
  const [defaultCurrency] = useState('USD');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Paso 2: Implementación y Módulos
  const [selectedTemplate, setSelectedTemplate] = useState<'integration_basic' | 'integration_complete' | 'full_whitelabel'>('full_whitelabel');
  const [modules, setModules] = useState<Record<TenantModuleKey, boolean>>({
    ...DEFAULT_MODULES_MAP,
    simulator_enabled: true,
    application_module_enabled: true,
    client_portal_enabled: true,
    staff_portal_enabled: true,
    documents_enabled: true,
    ai_enabled: true,
    valuations_enabled: true,
    signatures_enabled: true,
    servicing_enabled: true,
    payments_tracking_enabled: true,
    reminders_enabled: true,
    cancellations_enabled: true,
    notifications_enabled: true,
    protected_contact_enabled: true,
    cost_breakdown_enabled: true,
  });

  // Paso 3: Branding
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0B8A5A');
  const [secondaryColor, setSecondaryColor] = useState('#0F1E36');
  const [companyClaim, setCompanyClaim] = useState('Soluciones financieras con respaldo inmobiliario.');

  // Paso 4: Reglas Crediticias
  const [minLoanAmount, setMinLoanAmount] = useState(10000);
  const [maxLoanAmount, setMaxLoanAmount] = useState(180000);
  const [maxFinancedPercentage, setMaxFinancedPercentage] = useState(35);
  const [minTermMonths, setMinTermMonths] = useState(12);
  const [maxTermMonths, setMaxTermMonths] = useState(48);
  const [defaultRate, setDefaultRate] = useState(11.5);
  const [availableTerms, setAvailableTerms] = useState<number[]>([12, 24, 36, 48]);

  // Paso 5: Costos
  const [costConfigs, setCostConfigs] = useState<TenantCostItem[]>(DEFAULT_NOVA_COSTS);

  // Paso 6: Privacidad
  const [protectedContactEnabled, setProtectedContactEnabled] = useState(true);
  const [revealPhoneAtStatus, setRevealPhoneAtStatus] = useState('approved');
  const [revealEmailAtStatus, setRevealEmailAtStatus] = useState('approved');
  const [allowDocDownloadAtStatus, setAllowDocDownloadAtStatus] = useState('offer_available');

  // Paso 7: Usuario Interno
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState('tenant_admin');

  // Paso 8: Portal Cliente
  const [allowClientPortal, setAllowClientPortal] = useState(true);
  const [openRegistration, setOpenRegistration] = useState(true);

  // Paso 9: Dominio
  const [domainType, setDomainType] = useState<'subdomain' | 'custom' | 'preview'>('preview');
  const [customDomain, setCustomDomain] = useState('');

  // Sincronizar plantilla seleccionada
  const handleSelectTemplate = (tplCode: 'integration_basic' | 'integration_complete' | 'full_whitelabel') => {
    setSelectedTemplate(tplCode);
    const tpl = OFFICIAL_TEMPLATES.find((t) => t.code === tplCode);
    if (tpl) {
      setModules({ ...tpl.modules_config });
      if (tpl.ui_defaults) {
        setPrimaryColor(tpl.ui_defaults.primary_color);
        setSecondaryColor(tpl.ui_defaults.secondary_color);
      }
    }
  };

  const handleSlugChange = (val: string) => {
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    setSlug(sanitized);
  };

  // Validaciones por paso
  const canGoNext = () => {
    if (currentStep === 1) {
      return companyName.trim().length > 0 && slug.trim().length > 0;
    }
    if (currentStep === 4) {
      return (
        minLoanAmount > 0 &&
        maxLoanAmount >= minLoanAmount &&
        maxFinancedPercentage > 0 &&
        maxFinancedPercentage <= 100
      );
    }
    return true;
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (!canGoNext()) {
      setErrorMsg('Por favor completá los campos obligatorios antes de continuar.');
      return;
    }
    setCurrentStep((prev) => Math.min(10, prev + 1));
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleActivateTenant = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: TenantOnboardingPayload = {
      companyName: companyName.trim(),
      commercialName: commercialName.trim() || companyName.trim(),
      slug: slug.trim(),
      country,
      timezone,
      defaultCurrency,
      supportEmail: supportEmail.trim(),
      supportPhone: supportPhone.trim(),
      websiteUrl: websiteUrl.trim(),

      templateCode: selectedTemplate,
      modules,

      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      companyClaim,

      lendingRules: {
        minLoanAmount,
        maxLoanAmount,
        maxFinancedPercentage,
        minTermMonths,
        maxTermMonths,
        availableTerms,
        defaultRate,
        rateType: 'anual_fija',
        repaymentModes: ['solo_intereses', 'amortizable'],
        acceptedPropertyTypes: ['vivienda', 'local_comercial', 'terreno', 'rural'],
        acceptedRegions: ['Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'Rocha', 'Todos'],
        earlyCancellationPolicy: 'Cancelación anticipada permitida sin penalidad.',
      },

      costConfigurations: costConfigs,

      protectedContactEnabled,
      revealPhoneAtStatus,
      revealEmailAtStatus,
      allowDocumentDownloadAtStatus: allowDocDownloadAtStatus,

      initialAdminName: adminName.trim(),
      initialAdminEmail: adminEmail.trim(),
      initialAdminRole: adminRole,

      allowClientPortal,
      openRegistration,

      domainType,
      customDomain: domainType === 'custom' ? customDomain.trim() : undefined,
    };

    const res = await createTenantWithOnboarding(payload);
    setIsSubmitting(false);

    if (res.success && res.tenant) {
      // Redirigir a la landing activa del nuevo tenant
      navigate(`/org/${res.tenant.slug}`);
    } else {
      setErrorMsg(res.error || 'Ocurrió un error al activar la organización.');
    }
  };

  const stepLabels = [
    'Empresa',
    'Modalidad',
    'Branding',
    'Reglas',
    'Costos',
    'Privacidad',
    'Usuarios',
    'Portal',
    'Dominio',
    'Activación',
  ];

  return (
    <BackofficeLayout>
      <div className="max-w-5xl mx-auto space-y-6 text-left pb-16">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">
              Super Admin · Onboarding de Clientes
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mt-0.5">
              Alta de Nuevo Cliente White-Label
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configuración modular llave en mano lista para operar en tiempo real sobre el mismo Core.
            </p>
          </div>

          <Link to="/admin/tenants">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver a Tenants
            </Button>
          </Link>
        </div>

        {/* Stepper Superior */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] text-xs">
            {stepLabels.map((lbl, idx) => {
              const num = idx + 1;
              const isCurrent = currentStep === num;
              const isDone = currentStep > num;
              return (
                <button
                  key={num}
                  onClick={() => setCurrentStep(num)}
                  className={`flex items-center space-x-1.5 px-2 py-1 rounded transition-colors ${
                    isCurrent
                      ? 'font-bold text-navy bg-slate-100'
                      : isDone
                      ? 'text-brand-green font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-navy text-white'
                        : isDone
                        ? 'bg-brand-green-light text-brand-green-dark'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isDone ? '✓' : num}
                  </span>
                  <span className="truncate">{lbl}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CONTENEDOR CENTRAL DEL PASO ACTUAL */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md">
          
          {/* ============================================================ */}
          {/* PASO 1: DATOS DE EMPRESA                                     */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-navy flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-brand-green" /> Paso 1 — Datos de la Empresa
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Información legal e identificadores únicos de la organización en la plataforma.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Razón Social / Nombre Legal *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ORION Crédito Inmobiliario S.A."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-navy focus:border-navy"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nombre Comercial Público *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ORION Crédito Inmobiliario"
                    value={commercialName}
                    onChange={(e) => setCommercialName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold text-navy focus:border-navy"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Identificador de Ruta / Slug Único *
                  </label>
                  <div className="flex items-center">
                    <span className="p-2.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 font-mono text-[11px]">
                      /org/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="orion-qa"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="w-full p-2.5 rounded-r-lg border border-slate-300 font-mono font-bold text-navy focus:border-navy"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Solo letras minúsculas, números y guiones.
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email de Soporte</label>
                  <input
                    type="email"
                    placeholder="soporte@orioncredito.uy"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700 focus:border-navy"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono de Soporte</label>
                  <input
                    type="text"
                    placeholder="+598 2900 1234"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700 focus:border-navy"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sitio Web Actual (si dispone)</label>
                  <input
                    type="url"
                    placeholder="https://www.orioncredito.uy"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700 focus:border-navy"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 2: TIPO DE IMPLEMENTACIÓN Y MÓDULOS                     */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-navy flex items-center">
                  <Layout className="w-5 h-5 mr-2 text-brand-green" /> Paso 2 — Tipo de Implementación
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seleccioná la plantilla base. Las plantillas configuran los módulos iniciales y pueden personalizarse.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {OFFICIAL_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplate === tpl.code;
                  return (
                    <div
                      key={tpl.code}
                      onClick={() => handleSelectTemplate(tpl.code)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-green bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-navy">{tpl.name}</h4>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-green" />}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {tpl.description}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Modalidad {tpl.implementation_type}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Conmutadores de Módulos */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-3">
                  Ajuste Fino de Módulos Habilitados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(modules).map(([key, enabled]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="text-slate-700 font-mono text-[11px]">{key}</span>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          setModules({ ...modules, [key as TenantModuleKey]: e.target.checked })
                        }
                        className="rounded text-brand-green focus:ring-brand-green w-4 h-4"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 3: BRANDING CON PREVIEW EN VIVO                         */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-navy flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-brand-green" /> Paso 3 — Identidad Visual & Branding
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Personalizá los colores y estilo que se aplicarán de forma reactiva al sitio y portal del tenant.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Color Primario *</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="p-2 border border-slate-300 rounded font-mono font-bold w-28 uppercase text-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Color Secundario *</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="p-2 border border-slate-300 rounded font-mono font-bold w-28 uppercase text-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Eslogan / Claim Institucional</label>
                    <input
                      type="text"
                      value={companyClaim}
                      onChange={(e) => setCompanyClaim(e.target.value)}
                      placeholder="Soluciones financieras con respaldo inmobiliario."
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">URL del Logo (Opcional)</label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://.../logo.png"
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">URL del Favicon (Opcional)</label>
                    <input
                      type="url"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      placeholder="https://.../favicon.ico"
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700"
                    />
                  </div>
                </div>

                {/* PREVIEW EN TIEMPO REAL CON THEMING OFICIAL */}
                <div className="lg:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Vista Previa en Tiempo Real
                  </span>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-3">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {(commercialName || companyName || 'N').charAt(0)}
                      </div>
                      <div>
                        <strong className="text-sm text-navy block leading-none">
                          {commercialName || companyName || 'Nueva Organización'}
                        </strong>
                        <span className="text-[10px] text-slate-500">{companyClaim}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border text-xs" style={{ borderColor: primaryColor + '40', backgroundColor: primaryColor + '08' }}>
                      <span className="font-bold block" style={{ color: primaryColor }}>
                        Simulador Configurado
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Hasta {maxFinancedPercentage}% financiado · Máximo USD {maxLoanAmount.toLocaleString()}
                      </p>
                    </div>

                    <button
                      className="w-full py-2 rounded-lg text-white font-bold text-xs shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      CONTINUAR SOLICITUD
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 4: REGLAS CREDITICIAS                                   */}
          {/* ============================================================ */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-navy flex items-center">
                  <Sliders className="w-5 h-5 mr-2 text-brand-green" /> Paso 4 — Reglas Crediticias y Límites
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parámetros del simulador y criterios de admisión (Se usa exclusivamente el término &quot;Porcentaje financiado&quot;).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Porcentaje Financiado Máximo (%) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={maxFinancedPercentage}
                    onChange={(e) => setMaxFinancedPercentage(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold text-navy text-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tope máximo sobre valor de tasación.</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monto Máximo (USD) *</label>
                  <input
                    type="number"
                    step={5000}
                    value={maxLoanAmount}
                    onChange={(e) => setMaxLoanAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold text-navy text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plazo Máximo (meses) *</label>
                  <input
                    type="number"
                    value={maxTermMonths}
                    onChange={(e) => setMaxTermMonths(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold text-navy text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plazo Mínimo (meses)</label>
                  <input
                    type="number"
                    value={minTermMonths}
                    onChange={(e) => setMinTermMonths(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monto Mínimo (USD)</label>
                  <input
                    type="number"
                    value={minLoanAmount}
                    onChange={(e) => setMinLoanAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tasa Anual de Referencia (%)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={defaultRate}
                    onChange={(e) => setDefaultRate(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plazos Disponibles (meses)</label>
                  <input
                    type="text"
                    value={availableTerms.join(', ')}
                    onChange={(e) =>
                      setAvailableTerms(
                        e.target.value
                          .split(',')
                          .map((s) => Number(s.trim()))
                          .filter((n) => n > 0)
                      )
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 5: COSTOS DE FORMALIZACIÓN                              */}
          {/* ============================================================ */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-navy flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-brand-green" /> Paso 5 — Configuración de Costos
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gastos notariales, registrales y administrativos que se desglosan en las propuestas y simulaciones.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {costConfigs.map((cost, idx) => (
                  <div
                    key={cost.costKey}
                    className="p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-4">
                      <span className="font-bold text-navy block capitalize">
                        {cost.costKey.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">{cost.notes || ''}</span>
                    </div>

                    <div className="sm:col-span-4 flex items-center space-x-2">
                      <select
                        value={cost.costType}
                        onChange={(e) => {
                          const updated = [...costConfigs];
                          updated[idx].costType = e.target.value as any;
                          setCostConfigs(updated);
                        }}
                        className="p-2 rounded border border-slate-300 text-xs text-navy font-semibold"
                      >
                        <option value="percentage">Porcentaje (%)</option>
                        <option value="fixed">Monto Fijo (USD)</option>
                        <option value="manual_estimate">A Definir / Estimado</option>
                        <option value="disabled">Deshabilitado</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <input
                        type="number"
                        step={0.1}
                        value={cost.costType === 'percentage' ? cost.percentageRate : cost.fixedAmount}
                        disabled={cost.costType === 'disabled' || cost.costType === 'manual_estimate'}
                        onChange={(e) => {
                          const updated = [...costConfigs];
                          const val = Number(e.target.value);
                          if (cost.costType === 'percentage') {
                            updated[idx].percentageRate = val;
                          } else {
                            updated[idx].fixedAmount = val;
                          }
                          setCostConfigs(updated);
                        }}
                        className="w-full p-2 rounded border border-slate-300 font-mono text-xs text-navy font-bold disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 6: PRIVACIDAD Y ENMASCARAMIENTO                         */}
          {/* ============================================================ */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-navy flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-brand-green" /> Paso 6 — Privacidad y Reglas Anti-Bypass
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control de visualización de datos sensibles del solicitante según la etapa operativa.
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Nota operativa:</strong> Estas reglas controlan cuándo se exponen datos sensibles dentro del flujo operativo entre analistas, inversores y el expediente.
              </div>

              <div className="space-y-4 text-xs">
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={protectedContactEnabled}
                    onChange={(e) => setProtectedContactEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-green focus:ring-brand-green"
                  />
                  <div>
                    <span className="font-bold text-navy block">Activar enmascaramiento de contacto</span>
                    <span className="text-slate-500 text-[11px]">
                      Oculta teléfono (09X XXX 123) y correo (j***@correo.com) hasta alcanzar la etapa designada.
                    </span>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Revelar Teléfono a partir de:</label>
                    <select
                      value={revealPhoneAtStatus}
                      onChange={(e) => setRevealPhoneAtStatus(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-navy font-semibold"
                    >
                      <option value="approved">Aprobada (approved)</option>
                      <option value="offer_available">Propuesta disponible (offer_available)</option>
                      <option value="formalization">Formalización notarial</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Revelar Correo a partir de:</label>
                    <select
                      value={revealEmailAtStatus}
                      onChange={(e) => setRevealEmailAtStatus(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-navy font-semibold"
                    >
                      <option value="approved">Aprobada (approved)</option>
                      <option value="offer_available">Propuesta disponible (offer_available)</option>
                      <option value="formalization">Formalización notarial</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Descarga Documental a partir de:</label>
                    <select
                      value={allowDocDownloadAtStatus}
                      onChange={(e) => setAllowDocDownloadAtStatus(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-navy font-semibold"
                    >
                      <option value="offer_available">Propuesta disponible (offer_available)</option>
                      <option value="approved">Aprobada (approved)</option>
                      <option value="formalization">Formalización notarial</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 7: USUARIOS INTERNOS                                    */}
          {/* ============================================================ */}
          {currentStep === 7 && (
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-navy flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-brand-green" /> Paso 7 — Usuario Administrador Inicial
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Invitación segura del primer responsable de la organización. No requiere fijar contraseñas manuales.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    placeholder="Ej. Dra. Laura Gómez"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="laura.gomez@orioncredito.uy"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rol Operativo</label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold"
                  >
                    <option value="tenant_admin">Administrador del Tenant</option>
                    <option value="analyst">Analista de Crédito</option>
                    <option value="advisor">Asesor Comercial</option>
                    <option value="operations">Oficial de Operaciones</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 8: PORTAL DEL SOLICITANTE                              */}
          {/* ============================================================ */}
          {currentStep === 8 && (
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-navy flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-brand-green" /> Paso 8 — Portal del Prestatario
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configuración de acceso al portal privado `/mi-cuenta` bajo aislamiento RLS.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowClientPortal}
                    onChange={(e) => setAllowClientPortal(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-green focus:ring-brand-green"
                  />
                  <div>
                    <span className="font-bold text-navy block">Habilitar Portal de Clientes</span>
                    <span className="text-slate-500 text-[11px]">
                      Permite que los solicitantes consulten sus ofertas y suban recaudos.
                    </span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openRegistration}
                    onChange={(e) => setOpenRegistration(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-green focus:ring-brand-green"
                  />
                  <div>
                    <span className="font-bold text-navy block">Registro Abierto de Solicitantes</span>
                    <span className="text-slate-500 text-[11px]">
                      Cualquier prestatario puede auto-registrarse al completar el simulador.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 9: DOMINIO Y RUTAS                                      */}
          {/* ============================================================ */}
          {currentStep === 9 && (
            <div className="space-y-5">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-navy flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-brand-green" /> Paso 9 — Dominio y Accesos
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seleccioná cómo resolverá la identidad del cliente en producción.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div
                  onClick={() => setDomainType('preview')}
                  className={`p-4 rounded-xl border-2 cursor-pointer ${
                    domainType === 'preview' ? 'border-brand-green bg-emerald-50/50' : 'border-slate-200'
                  }`}
                >
                  <span className="font-bold text-navy block mb-1">Ruta Inmediata de Preview</span>
                  <span className="text-slate-500 text-[11px] block mb-2">
                    Acceso instantáneo mediante ruta oficial.
                  </span>
                  <strong className="font-mono text-brand-green">/org/{slug || 'mi-tenant'}</strong>
                </div>

                <div
                  onClick={() => setDomainType('subdomain')}
                  className={`p-4 rounded-xl border-2 cursor-pointer ${
                    domainType === 'subdomain' ? 'border-brand-green bg-emerald-50/50' : 'border-slate-200'
                  }`}
                >
                  <span className="font-bold text-navy block mb-1">Subdominio HIPOTECALY</span>
                  <span className="text-slate-500 text-[11px] block mb-2">
                    Delegado en la infraestructura cloud.
                  </span>
                  <strong className="font-mono text-brand-green">{slug || 'cliente'}.hipotecaly.app</strong>
                </div>

                <div
                  onClick={() => setDomainType('custom')}
                  className={`p-4 rounded-xl border-2 cursor-pointer ${
                    domainType === 'custom' ? 'border-brand-green bg-emerald-50/50' : 'border-slate-200'
                  }`}
                >
                  <span className="font-bold text-navy block mb-1">Dominio Propio (CNAME)</span>
                  <span className="text-slate-500 text-[11px] block mb-2">
                    Para marcas institucionales establecidas.
                  </span>
                  <input
                    type="text"
                    placeholder="creditos.cliente.com.uy"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASO 10: RESUMEN Y ACTIVACIÓN EN CALIENTE                    */}
          {/* ============================================================ */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-navy flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-brand-green" /> Paso 10 — Resumen de Configuración & Activación
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verificá los parámetros antes de poner en servicio la organización.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Organización:</span>
                  <strong className="text-sm text-navy">{companyName}</strong> ({commercialName})
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Ruta / Identificador:</span>
                  <strong className="font-mono text-brand-green">/org/{slug}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Modalidad:</span>
                  <span className="capitalize font-bold text-navy">{selectedTemplate.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Porcentaje Financiado Máximo:</span>
                  <strong className="font-mono text-navy font-bold">{maxFinancedPercentage}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Monto Máximo:</span>
                  <strong className="font-mono text-navy font-bold">USD {maxLoanAmount.toLocaleString('es-UY')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Plazo Máximo:</span>
                  <strong className="font-mono text-navy font-bold">{maxTermMonths} meses</strong>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold block mb-1">Cero Fricción · Despliegue Inmediato:</span>
                Al pulsar &quot;ACTIVAR TENANT&quot;, la organización quedará activa de inmediato en el router transversal, el simulador responderá con sus reglas comerciales y el backoffice quedará aislado.
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  onClick={handleActivateTenant}
                  className="w-full shadow-lg"
                >
                  {isSubmitting ? 'ACTIVANDO ORGANIZACIÓN...' : 'ACTIVAR TENANT AHORA'}
                </Button>
              </div>
            </div>
          )}

          {/* BOTONES DE NAVEGACIÓN ANTERIOR / SIGUIENTE */}
          {currentStep < 10 && (
            <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-6">
              <Button
                variant="outline"
                size="md"
                disabled={currentStep === 1}
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
              >
                Siguiente Paso <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

        </div>

      </div>
    </BackofficeLayout>
  );
};
