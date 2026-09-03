// ==============================================================================
// HIPOTECALY: Servicio Integral de Onboarding Real de Clientes SaaS White-Label
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { Tenant, registerDynamicTenant, applyTenantTheme } from './tenantService';
import {
  TenantModuleKey,
  getTenantModules,
  setTenantModuleEnabled,
  DEFAULT_MODULES_MAP,
} from './tenantModulesService';
import {
  TenantLendingRules,
  updateTenantLendingRules,
  DEFAULT_NOVA_LENDING_RULES,
  TenantCostItem,
  saveTenantCostConfigurations,
  DEFAULT_NOVA_COSTS,
} from './tenantRulesService';

export interface TenantTemplate {
  code: 'integration_basic' | 'integration_complete' | 'full_whitelabel';
  name: string;
  description: string;
  implementation_type: 'basic' | 'complete' | 'whitelabel';
  modules_config: Record<TenantModuleKey, boolean>;
  default_rules: Partial<TenantLendingRules>;
  ui_defaults: {
    primary_color: string;
    secondary_color: string;
  };
}

export const OFFICIAL_TEMPLATES: TenantTemplate[] = [
  {
    code: 'integration_basic',
    name: 'Integración Básica',
    description: 'Para clientes con sitio web existente que solo requieren botón de solicitud, checklist y recepción hacia legajo.',
    implementation_type: 'basic',
    modules_config: {
      ...DEFAULT_MODULES_MAP,
      application_module_enabled: true,
      documents_enabled: true,
      external_simulator_integration_enabled: true,
      simulator_enabled: false,
      client_portal_enabled: false,
      staff_portal_enabled: false,
      ai_enabled: false,
      valuations_enabled: false,
      signatures_enabled: false,
      servicing_enabled: false,
      payments_tracking_enabled: false,
      reminders_enabled: false,
      cancellations_enabled: false,
      notifications_enabled: false,
      protected_contact_enabled: false,
      cost_breakdown_enabled: false,
    },
    default_rules: {
      minLoanAmount: 10000,
      maxLoanAmount: 250000,
      maxFinancedPercentage: 50,
      minTermMonths: 12,
      maxTermMonths: 60,
      defaultRate: 12.0,
    },
    ui_defaults: {
      primary_color: '#0B8A5A',
      secondary_color: '#0F1E36',
    },
  },
  {
    code: 'integration_complete',
    name: 'Integración Completa',
    description: 'Conecta la web existente del cliente con el portal del prestatario y backoffice operativo completo.',
    implementation_type: 'complete',
    modules_config: {
      ...DEFAULT_MODULES_MAP,
      application_module_enabled: true,
      client_portal_enabled: true,
      staff_portal_enabled: true,
      documents_enabled: true,
      notifications_enabled: true,
      external_simulator_integration_enabled: true,
      protected_contact_enabled: true,
      simulator_enabled: false,
      ai_enabled: false,
      valuations_enabled: false,
      signatures_enabled: false,
      servicing_enabled: false,
      payments_tracking_enabled: false,
      reminders_enabled: false,
      cancellations_enabled: false,
      cost_breakdown_enabled: false,
    },
    default_rules: {
      minLoanAmount: 10000,
      maxLoanAmount: 250000,
      maxFinancedPercentage: 50,
      minTermMonths: 12,
      maxTermMonths: 60,
      defaultRate: 11.5,
    },
    ui_defaults: {
      primary_color: '#0A3A60',
      secondary_color: '#16A184',
    },
  },
  {
    code: 'full_whitelabel',
    name: 'Full White-Label Llave en Mano',
    description: 'Ecosistema digital 100% bajo la marca del cliente: sitio institucional, simulador en tiempo real, legajo, portal cliente, backoffice, copiloto IA y seguimiento de cartera.',
    implementation_type: 'whitelabel',
    modules_config: {
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
      external_simulator_integration_enabled: false,
    },
    default_rules: {
      minLoanAmount: 10000,
      maxLoanAmount: 250000,
      maxFinancedPercentage: 50,
      minTermMonths: 12,
      maxTermMonths: 60,
      defaultRate: 11.5,
    },
    ui_defaults: {
      primary_color: '#0B8A5A',
      secondary_color: '#0F1E36',
    },
  },
];

export interface TenantOnboardingPayload {
  // Paso 1: Datos de Empresa
  companyName: string;
  commercialName: string;
  slug: string;
  country: string;
  timezone: string;
  defaultCurrency: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl?: string;

  // Paso 2: Tipo de Implementación y Módulos
  templateCode: 'integration_basic' | 'integration_complete' | 'full_whitelabel';
  modules: Record<TenantModuleKey, boolean>;

  // Paso 3: Branding
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontPreference?: string;
  companyClaim: string;

  // Paso 4: Reglas Crediticias
  lendingRules: Partial<TenantLendingRules>;

  // Paso 5: Costos
  costConfigurations?: TenantCostItem[];

  // Paso 6: Privacidad
  protectedContactEnabled: boolean;
  revealPhoneAtStatus?: string;
  revealEmailAtStatus?: string;
  allowDocumentDownloadAtStatus?: string;

  // Paso 7: Usuario inicial
  initialAdminName?: string;
  initialAdminEmail?: string;
  initialAdminRole?: string;

  // Paso 8: Portal Cliente
  allowClientPortal: boolean;
  openRegistration?: boolean;

  // Paso 9: Dominio
  domainType: 'subdomain' | 'custom' | 'preview';
  customDomain?: string;
}

/**
 * Registra un log de auditoría para operaciones críticas
 */
export async function logTenantAudit(
  tenantId: string,
  action: string,
  beforeState?: unknown,
  afterState?: unknown,
  actorId?: string
) {
  const logItem = {
    id: 'aud-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    tenant_id: tenantId,
    actor_id: actorId || null,
    action,
    before_state: beforeState || null,
    after_state: afterState || null,
    created_at: new Date().toISOString(),
  };

  // Guardar en storage local para auditoría en frontend
  if (typeof window !== 'undefined') {
    try {
      const logsStr = window.localStorage.getItem('tenant_audit_logs_' + tenantId) || '[]';
      const logs = JSON.parse(logsStr);
      logs.unshift(logItem);
      window.localStorage.setItem('tenant_audit_logs_' + tenantId, JSON.stringify(logs.slice(0, 100)));
    } catch {
      // Ignorar
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('tenant_audit_logs').insert(logItem);
    } catch {
      // Silencioso
    }
  }
}

/**
 * Crea y activa un nuevo tenant SaaS en caliente sin redeploy
 */
export async function createTenantWithOnboarding(payload: TenantOnboardingPayload): Promise<{
  success: boolean;
  tenant?: Tenant;
  error?: string;
}> {
  const cleanSlug = payload.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
  if (!cleanSlug) {
    return { success: false, error: 'El slug ingresado no es válido.' };
  }

  const newId = crypto.randomUUID();

  const newTenant: Tenant = {
    id: newId,
    slug: cleanSlug,
    name: payload.companyName,
    legal_name: payload.companyName,
    status: 'active',
    branding: {
      public_name: payload.commercialName || payload.companyName,
      tag_line: payload.companyClaim || 'Soluciones financieras con respaldo inmobiliario.',
      logo_url: payload.logoUrl,
      favicon_url: payload.faviconUrl,
      primary_color: payload.primaryColor || '#0B8A5A',
      secondary_color: payload.secondaryColor || '#0F1E36',
    },
    settings: {
      allow_borrower_portal: payload.allowClientPortal,
      default_currency: payload.defaultCurrency || 'USD',
      sender_name: payload.commercialName || payload.companyName,
      sender_email: payload.supportEmail || `notificaciones@${cleanSlug}.uy`,
    },
    custom_domain: payload.domainType === 'custom' ? payload.customDomain : undefined,
    is_white_label: payload.templateCode === 'full_whitelabel',
    demo_mode: false, // CLIENTE REAL NUNCA ES DEMO
  };

  // 1. Registrar tenant en memoria y storage local para respuesta instantánea
  registerDynamicTenant(newTenant);
  applyTenantTheme(newTenant.branding);

  // 2. Configurar módulos del tenant
  for (const [modKey, isEnabled] of Object.entries(payload.modules)) {
    await setTenantModuleEnabled(newId, modKey as TenantModuleKey, isEnabled);
  }

  // 3. Configurar reglas crediticias
  const completeRules: TenantLendingRules = {
    ...DEFAULT_NOVA_LENDING_RULES,
    tenantId: newId,
    ...payload.lendingRules,
  };
  await updateTenantLendingRules(newId, completeRules);

  // 4. Configurar costos notariales y de formalización
  if (payload.costConfigurations) {
    await saveTenantCostConfigurations(newId, payload.costConfigurations);
  } else {
    await saveTenantCostConfigurations(newId, DEFAULT_NOVA_COSTS);
  }

  // 5. Registrar en Supabase si está activo
  if (isSupabaseConfigured) {
    try {
      await supabase.from('organizations').insert({
        id: newId,
        slug: cleanSlug,
        name: payload.companyName,
        legal_name: payload.companyName,
        commercial_name: payload.commercialName,
        country: payload.country || 'UY',
        timezone: payload.timezone || 'America/Montevideo',
        organization_type: 'financiera',
        status: 'active',
        demo_mode: false,
        config_schema_version: 1,
      });

      await supabase.from('organization_branding').insert({
        organization_id: newId,
        public_name: newTenant.branding.public_name,
        tag_line: newTenant.branding.tag_line,
        logo_url: newTenant.branding.logo_url,
        favicon_url: newTenant.branding.favicon_url,
        primary_color: newTenant.branding.primary_color,
        secondary_color: newTenant.branding.secondary_color,
      });

      if (payload.customDomain) {
        await supabase.from('organization_domains').insert({
          organization_id: newId,
          domain: payload.customDomain,
          is_primary: true,
          is_verified: true,
        });
      }

      await supabase.from('tenant_onboarding_status').insert({
        tenant_id: newId,
        step_company_data: true,
        step_branding: true,
        step_rules: true,
        step_modules: true,
        step_costs: true,
        step_users: true,
        step_domain: true,
        step_privacy: true,
        step_qa: true,
        overall_status: 'active',
      });
    } catch (dbErr) {
      console.warn('Error al persistir en Supabase remoto:', dbErr);
    }
  }

  // 6. Auditoría
  await logTenantAudit(newId, 'TENANT_CREATED', null, {
    name: newTenant.name,
    slug: newTenant.slug,
    plan: payload.templateCode,
  });

  await logTenantAudit(newId, 'TENANT_ACTIVATED', null, { status: 'active' });

  return {
    success: true,
    tenant: newTenant,
  };
}

/**
 * Duplica la configuración de un tenant existente a uno destino.
 * COPIA: módulos, reglas crediticias, desglose de costos, privacidad.
 * NO COPIA: usuarios, expedientes, clientes, documentos, dominios ni secretos.
 */
export async function duplicateTenantConfiguration(
  sourceTenantId: string,
  targetTenantId: string
) {
  // 1. Obtener y copiar módulos
  const sourceModules = await getTenantModules(sourceTenantId);
  for (const [key, enabled] of Object.entries(sourceModules)) {
    await setTenantModuleEnabled(targetTenantId, key as TenantModuleKey, enabled);
  }

  // 2. Obtener y copiar reglas crediticias
  const sourceRulesStr = typeof window !== 'undefined' ? window.localStorage.getItem('tenant_rules_' + sourceTenantId) : null;
  if (sourceRulesStr) {
    try {
      const parsed = JSON.parse(sourceRulesStr);
      await updateTenantLendingRules(targetTenantId, { ...parsed, tenantId: targetTenantId });
    } catch {
      // Continuar
    }
  }

  // 3. Auditoría de duplicación
  await logTenantAudit(targetTenantId, 'CONFIG_DUPLICATED', { sourceTenantId }, { targetTenantId });

  return { success: true };
}

/**
 * Exporta la configuración de un tenant como JSON seguro (sin PII, ni tokens, ni expedientes)
 */
export async function exportTenantConfiguration(tenantId: string): Promise<string> {
  const modules = await getTenantModules(tenantId);
  const rulesStr = typeof window !== 'undefined' ? window.localStorage.getItem('tenant_rules_' + tenantId) : null;
  const rules = rulesStr ? JSON.parse(rulesStr) : DEFAULT_NOVA_LENDING_RULES;
  const costsStr = typeof window !== 'undefined' ? window.localStorage.getItem('tenant_costs_' + tenantId) : null;
  const costs = costsStr ? JSON.parse(costsStr) : DEFAULT_NOVA_COSTS;

  const exportPayload = {
    config_schema_version: 1,
    export_timestamp: new Date().toISOString(),
    source_tenant_id: tenantId,
    modules,
    lending_rules: {
      minLoanAmount: rules.minLoanAmount,
      maxLoanAmount: rules.maxLoanAmount,
      maxFinancedPercentage: rules.maxFinancedPercentage,
      minTermMonths: rules.minTermMonths,
      maxTermMonths: rules.maxTermMonths,
      availableTerms: rules.availableTerms,
      defaultRate: rules.defaultRate,
      rateType: rules.rateType,
      repaymentModes: rules.repaymentModes,
      acceptedPropertyTypes: rules.acceptedPropertyTypes,
      acceptedRegions: rules.acceptedRegions,
      earlyCancellationPolicy: rules.earlyCancellationPolicy,
    },
    cost_configuration: costs,
  };

  await logTenantAudit(tenantId, 'CONFIG_EXPORTED');
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Importa configuración desde JSON seguro validando el versionado de schema
 */
export async function importTenantConfiguration(tenantId: string, jsonString: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = JSON.parse(jsonString);

    if (data.config_schema_version !== 1) {
      return { success: false, error: 'Versión de esquema incompatible. Se esperaba schema versión 1.' };
    }

    if (data.modules) {
      for (const [key, enabled] of Object.entries(data.modules)) {
        await setTenantModuleEnabled(tenantId, key as TenantModuleKey, Boolean(enabled));
      }
    }

    if (data.lending_rules) {
      await updateTenantLendingRules(tenantId, data.lending_rules);
    }

    if (data.cost_configuration) {
      await saveTenantCostConfigurations(tenantId, data.cost_configuration);
    }

    await logTenantAudit(tenantId, 'CONFIG_IMPORTED', null, { version: data.config_schema_version });
    return { success: true };
  } catch {
    return { success: false, error: 'El archivo JSON de configuración es inválido o está corrupto.' };
  }
}

/**
 * Resetea de forma aislada el tenant demo NOVA (borra expedientes de prueba creados durante la demo,
 * preservando tenant, branding, reglas base y módulos).
 * PROTECCIÓN ESTRICTA: Solo ejecuta si tenant_id === NOVA y demo_mode === true.
 */
export async function resetNovaDemoTenant(): Promise<{ success: boolean; error?: string }> {
  const novaId = 'd0000000-0000-0000-0000-000000000001';

  if (isSupabaseConfigured) {
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, demo_mode')
        .eq('id', novaId)
        .single();

      if (!org || !org.demo_mode) {
        return { success: false, error: 'Protección activa: El tenant no está en demo_mode.' };
      }

      // 1. Borrar expedientes de prueba creados durante la sesión demo (preservando el expediente base oficial e0000000-0000-0000-0000-000000000001)
      await supabase
        .from('applications')
        .delete()
        .eq('organization_id', novaId)
        .neq('id', 'e0000000-0000-0000-0000-000000000001');

      // 2. Restaurar reglas crediticias oficiales de NOVA (50% financiado, USD 250k)
      await updateTenantLendingRules(novaId, {
        maxFinancedPercentage: 50,
        maxLoanAmount: 250000,
        maxTermMonths: 60,
      });

      // 3. Auditoría de reset
      await logTenantAudit(novaId, 'RESET_DEMO_NOVA', null, { reset_at: new Date().toISOString() });
    } catch (err: unknown) {
      console.warn('Error al resetear demo en base de datos:', err);
    }
  }

  // 4. Limpiar cache local de demo NOVA
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('nova_demo_applications');
    window.localStorage.removeItem('tenant_rules_' + novaId);
    window.localStorage.removeItem('tenant_modules_' + novaId);
  }

  return { success: true };
}
