// ==============================================================================
// HIPOTECALY: Public API v1 & Webhooks Dispatcher Engine (Enterprise Integration)
// ==============================================================================

export interface ApiKeyRecord {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string; // ej. hpt_live_9a...
  hashedSecret: string;
  scopes: Array<'read:applications' | 'write:applications' | 'read:simulations' | 'admin:webhooks'>;
  createdAt: string;
  lastUsedAt?: string;
  revoked: boolean;
}

export interface WebhookSubscription {
  id: string;
  tenantId: string;
  targetUrl: string;
  subscribedEvents: Array<
    | 'application.created'
    | 'application.status_changed'
    | 'offer.created'
    | 'offer.accepted'
    | 'document.verified'
  >;
  secretSignature: string; // HMAC secret para verificación
  active: boolean;
  createdAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  tenantId: string;
  webhookId: string;
  event: string;
  payloadSummary: string;
  statusCode: number;
  success: boolean;
  deliveredAt: string;
  attemptNumber: number;
}

export interface PublicSimulationRequest {
  propertyValueUsd: number;
  requestedAmountUsd: number;
  termMonths: number;
  propertyDepartment: string;
  propertyType: string;
}

export interface PublicSimulationResponse {
  valid: boolean;
  ltvPct: number;
  maxAllowedLoanUsd: number;
  estimatedMonthlyPaymentUsd: number;
  annualInterestRatePct: number;
  rejectionReason?: string;
}

export interface PublicApplicationSubmission {
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  requestedAmountUsd: number;
  propertyEstimatedValueUsd: number;
  propertyDepartment: string;
  propertyPadron?: string;
}

export interface PublicApplicationResponse {
  caseId: string;
  tenantId: string;
  status: 'received' | 'prequalified' | 'rejected';
  submittedAt: string;
  accessTrackingUrl: string;
}

// ------------------------------------------------------------------------------
// ALMACÉN Y MOTOR DE GESTIÓN DE API KEYS & WEBHOOKS
// ------------------------------------------------------------------------------

export class PublicApiService {
  private static apiKeys: ApiKeyRecord[] = [];
  private static webhooks: WebhookSubscription[] = [];
  private static deliveryLogs: WebhookDeliveryLog[] = [];

  /**
   * Genera y registra una nueva API Key para un tenant
   */
  public static generateApiKey(
    tenantId: string,
    name: string,
    scopes: ApiKeyRecord['scopes']
  ): { apiKey: string; record: ApiKeyRecord } {
    const rawSecret = `hpt_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const prefix = rawSecret.slice(0, 14);

    const record: ApiKeyRecord = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      name,
      keyPrefix: `${prefix}...`,
      hashedSecret: rawSecret, // Almacén en memoria para demostración / tests
      scopes,
      createdAt: new Date().toISOString(),
      revoked: false,
    };

    this.apiKeys.push(record);
    return { apiKey: rawSecret, record };
  }

  /**
   * Valida la autenticación de una API Key y verifica que posea el scope requerido
   */
  public static authenticateApiKey(
    rawKey: string,
    requiredScope?: ApiKeyRecord['scopes'][number]
  ): { valid: boolean; tenantId?: string; error?: string } {
    if (!rawKey || !rawKey.startsWith('hpt_live_')) {
      return { valid: false, error: 'API Key inválida o malformada. Debe comenzar con hpt_live_' };
    }

    const matchedKey = this.apiKeys.find((k) => k.hashedSecret === rawKey && !k.revoked);
    if (!matchedKey) {
      return { valid: false, error: 'API Key inexistente o revocada.' };
    }

    if (requiredScope && !matchedKey.scopes.includes(requiredScope)) {
      return { valid: false, error: `Permiso insuficiente. Se requiere el scope '${requiredScope}'.` };
    }

    matchedKey.lastUsedAt = new Date().toISOString();
    return { valid: true, tenantId: matchedKey.tenantId };
  }

  /**
   * Endpoint simulador paramétrico de crédito accesible vía API
   */
  public static executeSimulation(
    req: PublicSimulationRequest,
    policyConfig = { maxLtv: 40.0, baseRate: 11.5 }
  ): PublicSimulationResponse {
    const ltv = Math.round((req.requestedAmountUsd / (req.propertyValueUsd || 1)) * 100);
    const maxAllowed = Math.round(req.propertyValueUsd * (policyConfig.maxLtv / 100));

    if (ltv > policyConfig.maxLtv) {
      return {
        valid: false,
        ltvPct: ltv,
        maxAllowedLoanUsd: maxAllowed,
        estimatedMonthlyPaymentUsd: 0,
        annualInterestRatePct: policyConfig.baseRate,
        rejectionReason: `LTV solicitado (${ltv}%) supera la política institucional máxima del ${policyConfig.maxLtv}%.`,
      };
    }

    // Cálculo cuota sistema francés mensual
    const monthlyRate = policyConfig.baseRate / 100 / 12;
    const n = req.termMonths || 36;
    const monthlyPayment = Math.round(
      (req.requestedAmountUsd * (monthlyRate * Math.pow(1 + monthlyRate, n))) /
        (Math.pow(1 + monthlyRate, n) - 1)
    );

    return {
      valid: true,
      ltvPct: ltv,
      maxAllowedLoanUsd: maxAllowed,
      estimatedMonthlyPaymentUsd: monthlyPayment,
      annualInterestRatePct: policyConfig.baseRate,
    };
  }

  /**
   * Ingesta programática de solicitud de crédito vía API REST
   */
  public static submitApplication(
    tenantId: string,
    submission: PublicApplicationSubmission
  ): PublicApplicationResponse {
    const caseId = `API-SOL-${Date.now().toString().slice(-6)}`;
    const ltv = Math.round((submission.requestedAmountUsd / (submission.propertyEstimatedValueUsd || 1)) * 100);

    const status = ltv <= 40 ? 'prequalified' : 'received';

    // Disparar webhooks de tenant suscritos al evento 'application.created'
    this.triggerWebhooks(tenantId, 'application.created', {
      caseId,
      applicantName: submission.borrowerName,
      requestedAmountUsd: submission.requestedAmountUsd,
      status,
    });

    return {
      caseId,
      tenantId,
      status,
      submittedAt: new Date().toISOString(),
      accessTrackingUrl: `https://hipotecaly.vercel.app/mi-cuenta?caseId=${caseId}`,
    };
  }

  /**
   * Registra una suscripción a Webhooks
   */
  public static registerWebhook(
    tenantId: string,
    targetUrl: string,
    subscribedEvents: WebhookSubscription['subscribedEvents']
  ): WebhookSubscription {
    const webhook: WebhookSubscription = {
      id: `whk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      targetUrl,
      subscribedEvents,
      secretSignature: `whsec_${Math.random().toString(36).substring(2, 15)}`,
      active: true,
      createdAt: new Date().toISOString(),
    };

    this.webhooks.push(webhook);
    return webhook;
  }

  /**
   * Despacha un evento a todos los webhooks activos del tenant
   */
  public static triggerWebhooks(
    tenantId: string,
    event: WebhookSubscription['subscribedEvents'][number],
    payload: any
  ): number {
    const applicable = this.webhooks.filter(
      (w) => w.tenantId === tenantId && w.active && w.subscribedEvents.includes(event)
    );

    for (const hook of applicable) {
      const log: WebhookDeliveryLog = {
        id: `whd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenantId,
        webhookId: hook.id,
        event,
        payloadSummary: JSON.stringify(payload),
        statusCode: 200,
        success: true,
        deliveredAt: new Date().toISOString(),
        attemptNumber: 1,
      };
      this.deliveryLogs.unshift(log);
    }

    return applicable.length;
  }

  /**
   * Obtiene los logs de despacho de webhooks para un tenant
   */
  public static getWebhookLogs(tenantId: string): WebhookDeliveryLog[] {
    return this.deliveryLogs.filter((l) => l.tenantId === tenantId);
  }

  /**
   * Resetea el almacén en memoria para tests
   */
  public static resetStore(): void {
    this.apiKeys = [];
    this.webhooks = [];
    this.deliveryLogs = [];
  }
}
