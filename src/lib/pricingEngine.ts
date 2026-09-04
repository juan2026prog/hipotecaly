// ==============================================================================
// HIPOTECALY: Motor de Planes Comerciales y Pricing SaaS Configurable
// ==============================================================================

export interface SaaSPlanDefinition {
  id: 'start' | 'professional' | 'platform' | 'enterprise';
  name: string;
  badge: string;
  tagline: string;
  targetAudience: string;
  baseMonthlyUsd?: number;
  baseAnnualMonthlyUsd?: number;
  setupFeeUsd?: number;
  includedModules: string[];
  maxUsersIncluded: number;
  maxActiveCasesIncluded: number;
  features: string[];
  popular?: boolean;
}

export const SAAS_PLANS: SaaSPlanDefinition[] = [
  {
    id: 'start',
    name: 'START',
    badge: 'INICIACIÓN',
    tagline: 'Para prestamistas individuales o estudios que digitalizan su originación',
    targetAudience: 'Prestamistas privados y pequeños estudios jurídicos',
    includedModules: [
      'core_tenancy',
      'core_auth_rbac',
      'origination_simulator',
      'origination_intake_wizard',
      'origination_borrower_portal',
      'capital_lender_portal',
      'capital_antibypass',
      'docs_storage_checklists',
      'risk_engine_rules',
      'valuation_property_profile',
      'compliance_audit_logs',
      'whitelabel_custom_branding',
    ],
    maxUsersIncluded: 2,
    maxActiveCasesIncluded: 10,
    features: [
      'Simulador hipotecario digital',
      'Formulario guiado de solicitud de crédito',
      'Portal Mi Cuenta para solicitantes',
      'Feed de oportunidades con Anti-Bypass',
      'Subida de documentos y títulos de propiedad',
      'Reglas crediticias paramétricas',
      'Auditoría forense inmutable',
      'Soporte por email (48hs)',
    ],
  },
  {
    id: 'professional',
    name: 'PROFESSIONAL',
    badge: 'MÁS POPULAR',
    tagline: 'Para operadoras de crédito, financieras y estudios notariales activos',
    targetAudience: 'Financieras medianas, cooperativas y estudios notariales',
    popular: true,
    includedModules: [
      'core_tenancy',
      'core_auth_rbac',
      'origination_simulator',
      'origination_intake_wizard',
      'origination_borrower_portal',
      'capital_lender_portal',
      'capital_antibypass',
      'docs_storage_checklists',
      'docs_ai_intelligence',
      'risk_engine_rules',
      'risk_ai_consistency',
      'valuation_property_profile',
      'crm_leads_management',
      'automation_events_triggers',
      'comm_notification_center',
      'compliance_audit_logs',
      'whitelabel_custom_branding',
      'integrations_embed_widget',
    ],
    maxUsersIncluded: 5,
    maxActiveCasesIncluded: 35,
    features: [
      'Todo lo incluido en plan START',
      'Document Intelligence Asistivo',
      'Risk & Consistency Copilot',
      'Pipeline CRM de leads y solicitudes',
      'Automatizaciones de estado y recordatorios',
      'Widget embebible para sitio web corporativo',
      'Centro unificado de notificaciones transaccionales',
      'Soporte prioritario por WhatsApp y email',
    ],
  },
  {
    id: 'platform',
    name: 'PLATFORM',
    badge: 'LLAVE EN MANO',
    tagline: 'El core operativo integral con marca propia y sindicación',
    targetAudience: 'Financieras consolidadas, fondos privados y originadores masivos',
    includedModules: [
      'core_tenancy',
      'core_auth_rbac',
      'origination_simulator',
      'origination_intake_wizard',
      'origination_borrower_portal',
      'capital_lender_portal',
      'capital_antibypass',
      'capital_syndication',
      'docs_storage_checklists',
      'docs_ai_intelligence',
      'risk_engine_rules',
      'risk_ai_consistency',
      'valuation_property_profile',
      'valuation_appraisal_network',
      'crm_leads_management',
      'automation_events_triggers',
      'servicing_loan_management',
      'servicing_payment_reconciliation',
      'comm_notification_center',
      'whitelabel_custom_branding',
      'whitelabel_custom_domain',
      'integrations_embed_widget',
      'analytics_advanced_reporting',
      'compliance_audit_logs',
    ],
    maxUsersIncluded: 15,
    maxActiveCasesIncluded: 100,
    features: [
      'Todo lo incluido en plan PROFESSIONAL',
      'Dominio propio personalizado con certificado SSL',
      'Sindicación de tranches entre múltiples inversores',
      'Loan Servicing y calendario de amortización',
      'Conciliación de comprobantes y pagos',
      'Módulo de tasaciones periciales',
      'Tableros analíticos y métricas de cartera',
      'Onboarding técnico y migración asistida',
    ],
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    badge: 'A MEDIDA',
    tagline: 'Infraestructura crediticia institucional dedicada con API completa',
    targetAudience: 'Bancos, fondos institucionales y redes nacionales',
    includedModules: [
      'core_tenancy',
      'core_auth_rbac',
      'origination_simulator',
      'origination_intake_wizard',
      'origination_borrower_portal',
      'capital_lender_portal',
      'capital_antibypass',
      'capital_syndication',
      'docs_storage_checklists',
      'docs_ai_intelligence',
      'risk_engine_rules',
      'risk_ai_consistency',
      'valuation_property_profile',
      'valuation_appraisal_network',
      'crm_leads_management',
      'automation_events_triggers',
      'servicing_loan_management',
      'servicing_payment_reconciliation',
      'comm_notification_center',
      'whitelabel_custom_branding',
      'whitelabel_custom_domain',
      'integrations_embed_widget',
      'integrations_public_api',
      'analytics_advanced_reporting',
      'compliance_audit_logs',
      'enterprise_sso',
    ],
    maxUsersIncluded: 999,
    maxActiveCasesIncluded: 9999,
    features: [
      'Todo lo incluido en plan PLATFORM',
      'API REST pública y webhooks para integraciones',
      'Single Sign-On (SSO) SAML / Azure AD',
      'Infraestructura cloud dedicada / Multi-región',
      'SLA garantizado del 99.9% de uptime',
      'Capacitación in-company y ejecutivo de cuenta dedicado',
      'Políticas de riesgo crediticio customizadas',
      'Acuerdo de nivel de servicio y seguridad bancaria',
    ],
  },
];

export function getPlanById(planId: string): SaaSPlanDefinition | undefined {
  return SAAS_PLANS.find((p) => p.id === planId);
}

export function getAllPlans(): SaaSPlanDefinition[] {
  return [...SAAS_PLANS];
}
