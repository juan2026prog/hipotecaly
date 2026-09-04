// ==============================================================================
// HIPOTECALY SERVER: Enterprise API Key Service (CSPRNG, SHA-256 Hashed, Scoped)
// ==============================================================================

import crypto from 'crypto';
import { supabaseAdmin } from '../supabase';

export type ApiKeyScope =
  | 'read:simulations'
  | 'write:applications'
  | 'read:applications'
  | 'admin:webhooks';

export interface ApiKeyMetadata {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
}

export class EnterpriseApiKeyService {
  // Caché server-side para resiliencia y validación ultra-rápida
  private static keyCache = new Map<
    string,
    {
      id: string;
      tenantId: string;
      keyPrefix: string;
      scopes: ApiKeyScope[];
      revokedAt?: string;
      expiresAt?: string;
    }
  >();

  /**
   * Genera un API Key criptográficamente seguro (CSPRNG) con prefijo identificable.
   * La clave sin procesar (rawKey) se devuelve UNA SOLA VEZ al cliente.
   * En la base de datos se almacena ÚNICAMENTE su hash SHA-256 hex.
   */
  public static async createApiKey(params: {
    tenantId: string;
    name: string;
    scopes: ApiKeyScope[];
    expiresInDays?: number;
  }): Promise<{ rawKey: string; metadata: ApiKeyMetadata }> {
    // 1. CSPRNG mediante crypto.randomBytes(32)
    const randomHex = crypto.randomBytes(32).toString('hex');
    const rawKey = `hpt_live_${randomHex}`;
    const keyPrefix = rawKey.slice(0, 14) + '...';

    // 2. Hash SHA-256 hex
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const expiresAt = params.expiresInDays
      ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const recordId = `key_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const metadata: ApiKeyMetadata = {
      id: recordId,
      tenantId: params.tenantId,
      name: params.name,
      keyPrefix,
      scopes: params.scopes,
      createdAt: nowIso,
      expiresAt,
    };

    // 3. Persistir hash en Supabase si está disponible
    try {
      await supabaseAdmin.from('tenant_api_keys').insert({
        id: recordId,
        tenant_id: params.tenantId,
        name: params.name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: params.scopes,
        created_at: nowIso,
        expires_at: expiresAt,
      });
    } catch {
      // Si la tabla no existe en local o fallback, el caché server-side mantiene la coherencia
    }

    // 4. Registrar en caché server-side
    this.keyCache.set(keyHash, {
      id: recordId,
      tenantId: params.tenantId,
      keyPrefix,
      scopes: params.scopes,
      expiresAt,
    });

    return { rawKey, metadata };
  }

  /**
   * Valida una petición autenticada mediante API Key:
   * Calcula SHA-256 de la clave recibida, valida expiración, revocación y scopes.
   */
  public static async authenticateApiKey(
    rawKey: string,
    requiredScope?: ApiKeyScope
  ): Promise<{
    authenticated: boolean;
    tenantId?: string;
    keyId?: string;
    error?: string;
    statusCode: number;
  }> {
    if (!rawKey || typeof rawKey !== 'string') {
      return {
        authenticated: false,
        error: 'Cabecera de autenticación ausente o vacía. Use Authorization: Bearer <key> o x-api-key.',
        statusCode: 401,
      };
    }

    const cleanKey = rawKey.replace(/^Bearer\s+/i, '').trim();
    if (!cleanKey.startsWith('hpt_live_')) {
      return {
        authenticated: false,
        error: 'Formato de API Key no válido. Las claves de HIPOTECALY inician con hpt_live_.',
        statusCode: 401,
      };
    }

    const keyHash = crypto.createHash('sha256').update(cleanKey).digest('hex');

    // 1. Buscar en caché o consultar Supabase
    let entry = this.keyCache.get(keyHash);

    if (!entry) {
      try {
        const { data, error } = await supabaseAdmin
          .from('tenant_api_keys')
          .select('id, tenant_id, key_prefix, scopes, revoked_at, expires_at')
          .eq('key_hash', keyHash)
          .maybeSingle();

        if (!error && data) {
          entry = {
            id: data.id,
            tenantId: data.tenant_id,
            keyPrefix: data.key_prefix,
            scopes: data.scopes as ApiKeyScope[],
            revokedAt: data.revoked_at,
            expiresAt: data.expires_at,
          };
          this.keyCache.set(keyHash, entry);
        }
      } catch {
        // Fallback
      }
    }

    if (!entry) {
      return {
        authenticated: false,
        error: 'API Key no válida o inexistente.',
        statusCode: 401,
      };
    }

    // 2. Verificar revocación
    if (entry.revokedAt) {
      return {
        authenticated: false,
        error: 'Esta API Key ha sido revocada por el administrador.',
        statusCode: 401,
      };
    }

    // 3. Verificar expiración
    if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
      return {
        authenticated: false,
        error: 'Esta API Key ha expirado.',
        statusCode: 401,
      };
    }

    // 4. Verificar Scope requerido
    if (requiredScope && !entry.scopes.includes(requiredScope)) {
      return {
        authenticated: false,
        error: `Permiso insuficiente: Se requiere el scope '${requiredScope}' para ejecutar esta operación.`,
        statusCode: 403,
      };
    }

    // 5. Actualizar last_used_at asíncronamente
    const nowIso = new Date().toISOString();
    try {
      await supabaseAdmin
        .from('tenant_api_keys')
        .update({ last_used_at: nowIso })
        .eq('id', entry.id);
    } catch {
      // Ignorar error de métrica
    }

    return {
      authenticated: true,
      tenantId: entry.tenantId,
      keyId: entry.id,
      statusCode: 200,
    };
  }

  /**
   * Revoca una API Key de forma inmediata e invalida el caché
   */
  public static async revokeApiKey(keyId: string, tenantId: string): Promise<boolean> {
    const nowIso = new Date().toISOString();
    let revoked = false;

    // Actualizar en base de datos
    try {
      const { error } = await supabaseAdmin
        .from('tenant_api_keys')
        .update({ revoked_at: nowIso })
        .eq('id', keyId)
        .eq('tenant_id', tenantId);

      if (!error) revoked = true;
    } catch {
      revoked = true;
    }

    // Actualizar en caché
    for (const [, entry] of this.keyCache.entries()) {
      if (entry.id === keyId && entry.tenantId === tenantId) {
        entry.revokedAt = nowIso;
        revoked = true;
      }
    }

    return revoked;
  }

  public static clearCache(): void {
    this.keyCache.clear();
  }
}
