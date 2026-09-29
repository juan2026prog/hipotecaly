// ==============================================================================
// HIPOTECALY AI: Servicio Centralizado de OpenAI (Server-Side)
// Orquestador seguro de llamadas HTTP a OpenAI Platform con Supabase Vault
// ==============================================================================

import { openAiSecretResolver } from './openAiSecretResolver.js';
import { normalizeOpenAiModel, calculateTokenCost } from './config.js';
import { pricingRegistry } from './pricingRegistry.js';
import { supabaseAdmin } from '../supabase.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' } | { type: 'text' };
  timeoutMs?: number;
  organizationId?: string;
  userId?: string;
  applicationId?: string;
  feature?: string;
  operation?: string;
  promptKey?: string;
  promptVersion?: string;
}

export interface ChatCompletionResult<T = any> {
  content: string;
  parsedJson?: T;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  costUsd: number;
  latencyMs: number;
  requestId: string;
  pricingStatus: string;
}

export class OpenAiService {
  private static instance: OpenAiService;

  private constructor() {}

  public static getInstance(): OpenAiService {
    if (!OpenAiService.instance) {
      OpenAiService.instance = new OpenAiService();
    }
    return OpenAiService.instance;
  }

  /**
   * Ejecuta una llamada de chat completion hacia OpenAI con reintentos controlados y timeout.
   */
  public async chatCompletion<T = any>(
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResult<T>> {
    const startTime = Date.now();
    const requestId = `ai_req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const model = normalizeOpenAiModel(options.model || 'gpt-4o');
    const timeoutMs = options.timeoutMs || 25000;

    // 0. Validar Master Switch y disponibilidad de API Key
    const metadata = await openAiSecretResolver.getMetadata();
    if (metadata.configured && !metadata.active && process.env.NODE_ENV === 'production') {
      throw new Error('AI_PROVIDER_DISABLED: HIPOTECALY AI se encuentra temporalmente desactivado.');
    }

    const apiKey = await openAiSecretResolver.getOpenAiApiKey();

    // 1. Preparar payload
    const bodyPayload: any = {
      model,
      messages: options.messages,
      temperature: typeof options.temperature === 'number' ? options.temperature : 0.2,
      max_tokens: options.maxTokens || 3000,
    };

    if (options.responseFormat) {
      bodyPayload.response_format = options.responseFormat;
    }

    // 2. Ejecutar fetch con timeout y hasta 1 reintento exponencial
    let lastError: any = null;
    let openAiResponse: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          openAiResponse = await res.json();
          break;
        }

        const errJson = await res.json().catch(() => ({}));
        const status = res.status;
        const msg = errJson?.error?.message || `HTTP ${status} al consultar OpenAI`;

        if ((status === 429 || status >= 500) && attempt === 1) {
          lastError = new Error(`OpenAI API ${status}: ${msg}`);
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }

        throw new Error(`OpenAI Error (${status}): ${msg}`);
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        if (err.name === 'AbortError') {
          throw new Error(`AI_TIMEOUT: La consulta a OpenAI superó el tiempo límite de ${timeoutMs}ms.`);
        }
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
      }
    }

    if (!openAiResponse) {
      // Registrar telemetría de error
      if (options.organizationId) {
        supabaseAdmin
          .from('ai_usage_events')
          .insert({
            project: 'HIPOTECALY',
            organization_id: options.organizationId,
            user_id: options.userId || null,
            application_id: options.applicationId || null,
            feature: options.feature || 'openAiService',
            operation: options.operation || 'chat_completion',
            model,
            prompt_key: options.promptKey || null,
            prompt_version: options.promptVersion || '1.0.0',
            latency_ms: Date.now() - startTime,
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
            cost_usd: 0,
            status: 'failed',
            error_code: lastError?.message || 'OPENAI_CALL_FAILED',
          })
          .then(() => {})
          .catch(() => {});
      }
      throw lastError || new Error('Error al obtener respuesta de OpenAI.');
    }

    const latencyMs = Date.now() - startTime;
    const choice = openAiResponse.choices?.[0];
    const rawContent = choice?.message?.content || '';
    const usage = openAiResponse.usage || {};
    const promptTokens = usage.prompt_tokens || usage.input_tokens || 0;
    const cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0;
    const completionTokens = usage.completion_tokens || usage.output_tokens || 0;
    const totalTokens = usage.total_tokens || promptTokens + completionTokens;

    // Calcular costo con tarifa canónica
    const pricingItem = await pricingRegistry.getPricingForModel(model);
    const costDetails = calculateTokenCost(model, promptTokens, cachedTokens, completionTokens);

    // Parsear JSON estructurado si corresponde
    let parsedJson: T | undefined;
    if (options.responseFormat?.type === 'json_object' || options.messages.some((m) => m.content.toLowerCase().includes('json'))) {
      try {
        const cleaned = rawContent
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        parsedJson = JSON.parse(cleaned);
      } catch {
        // Dejar parsedJson undefined
      }
    }

    // Registrar telemetría de uso con atribución canónica a HIPOTECALY
    if (options.organizationId) {
      supabaseAdmin
        .from('ai_usage_events')
        .insert({
          project: 'HIPOTECALY',
          organization_id: options.organizationId,
          user_id: options.userId || null,
          application_id: options.applicationId || null,
          agent_name: options.feature || 'openAiService',
          step_name: options.promptVersion || 'v1.0.0',
          feature: options.feature || 'ai_core',
          operation: options.operation || 'chat_completion',
          model,
          prompt_key: options.promptKey || null,
          prompt_version: options.promptVersion || '1.0.0',
          latency_ms: latencyMs,
          input_tokens: promptTokens,
          cached_input_tokens: cachedTokens,
          output_tokens: completionTokens,
          total_tokens: totalTokens,
          cost_usd: costDetails.costTotalUsd,
          pricing_status: pricingItem.status,
          status: 'success',
        })
        .then(() => {})
        .catch(() => {});
    }

    return {
      content: rawContent,
      parsedJson,
      model,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: totalTokens,
      },
      costUsd: costDetails.costTotalUsd,
      latencyMs,
      requestId,
      pricingStatus: pricingItem.status,
    };
  }

  /**
   * Genera vectores embeddings reales utilizando text-embedding-3-small
   */
  public async createEmbeddings(
    input: string | string[],
    model = 'text-embedding-3-small'
  ): Promise<{ embeddings: number[][]; totalTokens: number; costUsd: number }> {
    const apiKey = await openAiSecretResolver.getOpenAiApiKey();
    const normalized = normalizeOpenAiModel(model);

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: normalized,
        input,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `HTTP ${res.status} al generar embeddings`);
    }

    const data = await res.json();
    const embeddings = (data.data || []).map((item: any) => item.embedding);
    const totalTokens = data.usage?.total_tokens || 0;
    const costDetails = calculateTokenCost(normalized, totalTokens, 0, 0);

    return {
      embeddings,
      totalTokens,
      costUsd: costDetails.costTotalUsd,
    };
  }
}

export const openAiService = OpenAiService.getInstance();
