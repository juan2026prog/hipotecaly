// ==============================================================================
// HIPOTECALY: Multi-Tenant Underwriting Policy Resolver & Validation Engine
// Resuelve determinísticamente la política crediticia efectiva:
// Organization Policy (Límites absolutos y defaults) + Lender Rules (Criterios de Inversor)
// Retorna un Result Type discriminado sin fallbacks silenciosos ante errores.
// ==============================================================================

import { supabaseAdmin } from '../supabase.js';

export interface EffectiveUnderwritingPolicy {
  organizationId: string;
  lenderId?: string;
  source: 'organization' | 'lender' | 'organization_and_lender' | 'demo';
  maxLtv: number; // Por ej. 40.0%
  minLtv?: number; // Por ej. 5.0%
  minLoanAmount?: number; // USD 10.000
  maxLoanAmount?: number; // USD 200.000
  minTermMonths?: number; // 12
  maxTermMonths?: number; // 60
  acceptedPropertyTypes?: string[];
  acceptedDepartments?: string[];
  acceptedCurrencies?: string[];
  requiresIncomeProof?: boolean;
  acceptedIncomeTypes?: string[];
  minimumIncomeMonthly?: number;
  acceptsClearing?: boolean;
  maxDtiRatio?: number; // Por ej. 35.0%
  maxBorrowerAgeAtMaturity?: number; // Por ej. 75 años
  defaultInterestRateAnnual?: number; // Por ej. 11.5%
  isDynamic: boolean;
}

export type PolicyResolutionResult =
  | { status: 'RESOLVED'; policy: EffectiveUnderwritingPolicy }
  | { status: 'DEMO_POLICY'; policy: EffectiveUnderwritingPolicy }
  | { status: 'POLICY_NOT_CONFIGURED'; message: string }
  | { status: 'POLICY_INCOMPLETE'; missingFields: string[]; message: string }
  | { status: 'NO_COMPATIBLE_POLICY'; reasons: string[] }
  | { status: 'LENDER_INACTIVE'; message: string }
  | { status: 'POLICY_DATA_ERROR'; errorCode: string; message: string }
  | { status: 'POLICY_RESOLUTION_ERROR'; errorCode: string; message: string };

export const CANONICAL_DEMO_POLICY: EffectiveUnderwritingPolicy = {
  organizationId: 'd0000000-0000-0000-0000-000000000001',
  source: 'demo',
  maxLtv: 40.0,
  minLtv: 5.0,
  minLoanAmount: 10000,
  maxLoanAmount: 200000,
  minTermMonths: 12,
  maxTermMonths: 60,
  acceptedPropertyTypes: ['casa', 'apartamento', 'terreno', 'local_comercial', 'campo'],
  acceptedDepartments: [
    'Montevideo',
    'Canelones',
    'Maldonado',
    'Colonia',
    'San José',
    'Rocha',
    'Salto',
    'Paysandú',
    'Todos',
  ],
  acceptedCurrencies: ['USD'],
  requiresIncomeProof: true,
  acceptedIncomeTypes: ['dependiente', 'independiente', 'jubilado', 'rentista'],
  minimumIncomeMonthly: 0,
  acceptsClearing: true,
  maxDtiRatio: 35.0,
  maxBorrowerAgeAtMaturity: 75,
  defaultInterestRateAnnual: 11.5,
  isDynamic: false,
};

export interface RawOrgPolicyRecord {
  organization_id: string;
  is_active?: boolean;
  max_ltv?: number | string | null;
  min_ltv?: number | string | null;
  min_loan_amount?: number | string | null;
  max_loan_amount?: number | string | null;
  min_term_months?: number | string | null;
  max_term_months?: number | string | null;
  accepted_property_types?: string[] | null;
  accepted_departments?: string[] | null;
  accepted_currencies?: string[] | null;
  requires_income_proof?: boolean | null;
  accepted_income_types?: string[] | null;
  minimum_income_monthly?: number | string | null;
  accepts_clearing?: boolean | null;
  max_dti_ratio?: number | string | null;
  max_borrower_age_at_maturity?: number | string | null;
  default_interest_rate_annual?: number | string | null;
}

export interface RawLenderRulesRecord {
  id?: string;
  lender_id: string;
  max_ltv?: number | string | null;
  min_loan?: number | string | null;
  max_loan?: number | string | null;
  min_term_months?: number | string | null;
  max_term_months?: number | string | null;
  accepted_property_types?: string[] | null;
  accepted_departments?: string[] | null;
  accepted_currencies?: string[] | null;
  requires_income_proof?: boolean | null;
  accepts_clearing?: boolean | null;
  lender?: {
    organization_id: string;
    status: string;
  } | null;
}

export interface PolicyRepository {
  findActiveOrgPolicy(organizationId: string): Promise<{ data: RawOrgPolicyRecord | null; error: Error | null }>;
  findLenderRules(organizationId: string, lenderId: string): Promise<{ data: RawLenderRulesRecord | null; error: Error | null }>;
}

export class SupabasePolicyRepository implements PolicyRepository {
  public async findActiveOrgPolicy(organizationId: string): Promise<{ data: RawOrgPolicyRecord | null; error: Error | null }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('organization_underwriting_policies')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) return { data: null, error: new Error(error.message) };
      return { data: data as RawOrgPolicyRecord | null, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  public async findLenderRules(organizationId: string, lenderId: string): Promise<{ data: RawLenderRulesRecord | null; error: Error | null }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('lender_rules')
        .select('*, lender:lenders!inner(organization_id, status)')
        .eq('lender_id', lenderId)
        .eq('lenders.organization_id', organizationId)
        .maybeSingle();

      if (error) return { data: null, error: new Error(error.message) };
      return { data: data as RawLenderRulesRecord | null, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
}

/**
 * Helper canónico para comprobar si un valor representa un comodín universal
 */
export function isWildcard(value?: string | string[]): boolean {
  if (!value) return false;
  if (Array.isArray(value)) {
    return value.some((v) => isWildcard(v));
  }
  const clean = value.trim().toLowerCase();
  return clean === 'todos' || clean === 'all' || clean === '*' || clean === 'cualquiera';
}

/**
 * Calcula la intersección segura entre dos listas de permitidos considerando comodines
 */
export function resolveListIntersection(
  listA?: string[],
  listB?: string[]
): { empty: boolean; result?: string[] } {
  if (!listA && !listB) return { empty: false, result: undefined };
  if (!listA || listA.length === 0 || isWildcard(listA)) {
    return { empty: false, result: listB && listB.length > 0 ? listB : undefined };
  }
  if (!listB || listB.length === 0 || isWildcard(listB)) {
    return { empty: false, result: listA && listA.length > 0 ? listA : undefined };
  }

  const setB = new Set(listB.map((item) => item.trim().toLowerCase()));
  const intersection = listA.filter((item) => setB.has(item.trim().toLowerCase()));

  return {
    empty: intersection.length === 0,
    result: intersection.length > 0 ? intersection : undefined,
  };
}

export class UnderwritingPolicyResolver {
  private static instance: UnderwritingPolicyResolver;
  private repository: PolicyRepository;

  public constructor(repository?: PolicyRepository) {
    this.repository = repository || new SupabasePolicyRepository();
  }

  public static getInstance(): UnderwritingPolicyResolver {
    if (!UnderwritingPolicyResolver.instance) {
      UnderwritingPolicyResolver.instance = new UnderwritingPolicyResolver();
    }
    return UnderwritingPolicyResolver.instance;
  }

  public setRepository(repository: PolicyRepository): void {
    this.repository = repository;
  }

  /**
   * Resuelve de forma determinística y semánticamente segura la política efectiva.
   * CERO DEFAULTS SILENCIOSOS PARA ORGANIZACIONES REALES.
   */
  public async resolveEffectivePolicy(options: {
    organizationId: string;
    lenderId?: string;
    isDemoMode?: boolean;
  }): Promise<PolicyResolutionResult> {
    const { organizationId, lenderId, isDemoMode } = options;

    if (!organizationId) {
      return {
        status: 'POLICY_RESOLUTION_ERROR',
        errorCode: 'MISSING_ORGANIZATION_ID',
        message: 'No se especificó organizationId para resolver la política de underwriting.',
      };
    }

    // Modo demo estricto (explícito o tenant demo canónico)
    const isExplicitDemo = isDemoMode === true || organizationId === 'd0000000-0000-0000-0000-000000000001';
    if (isExplicitDemo) {
      return {
        status: 'DEMO_POLICY',
        policy: { ...CANONICAL_DEMO_POLICY, organizationId },
      };
    }

    try {
      // 1. Consultar política de la Organización
      let orgPolicy: Partial<EffectiveUnderwritingPolicy> | null = null;
      const { data: orgData, error: orgErr } = await this.repository.findActiveOrgPolicy(organizationId);

      if (orgErr) {
        return {
          status: 'POLICY_DATA_ERROR',
          errorCode: 'DB_ERROR_FETCH_ORG_POLICY',
          message: `Error al consultar la política de la organización: ${orgErr.message}`,
        };
      }

      if (orgData) {
        orgPolicy = {
          maxLtv: orgData.max_ltv !== null && orgData.max_ltv !== undefined ? Number(orgData.max_ltv) : undefined,
          minLtv: orgData.min_ltv !== null && orgData.min_ltv !== undefined ? Number(orgData.min_ltv) : undefined,
          minLoanAmount: orgData.min_loan_amount !== null && orgData.min_loan_amount !== undefined ? Number(orgData.min_loan_amount) : undefined,
          maxLoanAmount: orgData.max_loan_amount !== null && orgData.max_loan_amount !== undefined ? Number(orgData.max_loan_amount) : undefined,
          minTermMonths: orgData.min_term_months !== null && orgData.min_term_months !== undefined ? Number(orgData.min_term_months) : undefined,
          maxTermMonths: orgData.max_term_months !== null && orgData.max_term_months !== undefined ? Number(orgData.max_term_months) : undefined,
          acceptedPropertyTypes: orgData.accepted_property_types || undefined,
          acceptedDepartments: orgData.accepted_departments || undefined,
          acceptedCurrencies: orgData.accepted_currencies || undefined,
          requiresIncomeProof: orgData.requires_income_proof !== null && orgData.requires_income_proof !== undefined ? Boolean(orgData.requires_income_proof) : undefined,
          acceptedIncomeTypes: orgData.accepted_income_types || undefined,
          minimumIncomeMonthly: orgData.minimum_income_monthly !== null && orgData.minimum_income_monthly !== undefined ? Number(orgData.minimum_income_monthly) : undefined,
          acceptsClearing: orgData.accepts_clearing !== null && orgData.accepts_clearing !== undefined ? Boolean(orgData.accepts_clearing) : undefined,
          maxDtiRatio: orgData.max_dti_ratio !== null && orgData.max_dti_ratio !== undefined ? Number(orgData.max_dti_ratio) : undefined,
          maxBorrowerAgeAtMaturity: orgData.max_borrower_age_at_maturity !== null && orgData.max_borrower_age_at_maturity !== undefined ? Number(orgData.max_borrower_age_at_maturity) : undefined,
          defaultInterestRateAnnual: orgData.default_interest_rate_annual !== null && orgData.default_interest_rate_annual !== undefined ? Number(orgData.default_interest_rate_annual) : undefined,
        };
      }

      // 2. Consultar reglas específicas de Inversor / Prestamista si fue provisto
      let lenderPolicy: Partial<EffectiveUnderwritingPolicy> | null = null;
      let effectiveLenderId = lenderId;

      if (effectiveLenderId) {
        const { data: lRules, error: lrErr } = await this.repository.findLenderRules(organizationId, effectiveLenderId);

        if (lrErr) {
          return {
            status: 'POLICY_DATA_ERROR',
            errorCode: 'DB_ERROR_FETCH_LENDER_RULES',
            message: `Error al consultar las reglas del inversor: ${lrErr.message}`,
          };
        }

        if (!lRules) {
          return {
            status: 'NO_COMPATIBLE_POLICY',
            reasons: ['LENDER_NOT_FOUND_OR_CROSS_TENANT_DENIED'],
          };
        }

        if (lRules.lender && lRules.lender.status && lRules.lender.status !== 'active') {
          return {
            status: 'LENDER_INACTIVE',
            message: `El inversor ${effectiveLenderId} está en estado '${lRules.lender.status}' y no puede operar.`,
          };
        }

        let normalizedLtv: number | undefined;
        if (lRules.max_ltv !== null && lRules.max_ltv !== undefined) {
          const rawLtv = Number(lRules.max_ltv);
          normalizedLtv = rawLtv <= 1.0 && rawLtv > 0 ? Number((rawLtv * 100).toFixed(2)) : rawLtv;
        }

        lenderPolicy = {
          maxLtv: normalizedLtv,
          minLoanAmount: lRules.min_loan !== null && lRules.min_loan !== undefined ? Number(lRules.min_loan) : undefined,
          maxLoanAmount: lRules.max_loan !== null && lRules.max_loan !== undefined ? Number(lRules.max_loan) : undefined,
          minTermMonths: lRules.min_term_months !== null && lRules.min_term_months !== undefined ? Number(lRules.min_term_months) : undefined,
          maxTermMonths: lRules.max_term_months !== null && lRules.max_term_months !== undefined ? Number(lRules.max_term_months) : undefined,
          acceptedPropertyTypes: lRules.accepted_property_types || undefined,
          acceptedDepartments: lRules.accepted_departments || undefined,
          acceptedCurrencies: lRules.accepted_currencies || undefined,
          requiresIncomeProof: lRules.requires_income_proof !== null && lRules.requires_income_proof !== undefined ? Boolean(lRules.requires_income_proof) : undefined,
          acceptsClearing: lRules.accepts_clearing !== null && lRules.accepts_clearing !== undefined ? Boolean(lRules.accepts_clearing) : undefined,
        };
      }

      // Si no existe política en la organización ni en lender
      if (!orgPolicy && !lenderPolicy) {
        return {
          status: 'POLICY_NOT_CONFIGURED',
          message: `La organización ${organizationId} no tiene ninguna política de underwriting configurada en el sistema.`,
        };
      }

      // 3. Resolución de Campos Mandatorios
      // maxLtv es MANDATORIO para análisis crediticio
      let resolvedMaxLtv: number | undefined;
      if (orgPolicy?.maxLtv !== undefined && lenderPolicy?.maxLtv !== undefined) {
        resolvedMaxLtv = Math.min(orgPolicy.maxLtv, lenderPolicy.maxLtv);
      } else if (lenderPolicy?.maxLtv !== undefined) {
        resolvedMaxLtv = lenderPolicy.maxLtv;
      } else if (orgPolicy?.maxLtv !== undefined) {
        resolvedMaxLtv = orgPolicy.maxLtv;
      }

      if (resolvedMaxLtv === undefined || isNaN(resolvedMaxLtv) || resolvedMaxLtv <= 0) {
        return {
          status: 'POLICY_INCOMPLETE',
          missingFields: ['maxLtv'],
          message: `La política para la organización ${organizationId} está incompleta: falta definir 'maxLtv' mandatorio.`,
        };
      }

      const incompatibilityReasons: string[] = [];

      // A. Montos: Cap (MIN) y Floor (MAX) - Cero defaults
      let resolvedMaxLoan: number | undefined;
      if (orgPolicy?.maxLoanAmount !== undefined && lenderPolicy?.maxLoanAmount !== undefined) {
        resolvedMaxLoan = Math.min(orgPolicy.maxLoanAmount, lenderPolicy.maxLoanAmount);
      } else if (lenderPolicy?.maxLoanAmount !== undefined) {
        resolvedMaxLoan = lenderPolicy.maxLoanAmount;
      } else if (orgPolicy?.maxLoanAmount !== undefined) {
        resolvedMaxLoan = orgPolicy.maxLoanAmount;
      }

      let resolvedMinLoan: number | undefined;
      if (orgPolicy?.minLoanAmount !== undefined && lenderPolicy?.minLoanAmount !== undefined) {
        resolvedMinLoan = Math.max(orgPolicy.minLoanAmount, lenderPolicy.minLoanAmount);
      } else if (lenderPolicy?.minLoanAmount !== undefined) {
        resolvedMinLoan = lenderPolicy.minLoanAmount;
      } else if (orgPolicy?.minLoanAmount !== undefined) {
        resolvedMinLoan = orgPolicy.minLoanAmount;
      }

      if (resolvedMinLoan !== undefined && resolvedMaxLoan !== undefined && resolvedMinLoan > resolvedMaxLoan) {
        incompatibilityReasons.push(`LOAN_RANGE_EMPTY: minLoanAmount (${resolvedMinLoan}) supera maxLoanAmount (${resolvedMaxLoan}) resultante.`);
      }

      // B. Plazos: Acotamiento sin invención de defaults
      let resolvedMinTerm: number | undefined;
      if (orgPolicy?.minTermMonths !== undefined && lenderPolicy?.minTermMonths !== undefined) {
        resolvedMinTerm = Math.max(orgPolicy.minTermMonths, lenderPolicy.minTermMonths);
      } else if (lenderPolicy?.minTermMonths !== undefined) {
        resolvedMinTerm = lenderPolicy.minTermMonths;
      } else if (orgPolicy?.minTermMonths !== undefined) {
        resolvedMinTerm = orgPolicy.minTermMonths;
      }

      let resolvedMaxTerm: number | undefined;
      if (orgPolicy?.maxTermMonths !== undefined && lenderPolicy?.maxTermMonths !== undefined) {
        resolvedMaxTerm = Math.min(orgPolicy.maxTermMonths, lenderPolicy.maxTermMonths);
      } else if (lenderPolicy?.maxTermMonths !== undefined) {
        resolvedMaxTerm = lenderPolicy.maxTermMonths;
      } else if (orgPolicy?.maxTermMonths !== undefined) {
        resolvedMaxTerm = orgPolicy.maxTermMonths;
      }

      if (resolvedMinTerm !== undefined && resolvedMaxTerm !== undefined && resolvedMinTerm > resolvedMaxTerm) {
        incompatibilityReasons.push(`TERM_RANGE_EMPTY: minTermMonths (${resolvedMinTerm}) supera maxTermMonths (${resolvedMaxTerm}) resultante.`);
      }

      // C. Intersección de Listas con Wildcards
      const propTypesInt = resolveListIntersection(orgPolicy?.acceptedPropertyTypes, lenderPolicy?.acceptedPropertyTypes);
      if (propTypesInt.empty) {
        incompatibilityReasons.push('PROPERTY_TYPE_INTERSECTION_EMPTY: Sin tipos de propiedad en común.');
      }

      const depInt = resolveListIntersection(orgPolicy?.acceptedDepartments, lenderPolicy?.acceptedDepartments);
      if (depInt.empty) {
        incompatibilityReasons.push('DEPARTMENT_INTERSECTION_EMPTY: Sin departamentos en común.');
      }

      const currInt = resolveListIntersection(orgPolicy?.acceptedCurrencies, lenderPolicy?.acceptedCurrencies);
      if (currInt.empty) {
        incompatibilityReasons.push('CURRENCY_INTERSECTION_EMPTY: Sin monedas en común.');
      }

      if (incompatibilityReasons.length > 0) {
        return {
          status: 'NO_COMPATIBLE_POLICY',
          reasons: incompatibilityReasons,
        };
      }

      // D. Comportamiento Booleano y Opcionales
      let resolvedIncomeProof: boolean | undefined;
      if (orgPolicy?.requiresIncomeProof !== undefined || lenderPolicy?.requiresIncomeProof !== undefined) {
        resolvedIncomeProof = orgPolicy?.requiresIncomeProof === true || lenderPolicy?.requiresIncomeProof === true;
      }

      let resolvedClearing: boolean | undefined;
      if (orgPolicy?.acceptsClearing === false) {
        resolvedClearing = false;
      } else if (lenderPolicy?.acceptsClearing !== undefined) {
        resolvedClearing = lenderPolicy.acceptsClearing;
      } else if (orgPolicy?.acceptsClearing !== undefined) {
        resolvedClearing = orgPolicy.acceptsClearing;
      }

      const source: EffectiveUnderwritingPolicy['source'] =
        orgPolicy && lenderPolicy
          ? 'organization_and_lender'
          : lenderPolicy
          ? 'lender'
          : 'organization';

      const effective: EffectiveUnderwritingPolicy = {
        organizationId,
        lenderId: effectiveLenderId,
        source,
        maxLtv: resolvedMaxLtv,
        minLtv: orgPolicy?.minLtv,
        minLoanAmount: resolvedMinLoan,
        maxLoanAmount: resolvedMaxLoan,
        minTermMonths: resolvedMinTerm,
        maxTermMonths: resolvedMaxTerm,
        acceptedPropertyTypes: propTypesInt.result,
        acceptedDepartments: depInt.result,
        acceptedCurrencies: currInt.result,
        requiresIncomeProof: resolvedIncomeProof,
        acceptedIncomeTypes: orgPolicy?.acceptedIncomeTypes,
        minimumIncomeMonthly: orgPolicy?.minimumIncomeMonthly,
        acceptsClearing: resolvedClearing,
        maxDtiRatio: orgPolicy?.maxDtiRatio,
        maxBorrowerAgeAtMaturity: orgPolicy?.maxBorrowerAgeAtMaturity,
        defaultInterestRateAnnual: orgPolicy?.defaultInterestRateAnnual,
        isDynamic: true,
      };

      return {
        status: 'RESOLVED',
        policy: effective,
      };
    } catch (err: any) {
      return {
        status: 'POLICY_RESOLUTION_ERROR',
        errorCode: 'UNEXPECTED_RESOLVER_EXCEPTION',
        message: err?.message || 'Excepción no controlada durante la resolución de política.',
      };
    }
  }
}

export const underwritingPolicyResolver = UnderwritingPolicyResolver.getInstance();

