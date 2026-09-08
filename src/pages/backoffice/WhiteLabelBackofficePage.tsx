import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { Button } from '../../components/ui/Button';
import { useTenant } from '../../contexts/TenantContext';
import {
  WhiteLabelCustomization,
  DEFAULT_WHITELABEL_CONFIG,
  getWhiteLabelCustomization,
  saveWhiteLabelCustomization,
} from '../../lib/tenantCustomizationService';
import {
  Palette,
  Sliders,
  Globe,
  Layout,
  Receipt,
  Mail,
  ShieldAlert,
  Puzzle,
  CheckCircle2,
  Save,
  RotateCcw,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Download,
  Upload,
  Smartphone,
  Monitor,
  Check,
  Play,
  History,
  FileCheck,
  Send,
} from 'lucide-react';
import {
  getActivePolicy,
  getPolicyVersions,
  publishPolicy,
  simulatePolicyEvaluation,
  getActiveCosts,
  PolicyVersion,
} from '../../lib/policyEngine';
import {
  getCommunicationTemplates,
  sendApplicationCommunication,
  CommunicationTemplate,
} from '../../lib/communicationsService';

const COLOR_PRESETS = [
  {
    name: 'NOVA Créditos (Azul / Verde Teal)',
    primary: '#0A3A60',
    secondary: '#16A184',
    accent: '#F59E0B',
    bg: '#F8FAFC',
  },
  {
    name: 'HIPOTECALY Core (Esmeralda / Navy)',
    primary: '#0B8A5A',
    secondary: '#0F1E36',
    accent: '#10B981',
    bg: '#F8FAFC',
  },
  {
    name: 'Estudio Notarial (Azul Marino / Royal)',
    primary: '#1E40AF',
    secondary: '#172554',
    accent: '#3B82F6',
    bg: '#F8FAFC',
  },
  {
    name: 'Fiduciaria Boutique (Borgoña / Oro)',
    primary: '#881337',
    secondary: '#4C0519',
    accent: '#D97706',
    bg: '#FFFBEB',
  },
  {
    name: 'Carbón Minimalista (Slate / Grafito)',
    primary: '#0F172A',
    secondary: '#334155',
    accent: '#06B6D4',
    bg: '#F1F5F9',
  },
];

export const WhiteLabelBackofficePage: React.FC = () => {
  const { tenant } = useTenant();
  const [config, setConfig] = useState<WhiteLabelCustomization>(DEFAULT_WHITELABEL_CONFIG);
  const [activeTab, setActiveTab] = useState<
    'branding' | 'underwriting' | 'domain' | 'landing' | 'costs' | 'communications' | 'legal' | 'modules'
  >('branding');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [simulatedDnsChecking, setSimulatedDnsChecking] = useState(false);

  // Estados de Motor de Políticas (Pass 5)
  const [activePolicy, setActivePolicy] = useState<PolicyVersion>(() => getActivePolicy(tenant.id));
  const [policyVersions, setPolicyVersions] = useState<PolicyVersion[]>(() => getPolicyVersions(tenant.id));
  const [activeCosts, setActiveCosts] = useState(() => getActiveCosts(tenant.id));
  const [commTemplates, setCommTemplates] = useState<CommunicationTemplate[]>(() => getCommunicationTemplates());

  // Simulador de Políticas ("PROBAR POLÍTICA")
  const [showSimModal, setShowSimModal] = useState(false);
  const [simAmount, setSimAmount] = useState(50000);
  const [simPropValue, setSimPropValue] = useState(120000);
  const [simPropType, setSimPropType] = useState('apartamento');
  const [simTermMonths, setSimTermMonths] = useState(36);
  const [simHasIncomeDocs, setSimHasIncomeDocs] = useState(true);
  const [simHasCleanClearing, setSimHasCleanClearing] = useState(true);
  const [simResult, setSimResult] = useState<ReturnType<typeof simulatePolicyEvaluation> | null>(null);

  // Modal de Publicación de Políticas
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishNotes, setPublishNotes] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishSuccessToast, setPublishSuccessToast] = useState<string | null>(null);

  // Test de Comunicaciones
  const [testCommRecipient, setTestCommRecipient] = useState('solicitante@ejemplo.com');
  const [testCommSuccess, setTestCommSuccess] = useState<string | null>(null);

  // Cargar datos del tenant
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getWhiteLabelCustomization(tenant.id, tenant.slug);
      setConfig(data);
      setActivePolicy(getActivePolicy(tenant.id));
      setPolicyVersions(getPolicyVersions(tenant.id));
      setActiveCosts(getActiveCosts(tenant.id));
      setCommTemplates(getCommunicationTemplates());
      setLoading(false);
    }
    loadData();
  }, [tenant.id, tenant.slug]);

  // Guardar configuración completa
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await saveWhiteLabelCustomization(config);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch {
      // Ignorar
    } finally {
      setSaving(false);
    }
  };

  // Restaurar valores por defecto
  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restaurar los valores de fábrica para esta instancia White-Label?')) {
      const reset = { ...DEFAULT_WHITELABEL_CONFIG, tenantId: tenant.id, slug: tenant.slug };
      setConfig(reset);
    }
  };

  // Exportar JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `whitelabel-config-${config.slug}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Importar JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setConfig({ ...parsed, tenantId: tenant.id, slug: tenant.slug });
          alert('Configuración importada exitosamente. Recuerda presionar "Guardar Cambios".');
        } catch {
          alert('El archivo JSON proporcionado es inválido.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Simulador de cálculo en vivo para preview de costos
  const exampleLoanAmount = 100000;
  const notaryFee = Math.round(exampleLoanAmount * (config.notaryFeePercentage / 100));
  const adminFee = Math.round(exampleLoanAmount * (config.administrativeFeePercentage / 100));
  const totalDeductions = notaryFee + adminFee + config.appraisalFeeUsd + config.certificatesFeeUsd + config.registryFeeUsd;
  const netDisbursed = exampleLoanAmount - totalDeductions;

  // Calculo de cuota estimada para el preview
  const monthlyRate = config.defaultInterestRate / 100 / 12;
  const sampleTerm = config.availableTerms[0] || 36;
  const sampleEstimatedMonthly = Math.round(
    config.repaymentModes.includes('solo_intereses')
      ? exampleLoanAmount * monthlyRate
      : (exampleLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, sampleTerm))) /
          (Math.pow(1 + monthlyRate, sampleTerm) - 1)
  );

  // Manejadores de Motor de Políticas (Pass 5)
  const handleOpenSimulator = () => {
    const result = simulatePolicyEvaluation(activePolicy, {
      requestedAmount: simAmount,
      propertyEstimatedValue: simPropValue,
      propertyType: simPropType,
      termMonths: simTermMonths,
      hasIncomeDocs: simHasIncomeDocs,
      hasCleanClearing: simHasCleanClearing,
    });
    setSimResult(result);
    setShowSimModal(true);
  };

  const handleRunSimulator = () => {
    const result = simulatePolicyEvaluation(activePolicy, {
      requestedAmount: simAmount,
      propertyEstimatedValue: simPropValue,
      propertyType: simPropType,
      termMonths: simTermMonths,
      hasIncomeDocs: simHasIncomeDocs,
      hasCleanClearing: simHasCleanClearing,
    });
    setSimResult(result);
  };

  const handlePublishPolicyAction = async () => {
    setPublishing(true);
    try {
      const newPol = await publishPolicy({
        organizationId: tenant.id,
        draft: {
          max_ltv_percent: config.maxLtv,
          base_annual_rate: config.defaultInterestRate,
          min_amount_usd: config.minLoanAmount,
          max_amount_usd: config.maxLoanAmount,
          notes: publishNotes || 'Actualización de política crediticia desde el panel White Label.',
        },
        userName: 'Admin WhiteLabel',
        userRole: 'admin',
      });
      setActivePolicy(newPol);
      setPolicyVersions(getPolicyVersions(tenant.id));
      setShowPublishModal(false);
      setPublishNotes('');
      setPublishSuccessToast(`¡${newPol.version_label} publicada con éxito con registro inmutable!`);
      setTimeout(() => setPublishSuccessToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error al publicar la política.');
    } finally {
      setPublishing(false);
    }
  };

  const handleTestSendComm = async (templateCode: string) => {
    try {
      const res = await sendApplicationCommunication({
        organizationId: tenant.id,
        applicationId: 'e0000000-0000-0000-0000-000000000001',
        templateCode,
        channel: 'email',
        recipient: testCommRecipient,
        deliveryType: 'MANUAL',
        userName: 'Admin Operaciones',
        variables: {
          '{{cliente.nombre}}': 'María López',
          '{{expediente.id}}': 'HIP-DEMO-00124',
          '{{expediente.monto}}': '65.000',
          '{{propiedad.direccion}}': 'Bvar. Artigas 1240, Pocitos',
          '{{responsable.nombre}}': 'Esc. María Pérez Morales',
          '{{fecha_limite}}': '15/09/2026',
        },
      });
      setTestCommSuccess(`Notificación enviada vía ${res.channel.toUpperCase()} a ${testCommRecipient}`);
      setTimeout(() => setTestCommSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al enviar la comunicación.');
    }
  };

  if (loading) {
    return (
      <BackofficeLayout title="Consola Integral White-Label & Marca">
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-green rounded-full animate-spin" />
        </div>
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout title="Consola Integral White-Label & Marca">
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        
        {/* ============================================================ */}
        {/* 1. ENCABEZADO Y BARRA DE ACCIONES SUPERIOR                   */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                style={{ backgroundColor: config.primaryColor }}
              >
                {config.publicName.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight flex items-center gap-2">
                  <span>{config.publicName}</span>
                  <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    White-Label Activo
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Instancia: <strong className="font-mono text-navy">{config.slug}</strong> · Dominio:{' '}
                  <span className="font-mono text-brand-green font-bold">{config.customDomain}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
                showLivePreview ? 'bg-slate-100 border-slate-300 text-navy' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {showLivePreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{showLivePreview ? 'Ocultar Vista Previa' : 'Ver Vista Previa'}</span>
            </button>

            <Link
              to={`/org/${config.slug}`}
              target="_blank"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:text-navy hover:bg-slate-50 transition-colors flex items-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Portal Real</span>
            </Link>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSaveAll()}
              disabled={saving}
              className="shadow-sm font-bold"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Guardando...' : 'Guardar y Aplicar'}
            </Button>
          </div>
        </div>

        {/* Notificación de guardado exitoso */}
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>¡Configuración White-Label aplicada en caliente y persistida exitosamente en toda la plataforma!</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 uppercase">CSS & Reglas Actualizadas</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. NAVEGACIÓN LATERAL (sidebar) + CONTENIDO                  */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Sidebar de navegación - Desktop */}
          <div className="lg:col-span-3">
            {/* Mobile: dropdown selector */}
            <div className="lg:hidden mb-4">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm font-semibold text-navy bg-white focus:border-navy focus:ring-2 focus:ring-navy/20"
              >
                {[
                  { id: 'branding', label: 'Identidad & Marca', icon: '🎨' },
                  { id: 'underwriting', label: 'Políticas & Riesgo', icon: '⚖️' },
                  { id: 'domain', label: 'Dominio & SSL', icon: '🌐' },
                  { id: 'landing', label: 'Landing & Funnel', icon: '📱' },
                  { id: 'costs', label: 'Costos & Honorarios', icon: '💰' },
                  { id: 'communications', label: 'Comunicaciones', icon: '📧' },
                  { id: 'legal', label: 'Legal & Privacidad', icon: '🛡️' },
                  { id: 'modules', label: 'Módulos & Add-ons', icon: '🧩' },
                ].map((tab) => (
                  <option key={tab.id} value={tab.id}>{tab.icon} {tab.label}</option>
                ))}
              </select>
            </div>

            {/* Desktop: sidebar vertical */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
              <div className="p-3 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">White Label</span>
              </div>
              <nav className="p-2 space-y-0.5">
                {[
                  { id: 'branding', label: 'Identidad & Marca', icon: Palette, desc: 'Colores, logos, tipografía' },
                  { id: 'underwriting', label: 'Políticas & Riesgo', icon: Sliders, desc: 'Tasas, LTV, requisitos' },
                  { id: 'domain', label: 'Dominio & SSL', icon: Globe, desc: 'Dominio, CNAME, email' },
                  { id: 'landing', label: 'Landing & Funnel', icon: Layout, desc: 'Hero, CTA, pasos' },
                  { id: 'costs', label: 'Costos & Honorarios', icon: Receipt, desc: 'Honorarios, gastos' },
                  { id: 'communications', label: 'Comunicaciones', icon: Mail, desc: 'Plantillas, canales' },
                  { id: 'legal', label: 'Legal & Privacidad', icon: ShieldAlert, desc: 'T&C, privacidad' },
                  { id: 'modules', label: 'Módulos & Add-ons', icon: Puzzle, desc: 'Funcionalidades SaaS' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-navy text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-navy'}`}>{tab.label}</p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{tab.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Área de contenido */}
          <div className={showLivePreview ? 'lg:col-span-6 space-y-6' : 'lg:col-span-9 space-y-6'}>


            
            {/* -------------------------------------------------------- */}
            {/* TAB 1: IDENTIDAD & BRANDING                              */}
            {/* -------------------------------------------------------- */}
            {activeTab === 'branding' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <Palette className="w-5 h-5 text-brand-green" /> Identidad Visual y Estilos de Marca
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Personalizá los colores, logotipos, tipografías y el estilo visual de los portales de tus clientes.
                  </p>
                </div>

                {/* Presets Rápidos */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Paletas de Colores Preconfiguradas (1-Clic)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COLOR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setConfig({
                            ...config,
                            primaryColor: p.primary,
                            secondaryColor: p.secondary,
                            accentColor: p.accent,
                            backgroundColor: p.bg,
                          });
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-navy flex items-center justify-between text-left text-xs transition-all bg-slate-50/50 hover:bg-slate-50"
                      >
                        <span className="font-semibold text-slate-700 truncate mr-2">{p.name}</span>
                        <div className="flex items-center space-x-1 shrink-0">
                          <span className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: p.primary }} />
                          <span className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: p.secondary }} />
                          <span className="w-4 h-4 rounded-full border border-white shadow-xs" style={{ backgroundColor: p.accent }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Datos de Empresa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Comercial Público</label>
                    <input
                      type="text"
                      value={config.publicName}
                      onChange={(e) => setConfig({ ...config, publicName: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-bold text-navy focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Razón Social Legal</label>
                    <input
                      type="text"
                      value={config.legalName}
                      onChange={(e) => setConfig({ ...config, legalName: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-700 focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">RUT / Tax ID (Uruguay)</label>
                    <input
                      type="text"
                      value={config.rut}
                      onChange={(e) => setConfig({ ...config, rut: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono text-slate-700 focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Eslogan Comercial</label>
                    <input
                      type="text"
                      value={config.tagline}
                      onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-700 focus:border-navy"
                    />
                  </div>
                </div>

                {/* Paleta Hexadecimal Custom */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Color Primario (Botones & Acento)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5 shrink-0"
                      />
                      <input
                        type="text"
                        value={config.primaryColor}
                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold uppercase text-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Color Secundario (Navbar & Cards)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={config.secondaryColor}
                        onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5 shrink-0"
                      />
                      <input
                        type="text"
                        value={config.secondaryColor}
                        onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold uppercase text-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Color de Fondo del Portal</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                        className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5 shrink-0"
                      />
                      <input
                        type="text"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold uppercase text-navy"
                      />
                    </div>
                  </div>
                </div>

                {/* Tipografía y Bordes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Familia Tipográfica</label>
                    <select
                      value={config.typography}
                      onChange={(e) => setConfig({ ...config, typography: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-bold bg-white text-navy focus:border-navy"
                    >
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans (Moderna & Tech)</option>
                      <option value="Inter">Inter (Limpia & Minimalista)</option>
                      <option value="Outfit">Outfit (Moderna & Redondeada)</option>
                      <option value="DM Sans">DM Sans (Elegante Fintech)</option>
                      <option value="Playfair Display">Playfair Display (Tradicional Notarial)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Radio de Bordes en UI</label>
                    <select
                      value={config.borderRadius}
                      onChange={(e) => setConfig({ ...config, borderRadius: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-bold bg-white text-navy focus:border-navy"
                    >
                      <option value="rounded-lg">Bordes Estándar (8px)</option>
                      <option value="rounded-2xl">Bordes Suaves (16px)</option>
                      <option value="rounded-none">Bordes Rectos / Minimalista (0px)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 2: POLÍTICAS & UNDERWRITING                          */}
            {/* -------------------------------------------------------- */}
            {activeTab === 'underwriting' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-navy flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-brand-green" /> Motor de Políticas Crediticias y Riesgo
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Definí los límites cuantitativos, tasas y requisitos que el simulador y el wizard exigirán a los solicitantes.
                    </p>
                  </div>
                  
                  {/* Acciones de Política: Probar y Publicar */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenSimulator}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-700" />
                      <span>PROBAR POLÍTICA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPublishModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#102d49] hover:bg-[#173a5e] text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-[#f4b43b]" />
                      <span>Publicar Versión</span>
                    </button>
                  </div>
                </div>

                {/* Banner de Versión Activa */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#102d49] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-[#f4b43b] uppercase tracking-wider">
                        Versión Activa en Producción
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{activePolicy.version_label}: {activePolicy.title}</h4>
                    <p className="text-[11px] text-slate-300">
                      Publicada por {activePolicy.author_name} el {new Date(activePolicy.published_at).toLocaleDateString('es-UY')}.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">LTV Activo / Tasa</span>
                    <span className="text-lg font-black font-mono text-emerald-400">{activePolicy.max_ltv_percent}% LTV · {activePolicy.base_annual_rate}% Anual</span>
                  </div>
                </div>

                {publishSuccessToast && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{publishSuccessToast}</span>
                  </div>
                )}

                {/* Slider LTV */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-navy">Tope Máximo Financiado (LTV %)</label>
                    <span className="text-lg font-black text-brand-green font-mono">{config.maxLtv}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="70"
                    step="5"
                    value={config.maxLtv}
                    onChange={(e) => setConfig({ ...config, maxLtv: Number(e.target.value) })}
                    className="w-full accent-brand-green cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Porcentaje máximo del valor de tasación del inmueble que el solicitante podrá pedir en el simulador.
                  </span>
                </div>

                {/* Montos y Tasas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Monto Mínimo (USD)</label>
                    <input
                      type="number"
                      value={config.minLoanAmount}
                      onChange={(e) => setConfig({ ...config, minLoanAmount: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold text-navy"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Monto Máximo (USD)</label>
                    <input
                      type="number"
                      value={config.maxLoanAmount}
                      onChange={(e) => setConfig({ ...config, maxLoanAmount: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold text-navy"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tasa Base Anual (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.defaultInterestRate}
                      onChange={(e) => setConfig({ ...config, defaultInterestRate: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold text-navy"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tasa Moratoria (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.moratoryRate}
                      onChange={(e) => setConfig({ ...config, moratoryRate: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold text-navy"
                    />
                  </div>
                </div>

                {/* Modalidades de Amortización */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block">Modalidades de Amortización Permitidas</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'solo_intereses', label: 'Solo Intereses (Bullet Capital)' },
                      { id: 'amortizable', label: 'Sistema Francés (Cuota Fija)' },
                      { id: 'bullet', label: 'Pago Único al Vencimiento' },
                    ].map((mode) => {
                      const isChecked = config.repaymentModes.includes(mode.id as any);
                      return (
                        <label
                          key={mode.id}
                          className={`p-3 rounded-xl border flex items-center space-x-2.5 cursor-pointer text-xs ${
                            isChecked ? 'bg-emerald-50/50 border-brand-green text-navy font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConfig({ ...config, repaymentModes: [...config.repaymentModes, mode.id as any] });
                              } else if (config.repaymentModes.length > 1) {
                                setConfig({ ...config, repaymentModes: config.repaymentModes.filter((m) => m !== mode.id) });
                              }
                            }}
                            className="rounded text-brand-green"
                          />
                          <span>{mode.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Política de Cancelación Anticipada */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Política de Cancelación Anticipada</label>
                  <textarea
                    rows={2}
                    value={config.earlyCancellationPolicy}
                    onChange={(e) => setConfig({ ...config, earlyCancellationPolicy: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-700 focus:border-navy"
                  />
                </div>

                {/* Historial Inmutable de Versiones */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-navy flex items-center space-x-1.5 uppercase tracking-wider">
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>Historial Inmutable de Políticas</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {policyVersions.length} versiones registradas
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                    {policyVersions.map((pol) => (
                      <div key={pol.id} className={`p-3 flex items-center justify-between ${pol.is_active ? 'bg-emerald-50/40' : 'bg-white'}`}>
                        <div>
                          <div className="flex items-center space-x-2">
                            <strong className="text-navy font-bold">{pol.version_label}</strong>
                            {pol.is_active && (
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                ACTIVA
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{pol.title} · {pol.notes}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono font-bold text-slate-700 block">{pol.max_ltv_percent}% LTV · {pol.base_annual_rate}%</span>
                          <span className="text-[9px] text-slate-400">{new Date(pol.published_at).toLocaleDateString('es-UY')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 3: DOMINIO & DNS                                     */}
            {/* -------------------------------------------------------- */}
            {activeTab === 'domain' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <Globe className="w-5 h-5 text-brand-green" /> Dominio Personalizado & Certificados SSL
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hacé que tu plataforma opere bajo tu propio subdominio web con SSL automático.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de Dominio Web Asignado</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={config.customDomain}
                        onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                        placeholder="creditos.tuempresa.uy"
                        className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold text-navy focus:border-navy"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={simulatedDnsChecking}
                        onClick={() => {
                          setSimulatedDnsChecking(true);
                          setTimeout(() => {
                            setSimulatedDnsChecking(false);
                            setConfig({ ...config, dnsVerified: true, sslActive: true });
                          }, 1200);
                        }}
                      >
                        {simulatedDnsChecking ? 'Verificando...' : 'Verificar DNS'}
                      </Button>
                    </div>
                  </div>

                  {/* Estado DNS & SSL */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono font-bold text-navy block text-sm">{config.customDomain}</span>
                      <span className="text-slate-500">Apuntando a la infraestructura de HIPOTECALY Cloud</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <Check className="w-3.5 h-3.5 mr-1" /> DNS Verificado · SSL TLS 1.3 Activo
                      </span>
                    </div>
                  </div>

                  {/* Tabla de Registros DNS */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Registros DNS Requeridos en tu Proveedor</span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-600 font-bold">
                          <tr>
                            <th className="p-2.5">Tipo</th>
                            <th className="p-2.5">Host / Nombre</th>
                            <th className="p-2.5">Destino / Valor</th>
                            <th className="p-2.5">TTL</th>
                            <th className="p-2.5">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          <tr>
                            <td className="p-2.5 font-bold text-navy">CNAME</td>
                            <td className="p-2.5">creditos</td>
                            <td className="p-2.5 text-brand-green font-bold">cname.hipotecaly.uy</td>
                            <td className="p-2.5">3600</td>
                            <td className="p-2.5 text-emerald-700 font-bold">Activo</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 4: LANDING & FUNNEL                                  */}
            {/* -------------------------------------------------------- */}
            {activeTab === 'landing' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <Layout className="w-5 h-5 text-brand-green" /> Textos del Funnel y Experiencia del Solicitante
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modificá los encabezados principales, botones y mensajes que ve el usuario en tu landing.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Título Principal del Hero (H1)</label>
                    <input
                      type="text"
                      value={config.heroTitle}
                      onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-bold text-navy"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Subtítulo / Bajada Comercial</label>
                    <textarea
                      rows={2}
                      value={config.heroSubtitle}
                      onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                      className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Texto del Botón CTA</label>
                      <input
                        type="text"
                        value={config.ctaButtonText}
                        onChange={(e) => setConfig({ ...config, ctaButtonText: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-bold text-navy"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Badge de Confianza</label>
                      <input
                        type="text"
                        value={config.trustBadgeText}
                        onChange={(e) => setConfig({ ...config, trustBadgeText: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Asistente IA */}
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-navy">Copiloto IA de Admisión para Solicitantes</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Permite a los usuarios recibir una pre-calificación instantánea con análisis zonal del inmueble.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.aiPrequalEnabled}
                      onChange={(e) => setConfig({ ...config, aiPrequalEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-green"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Mensaje Post-Envío de Solicitud</label>
                    <textarea
                      rows={2}
                      value={config.successMessage}
                      onChange={(e) => setConfig({ ...config, successMessage: e.target.value })}
                      className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 5: COSTOS & HONORARIOS                               */}
            {/* -------------------------------------------------------- */}
            {activeTab === 'costs' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-navy flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-brand-green" /> Estructura de Costos y Aranceles Notariales
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configurá los aranceles y gastos de formalización que se deducirán o calcularán en el desglose de liquidación.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                    🟢 {activeCosts.version_label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Honorarios Notariales (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.notaryFeePercentage}
                      onChange={(e) => setConfig({ ...config, notaryFeePercentage: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold text-navy"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tasación Técnica (USD fijo)</label>
                    <input
                      type="number"
                      value={config.appraisalFeeUsd}
                      onChange={(e) => setConfig({ ...config, appraisalFeeUsd: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold text-navy"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Certificados Registrales (USD)</label>
                    <input
                      type="number"
                      value={config.certificatesFeeUsd}
                      onChange={(e) => setConfig({ ...config, certificatesFeeUsd: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold text-navy"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Inscripción DGR (USD)</label>
                    <input
                      type="number"
                      value={config.registryFeeUsd}
                      onChange={(e) => setConfig({ ...config, registryFeeUsd: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold text-navy"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Comisión Legajo / Admin (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.administrativeFeePercentage}
                      onChange={(e) => setConfig({ ...config, administrativeFeePercentage: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold text-navy"
                    />
                  </div>
                </div>

                {/* Aranceles Definidos en la Versión Activa */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-navy block uppercase tracking-wider">Conceptos Arancelarios ({activeCosts.version_label})</span>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                    {activeCosts.items.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between bg-slate-50/50">
                        <div>
                          <strong className="text-navy">{item.name}</strong>
                          <p className="text-[11px] text-slate-500">
                            Paga: {item.payer === 'borrower' ? 'Solicitante' : 'Prestamista'} · Percibe: {item.payee} · IVA {item.tax_percent}%
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-800">
                          {item.type === 'percentage' ? `${item.value}%` : `USD ${item.value}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulador de Liquidación para Préstamo de Ejemplo */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-navy">Simulación de Desembolso para USD 100.000:</span>
                    <span className="font-mono font-bold text-navy">USD 100.000</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>- Honorarios Notariales ({config.notaryFeePercentage}%):</span>
                    <span className="font-mono text-rose-600">- USD {notaryFee.toLocaleString('es-UY')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>- Tasación + Certificados + DGR:</span>
                    <span className="font-mono text-rose-600">
                      - USD {(config.appraisalFeeUsd + config.certificatesFeeUsd + config.registryFeeUsd).toLocaleString('es-UY')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>- Comisión de Apertura ({config.administrativeFeePercentage}%):</span>
                    <span className="font-mono text-rose-600">- USD {adminFee.toLocaleString('es-UY')}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 font-bold text-sm">
                    <span className="text-navy">Líquido Neto a Desembolsar al Cliente:</span>
                    <span className="text-brand-green font-mono font-black text-base">
                      USD {netDisbursed.toLocaleString('es-UY')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 6: COMUNICACIONES                                    */}
            {/* -------------------------------------------------------- */}
            {activeTab === 'communications' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-navy flex items-center gap-2">
                      <Mail className="w-5 h-5 text-brand-green" /> Comunicaciones Operativas & Biblioteca de Eventos
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      12 plantillas operativas configuradas con trazabilidad y variables automáticas.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                    {commTemplates.length} Plantillas Activas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Remitente</label>
                    <input
                      type="text"
                      value={config.senderName}
                      onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-bold text-navy"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Email del Remitente</label>
                    <input
                      type="email"
                      value={config.senderEmail}
                      onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp de Soporte (+598)</label>
                    <input
                      type="text"
                      value={config.supportPhoneWhatsapp}
                      onChange={(e) => setConfig({ ...config, supportPhoneWhatsapp: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono text-slate-700"
                    />
                  </div>
                </div>

                {testCommSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{testCommSuccess}</span>
                  </div>
                )}

                {/* Biblioteca de 12 Eventos Operativos */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-navy uppercase tracking-wider">
                      Catálogo de Eventos Operativos (12 Plantillas Estándar)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {commTemplates.map((tpl) => (
                      <div key={tpl.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-navy font-bold">{tpl.name}</strong>
                          <span className="text-[10px] uppercase font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            {tpl.channel}
                          </span>
                        </div>
                        {tpl.subject && (
                          <p className="text-[11px] font-semibold text-slate-700">Asunto: {tpl.subject}</p>
                        )}
                        <p className="text-[11px] text-slate-600 line-clamp-2 italic">"{tpl.body}"</p>
                        
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 font-mono">
                            {tpl.available_variables.length} variables disponibles
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTestSendComm(tpl.code)}
                            className="text-[11px] font-bold text-[#102d49] hover:text-brand-green flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3 mr-0.5" />
                            <span>Probar Envío</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel de Prueba de Despacho */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <span className="font-bold text-navy block uppercase tracking-wider">Destinatario de Pruebas</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={testCommRecipient}
                      onChange={(e) => setTestCommRecipient(e.target.value)}
                      placeholder="solicitante@ejemplo.com"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-navy"
                    />
                    <button
                      type="button"
                      onClick={() => handleTestSendComm('solicitud_recibida')}
                      className="px-4 py-2 rounded-lg bg-[#102d49] text-white text-xs font-bold hover:bg-[#173a5e]"
                    >
                      Enviar Prueba Base
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 7: LEGAL & PRIVACIDAD                                */}
            {/* -------------------------------------------------------- */}
            {activeTab === 'legal' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-navy flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-brand-green" /> Disclaimers Regulatorios y Consentimientos
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Textos de cumplimiento normativo conforme a la Ley 18.212 de Usura y Ley 18.331 de Protección de Datos.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      T&C v5
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                      Privacidad v3
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Disclaimer Regulatorio en Simulador</label>
                    <textarea
                      rows={3}
                      value={config.disclaimerUsuryLaw}
                      onChange={(e) => setConfig({ ...config, disclaimerUsuryLaw: e.target.value })}
                      className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Términos y Condiciones del Estudio (v5)</label>
                    <textarea
                      rows={3}
                      value={config.customTermsText}
                      onChange={(e) => setConfig({ ...config, customTermsText: e.target.value })}
                      className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-700"
                    />
                  </div>

                  {/* Registro de Consentimientos Inmutables */}
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-blue-900 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Auditoría de Consentimiento Digital Conforme a Ley N° 18.331</span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Cada solicitante que envía el formulario registra su consentimiento con marca temporal ISO 8601, dirección IP y el identificador de versión legal exacto vigente al momento de la aceptación.
                    </p>
                  </div>

                  {/* Nivel de Blindaje Anti-Bypass */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-brand-green" />
                      <span className="text-xs font-bold text-navy">Blindaje de Privacidad y Anonimato del Cliente</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Los datos de contacto (teléfono y email) del solicitante permanecerán cifrados ante prestamistas e inversores hasta que exista una oferta formal aprobada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 8: MÓDULOS & ADD-ONS                                 */}
            {/* -------------------------------------------------------- */}
            {activeTab === 'modules' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <Puzzle className="w-5 h-5 text-brand-green" /> Módulos y Extensiones de la Instancia
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Estado de los módulos habilitados por HIPOTECALY para tu organización. La configuración técnica de integraciones es gestionada exclusivamente por HIPOTECALY.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs">
                  {[
                    {
                      name: 'Firma Electrónica Avanzada',
                      desc: 'Firma con validez legal según Ley N° 18.600. Firma de minutas, contratos y documentos.',
                      status: 'enabled' as const,
                      note: 'Habilitada para esta organización por HIPOTECALY.',
                    },
                    {
                      name: 'Sindicación Multi-Inversor',
                      desc: 'Permite fraccionar créditos entre varios prestamistas simultáneamente.',
                      status: config.syndicationModuleEnabled ? 'enabled' : 'disabled' as const,
                      note: config.syndicationModuleEnabled ? 'Activo en tu plan actual.' : 'Disponible para activar. Consultá con HIPOTECALY.',
                    },
                    {
                      name: 'Loan Servicing & Cuotas',
                      desc: 'Seguimiento de amortizaciones, cuotas e historial de mora.',
                      status: config.servicingModuleEnabled ? 'enabled' : 'available' as const,
                      note: config.servicingModuleEnabled ? 'Activo en tu plan.' : 'Disponible en plan Professional o superior.',
                    },
                    {
                      name: 'Webhooks & API REST v1',
                      desc: 'Integración con CRM externo, core bancario o sistemas propietarios.',
                      status: config.webhooksEnabled ? 'enabled' : 'needs_config' as const,
                      note: config.webhooksEnabled ? 'Operativo. Configuración técnica gestionada por HIPOTECALY.' : 'Requiere configuración técnica por HIPOTECALY.',
                    },
                    {
                      name: 'KYC Biométrico (Didit)',
                      desc: 'Verificación de identidad con chip de cédula y prueba de vida.',
                      status: 'enabled' as const,
                      note: 'Disponible. Proveedor configurado globalmente por HIPOTECALY.',
                    },
                    {
                      name: 'Copiloto de Inteligencia Artificial',
                      desc: 'Análisis asistido de documentación, semáforos de riesgo y coherencia documental.',
                      status: 'enabled' as const,
                      note: 'Habilitado con Human-in-the-Loop. No sustituye dictamen crediticio ni notarial.',
                    },
                    {
                      name: 'Portal de Inversores',
                      desc: 'Feed privado de oportunidades anonimizadas para prestamistas registrados.',
                      status: 'available' as const,
                      note: 'Disponible. Activar junto con Red de Inversores en tu cuenta.',
                    },
                    {
                      name: 'Reportes Programados',
                      desc: 'Generación y envío automático de reportes operativos según frecuencia configurada.',
                      status: 'unavailable' as const,
                      note: 'Próximamente disponible (Q4 2026).',
                    },
                  ].map((mod) => {
                    const statusConfig = {
                      enabled: { label: 'HABILITADO', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', border: 'border-emerald-200 bg-emerald-50/30' },
                      disabled: { label: 'NO HABILITADO', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200', border: 'border-slate-200 bg-slate-50/60' },
                      available: { label: 'DISPONIBLE', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 border-blue-200', border: 'border-blue-200 bg-blue-50/20' },
                      needs_config: { label: 'REQUIERE CONFIG. POR HIPOTECALY', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 border-amber-200', border: 'border-amber-200 bg-amber-50/20' },
                      unavailable: { label: 'TEMPORALMENTE NO DISPONIBLE', dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-500 border-slate-200', border: 'border-slate-200 bg-slate-50/30' },
                    }[mod.status] || { label: 'DESCONOCIDO', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200', border: 'border-slate-200 bg-slate-50/60' };

                    return (
                      <div key={mod.name} className={`p-4 rounded-xl border ${statusConfig.border} flex items-start justify-between gap-4`}>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`} />
                            <strong className="text-navy text-xs">{mod.name}</strong>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-4">{mod.desc}</p>
                          <p className="text-[10px] text-slate-400 pl-4 italic">{mod.note}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full border whitespace-nowrap shrink-0 ${statusConfig.badge}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Import/Export Config */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleExportJson}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Exportar JSON
                    </Button>
                    <label className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs">
                      <Upload className="w-3.5 h-3.5 mr-1" /> Importar JSON
                      <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restaurar Defaults
                  </button>
                </div>
              </div>
            )}

          </div>


          {/* ============================================================ */}
          {/* Columna Derecha: Vista Previa Interactiva en Vivo            */}
          {/* ============================================================ */}
          {showLivePreview && (
            <div className="lg:col-span-3 sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-brand-green" />
                    <span className="text-xs font-bold text-navy uppercase tracking-wider">
                      Vista Previa en Vivo (Reactiva)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1 rounded text-xs ${previewDevice === 'desktop' ? 'bg-white shadow-xs text-navy font-bold' : 'text-slate-500'}`}
                      title="Vista Escritorio"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1 rounded text-xs ${previewDevice === 'mobile' ? 'bg-white shadow-xs text-navy font-bold' : 'text-slate-500'}`}
                      title="Vista Móvil"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Marco de Simulación del Portal */}
                <div
                  className={`mx-auto rounded-xl border border-slate-200 overflow-hidden shadow-inner transition-all ${
                    previewDevice === 'mobile' ? 'max-w-[320px]' : 'w-full'
                  }`}
                  style={{ backgroundColor: config.backgroundColor }}
                >
                  {/* Navbar Simulado */}
                  <div
                    className="px-4 py-3 text-white flex items-center justify-between"
                    style={{ backgroundColor: config.secondaryColor }}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        {config.publicName.charAt(0)}
                      </div>
                      <span className="font-bold text-xs truncate max-w-[140px]">{config.publicName}</span>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded text-white"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      Simular
                    </span>
                  </div>

                  {/* Hero Simulado */}
                  <div className="p-5 text-left space-y-3 bg-white">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {config.trustBadgeText}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                      {config.heroTitle}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {config.heroSubtitle}
                    </p>

                    {/* Simulador Simulado */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Tope Financiado:</span>
                        <strong className="font-mono text-slate-900">{config.maxLtv}% del Inmueble</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Tasa Base Anual:</span>
                        <strong className="font-mono text-slate-900">{config.defaultInterestRate}%</strong>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                        <span className="text-slate-600 font-bold text-[11px]">Cuota Estimada (USD 100k):</span>
                        <span className="text-base font-black text-slate-900 font-mono">
                          USD {sampleEstimatedMonthly.toLocaleString('es-UY')}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-lg text-white font-bold text-xs shadow-xs transition-opacity hover:opacity-90"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        {config.ctaButtonText}
                      </button>
                    </div>

                    {/* Copiloto IA si está activo */}
                    {config.aiPrequalEnabled && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-[10px] text-emerald-900">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Copiloto de Pre-calificación IA Activo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center pt-2">
                  <Link
                    to={`/org/${config.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-navy hover:text-brand-green inline-flex items-center"
                  >
                    Probar interactividad completa en vivo →
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>

      {/* Modal Simulador de Políticas: PROBAR POLÍTICA */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Simulador de Políticas — {activePolicy.version_label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                Cerrar
              </button>
            </div>

            <p className="text-slate-500 text-[11px]">
              Evalúa un caso crediticio contra las reglas vigentes sin alterar expedientes reales de la base de datos.
            </p>

            {/* Inputs de Prueba */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Monto Solicitado (USD)</label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold text-navy bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Valor Tasado Garantía (USD)</label>
                <input
                  type="number"
                  value={simPropValue}
                  onChange={(e) => setSimPropValue(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold text-navy bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Tipo de Inmueble</label>
                <select
                  value={simPropType}
                  onChange={(e) => setSimPropType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold text-navy bg-white"
                >
                  <option value="apartamento">Apartamento</option>
                  <option value="casa">Casa</option>
                  <option value="local_comercial">Local Comercial</option>
                  <option value="terreno">Terreno</option>
                  <option value="campo">Campo / Rural (No estándar)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Plazo (meses)</label>
                <input
                  type="number"
                  value={simTermMonths}
                  onChange={(e) => setSimTermMonths(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold text-navy bg-white"
                />
              </div>
              <div className="col-span-2 flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simHasIncomeDocs}
                    onChange={(e) => setSimHasIncomeDocs(e.target.checked)}
                    className="rounded text-brand-green"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">Ingresos documentados</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simHasCleanClearing}
                    onChange={(e) => setSimHasCleanClearing(e.target.checked)}
                    className="rounded text-brand-green"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">Sin antecedentes en Clearing de Informes / BCU</span>
                </label>
                <button
                  type="button"
                  onClick={handleRunSimulator}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-[#102d49] text-white text-[11px] font-bold hover:bg-[#173a5e]"
                >
                  Reevaluar
                </button>
              </div>
            </div>

            {/* Resultado de la Simulación */}
            {simResult && (
              <div className="space-y-3 pt-2">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  simResult.passed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        simResult.passed ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                      }`}>
                        {simResult.passed ? '✓ CUMPLE POLÍTICA' : '✕ NO CUMPLE POLÍTICA'}
                      </span>
                      <span className="font-bold text-xs">
                        {simResult.passedCount} de {simResult.totalRules} reglas conformes
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 opacity-80">
                      LTV Calculado: <strong className="font-mono">{simResult.calculatedLtv}%</strong> (Tope Máx: {activePolicy.max_ltv_percent}%)
                    </p>
                  </div>
                </div>

                {/* Checklist de Reglas */}
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-[11px]">
                  {simResult.rulesList.map((r) => (
                    <div key={r.id} className="p-2.5 flex items-start justify-between gap-3 bg-white hover:bg-slate-50">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            r.status === 'pass' ? 'bg-emerald-500' : r.status === 'warn' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          <strong className="text-slate-900">{r.name}</strong>
                        </div>
                        <p className="text-slate-500 pl-3.5">{r.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        r.status === 'pass' ? 'bg-emerald-100 text-emerald-800' : r.status === 'warn' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.status === 'pass' ? 'APROBADA' : r.status === 'warn' ? 'OBSERVACIÓN' : 'RECHAZADA'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
              >
                Cerrar Simulador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Publicar Nueva Versión de Política */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Publicar Nueva Versión Inmutable</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                Cerrar
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Esta acción creará una nueva versión numerada inmutable (v{policyVersions.length + 1}) con los valores actuales configurados y registrará el cambio en la tabla de auditoría.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-[11px]">
              <div><strong>LTV Máximo:</strong> {config.maxLtv}%</div>
              <div><strong>Tasa Base Anual:</strong> {config.defaultInterestRate}%</div>
              <div><strong>Rango Monto:</strong> USD {config.minLoanAmount.toLocaleString('es-UY')} - USD {config.maxLoanAmount.toLocaleString('es-UY')}</div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Notas de la Versión / Justificación Regulatoria:</label>
              <textarea
                rows={3}
                value={publishNotes}
                onChange={(e) => setPublishNotes(e.target.value)}
                placeholder="Ej: Ajuste de política por actualización de tasas y ratios de riesgo..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-navy"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={publishing}
                onClick={handlePublishPolicyAction}
                className="px-4 py-2 rounded-xl bg-[#102d49] hover:bg-[#173a5e] text-white font-bold"
              >
                {publishing ? 'Publicando...' : 'Confirmar Publicación'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </BackofficeLayout>
  );
};
