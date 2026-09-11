// ==============================================================================
// HIPOTECALY TASADOR IA - GESTOR DE CICLO DE VIDA TEMPORAL DE PUBLICACIONES
// Regla Absoluta: Desaparición != Venta (ACTIVE -> MISSING_TEMPORARILY -> SOLD_OR_REMOVED_UNKNOWN)
// ==============================================================================

import { ListingStatus } from '../types/tasadorPipelineTypes';

export interface ListingLifecycleState {
  listingId: string;
  sourceCode: string;
  status: ListingStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  missingSince?: string | null;
  missingCount: number;
  statusReason: string;
}

export class ListingLifecycleManager {
  private states: Map<string, ListingLifecycleState> = new Map();

  public markSeen(listingId: string, sourceCode: string, explicitSold: boolean = false): ListingLifecycleState {
    const now = new Date().toISOString();
    const existing = this.states.get(listingId);

    if (!existing) {
      const newState: ListingLifecycleState = {
        listingId,
        sourceCode,
        status: explicitSold ? 'CONFIRMED_SOLD' : 'ACTIVE',
        firstSeenAt: now,
        lastSeenAt: now,
        missingSince: null,
        missingCount: 0,
        statusReason: explicitSold ? 'Marcado como vendido por la fuente' : 'Publicación activa detectada en descubrimiento',
      };
      this.states.set(listingId, newState);
      return newState;
    }

    if (explicitSold) {
      existing.status = 'CONFIRMED_SOLD';
      existing.statusReason = 'Marcado explícitamente como vendido en la fuente';
    } else {
      existing.status = 'ACTIVE';
      existing.lastSeenAt = now;
      existing.missingSince = null;
      existing.missingCount = 0;
      existing.statusReason = 'Publicación activa confirmada';
    }

    return existing;
  }

  public markMissing(listingId: string): ListingLifecycleState | null {
    const existing = this.states.get(listingId);
    if (!existing) return null;

    const now = new Date().toISOString();
    existing.missingCount += 1;
    if (!existing.missingSince) {
      existing.missingSince = now;
    }

    if (existing.missingCount === 1) {
      existing.status = 'MISSING_TEMPORARILY';
      existing.statusReason = 'No encontrada en la última ejecución de crawling (estado temporal)';
    } else if (existing.missingCount >= 3) {
      existing.status = 'SOLD_OR_REMOVED_UNKNOWN';
      existing.statusReason = `No encontrada en ${existing.missingCount} ejecuciones consecutivas (retirada de portal o finalizada)`;
    }

    return existing;
  }

  public getState(listingId: string): ListingLifecycleState | undefined {
    return this.states.get(listingId);
  }

  public getAllStates(): ListingLifecycleState[] {
    return Array.from(this.states.values());
  }
}
