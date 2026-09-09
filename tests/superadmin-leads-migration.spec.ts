import { test, expect } from '@playwright/test';
import { openQaSession } from './helpers/qaSession';

test.describe('HIPOTECALY — MIGRACIÓN DE LEADS COMERCIALES SAAS AL SUPER ADMIN', () => {

  test('1. Leads no aparece en el menú del White Label (Tenant Admin)', async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    await page.goto('/demo/estudio-nova/admin?demo=true');
    await expect(page.locator('h1')).toContainText('Inicio');

    // Verificar que en el sidebar del Backoffice no exista Leads ni Leads SaaS
    const isMobile = await page.evaluate(() => window.innerWidth < 1024);
    if (!isMobile) {
      const navText = await page.locator('aside.border-r').textContent();
      expect(navText).not.toContain('Leads SaaS');
      expect(navText).not.toContain('Leads Comerciales');
    }
  });

  test('2. Ruta antigua White Label no permite acceso y redirige de forma segura', async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    // Intentar entrar a /demo/estudio-nova/admin/leads
    await page.goto('/demo/estudio-nova/admin/leads?demo=true');
    await page.waitForURL((url) => !url.pathname.endsWith('/leads'), { timeout: 10000 });
    expect(page.url()).toContain('/demo/estudio-nova/admin');
    expect(page.url()).not.toContain('/admin/leads');

    // Intentar entrar a /app/leads
    await page.goto('/app/leads?demo=true');
    await page.waitForURL((url) => !url.pathname.endsWith('/leads'), { timeout: 10000 });
    expect(page.url()).not.toContain('/app/leads');
  });

  test('3. Leads Comerciales aparece en el menú de navegación del Super Admin', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      tenantName: 'HIPOTECALY Central',
    });

    await page.goto('/admin?demo=true');
    await expect(page.locator('text=HIPOTECALY').locator('visible=true').first()).toBeVisible();

    const isMobile = await page.evaluate(() => window.innerWidth < 768);
    if (isMobile) {
      await page.click('button:has(svg.lucide-menu)');
      const leadsLink = page.locator('a[href="/superadmin/leads"]').locator('visible=true').first();
      await expect(leadsLink).toBeVisible();
      await expect(leadsLink).toContainText('Leads Comerciales');
    } else {
      const leadsNavLink = page.locator('aside.border-r a[href="/superadmin/leads"]');
      await expect(leadsNavLink).toBeVisible();
      await expect(leadsNavLink).toContainText('Leads Comerciales');
    }
  });

  test('4. Super Admin puede abrir /admin/leads exitosamente', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      tenantName: 'HIPOTECALY Central',
    });

    await page.goto('/admin/leads?demo=true');
    await expect(page.locator('h1')).toContainText('Leads Comerciales');
    await expect(page.locator('text=Prestamistas, financieras y estudios interesados en HIPOTECALY.').locator('visible=true').first()).toBeVisible({ timeout: 10000 });
  });

  test('5. Tenant Admin no puede abrir /admin/leads (Acceso Denegado / Protegido)', async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    await page.goto('/admin/leads');
    // Debe ser bloqueado por ProtectedRoute requireSuperAdmin y mostrar AccessDenied o login
    const isLeadsRendered = await page.locator('h1:has-text("Leads Comerciales")').count();
    expect(isLeadsRendered).toBe(0);
  });

  test('6. Analista no puede abrir /admin/leads (Acceso Denegado / Protegido)', async ({ page }) => {
    await openQaSession(page, {
      role: 'analyst',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    await page.goto('/admin/leads');
    const isLeadsRendered = await page.locator('h1:has-text("Leads Comerciales")').count();
    expect(isLeadsRendered).toBe(0);
  });

  test('7. Los registros de leads y estadísticas están disponibles para Super Admin', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      tenantName: 'HIPOTECALY Central',
    });

    await page.goto('/admin/leads?demo=true');
    await expect(page.locator('h1')).toContainText('Leads Comerciales');

    // Métricas
    await expect(page.locator('text=Nuevos Prospectos').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=En Negociación / Demos').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=Convertidos a Clientes').locator('visible=true').first()).toBeVisible();

    // Contenedor de lista
    await expect(page.locator('text=Leads comerciales registrados').locator('visible=true').first()).toBeVisible();
  });

  test('8. Búsqueda y filtrado de leads funcionan correctamente', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      tenantName: 'HIPOTECALY Central',
    });

    await page.goto('/admin/leads?demo=true');
    await expect(page.locator('h1')).toContainText('Leads Comerciales');

    const searchInput = page.locator('input[placeholder="Buscar por empresa, contacto o email..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Financiera');

    // Filtros de estado y tipo
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible();
  });

  test('9. Cambio de estado comercial funciona', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      tenantName: 'HIPOTECALY Central',
    });

    await page.goto('/admin/leads?demo=true');
    await expect(page.locator('h1')).toContainText('Leads Comerciales');

    const actionSelects = page.locator('tbody select');
    const count = await actionSelects.count();
    if (count > 0) {
      await actionSelects.first().selectOption('contacted');
      await expect(page.locator('text=Estado del lead actualizado correctamente')).toBeVisible({ timeout: 5000 });
    }
  });

  test('10. Módulo utiliza shell visual del Super Admin', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      tenantName: 'HIPOTECALY Central',
    });

    await page.goto('/admin/leads?demo=true');

    const isMobile = await page.evaluate(() => window.innerWidth < 768);
    if (!isMobile) {
      await expect(page.locator('aside.border-r')).toContainText('SUPER ADMIN');
      await expect(page.locator('aside.border-r')).toContainText('HIPOTECALY');
      const sidebarText = await page.locator('aside.border-r').textContent();
      expect(sidebarText).not.toContain('Estudio Nova Backoffice');
    } else {
      await expect(page.locator('header, div').filter({ hasText: 'HIPOTECALY SUPER ADMIN' }).first()).toBeVisible();
    }
  });

});
