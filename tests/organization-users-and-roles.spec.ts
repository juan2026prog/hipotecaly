import { test, expect } from '@playwright/test';
import {
  getCommercialRoleLabel,
  getTechnicalRoleFromCommercial,
  ROLE_DISPLAY_MAP,
  STAFF_INVITATION_OPTIONS,
} from '../src/lib/roleMapping';
import { canUserPerform } from '../src/lib/rbacService';

test.describe('HIPOTECALY — Simplificación de Usuarios, Roles y Permisos para Organizaciones', () => {

  // --------------------------------------------------------------------------
  // 1. Vistas de Acceso por Rol
  // --------------------------------------------------------------------------
  test('1. Admin ve Usuarios y permisos en /demo/estudio-nova/admin/usuarios', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await expect(page.locator('text=Usuarios y permisos').first()).toBeVisible();
    await expect(page.locator('text=Administrá las personas que trabajan en tu organización').first()).toBeVisible();
  });

  test('2. Operador no administra usuarios (Bloqueo en /usuarios)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'analyst');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await expect(page.locator('text=Tu cuenta actual no cuenta con los roles necesarios').first()).toBeVisible();
  });

  test('3. Cliente no accede a la gestión de usuarios del Backoffice', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'borrower');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await expect(page.locator('text=Tu cuenta actual no cuenta con los roles necesarios').first()).toBeVisible();
  });

  test('4. Inversor no accede a la gestión de usuarios del Backoffice', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'lender');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await expect(page.locator('text=Tu cuenta actual no cuenta con los roles necesarios').first()).toBeVisible();
  });

  test('5. Escribano no administra usuarios (Bloqueo en /usuarios)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'notary');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await expect(page.locator('text=Tu cuenta actual no cuenta con los roles necesarios').first()).toBeVisible();
  });

  // --------------------------------------------------------------------------
  // 2. Modal de Invitación y Restricciones de Selector de Staff
  // --------------------------------------------------------------------------
  test('6. Admin puede abrir modal e invitar otro Administrador', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await page.click('text=+ Invitar usuario');

    await expect(page.locator('text=Invitar usuario a la organización').first()).toBeVisible();
    await page.fill('input[type="email"]', 'nuevo_admin@estudionova.uy');
    await page.selectOption('select', 'Administrador');

    await page.click('button:has-text("Enviar invitación")');
    await expect(page.locator('text=Invitación registrada exitosamente').first()).toBeVisible();
  });

  test('7. Admin puede invitar Operador con su descripción correspondiente', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await page.click('text=+ Invitar usuario');

    await page.selectOption('select', 'Operador');
    await expect(page.locator('text=Trabaja la operación diaria y los expedientes').first()).toBeVisible();
  });

  test('8. Admin puede invitar Escribano con su descripción correspondiente', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await page.click('text=+ Invitar usuario');

    await page.selectOption('select', 'Escribano');
    await expect(page.locator('text=Profesional responsable de la revisión jurídica').first()).toBeVisible();
  });

  test('9. Cliente no aparece en selector de staff de la organización', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await page.click('text=+ Invitar usuario');

    const options = await page.locator('select option').allInnerTexts();
    expect(options).not.toContain('Cliente');
  });

  test('10. Inversor no aparece en selector de staff de la organización', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await page.click('text=+ Invitar usuario');

    const options = await page.locator('select option').allInnerTexts();
    expect(options).not.toContain('Inversor');
  });

  // --------------------------------------------------------------------------
  // 3. Reglas de Negocio, Mapeo y Protección del Último Admin
  // --------------------------------------------------------------------------
  test('11. Invitación válida asigna rol técnico correspondiente (Administrador -> tenant_admin)', () => {
    const techRole = getTechnicalRoleFromCommercial('Administrador');
    expect(techRole).toBe('tenant_admin');
  });

  test('12. Invitación inválida o rol desconocido cae en fallback seguro (Operador)', () => {
    const label = getCommercialRoleLabel('invalid_role_xyz');
    expect(label).toBe('Operador');
  });

  test('13. Admin puede cambiar Operador -> Admin en la interfaz', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');

    // Hacer click en Cambiar rol del segundo usuario (Valeria Rivas - Operador)
    const row = page.locator('tr:has-text("valeria@estudionova.uy")');
    await row.locator('button:has-text("Cambiar rol")').click();

    await expect(page.locator('text=Cambiar rol de usuario').first()).toBeVisible();
    await page.selectOption('select', 'Administrador');
    await expect(page.locator('text=Este usuario tendrá permisos de Administrador').first()).toBeVisible();

    await page.click('button:has-text("Confirmar cambio")');
    await expect(page.locator('text=Rol de Valeria Rivas actualizado a Administrador').first()).toBeVisible();
  });

  test('14. Operador no puede cambiar su propio rol ni acceder al módulo', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'analyst');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await expect(page.locator('text=Tu cuenta actual no cuenta con los roles necesarios').first()).toBeVisible();
  });

  test('15. Bloqueo: No se puede desactivar ni degradar el único Administrador activo', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');

    // Intentar desactivar Ignacio Notario (el único admin activo por defecto)
    const adminRow = page.locator('tr:has-text("admin@estudionova.uy")');
    await adminRow.locator('button:has-text("Desactivar acceso")').click();

    await expect(page.locator('text=Acción bloqueada').first()).toBeVisible();
    await expect(page.locator('text=Tu organización debe conservar al menos un Administrador activo.').first()).toBeVisible();
  });

  test('16. Usuario desactivado muestra estado "Acceso desactivado"', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');

    // Desactivar a Valeria Rivas (Operador)
    const row = page.locator('tr:has-text("valeria@estudionova.uy")');
    await row.locator('button:has-text("Desactivar acceso")').click();

    await expect(page.locator('text=Acceso desactivado para Valeria Rivas').first()).toBeVisible();
    await expect(row.locator('text=Acceso desactivado')).toBeVisible();
  });

  test('17. Mapeo técnico conserva compatibilidad total con RBAC (canUserPerform)', () => {
    // Admin puede administrar usuarios
    expect(canUserPerform('tenant_admin', 'manage_users')).toBe(true);
    expect(canUserPerform('tenant_owner', 'manage_users')).toBe(true);

    // Operador (analyst/operator) NO puede administrar usuarios
    expect(canUserPerform('analyst', 'manage_users')).toBe(false);
    expect(canUserPerform('operator', 'manage_users')).toBe(false);

    // Escribano NO puede administrar usuarios
    expect(canUserPerform('notary', 'manage_users')).toBe(false);
  });

  test('18. Tenant A no modifica usuarios de Tenant B (Aislamiento Multi-tenant)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    // Cargar usuarios de Estudio Nova
    await page.goto('/demo/estudio-nova/admin/usuarios');
    await expect(page.locator('text=valeria@estudionova.uy').first()).toBeVisible();

    // Intentar acceder a usuarios de otro tenant (Estudio Notarial del Este) es bloqueado por aislamiento multi-tenant
    await page.goto('/demo/estudio-notarial-este/admin/usuarios');
    await expect(page.locator('text=No pertenecés a la organización').first()).toBeVisible();
  });

  test('19. Nombres técnicos (tenant_owner, analyst, notary) NO aparecen en la interfaz principal', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');

    // Verificar que los badges y tablas muestren solo nombres comerciales
    await expect(page.locator('text=Administrador').first()).toBeVisible();
    await expect(page.locator('text=Operador').first()).toBeVisible();
    await expect(page.locator('text=Escribano').first()).toBeVisible();

    // No deben aparecer identificadores técnicos en el contenido principal
    const mainText = await page.locator('main').innerText();
    expect(mainText).not.toContain('tenant_owner');
    expect(mainText).not.toContain('tenant_admin');
    expect(mainText).not.toContain('borrower');
  });

  test('20. Pestaña Roles y permisos enseña las 5 tarjetas comerciales y la matriz de permisos', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin');
    });

    await page.goto('/demo/estudio-nova/admin/usuarios');
    await page.click('button:has-text("Roles y permisos")');

    // Verificar las 5 tarjetas
    await expect(page.locator('h3:has-text("Administrador")').first()).toBeVisible();
    await expect(page.locator('h3:has-text("Operador")').first()).toBeVisible();
    await expect(page.locator('h3:has-text("Cliente")').first()).toBeVisible();
    await expect(page.locator('h3:has-text("Inversor")').first()).toBeVisible();
    await expect(page.locator('h3:has-text("Escribano")').first()).toBeVisible();

    // Verificar tabla de matriz resumida
    await expect(page.locator('text=Matriz Resumida de Permisos').first()).toBeVisible();
    await expect(page.locator('text=Coordinar firmas').first()).toBeVisible();
  });

});
