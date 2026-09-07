// ==============================================================================
// SERVER SIGNATURE: AGESIC API Manager Gateway Auth Provider
// Maneja autenticación perimetral independiente de la clave de proceso
// Modos: 'none' | 'bearer' | 'oauth2_client_credentials'
// ==============================================================================

export type ApiManagerAuthMode = 'none' | 'bearer' | 'oauth2_client_credentials';

export interface GatewayAuthConfig {
  authMode?: ApiManagerAuthMode;
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  bearerToken?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

export class FirmaGubGatewayAuthProvider {
  private authMode: ApiManagerAuthMode;
  private tokenUrl?: string;
  private clientId?: string;
  private clientSecret?: string;
  private scope?: string;
  private bearerToken?: string;
  private cachedToken: CachedToken | null = null;

  constructor(config: GatewayAuthConfig = {}) {
    this.authMode =
      config.authMode ||
      (process.env.FIRMA_GUB_API_MANAGER_AUTH_MODE as ApiManagerAuthMode) ||
      'none';
    this.tokenUrl =
      config.tokenUrl || process.env.FIRMA_GUB_API_MANAGER_TOKEN_URL;
    this.clientId =
      config.clientId || process.env.FIRMA_GUB_API_MANAGER_CLIENT_ID;
    this.clientSecret =
      config.clientSecret || process.env.FIRMA_GUB_API_MANAGER_CLIENT_SECRET;
    this.scope =
      config.scope || process.env.FIRMA_GUB_API_MANAGER_SCOPE;
    this.bearerToken =
      config.bearerToken ||
      process.env.FIRMA_GUB_API_MANAGER_BEARER_TOKEN ||
      process.env.FIRMA_GUB_API_MANAGER_CLIENT_SECRET;
  }

  public isConfigured(): boolean {
    if (this.authMode === 'none') return true;
    if (this.authMode === 'bearer') return Boolean(this.bearerToken);
    if (this.authMode === 'oauth2_client_credentials') {
      return Boolean(this.tokenUrl && this.clientId && this.clientSecret);
    }
    return false;
  }

  public getAuthMode(): ApiManagerAuthMode {
    return this.authMode;
  }

  public clearCache(): void {
    this.cachedToken = null;
  }

  private pendingRefreshPromise: Promise<string> | null = null;

  /**
   * Obtiene o renueva el token de acceso OAuth2 Client Credentials
   */
  public async getAccessToken(): Promise<string | null> {
    if (this.authMode === 'none') {
      return null;
    }

    if (this.authMode === 'bearer') {
      return this.bearerToken || null;
    }

    if (this.authMode === 'oauth2_client_credentials') {
      const now = Date.now();
      // Si tenemos un token válido en caché con más de 30 segundos de vigencia
      if (this.cachedToken && this.cachedToken.expiresAtMs > now + 30000) {
        return this.cachedToken.accessToken;
      }

      // Si ya hay una solicitud de token en curso, reutilizar la misma promesa
      if (this.pendingRefreshPromise) {
        return this.pendingRefreshPromise;
      }

      if (!this.tokenUrl || !this.clientId || !this.clientSecret) {
        throw new Error(
          '[FirmaGubGatewayAuthProvider] Faltan variables para OAuth2 Client Credentials (tokenUrl, clientId, clientSecret).'
        );
      }

      this.pendingRefreshPromise = (async () => {
        try {
          const bodyParams = new URLSearchParams();
          bodyParams.append('grant_type', 'client_credentials');
          bodyParams.append('client_id', this.clientId!);
          bodyParams.append('client_secret', this.clientSecret!);
          if (this.scope) {
            bodyParams.append('scope', this.scope);
          }

          const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

          const res = await fetch(this.tokenUrl!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${basicAuth}`,
            },
            body: bodyParams.toString(),
          });

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(
              `[FirmaGubGatewayAuthProvider] Error solicitando token OAuth2 HTTP ${res.status}: ${errorText}`
            );
          }

          const json = (await res.json()) as {
            access_token?: string;
            token_type?: string;
            expires_in?: number;
          };

          if (!json.access_token) {
            throw new Error('[FirmaGubGatewayAuthProvider] Respuesta de token inválida (no contiene access_token)');
          }

          const expiresInSeconds = typeof json.expires_in === 'number' ? json.expires_in : 3600;
          this.cachedToken = {
            accessToken: json.access_token,
            expiresAtMs: Date.now() + expiresInSeconds * 1000,
          };

          return this.cachedToken.accessToken;
        } finally {
          this.pendingRefreshPromise = null;
        }
      })();

      return this.pendingRefreshPromise;
    }

    return null;
  }

  /**
   * Obtiene los headers requeridos por el API Manager Gateway
   */
  public async getGatewayHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    if (!token) {
      return {};
    }

    return {
      'X-Gateway-Authorization': `Bearer ${token}`,
      'X-API-Manager-Token': token,
    };
  }
}
