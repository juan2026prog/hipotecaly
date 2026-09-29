// ==============================================================================
// HIPOTECALY: Multi-Tenant Underwriting Policy Resolver (Server-Side)
// Resuelve determinísticamente la política crediticia efectiva:
// Organization Policy (Límites absolutos y defaults) + Lender Rules (Criterios de Inversor)
// Regla Semántica: Un lender NUNCA puede relajar un límite absoluto de la Organización.
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
   * Resuelve de forma determinística y semánticamente segura la política efectiva.
   * SEMÁNTICA DE RESOLUCIÓN:
   * 1. Límites Absolutos (Cap): El maxLtv efectivo es MIN(Org.maxLtv, Lender.maxLtv). Un lender jamás relaja el tope de la organización.
   * 2. Monto Máximo (Cap): MIN(Org.maxLoanAmount, Lender.maxLoanAmount).
   * 3. Monto Mínimo (Floor): MAX(Org.minLoanAmount, Lender.minLoanAmount).
   * 4. Plazos: Rango acotado [MAX(Org.minTerm, Lender.minTerm), MIN(Org.maxTerm, Lender.maxTerm)].
   * 5. Tipos de Propiedad y Departamentos: Intersección (ambos deben aceptar el criterio).
   * 6. Clearing / Ingresos: Si la Organización exige comprobante de ingresos o rechaza clearing, el Lender no puede violar esa restricción.
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
      // 1. Consultar política de la Organización
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

      // 2. Consultar reglas específicas de Inversor / Prestamista
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

      const source: ResolvedUnderwritingPolicy['source'] =
        orgPolicy && lenderPolicy
          ? 'organization_and_lender'
          : lenderPolicy
          ? 'lender'
          : orgPolicy
          ? 'organization'
          : 'pilot_fallback';

      // 3. Resolución Semántica Estricta:
      // A. Max LTV: Si ambos existen, el lender sólo puede restringir (mínimo entre ambos)
      let resolvedMaxLtv = PILOT_FALLBACK_POLICY.maxLtv;
      if (orgPolicy?.maxLtv !== undefined && lenderPolicy?.maxLtv !== undefined) {
        resolvedMaxLtv = Math.min(orgPolicy.maxLtv, lenderPolicy.maxLtv);
      } else if (lenderPolicy?.maxLtv !== undefined) {
        resolvedMaxLtv = lenderPolicy.maxLtv;
      } else if (orgPolicy?.maxLtv !== undefined) {
        resolvedMaxLtv = orgPolicy.maxLtv;
      }

      // B. Monto Máximo: Mínimo entre ambos
      let resolvedMaxLoan = PILOT_FALLBACK_POLICY.maxLoanAmount;
      if (orgPolicy?.maxLoanAmount !== undefined && lenderPolicy?.maxLoanAmount !== undefined) {
        resolvedMaxLoan = Math.min(orgPolicy.maxLoanAmount, lenderPolicy.maxLoanAmount);
      } else if (lenderPolicy?.maxLoanAmount !== undefined) {
        resolvedMaxLoan = lenderPolicy.maxLoanAmount;
      } else if (orgPolicy?.maxLoanAmount !== undefined) {
        resolvedMaxLoan = orgPolicy.maxLoanAmount;
      }

      // C. Monto Mínimo: Máximo entre ambos
      let resolvedMinLoan = PILOT_FALLBACK_POLICY.minLoanAmount;
      if (orgPolicy?.minLoanAmount !== undefined && lenderPolicy?.minLoanAmount !== undefined) {
        resolvedMinLoan = Math.max(orgPolicy.minLoanAmount, lenderPolicy.minLoanAmount);
      } else if (lenderPolicy?.minLoanAmount !== undefined) {
        resolvedMinLoan = lenderPolicy.minLoanAmount;
      } else if (orgPolicy?.minLoanAmount !== undefined) {
        resolvedMinLoan = orgPolicy.minLoanAmount;
      }

      // D. Plazos: Acotamiento estricto
      const minTerm = Math.max(
        orgPolicy?.minTermMonths ?? PILOT_FALLBACK_POLICY.minTermMonths,
        lenderPolicy?.minTermMonths ?? PILOT_FALLBACK_POLICY.minTermMonths
      );
      const maxTerm = Math.min(
        orgPolicy?.maxTermMonths ?? PILOT_FALLBACK_POLICY.maxTermMonths,
        lenderPolicy?.maxTermMonths ?? PILOT_FALLBACK_POLICY.maxTermMonths
      );

      // E. Propiedades y Departamentos: Intersección si ambos especifican
      let resolvedPropertyTypes = orgPolicy?.acceptedPropertyTypes ?? lenderPolicy?.acceptedPropertyTypes ?? PILOT_FALLBACK_POLICY.acceptedPropertyTypes;
      if (orgPolicy?.acceptedPropertyTypes && lenderPolicy?.acceptedPropertyTypes) {
        const lenderSet = new Set(lenderPolicy.acceptedPropertyTypes.map((t) => t.toLowerCase()));
        resolvedPropertyTypes = orgPolicy.acceptedPropertyTypes.filter((t) => lenderSet.has(t.toLowerCase()));
        if (resolvedPropertyTypes.length === 0) {
          resolvedPropertyTypes = lenderPolicy.acceptedPropertyTypes;
        }
      }

      let resolvedDepartments = orgPolicy?.acceptedDepartments ?? lenderPolicy?.acceptedDepartments ?? PILOT_FALLBACK_POLICY.acceptedDepartments;
      if (orgPolicy?.acceptedDepartments && lenderPolicy?.acceptedDepartments) {
        if (!orgPolicy.acceptedDepartments.includes('Todos') && !lenderPolicy.acceptedDepartments.includes('Todos')) {
          const lenderDepSet = new Set(lenderPolicy.acceptedDepartments.map((d) => d.toLowerCase()));
          resolvedDepartments = orgPolicy.acceptedDepartments.filter((d) => lenderDepSet.has(d.toLowerCase()));
        } else {
          resolvedDepartments = orgPolicy.acceptedDepartments.includes('Todos') ? lenderPolicy.acceptedDepartments : orgPolicy.acceptedDepartments;
        }
      }

      // F. Requisitos Estrictos: Si la Organización exige comprobante de ingresos, prevalece
      const resolvedIncomeProof = orgPolicy?.requiresIncomeProof === true || lenderPolicy?.requiresIncomeProof === true;
      // Si la Organización no acepta clearing, el lender no puede aceptarlo
      const resolvedClearing = orgPolicy?.acceptsClearing === false ? false : (lenderPolicy?.acceptsClearing ?? orgPolicy?.acceptsClearing ?? true);

      const resolved: ResolvedUnderwritingPolicy = {
        organizationId,
        lenderId: effectiveLenderId,
        source,
        maxLtv: resolvedMaxLtv,
        minLtv: orgPolicy?.minLtv ?? PILOT_FALLBACK_POLICY.minLtv,
        minLoanAmount: resolvedMinLoan,
        maxLoanAmount: resolvedMaxLoan,
        minTermMonths: minTerm,
        maxTermMonths: maxTerm,
        acceptedPropertyTypes: resolvedPropertyTypes,
        acceptedDepartments: resolvedDepartments,
        acceptedCurrencies: lenderPolicy?.acceptedCurrencies ?? orgPolicy?.acceptedCurrencies ?? PILOT_FALLBACK_POLICY.acceptedCurrencies,
        requiresIncomeProof: resolvedIncomeProof,
        acceptedIncomeTypes: orgPolicy?.acceptedIncomeTypes ?? PILOT_FALLBACK_POLICY.acceptedIncomeTypes,
        minimumIncomeMonthly: orgPolicy?.minimumIncomeMonthly ?? PILOT_FALLBACK_POLICY.minimumIncomeMonthly,
        acceptsClearing: resolvedClearing,
        maxDtiRatio: orgPolicy?.maxDtiRatio ?? PILOT_FALLBACK_POLICY.maxDtiRatio,
        maxBorrowerAgeAtMaturity: orgPolicy?.maxBorrowerAgeAtMaturity ?? PILOT_FALLBACK_POLICY.maxBorrowerAgeAtMaturity,
        defaultInterestRateAnnual: orgPolicy?.defaultInterestRateAnnual ?? PILOT_FALLBACK_POLICY.defaultInterestRateAnnual,
        isDynamic: Boolean(orgPolicy || lenderPolicy),
      };

      return resolved;
    } catch {
      return { ...PILOT_FALLBACK_POLICY, organizationId };
    }
  }
}

export const underwritingPolicyResolver = UnderwritingPolicyResolver.getInstance();
