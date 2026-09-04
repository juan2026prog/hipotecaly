// ==============================================================================
// HIPOTECALY: Catálogo Maestro de Módulos SaaS, Dependencias y Entitlements
// ==============================================================================

export type ModuleCategory =
  | 'Core'
  | 'Originación'
  | 'Capital'
  | 'Documents'
  | 'Risk'
  | 'Valuation'
  | 'CRM'
  | 'Automation'
  | 'AI'
  | 'Servicing'
  | 'Payments'
  | 'Communication'
  | 'White-Label'
  | 'Integrations'
  | 'Analytics'
  | 'Compliance'
  | 'Enterprise';

export type ModuleTier = 'included' | 'addon' | 'enterprise' | 'coming_soon';

export interface SaaSModuleDefinition {
  id: string;
  name: string;
  category: ModuleCategory;
  description: string;
  tier: ModuleTier;
  dependencies: string[];
  backendReady: boolean;
  frontendReady: boolean;
  tenantAware: boolean;
  commercialStatus: 'available' | 'addon' | 'enterprise' | 'roadmap';
  icon?: string;
}

export const SAAS_MODULE_CATALOG: SaaSModuleDefinition[] = [
  // 1. Core
  {
    id: 'core_tenancy',
    name: 'Multi-Tenancy & Tenant Resolver',
    category: 'Core',
    description: 'Aislamiento de base de datos, resolución dinámica de tenant por URL/subdominio y contextos operativos.',
    tier: 'included',
    dependencies: [],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },
  {
    id: 'core_auth_rbac',
    name: 'Autenticación & RBAC Base',
    category: 'Core',
    description: 'Gestión de usuarios, credenciales, sesiones y roles estándar (solicitante, prestamista, analista, admin).',
    tier: 'included',
    dependencies: ['core_tenancy'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },

  // 2. Originación
  {
    id: 'origination_simulator',
    name: 'Simulador Hipotecario Paramétrico',
    category: 'Originación',
    description: 'Cálculo de LTV, cuotas mensuales y montos máximos adaptados a las reglas del tenant.',
    tier: 'included',
    dependencies: ['core_tenancy'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },
  {
    id: 'origination_intake_wizard',
    name: 'Asistente Digital de Solicitudes',
    category: 'Originación',
    description: 'Formulario paso a paso para carga de datos patrimoniales, ingresos e inmueble con persistencia reactiva.',
    tier: 'included',
    dependencies: ['core_tenancy', 'core_auth_rbac', 'origination_simulator'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },
  {
    id: 'origination_borrower_portal',
    name: 'Portal del Solicitante (Mi Cuenta)',
    category: 'Originación',
    description: 'Espacio personal del prestatario para seguimiento de estado, subida de recaudos y aceptación de ofertas.',
    tier: 'included',
    dependencies: ['core_tenancy', 'core_auth_rbac', 'origination_intake_wizard'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },

  // 3. Capital & Marketplace
  {
    id: 'capital_lender_portal',
    name: 'Portal del Prestamista & Feed de Oportunidades',
    category: 'Capital',
    description: 'Feed de solicitudes pre-calificadas, simulación de ofertas y gestión de posturas financieras.',
    tier: 'included',
    dependencies: ['core_tenancy', 'core_auth_rbac'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },
  {
    id: 'capital_antibypass',
    name: 'Blindaje Anti-Bypass & Anonimización Progresiva',
    category: 'Capital',
    description: 'Ocultamiento de datos de contacto y padrones catastrales hasta autorización explícita tras oferta aceptada.',
    tier: 'included',
    dependencies: ['capital_lender_portal'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },
  {
    id: 'capital_syndication',
    name: 'Sindicación Multi-Inversor & Tranches',
    category: 'Capital',
    description: 'Reparto de un mismo crédito hipotecario entre múltiples inversores privados o fondos institucionales.',
    tier: 'addon',
    dependencies: ['capital_lender_portal'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'addon',
  },

  // 4. Documents & Intelligence
  {
    id: 'docs_storage_checklists',
    name: 'Expediente Documental & Checklists',
    category: 'Documents',
    description: 'Subida segura de títulos, certificados y cédulas catastrales con clasificación y visor protegido.',
    tier: 'included',
    dependencies: ['core_tenancy', 'core_auth_rbac'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },
  {
    id: 'docs_ai_intelligence',
    name: 'Document Intelligence Asistivo',
    category: 'Documents',
    description: 'Extracción de datos registrales, verificación de consistencia en padrones y alertas de caducidad.',
    tier: 'addon',
    dependencies: ['docs_storage_checklists'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'addon',
  },

  // 5. Risk Engine
  {
    id: 'risk_engine_rules',
    name: 'Motor Paramétrico de Reglas Crediticias',
    category: 'Risk',
    description: 'Configuración en caliente de topes de LTV, montos máximos, tipos de propiedad y zonas habilitadas.',
    tier: 'included',
    dependencies: ['core_tenancy'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },
  {
    id: 'risk_ai_consistency',
    name: 'Risk & Consistency Copilot',
    category: 'Risk',
    description: 'Auditoría automatizada de coherencia entre ingresos declarados, valor del bien y perfil de endeudamiento.',
    tier: 'addon',
    dependencies: ['risk_engine_rules'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'addon',
  },

  // 6. Valuation
  {
    id: 'valuation_property_profile',
    name: 'Ficha Catastral & Perfil de Inmueble',
    category: 'Valuation',
    description: 'Registro de padrón, metraje, características y fotografías georreferenciadas del colateral.',
    tier: 'included',
    dependencies: ['core_tenancy'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },
  {
    id: 'valuation_appraisal_network',
    name: 'Red y Módulo de Tasaciones Notariales/Periciales',
    category: 'Valuation',
    description: 'Asignación de peritos tasadores, informe pericial formal y ajuste de ratio LTV verificado.',
    tier: 'addon',
    dependencies: ['valuation_property_profile'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'addon',
  },

  // 7. CRM & Leads
  {
    id: 'crm_leads_management',
    name: 'Pipeline Comercial de Solicitudes & Leads',
    category: 'CRM',
    description: 'Seguimiento de prospectos, estados de contacto, notas internas y tareas para asesores comerciales.',
    tier: 'included',
    dependencies: ['core_tenancy', 'core_auth_rbac'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },

  // 8. Automation & Workflows
  {
    id: 'automation_events_triggers',
    name: 'Motor de Automatizaciones & Recordatorios',
    category: 'Automation',
    description: 'Disparadores por eventos de cambio de estado (aviso de oferta, recordatorio de documento pendiente, etc.).',
    tier: 'included',
    dependencies: ['core_tenancy'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },

  // 9. Servicing & Payments
  {
    id: 'servicing_loan_management',
    name: 'Loan Servicing & Calendario de Cuotas',
    category: 'Servicing',
    description: 'Generación de cronogramas de amortización (Francés / Solo Intereses), devengamiento y control de pagos.',
    tier: 'addon',
    dependencies: ['core_tenancy'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'addon',
  },
  {
    id: 'servicing_payment_reconciliation',
    name: 'Conciliación de Comprobantes & Pagos',
    category: 'Payments',
    description: 'Carga y validación de transferencias bancarias, recibos y liquidaciones a prestamistas.',
    tier: 'addon',
    dependencies: ['servicing_loan_management'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'addon',
  },

  // 10. Communication
  {
    id: 'comm_notification_center',
    name: 'Centro Unificado de Notificaciones',
    category: 'Communication',
    description: 'Alertas in-app y despachos de correo transaccionales con plantilla y branding del tenant.',
    tier: 'included',
    dependencies: ['core_tenancy'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },

  // 11. White-Label
  {
    id: 'whitelabel_custom_branding',
    name: 'Identidad Corporativa & Paleta CSS',
    category: 'White-Label',
    description: 'Logotipo, nombre público, textos y colores adaptados por tenant.',
    tier: 'included',
    dependencies: ['core_tenancy'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },
  {
    id: 'whitelabel_custom_domain',
    name: 'Dominio Personalizado & Certificado SSL',
    category: 'White-Label',
    description: 'Operación bajo subdominio o dominio propio del cliente (ej. creditos.tuempresa.uy).',
    tier: 'addon',
    dependencies: ['whitelabel_custom_branding'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'addon',
  },

  // 12. Integrations & API
  {
    id: 'integrations_embed_widget',
    name: 'Widget Embebido de Simulación',
    category: 'Integrations',
    description: 'Script e iframe interactivo para insertar el simulador en sitios web existentes.',
    tier: 'included',
    dependencies: ['origination_simulator'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },
  {
    id: 'integrations_public_api',
    name: 'API REST & Webhooks para Desarrolladores',
    category: 'Integrations',
    description: 'Endpoints autenticados mediante API keys para consulta y sincronización de expedientes.',
    tier: 'enterprise',
    dependencies: ['core_tenancy', 'core_auth_rbac'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'enterprise',
  },
  {
    id: 'integrations_dgr_registry',
    name: 'Conexión Directa Dirección General de Registros',
    category: 'Integrations',
    description: 'Cotejo automatizado de antecedentes dominiales y certificados registrales oficiales en Uruguay.',
    tier: 'coming_soon',
    dependencies: ['docs_storage_checklists'],
    backendReady: false,
    frontendReady: false,
    tenantAware: true,
    commercialStatus: 'roadmap',
  },

  // 13. Analytics & Compliance
  {
    id: 'analytics_advanced_reporting',
    name: 'Tableros de Métricas & Embudo de Conversión',
    category: 'Analytics',
    description: 'KPIs de colocación, volumen originado, tasas promedio, tiempos de resolución y rendimiento.',
    tier: 'addon',
    dependencies: ['core_tenancy'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'addon',
  },
  {
    id: 'compliance_audit_logs',
    name: 'Bitácora Forense de Auditoría Inmutable',
    category: 'Compliance',
    description: 'Registro criptográfico de cada acción, usuario, fecha, dirección IP y cambio de estado.',
    tier: 'included',
    dependencies: ['core_tenancy'],
    backendReady: true,
    frontendReady: true,
    tenantAware: true,
    commercialStatus: 'available',
  },

  // 14. Enterprise
  {
    id: 'enterprise_sso',
    name: 'Single Sign-On (SSO) SAML / OIDC',
    category: 'Enterprise',
    description: 'Integración de inicio de sesión único con Microsoft Azure AD / Google Workspace corporativo.',
    tier: 'enterprise',
    dependencies: ['core_auth_rbac'],
    backendReady: false,
    frontendReady: false,
    tenantAware: true,
    commercialStatus: 'enterprise',
  },
];

// ==============================================================================
// GESTIÓN DE DEPENDENCIAS Y ENTITLEMENTS EN MEMORIA Y PERSISTENCIA
// ==============================================================================

// Almacén en memoria por tenant (tenantId -> Set de moduleIds activos)
const activeTenantModulesMap = new Map<string, Set<string>>();

/**
 * Retorna la lista completa de módulos definidos en la plataforma
 */
export function getAllModules(): SaaSModuleDefinition[] {
  return [...SAAS_MODULE_CATALOG];
}

/**
 * Busca un módulo por su ID
 */
export function getModuleById(moduleId: string): SaaSModuleDefinition | undefined {
  return SAAS_MODULE_CATALOG.find((m) => m.id === moduleId);
}

/**
 * Inicializa los módulos por defecto de un tenant (todos los 'included')
 */
export function getInitialIncludedModuleIds(): string[] {
  return SAAS_MODULE_CATALOG.filter((m) => m.tier === 'included').map((m) => m.id);
}

/**
 * Obtiene el conjunto de IDs de módulos activos para un tenant
 */
export async function getActiveModuleIdsForTenant(tenantId: string): Promise<string[]> {
  if (activeTenantModulesMap.has(tenantId)) {
    return Array.from(activeTenantModulesMap.get(tenantId)!);
  }

  // Si existe en localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(`hipotecaly_entitlements_${tenantId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        activeTenantModulesMap.set(tenantId, new Set(parsed));
        return parsed;
      }
    } catch {
      // Ignorar error
    }
  }

  // Fallback inicial: todos los módulos incluidos + add-ons para NOVA
  const defaultList = getInitialIncludedModuleIds();
  if (tenantId === 'd0000000-0000-0000-0000-000000000001') {
    // Tenant NOVA incluye add-ons para la demo interactiva
    defaultList.push(
      'capital_syndication',
      'docs_ai_intelligence',
      'risk_ai_consistency',
      'servicing_loan_management',
      'whitelabel_custom_domain',
      'analytics_advanced_reporting'
    );
  }

  activeTenantModulesMap.set(tenantId, new Set(defaultList));
  return defaultList;
}

/**
 * Valida si un módulo puede activarse revisando que todas sus dependencias estén activas
 */
export async function canEnableModule(
  tenantId: string,
  moduleId: string
): Promise<{ allowed: boolean; missingDependencies: string[]; reason?: string }> {
  const mod = getModuleById(moduleId);
  if (!mod) {
    return { allowed: false, missingDependencies: [], reason: 'Módulo inexistente' };
  }

  if (mod.tier === 'coming_soon' || mod.commercialStatus === 'roadmap') {
    return {
      allowed: false,
      missingDependencies: [],
      reason: 'El módulo está en desarrollo (Coming Soon) y no puede ser activado todavía.',
    };
  }

  const activeIds = await getActiveModuleIdsForTenant(tenantId);
  const activeSet = new Set(activeIds);

  const missing = mod.dependencies.filter((depId) => !activeSet.has(depId));

  if (missing.length > 0) {
    const missingNames = missing.map((id) => getModuleById(id)?.name || id);
    return {
      allowed: false,
      missingDependencies: missing,
      reason: `Requiere activar previamente las dependencias: ${missingNames.join(', ')}`,
    };
  }

  return { allowed: true, missingDependencies: [] };
}

/**
 * Activa un módulo para un tenant tras validar dependencias
 */
export async function enableTenantModule(
  tenantId: string,
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  const check = await canEnableModule(tenantId, moduleId);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  const activeIds = await getActiveModuleIdsForTenant(tenantId);
  const updatedSet = new Set(activeIds);
  updatedSet.add(moduleId);

  activeTenantModulesMap.set(tenantId, updatedSet);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        `hipotecaly_entitlements_${tenantId}`,
        JSON.stringify(Array.from(updatedSet))
      );
    } catch {
      // Ignorar error de storage
    }
  }

  return { success: true };
}

/**
 * Desactiva un módulo para un tenant.
 * Si otros módulos activos dependen de él, se rechaza o se listan los dependientes.
 */
export async function disableTenantModule(
  tenantId: string,
  moduleId: string
): Promise<{ success: boolean; error?: string; dependents?: string[] }> {
  const activeIds = await getActiveModuleIdsForTenant(tenantId);
  const activeSet = new Set(activeIds);

  // Buscar si algún módulo activo depende del que se quiere desactivar
  const dependents = SAAS_MODULE_CATALOG.filter(
    (m) => activeSet.has(m.id) && m.dependencies.includes(moduleId)
  ).map((m) => m.name);

  if (dependents.length > 0) {
    return {
      success: false,
      error: `No se puede desactivar porque los siguientes módulos activos dependen de él: ${dependents.join(', ')}`,
      dependents,
    };
  }

  activeSet.delete(moduleId);
  activeTenantModulesMap.set(tenantId, activeSet);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        `hipotecaly_entitlements_${tenantId}`,
        JSON.stringify(Array.from(activeSet))
      );
    } catch {
      // Ignorar error
    }
  }

  return { success: true };
}

/**
 * Verifica si un tenant tiene entitlement activo para un módulo
 */
export async function hasTenantEntitlement(tenantId: string, moduleId: string): Promise<boolean> {
  const active = await getActiveModuleIdsForTenant(tenantId);
  return active.includes(moduleId);
}

/**
 * Limpia la memoria de entitlements de un tenant (para testing y pruebas)
 */
export function resetTenantEntitlementsCache(tenantId?: string) {
  if (tenantId) {
    activeTenantModulesMap.delete(tenantId);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`hipotecaly_entitlements_${tenantId}`);
    }
  } else {
    activeTenantModulesMap.clear();
  }
}
