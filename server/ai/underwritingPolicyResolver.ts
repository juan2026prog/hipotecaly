// ==============================================================================
// HIPOTECALY: Multi-Tenant Underwriting Policy Resolver (Server-Side)
// Resuelve determinísticamente la política crediticia efectiva:
// Organization Policy -> Lender Rules -> Effective Underwriting Policy
// ==============================================================================

import { supabaseAdmin } from '../supabase.js';

export interface ResolvedUnderwritingPolicy {
  organizationId: string;
  lenderId?: string;
  source: 'organization' | 'lender' | 'organization_and_lender' | 'pilot_fallback';
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

export const PILOT_FALLBACK_POLICY: ResolvedUnderwritingPolicy = {
  organizationId: 'd0000000-0000-0000-0000-000000000001',
  source: 'pilot_fallback',
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
   * Resuelve de forma determinística y aislada la política efectiva para una organización y opcionalmente un prestamista/inversor específico.
   */
  public async resolveEffectivePolicy(options: {
    organizationId: string;
    lenderId?: string;
  }): Promise<ResolvedUnderwritingPolicy> {
    const { organizationId, lenderId } = options;

    if (!organizationId) {
      return { ...PILOT_FALLBACK_POLICY };
    }

    try {
      // 1. Consultar si existe política explícita de la Organización
      let orgPolicy: Partial<ResolvedUnderwritingPolicy> | null = null;
      const { data: orgData, error: orgErr } = await supabaseAdmin
        .from('organization_underwriting_policies')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle();

      if (!orgErr && orgData) {
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

      // 2. Consultar reglas específicas de Inversor / Prestamista si se indicó o si hay inversores de la organización
      let lenderPolicy: Partial<ResolvedUnderwritingPolicy> | null = null;
      let effectiveLenderId = lenderId;

      if (effectiveLenderId) {
        const { data: lRules, error: lrErr } = await supabaseAdmin
          .from('lender_rules')
          .select('*, lender:lenders!inner(organization_id, status)')
          .eq('lender_id', effectiveLenderId)
          .eq('lenders.organization_id', organizationId)
          .maybeSingle();

        if (!lrErr && lRules) {
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
      }

      // 3. Precedencia: Lender Rule acota o define límites sobre la base de la Organización
      const source: ResolvedUnderwritingPolicy['source'] =
        orgPolicy && lenderPolicy
          ? 'organization_and_lender'
          : lenderPolicy
          ? 'lender'
          : orgPolicy
          ? 'organization'
          : 'pilot_fallback';

      const resolved: ResolvedUnderwritingPolicy = {
        organizationId,
        lenderId: effectiveLenderId,
        source,
        maxLtv: lenderPolicy?.maxLtv ?? orgPolicy?.maxLtv ?? PILOT_FALLBACK_POLICY.maxLtv,
        minLtv: orgPolicy?.minLtv ?? PILOT_FALLBACK_POLICY.minLtv,
        minLoanAmount: lenderPolicy?.minLoanAmount ?? orgPolicy?.minLoanAmount ?? PILOT_FALLBACK_POLICY.minLoanAmount,
        maxLoanAmount: lenderPolicy?.maxLoanAmount ?? orgPolicy?.maxLoanAmount ?? PILOT_FALLBACK_POLICY.maxLoanAmount,
        minTermMonths: lenderPolicy?.minTermMonths ?? orgPolicy?.minTermMonths ?? PILOT_FALLBACK_POLICY.minTermMonths,
        maxTermMonths: lenderPolicy?.maxTermMonths ?? orgPolicy?.maxTermMonths ?? PILOT_FALLBACK_POLICY.maxTermMonths,
        acceptedPropertyTypes:
          lenderPolicy?.acceptedPropertyTypes ?? orgPolicy?.acceptedPropertyTypes ?? PILOT_FALLBACK_POLICY.acceptedPropertyTypes,
        acceptedDepartments:
          lenderPolicy?.acceptedDepartments ?? orgPolicy?.acceptedDepartments ?? PILOT_FALLBACK_POLICY.acceptedDepartments,
        acceptedCurrencies:
          lenderPolicy?.acceptedCurrencies ?? orgPolicy?.acceptedCurrencies ?? PILOT_FALLBACK_POLICY.acceptedCurrencies,
        requiresIncomeProof:
          lenderPolicy?.requiresIncomeProof ?? orgPolicy?.requiresIncomeProof ?? PILOT_FALLBACK_POLICY.requiresIncomeProof,
        acceptedIncomeTypes:
          orgPolicy?.acceptedIncomeTypes ?? PILOT_FALLBACK_POLICY.acceptedIncomeTypes,
        minimumIncomeMonthly:
          orgPolicy?.minimumIncomeMonthly ?? PILOT_FALLBACK_POLICY.minimumIncomeMonthly,
        acceptsClearing:
          lenderPolicy?.acceptsClearing ?? orgPolicy?.acceptsClearing ?? PILOT_FALLBACK_POLICY.acceptsClearing,
        maxDtiRatio:
          orgPolicy?.maxDtiRatio ?? PILOT_FALLBACK_POLICY.maxDtiRatio,
        maxBorrowerAgeAtMaturity:
          orgPolicy?.maxBorrowerAgeAtMaturity ?? PILOT_FALLBACK_POLICY.maxBorrowerAgeAtMaturity,
        defaultInterestRateAnnual:
          orgPolicy?.defaultInterestRateAnnual ?? PILOT_FALLBACK_POLICY.defaultInterestRateAnnual,
        isDynamic: Boolean(orgPolicy || lenderPolicy),
      };

      return resolved;
    } catch {
      return { ...PILOT_FALLBACK_POLICY, organizationId };
    }
  }
}

export const underwritingPolicyResolver = UnderwritingPolicyResolver.getInstance();
