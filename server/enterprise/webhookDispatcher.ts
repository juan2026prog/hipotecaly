// ==============================================================================
// HIPOTECALY SERVER: Enterprise Webhook Dispatcher (Real HMAC-SHA256, SSRF Safe)
// ==============================================================================

import crypto from 'crypto';
import { supabaseAdmin } from '../supabase.js';

export interface WebhookRegistrationParams {
  tenantId: string;
  url: string;
  events: string[];
}

export interface WebhookEntity {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  signingSecret: string;
  isActive: boolean;
  active?: boolean;
  createdAt: string;
}

export interface DeliveryAttemptResult {
  webhookId: string;
  tenantId?: string;
  eventId: string;
  eventType: string;
  event?: string;
  statusCode?: number;
  success: boolean;
  attemptNumber: number;
  durationMs: number;
  errorMessage?: string;
  deliveredAt: string;
}

export class EnterpriseWebhookDispatcher {
  private static webhooksCache = new Map<string, WebhookEntity>();
  private static deliveryLogsCache: DeliveryAttemptResult[] = [];

  /**
   * Valida una URL para prevenir ataques Server-Side Request Forgery (SSRF)
   */
  public static validateUrlForSsrf(urlString: string): { valid: boolean; reason?: string } {
    try {
      const parsed = new URL(urlString);

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, reason: 'Solo se admiten protocolos HTTP o HTTPS.' };
      }

      // En producción, forzar HTTPS y bloquear direcciones internas o privadas
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd && parsed.protocol !== 'https:') {
        return { valid: false, reason: 'En entorno de producción los Webhooks deben utilizar HTTPS estricto.' };
      }

      const hostname = parsed.hostname.toLowerCase();

      // Bloquear rangos de loopback, metadatos de nube y redes privadas
      const isPrivateOrLoopback =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('169.254.') || // AWS/GCP metadata
        (hostname.startsWith('172.') &&
          parseInt(hostname.split('.')[1], 10) >= 16 &&
          parseInt(hostname.split('.')[1], 10) <= 31);

      if (isProd && isPrivateOrLoopback) {
        return { valid: false, reason: 'La URL apunta a un rango de red privada o loopback no autorizado (SSRF Protection).' };
      }

      return { valid: true };
    } catch {
      return { valid: false, reason: 'URL malformada.' };
    }
  }

  /**
   * Registra un nuevo webhook con generación CSPRNG del secreto de firma HMAC
   */
  public static async registerWebhook(params: WebhookRegistrationParams): Promise<WebhookEntity> {
    const check = this.validateUrlForSsrf(params.url);
    if (!check.valid) {
      throw new Error(`URL de Webhook inválida: ${check.reason}`);
    }

    const webhookId = `whk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const signingSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const secretHash = crypto.createHash('sha256').update(signingSecret).digest('hex');
    const nowIso = new Date().toISOString();

    const entity: WebhookEntity = {
      id: webhookId,
      tenantId: params.tenantId,
      url: params.url,
      events: params.events,
      signingSecret,
      isActive: true,
      active: true,
      createdAt: nowIso,
    };

    // 1. Persistir en Supabase
    try {
      await supabaseAdmin.from('tenant_webhooks').insert({
        id: webhookId,
        tenant_id: params.tenantId,
        url: params.url,
        events: params.events,
        secret_hash: secretHash,
        signing_secret: signingSecret,
        is_active: true,
        created_at: nowIso,
      });
    } catch {
      // Fallback a caché
    }

    this.webhooksCache.set(webhookId, entity);
    return entity;
  }

  /**
   * Calcula la firma HMAC-SHA256 con protección contra ataques de repetición (timestamped signature)
   */
  public static generateHmacSignature(signingSecret: string, timestamp: number, payloadString: string): string {
    const signaturePayload = `${timestamp}.${payloadString}`;
    return crypto.createHmac('sha256', signingSecret).update(signaturePayload).digest('hex');
  }

  /**
   * Despacha un evento HTTP real a un webhook configurado con timeout, reintentos y registro forense
   */
  public static async dispatchEventToWebhook(
    webhook: WebhookEntity,
    eventType: string,
    payload: any,
    maxRetries = 2
  ): Promise<DeliveryAttemptResult> {
    const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateHmacSignature(webhook.signingSecret, timestamp, payloadString);

    let lastResult: DeliveryAttemptResult = {
      webhookId: webhook.id,
      eventId,
      eventType,
      success: false,
      attemptNumber: 1,
      durationMs: 0,
      deliveredAt: new Date().toISOString(),
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Hipotecaly-Signature': `t=${timestamp},v1=${signature}`,
            'X-Hipotecaly-Event-Id': eventId,
            'X-Hipotecaly-Event-Type': eventType,
            'X-Hipotecaly-Delivery-Attempt': String(attempt),
            'User-Agent': 'Hipotecaly-Webhook-Dispatcher/1.0',
          },
          body: payloadString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;
        const success = res.status >= 200 && res.status < 300;

        lastResult = {
          webhookId: webhook.id,
          tenantId: webhook.tenantId,
          eventId,
          eventType,
          event: eventType,
          statusCode: res.status,
          success,
          attemptNumber: attempt,
          durationMs,
          errorMessage: success ? undefined : `HTTP Error ${res.status}: ${res.statusText}`,
          deliveredAt: new Date().toISOString(),
        };

        if (success) {
          break; // Salida exitosa en este intento
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        const durationMs = Date.now() - startTime;
        lastResult = {
          webhookId: webhook.id,
          tenantId: webhook.tenantId,
          eventId,
          eventType,
          event: eventType,
          statusCode: 0,
          success: false,
          attemptNumber: attempt,
          durationMs,
          errorMessage: err.name === 'AbortError' ? 'Timeout excedido (5000ms)' : (err.message || 'Error de red'),
          deliveredAt: new Date().toISOString(),
        };
      }
    }

    // Registrar en Supabase y caché
    try {
      await supabaseAdmin.from('webhook_deliveries').insert({
        tenant_id: webhook.tenantId,
        webhook_id: webhook.id,
        event_type: eventType,
        event_id: eventId,
        payload_summary: payloadString.slice(0, 300),
        status_code: lastResult.statusCode,
        success: lastResult.success,
        attempt_count: lastResult.attemptNumber,
        error_message: lastResult.errorMessage,
        delivered_at: lastResult.deliveredAt,
      });
    } catch {
      // Ignorar fallback
    }

    this.deliveryLogsCache.unshift(lastResult);
    return lastResult;
  }

  /**
   * Despacha un evento a todos los webhooks activos suscritos de un tenant
   */
  public static async dispatchTenantEvent(
    tenantId: string,
    eventType: string,
    payload: any
  ): Promise<DeliveryAttemptResult[]> {
    const results: DeliveryAttemptResult[] = [];

    // 1. Obtener webhooks desde BD o caché
    let webhooks: WebhookEntity[] = Array.from(this.webhooksCache.values()).filter(
      (w) => w.tenantId === tenantId && w.isActive && w.events.includes(eventType)
    );

    if (webhooks.length === 0) {
      try {
        const { data, error } = await supabaseAdmin
          .from('tenant_webhooks')
          .select('id, tenant_id, url, events, signing_secret, is_active, created_at')
          .eq('tenant_id', tenantId)
          .eq('is_active', true);

        if (!error && data) {
          for (const row of data) {
            if (row.events.includes(eventType)) {
              const entity: WebhookEntity = {
                id: row.id,
                tenantId: row.tenant_id,
                url: row.url,
                events: row.events,
                signingSecret: row.signing_secret,
                isActive: row.is_active,
                createdAt: row.created_at,
              };
              this.webhooksCache.set(row.id, entity);
              webhooks.push(entity);
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    for (const webhook of webhooks) {
      const res = await this.dispatchEventToWebhook(webhook, eventType, payload);
      results.push(res);
    }

    return results;
  }

  public static getDeliveryLogs(filterId?: string): DeliveryAttemptResult[] {
    if (!filterId) return [...this.deliveryLogsCache];
    return this.deliveryLogsCache.filter((l) => l.webhookId === filterId || l.tenantId === filterId);
  }

  public static clearCache(): void {
    this.webhooksCache.clear();
    this.deliveryLogsCache = [];
  }
}
