import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  RefreshCw,
  CheckCircle2,
  Sliders,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Copy,
  Download,
  Upload,
  ListChecks,
  FileCode,
} from 'lucide-react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { Button } from '../../components/ui/Button';
import {
  getTenantModules,
  setTenantModuleEnabled,
  TenantModuleKey,
  DEFAULT_MODULES_MAP,
} from '../../lib/tenantModulesService';
import {
  getTenantLendingRules,
  updateTenantLendingRules,
  TenantLendingRules,
  DEFAULT_NOVA_LENDING_RULES,
} from '../../lib/tenantRulesService';
import { getAllRegisteredTenants } from '../../lib/tenantService';
import {
  exportTenantConfiguration,
  importTenantConfiguration,
  duplicateTenantConfiguration,
  resetNovaDemoTenant,
} from '../../lib/tenantOnboardingService';

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: 'active' | 'suspended';
  domain: string;
  isDemo: boolean;
}

export const SuperAdminTenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('d0000000-0000-0000-0000-000000000001');
  const [modules, setModules] = useState<Record<TenantModuleKey, boolean>>(DEFAULT_MODULES_MAP);
  const [rules, setRules] = useState<TenantLendingRules>(DEFAULT_NOVA_LENDING_RULES);

  // Estados de retroalimentación
  const [savingRule, setSavingRule] = useState(false);
  const [ruleSavedToast, setRuleSavedToast] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modales de Gestión Avanzada
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedJson, setExportedJson] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  const loadTenants = () => {
    const list = getAllRegisteredTenants();
    const mapped: TenantItem[] = list.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.is_white_label ? 'Full White-Label' : 'Enterprise Core',
      status: t.status === 'suspended' ? 'suspended' : 'active',
      domain: t.custom_domain || `${t.slug}.hipotecaly.app`,
      isDemo: Boolean(t.demo_mode),
    }));
    setTenants(mapped);
    if (mapped.length > 0 && !mapped.some((t) => t.id === selectedTenantId)) {
      setSelectedTenantId(mapped[0].id);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      getTenantModules(selectedTenantId).then((m) => setModules(m));
      getTenantLendingRules(selectedTenantId).then((r) => setRules(r));
    }
  }, [selectedTenantId]);

  const handleToggleModule = async (key: TenantModuleKey) => {
    const nextVal = !modules[key];
    setModules({ ...modules, [key]: nextVal });
    await setTenantModuleEnabled(selectedTenantId, key, nextVal);
  };

  const handleUpdatePercentage = async (newPercent: number) => {
    setSavingRule(true);
    try {
      const updated = await updateTenantLendingRules(selectedTenantId, {
        maxFinancedPercentage: newPercent,
      });
      setRules(updated);
      setRuleSavedToast(true);
      setTimeout(() => setRuleSavedToast(false), 3500);
    } finally {
      setSavingRule(false);
    }
  };

  const handleResetNovaDemo = async () => {
    await resetNovaDemoTenant();
    setRules({ ...DEFAULT_NOVA_LENDING_RULES, maxFinancedPercentage: 50 });
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3500);
  };

  const handleExport = async () => {
    const json = await exportTenantConfiguration(selectedTenantId);
    setExportedJson(json);
    setShowExportModal(true);
  };

  const handleImportSubmit = async () => {
    const res = await importTenantConfiguration(selectedTenantId, importJsonText);
    if (res.success) {
      setShowImportModal(false);
      setImportJsonText('');
      const updatedRules = await getTenantLendingRules(selectedTenantId);
      const updatedModules = await getTenantModules(selectedTenantId);
      setRules(updatedRules);
      setModules(updatedModules);
      setToastMessage('Configuración importada exitosamente en caliente.');
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      alert(res.error || 'Error al importar configuración.');
    }
  };

  const handleDuplicate = async () => {
    const targetSlug = prompt('Ingresá el ID o Slug del tenant destino donde copiar esta configuración:');
    if (!targetSlug) return;
    const target = tenants.find((t) => t.slug === targetSlug.trim() || t.id === targetSlug.trim());
    if (!target) {
      alert('Tenant destino no encontrado.');
      return;
    }
    await duplicateTenantConfiguration(selectedTenantId, target.id);
    setToastMessage(`Configuración copiada exitosamente a ${target.name}.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0] || {
    id: 'd0000000-0000-0000-0000-000000000001',
    name: 'NOVA Crédito Hipotecario',
    slug: 'nova-demo',
    plan: 'Full White-Label',
    status: 'active',
    domain: 'demo.novacredito.uy',
    isDemo: true,
  };

  const moduleLabels: Record<TenantModuleKey, { title: string; desc: string }> = {
    application_module_enabled: { title: 'Módulo de Solicitudes Digitales', desc: 'Recepción y validación de solicitudes online' },
    simulator_enabled: { title: 'Simulador Crediticio', desc: 'Calculadora de montos, cuotas y porcentaje financiado' },
    client_portal_enabled: { title: 'Portal del Solicitante', desc: 'Autogestión de legajo, ofertas y estado de expediente' },
    staff_portal_enabled: { title: 'Panel del Estudio / Backoffice', desc: 'Bandeja de operaciones para analistas y escribanos' },
    documents_enabled: { title: 'Gestión Documental y Checklist', desc: 'Carga, revisión, observación y aprobación de archivos' },
    ai_enabled: { title: 'Copiloto de Análisis Asistido por IA', desc: 'Semáforo de tasación, documentación, ingresos y riesgo' },
    valuations_enabled: { title: 'Módulo Técnico de Valuaciones', desc: 'Peritajes técnicos y cálculo de rangos de valor' },
    signatures_enabled: { title: 'Coordinación y Firma Notarial', desc: 'Agenda notarial, citaciones y control de escrituración' },
    servicing_enabled: { title: 'Seguimiento de Créditos Activos', desc: 'Pólizas, gravámenes y administración de cartera' },
    payments_tracking_enabled: { title: 'Registro y Conciliación de Pagos', desc: 'Comprobantes de cuotas, intereses y amortizaciones' },
    reminders_enabled: { title: 'Alertas y Recordatorios Automáticos', desc: 'Notificaciones de vencimiento y renovación de certificados' },
    cancellations_enabled: { title: 'Gestión de Cancelación Anticipada', desc: 'Liquidación de saldo capital y levantamiento de hipoteca' },
    notifications_enabled: { title: 'Mensajería y Notificaciones Multicanal', desc: 'Comunicación interna y avisos al prestatario' },
    protected_contact_enabled: { title: 'Protección Anti-Bypass de Contacto', desc: 'Enmascaramiento de teléfonos y emails hasta aprobación' },
    cost_breakdown_enabled: { title: 'Transparencia de Costos de Cierre', desc: 'Desglose visible de gastos notariales y neto a desembolsar' },
    external_simulator_integration_enabled: { title: 'Integración con Simulador Externo', desc: 'Recepción sanitizada desde sitios web ya existentes' },
  };

  return (
    <BackofficeLayout title="Super Admin — Clientes SaaS y Multi-Tenancy">
      <div className="space-y-8 text-left max-w-7xl mx-auto">
        
        {/* Encabezado Super Admin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
                Super Administrador Transversal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mt-1">
              Gestión de Organizaciones y Módulos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configurá marcas, feature flags y reglas crediticias en caliente sin modificar código ni redeployar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleResetNovaDemo}
              className="text-xs border-amber-300 text-amber-900 hover:bg-amber-50"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Reset Demo NOVA
            </Button>

            <Link to="/admin/tenants/new">
              <Button
                variant="primary"
                size="md"
                className="text-xs shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Nuevo Cliente White-Label
              </Button>
            </Link>
          </div>
        </div>

        {/* Toasts de Retroalimentación */}
        {ruleSavedToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-900 flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Regla actualizada en Supabase. El simulador reflejará el nuevo valor en vivo.</span>
          </div>
        )}

        {resetSuccess && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Tenant demo NOVA restablecido a los valores oficiales de fábrica.</span>
          </div>
        )}

        {toastMessage && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-900 flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Selector de Tenant Activo */}
        <div className="bg-white rounded-card p-5 border border-slate-border shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-navy flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-brand-green" />
              Clientes SaaS Registrados
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total: {tenants.length} organizaciones
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tenants.map((t) => {
              const isSelected = selectedTenantId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTenantId(t.id)}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-[#0A3A60] ring-2 ring-[#0A3A60]/20 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-navy truncate">{t.name}</span>
                    {t.isDemo && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                        DEMO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">{t.domain}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 text-[11px]">
                    <span className="text-slate-600">{t.plan}</span>
                    <span className="font-bold text-emerald-700">✓ {t.status}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Barra de Acciones Avanzadas del Tenant */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-500" /> Exportar Configuración (JSON)
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-slate-500" /> Importar Configuración
            </button>

            <button
              onClick={handleDuplicate}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700"
            >
              <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" /> Duplicar a Otro Tenant
            </button>

            <button
              onClick={() => setShowChecklistModal(true)}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700"
            >
              <ListChecks className="w-3.5 h-3.5 mr-1 text-slate-500" /> Checklist de Onboarding
            </button>

            <Link
              to={selectedTenant.slug === 'nova-demo' ? '/demo/nova/full' : `/org/${selectedTenant.slug}`}
              target="_blank"
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-navy text-white hover:bg-slate-800 font-bold ml-auto"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver Portal en Vivo
            </Link>
          </div>
        </div>

        {/* Panel de Configuración del Tenant Seleccionado */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 1. Módulos / Feature Flags (Columna Izquierda) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-navy flex items-center">
                    <Sliders className="w-5 h-5 mr-2 text-brand-green" />
                    Módulos y Feature Flags de {selectedTenant.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Activa o desactiva funcionalidades independientemente por organización.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(Object.keys(moduleLabels) as TenantModuleKey[]).map((key) => {
                  const isEnabled = modules[key] ?? true;
                  const info = moduleLabels[key];
                  return (
                    <div
                      key={key}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-navy">{info.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{info.desc}</p>
                      </div>

                      <button
                        type="button"
                        data-testid={`module-toggle-${key}`}
                        onClick={() => handleToggleModule(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                          isEnabled
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {isEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        <span>{isEnabled ? 'Activo' : 'Inactivo'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Reglas Crediticias y Límites (Columna Derecha) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
                  Configuración Crediticia en Caliente
                </span>
                <h3 className="text-base font-bold text-navy mt-0.5">
                  Porcentaje Financiado Máximo
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Afecta inmediatamente las validaciones del simulador sin redeployar.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Tope Configurado Actual</span>
                  <span className="text-3xl font-extrabold text-navy font-mono">
                    {rules.maxFinancedPercentage}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block font-medium">Monto Máximo</span>
                  <span className="text-sm font-bold text-slate-700 font-mono">
                    USD {Number(rules.maxLoanAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Botones de Cambio Rápido */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 block">Modificar valor permitido:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[40, 50, 60].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={savingRule}
                      onClick={() => handleUpdatePercentage(val)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        rules.maxFinancedPercentage === val
                          ? 'bg-navy text-white border-navy shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {rules.maxFinancedPercentage === val ? `Fijar en ${val}% (Activo ✓)` : `Fijar en ${val}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* MODAL: EXPORTAR CONFIGURACIÓN */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4 text-left">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base text-navy flex items-center">
                  <FileCode className="w-5 h-5 mr-2 text-brand-green" /> Exportar Configuración JSON
                </h3>
                <button onClick={() => setShowExportModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>
              <p className="text-xs text-slate-500">
                JSON seguro con Schema Versión 1. Excluye PII, usuarios, expedientes y secretos.
              </p>
              <textarea
                readOnly
                value={exportedJson}
                rows={12}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg text-navy"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(exportedJson);
                    alert('JSON copiado al portapapeles.');
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copiar JSON
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowExportModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: IMPORTAR CONFIGURACIÓN */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4 text-left">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base text-navy flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-brand-green" /> Importar Configuración JSON
                </h3>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>
              <p className="text-xs text-slate-500">
                Pegá el JSON de configuración para {selectedTenant.name}. Se validará el schema antes de aplicar.
              </p>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Pegá aquí el JSON exportado..."
                rows={10}
                className="w-full p-3 font-mono text-xs bg-white border border-slate-300 rounded-lg text-navy focus:border-navy"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowImportModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" onClick={handleImportSubmit}>
                  Aplicar Configuración
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CHECKLIST DE ONBOARDING */}
        {showChecklistModal && (
          <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 text-left">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base text-navy flex items-center">
                  <ListChecks className="w-5 h-5 mr-2 text-brand-green" /> Checklist de Onboarding · {selectedTenant.name}
                </h3>
                <button onClick={() => setShowChecklistModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  '1. Datos de Empresa y Razón Social',
                  '2. Modalidad y Selección de Plantilla',
                  '3. Identidad Visual y Colores de Marca',
                  '4. Reglas Crediticias y Porcentaje Financiado',
                  '5. Desglose Notarial y de Gastos de Cierre',
                  '6. Reglas de Privacidad y Enmascaramiento',
                  '7. Usuarios Internos y Roles Operativos',
                  '8. Portal del Solicitante Habilitado',
                  '9. Dominio / Subdominio Asignado',
                  '10. Activación Productiva en Caliente',
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-medium text-slate-700">{step}</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Completado
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary" size="sm" onClick={() => setShowChecklistModal(false)}>
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </BackofficeLayout>
  );
};
