// ==============================================================================
// SITEOS IDENTITY CORE: Proveedor MOCK para Entorno de Desarrollo y Tests
// Simulación completa de captura de cédula/documento, selfie, liveness y decisiones
// ==============================================================================

import {
  KycDecision,
  KycProvider,
  KycSession,
  KycSessionInput,
  KycStatus,
  KycWebhookResult,
} from '../types';

interface SimulatedSessionState {
  session: KycSession;
  decision: KycDecision;
  input: KycSessionInput;
}

export class MockKycProvider implements KycProvider {
  public readonly name = 'mock';
  private sessions: Map<string, SimulatedSessionState> = new Map();

  constructor() {
    // Sesión de prueba preconfigurada
    const defaultId = 'mock-sess-demo-001';
    this.sessions.set(defaultId, {
      session: {
        id: defaultId,
        sessionId: defaultId,
        sessionUrl: `/mi-cuenta?kyc_mock_session=${defaultId}`,
        provider: 'mock',
        mode: 'mock',
        status: 'verified',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      decision: {
        id: `mock-dec-${defaultId}`,
        sessionId: defaultId,
        status: 'verified',
        providerStatus: 'approved',
        decisionCode: 'MOCK_APPROVED',
        reason: 'Verificación simulada exitosa en entorno de desarrollo/QA',
        completedAt: new Date().toISOString(),
        checks: {
          documentValid: true,
          selfieMatch: true,
          liveness: true,
          pepSanctions: false,
          ageValid: true,
        },
      },
      input: {
        tenantId: 'a0000000-0000-0000-0000-000000000001',
      },
    });
  }

  public async createSession(input: KycSessionInput): Promise<KycSession> {
    const sessionId = `mock_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionUrl = `/mi-cuenta?kyc_mock_session=${sessionId}&caseId=${input.caseId || ''}`;
    
    const session: KycSession = {
      id: sessionId,
      sessionId,
      sessionUrl,
      provider: 'mock',
      mode: 'mock',
      status: 'created',
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      metadata: {
        isMock: true,
        vendorData: input.vendorData,
        endUserId: input.endUserId,
        tenantId: input.tenantId,
        caseId: input.caseId,
      },
    };

    const decision: KycDecision = {
      id: `mock_dec_${sessionId}`,
      sessionId,
      status: 'created',
      providerStatus: 'pending',
      checks: {
        documentValid: false,
        selfieMatch: false,
        liveness: false,
      },
    };

    this.sessions.set(sessionId, { session, decision, input });
    return session;
  }

  public async getSession(sessionId: string): Promise<KycSession> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      // Devolver sesión generada al vuelo para robustez en tests
      return {
        id: sessionId,
        sessionId,
        sessionUrl: `/mi-cuenta?kyc_mock_session=${sessionId}`,
        provider: 'mock',
        mode: 'mock',
        status: 'verified',
        createdAt: new Date().toISOString(),
      };
    }
    return state.session;
  }

  public async getDecision(sessionId: string): Promise<KycDecision> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      return {
        id: `mock_dec_${sessionId}`,
        sessionId,
        status: 'verified',
        providerStatus: 'approved',
        decisionCode: 'MOCK_APPROVED',
        reason: 'Verificación simulada al vuelo.',
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
    return state.decision;
  }

  /**
   * Permite forzar el estado para pruebas y automatizaciones de QA
   */
  public forceSessionResult(
    sessionId: string,
    forcedStatus: KycStatus,
    reason?: string
  ): KycDecision {
    let state = this.sessions.get(sessionId);
    if (!state) {
      const session: KycSession = {
        id: sessionId,
        sessionId,
        sessionUrl: `/mi-cuenta?kyc_mock_session=${sessionId}`,
        provider: 'mock',
        mode: 'mock',
        status: forcedStatus,
        createdAt: new Date().toISOString(),
      };
      state = {
        session,
        decision: {
          id: `mock_dec_${sessionId}`,
          sessionId,
          status: forcedStatus,
        },
        input: { tenantId: 'a0000000-0000-0000-0000-000000000001' },
      };
      this.sessions.set(sessionId, state);
    }

    state.session.status = forcedStatus;
    const isApproved = forcedStatus === 'verified';
    const isReview = forcedStatus === 'pending_review';

    state.decision = {
      id: `mock_dec_${sessionId}`,
      sessionId,
      status: forcedStatus,
      providerStatus: isApproved ? 'approved' : forcedStatus,
      decisionCode: isApproved ? 'MOCK_APPROVED' : `MOCK_${forcedStatus.toUpperCase()}`,
      reason: reason || (isApproved ? 'Verificación mock aprobada' : `Simulación de resultado: ${forcedStatus}`),
      completedAt: new Date().toISOString(),
      checks: {
        documentValid: isApproved || isReview,
        selfieMatch: isApproved,
        liveness: isApproved,
        pepSanctions: false,
        ageValid: true,
      },
    };

    return state.decision;
  }

  public async handleWebhook(
    rawBody: string | Buffer | Record<string, unknown>,
    _headers: Record<string, string | undefined>
  ): Promise<KycWebhookResult> {
    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const sessionId = (payload as any)?.sessionId || (payload as any)?.id || 'mock_sess_demo';
    const action = (payload as any)?.action || (payload as any)?.status || 'approved';
    const status: KycStatus = action === 'approved' ? 'verified' : (action as KycStatus);

    const decision = this.forceSessionResult(sessionId, status, (payload as any)?.reason);

    return {
      handled: true,
      eventId: `mock_evt_${Date.now()}`,
      sessionId,
      status,
      decision,
    };
  }

  public async verifyWebhook(
    _rawBody: string | Buffer,
    _headers: Record<string, string | undefined>
  ): Promise<boolean> {
    return true; // En mock siempre es válida
  }
}
