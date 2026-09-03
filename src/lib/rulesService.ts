// ==============================================================================
// HIPOTECALY: Servicio Único de Reglas Crediticias (Fuente: lenders + lender_rules)
// ==============================================================================

import { supabase } from './supabase';
import { PropertyType } from './types';

export interface MarketplaceRuleSet {
  ruleId?: string;
  lenderName: string;
  maxLtv: number; // Ej. 0.40 = 40%
  minAmount: number; // Ej. 10000
  maxAmount: number; // Ej. 200000
  currency: string;
  minTermMonths: number; // 12
  maxTermMonths: number; // 60
  acceptsClearing: boolean;
  acceptedPropertyTypes: PropertyType[];
  acceptedDepartments: string[];
  isDynamic: boolean;
}

// Configuración inicial del prestamista piloto activo en DB
export const DEFAULT_PILOT_RULESET: MarketplaceRuleSet = {
  lenderName: 'Prestamista Piloto Hipotecaly',
  maxLtv: 0.40,
  minAmount: 10000,
  maxAmount: 200000,
  currency: 'USD',
  minTermMonths: 12,
  maxTermMonths: 60,
  acceptsClearing: true,
  acceptedPropertyTypes: ['casa', 'apartamento', 'terreno', 'local_comercial', 'campo'],
  acceptedDepartments: [
    'Montevideo',
    'Canelones',
    'Maldonado',
    'Colonia',
    'San José',
    'Rocha',
  ],
  isDynamic: false,
};

let cachedRuleSet: MarketplaceRuleSet = { ...DEFAULT_PILOT_RULESET };
const listeners: Array<(rules: MarketplaceRuleSet) => void> = [];

/**
 * Permite inyectar / actualizar reglas dinámicas en memoria o pruebas unitarias
 */
export function setInMemoryMarketplaceRules(newRules: Partial<MarketplaceRuleSet>) {
  cachedRuleSet = { ...cachedRuleSet, ...newRules, isDynamic: true };
  listeners.forEach((cb) => cb(cachedRuleSet));
}

/**
 * Obtiene las reglas crediticias activas desde PostgreSQL (`lenders` + `lender_rules`)
 */
export async function getActiveMarketplaceRules(): Promise<MarketplaceRuleSet> {
  try {
    const { data, error } = await supabase.rpc('get_active_marketplace_rules');
    if (!error && data && data.length > 0) {
      const row = data[0];
      cachedRuleSet = {
        ruleId: row.rule_id,
        lenderName: row.lender_name || 'Prestamista Piloto',
        maxLtv: Number(row.max_ltv) || DEFAULT_PILOT_RULESET.maxLtv,
        minAmount: Number(row.min_amount) || DEFAULT_PILOT_RULESET.minAmount,
        maxAmount: Number(row.max_amount) || DEFAULT_PILOT_RULESET.maxAmount,
        currency: row.currency || 'USD',
        minTermMonths: Number(row.min_term_months) || 12,
        maxTermMonths: Number(row.max_term_months) || 60,
        acceptsClearing: Boolean(row.accepts_clearing),
        acceptedPropertyTypes: row.accepted_property_types || DEFAULT_PILOT_RULESET.acceptedPropertyTypes,
        acceptedDepartments: row.accepted_departments || DEFAULT_PILOT_RULESET.acceptedDepartments,
        isDynamic: true,
      };
      listeners.forEach((cb) => cb(cachedRuleSet));
      return cachedRuleSet;
    }
  } catch {
    // Si la conexión no responde, utiliza la regla en caché sin inventar datos
  }

  return cachedRuleSet;
}

/**
 * Calcula la capacidad crediticia aplicando estrictamente las reglas del prestamista
 */
export function calculateBorrowingCapacity(
  propertyValue: number,
  rules: MarketplaceRuleSet = cachedRuleSet
): {
  maxAmount: number;
  maxLtvPercentage: number;
  isEligible: boolean;
  reason?: string;
} {
  const maxLtvPercentage = Math.round(rules.maxLtv * 100);
  if (propertyValue <= 0) {
    return { maxAmount: 0, maxLtvPercentage, isEligible: false };
  }

  const calculatedByLtv = Math.floor(propertyValue * rules.maxLtv);
  const maxAmount = Math.min(calculatedByLtv, rules.maxAmount);

  if (maxAmount < rules.minAmount) {
    return {
      maxAmount: 0,
      maxLtvPercentage,
      isEligible: false,
      reason: `El valor de la propiedad no alcanza el monto mínimo financiable (USD ${rules.minAmount.toLocaleString('es-UY')}).`,
    };
  }

  return {
    maxAmount,
    maxLtvPercentage,
    isEligible: true,
  };
}

export function subscribeToRuleChanges(callback: (rules: MarketplaceRuleSet) => void) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}
