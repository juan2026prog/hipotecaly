import { test, expect } from '@playwright/test';
import {
  getAllModules,
  getActiveModuleIdsForTenant,
  hasTenantEntitlement,
  enableTenantModule,
  disableTenantModule,
  resetTenantEntitlementsCache,
} from '../src/lib/moduleCatalogService';

test.describe('MACROFASE 5: TENANT MODULE ENTITLEMENTS & ACCESS CONTROL', () => {

  const testTenantId = 'tenant-test-entitlement-001';

  test.beforeEach(() => {
    resetTenantEntitlementsCache(testTenantId);
  });

  test('1. Catálogo Completo: Todos los módulos tienen ID, categoría y tier definidos', async () => {
    const modules = getAllModules();
    expect(modules.length).toBeGreaterThanOrEqual(18);

    for (const mod of modules) {
      expect(mod.id).toBeTruthy();
      expect(mod.name).toBeTruthy();
      expect(mod.category).toBeTruthy();
      expect(['included', 'addon', 'enterprise', 'coming_soon']).toContain(mod.tier);
    }
  });

  test('2. Tenant nuevo recibe automáticamente todos los módulos INCLUDED', async () => {
    const activeIds = await getActiveModuleIdsForTenant(testTenantId);
    expect(activeIds.length).toBeGreaterThan(0);

    // Módulos Core & Originación deben estar activos
    expect(activeIds).toContain('core_tenancy');
    expect(activeIds).toContain('origination_simulator');
    expect(activeIds).toContain('capital_antibypass');
  });

  test('3. Verificación de Entitlement activo vs inactivo', async () => {
    // Included está activo
    const hasCore = await hasTenantEntitlement(testTenantId, 'core_tenancy');
    expect(hasCore).toBe(true);

    // Enterprise SSO por defecto NO está activo para un tenant estándar
    const hasSSO = await hasTenantEntitlement(testTenantId, 'enterprise_sso');
    expect(hasSSO).toBe(false);
  });

  test('4. Activación en caliente de un Add-On para un tenant', async () => {
    const initial = await hasTenantEntitlement(testTenantId, 'capital_syndication');
    expect(initial).toBe(false);

    // Activar add-on de sindicación
    const res = await enableTenantModule(testTenantId, 'capital_syndication');
    expect(res.success).toBe(true);

    const after = await hasTenantEntitlement(testTenantId, 'capital_syndication');
    expect(after).toBe(true);
  });

});
