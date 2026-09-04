// ==============================================================================
// HIPOTECALY AI: Underwriting Agent (Motor Híbrido: Reglas Determinísticas + IA)
// ==============================================================================

import { UnderwritingOutput } from '../types';

export interface UnderwritingPolicyConfig {
  maxLtv: number; // Por ej. 40.0% o 50.0%
  maxLoanAmount: number;
  minLoanAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  acceptedPropertyTypes: string[];
  acceptedDepartments: string[];
  defaultInterestRateAnnual: number; // Por ej. 11.5%
  allowOfflineAnalysis?: boolean;
}

export const DEFAULT_PILOT_UNDERWRITING_POLICY: UnderwritingPolicyConfig = {
  maxLtv: 40.0, // 40%
  maxLoanAmount: 200000,
  minLoanAmount: 10000,
  minTermMonths: 12,
  maxTermMonths: 60,
  acceptedPropertyTypes: ['casa', 'apartamento', 'local_comercial', 'terreno', 'campo'],
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
  defaultInterestRateAnnual: 11.5,
};

export class UnderwritingAgent {
  /**
   * Ejecuta el análisis de underwriting determinístico estricto por código.
   * La IA no inventa los números ni los cálculos financieros.
   */
  public evaluateUnderwriting(
    requestedAmount: number,
    marketPropertyValue: number,
    conservativePropertyValue: number,
    termMonths: number,
    propertyType: string,
    _department: string,
    monthlyIncome?: number,
    policy: UnderwritingPolicyConfig = DEFAULT_PILOT_UNDERWRITING_POLICY
  ): UnderwritingOutput {
    // 1. Cálculos Determinísticos Estrictos
    const loanAmount = Number(requestedAmount) || 0;
    const marketVal = Number(marketPropertyValue) || 0;
    const consVal = Number(conservativePropertyValue) || 0;

    // LTV sobre valor de mercado y sobre valor conservador
    const ltvMarket = marketVal > 0 ? Number(((loanAmount / marketVal) * 100).toFixed(2)) : 0;
    const ltvConservative = consVal > 0 ? Number(((loanAmount / consVal) * 100).toFixed(2)) : 0;

    // Capacidad máxima de financiamiento según LTV conservador
    const maxAllowedByLtv = Number(
      Math.min(consVal * (policy.maxLtv / 100), policy.maxLoanAmount).toFixed(2)
    );

    // 2. Validación de Límites de Política
    const violations: string[] = [];

    if (loanAmount > policy.maxLoanAmount) {
      violations.push(
        `El monto solicitado (USD ${loanAmount.toLocaleString('es-UY')}) supera el tope máximo de la política (USD ${policy.maxLoanAmount.toLocaleString('es-UY')}).`
      );
    }

    if (loanAmount < policy.minLoanAmount) {
      violations.push(
        `El monto solicitado está por debajo del monto mínimo admisible (USD ${policy.minLoanAmount.toLocaleString('es-UY')}).`
      );
    }

    // Se evalúa LTV preferentemente contra el valor conservador de garantía
    if (ltvConservative > policy.maxLtv) {
      violations.push(
        `El LTV calculado sobre el valor de garantía (${ltvConservative}%) supera el tope reglamentario del ${policy.maxLtv}%. Monto máximo permitido por LTV: USD ${maxAllowedByLtv.toLocaleString('es-UY')}.`
      );
    }

    if (termMonths < policy.minTermMonths || termMonths > policy.maxTermMonths) {
      violations.push(
        `El plazo solicitado (${termMonths} meses) se encuentra fuera del rango permitido (${policy.minTermMonths} a ${policy.maxTermMonths} meses).`
      );
    }

    const normType = (propertyType || '').toLowerCase();
    const typeAccepted = policy.acceptedPropertyTypes.some((t) =>
      normType.includes(t.toLowerCase())
    );
    if (!typeAccepted) {
      violations.push(`El tipo de propiedad "${propertyType}" requiere comité especial de crédito.`);
    }

    // 3. Estimación de Cuota Financiera (Solo intereses base + amortización simple)
    const monthlyRate = (policy.defaultInterestRateAnnual / 100) / 12;
    // Cuota mensual aproximada (modalidad solo intereses mensual estándar en mercado hipotecario privado uruguayo)
    const estimatedMonthlyInstallment = Math.round(loanAmount * monthlyRate);

    // Relación cuota / ingreso si se conoce
    let dtiRatio: number | undefined;
    if (monthlyIncome && monthlyIncome > 0) {
      // Si el ingreso está en UYU, asumimos tipo de cambio referencial UYU 40 por USD
      const incomeUsd = monthlyIncome > 10000 ? monthlyIncome / 40 : monthlyIncome;
      dtiRatio = Number(((estimatedMonthlyInstallment / incomeUsd) * 100).toFixed(1));
    }

    const eligible = violations.length === 0;
    const notes = eligible
      ? `Solicitud financiable dentro de los parámetros del prestamista. LTV conservador: ${ltvConservative}%.`
      : violations.join(' ');

    return {
      loan_amount: loanAmount,
      property_value: marketVal,
      conservative_property_value: consVal,
      ltv_market: ltvMarket,
      ltv_conservative: ltvConservative,
      max_allowed_by_ltv: maxAllowedByLtv,
      policy_limits: {
        max_ltv_allowed: policy.maxLtv,
        max_loan_allowed: policy.maxLoanAmount,
        min_loan_allowed: policy.minLoanAmount,
        max_term_months: policy.maxTermMonths,
      },
      eligible,
      notes,
      debt_to_income_ratio: dtiRatio,
      estimated_monthly_installment_usd: estimatedMonthlyInstallment,
    };
  }
}
