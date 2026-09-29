// ==============================================================================
// HIPOTECALY AI: Underwriting Agent (Motor Híbrido: Reglas Determinísticas + IA)
// ==============================================================================

import { UnderwritingOutput } from '../types.js';
import { EffectiveUnderwritingPolicy, CANONICAL_DEMO_POLICY } from '../underwritingPolicyResolver.js';

export interface UnderwritingPolicyConfig {
  maxLtv: number; // Por ej. 40.0% o 50.0%
  maxLoanAmount?: number;
  minLoanAmount?: number;
  minTermMonths?: number;
  maxTermMonths?: number;
  acceptedPropertyTypes?: string[];
  acceptedDepartments?: string[];
  defaultInterestRateAnnual?: number; // Por ej. 11.5%
  allowOfflineAnalysis?: boolean;
  maxDtiRatio?: number;
  maxBorrowerAgeAtMaturity?: number;
}

export class UnderwritingAgent {
  /**
   * Ejecuta el análisis de underwriting determinístico estricto por código.
   * La IA no inventa los números ni los cálculos financieros.
   * Requiere una política explícita resuelta sin fallbacks silenciosos.
   */
  public evaluateUnderwriting(
    requestedAmount: number,
    marketPropertyValue: number,
    conservativePropertyValue: number,
    termMonths: number,
    propertyType: string,
    _department: string,
    monthlyIncome?: number,
    policy?: UnderwritingPolicyConfig | EffectiveUnderwritingPolicy
  ): UnderwritingOutput {
    if (!policy || typeof policy.maxLtv !== 'number' || isNaN(policy.maxLtv) || policy.maxLtv <= 0) {
      throw new Error('INVALID_POLICY: evaluateUnderwriting requiere una política con maxLtv numérico válido.');
    }

    const effectivePolicy = policy;

    // 1. Cálculos Determinísticos Estrictos
    const loanAmount = Number(requestedAmount) || 0;
    const marketVal = Number(marketPropertyValue) || 0;
    const consVal = Number(conservativePropertyValue) || 0;

    // LTV sobre valor de mercado y sobre valor conservador
    const ltvMarket = marketVal > 0 ? Number(((loanAmount / marketVal) * 100).toFixed(2)) : 0;
    const ltvConservative = consVal > 0 ? Number(((loanAmount / consVal) * 100).toFixed(2)) : 0;

    // Capacidad máxima de financiamiento según LTV conservador
    const maxByLtv = consVal * (effectivePolicy.maxLtv / 100);
    const maxAllowedByLtv = Number(
      (effectivePolicy.maxLoanAmount !== undefined
        ? Math.min(maxByLtv, effectivePolicy.maxLoanAmount)
        : maxByLtv
      ).toFixed(2)
    );

    // 2. Validación de Límites de Política
    const violations: string[] = [];

    if (effectivePolicy.maxLoanAmount !== undefined && loanAmount > effectivePolicy.maxLoanAmount) {
      violations.push(
        `El monto solicitado (USD ${loanAmount.toLocaleString('es-UY')}) supera el tope máximo de la política (USD ${effectivePolicy.maxLoanAmount.toLocaleString('es-UY')}).`
      );
    }

    if (effectivePolicy.minLoanAmount !== undefined && loanAmount < effectivePolicy.minLoanAmount) {
      violations.push(
        `El monto solicitado está por debajo del monto mínimo admisible (USD ${effectivePolicy.minLoanAmount.toLocaleString('es-UY')}).`
      );
    }

    // Se evalúa LTV preferentemente contra el valor conservador de garantía
    if (ltvConservative > effectivePolicy.maxLtv) {
      violations.push(
        `El LTV calculado sobre el valor de garantía (${ltvConservative}%) supera el tope reglamentario del ${effectivePolicy.maxLtv}%. Monto máximo permitido por LTV: USD ${maxAllowedByLtv.toLocaleString('es-UY')}.`
      );
    }

    if (effectivePolicy.minTermMonths !== undefined && termMonths < effectivePolicy.minTermMonths) {
      violations.push(
        `El plazo solicitado (${termMonths} meses) es inferior al plazo mínimo permitido (${effectivePolicy.minTermMonths} meses).`
      );
    }

    if (effectivePolicy.maxTermMonths !== undefined && termMonths > effectivePolicy.maxTermMonths) {
      violations.push(
        `El plazo solicitado (${termMonths} meses) supera el plazo máximo permitido (${effectivePolicy.maxTermMonths} meses).`
      );
    }

    if (effectivePolicy.acceptedPropertyTypes && effectivePolicy.acceptedPropertyTypes.length > 0) {
      const normType = (propertyType || '').toLowerCase();
      const typeAccepted = effectivePolicy.acceptedPropertyTypes.some((t) =>
        normType.includes(t.toLowerCase()) || t.toLowerCase() === 'todos' || t === '*'
      );
      if (!typeAccepted) {
        violations.push(`El tipo de propiedad "${propertyType}" requiere comité especial de crédito.`);
      }
    }

    // 3. Estimación de Cuota Financiera (Solo si defaultInterestRateAnnual está configurado)
    let estimatedMonthlyInstallment = 0;
    if (effectivePolicy.defaultInterestRateAnnual && effectivePolicy.defaultInterestRateAnnual > 0) {
      const monthlyRate = (effectivePolicy.defaultInterestRateAnnual / 100) / 12;
      estimatedMonthlyInstallment = Math.round(loanAmount * monthlyRate);
    }

    // Relación cuota / ingreso si se conoce
    let dtiRatio: number | undefined;
    if (monthlyIncome && monthlyIncome > 0 && estimatedMonthlyInstallment > 0) {
      const incomeUsd = monthlyIncome > 10000 ? monthlyIncome / 40 : monthlyIncome;
      dtiRatio = Number(((estimatedMonthlyInstallment / incomeUsd) * 100).toFixed(1));
    }

    const eligible = violations.length === 0;
    const notes = eligible
      ? `Solicitud financiable dentro de los parámetros de la política aplicable. LTV conservador: ${ltvConservative}%.`
      : violations.join(' ');

    return {
      loan_amount: loanAmount,
      property_value: marketVal,
      conservative_property_value: consVal,
      ltv_market: ltvMarket,
      ltv_conservative: ltvConservative,
      max_allowed_by_ltv: maxAllowedByLtv,
      policy_limits: {
        max_ltv_allowed: effectivePolicy.maxLtv,
        max_loan_allowed: effectivePolicy.maxLoanAmount || 0,
        min_loan_allowed: effectivePolicy.minLoanAmount || 0,
        max_term_months: effectivePolicy.maxTermMonths || 0,
      },
      eligible,
      notes,
      debt_to_income_ratio: dtiRatio,
      estimated_monthly_installment_usd: estimatedMonthlyInstallment,
    };
  }
}
