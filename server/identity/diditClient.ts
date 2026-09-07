// ==============================================================================
// SERVER IDENTITY: Cliente HTTP Oficial y Centralizado para Didit API v3
// Endpoint Base: https://verification.didit.me
// ==============================================================================

export interface DiditCreateSessionInput {
  workflowId?: string;
  vendorData: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface DiditSessionResponse {
  session_id: string;
  url: string;
  status?: string;
  workflow_id?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface DiditDecisionResponse {
  session_id: string;
  status: string; // 'Approved' | 'Declined' | 'In Review' | 'Resubmitted' | etc.
  decision_code?: string;
  reason?: string;
  created_at?: string;
  updated_at?: string;
  reviews?: Array<{
    type?: string;
    status?: string;
    result?: string;
  }>;
  [key: string]: unknown;
}

export class DiditClient {
  private baseUrl: string;
  private apiKey: string;
  private defaultWorkflowId: string;
  private timeoutMs: number;

  constructor(config?: {
    baseUrl?: string;
    apiKey?: string;
    workflowId?: string;
    timeoutMs?: number;
  }) {
    this.baseUrl = (
      config?.baseUrl ||
      process.env.DIDIT_BASE_URL ||
      'https://verification.didit.me'
    ).replace(/\/$/, '');
    this.apiKey = config?.apiKey || process.env.DIDIT_API_KEY || '';
    this.defaultWorkflowId = config?.workflowId || process.env.DIDIT_WORKFLOW_ID || '';
    this.timeoutMs = config?.timeoutMs || 15000;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Crea una sesión de verificación Hosted Flow en Didit API v3
   * POST https://verification.didit.me/v3/session/
   */
  public async createSession(input: DiditCreateSessionInput): Promise<DiditSessionResponse> {
    if (!this.isConfigured()) {
      throw new Error('[DiditClient] DIDIT_API_KEY no configurada.');
    }

    const workflowId = input.workflowId || this.defaultWorkflowId;
    if (!workflowId) {
      throw new Error('[DiditClient] DIDIT_WORKFLOW_ID no configurado.');
    }

    const payload: Record<string, unknown> = {
      workflow_id: workflowId,
      vendor_data: input.vendorData,
    };

    if (input.callbackUrl) {
      payload.callback = input.callbackUrl;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v3/session/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        let parsedMessage = errorBody;
        try {
          const errJson = JSON.parse(errorBody);
          parsedMessage = errJson.message || errJson.error || JSON.stringify(errJson);
        } catch {}
        throw new Error(`[Didit API Error ${response.status}] ${parsedMessage}`);
      }

      const json = await response.json();
      return json as DiditSessionResponse;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`[DiditClient] Timeout al conectar con ${this.baseUrl}/v3/session/ tras ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  /**
   * Consulta el estado de decisión de una sesión (Decision API / Polling / Reconciliation)
   * GET https://verification.didit.me/v3/session/{session_id}/decision/
   */
  public async getDecision(sessionId: string): Promise<DiditDecisionResponse> {
    if (!this.isConfigured()) {
      throw new Error('[DiditClient] DIDIT_API_KEY no configurada.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v3/session/${encodeURIComponent(sessionId)}/decision/`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`[Didit API Error ${response.status}] ${errorBody}`);
      }

      const json = await response.json();
      return json as DiditDecisionResponse;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`[DiditClient] Timeout al consultar decisión para sesión ${sessionId}`);
      }
      throw err;
    }
  }

  /**
   * Consulta los detalles de una sesión
   * GET https://verification.didit.me/v3/session/{session_id}/
   */
  public async getSession(sessionId: string): Promise<DiditSessionResponse> {
    if (!this.isConfigured()) {
      throw new Error('[DiditClient] DIDIT_API_KEY no configurada.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/v3/session/${encodeURIComponent(sessionId)}/`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`[Didit API Error ${response.status}] ${errorBody}`);
      }

      const json = await response.json();
      return json as DiditSessionResponse;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`[DiditClient] Timeout al consultar sesión ${sessionId}`);
      }
      throw err;
    }
  }
}
