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

export const AI_MODELS = {
  fast_extraction: {
    name: 'gpt-4o-mini',
    fallback: 'gpt-4o-mini',
    description: 'Extracción rápida, OCR, clasificación de documentos y tareas estructuradas masivas',
  },
  extraction: {
    name: 'gpt-4o-mini',
    fallback: 'gpt-4o-mini',
    description: 'Extracción de legajos y categorización documental rápida',
  },
  document_analysis: {
    name: 'gpt-4o',
    fallback: 'gpt-4o-mini',
    description: 'Lectura visual, análisis semántico de títulos y escrituras complejas',
  },
  reasoning: {
    name: 'gpt-4o',
    fallback: 'gpt-4o-mini',
    description: 'Cruces documentales, underwriting, consistencia, tasación preliminar y semáforos',
  },
  assistant: {
    name: 'gpt-4o',
    fallback: 'gpt-4o-mini',
    description: 'Asistente IA contextual por expediente, preguntas abiertas y explicaciones a clientes',
  },
  deep: {
    name: 'gpt-4o',
    fallback: 'gpt-4o-mini',
    description: 'Análisis de alta complejidad, contradicciones severas o revisión profunda',
  },
  embeddings: {
    name: 'text-embedding-3-small',
    fallback: 'text-embedding-3-small',
    description: 'Generación de vectores para RAG y recuperación en memoria global',
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
  'text-embedding-3-small': {
    costInputPerMillionUsd: 0.02,
    costCachedInputPerMillionUsd: 0.02,
    costOutputPerMillionUsd: 0.00,
    costPerSearchUsd: 0.00,
    standardCaseCostUsd: AI_STANDARD_CASE_COST_USD,
  },
  // Mapeos de compatibilidad con configuraciones previas
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
    costInputPerMillionUsd: 2.50,
    costCachedInputPerMillionUsd: 1.25,
    costOutputPerMillionUsd: 10.00,
    costPerSearchUsd: 0.01,
    standardCaseCostUsd: AI_STANDARD_CASE_COST_USD,
  },
};

/**
 * Normaliza cualquier identificador de modelo al nombre oficial de OpenAI API
 */
export function normalizeOpenAiModel(modelName: string): string {
  if (!modelName) return 'gpt-4o-mini';
  const clean = modelName.toLowerCase().trim();
  if (clean.includes('luna')) return 'gpt-4o-mini';
  if (clean.includes('terra')) return 'gpt-4o';
  if (clean.includes('sol')) return 'o3-mini';
  if (clean.includes('gpt-4o-mini')) return 'gpt-4o-mini';
  if (clean.includes('gpt-4o')) return 'gpt-4o';
  if (clean.includes('o3-mini')) return 'o3-mini';
  if (clean.includes('embedding')) return 'text-embedding-3-small';
  return modelName;
}

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
