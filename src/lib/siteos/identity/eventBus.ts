// ==============================================================================
// SITEOS IDENTITY CORE: Event Bus Interno Desacoplado
// ==============================================================================

import { KycDecision, KycSession, KycStatus } from './types';

export type IdentityEventType =
  | 'identity.session.created'
  | 'identity.verification.started'
  | 'identity.verification.pending_review'
  | 'identity.verification.approved'
  | 'identity.verification.declined'
  | 'identity.verification.resubmission_required'
  | 'identity.verification.expired'
  | 'identity.verification.abandoned';

export interface IdentityEventPayload {
  eventId: string;
  eventType: IdentityEventType;
  tenantId: string;
  userId?: string;
  caseId?: string;
  sessionId: string;
  provider: string;
  status: KycStatus;
  timestamp: string;
  decision?: KycDecision;
  session?: KycSession;
  metadata?: Record<string, unknown>;
}

export type IdentityEventHandler = (event: IdentityEventPayload) => Promise<void> | void;

class IdentityEventBus {
  private handlers: Map<IdentityEventType | '*', Set<IdentityEventHandler>> = new Map();

  public subscribe(eventType: IdentityEventType | '*', handler: IdentityEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  public async emit(event: IdentityEventPayload): Promise<void> {
    const specificHandlers = this.handlers.get(event.eventType) || new Set();
    const wildcardHandlers = this.handlers.get('*') || new Set();

    const allHandlers = [...specificHandlers, ...wildcardHandlers];
    await Promise.all(
      allHandlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (err) {
          console.error(`[IdentityEventBus] Error executing handler for ${event.eventType}:`, err);
        }
      })
    );
  }
}

export const identityEventBus = new IdentityEventBus();
