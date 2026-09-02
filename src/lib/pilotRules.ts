// ==============================================================================
// HIPOTECALY: Motor de Reglas del Prestamista Piloto (Uruguay)
// ==============================================================================

import { LenderRule, PropertyType } from './types';

export const PILOT_LENDER_CONFIG: LenderRule = {
  id: 'c0000000-0000-0000-0000-000000000001',
  lender_id: 'b0000000-0000-0000-0000-000000000001',
  max_ltv: 40.0, // 40%
  min_loan: 10000,
  max_loan: 200000,
  min_term_months: 12,
  max_term_months: 60, // 5 años
  accepts_clearing: true,
  accepted_property_types: ['casa', 'apartamento', 'local_comercial', 'terreno', 'campo'],
  accepted_departments: [
    'Montevideo',
    'Canelones',
    'Maldonado',
    'Colonia',
    'San José',
    'Rocha',
    'Salto',
    'Paysandú',
    'Todos'
  ],
  accepted_currencies: ['USD'],
  income_requirements: 'Recibo de sueldo o certificado de ingresos emitido por contador público',
  active: true,
};

/**
 * Calcula la capacidad máxima estimada de financiación
 * según el valor declarado del inmueble y el LTV tope del prestamista.
 */
export function calculateMaxLoan(propertyValue: number, rule: LenderRule = PILOT_LENDER_CONFIG): number {
  if (!propertyValue || propertyValue <= 0) return 0;
  const ltvAmount = propertyValue * (rule.max_ltv / 100);
  return Math.min(ltvAmount, rule.max_loan);
}

/**
 * Valida si una combinación de solicitud cumple con los parámetros básicos del prestamista
 */
export function evaluatePilotEligibility(
  propertyValue: number,
  requestedAmount: number,
  propertyType: PropertyType,
  rule: LenderRule = PILOT_LENDER_CONFIG
): { eligible: boolean; maxAllowed: number; ltv: number; message?: string } {
  const maxAllowed = calculateMaxLoan(propertyValue, rule);
  const ltv = propertyValue > 0 ? (requestedAmount / propertyValue) * 100 : 0;

  if (!rule.accepted_property_types.includes(propertyType)) {
    return {
      eligible: false,
      maxAllowed,
      ltv,
      message: 'Tipo de propiedad actualmente en análisis especial',
    };
  }

  if (requestedAmount > maxAllowed) {
    return {
      eligible: false,
      maxAllowed,
      ltv,
      message: `El monto solicitado supera el 40% del valor estimado o el tope de USD ${rule.max_loan.toLocaleString('es-UY')}`,
    };
  }

  return { eligible: true, maxAllowed, ltv };
}
