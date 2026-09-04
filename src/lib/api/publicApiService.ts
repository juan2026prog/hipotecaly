// ==============================================================================
// HIPOTECALY: Public API v1 & Webhooks Integration Client
// Delegación directa al motor Enterprise con CSPRNG y HMAC-SHA256 Real
// ==============================================================================

import { EnterpriseApiKeyService, ApiKeyScope } from '../../../server/enterprise/apiKeyService';
import { EnterpriseWebhookDispatcher, WebhookEntity, DeliveryAttemptResult } from '../../../server/enterprise/webhookDispatcher';

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
  status: 'received' | 'prequalified' | 'submitted';
  submittedAt: string;
  accessTrackingUrl: string;
}

export class PublicApiService {
  /**
   * Genera un API Key criptográficamente seguro utilizando CSPRNG (crypto.randomBytes)
   * y persiste únicamente su hash SHA-256.
   */
  public static async generateApiKey(
    tenantId: string,
    name: string,
    scopes: ApiKeyScope[]
  ): Promise<{ apiKey: string; record: any }> {
    const res = await EnterpriseApiKeyService.createApiKey({
      tenantId,
      name,
      scopes,
    });

    return {
      apiKey: res.rawKey,
      record: res.metadata,
    };
  }

  /**
   * Valida la autenticación de una clave mediante SHA-256 y control de scopes
   */
  public static async authenticateApiKey(
    rawKey: string,
    requiredScope?: ApiKeyScope
  ): Promise<{ valid: boolean; tenantId?: string; error?: string }> {
    const auth = await EnterpriseApiKeyService.authenticateApiKey(rawKey, requiredScope);
    return {
      valid: auth.authenticated,
      tenantId: auth.tenantId,
      error: auth.error,
    };
  }

  /**
   * Simulación paramétrica institucional
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
   * Ingesta programática de solicitud de crédito
   */
  public static async submitApplication(
    tenantId: string,
    submission: PublicApplicationSubmission
  ): Promise<PublicApplicationResponse> {
    const caseId = `API-SOL-${Date.now().toString().slice(-6)}`;
    const ltv = Math.round((submission.requestedAmountUsd / (submission.propertyEstimatedValueUsd || 1)) * 100);
    const status = ltv <= 40 ? 'prequalified' : 'submitted';

    // Despachar webhook real con HMAC
    await EnterpriseWebhookDispatcher.dispatchTenantEvent(tenantId, 'application.created', {
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
   * Registra un webhook con secreto de firma HMAC-SHA256 generado con CSPRNG
   */
  public static async registerWebhook(
    tenantId: string,
    targetUrl: string,
    subscribedEvents: string[]
  ): Promise<WebhookEntity> {
    return await EnterpriseWebhookDispatcher.registerWebhook({
      tenantId,
      url: targetUrl,
      events: subscribedEvents,
    });
  }

  /**
   * Dispara webhooks del tenant y retorna los resultados reales de entrega
   */
  public static async triggerWebhooks(
    tenantId: string,
    event: string,
    payload: any
  ): Promise<DeliveryAttemptResult[]> {
    return await EnterpriseWebhookDispatcher.dispatchTenantEvent(tenantId, event, payload);
  }

  /**
   * Obtiene la bitácora de entregas reales de webhooks
   */
  public static getWebhookLogs(webhookId?: string): DeliveryAttemptResult[] {
    return EnterpriseWebhookDispatcher.getDeliveryLogs(webhookId);
  }

  /**
   * Resetea almacén para tests
   */
  public static resetStore(): void {
    EnterpriseApiKeyService.clearCache();
    EnterpriseWebhookDispatcher.clearCache();
  }
}
