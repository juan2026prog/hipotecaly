// ==============================================================================
// HIPOTECALY AI CORE: Configuración Centralizada de Modelos y Tarifas
// ==============================================================================

import { MANDATORY_AI_DISCLAIMER } from './types';

export { MANDATORY_AI_DISCLAIMER };

export interface ModelProfile {
  name: string;
  fallback: string;
  description: string;
}

export const AI_MODELS: {
  extraction: ModelProfile;
  reasoning: ModelProfile;
  deep: ModelProfile;
} = {
  extraction: {
    name: 'gpt-4o-mini',
    fallback: 'gpt-4o-mini',
    description: 'Extracción masiva, clasificación documental, OCR y tareas repetitivas estructuradas',
  },
  reasoning: {
    name: 'gpt-4o',
    fallback: 'gpt-4o',
    description: 'Cruces documentales, underwriting, consistencia, tasación preliminar y semáforos',
  },
  deep: {
    name: 'o3-mini',
    fallback: 'o3-mini',
    description: 'Análisis de alta complejidad, contradicciones severas o solicitud explícita de revisión profunda',
  },
};

export const AI_STANDARD_CASE_COST_USD = 0.50; // USD 0.50 = 1.0 CASO AI

export interface ModelPricing {
  costInputPerMillionUsd: number;
  costCachedInputPerMillionUsd: number;
  costOutputPerMillionUsd: number;
  costPerSearchUsd: number;
  standardCaseCostUsd: number;
}

export const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-5.6-luna': {
    costInputPerMillionUsd: 0.15,
    costCachedInputPerMillionUsd: 0.075,
    costOutputPerMillionUsd: 0.60,
    costPerSearchUsd: 0.01,
    standardCaseCostUsd: AI_STANDARD_CASE_COST_USD,
  },
  'gpt-5.6-terra': {
    costInputPerMillionUsd: 2.50,
    costCachedInputPerMillionUsd: 1.25,
    costOutputPerMillionUsd: 10.00,
    costPerSearchUsd: 0.01,
    standardCaseCostUsd: AI_STANDARD_CASE_COST_USD,
  },
  'gpt-5.6-sol': {
    costInputPerMillionUsd: 5.00,
    costCachedInputPerMillionUsd: 2.50,
    costOutputPerMillionUsd: 20.00,
    costPerSearchUsd: 0.01,
    standardCaseCostUsd: AI_STANDARD_CASE_COST_USD,
  },
  'gpt-4o-mini': {
    costInputPerMillionUsd: 0.15,
    costCachedInputPerMillionUsd: 0.075,
    costOutputPerMillionUsd: 0.60,
    costPerSearchUsd: 0.01,
    standardCaseCostUsd: AI_STANDARD_CASE_COST_USD,
  },
  'gpt-4o': {
    costInputPerMillionUsd: 2.50,
    costCachedInputPerMillionUsd: 1.25,
    costOutputPerMillionUsd: 10.00,
    costPerSearchUsd: 0.01,
    standardCaseCostUsd: AI_STANDARD_CASE_COST_USD,
  },
  'o3-mini': {
    costInputPerMillionUsd: 1.10,
    costCachedInputPerMillionUsd: 0.55,
    costOutputPerMillionUsd: 4.40,
    costPerSearchUsd: 0.01,
    standardCaseCostUsd: AI_STANDARD_CASE_COST_USD,
  },
};

/**
 * Calcula el costo real en USD a partir del consumo exacto de tokens devuelto por la API.
 */
export function calculateTokenCost(
  model: string,
  inputTokens: number,
  cachedInputTokens: number,
  outputTokens: number,
  webSearches = 0
): {
  costInputUsd: number;
  costOutputUsd: number;
  costToolsUsd: number;
  costTotalUsd: number;
  caseUnits: number;
  cacheSavingsUsd: number;
} {
  const pricing = DEFAULT_MODEL_PRICING[model] || DEFAULT_MODEL_PRICING['gpt-5.6-terra'];
  const regularInput = Math.max(0, inputTokens - cachedInputTokens);
  const costInputUsd = (regularInput / 1_000_000) * pricing.costInputPerMillionUsd;
  const costCachedUsd = (cachedInputTokens / 1_000_000) * pricing.costCachedInputPerMillionUsd;
  const costOutputUsd = (outputTokens / 1_000_000) * pricing.costOutputPerMillionUsd;
  const costToolsUsd = webSearches * pricing.costPerSearchUsd;

  const costTotalUsd = Number((costInputUsd + costCachedUsd + costOutputUsd + costToolsUsd).toFixed(5));
  const fullPriceWithoutCache = (cachedInputTokens / 1_000_000) * pricing.costInputPerMillionUsd;
  const cacheSavingsUsd = Number(Math.max(0, fullPriceWithoutCache - costCachedUsd).toFixed(5));

  // Conversión a unidad comercial "CASO AI"
  const standardCost = pricing.standardCaseCostUsd || AI_STANDARD_CASE_COST_USD;
  const rawUnits = costTotalUsd / standardCost;
  const caseUnits = Number(Math.max(0.05, Math.round(rawUnits * 100) / 100).toFixed(2));

  return {
    costInputUsd: Number((costInputUsd + costCachedUsd).toFixed(5)),
    costOutputUsd: Number(costOutputUsd.toFixed(5)),
    costToolsUsd: Number(costToolsUsd.toFixed(5)),
    costTotalUsd,
    caseUnits,
    cacheSavingsUsd,
  };
}
