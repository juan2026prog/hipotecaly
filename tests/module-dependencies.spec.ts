import { test, expect } from '@playwright/test';
import {
  canEnableModule,
  enableTenantModule,
  disableTenantModule,
  resetTenantEntitlementsCache,
} from '../src/lib/moduleCatalogService';

test.describe('MACROFASE 5: MODULE DEPENDENCY GRAPH & ACTIVATION RULES', () => {

  const testTenantId = 'tenant-test-deps-002';

  test.beforeEach(() => {
    resetTenantEntitlementsCache(testTenantId);
  });

  test('1. Bloqueo de activación de módulos Coming Soon (Roadmap)', async () => {
    const check = await canEnableModule(testTenantId, 'integrations_dgr_registry');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Coming Soon');

    const activateRes = await enableTenantModule(testTenantId, 'integrations_dgr_registry');
    expect(activateRes.success).toBe(false);
  });

  test('2. Validación exitosa de activación cuando dependencias están satisfechas', async () => {
    // capital_syndication depende de capital_lender_portal (que es included)
    const check = await canEnableModule(testTenantId, 'capital_syndication');
    expect(check.allowed).toBe(true);
    expect(check.missingDependencies.length).toBe(0);

    const activate = await enableTenantModule(testTenantId, 'capital_syndication');
    expect(activate.success).toBe(true);
  });

  test('3. Prevención de desactivación de módulo si otros módulos dependen de él', async () => {
    // Activar sindicación (que depende de capital_lender_portal)
    await enableTenantModule(testTenantId, 'capital_syndication');

    // Intentar desactivar capital_lender_portal debe fallar
    const disableRes = await disableTenantModule(testTenantId, 'capital_lender_portal');
    expect(disableRes.success).toBe(false);
    expect(disableRes.error).toContain('dependen de él');
    expect(disableRes.dependents?.length).toBeGreaterThan(0);
  });

  test('4. Desactivación exitosa cuando ningún módulo activo depende de él', async () => {
    // Activar sindicación
    await enableTenantModule(testTenantId, 'capital_syndication');

    // Desactivar sindicación directamente
    const disableRes = await disableTenantModule(testTenantId, 'capital_syndication');
    expect(disableRes.success).toBe(true);
  });

});
