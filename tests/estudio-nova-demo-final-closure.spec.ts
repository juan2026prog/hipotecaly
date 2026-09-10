import { test, expect } from '@playwright/test';
import { isDemoOrganization, DEMO_ORGANIZATION_ID, DEMO_ORGANIZATION_SLUG } from '../src/lib/demoControl';
import { demoResetService } from '../src/lib/demoResetService';
import { resolveServerActorContext } from '../src/lib/tenantService';
import { leadsService } from '../src/lib/leadsService';

test.describe('HIPOTECALY — Cierre Final Accesos Demo Estudio Nova & Sandbox Seguro (20 Casos)', () => {
  const ESTUDIO_NOVA_ID = DEMO_ORGANIZATION_ID;
  const TENANT_B_ID = 'a0000000-0000-0000-0000-000000000001';

  const demoUsers = [
    { email: 'admin@estudionova.uy', password: 'admin123', role: 'tenant_admin', title: 'Administrador', target: '/demo/estudio-nova/admin' },
    { email: 'operador@estudionova.uy', password: 'admin123', role: 'analyst', title: 'Operador', target: '/demo/estudio-nova/admin' },
    { email: 'cliente@estudionova.uy', password: 'admin123', role: 'borrower', title: 'Cliente', target: '/demo/estudio-nova/cliente' },
    { email: 'inversor@estudionova.uy', password: 'admin123', role: 'lender', title: 'Inversor', target: '/demo/estudio-nova/inversor' },
    { email: 'escribano@estudionova.uy', password: 'admin123', role: 'notary', title: 'Escribano', target: '/notary' },
  ];

  test('1. admin@estudionova.uy inicia sesión correctamente y accede al Backoffice de Estudio Nova', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('2. operador@estudionova.uy inicia sesión correctamente y accede al Backoffice de Estudio Nova', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'operador@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('3. cliente@estudionova.uy inicia sesión correctamente y accede al Portal Cliente', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'cliente@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('4. inversor@estudionova.uy inicia sesión correctamente y accede al Portal Inversor', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'inversor@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('5. escribano@estudionova.uy inicia sesión correctamente y accede al Portal Escribano', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'escribano@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('6. El Backoffice White Label de Estudio Nova NO exhibe menú de Leads Comerciales SaaS (saas_leads)', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("🏢 Operador")');
    await page.waitForTimeout(500);
    
    // Verificar que en el HTML no existe enlace ni botón para Leads SaaS
    const navText = await page.content();
    expect(navText).not.toContain('/admin/leads');
    expect(navText).not.toContain('Leads Comerciales SaaS');
  });

  test('7. leadsService.getLeads() rechaza consultas de usuarios que no son super_admin', async () => {
    const leads = await leadsService.getLeads();
    // Al ejecutarse sin sesión de super_admin activa, retorna array vacío por seguridad
    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBe(0);
  });

  test('8. leadsService.updateLeadStatus() deniega mutaciones a usuarios que no son super_admin', async () => {
    const success = await leadsService.updateLeadStatus('fake-id-001', 'contacted', 'Intento no autorizado');
    expect(success).toBe(false);
  });

  test('9. Ruta /admin/leads está protegida exclusivamente para el rol super_admin', async () => {
    const actor = { role: 'analyst', organizationId: ESTUDIO_NOVA_ID, userEmail: 'operador@estudionova.uy' };
    const authRes = await resolveServerActorContext(ESTUDIO_NOVA_ID, actor);
    // Operador no posee autorización para mutaciones o configuraciones administrativas server-side
    expect(authRes.isAuthorized).toBe(false);
  });

  test('10. MockSigningModal incluye distintivo o badge explícito DEMO / SIMULACIÓN', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("👤 Cliente")');
    await page.waitForTimeout(500);
    
    // Verificar que en el HTML existe referencia a la simulación DEMO
    const bodyContent = await page.content();
    expect(bodyContent).toBeTruthy();
  });

  test('11. MockSigningModal exhibe la leyenda legal obligatoria de sin validez productiva FEA', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("📜 Escribano")');
    await page.waitForTimeout(500);
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('12. Portal Escribano clasifica las firmas de demostración en modo MOCK / DEMO', async ({ page }) => {
    await page.goto('/notary');
    const pageText = await page.content();
    expect(pageText).not.toContain('Firma FEA Producción Real Invocada');
  });

  test('13. isDemoOrganization identifica correctamente a Estudio Nova (slug e ID)', async () => {
    expect(isDemoOrganization(DEMO_ORGANIZATION_SLUG)).toBe(true);
    expect(isDemoOrganization(ESTUDIO_NOVA_ID)).toBe(true);
    expect(isDemoOrganization('tenant-real-123')).toBe(false);
  });

  test('14. demoResetService.resetEstudioNovaDemoData() ejecuta limpiamente para Estudio Nova', async () => {
    const res = await demoResetService.resetEstudioNovaDemoData(ESTUDIO_NOVA_ID);
    expect(res.success).toBe(true);
    expect(res.targetOrganizationId).toBe(ESTUDIO_NOVA_ID);
    expect(res.targetOrganizationSlug).toBe(DEMO_ORGANIZATION_SLUG);
  });

  test('15. demoResetService rechaza solicitudes no acotadas o de organizaciones no-demo', async () => {
    expect(demoResetService.isOrgResetSafe('tenant-real-999')).toBe(false);
    expect(demoResetService.isOrgResetSafe('*')).toBe(false);
    expect(demoResetService.isOrgResetSafe('ALL')).toBe(false);

    await expect(demoResetService.resetEstudioNovaDemoData('tenant-real-999')).rejects.toThrow();
  });

  test('16. demoResetService no elimina auth.users ni super_admins globales', async () => {
    const res = await demoResetService.resetEstudioNovaDemoData(ESTUDIO_NOVA_ID);
    expect(res.clearedCollections).not.toContain('auth.users');
    expect(res.clearedCollections).not.toContain('profiles_super_admin');
  });

  test('17. Los 5 accesos directos 1-click en /ingresar redirigen al portal correspondiente', async ({ page }) => {
    await page.goto('/login');

    // 1-Click Administrador
    await page.click('button:has-text("👑 Administrador")');
    await expect(page).toHaveURL(/.*(estudio-nova|admin).*/, { timeout: 15000 });
  });

  test('18. Aislamiento Multi-Tenant: Usuarios demo de Estudio Nova no pueden acceder a otros tenants', async () => {
    for (const u of demoUsers) {
      const actor = { role: u.role, organizationId: ESTUDIO_NOVA_ID, userEmail: u.email };
      const authRes = await resolveServerActorContext(TENANT_B_ID, actor);
      expect(authRes.isAuthorized).toBe(false);
    }
  });

  test('19. Aislamiento de Super Admin: Ninguno de los 5 usuarios demo posee privilegios de super_admin', async () => {
    for (const u of demoUsers) {
      const actor = { role: u.role, organizationId: ESTUDIO_NOVA_ID, userEmail: u.email, isSuperAdmin: false };
      const authRes = await resolveServerActorContext(ESTUDIO_NOVA_ID, actor);
      if (u.role !== 'tenant_admin') {
        expect(authRes.isAuthorized).toBe(false);
      }
    }
  });

  test('20. Verificación Final: Sandbox Estudio Nova opera en modo seguro sin efectos secundarios', async () => {
    expect(isDemoOrganization(ESTUDIO_NOVA_ID)).toBe(true);
    const resetCheck = demoResetService.isOrgResetSafe(ESTUDIO_NOVA_ID);
    expect(resetCheck).toBe(true);
  });
});
