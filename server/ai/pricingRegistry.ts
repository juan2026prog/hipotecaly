// ==============================================================================
// HIPOTECALY: AI Model Pricing Registry & Freshness Engine (Server-Side)
// Administra tarifas canónicas de inferencia con detección de estado: CURRENT / STALE / UNKNOWN
// ==============================================================================

import { supabaseAdmin } from '../supabase.js';

export type PricingFreshnessStatus = 'CURRENT' | 'STALE' | 'UNKNOWN';

export interface ModelPricingItem {
  provider: string;
  model: string;
  costInputPerMillionUsd: number;
  costCachedInputPerMillionUsd: number;
  costOutputPerMillionUsd: number;
  costPerSearchUsd: number;
  standardCaseCostUsd: number;
  effectiveFrom: string;
  source: string;
  lastVerifiedAt: string;
  status: PricingFreshnessStatus;
  isFallback: boolean;
}

export const CANONICAL_FALLBACK_PRICING: Record<string, ModelPricingItem> = {
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    costInputPerMillionUsd: 0.15,
    costCachedInputPerMillionUsd: 0.075,
    costOutputPerMillionUsd: 0.60,
    costPerSearchUsd: 0.01,
    standardCaseCostUsd: 0.50,
    effectiveFrom: '2026-01-01',
    source: 'OpenAI Baseline Fallback',
    lastVerifiedAt: '2026-01-01T00:00:00Z',
    status: 'CURRENT',
    isFallback: true,
  },
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    costInputPerMillionUsd: 2.50,
    costCachedInputPerMillionUsd: 1.25,
    costOutputPerMillionUsd: 10.00,
    costPerSearchUsd: 0.01,
    standardCaseCostUsd: 0.50,
    effectiveFrom: '2026-01-01',
    source: 'OpenAI Baseline Fallback',
    lastVerifiedAt: '2026-01-01T00:00:00Z',
    status: 'CURRENT',
    isFallback: true,
  },
  'o3-mini': {
    provider: 'openai',
    model: 'o3-mini',
    costInputPerMillionUsd: 1.10,
    costCachedInputPerMillionUsd: 0.55,
    costOutputPerMillionUsd: 4.40,
    costPerSearchUsd: 0.01,
    standardCaseCostUsd: 0.50,
    effectiveFrom: '2026-01-01',
    source: 'OpenAI Baseline Fallback',
    lastVerifiedAt: '2026-01-01T00:00:00Z',
    status: 'CURRENT',
    isFallback: true,
  },
  'text-embedding-3-small': {
    provider: 'openai',
    model: 'text-embedding-3-small',
    costInputPerMillionUsd: 0.02,
    costCachedInputPerMillionUsd: 0.02,
    costOutputPerMillionUsd: 0.00,
    costPerSearchUsd: 0.00,
    standardCaseCostUsd: 0.50,
    effectiveFrom: '2026-01-01',
    source: 'OpenAI Baseline Fallback',
    lastVerifiedAt: '2026-01-01T00:00:00Z',
    status: 'CURRENT',
    isFallback: true,
  },
};

export class PricingRegistry {
  private static instance: PricingRegistry;
  private cache: Map<string, ModelPricingItem> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
  private readonly STALE_THRESHOLD_DAYS = 90; // > 90 días sin verificación = STALE

  private constructor() {}

  public static getInstance(): PricingRegistry {
    if (!PricingRegistry.instance) {
      PricingRegistry.instance = new PricingRegistry();
    }
    return PricingRegistry.instance;
  }

  /**
   * Obtiene la tarifa canónica para un modelo desde DB con evaluación de frescura
   */
  public async getPricingForModel(modelName: string): Promise<ModelPricingItem> {
    const now = Date.now();
    const cleanModel = modelName.toLowerCase().trim();

    if (this.cache.has(cleanModel) && now < this.cacheExpiry) {
      return this.cache.get(cleanModel)!;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('ai_model_pricing_registry')
        .select('*')
        .eq('model', cleanModel)
        .maybeSingle();

      if (!error && data) {
        const lastVer = data.last_verified_at ? new Date(data.last_verified_at).getTime() : 0;
        const daysSinceVer = lastVer > 0 ? (now - lastVer) / (1000 * 60 * 60 * 24) : 999;
        const computedStatus: PricingFreshnessStatus =
          daysSinceVer > this.STALE_THRESHOLD_DAYS ? 'STALE' : (data.status as PricingFreshnessStatus) || 'CURRENT';

        const item: ModelPricingItem = {
          provider: data.provider || 'openai',
          model: data.model,
          costInputPerMillionUsd: Number(data.input_price_per_million) || 0.15,
          costCachedInputPerMillionUsd: Number(data.cached_input_price_per_million) || 0.075,
          costOutputPerMillionUsd: Number(data.output_price_per_million) || 0.60,
          costPerSearchUsd: Number(data.tool_price) || 0.01,
          standardCaseCostUsd: 0.50,
          effectiveFrom: data.effective_from || new Date().toISOString().split('T')[0],
          source: data.source || 'Database Registry',
          lastVerifiedAt: data.last_verified_at || new Date().toISOString(),
          status: computedStatus,
          isFallback: false,
        };

        this.cache.set(cleanModel, item);
        this.cacheExpiry = now + this.CACHE_TTL_MS;
        return item;
      }
    } catch {
      // Fallback
    }

    // Si no está en DB, retornar fallback explícito
    const fallback = CANONICAL_FALLBACK_PRICING[cleanModel] || {
      provider: 'openai',
      model: cleanModel,
      costInputPerMillionUsd: 2.50,
      costCachedInputPerMillionUsd: 1.25,
      costOutputPerMillionUsd: 10.00,
      costPerSearchUsd: 0.01,
      standardCaseCostUsd: 0.50,
      effectiveFrom: '2026-01-01',
      source: 'Generic Safety Fallback',
      lastVerifiedAt: '2026-01-01T00:00:00Z',
      status: 'UNKNOWN',
      isFallback: true,
    };

    this.cache.set(cleanModel, fallback);
    return fallback;
  }

  /**
   * Obtiene la lista completa de tarifas para el SuperAdmin UI
   */
  public async getAllPricing(): Promise<ModelPricingItem[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('ai_model_pricing_registry')
        .select('*')
        .order('model', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          const lastVer = d.last_verified_at ? new Date(d.last_verified_at).getTime() : 0;
          const daysSinceVer = lastVer > 0 ? (Date.now() - lastVer) / (1000 * 60 * 60 * 24) : 999;
          const computedStatus: PricingFreshnessStatus =
            daysSinceVer > this.STALE_THRESHOLD_DAYS ? 'STALE' : (d.status as PricingFreshnessStatus) || 'CURRENT';

          return {
            provider: d.provider || 'openai',
            model: d.model,
            costInputPerMillionUsd: Number(d.input_price_per_million),
            costCachedInputPerMillionUsd: Number(d.cached_input_price_per_million),
            costOutputPerMillionUsd: Number(d.output_price_per_million),
            costPerSearchUsd: Number(d.tool_price),
            standardCaseCostUsd: 0.50,
            effectiveFrom: d.effective_from,
            source: d.source,
            lastVerifiedAt: d.last_verified_at,
            status: computedStatus,
            isFallback: false,
          };
        });
      }
    } catch {}

    return Object.values(CANONICAL_FALLBACK_PRICING);
  }

  public invalidateCache(): void {
    this.cache.clear();
    this.cacheExpiry = 0;
  }
}

export const pricingRegistry = PricingRegistry.getInstance();
