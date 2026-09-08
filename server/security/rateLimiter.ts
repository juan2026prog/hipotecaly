// ==============================================================================
// HIPOTECALY SERVER: Rate Limiter Token-Bucket en Memoria (Cero Costo SaaS)
// Protección contra abusos, ataques DoS y fuerza bruta en APIs y endpoints
// ==============================================================================

export interface RateLimitOptions {
  windowMs: number; // Ventana de tiempo en milisegundos
  maxRequests: number; // Máximo de peticiones permitidas en la ventana
  identifierKey?: string; // Clave personalizada de identificación
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class ServerRateLimiter {
  private static store = new Map<string, RateLimitRecord>();
  private static lastCleanup = Date.now();

  /**
   * Extrae la IP del cliente o el identificador más confiable de la solicitud
   */
  public static getClientIdentifier(req: any, prefix = 'ip'): string {
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const ip = typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0].trim()
      : (req.socket?.remoteAddress || req.ip || '127.0.0.1');

    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const apiKey = req.headers?.['x-api-key'];

    if (prefix === 'apikey' && apiKey) {
      return `apikey:${String(apiKey).slice(0, 16)}`;
    }

    if (prefix === 'auth' && authHeader) {
      return `auth:${String(authHeader).slice(-16)}`;
    }

    return `${prefix}:${ip}`;
  }

  /**
   * Verifica si la petición excede el límite de tasa permitido
   * Retorna { allowed: boolean, remaining: number, resetInSeconds: number }
   */
  public static checkLimit(
    identifier: string,
    options: RateLimitOptions
  ): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetInSeconds: number;
  } {
    const now = Date.now();

    // Limpieza periódica de registros vencidos cada 5 minutos
    if (now - this.lastCleanup > 300000) {
      this.cleanup();
      this.lastCleanup = now;
    }

    const key = `${identifier}:${options.windowMs}`;
    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      // Nuevo ciclo de conteo
      this.store.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });

      return {
        allowed: true,
        limit: options.maxRequests,
        remaining: options.maxRequests - 1,
        resetInSeconds: Math.ceil(options.windowMs / 1000),
      };
    }

    if (record.count >= options.maxRequests) {
      // Límite excedido
      const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      return {
        allowed: false,
        limit: options.maxRequests,
        remaining: 0,
        resetInSeconds,
      };
    }

    // Incrementar contador
    record.count += 1;
    const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

    return {
      allowed: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - record.count,
      resetInSeconds,
    };
  }

  /**
   * Middleware helper para aplicar rate limit y setear cabeceras estándar
   */
  public static applyRateLimit(
    req: any,
    res: any,
    options: RateLimitOptions,
    scopePrefix = 'ip'
  ): boolean {
    const identifier = options.identifierKey || this.getClientIdentifier(req, scopePrefix);
    const result = this.checkLimit(identifier, options);

    // Cabeceras estándar IETF RateLimit
    res.setHeader('X-RateLimit-Limit', String(result.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(result.resetInSeconds));

    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.resetInSeconds));
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Has superado el límite de solicitudes permitidas. Por favor, intenta más tarde.',
        retryAfterSeconds: result.resetInSeconds,
      });
      return false; // Denegado
    }

    return true; // Permitido
  }

  /**
   * Limpia registros expirados de memoria
   */
  private static cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
  }

  public static clearAll(): void {
    this.store.clear();
  }
}
