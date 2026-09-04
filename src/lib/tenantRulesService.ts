// ==============================================================================
// HIPOTECALY: Servicio de Reglas Crediticias, Costos y Privacidad por Tenant
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

export interface TenantLendingRules {
  tenantId: string;
  minLoanAmount: number;
  maxLoanAmount: number;
  maxFinancedPercentage: number; // Ej. 50 = 50%
  minTermMonths: number;
  maxTermMonths: number;
  availableTerms: number[];
  defaultRate: number; // % anual
  rateType: string;
  repaymentModes: Array<'solo_intereses' | 'amortizable'>;
  acceptedPropertyTypes: string[];
  acceptedRegions: string[];
  earlyCancellationPolicy: string;
}

export interface TenantCostItem {
  costKey: 'notary' | 'appraisal' | 'certificates' | 'registry' | 'administrative' | 'other' | 'cancellation';
  costType: 'fixed' | 'percentage' | 'manual_estimate' | 'disabled';
  fixedAmount: number;
  percentageRate: number;
  notes?: string;
}

export interface TenantPrivacyRules {
  revealPhoneAtStatus: string;
  revealEmailAtStatus: string;
  allowDocumentDownloadAtStatus: string;
}

// Reglas por defecto para el tenant NOVA Demo
export const DEFAULT_NOVA_LENDING_RULES: TenantLendingRules = {
  tenantId: 'd0000000-0000-0000-0000-000000000001',
  minLoanAmount: 15000,
  maxLoanAmount: 250000,
  maxFinancedPercentage: 50, // 50% por defecto
  minTermMonths: 12,
  maxTermMonths: 60,
  availableTerms: [12, 24, 36, 48, 60],
  defaultRate: 11.5,
  rateType: 'anual_fija',
  repaymentModes: ['solo_intereses', 'amortizable'],
  acceptedPropertyTypes: ['vivienda', 'local_comercial', 'terreno', 'rural'],
  acceptedRegions: ['Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'San Jose', 'Rocha', 'Todos'],
  earlyCancellationPolicy: 'Cancelación anticipada permitida sin penalidad tras 6 meses.',
};

export const DEFAULT_NOVA_COSTS: TenantCostItem[] = [
  { costKey: 'notary', costType: 'percentage', fixedAmount: 0, percentageRate: 2.5, notes: 'Honorarios notariales (2.5%)' },
  { costKey: 'appraisal', costType: 'fixed', fixedAmount: 450, percentageRate: 0, notes: 'Tasación técnica' },
  { costKey: 'certificates', costType: 'fixed', fixedAmount: 280, percentageRate: 0, notes: 'Certificados e inscripciones' },
  { costKey: 'registry', costType: 'fixed', fixedAmount: 150, percentageRate: 0, notes: 'Tasas de registro hipotecario' },
  { costKey: 'administrative', costType: 'percentage', fixedAmount: 0, percentageRate: 1.0, notes: 'Apertura de legajo (1%)' },
];

export const DEFAULT_NOVA_PRIVACY: TenantPrivacyRules = {
  revealPhoneAtStatus: 'approved',
  revealEmailAtStatus: 'approved',
  allowDocumentDownloadAtStatus: 'formalization',
};

// Caché en memoria reactiva
const rulesCache = new Map<string, TenantLendingRules>();
const costsCache = new Map<string, TenantCostItem[]>();
const privacyCache = new Map<string, TenantPrivacyRules>();
const rulesListeners: Array<(tenantId: string, rules: TenantLendingRules) => void> = [];

/**
 * Obtiene las reglas crediticias para un tenant (de DB o caché reactiva)
 */
export async function getTenantLendingRules(tenantId: string): Promise<TenantLendingRules> {
  const fallback = { ...DEFAULT_NOVA_LENDING_RULES, tenantId };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tenant_lending_rules')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (!error && data) {
        const loaded: TenantLendingRules = {
          tenantId: data.tenant_id,
          minLoanAmount: Number(data.min_loan_amount) || fallback.minLoanAmount,
          maxLoanAmount: Number(data.max_loan_amount) || fallback.maxLoanAmount,
          maxFinancedPercentage: Number(data.max_financed_percentage) || fallback.maxFinancedPercentage,
          minTermMonths: Number(data.min_term_months) || fallback.minTermMonths,
          maxTermMonths: Number(data.max_term_months) || fallback.maxTermMonths,
          availableTerms: data.available_terms || fallback.availableTerms,
          defaultRate: Number(data.default_rate) || fallback.defaultRate,
          rateType: data.rate_type || fallback.rateType,
          repaymentModes: data.repayment_modes || fallback.repaymentModes,
          acceptedPropertyTypes: data.accepted_property_types || fallback.acceptedPropertyTypes,
          acceptedRegions: data.accepted_regions || fallback.acceptedRegions,
          earlyCancellationPolicy: data.early_cancellation_policy || fallback.earlyCancellationPolicy,
        };

        rulesCache.set(tenantId, loaded);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('tenant_rules_' + tenantId, JSON.stringify(loaded));
        }
        return loaded;
      }
    } catch {
      // Fallback a memoria/local si la red falla
    }
  }

  if (rulesCache.has(tenantId)) {
    return rulesCache.get(tenantId)!;
  }

  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('tenant_rules_' + tenantId);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        rulesCache.set(tenantId, parsed);
        return parsed;
      } catch {
        // Fallback
      }
    }
  }

  rulesCache.set(tenantId, fallback);
  return fallback;
}

/**
 * Actualiza en caliente una regla crediticia (ej: cambiar maxFinancedPercentage de 50 a 40)
 */
export async function updateTenantLendingRules(
  tenantId: string,
  updates: Partial<TenantLendingRules>
): Promise<TenantLendingRules> {
  const current = await getTenantLendingRules(tenantId);
  const updated: TenantLendingRules = { ...current, ...updates };

  rulesCache.set(tenantId, updated);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('tenant_rules_' + tenantId, JSON.stringify(updated));
  }
  rulesListeners.forEach((fn) => fn(tenantId, updated));

  if (!isSupabaseConfigured) {
    return updated;
  }

  try {
    const { data: updatedRows, error: updateErr } = await supabase
      .from('tenant_lending_rules')
      .update({
        min_loan_amount: updated.minLoanAmount,
        max_loan_amount: updated.maxLoanAmount,
        max_financed_percentage: updated.maxFinancedPercentage,
        min_term_months: updated.minTermMonths,
        max_term_months: updated.maxTermMonths,
        available_terms: updated.availableTerms,
        default_rate: updated.defaultRate,
        rate_type: updated.rateType,
        repayment_modes: updated.repaymentModes,
        accepted_property_types: updated.acceptedPropertyTypes,
        early_cancellation_policy: updated.earlyCancellationPolicy,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .select('id');

    if (!updateErr && updatedRows && updatedRows.length > 0) {
      return updated;
    }

    await supabase.from('tenant_lending_rules').insert({
      tenant_id: tenantId,
      min_loan_amount: updated.minLoanAmount,
      max_loan_amount: updated.maxLoanAmount,
      max_financed_percentage: updated.maxFinancedPercentage,
      min_term_months: updated.minTermMonths,
      max_term_months: updated.maxTermMonths,
      available_terms: updated.availableTerms,
      default_rate: updated.defaultRate,
      rate_type: updated.rateType,
      repayment_modes: updated.repaymentModes,
      accepted_property_types: updated.acceptedPropertyTypes,
      early_cancellation_policy: updated.earlyCancellationPolicy,
    });
  } catch {
    // En pruebas locales sin DB, la memoria es autoritativa
  }

  return updated;
}

/**
 * Suscripción a cambios de reglas (para que el simulador reaccione de inmediato)
 */
export function subscribeToTenantRules(
  callback: (tenantId: string, rules: TenantLendingRules) => void
): () => void {
  rulesListeners.push(callback);
  return () => {
    const idx = rulesListeners.indexOf(callback);
    if (idx !== -1) rulesListeners.splice(idx, 1);
  };
}

/**
 * Obtiene la configuración de costos de formalización del tenant
 */
export async function getTenantCostConfigurations(tenantId: string): Promise<TenantCostItem[]> {
  if (costsCache.has(tenantId)) {
    return costsCache.get(tenantId)!;
  }

  try {
    const { data, error } = await supabase
      .from('tenant_cost_configurations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (!error && data && data.length > 0) {
      const items: TenantCostItem[] = data.map((d) => ({
        costKey: d.cost_key,
        costType: d.cost_type,
        fixedAmount: Number(d.fixed_amount) || 0,
        percentageRate: Number(d.percentage_rate) || 0,
        notes: d.notes,
      }));
      costsCache.set(tenantId, items);
      return items;
    }
  } catch {
    // Continuar con fallback
  }

  costsCache.set(tenantId, DEFAULT_NOVA_COSTS);
  return DEFAULT_NOVA_COSTS;
}

/**
 * Guarda la configuración de costos de formalización del tenant
 */
export async function saveTenantCostConfigurations(
  tenantId: string,
  costs: TenantCostItem[]
): Promise<TenantCostItem[]> {
  costsCache.set(tenantId, costs);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('tenant_costs_' + tenantId, JSON.stringify(costs));
  }

  if (!isSupabaseConfigured) {
    return costs;
  }

  try {
    const rows = costs.map((c) => ({
      tenant_id: tenantId,
      cost_key: c.costKey,
      cost_type: c.costType,
      fixed_amount: c.fixedAmount,
      percentage_rate: c.percentageRate,
      notes: c.notes,
      updated_at: new Date().toISOString(),
    }));

    await supabase
      .from('tenant_cost_configurations')
      .upsert(rows, { onConflict: 'tenant_id,cost_key' });
  } catch {
    // Silencioso
  }

  return costs;
}

/**
 * Calcula los costos de formalización y neto a desembolsar
 */
export function calculateFormalizationCosts(
  loanAmount: number,
  costItems: TenantCostItem[] = DEFAULT_NOVA_COSTS
): {
  totalFormalizationCosts: number;
  netDisbursed: number;
  breakdown: Array<{ key: string; label: string; amount: number }>;
} {
  let total = 0;
  const breakdown: Array<{ key: string; label: string; amount: number }> = [];

  const labelsMap: Record<string, string> = {
    notary: 'Honorarios Notariales',
    appraisal: 'Tasación Técnica',
    certificates: 'Certificados Registrales',
    registry: 'Inscripción de Hipoteca',
    administrative: 'Apertura de Legajo y Gestión',
    other: 'Otros Gastos',
    cancellation: 'Gastos de Cancelación',
  };

  for (const item of costItems) {
    if (item.costType === 'disabled') continue;

    let amount = 0;
    if (item.costType === 'fixed') {
      amount = item.fixedAmount;
    } else if (item.costType === 'percentage') {
      amount = Math.round(loanAmount * (item.percentageRate / 100));
    } else if (item.costType === 'manual_estimate') {
      amount = item.fixedAmount || 300;
    }

    total += amount;
    breakdown.push({
      key: item.costKey,
      label: labelsMap[item.costKey] || item.costKey,
      amount,
    });
  }

  return {
    totalFormalizationCosts: total,
    netDisbursed: Math.max(0, loanAmount - total),
    breakdown,
  };
}

/**
 * Obtiene las reglas de privacidad de un tenant
 */
export async function getTenantPrivacyRules(tenantId: string): Promise<TenantPrivacyRules> {
  if (privacyCache.has(tenantId)) {
    return privacyCache.get(tenantId)!;
  }

  try {
    const { data, error } = await supabase
      .from('tenant_privacy_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!error && data) {
      const p: TenantPrivacyRules = {
        revealPhoneAtStatus: data.reveal_phone_at_status || DEFAULT_NOVA_PRIVACY.revealPhoneAtStatus,
        revealEmailAtStatus: data.reveal_email_at_status || DEFAULT_NOVA_PRIVACY.revealEmailAtStatus,
        allowDocumentDownloadAtStatus: data.allow_document_download_at_status || DEFAULT_NOVA_PRIVACY.allowDocumentDownloadAtStatus,
      };
      privacyCache.set(tenantId, p);
      return p;
    }
  } catch {
    // Continuar con fallback
  }

  privacyCache.set(tenantId, DEFAULT_NOVA_PRIVACY);
  return DEFAULT_NOVA_PRIVACY;
}
