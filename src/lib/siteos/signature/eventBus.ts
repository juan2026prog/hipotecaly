// ==============================================================================
// SITEOS SIGNATURE CORE: Event Bus Interno de Firma Digital
// ==============================================================================

import { SignatureProcess, SignatureStatus, SignedDocument } from './types';

export type SignatureEventType =
  | 'signature.process.created'
  | 'signature.process.prepared'
  | 'signature.signer.notified'
  | 'signature.signer.opened'
  | 'signature.signer.completed'
  | 'signature.signer.rejected'
  | 'signature.process.partially_signed'
  | 'signature.process.completed'
  | 'signature.process.rejected'
  | 'signature.process.expired'
  | 'signature.process.cancelled';

export interface SignatureEventPayload {
  eventId: string;
  eventType: SignatureEventType;
  tenantId: string;
  caseId: string;
  processId: string;
  provider: string;
  status: SignatureStatus;
  timestamp: string;
  signerIndex?: number;
  signerEmail?: string;
  documents?: SignedDocument[];
  process?: SignatureProcess;
  metadata?: Record<string, unknown>;
}

export type SignatureEventHandler = (event: SignatureEventPayload) => Promise<void> | void;

class SignatureEventBus {
  private handlers: Map<SignatureEventType | '*', Set<SignatureEventHandler>> = new Map();

  public subscribe(eventType: SignatureEventType | '*', handler: SignatureEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  public async emit(event: SignatureEventPayload): Promise<void> {
    const specificHandlers = this.handlers.get(event.eventType) || new Set();
    const wildcardHandlers = this.handlers.get('*') || new Set();

    const allHandlers = [...specificHandlers, ...wildcardHandlers];
    await Promise.all(
      allHandlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (err) {
          console.error(`[SignatureEventBus] Error executing handler for ${event.eventType}:`, err);
        }
      })
    );
  }
}

export const signatureEventBus = new SignatureEventBus();
