// ==============================================================================
// SITEOS IDENTITY CORE: Tipos e Interfaces Provider-Agnostic para KYC
// ==============================================================================

export type KycStatus =
  | 'created'
  | 'in_progress'
  | 'pending_review'
  | 'verified'
  | 'failed'
  | 'resubmission_required'
  | 'expired'
  | 'abandoned';

export type KycMode = 'mock' | 'test' | 'live';

export interface KycSessionInput {
  tenantId: string;
  userId?: string;
  caseId?: string;
  callbackUrl?: string;
  returnUrl?: string;
  vendorData?: string;
  endUserId?: string;
  documentType?: 'CI' | 'PASSPORT' | 'DNI' | 'DRIVERS_LICENSE';
  country?: string; // 'UY', 'AR', etc.
  metadata?: Record<string, unknown>;
}

export interface KycSession {
  id: string;
  sessionId: string;
  sessionUrl?: string;
  provider: string;
  mode: KycMode;
  status: KycStatus;
  expiresAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface KycDecisionChecks {
  documentValid?: boolean;
  selfieMatch?: boolean;
  liveness?: boolean;
  pepSanctions?: boolean;
  ageValid?: boolean;
}

export interface KycDecision {
  id: string;
  sessionId: string;
  status: KycStatus;
  providerStatus?: string;
  decisionCode?: string;
  reasonCode?: string;
  reason?: string;
  completedAt?: string;
  checks?: KycDecisionChecks;
  metadata?: Record<string, unknown>;
}

export interface KycWebhookResult {
  handled: boolean;
  eventId?: string;
  sessionId?: string;
  status?: KycStatus;
  decision?: KycDecision;
  duplicate?: boolean;
  reason?: string;
}

export interface KycProvider {
  name: string;
  createSession(input: KycSessionInput): Promise<KycSession>;
  getSession(sessionId: string): Promise<KycSession>;
  getDecision(sessionId: string): Promise<KycDecision>;
  handleWebhook(
    rawBody: string | Buffer | Record<string, unknown>,
    headers: Record<string, string | undefined>
  ): Promise<KycWebhookResult>;
  verifyWebhook(
    rawBody: string | Buffer,
    headers: Record<string, string | undefined>
  ): Promise<boolean>;
}

export interface IdentityConsentInput {
  userId?: string;
  tenantId: string;
  caseId?: string;
  consentVersion: string;
  purpose: string;
  provider: string;
  ipAddress?: string;
  userAgent?: string;
}
