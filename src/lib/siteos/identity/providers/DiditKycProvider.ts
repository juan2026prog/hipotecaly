// ==============================================================================
// SITEOS KYC DIDIT: Adaptador Oficial para Didit Verification API v3
// Soporta Hosted Flow, Modos Mock, Sandbox y Live, y Webhooks X-Signature-V2
// ==============================================================================

import {
  KycDecision,
  KycMode,
  KycProvider,
  KycSession,
  KycSessionInput,
  KycWebhookResult,
} from '../types';

import { normalizeDiditStatus } from '../stateMachine';

export interface DiditConfig {
  baseUrl?: string;
  apiKey?: string;
  workflowId?: string;
  webhookSecret?: string;
  mode?: KycMode;
}

export class DiditKycProvider implements KycProvider {
  public readonly name = 'didit';
  private baseUrl: string;
  private apiKey: string;
  private workflowId: string;
  private webhookSecret: string;
  private mode: KycMode;

  constructor(config: DiditConfig = {}) {
    this.baseUrl = (config.baseUrl || process.env.DIDIT_BASE_URL || 'https://verification.didit.me').replace(/\/$/, '');
    this.apiKey = config.apiKey || process.env.DIDIT_API_KEY || '';
    this.workflowId = config.workflowId || process.env.DIDIT_WORKFLOW_ID || '';
    this.webhookSecret = config.webhookSecret || process.env.DIDIT_WEBHOOK_SECRET || '';
    this.mode = config.mode || (process.env.KYC_MODE as KycMode) || 'mock';
  }

  public async createSession(input: KycSessionInput): Promise<KycSession> {
    // Modo DEMO explícito (para Estudio Nova / presentaciones)
    if (this.mode === 'mock') {
      const mockId = `didit_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      return {
        id: mockId,
        sessionId: mockId,
        sessionUrl: `/mi-cuenta?didit_mock_session=${mockId}&caseId=${input.caseId || ''}`,
        provider: 'didit',
        mode: 'mock',
        status: 'created',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        metadata: {
          simulated: true,
          demoKyc: true,
          vendorData: input.vendorData || input.caseId,
          endUserId: input.endUserId || input.userId,
          workflowId: this.workflowId || 'default-didit-workflow',
        },
      };
    }

    // En modo real/producción: si no hay API Key o Workflow ID, arrojar error explícito
    if (!this.apiKey) {
      throw new Error('KYC_NO_CONFIGURADO: DIDIT_API_KEY no está configurada.');
    }

    const workflow = this.workflowId || (input.metadata?.workflowId as string);
    if (!workflow) {
      throw new Error('KYC_NO_CONFIGURADO: DIDIT_WORKFLOW_ID no está configurado.');
    }

    // Identificador interno opaco para vendor_data (nunca PII)
    const opaqueVendorData = input.vendorData || input.caseId || `kyc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const payload: Record<string, unknown> = {
      workflow_id: workflow,
      vendor_data: opaqueVendorData,
    };

    if (input.callbackUrl) {
      payload.callback = input.callbackUrl;
    }

    const response = await fetch(`${this.baseUrl}/v3/session/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.message || errJson?.error || `Didit API Error: HTTP ${response.status}`);
    }

    const json = await response.json();
    const sessionId = json.session_id || json.id;
    const sessionUrl = json.url;

    return {
      id: sessionId,
      sessionId,
      sessionUrl,
      provider: 'didit',
      mode: this.mode,
      status: normalizeDiditStatus(json.status || 'Created'),
      createdAt: json.created_at || new Date().toISOString(),
      metadata: {
        workflowId: json.workflow_id || workflow,
        status: json.status,
        mode: this.mode,
      },
    };
  }

  public async getSession(sessionId: string): Promise<KycSession> {
    if (this.mode === 'mock' || sessionId.startsWith('didit_mock_') || sessionId.startsWith('didit_fallback_')) {
      return {
        id: sessionId,
        sessionId,
        sessionUrl: `/mi-cuenta?didit_mock_session=${sessionId}`,
        provider: 'didit',
        mode: 'mock',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
      };
    }

    if (!this.apiKey) {
      throw new Error('KYC_NO_CONFIGURADO: Proveedor Didit no configurado.');
    }

    const response = await fetch(`${this.baseUrl}/v3/session/${encodeURIComponent(sessionId)}/`, {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al consultar sesión de Didit: HTTP ${response.status}`);
    }

    const json = await response.json();
    return {
      id: json.session_id || sessionId,
      sessionId: json.session_id || sessionId,
      sessionUrl: json.url,
      provider: 'didit',
      mode: this.mode,
      status: normalizeDiditStatus(json.status),
      createdAt: json.created_at || new Date().toISOString(),
      metadata: json,
    };
  }

  public async getDecision(sessionId: string): Promise<KycDecision> {
    if (!this.apiKey || sessionId.startsWith('didit_mock_') || sessionId.startsWith('didit_fallback_')) {
      return {
        id: `dec_${sessionId}`,
        sessionId,
        status: 'verified',
        providerStatus: 'Approved',
        decisionCode: 'MOCK_DIDIT_APPROVED',
        reason: 'Decisión simulada de Didit Mock/Sandbox',
        completedAt: new Date().toISOString(),
        checks: {
          documentValid: true,
          selfieMatch: true,
          liveness: true,
          pepSanctions: false,
          ageValid: true,
        },
      };
    }

    const response = await fetch(`${this.baseUrl}/v3/session/${encodeURIComponent(sessionId)}/decision/`, {
      method: 'GET',
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al consultar decisión de Didit: HTTP ${response.status}`);
    }

    const json = await response.json();
    const rawStatus = json.status || 'In Review';
    const status = normalizeDiditStatus(rawStatus);

    return {
      id: `dec_${sessionId}`,
      sessionId,
      status,
      providerStatus: rawStatus,
      decisionCode: json.decision_code,
      reason: json.reason,
      completedAt: json.updated_at || json.created_at || new Date().toISOString(),
      checks: {
        documentValid: status === 'verified',
        selfieMatch: status === 'verified',
        liveness: status === 'verified',
      },
      metadata: json,
    };
  }

  public async handleWebhook(
    rawBody: string | Buffer | Record<string, unknown>,
    _headers: Record<string, string | undefined>
  ): Promise<KycWebhookResult> {
    const payload = typeof rawBody === 'string'
      ? JSON.parse(rawBody)
      : (Buffer.isBuffer(rawBody) ? JSON.parse(rawBody.toString('utf-8')) : rawBody);

    const sessionId = (payload as any)?.session_id || (payload as any)?.sessionId || (payload as any)?.id;
    const rawStatus = (payload as any)?.status || (payload as any)?.action || (payload as any)?.event;
    const status = normalizeDiditStatus(rawStatus);

    const decision: KycDecision = {
      id: `dec_${sessionId}`,
      sessionId,
      status,
      providerStatus: rawStatus,
      decisionCode: (payload as any)?.decision_code || (payload as any)?.code,
      reason: (payload as any)?.reason,
      completedAt: new Date().toISOString(),
      checks: {
        documentValid: status === 'verified',
        selfieMatch: status === 'verified',
        liveness: status === 'verified',
      },
      metadata: payload as Record<string, unknown>,
    };

    return {
      handled: true,
      eventId: (payload as any)?.event_id || `evt_didit_${sessionId}_${Date.now()}`,
      sessionId,
      status,
      decision,
    };
  }

  public async verifyWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | undefined>
  ): Promise<boolean> {
    if (this.mode === 'mock' || !this.webhookSecret) {
      return true;
    }

    const signature = headers['x-signature-v2'] || headers['X-Signature-V2'] || headers['x-signature'] || '';
    if (!signature) {
      return false;
    }

    try {
      const crypto = await import('crypto');
      const bodyStr = Buffer.isBuffer(rawBody)
        ? rawBody.toString('utf-8')
        : (typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));

      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(bodyStr);
      const calculatedHex = hmac.digest('hex');

      const bufCalculated = Buffer.from(calculatedHex, 'hex');
      const bufReceived = Buffer.from(signature, 'hex');

      if (bufCalculated.length !== bufReceived.length) {
        return false;
      }

      return crypto.timingSafeEqual(bufCalculated, bufReceived);
    } catch {
      return false;
    }
  }
}
