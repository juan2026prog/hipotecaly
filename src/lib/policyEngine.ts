// ==============================================================================
// HIPOTECALY: Motor de Políticas de Crédito, Costos, Versionado y Simulador
// ==============================================================================

import { logAuditEvent } from './auditService';
import { assertPermission } from './rbacService';

export interface PolicyRule {
  id: string;
  name: string;
  category: 'monto' | 'garantia' | 'ingresos' | 'scoring' | 'juridico';
  description: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface PolicyVersion {
  id: string;
  version_number: number;
  version_label: string;
  organization_id: string;
  title: string;
  author_name: string;
  author_role: string;
  published_at: string;
  max_ltv_percent: number;
  base_annual_rate: number;
  min_amount_usd: number;
  max_amount_usd: number;
  min_term_months: number;
  max_term_months: number;
  min_credit_score: number;
  allowed_property_types: string[];
  requires_fea_signature: boolean;
  requires_notarial_certificate: boolean;
  notes: string;
  is_active: boolean;
}

export interface CostItem {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  currency: 'USD' | 'UYU';
  payer: 'borrower' | 'lender' | 'tenant';
  payee: 'tenant' | 'notary' | 'valuer' | 'platform';
  condition: string;
  tax_percent: number;
  customer_visible: boolean;
  valid_from: string;
}

export interface CostVersion {
  id: string;
  version_number: number;
  version_label: string;
  published_at: string;
  author_name: string;
  items: CostItem[];
  is_active: boolean;
}

export interface LegalTermsVersion {
  id: string;
  terms_version: string;
  privacy_version: string;
  published_at: string;
  author_name: string;
  terms_summary: string;
  privacy_summary: string;
  is_active: boolean;
}

export interface ConsentRecord {
  id: string;
  application_id: string;
  user_name: string;
  user_document: string;
  terms_version: string;
  privacy_version: string;
  data_treatment_accepted: boolean;
  accepted_at: string;
  channel: string;
  ip_address: string;
}

// Versiones históricas de políticas
const HISTORICAL_POLICIES: Record<string, PolicyVersion[]> = {
  'd0000000-0000-0000-0000-000000000001': [
    {
      id: 'pol-v5',
      version_number: 5,
      version_label: 'Política Hipotecaria v5',
      organization_id: 'd0000000-0000-0000-0000-000000000001',
      title: 'Política Estándar Residencial y Comercial 2026',
      author_name: 'Ignacio Notario (Admin)',
      author_role: 'admin',
      published_at: '2026-09-07T11:10:00Z',
      max_ltv_percent: 40,
      base_annual_rate: 11.5,
      min_amount_usd: 15000,
      max_amount_usd: 500000,
      min_term_months: 12,
      max_term_months: 60,
      min_credit_score: 650,
      allowed_property_types: ['casa', 'apartamento', 'local_comercial', 'terreno'],
      requires_fea_signature: true,
      requires_notarial_certificate: true,
      notes: 'Actualización de ratio LTV y actualización de tasas por política de banco central.',
      is_active: true,
    },
    {
      id: 'pol-v4',
      version_number: 4,
      version_label: 'Política Hipotecaria v4',
      organization_id: 'd0000000-0000-0000-0000-000000000001',
      title: 'Política de Consolidación Q2 2026',
      author_name: 'Valeria Rivas',
      author_role: 'admin',
      published_at: '2026-05-15T09:30:00Z',
      max_ltv_percent: 45,
      base_annual_rate: 12.0,
      min_amount_usd: 10000,
      max_amount_usd: 400000,
      min_term_months: 12,
      max_term_months: 48,
      min_credit_score: 600,
      allowed_property_types: ['casa', 'apartamento'],
      requires_fea_signature: true,
      requires_notarial_certificate: true,
      notes: 'Versión anterior previa al ajuste de riesgo de garantías comerciales.',
      is_active: false,
    },
  ],
};

// Borrador en edición por tenant
const POLICY_DRAFTS: Record<string, Partial<PolicyVersion>> = {};

// Costos históricos
const HISTORICAL_COSTS: Record<string, CostVersion[]> = {
  'd0000000-0000-0000-0000-000000000001': [
    {
      id: 'cost-v3',
      version_number: 3,
      version_label: 'Arancel de Costos y Gastos v3',
      published_at: '2026-08-01T10:00:00Z',
      author_name: 'Ignacio Notario (Admin)',
      is_active: true,
      items: [
        {
          id: 'c-1',
          name: 'Comisión de Originación y Estructuración',
          type: 'percentage',
          value: 2.5,
          currency: 'USD',
          payer: 'borrower',
          payee: 'tenant',
          condition: 'Al desembolso',
          tax_percent: 22,
          customer_visible: true,
          valid_from: '2026-08-01',
        },
        {
          id: 'c-2',
          name: 'Honorarios Notariales y Minuta Hipotecaria',
          type: 'percentage',
          value: 1.5,
          currency: 'USD',
          payer: 'borrower',
          payee: 'notary',
          condition: 'Al otorgamiento',
          tax_percent: 22,
          customer_visible: true,
          valid_from: '2026-08-01',
        },
        {
          id: 'c-3',
          name: 'Peritaje y Tasación Técnica Inmobiliaria',
          type: 'fixed',
          value: 350,
          currency: 'USD',
          payer: 'borrower',
          payee: 'valuer',
          condition: 'Previo a evaluación',
          tax_percent: 22,
          customer_visible: true,
          valid_from: '2026-08-01',
        },
      ],
    },
  ],
};

// Consentimientos por expediente
const DEMO_CONSENTS: Record<string, ConsentRecord[]> = {
  'e0000000-0000-0000-0000-000000000001': [
    {
      id: 'cs-1',
      application_id: 'e0000000-0000-0000-0000-000000000001',
      user_name: 'María López',
      user_document: '4.182.930-1',
      terms_version: 'Términos y Condiciones Generales v5',
      privacy_version: 'Política de Privacidad y Tratamiento de Datos v3',
      data_treatment_accepted: true,
      accepted_at: '2026-09-06T14:21:00Z',
      channel: 'Portal Web (OTP Móvil Verificado)',
      ip_address: '190.64.44.12',
    },
  ],
};

/**
 * Obtiene la política de crédito activa del tenant
 */
export function getActivePolicy(organizationId: string): PolicyVersion {
  const policies = HISTORICAL_POLICIES[organizationId] || HISTORICAL_POLICIES['d0000000-0000-0000-0000-000000000001'];
  return policies.find((p) => p.is_active) || policies[0];
}

/**
 * Obtiene el historial de versiones inmutables de políticas
 */
export function getPolicyVersions(organizationId: string): PolicyVersion[] {
  return HISTORICAL_POLICIES[organizationId] || HISTORICAL_POLICIES['d0000000-0000-0000-0000-000000000001'] || [];
}

/**
 * Obtiene el borrador actual en edición
 */
export function getPolicyDraft(organizationId: string): Partial<PolicyVersion> | null {
  return POLICY_DRAFTS[organizationId] || null;
}

/**
 * Guarda cambios en el borrador (sin publicar)
 */
export function savePolicyDraft(organizationId: string, draft: Partial<PolicyVersion>): void {
  POLICY_DRAFTS[organizationId] = {
    ...POLICY_DRAFTS[organizationId],
    ...draft,
  };
}

/**
 * Descarta el borrador pendiente
 */
export function discardPolicyDraft(organizationId: string): void {
  delete POLICY_DRAFTS[organizationId];
}

/**
 * Publica el borrador creando una nueva versión inmutable
 */
export async function publishPolicy(params: {
  organizationId: string;
  draft: Partial<PolicyVersion>;
  userName: string;
  userRole: string;
  notes?: string;
}): Promise<PolicyVersion> {
  // Validar permiso RBAC
  assertPermission(params.userRole, 'publish_policy', 'Solo los administradores pueden publicar políticas de crédito.');

  const existingList = getPolicyVersions(params.organizationId);
  const nextVersionNum = existingList.length + 1;
  const activePolicy = getActivePolicy(params.organizationId);

  // Desactivar versiones previas
  existingList.forEach((p) => (p.is_active = false));

  const newVersion: PolicyVersion = {
    id: `pol-v${nextVersionNum}`,
    version_number: nextVersionNum,
    version_label: `Política Hipotecaria v${nextVersionNum}`,
    organization_id: params.organizationId,
    title: params.draft.title || `Política Hipotecaria v${nextVersionNum}`,
    author_name: params.userName,
    author_role: params.userRole,
    published_at: new Date().toISOString(),
    max_ltv_percent: params.draft.max_ltv_percent ?? activePolicy.max_ltv_percent,
    base_annual_rate: params.draft.base_annual_rate ?? activePolicy.base_annual_rate,
    min_amount_usd: params.draft.min_amount_usd ?? activePolicy.min_amount_usd,
    max_amount_usd: params.draft.max_amount_usd ?? activePolicy.max_amount_usd,
    min_term_months: params.draft.min_term_months ?? activePolicy.min_term_months,
    max_term_months: params.draft.max_term_months ?? activePolicy.max_term_months,
    min_credit_score: params.draft.min_credit_score ?? activePolicy.min_credit_score,
    allowed_property_types: params.draft.allowed_property_types || activePolicy.allowed_property_types,
    requires_fea_signature: params.draft.requires_fea_signature ?? activePolicy.requires_fea_signature,
    requires_notarial_certificate: params.draft.requires_notarial_certificate ?? activePolicy.requires_notarial_certificate,
    notes: params.notes || params.draft.notes || 'Nueva versión publicada desde Backoffice White Label.',
    is_active: true,
  };

  existingList.unshift(newVersion);
  HISTORICAL_POLICIES[params.organizationId] = existingList;
  delete POLICY_DRAFTS[params.organizationId];

  // Registrar auditoría inmutable
  await logAuditEvent({
    organizationId: params.organizationId,
    userName: params.userName,
    userRole: params.userRole,
    action: `Publicación de ${newVersion.version_label}`,
    module: 'Políticas',
    recordIdentifier: newVersion.version_label,
    oldValue: `${activePolicy.version_label} (LTV ${activePolicy.max_ltv_percent}%, Tasa ${activePolicy.base_annual_rate}%)`,
    newValue: `${newVersion.version_label} (LTV ${newVersion.max_ltv_percent}%, Tasa ${newVersion.base_annual_rate}%)`,
  });

  return newVersion;
}

/**
 * SIMULADOR DE POLÍTICA ("PROBAR POLÍTICA")
 * Valida un expediente o datos simulados contra la política sin alterar estado del expediente
 */
export function simulatePolicyEvaluation(
  policy: PolicyVersion,
  input: {
    requestedAmount: number;
    propertyEstimatedValue: number;
    propertyType: string;
    termMonths: number;
    monthlyIncome?: number;
    creditScore?: number;
    hasIncomeDocs?: boolean;
    hasCleanClearing?: boolean;
  }
): {
  passed: boolean;
  passedCount: number;
  totalRules: number;
  calculatedLtv: number;
  rulesList: PolicyRule[];
} {
  const ltv = input.propertyEstimatedValue > 0
    ? (input.requestedAmount / input.propertyEstimatedValue) * 100
    : 0;

  const rules: PolicyRule[] = [
    {
      id: 'r-1',
      name: 'Monto dentro del rango permitido',
      category: 'monto',
      description: `El monto solicitado (USD ${input.requestedAmount.toLocaleString('es-UY')}) debe estar entre USD ${policy.min_amount_usd.toLocaleString('es-UY')} y USD ${policy.max_amount_usd.toLocaleString('es-UY')}.`,
      status: input.requestedAmount >= policy.min_amount_usd && input.requestedAmount <= policy.max_amount_usd ? 'pass' : 'fail',
      detail: `Rango: [${policy.min_amount_usd} - ${policy.max_amount_usd}] USD`,
    },
    {
      id: 'r-2',
      name: 'Porcentaje de Financiación (LTV Máximo)',
      category: 'garantia',
      description: `El LTV calculado (${ltv.toFixed(1)}%) no debe superar el tope máximo de la política (${policy.max_ltv_percent}%).`,
      status: ltv <= policy.max_ltv_percent ? 'pass' : 'fail',
      detail: `LTV calculado: ${ltv.toFixed(1)}% / Tope: ${policy.max_ltv_percent}%`,
    },
    {
      id: 'r-3',
      name: 'Tipo de Inmueble Aceptado',
      category: 'garantia',
      description: `El tipo de garantía ('${input.propertyType}') debe figurar en la lista de garantías elegibles.`,
      status: policy.allowed_property_types.includes(input.propertyType.toLowerCase()) ? 'pass' : 'fail',
      detail: `Tipos permitidos: ${policy.allowed_property_types.join(', ')}`,
    },
    {
      id: 'r-4',
      name: 'Plazo en Meses Elegible',
      category: 'monto',
      description: `El plazo solicitado (${input.termMonths} meses) debe ubicarse entre ${policy.min_term_months} y ${policy.max_term_months} meses.`,
      status: input.termMonths >= policy.min_term_months && input.termMonths <= policy.max_term_months ? 'pass' : 'fail',
      detail: `Plazo: ${input.termMonths}m`,
    },
    {
      id: 'r-5',
      name: 'Documentación de Ingresos Comprobable',
      category: 'ingresos',
      description: 'El solicitante debe contar con recibos de sueldo o certificado de ingresos cargados.',
      status: input.hasIncomeDocs !== false ? 'pass' : 'warn',
      detail: input.hasIncomeDocs !== false ? 'Documentos presentes' : 'Pendiente de adjuntar',
    },
    {
      id: 'r-6',
      name: 'Historial en Clearing de Informes & Central de Riesgos BCU',
      category: 'scoring',
      description: 'Evaluación de antecedentes crediticios. Hipotecaly admite solicitantes en Clearing (no es causal de rechazo automático ni bloqueo; se pondera en el análisis de riesgo).',
      status: input.hasCleanClearing !== false ? 'pass' : 'warn',
      detail: input.hasCleanClearing !== false ? 'Sin antecedentes reportados' : 'Con antecedentes (Admitido para análisis de riesgo)',
    },
  ];

  const passedCount = rules.filter((r) => r.status === 'pass').length;
  const isOverallPassed = rules.every((r) => r.status !== 'fail');

  return {
    passed: isOverallPassed,
    passedCount,
    totalRules: rules.length,
    calculatedLtv: Number(ltv.toFixed(1)),
    rulesList: rules,
  };
}

/**
 * Obtiene la configuración de costos activa del tenant
 */
export function getActiveCosts(organizationId: string): CostVersion {
  const list = HISTORICAL_COSTS[organizationId] || HISTORICAL_COSTS['d0000000-0000-0000-0000-000000000001'];
  return list.find((c) => c.is_active) || list[0];
}

/**
 * Obtiene el registro de consentimientos para un expediente
 */
export function getApplicationConsents(applicationId: string): ConsentRecord[] {
  return DEMO_CONSENTS[applicationId] || [
    {
      id: `cs-${applicationId}`,
      application_id: applicationId,
      user_name: 'Titular Registrado',
      user_document: 'CI Uruguaya Verificada',
      terms_version: 'Términos y Condiciones Generales v5',
      privacy_version: 'Política de Privacidad y Tratamiento de Datos v3',
      data_treatment_accepted: true,
      accepted_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      channel: 'Portal Web (OTP Móvil Verificado)',
      ip_address: '190.64.44.12',
    },
  ];
}
