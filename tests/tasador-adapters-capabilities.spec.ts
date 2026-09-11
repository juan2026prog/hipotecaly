// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE ADAPTADORES Y CAPABILITIES
// Verificación de las 20 Fuentes, Clasificación Formal, HealthChecks y Feature Flags
// ==============================================================================

import { test, expect } from '@playwright/test';
import { AdapterRegistry } from '../src/lib/tasador/adapters/AdapterRegistry';
import { InfoCasasAdapter } from '../src/lib/tasador/adapters/InfoCasasAdapter';
import { MercadoLibreAdapter } from '../src/lib/tasador/adapters/MercadoLibreAdapter';
import { RemaxAdapter } from '../src/lib/tasador/adapters/RemaxAdapter';
import { BlockedSourceAdapter } from '../src/lib/tasador/adapters/BlockedSourceAdapter';

test.describe('TASADOR IA - ADAPTADORES Y GOBERNANZA DE 20 FUENTES', () => {
  const registry = AdapterRegistry.getInstance();

  test('Req 01: Registro exacto de las 20 fuentes inmobiliarias uruguayas', () => {
    const adapters = registry.getAllAdapters();
    expect(adapters.length).toBe(20);

    const codes = adapters.map((a) => a.sourceCode);
    expect(codes).toContain('mercadolibre_uy');
    expect(codes).toContain('infocasas');
    expect(codes).toContain('gallito_uy');
    expect(codes).toContain('remax_uy');
    expect(codes).toContain('engel_volkers_uy');
    expect(codes).toContain('sothebys_uy');
    expect(codes).toContain('acs_uy');
    expect(codes).toContain('kosak_uy');
    expect(codes).toContain('meikle_uy');
    expect(codes).toContain('caldeiro_uy');
    expect(codes).toContain('pallares_bruzzone_uy');
    expect(codes).toContain('bado_asociados_uy');
    expect(codes).toContain('braglia_uy');
    expect(codes).toContain('canepa_uy');
    expect(codes).toContain('nicolas_modena_uy');
    expect(codes).toContain('nieto_paez_uy');
    expect(codes).toContain('terramar_uy');
    expect(codes).toContain('puntamar_uy');
    expect(codes).toContain('century21_uy');
    expect(codes).toContain('varela_uy');
  });

  test('Req 02: Clasificación formal de capabilities de cada fuente', () => {
    const infocasas = registry.getAdapter('infocasas');
    expect(infocasas?.capability).toBe('PUBLIC_STRUCTURED_ENDPOINT');

    const gallito = registry.getAdapter('gallito_uy');
    expect(gallito?.capability).toBe('BLOCKED');

    const nieto = registry.getAdapter('nieto_paez_uy');
    expect(nieto?.capability).toBe('BLOCKED');

    const sothebys = registry.getAdapter('sothebys_uy');
    expect(sothebys?.capability).toBe('REQUIRES_AUTHORIZATION');

    const pallares = registry.getAdapter('pallares_bruzzone_uy');
    expect(pallares?.capability).toBe('NOT_SUPPORTED');
  });

  test('Req 03: Fuentes bloqueadas no intentan bypass y retornan estado seguro', async () => {
    const gallito = registry.getAdapter('gallito_uy') as BlockedSourceAdapter;
    expect(gallito).toBeDefined();

    const health = await gallito.healthCheck();
    expect(health.healthy).toBe(false);
    expect(health.status).toBe('BLOCKED');
    expect(health.message).toContain('No se realiza bypass');

    const discovered = await gallito.discoverListings();
    expect(discovered.length).toBe(0);
  });

  test('Req 04: Control independiente de feature flags por fuente', () => {
    registry.updateFlags('infocasas', { ingestionEnabled: true, dryRun: false });
    const caps = registry.getAdapter('infocasas')?.getCapabilities();
    expect(caps?.ingestionEnabled).toBe(true);
    expect(caps?.dryRun).toBe(false);

    // Revertir a safe
    registry.updateFlags('infocasas', { ingestionEnabled: false, dryRun: true });
    expect(registry.getAdapter('infocasas')?.ingestionEnabled).toBe(false);
  });

  test('Req 05: Instanciación correcta de adaptadores especializados', () => {
    expect(registry.getAdapter('infocasas')).toBeInstanceOf(InfoCasasAdapter);
    expect(registry.getAdapter('mercadolibre_uy')).toBeInstanceOf(MercadoLibreAdapter);
    expect(registry.getAdapter('remax_uy')).toBeInstanceOf(RemaxAdapter);
    expect(registry.getAdapter('gallito_uy')).toBeInstanceOf(BlockedSourceAdapter);
  });
});
