// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE CICLO DE VIDA TEMPORAL
// Regla Absoluta: Desaparición != Venta (ACTIVE -> MISSING_TEMPORARILY -> SOLD_OR_REMOVED_UNKNOWN)
// ==============================================================================

import { test, expect } from '@playwright/test';
import { ListingLifecycleManager } from '../src/lib/tasador/lifecycle/ListingLifecycleManager';

test.describe('TASADOR IA - CICLO DE VIDA TEMPORAL DE PUBLICACIONES', () => {

  test('Req 01: Publicación recién descubierta inicia en estado ACTIVE', () => {
    const manager = new ListingLifecycleManager();
    const state = manager.markSeen('list_01', 'infocasas');

    expect(state.status).toBe('ACTIVE');
    expect(state.missingCount).toBe(0);
    expect(state.missingSince).toBeNull();
  });

  test('Req 02: Publicación ausente en 1 ejecución pasa a MISSING_TEMPORARILY (No SOLD)', () => {
    const manager = new ListingLifecycleManager();
    manager.markSeen('list_01', 'infocasas');

    const stateAfter1Miss = manager.markMissing('list_01');
    expect(stateAfter1Miss?.status).toBe('MISSING_TEMPORARILY');
    expect(stateAfter1Miss?.missingCount).toBe(1);
    expect(stateAfter1Miss?.missingSince).not.toBeNull();
    // NUNCA debe marcarse como SOLD
    expect(stateAfter1Miss?.status).not.toBe('CONFIRMED_SOLD');
  });

  test('Req 03: Publicación ausente en múltiples ejecuciones pasa a SOLD_OR_REMOVED_UNKNOWN', () => {
    const manager = new ListingLifecycleManager();
    manager.markSeen('list_01', 'infocasas');

    manager.markMissing('list_01'); // 1
    manager.markMissing('list_01'); // 2
    const finalState = manager.markMissing('list_01'); // 3

    expect(finalState?.status).toBe('SOLD_OR_REMOVED_UNKNOWN');
    expect(finalState?.missingCount).toBe(3);
  });

  test('Req 04: Publicación reaparecida se reactiva automáticamente a ACTIVE', () => {
    const manager = new ListingLifecycleManager();
    manager.markSeen('list_01', 'infocasas');
    manager.markMissing('list_01');
    manager.markMissing('list_01');

    const reactivated = manager.markSeen('list_01', 'infocasas');
    expect(reactivated.status).toBe('ACTIVE');
    expect(reactivated.missingCount).toBe(0);
    expect(reactivated.missingSince).toBeNull();
  });

  test('Req 05: Solo se marca CONFIRMED_SOLD ante evidencia explícita de la fuente', () => {
    const manager = new ListingLifecycleManager();
    const state = manager.markSeen('list_02', 'infocasas', true); // explicit sold

    expect(state.status).toBe('CONFIRMED_SOLD');
    expect(state.statusReason).toContain('vendido');
  });
});
