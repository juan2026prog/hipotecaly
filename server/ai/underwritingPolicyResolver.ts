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
  minLoanAmount: number; // USD 10.000
  maxLoanAmount: number; // USD 200.000
  minTermMonths: number; // 12
  maxTermMonths: number; // 60
  acceptedPropertyTypes: string[];
  acceptedDepartments: string[];
  acceptedCurrencies: string[];
  requiresIncomeProof: boolean;
  acceptedIncomeTypes: string[];
  minimumIncomeMonthly: number;
  acceptsClearing: boolean;
  maxDtiRatio?: number; // Por ej. 35.0%
  maxBorrowerAgeAtMaturity?: number; // Por ej. 75 años
  defaultInterestRateAnnual: number; // Por ej. 11.5%
  isDynamic: boolean;
}

export type PolicyResolutionResult =
  | { status: 'RESOLVED'; policy: EffectiveUnderwritingPolicy }
  | { status: 'DEMO_POLICY'; policy: EffectiveUnderwritingPolicy }
  | { status: 'POLICY_NOT_CONFIGURED'; message: string }
  | { status: 'NO_COMPATIBLE_POLICY'; reasons: string[] }
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
): { empty: boolean; result: string[] } {
  if (!listA && !listB) return { empty: false, result: [] };
  if (!listA || listA.length === 0 || isWildcard(listA)) {
    return { empty: false, result: listB || [] };
  }
  if (!listB || listB.length === 0 || isWildcard(listB)) {
    return { empty: false, result: listA || [] };
  }

  const setB = new Set(listB.map((item) => item.trim().toLowerCase()));
  const intersection = listA.filter((item) => setB.has(item.trim().toLowerCase()));

  return {
    empty: intersection.length === 0,
    result: intersection,
  };
}

export class UnderwritingPolicyResolver {
  private static instance: UnderwritingPolicyResolver;

  private constructor() {}

  public static getInstance(): UnderwritingPolicyResolver {
    if (!UnderwritingPolicyResolver.instance) {
      UnderwritingPolicyResolver.instance = new UnderwritingPolicyResolver();
    }
    return UnderwritingPolicyResolver.instance;
  }

  /**
   * Resuelve de forma determinística y semánticamente segura la política efectiva.
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

    // Si es modo demo explícito o tenant demo canónico
    if (isDemoMode || organizationId === 'd0000000-0000-0000-0000-000000000001' || organizationId.includes('demo')) {
      return {
        status: 'DEMO_POLICY',
        policy: { ...CANONICAL_DEMO_POLICY, organizationId },
      };
    }

    try {
      // 1. Consultar política de la Organización
      let orgPolicy: Partial<EffectiveUnderwritingPolicy> | null = null;
      const { data: orgData, error: orgErr } = await supabaseAdmin
        .from('organization_underwriting_policies')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();

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
          minLoanAmount: orgData.min_loan_amount !== null ? Number(orgData.min_loan_amount) : undefined,
          maxLoanAmount: orgData.max_loan_amount !== null ? Number(orgData.max_loan_amount) : undefined,
          minTermMonths: orgData.min_term_months !== null ? Number(orgData.min_term_months) : undefined,
          maxTermMonths: orgData.max_term_months !== null ? Number(orgData.max_term_months) : undefined,
          acceptedPropertyTypes: orgData.accepted_property_types || undefined,
          acceptedDepartments: orgData.accepted_departments || undefined,
          acceptedCurrencies: orgData.accepted_currencies || undefined,
          requiresIncomeProof: orgData.requires_income_proof !== null ? Boolean(orgData.requires_income_proof) : undefined,
          acceptedIncomeTypes: orgData.accepted_income_types || undefined,
          minimumIncomeMonthly: orgData.minimum_income_monthly !== null ? Number(orgData.minimum_income_monthly) : undefined,
          acceptsClearing: orgData.accepts_clearing !== null ? Boolean(orgData.accepts_clearing) : undefined,
          maxDtiRatio: orgData.max_dti_ratio !== null ? Number(orgData.max_dti_ratio) : undefined,
          maxBorrowerAgeAtMaturity: orgData.max_borrower_age_at_maturity !== null ? Number(orgData.max_borrower_age_at_maturity) : undefined,
          defaultInterestRateAnnual: orgData.default_interest_rate_annual !== null ? Number(orgData.default_interest_rate_annual) : undefined,
        };
      }

      // 2. Consultar reglas específicas de Inversor / Prestamista
      let lenderPolicy: Partial<EffectiveUnderwritingPolicy> | null = null;
      let effectiveLenderId = lenderId;

      if (effectiveLenderId) {
        const { data: lRules, error: lrErr } = await supabaseAdmin
          .from('lender_rules')
          .select('*, lender:lenders!inner(organization_id, status)')
          .eq('lender_id', effectiveLenderId)
          .eq('lenders.organization_id', organizationId)
          .maybeSingle();

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

        const rawLtv = Number(lRules.max_ltv);
        const normalizedLtv = rawLtv <= 1.0 && rawLtv > 0 ? Number((rawLtv * 100).toFixed(2)) : rawLtv;

        lenderPolicy = {
          maxLtv: normalizedLtv || undefined,
          minLoanAmount: lRules.min_loan !== null ? Number(lRules.min_loan) : undefined,
          maxLoanAmount: lRules.max_loan !== null ? Number(lRules.max_loan) : undefined,
          minTermMonths: lRules.min_term_months !== null ? Number(lRules.min_term_months) : undefined,
          maxTermMonths: lRules.max_term_months !== null ? Number(lRules.max_term_months) : undefined,
          acceptedPropertyTypes: lRules.accepted_property_types || undefined,
          acceptedDepartments: lRules.accepted_departments || undefined,
          acceptedCurrencies: lRules.accepted_currencies || undefined,
          requiresIncomeProof: lRules.requires_income_proof !== null ? Boolean(lRules.requires_income_proof) : undefined,
          acceptsClearing: lRules.accepts_clearing !== null ? Boolean(lRules.accepts_clearing) : undefined,
        };
      }

      // Si no existe política en la organización ni lender
      if (!orgPolicy && !lenderPolicy) {
        return {
          status: 'POLICY_NOT_CONFIGURED',
          message: `La organización ${organizationId} no tiene ninguna política de underwriting configurada en el sistema.`,
        };
      }

      const incompatibilityReasons: string[] = [];

      // A. Max LTV: Semántica de Cap (MIN)
      let resolvedMaxLtv = 50.0;
      if (orgPolicy?.maxLtv !== undefined && lenderPolicy?.maxLtv !== undefined) {
        resolvedMaxLtv = Math.min(orgPolicy.maxLtv, lenderPolicy.maxLtv);
      } else if (lenderPolicy?.maxLtv !== undefined) {
        resolvedMaxLtv = lenderPolicy.maxLtv;
      } else if (orgPolicy?.maxLtv !== undefined) {
        resolvedMaxLtv = orgPolicy.maxLtv;
      }

      // B. Montos: Cap (MIN) y Floor (MAX)
      let resolvedMaxLoan = 200000;
      if (orgPolicy?.maxLoanAmount !== undefined && lenderPolicy?.maxLoanAmount !== undefined) {
        resolvedMaxLoan = Math.min(orgPolicy.maxLoanAmount, lenderPolicy.maxLoanAmount);
      } else if (lenderPolicy?.maxLoanAmount !== undefined) {
        resolvedMaxLoan = lenderPolicy.maxLoanAmount;
      } else if (orgPolicy?.maxLoanAmount !== undefined) {
        resolvedMaxLoan = orgPolicy.maxLoanAmount;
      }

      let resolvedMinLoan = 10000;
      if (orgPolicy?.minLoanAmount !== undefined && lenderPolicy?.minLoanAmount !== undefined) {
        resolvedMinLoan = Math.max(orgPolicy.minLoanAmount, lenderPolicy.minLoanAmount);
      } else if (lenderPolicy?.minLoanAmount !== undefined) {
        resolvedMinLoan = lenderPolicy.minLoanAmount;
      } else if (orgPolicy?.minLoanAmount !== undefined) {
        resolvedMinLoan = orgPolicy.minLoanAmount;
      }

      if (resolvedMinLoan > resolvedMaxLoan) {
        incompatibilityReasons.push('LOAN_RANGE_EMPTY: minLoanAmount supera maxLoanAmount resultante.');
      }

      // C. Plazos: Acotamiento
      const minTerm = Math.max(orgPolicy?.minTermMonths ?? 12, lenderPolicy?.minTermMonths ?? 12);
      const maxTerm = Math.min(orgPolicy?.maxTermMonths ?? 60, lenderPolicy?.maxTermMonths ?? 60);

      if (minTerm > maxTerm) {
        incompatibilityReasons.push('TERM_RANGE_EMPTY: minTermMonths supera maxTermMonths resultante.');
      }

      // D. Intersección de Listas con Wildcards
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

      const resolvedIncomeProof = orgPolicy?.requiresIncomeProof === true || lenderPolicy?.requiresIncomeProof === true;
      const resolvedClearing = orgPolicy?.acceptsClearing === false ? false : (lenderPolicy?.acceptsClearing ?? orgPolicy?.acceptsClearing ?? true);

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
        minLtv: orgPolicy?.minLtv ?? 5.0,
        minLoanAmount: resolvedMinLoan,
        maxLoanAmount: resolvedMaxLoan,
        minTermMonths: minTerm,
        maxTermMonths: maxTerm,
        acceptedPropertyTypes: propTypesInt.result.length > 0 ? propTypesInt.result : ['casa', 'apartamento'],
        acceptedDepartments: depInt.result.length > 0 ? depInt.result : ['Todos'],
        acceptedCurrencies: currInt.result.length > 0 ? currInt.result : ['USD'],
        requiresIncomeProof: resolvedIncomeProof,
        acceptedIncomeTypes: orgPolicy?.acceptedIncomeTypes ?? ['dependiente', 'independiente'],
        minimumIncomeMonthly: orgPolicy?.minimumIncomeMonthly ?? 0,
        acceptsClearing: resolvedClearing,
        maxDtiRatio: orgPolicy?.maxDtiRatio ?? 35.0,
        maxBorrowerAgeAtMaturity: orgPolicy?.maxBorrowerAgeAtMaturity ?? 75,
        defaultInterestRateAnnual: orgPolicy?.defaultInterestRateAnnual ?? 11.5,
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
