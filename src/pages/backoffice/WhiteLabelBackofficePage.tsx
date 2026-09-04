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
} from 'lucide-react';

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

  // Cargar datos del tenant
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getWhiteLabelCustomization(tenant.id, tenant.slug);
      setConfig(data);
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
        {/* 2. PESTAÑAS DE NAVEGACIÓN MODULAR                           */}
        {/* ============================================================ */}
        <div className="flex items-center space-x-1 overflow-x-auto border-b border-slate-200 pb-1 text-xs font-bold">
          {[
            { id: 'branding', label: '1. Identidad & Marca', icon: Palette },
            { id: 'underwriting', label: '2. Políticas & Riesgo', icon: Sliders },
            { id: 'domain', label: '3. Dominio & SSL', icon: Globe },
            { id: 'landing', label: '4. Landing & Funnel', icon: Layout },
            { id: 'costs', label: '5. Costos & Honorarios', icon: Receipt },
            { id: 'communications', label: '6. Comunicaciones', icon: Mail },
            { id: 'legal', label: '7. Legal & Privacidad', icon: ShieldAlert },
            { id: 'modules', label: '8. Módulos & Add-ons', icon: Puzzle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-t-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-brand-green border-t-2 border-x border-slate-200 -mb-[1px] shadow-xs'
                    : 'text-slate-500 hover:text-navy hover:bg-slate-100/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-green' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* 3. CONTENIDO PRINCIPAL EN 2 COLUMNAS (FORMULARIO + PREVIEW) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Columna Izquierda: Formularios de Configuración */}
          <div className={showLivePreview ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
            
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
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-brand-green" /> Motor de Políticas Crediticias y Riesgo
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Definí los límites cuantitativos, tasas y requisitos que el simulador y el wizard exigirán a los solicitantes.
                  </p>
                </div>

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
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-brand-green" /> Estructura de Costos y Aranceles Notariales
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configurá los aranceles y gastos de formalización que se deducirán o calcularán en el desglose de liquidación.
                  </p>
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
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <Mail className="w-5 h-5 text-brand-green" /> Remitente, Emails y WhatsApp de Atención
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Personalizá los canales de notificación automatizados que recibirán tus solicitantes.
                  </p>
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

                {/* Plantilla de Bienvenida */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block">Plantilla: Confirmación de Solicitud Recibida</label>
                  <input
                    type="text"
                    value={config.welcomeEmailSubject}
                    onChange={(e) => setConfig({ ...config, welcomeEmailSubject: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-navy mb-2"
                  />
                  <textarea
                    rows={4}
                    value={config.welcomeEmailBody}
                    onChange={(e) => setConfig({ ...config, welcomeEmailBody: e.target.value })}
                    className="w-full p-3 rounded-lg border border-slate-300 text-xs font-mono text-slate-700"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Variables dinámicas admitidas: <code>&#123;&#123;nombre&#125;&#125;</code>, <code>&#123;&#123;monto&#125;&#125;</code>, <code>&#123;&#123;expediente&#125;&#125;</code>, <code>&#123;&#123;publicName&#125;&#125;</code>.
                  </span>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* TAB 7: LEGAL & PRIVACIDAD                                */}
            {/* -------------------------------------------------------- */}
            {activeTab === 'legal' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-brand-green" /> Disclaimers Regulatorios y Blindaje Anti-Bypass
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Textos de cumplimiento normativo conforme a la Ley 18.212 de Usura y Ley 18.331 de Protección de Datos.
                  </p>
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
                    <label className="text-xs font-bold text-slate-700 block mb-1">Términos y Condiciones del Estudio</label>
                    <textarea
                      rows={3}
                      value={config.customTermsText}
                      onChange={(e) => setConfig({ ...config, customTermsText: e.target.value })}
                      className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-700"
                    />
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
                    Habilitá o deshabilitá módulos avanzados según las capacidades de tu plan SaaS.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                    <div>
                      <strong className="text-navy block">Sindicación Multi-Inversor</strong>
                      <span className="text-slate-500 text-[11px]">Permite fraccionar créditos entre varios prestamistas.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.syndicationModuleEnabled}
                      onChange={(e) => setConfig({ ...config, syndicationModuleEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-green"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                    <div>
                      <strong className="text-navy block">Loan Servicing & Cuotas</strong>
                      <span className="text-slate-500 text-[11px]">Seguimiento de amortizaciones, cuotas y mora.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.servicingModuleEnabled}
                      onChange={(e) => setConfig({ ...config, servicingModuleEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-green"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between">
                    <div>
                      <strong className="text-navy block">Webhooks & API REST v1</strong>
                      <span className="text-slate-500 text-[11px]">Integración con CRM externo o core bancario.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.webhooksEnabled}
                      onChange={(e) => setConfig({ ...config, webhooksEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-brand-green"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <strong className="text-navy block">Firma Electrónica Avanzada</strong>
                      <span className="text-slate-500 text-[11px]">Firma con validez legal según Ley 18.600.</span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-green bg-emerald-100 px-2 py-0.5 rounded">
                      ACTIVO
                    </span>
                  </div>
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
            <div className="lg:col-span-5 sticky top-24 space-y-4">
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

      </div>
    </BackofficeLayout>
  );
};
