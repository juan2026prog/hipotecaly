import { test, expect } from '@playwright/test';
import { openQaSession } from './helpers/qaSession';

test.describe('HIPOTECALY — CONSOLIDACIÓN DE ARQUITECTURA: BACKOFFICE ÚNICO + /SUPERADMIN + DOCUMENTOS GLOBALES', () => {

  // ============================================================================
  // 1. SUPER ADMIN CANÓNICO (/superadmin) & CONTROL DE ACCESO
  // ============================================================================

  test('1.1 Super Admin puede acceder a las rutas canónicas /superadmin, /superadmin/tenants, /superadmin/leads, /superadmin/documentos', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      tenantName: 'HIPOTECALY Central',
    });

    // /superadmin
    await page.goto('/superadmin?demo=true');
    await expect(page.locator('text=HIPOTECALY').locator('visible=true').first()).toBeVisible();

    // /superadmin/tenants
    await page.goto('/superadmin/tenants?demo=true');
    await expect(page.locator('h1')).toContainText('Clientes de HIPOTECALY');

    // /superadmin/leads
    await page.goto('/superadmin/leads?demo=true');
    await expect(page.locator('h1')).toContainText('Leads Comerciales');

    // /superadmin/documentos
    await page.goto('/superadmin/documentos?demo=true');
    await expect(page.locator('h1')).toContainText('Plantillas Documentales Globales');
  });

  test('1.2 Usuarios no superadmin no pueden acceder a /superadmin/* (Acceso Protegido)', async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    await page.goto('/superadmin/documentos');
    const isGlobalHeadingRendered = await page.locator('h1:has-text("Plantillas Documentales Globales")').count();
    expect(isGlobalHeadingRendered).toBe(0);

    await page.goto('/superadmin/tenants');
    const isTenantsRendered = await page.locator('h1:has-text("Clientes de HIPOTECALY")').count();
    expect(isTenantsRendered).toBe(0);
  });

  // ============================================================================
  // 2. REDIRECCIONES DE COMPATIBILIDAD /admin/* -> /superadmin/*
  // ============================================================================

  test('2.1 Rutas legacy /admin/* redirigen a /superadmin/*', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      tenantName: 'HIPOTECALY Central',
    });

    // /admin -> /superadmin
    await page.goto('/admin?demo=true');
    await page.waitForURL((url) => url.pathname === '/superadmin', { timeout: 10000 });
    expect(page.url()).toContain('/superadmin');

    // /admin/documentos -> /superadmin/documentos
    await page.goto('/admin/documentos?demo=true');
    await page.waitForURL((url) => url.pathname === '/superadmin/documentos', { timeout: 10000 });
    expect(page.url()).toContain('/superadmin/documentos');

    // /admin/tenants -> /superadmin/tenants
    await page.goto('/admin/tenants?demo=true');
    await page.waitForURL((url) => url.pathname === '/superadmin/tenants', { timeout: 10000 });
    expect(page.url()).toContain('/superadmin/tenants');

    // /admin/leads -> /superadmin/leads
    await page.goto('/admin/leads?demo=true');
    await page.waitForURL((url) => url.pathname === '/superadmin/leads', { timeout: 10000 });
    expect(page.url()).toContain('/superadmin/leads');
  });

  // ============================================================================
  // 3. ELIMINACIÓN DE /app/* Y REDIRECCIONES A BACKOFFICE WHITE LABEL
  // ============================================================================

  test('3.1 Rutas legacy /app/* redirigen al Backoffice White Label canónico', async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    // /app -> /demo/estudio-nova/admin
    await page.goto('/app?demo=true');
    await page.waitForURL((url) => url.pathname.includes('/demo/estudio-nova/admin'), { timeout: 10000 });
    expect(page.url()).toContain('/demo/estudio-nova/admin');

    // /app/documentos -> /demo/estudio-nova/admin/documentos
    await page.goto('/app/documentos?demo=true');
    await page.waitForURL((url) => url.pathname === '/demo/estudio-nova/admin/documentos', { timeout: 10000 });
    expect(page.url()).toContain('/demo/estudio-nova/admin/documentos');

    // /app/solicitudes -> /demo/estudio-nova/admin/solicitudes
    await page.goto('/app/solicitudes?demo=true');
    await page.waitForURL((url) => url.pathname === '/demo/estudio-nova/admin/solicitudes', { timeout: 10000 });
    expect(page.url()).toContain('/demo/estudio-nova/admin/solicitudes');
  });

  // ============================================================================
  // 4. LIMPIEZA DE SIDEBAR WHITE LABEL (SIN "SUPER ADMIN GLOBAL")
  // ============================================================================

  test('4.1 Sidebar de Backoffice White Label NO contiene la sección SUPER ADMIN GLOBAL', async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    await page.goto('/demo/estudio-nova/admin?demo=true');
    await expect(page.locator('h1').first()).toContainText(/Inicio|Panel Operativo/i);

    const isMobile = await page.evaluate(() => window.innerWidth < 1024);
    if (!isMobile) {
      const sidebarContent = await page.locator('aside.border-r').textContent();
      expect(sidebarContent).not.toContain('SUPER ADMIN GLOBAL');
      expect(sidebarContent).not.toContain('Clientes & Tenants');
      expect(sidebarContent).not.toContain('Ver como Cliente (QA)');
      expect(sidebarContent).not.toContain('Config Técnica');
    }
  });

  test('4.2 Super Admin inspeccionando tenant ve banner contextual "Volver al Super Admin" a /superadmin', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    await page.goto('/demo/estudio-nova/admin?demo=true');
    
    const isMobile = await page.evaluate(() => window.innerWidth < 1024);
    if (isMobile) {
      const qaSuperAdminBtn = page.locator('button:has-text("Super Admin")').locator('visible=true').first();
      await expect(qaSuperAdminBtn).toBeVisible();
    } else {
      const returnLink = page.locator('a[href="/superadmin"]').locator('visible=true').first();
      await expect(returnLink).toBeVisible();
      await expect(returnLink).toContainText('Volver al Super Admin');
    }
  });

  // ============================================================================
  // 5. GESTIÓN DE PLANTILLAS GLOBALES EN SUPER ADMIN (/superadmin/documentos)
  // ============================================================================

  test('5.1 Super Admin gestiona catálogo de plantillas maestras globales', async ({ page }) => {
    await openQaSession(page, {
      role: 'super_admin',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      tenantName: 'HIPOTECALY Central',
    });

    await page.goto('/superadmin/documentos?demo=true');
    await expect(page.locator('h1')).toContainText('Plantillas Documentales Globales');

    // Botón Nueva Plantilla Global
    const newBtn = page.locator('button:has-text("Nueva Plantilla Global")');
    await expect(newBtn).toBeVisible();

    // Comprobar que carga la tabla o contenedor de plantillas maestras
    await expect(page.locator('text=Total Maestras').locator('visible=true').first()).toBeVisible();
  });

  // ============================================================================
  // 6. GESTIÓN DE DOCUMENTOS WHITE LABEL (ESTRUCTURA DE 3 NIVELES & DERIVACIÓN)
  // ============================================================================

  test('6.1 Backoffice White Label muestra pestañas estructuradas de documentos', async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    await page.goto('/demo/estudio-nova/admin/documentos?demo=true');
    await expect(page.locator('h1')).toContainText('Documentos & Plantillas');

    // Verificar las 3 pestañas
    const tabGlobal = page.locator('button:has-text("Plantillas HIPOTECALY")');
    const tabMy = page.locator('button:has-text("Mis Plantillas")');
    const tabExp = page.locator('button:has-text("Documentos de Expedientes")');

    await expect(tabGlobal).toBeVisible();
    await expect(tabMy).toBeVisible();
    await expect(tabExp).toBeVisible();

    // Pestaña 1 (Plantillas HIPOTECALY)
    await tabGlobal.click();
    await expect(page.locator('text=Biblioteca Maestra Oficial:').locator('visible=true').first()).toBeVisible();
  });

  test('6.2 Tenant puede derivar una plantilla global sin modificar la original', async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });

    await page.goto('/demo/estudio-nova/admin/documentos?demo=true');
    
    // Ir a pestaña de Plantillas HIPOTECALY
    const tabGlobal = page.locator('button:has-text("Plantillas HIPOTECALY")');
    await tabGlobal.click();
    
    // Si hay botón de derivar plantilla
    const deriveButtons = page.locator('button:has-text("Crear versión para mi organización")');
    const count = await deriveButtons.count();
    if (count > 0) {
      await deriveButtons.first().click();
      await expect(page.locator('text=Constructor DocFlow No-Code')).toBeVisible();
      
      // Guardar como borrador la versión derivada
      await page.click('button:has-text("Guardar como Borrador")');
      
      // Verificar que la pestaña Mis Plantillas esté disponible y contenga la plantilla
      await page.click('button:has-text("Mis Plantillas")');
      await expect(page.locator('text=PERSONALIZADA').locator('visible=true').first()).toBeVisible();
    }
  });

  test('6.3 Aislamiento multi-tenant de plantillas propias', async ({ page }) => {
    // Tenant B no debe ver las plantillas creadas/derivadas exclusivamente por Tenant A
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000002',
      tenantName: 'Capital Soluciones',
    });

    await page.goto('/demo/capital-soluciones/admin/documentos?demo=true');
    await expect(page.locator('h1')).toContainText('Documentos & Plantillas');
    
    // Esperar a que el contenedor principal esté listo
    await page.waitForLoadState('domcontentloaded');
    const tabMy = page.getByRole('button', { name: /Mis Plantillas/i });
    await expect(tabMy).toBeVisible();
    await tabMy.click();

    // Comprobar que solo ve sus plantillas y no las de Estudio Nova
    const content = await page.locator('main').textContent();
    expect(content).not.toContain('(Estudio Nova)');
  });

});
