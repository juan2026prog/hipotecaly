// ==============================================================================
// HIPOTECALY: AI Prompt Templates Registry & Versioning Engine
// Gestión canónica y versionada de System Prompts y Schemas
// ==============================================================================

import { supabaseAdmin } from '../supabase.js';

export interface PromptTemplateItem {
  promptKey: string;
  version: string;
  name: string;
  description?: string;
  systemPrompt: string;
  template: string;
  expectedSchema?: Record<string, any>;
  modelProfile: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

export const CANONICAL_PROMPT_TEMPLATES: Record<string, PromptTemplateItem> = {
  DOCUMENT_EXTRACTION: {
    promptKey: 'DOCUMENT_EXTRACTION',
    version: '1.0.0',
    name: 'Extracción de Documentos Notariales y Crediticios',
    description: 'Extrae campos estructurados, montos, titulares, padrones e inconsistencias de documentos uruguayos.',
    systemPrompt: `Sos el agente especializado en Inteligencia Documental Notarial e Hipotecaria de HIPOTECALY en Uruguay.
Tu misión es clasificar el documento y extraer todos los datos relevantes con máxima precisión.
Si un dato no figura o está borroso, marcalo como null sin inventar.
Generá un objeto JSON estricto cumpliendo el schema solicitado.`,
    template: 'Documento: {{fileName}}\nTipo sugerido: {{documentType}}\nContenido:\n{{documentContent}}',
    modelProfile: 'FAST_EXTRACTION',
    status: 'ACTIVE',
  },
  CASE_SUMMARY: {
    promptKey: 'CASE_SUMMARY',
    version: '1.0.0',
    name: 'Resumen Ejecutivo y Dictamen de Expediente',
    description: 'Sintetiza el expediente hipotecario cruzando solvencia, garantía y dictamen de políticas.',
    systemPrompt: `Sos el Analista Hipotecario Senior de HIPOTECALY.
Tu función es sintetizar el estado integral del caso, destacando fortalezas de la garantía, debilidades del perfil y acciones requeridas.
No inventes datos crediticios. Respetá siempre el dictamen determinístico provisto.`,
    template: 'Expediente: {{applicationId}}\nSolicitante: {{borrowerName}}\nPropiedad: {{propertySummary}}\nUnderwriting: {{underwritingResults}}',
    modelProfile: 'ASSISTANT',
    status: 'ACTIVE',
  },
  CONTEXTUAL_ASSISTANT: {
    promptKey: 'CONTEXTUAL_ASSISTANT',
    version: '1.0.0',
    name: 'Asistente Contextual de Expediente',
    description: 'Responde consultas de analistas e inversores sobre un expediente autorizado.',
    systemPrompt: `Sos el Asistente Contextual Hipotecario de HIPOTECALY.
Respondé únicamente con base en la información suministrada del expediente.
Si no hay evidencia suficiente en los documentos para responder una pregunta, indicá expresamente:
"No hay información suficiente en el expediente para responderlo."
Nunca inventes plazos, montos ni aprobaciones no registradas.`,
    template: 'Contexto del Expediente: {{caseContext}}\nPregunta del usuario: {{userQuestion}}',
    modelProfile: 'ASSISTANT',
    status: 'ACTIVE',
  },
};

export class PromptRegistry {
  private static instance: PromptRegistry;
  private cache: Map<string, PromptTemplateItem> = new Map();

  private constructor() {}

  public static getInstance(): PromptRegistry {
    if (!PromptRegistry.instance) {
      PromptRegistry.instance = new PromptRegistry();
    }
    return PromptRegistry.instance;
  }

  /**
   * Obtiene la versión activa de un prompt por su clave
   */
  public async getPrompt(promptKey: string, version?: string): Promise<PromptTemplateItem> {
    const cacheKey = `${promptKey}_${version || 'ACTIVE'}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      let query = supabaseAdmin
        .from('ai_prompt_templates')
        .select('*')
        .eq('prompt_key', promptKey);

      if (version) {
        query = query.eq('version', version);
      } else {
        query = query.eq('status', 'ACTIVE');
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        const item: PromptTemplateItem = {
          promptKey: data.prompt_key,
          version: data.version,
          name: data.name,
          description: data.description,
          systemPrompt: data.system_prompt,
          template: data.template,
          expectedSchema: data.expected_schema,
          modelProfile: data.model_profile,
          status: data.status,
        };
        this.cache.set(cacheKey, item);
        return item;
      }
    } catch {}

    const fallback = CANONICAL_PROMPT_TEMPLATES[promptKey] || {
      promptKey,
      version: '1.0.0',
      name: promptKey,
      systemPrompt: 'Sos un asistente analítico seguro de HIPOTECALY.',
      template: '{{input}}',
      modelProfile: 'FAST_EXTRACTION',
      status: 'ACTIVE',
    };

    this.cache.set(cacheKey, fallback);
    return fallback;
  }
}

export const promptRegistry = PromptRegistry.getInstance();
