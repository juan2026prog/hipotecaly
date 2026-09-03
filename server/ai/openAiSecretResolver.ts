// ==============================================================================
// HIPOTECALY AI CORE: Server-Side Secret Resolver (Supabase Vault Integration)
// Abstracción única server-only para resolución segura de OPENAI_API_KEY
// ==============================================================================

import { supabaseAdmin } from '../supabase';

export interface SecretResolutionResult {
  apiKey: string;
  source: 'vault' | 'environment';
  last4: string;
}

export interface SecretMetadata {
  provider: string;
  configured: boolean;
  active: boolean;
  maskedKey: string | null;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  source: 'vault' | 'environment' | 'none';
}

export class OpenAiSecretResolver {
  private static instance: OpenAiSecretResolver;

  // Caché seguro temporal server-side (TTL: 5 minutos)
  private cachedApiKey: string | null = null;
  private cacheExpiry: number = 0;
  private cachedSource: 'vault' | 'environment' = 'vault';
  private cachedLast4: string = '';

  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  private constructor() {}

  public static getInstance(): OpenAiSecretResolver {
    if (!OpenAiSecretResolver.instance) {
      OpenAiSecretResolver.instance = new OpenAiSecretResolver();
    }
    return OpenAiSecretResolver.instance;
  }

  /**
   * Obtiene la OPENAI_API_KEY activa resolviendo con prioridad:
   * 1. Supabase Vault (secreto cifrado gestionado por Super Admin)
   * 2. process.env.OPENAI_API_KEY (fallback opcional exclusivo para desarrollo)
   * 
   * Nunca expone la clave fuera del servidor ni a los agentes.
   */
  public async getOpenAiApiKey(): Promise<string> {
    const now = Date.now();

    // 1. Validar caché server-side en memoria
    if (this.cachedApiKey && now < this.cacheExpiry) {
      return this.cachedApiKey;
    }

    // 2. Intentar recuperar desde Supabase Vault (Prioridad 1: Producción)
    try {
      const { data: vaultSecret, error } = await supabaseAdmin.rpc('get_openai_vault_secret_internal');

      if (!error && vaultSecret && typeof vaultSecret === 'string' && vaultSecret.trim().length >= 15) {
        const cleanKey = vaultSecret.trim();
        this.cachedApiKey = cleanKey;
        this.cachedSource = 'vault';
        this.cachedLast4 = cleanKey.slice(-4);
        this.cacheExpiry = now + this.CACHE_TTL_MS;

        return cleanKey;
      }
    } catch {
      // Supabase Vault no disponible o sin conexión directa
    }

    // 3. Fallback de desarrollo: process.env.OPENAI_API_KEY (Prioridad 2)
    const envKey = process.env.OPENAI_API_KEY?.trim();
    if (envKey && envKey.length >= 15 && !envKey.includes('REPLACE_WITH')) {
      this.cachedApiKey = envKey;
      this.cachedSource = 'environment';
      this.cachedLast4 = envKey.slice(-4);
      this.cacheExpiry = now + this.CACHE_TTL_MS;

      return envKey;
    }

    // 4. Si no existe en Vault ni en entorno: Falla Segura sin degradación del resto del sistema
    this.invalidateCache();
    throw new Error('AI_PROVIDER_UNAVAILABLE: No existe ninguna OpenAI API Key configurada en Supabase Vault ni en variables de entorno.');
  }

  /**
   * Obtiene la metadata no sensible para el frontend / Super Admin UI
   * NUNCA retorna la clave en texto plano ni el valor descifrado.
   */
  public async getMetadata(): Promise<SecretMetadata> {
    let configured = false;
    let active = false;
    let last4: string | null = null;
    let lastTestedAt: string | null = null;
    let lastTestStatus: string | null = null;
    let source: 'vault' | 'environment' | 'none' = 'none';

    try {
      // Consultar tabla de configuración pública de metadatos
      const { data, error } = await supabaseAdmin
        .from('ai_provider_settings')
        .select('*')
        .eq('provider', 'openai')
        .maybeSingle();

      if (!error && data) {
        configured = Boolean(data.is_configured);
        active = Boolean(data.ai_enabled);
        last4 = data.key_last4 || null;
        lastTestedAt = data.last_tested_at || null;
        lastTestStatus = data.last_test_status || null;
        if (configured) {
          source = 'vault';
        }
      }
    } catch {
      // Fallback
    }

    // Si hay override en memoria o variable de entorno, reflejar en metadata
    if (!configured && this.cachedLast4) {
      configured = true;
      last4 = this.cachedLast4;
      source = this.cachedSource;
    } else if (!configured && process.env.OPENAI_API_KEY?.trim()?.length) {
      configured = true;
      last4 = process.env.OPENAI_API_KEY.trim().slice(-4);
      source = 'environment';
    }

    const maskedKey = last4 ? `••••••••••••••••${last4}` : null;

    return {
      provider: 'openai',
      configured,
      active,
      maskedKey,
      lastTestedAt,
      lastTestStatus,
      source,
    };
  }

  /**
   * Invalida inmediatamente la caché en memoria al rotar o eliminar la clave
   */
  public invalidateCache(): void {
    this.cachedApiKey = null;
    this.cacheExpiry = 0;
    this.cachedLast4 = '';
  }

  /**
   * Permite inyectar override temporal para pruebas automatizadas
   */
  public setTestOverride(key: string | null): void {
    if (key) {
      this.cachedApiKey = key;
      this.cachedSource = 'vault';
      this.cachedLast4 = key.slice(-4);
      this.cacheExpiry = Date.now() + 60 * 60 * 1000;
    } else {
      this.invalidateCache();
    }
  }
}

export const openAiSecretResolver = OpenAiSecretResolver.getInstance();
