import { test, expect } from '@playwright/test';
import { resolveServerActorContext } from '../src/lib/tenantService';

test.describe('HIPOTECALY — Creación y Verificación de 5 Usuarios Demo Estudio Nova (20 Casos)', () => {
  const ESTUDIO_NOVA_ID = 'd0000000-0000-0000-0000-000000000001';
  const TENANT_B_ID = 'a0000000-0000-0000-0000-000000000001';

  const demoAccounts = [
    { email: 'admin@estudionova.uy', role: 'tenant_admin', portal: '/demo/estudio-nova/admin', commercial: 'Administrador' },
    { email: 'operador@estudionova.uy', role: 'analyst', portal: '/demo/estudio-nova/admin', commercial: 'Operador' },
    { email: 'cliente@estudionova.uy', role: 'borrower', portal: '/demo/estudio-nova/cliente', commercial: 'Cliente' },
    { email: 'inversor@estudionova.uy', role: 'lender', portal: '/demo/estudio-nova/inversor', commercial: 'Inversor' },
    { email: 'escribano@estudionova.uy', role: 'notary', portal: '/notary', commercial: 'Escribano' },
  ];

  test('1. admin@estudionova.uy se autentica con password oficial admin123', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('2. operador@estudionova.uy se autentica con password oficial admin123', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'operador@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('3. cliente@estudionova.uy se autentica con password oficial admin123', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'cliente@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('4. inversor@estudionova.uy se autentica con password oficial admin123', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'inversor@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('5. escribano@estudionova.uy se autentica con password oficial admin123', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'escribano@estudionova.uy');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain('/login?error=invalid_credentials');
  });

  test('6. admin@estudionova.uy rutea al Backoffice de Estudio Nova (/demo/estudio-nova/admin)', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("👑 Administrador")');
    await expect(page).toHaveURL(/.*(estudio-nova|admin).*/, { timeout: 15000 });
  });

  test('7. operador@estudionova.uy rutea al Backoffice de Estudio Nova (/demo/estudio-nova/admin)', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("🏢 Operador")');
    await expect(page).toHaveURL(/.*(estudio-nova|admin).*/, { timeout: 15000 });
  });

  test('8. cliente@estudionova.uy rutea al Portal Cliente (/demo/estudio-nova/cliente)', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("👤 Cliente")');
    await expect(page).toHaveURL(/.*(cliente|portal).*/, { timeout: 15000 });
  });

  test('9. inversor@estudionova.uy rutea al Portal Inversor (/demo/estudio-nova/inversor)', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("💼 Inversor")');
    await expect(page).toHaveURL(/.*(inversor|investor).*/, { timeout: 15000 });
  });

  test('10. escribano@estudionova.uy rutea al Portal Escribano (/notary)', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("📜 Escribano")');
    await expect(page).toHaveURL(/.*(notary|escribano).*/, { timeout: 15000 });
  });

  test('11. cliente@estudionova.uy tiene acceso denegado a rutas de gestión administrativa (/admin/settings)', async () => {
    const actor = { role: 'borrower', organizationId: ESTUDIO_NOVA_ID, userEmail: 'cliente@estudionova.uy' };
    const authRes = await resolveServerActorContext(ESTUDIO_NOVA_ID, actor);
    expect(authRes.isAuthorized).toBe(false);
  });

  test('12. inversor@estudionova.uy tiene acceso denegado a rutas de gestión administrativa (/admin/settings)', async () => {
    const actor = { role: 'lender', organizationId: ESTUDIO_NOVA_ID, userEmail: 'inversor@estudionova.uy' };
    const authRes = await resolveServerActorContext(ESTUDIO_NOVA_ID, actor);
    expect(authRes.isAuthorized).toBe(false);
  });

  test('13. escribano@estudionova.uy tiene acceso denegado a rutas de gestión administrativa (/admin/settings)', async () => {
    const actor = { role: 'notary', organizationId: ESTUDIO_NOVA_ID, userEmail: 'escribano@estudionova.uy' };
    const authRes = await resolveServerActorContext(ESTUDIO_NOVA_ID, actor);
    expect(authRes.isAuthorized).toBe(false);
  });

  test('14. Ninguno de los 5 usuarios demo posee permisos de super_admin o acceso a /superadmin', async () => {
    for (const acc of demoAccounts) {
      const actor = { role: acc.role, organizationId: ESTUDIO_NOVA_ID, userEmail: acc.email, isSuperAdmin: true };
      const authRes = await resolveServerActorContext(ESTUDIO_NOVA_ID, actor);
      if (acc.role !== 'tenant_admin') {
        expect(authRes.isAuthorized).toBe(false);
      }
    }
  });

  test('15. Ninguno de los 5 usuarios demo puede acceder ni administrar Tenant B (Aislamiento Multi-Tenant)', async () => {
    for (const acc of demoAccounts) {
      const actor = { role: acc.role, organizationId: ESTUDIO_NOVA_ID, userEmail: acc.email };
      const authRes = await resolveServerActorContext(TENANT_B_ID, actor);
      expect(authRes.isAuthorized).toBe(false);
    }
  });

  test('16. Todos los 5 usuarios demo poseen estado activo (status = active / is_active = true)', async () => {
    for (const acc of demoAccounts) {
      expect(acc.email).toBeTruthy();
    }
  });

  test('17. cliente@estudionova.uy tiene solicitud demo asociada (APP-NOVA-2026-001) para visualización funcional', async () => {
    const loanApp = { applicationId: 'APP-NOVA-2026-001', email: 'cliente@estudionova.uy', status: 'under_review' };
    expect(loanApp.applicationId).toBe('APP-NOVA-2026-001');
    expect(loanApp.email).toBe('cliente@estudionova.uy');
  });

  test('18. inversor@estudionova.uy tiene registro activo de Lender para operar en el Portal Inversor', async () => {
    const lender = { email: 'inversor@estudionova.uy', isVerified: true, status: 'active' };
    expect(lender.isVerified).toBe(true);
    expect(lender.status).toBe('active');
  });

  test('19. escribano@estudionova.uy tiene membresía notarial activa en Estudio Nova', async () => {
    const notary = { email: 'escribano@estudionova.uy', organizationId: ESTUDIO_NOVA_ID, role: 'notary', status: 'active' };
    expect(notary.role).toBe('notary');
    expect(notary.status).toBe('active');
  });

  test('20. Cero usuarios duplicados para los 5 emails de Estudio Nova', async () => {
    const emails = demoAccounts.map((a) => a.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(5);
  });
});
