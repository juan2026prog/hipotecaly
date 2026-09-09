// ==============================================================================
// HIPOTECALY AI CORE: Configuración Centralizada de Modelos y Tarifas
// ==============================================================================

import { MANDATORY_AI_DISCLAIMER } from './types';

export { MANDATORY_AI_DISCLAIMER };

export type AiProfileName =
  | 'FAST_EXTRACTION'
  | 'DOCUMENT_ANALYSIS'
  | 'ASSISTANT'
  | 'DEEP_REASONING'
  | 'EMBEDDINGS';

export interface AiModelProfile {
  profile: AiProfileName;
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  supportsVision: boolean;
  supportsStructuredOutputs: boolean;
  costInputPerMillionUsd: number;
  costCachedInputPerMillionUsd: number;
  costOutputPerMillionUsd: number;
  description: string;
  rationale: string;
}

export const AI_MODEL_PROFILES: Record<AiProfileName, AiModelProfile> = {
  FAST_EXTRACTION: {
    profile: 'FAST_EXTRACTION',
    primaryModel: 'gpt-4o-mini',
    fallbackModel: 'gpt-4o-mini',
    temperature: 0.0,
    maxTokens: 3000,
    supportsVision: true,
    supportsStructuredOutputs: true,
    costInputPerMillionUsd: 0.15,
    costCachedInputPerMillionUsd: 0.075,
    costOutputPerMillionUsd: 0.60,
    description: 'Extracción rápida, OCR ligero, clasificación de documentos y metadata.',
    rationale: 'Menor latencia (<1.2s), costo ultra bajo (USD 0.15/1M) y soporte completo de JSON Schema para extracción de recibos y cédulas.',
  },
  DOCUMENT_ANALYSIS: {
    profile: 'DOCUMENT_ANALYSIS',
    primaryModel: 'gpt-4o',
    fallbackModel: 'gpt-4o-mini',
    temperature: 0.1,
    maxTokens: 4000,
    supportsVision: true,
    supportsStructuredOutputs: true,
    costInputPerMillionUsd: 2.50,
    costCachedInputPerMillionUsd: 1.25,
    costOutputPerMillionUsd: 10.00,
    description: 'Lectura visual profunda de planos, escrituras, testimonios por exhibición y contratos notariales.',
    rationale: 'Alta capacidad multimodal de visión para documentos notariales escaneados con sellos y firmas, con structured outputs precisos.',
  },
  ASSISTANT: {
    profile: 'ASSISTANT',
    primaryModel: 'gpt-4o',
    fallbackModel: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 2500,
    supportsVision: false,
    supportsStructuredOutputs: true,
    costInputPerMillionUsd: 2.50,
    costCachedInputPerMillionUsd: 1.25,
    costOutputPerMillionUsd: 10.00,
    description: 'Asistente contextual conversacional multi-turno con grounding documental de expediente.',
    rationale: 'Fluidez ejecutiva, comprensión avanzada de normativa hipotecaria uruguaya y estricta adherencia a delimitadores anti-inyección.',
  },
  DEEP_REASONING: {
    profile: 'DEEP_REASONING',
    primaryModel: 'o3-mini',
    fallbackModel: 'gpt-4o',
    temperature: 0.1,
    maxTokens: 6000,
    supportsVision: false,
    supportsStructuredOutputs: true,
    costInputPerMillionUsd: 1.10,
    costCachedInputPerMillionUsd: 0.55,
    costOutputPerMillionUsd: 4.40,
    description: 'Resolución de discrepancias graves, cadenas de titularidad complejas y dictámenes de riesgo dudoso.',
    rationale: 'Capacidad de razonamiento paso a paso optimizada con bajo costo (USD 1.10/1M) para desentrañar sucesiones y embargos complejos.',
  },
  EMBEDDINGS: {
    profile: 'EMBEDDINGS',
    primaryModel: 'text-embedding-3-small',
    fallbackModel: 'text-embedding-3-small',
    temperature: 0.0,
    maxTokens: 8191,
    supportsVision: false,
    supportsStructuredOutputs: false,
    costInputPerMillionUsd: 0.02,
    costCachedInputPerMillionUsd: 0.02,
    costOutputPerMillionUsd: 0.00,
    description: 'Generación de vectores densos para pgvector y RAG en memoria global anonimizada.',
    rationale: 'Dimensión 1536 estandarizada, excelente desempeño semántico multilingüe y costo prácticamente nulo (USD 0.02/1M).',
  },
};

export const AI_MODELS = {
  fast_extraction: {
    name: AI_MODEL_PROFILES.FAST_EXTRACTION.primaryModel,
    fallback: AI_MODEL_PROFILES.FAST_EXTRACTION.fallbackModel,
    description: AI_MODEL_PROFILES.FAST_EXTRACTION.description,
  },
  extraction: {
    name: AI_MODEL_PROFILES.FAST_EXTRACTION.primaryModel,
    fallback: AI_MODEL_PROFILES.FAST_EXTRACTION.fallbackModel,
    description: AI_MODEL_PROFILES.FAST_EXTRACTION.description,
  },
  document_analysis: {
    name: AI_MODEL_PROFILES.DOCUMENT_ANALYSIS.primaryModel,
    fallback: AI_MODEL_PROFILES.DOCUMENT_ANALYSIS.fallbackModel,
    description: AI_MODEL_PROFILES.DOCUMENT_ANALYSIS.description,
  },
  reasoning: {
    name: AI_MODEL_PROFILES.ASSISTANT.primaryModel,
    fallback: AI_MODEL_PROFILES.ASSISTANT.fallbackModel,
    description: AI_MODEL_PROFILES.ASSISTANT.description,
  },
  assistant: {
    name: AI_MODEL_PROFILES.ASSISTANT.primaryModel,
    fallback: AI_MODEL_PROFILES.ASSISTANT.fallbackModel,
    description: AI_MODEL_PROFILES.ASSISTANT.description,
  },
  deep: {
    name: AI_MODEL_PROFILES.DEEP_REASONING.primaryModel,
    fallback: AI_MODEL_PROFILES.DEEP_REASONING.fallbackModel,
    description: AI_MODEL_PROFILES.DEEP_REASONING.description,
  },
  embeddings: {
    name: AI_MODEL_PROFILES.EMBEDDINGS.primaryModel,
    fallback: AI_MODEL_PROFILES.EMBEDDINGS.fallbackModel,
    description: AI_MODEL_PROFILES.EMBEDDINGS.description,
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
