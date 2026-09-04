// ==============================================================================
// HIPOTECALY: Servicio Integral de Configuración White-Label
// Gestiona Branding, Underwriting, Dominio, Textos, Costos, Notificaciones y Legal
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import { Tenant, applyTenantTheme, registerDynamicTenant } from './tenantService';
import { getTenantLendingRules, updateTenantLendingRules } from './tenantRulesService';
import { getTenantModules, setTenantModuleEnabled } from './tenantModulesService';

export interface WhiteLabelCustomization {
  tenantId: string;
  slug: string;
  // 1. Identidad Visual
  publicName: string;
  legalName: string;
  rut: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  typography: 'Inter' | 'Plus Jakarta Sans' | 'Outfit' | 'DM Sans' | 'Playfair Display';
  borderRadius: 'rounded-none' | 'rounded-lg' | 'rounded-2xl' | 'rounded-full';
  themeMode: 'light' | 'dark' | 'auto';

  // 2. Políticas Crediticias
  maxLtv: number;
  minLoanAmount: number;
  maxLoanAmount: number;
  defaultInterestRate: number;
  moratoryRate: number;
  availableTerms: number[];
  repaymentModes: Array<'solo_intereses' | 'amortizable' | 'bullet'>;
  acceptedPropertyTypes: string[];
  acceptedRegions: string[];
  earlyCancellationPolicy: string;

  // 3. Dominio & SSL
  customDomain: string;
  dnsVerified: boolean;
  sslActive: boolean;
  enforceHttps: boolean;

  // 4. Landing & Funnel
  heroTitle: string;
  heroSubtitle: string;
  ctaButtonText: string;
  trustBadgeText: string;
  aiPrequalEnabled: boolean;
  wizardSteps: {
    propertyValuation: boolean;
    initialDocuments: boolean;
    incomeDeclaration: boolean;
  };
  successMessage: string;

  // 5. Costos & Honorarios
  notaryFeePercentage: number;
  appraisalFeeUsd: number;
  certificatesFeeUsd: number;
  registryFeeUsd: number;
  administrativeFeePercentage: number;

  // 6. Comunicaciones
  senderName: string;
  senderEmail: string;
  supportPhoneWhatsapp: string;
  welcomeEmailSubject: string;
  welcomeEmailBody: string;
  offerEmailSubject: string;
  offerEmailBody: string;
  notifyStaffOnNewLead: boolean;
  staffAlertEmail: string;

  // 7. Legal & Privacidad
  disclaimerUsuryLaw: string;
  customTermsText: string;
  customPrivacyPolicyText: string;
  antiBypassPrivacyLevel: 'standard' | 'strict' | 'relaxed';

  // 8. Módulos Activos
  syndicationModuleEnabled: boolean;
  servicingModuleEnabled: boolean;
  webhooksEnabled: boolean;
}

export const DEFAULT_WHITELABEL_CONFIG: WhiteLabelCustomization = {
  tenantId: 'd0000000-0000-0000-0000-000000000001',
  slug: 'nova-demo',
  // 1. Identidad Visual
  publicName: 'NOVA Crédito Hipotecario',
  legalName: 'NOVA Inversiones Hipotecarias S.A.S.',
  rut: '219876540019',
  tagline: 'Soluciones financieras ágiles con respaldo inmobiliario en Uruguay.',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#0A3A60',
  secondaryColor: '#16A184',
  accentColor: '#F59E0B',
  backgroundColor: '#F8FAFC',
  typography: 'Plus Jakarta Sans',
  borderRadius: 'rounded-xl' as any,
  themeMode: 'light',

  // 2. Políticas Crediticias
  maxLtv: 50,
  minLoanAmount: 15000,
  maxLoanAmount: 300000,
  defaultInterestRate: 11.5,
  moratoryRate: 16.0,
  availableTerms: [12, 24, 36, 48, 60],
  repaymentModes: ['solo_intereses', 'amortizable'],
  acceptedPropertyTypes: ['casa', 'apartamento', 'local_comercial', 'terreno', 'chacra'],
  acceptedRegions: ['Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'Rocha', 'San José'],
  earlyCancellationPolicy: 'Cancelación anticipada permitida sin penalidad a partir del mes 6.',

  // 3. Dominio & SSL
  customDomain: 'creditos.novacredito.uy',
  dnsVerified: true,
  sslActive: true,
  enforceHttps: true,

  // 4. Landing & Funnel
  heroTitle: 'Préstamos Hipotecarios con Estructuración Notarial',
  heroSubtitle: 'Financiamos proyectos, consolidación de pasivos y liquidez empresarial respaldados en propiedades uruguayas.',
  ctaButtonText: 'CALCULAR MI CRÉDITO',
  trustBadgeText: 'Garantía Hipotecaria Notarial · Registro DGR 100% Blindado',
  aiPrequalEnabled: true,
  wizardSteps: {
    propertyValuation: true,
    initialDocuments: true,
    incomeDeclaration: true,
  },
  successMessage: '¡Solicitud recibida! Nuestro equipo notarial y financiero se comunicará en un plazo máximo de 24 horas hábiles.',

  // 5. Costos & Honorarios
  notaryFeePercentage: 2.5,
  appraisalFeeUsd: 450,
  certificatesFeeUsd: 280,
  registryFeeUsd: 150,
  administrativeFeePercentage: 1.0,

  // 6. Comunicaciones
  senderName: 'NOVA Créditos Hipotecarios',
  senderEmail: 'notificaciones@novacredito.uy',
  supportPhoneWhatsapp: '+59899123456',
  welcomeEmailSubject: 'Confirmación de solicitud de crédito - {{publicName}}',
  welcomeEmailBody: 'Estimado/a {{nombre}},\n\nHemos recibido correctamente su solicitud por USD {{monto}} para el inmueble en {{departamento}} (Expediente N° {{expediente}}).\n\nNuestro equipo está analizando la viabilidad de la garantía y le emitirá una propuesta formal a la brevedad.\n\nAtentamente,\nEquipo de {{publicName}}',
  offerEmailSubject: '¡Oferta de crédito pre-aprobada disponible! - {{publicName}}',
  offerEmailBody: 'Estimado/a {{nombre}},\n\nNos complace informarle que su solicitud {{expediente}} ha sido pre-calificada favorablemente.\n\nMonto aprobado: USD {{monto}}\nCuota mensual estimada: USD {{cuota}}\nTasa anual: {{tasa}}%\n\nPuede acceder a su portal para revisar las condiciones y continuar la formalización.',
  notifyStaffOnNewLead: true,
  staffAlertEmail: 'operaciones@novacredito.uy',

  // 7. Legal & Privacidad
  disclaimerUsuryLaw: 'Operación financiera privada con garantía hipotecaria regulada por la Ley N° 18.212 y marco civil/comercial uruguayo. Tasas y condiciones sujetas a evaluación de títulos y tasación técnica.',
  customTermsText: 'El presente simulador es de carácter meramente informativo y preliminar. El otorgamiento del crédito definitivo queda sujeto al estudio de títulos de propiedad por parte del escribano interviniente y a la inscripción formal de la hipoteca en la Dirección General de Registros (DGR).',
  customPrivacyPolicyText: 'Los datos suministrados están protegidos bajo estricta confidencialidad de conformidad con la Ley N° 18.331 de Protección de Datos Personales de la República Oriental del Uruguay.',
  antiBypassPrivacyLevel: 'strict',

  // 8. Módulos Activos
  syndicationModuleEnabled: true,
  servicingModuleEnabled: true,
  webhooksEnabled: true,
};

const customizationCache = new Map<string, WhiteLabelCustomization>();

/**
 * Obtiene la configuración completa de White-Label para una organización
 */
export async function getWhiteLabelCustomization(tenantId: string, slug?: string): Promise<WhiteLabelCustomization> {
  if (customizationCache.has(tenantId)) {
    return customizationCache.get(tenantId)!;
  }

  // Verificar localStorage
  if (typeof window !== 'undefined') {
    const local = window.localStorage.getItem(`whitelabel_config_${tenantId}`);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        customizationCache.set(tenantId, parsed);
        return parsed;
      } catch {
        // Fallback
      }
    }
  }

  // Si hay conexión con Supabase
  if (isSupabaseConfigured) {
    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*, organization_branding(*), organization_settings(*)')
        .eq('id', tenantId)
        .maybeSingle();

      if (orgData) {
        const branding = Array.isArray(orgData.organization_branding)
          ? orgData.organization_branding[0] || {}
          : orgData.organization_branding || {};
        const rules = await getTenantLendingRules(tenantId);
        const modules = await getTenantModules(tenantId);

        const merged: WhiteLabelCustomization = {
          ...DEFAULT_WHITELABEL_CONFIG,
          tenantId,
          slug: orgData.slug || slug || DEFAULT_WHITELABEL_CONFIG.slug,
          publicName: branding.public_name || orgData.commercial_name || orgData.name,
          legalName: orgData.legal_name || DEFAULT_WHITELABEL_CONFIG.legalName,
          rut: orgData.tax_id || DEFAULT_WHITELABEL_CONFIG.rut,
          tagline: branding.tag_line || DEFAULT_WHITELABEL_CONFIG.tagline,
          primaryColor: branding.primary_color || DEFAULT_WHITELABEL_CONFIG.primaryColor,
          secondaryColor: branding.secondary_color || DEFAULT_WHITELABEL_CONFIG.secondaryColor,
          logoUrl: branding.logo_url || '',
          faviconUrl: branding.favicon_url || '',
          customDomain: orgData.custom_domain || DEFAULT_WHITELABEL_CONFIG.customDomain,
          maxLtv: rules.maxFinancedPercentage || DEFAULT_WHITELABEL_CONFIG.maxLtv,
          minLoanAmount: rules.minLoanAmount || DEFAULT_WHITELABEL_CONFIG.minLoanAmount,
          maxLoanAmount: rules.maxLoanAmount || DEFAULT_WHITELABEL_CONFIG.maxLoanAmount,
          defaultInterestRate: rules.defaultRate || DEFAULT_WHITELABEL_CONFIG.defaultInterestRate,
          availableTerms: rules.availableTerms || DEFAULT_WHITELABEL_CONFIG.availableTerms,
          repaymentModes: rules.repaymentModes as any || DEFAULT_WHITELABEL_CONFIG.repaymentModes,
          acceptedPropertyTypes: rules.acceptedPropertyTypes || DEFAULT_WHITELABEL_CONFIG.acceptedPropertyTypes,
          acceptedRegions: rules.acceptedRegions || DEFAULT_WHITELABEL_CONFIG.acceptedRegions,
          earlyCancellationPolicy: rules.earlyCancellationPolicy || DEFAULT_WHITELABEL_CONFIG.earlyCancellationPolicy,
          aiPrequalEnabled: modules.ai_enabled ?? true,
          syndicationModuleEnabled: true,
          servicingModuleEnabled: modules.servicing_enabled ?? true,
        };

        customizationCache.set(tenantId, merged);
        return merged;
      }
    } catch {
      // Continuar con fallback
    }
  }

  const fallback: WhiteLabelCustomization = {
    ...DEFAULT_WHITELABEL_CONFIG,
    tenantId,
    slug: slug || DEFAULT_WHITELABEL_CONFIG.slug,
  };
  customizationCache.set(tenantId, fallback);
  return fallback;
}

/**
 * Guarda y propaga en tiempo real todos los cambios de White-Label
 */
export async function saveWhiteLabelCustomization(
  config: WhiteLabelCustomization
): Promise<{ success: boolean; message: string }> {
  // 1. Guardar en memoria y localStorage
  customizationCache.set(config.tenantId, config);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(`whitelabel_config_${config.tenantId}`, JSON.stringify(config));
    } catch {
      // Ignorar errores de storage
    }
  }

  // 2. Aplicar estilos y CSS variables en caliente al DOM
  applyTenantTheme({
    public_name: config.publicName,
    tag_line: config.tagline,
    logo_url: config.logoUrl,
    favicon_url: config.faviconUrl,
    primary_color: config.primaryColor,
    secondary_color: config.secondaryColor,
  });

  // 3. Sincronizar Reglas de Underwriting
  await updateTenantLendingRules(config.tenantId, {
    maxFinancedPercentage: config.maxLtv,
    minLoanAmount: config.minLoanAmount,
    maxLoanAmount: config.maxLoanAmount,
    defaultRate: config.defaultInterestRate,
    availableTerms: config.availableTerms,
    repaymentModes: config.repaymentModes as any,
    acceptedPropertyTypes: config.acceptedPropertyTypes,
    acceptedRegions: config.acceptedRegions,
    earlyCancellationPolicy: config.earlyCancellationPolicy,
  });

  // 4. Sincronizar Feature Flags y Módulos
  await setTenantModuleEnabled(config.tenantId, 'ai_enabled', config.aiPrequalEnabled);
  await setTenantModuleEnabled(config.tenantId, 'servicing_enabled', config.servicingModuleEnabled);

  // 5. Actualizar registro dinámico de tenant
  const updatedTenant: Tenant = {
    id: config.tenantId,
    slug: config.slug,
    name: config.publicName,
    legal_name: config.legalName,
    status: 'active',
    branding: {
      public_name: config.publicName,
      tag_line: config.tagline,
      logo_url: config.logoUrl,
      favicon_url: config.faviconUrl,
      primary_color: config.primaryColor,
      secondary_color: config.secondaryColor,
    },
    settings: {
      allow_borrower_portal: true,
      default_currency: 'USD',
      sender_name: config.senderName,
      sender_email: config.senderEmail,
    },
    custom_domain: config.customDomain,
    is_white_label: true,
    demo_mode: true,
  };

  registerDynamicTenant(updatedTenant);

  // 6. Persistir en Supabase si está disponible
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('organizations')
        .update({
          name: config.publicName,
          commercial_name: config.publicName,
          legal_name: config.legalName,
          tax_id: config.rut,
          custom_domain: config.customDomain,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.tenantId);

      await supabase
        .from('organization_branding')
        .upsert(
          {
            organization_id: config.tenantId,
            public_name: config.publicName,
            tag_line: config.tagline,
            logo_url: config.logoUrl,
            favicon_url: config.faviconUrl,
            primary_color: config.primaryColor,
            secondary_color: config.secondaryColor,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id' }
        );
    } catch {
      // Ignorar errores de red
    }
  }

  return {
    success: true,
    message: 'Configuración White-Label guardada y aplicada en caliente exitosamente.',
  };
}
