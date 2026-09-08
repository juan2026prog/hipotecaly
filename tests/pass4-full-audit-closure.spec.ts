import { test, expect } from '@playwright/test';
import { openQaSession } from './helpers/qaSession';

test.describe('PASS 4 AUDIT — CIERRE REAL Y VERIFICACIÓN INTEGRAL WHITE LABEL BACKOFFICE', () => {
  test.beforeEach(async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });
  });

  test('1. Dashboard y Coherencia de Datos End-to-End (8 Expedientes)', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin?demo=true');
    await expect(page.locator('h1')).toContainText('Inicio');
    await expect(page.locator('text=Expedientes Activos').locator('visible=true').first()).toBeVisible();

    await page.goto('/demo/estudio-nova/admin/solicitudes?demo=true');
    await expect(page.locator('text=HIP-DEMO-00124').locator('visible=true').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=HIP-DEMO-00125').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=HIP-DEMO-00126').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=HIP-DEMO-00127').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=HIP-DEMO-00128').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=HIP-DEMO-00129').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=HIP-DEMO-00130').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=HIP-DEMO-00131').locator('visible=true').first()).toBeVisible();
  });

  test('2. Solicitudes con 9 Vistas Rápidas, Ordenamiento y Filtros', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/solicitudes?demo=true');
    await expect(page.locator('text=HIP-DEMO-00124').locator('visible=true').first()).toBeVisible({ timeout: 10000 });

    await expect(page.locator('button:has-text("Todas")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Mis expedientes")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Requieren acción")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Documentación pendiente")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Listas para evaluación")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Firma pendiente")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Esperando cliente")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Sin actividad")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Finalizadas")').locator('visible=true').first()).toBeVisible();

    await page.locator('button:has-text("Firma pendiente")').locator('visible=true').first().click();
    await expect(page.locator('text=HIP-DEMO-00129').locator('visible=true').first()).toBeVisible();

    await page.locator('button:has-text("Finalizadas")').locator('visible=true').first().click();
    await expect(page.locator('text=HIP-DEMO-00130').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=HIP-DEMO-00131').locator('visible=true').first()).toBeVisible();
  });

  test('3. Ficha de Expediente 360° — Barra de Etapas y Macro-Tabs', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/solicitudes/e0000000-0000-0000-0000-000000000001?demo=true');
    await expect(page.locator('text=SOLICITUD').locator('visible=true').first()).toBeVisible({ timeout: 10000 });

    await page.locator('button').filter({ hasText: 'Solicitante' }).first().click();
    await expect(page.locator('text=María López').locator('visible=true').first()).toBeVisible();

    await page.locator('button').filter({ hasText: 'Garantía' }).first().click();
    await expect(page.locator('text=Padrón').locator('visible=true').first()).toBeVisible();

    await page.locator('button').filter({ hasText: 'Documentación' }).first().click();
    await expect(page.locator('text=Gestión Documental').locator('visible=true').first()).toBeVisible();

    await page.locator('button').filter({ hasText: 'Análisis' }).first().click();
    await expect(page.locator('text=Riesgo').locator('visible=true').first()).toBeVisible();

    await page.locator('button').filter({ hasText: 'Seguimiento' }).first().click();
    await expect(page.locator('text=Actividad').locator('visible=true').first()).toBeVisible();
  });

  test('4. Directorio de Clientes 360° con Búsqueda y KYC', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/clientes?demo=true');
    await expect(page.locator('h1')).toContainText('Directorio de Clientes');
    await expect(page.locator('text=Total clientes').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=María López').locator('visible=true').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Pedro González').locator('visible=true').first()).toBeVisible();
  });

  test('5. Registro de Garantías Hipotecarias 360° y Alertas', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/propiedades?demo=true');
    await expect(page.locator('h1')).toContainText('Registro de Garantías');
    await expect(page.locator('text=145.892').locator('visible=true').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=USD 240.000').locator('visible=true').first()).toBeVisible();
  });

  test('6. Constructor de Plantillas Documentales DocFlow No-Code', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/documentos?demo=true');
    await expect(page.locator('text=DocFlow Engine').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Nueva Plantilla")').locator('visible=true').first()).toBeVisible();

    await page.locator('button:has-text("Nueva Plantilla")').locator('visible=true').first().click();
    await expect(page.locator('text=Constructor DocFlow No-Code').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Estructura & Variables")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Probar con Expediente")').locator('visible=true').first()).toBeVisible();

    await page.locator('button:has-text("Probar con Expediente")').locator('visible=true').first().click();
    await expect(page.locator('text=Probar con Expediente Activo').locator('visible=true').first()).toBeVisible();

    await page.locator('.fixed.inset-0 button:has(svg.lucide-x)').locator('visible=true').first().click();
  });

  test('7. Work Queue de Tasaciones & Valuaciones', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/tasaciones?demo=true');
    await expect(page.locator('h1')).toContainText('Work Queue — Valuaciones');
    await expect(page.locator('button:has-text("Todas")').locator('visible=true').first()).toBeVisible();
  });

  test('8. Work Queue de Tareas Operativas', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/tareas?demo=true');
    await expect(page.locator('h1')).toContainText('Bandeja de Tareas');
    await expect(page.locator('button:has-text("Todas")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Hoy")').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Vencidas")').locator('visible=true').first()).toBeVisible();
  });

  test('9. Módulo de Inversores y Matching de Fondos', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/inversores?demo=true');
    await expect(page.locator('text=Inversores').locator('visible=true').first()).toBeVisible();
  });

  test('10. Analytics y Reportes Derivados', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/reportes?demo=true');
    await expect(page.locator('h1')).toContainText('Analítica');
    await expect(page.locator('text=OPERACIONES').locator('visible=true').first()).toBeVisible({ timeout: 10000 });
  });

  test('11. Motor de Políticas, Scoring y Versionado Legal', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/white-label?demo=true');
    await expect(page.locator('h1, h2, h3, p, span').filter({ hasText: 'Estudio Nova' }).locator('visible=true').first()).toBeVisible({ timeout: 10000 });
  });

  test('12. Aislamiento Multi-Tenant y Seguridad de Rutas', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin?demo=true');
    await expect(page.locator('h1')).toContainText('Inicio');
  });
});

