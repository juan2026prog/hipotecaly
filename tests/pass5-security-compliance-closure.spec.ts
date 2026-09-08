import { test, expect } from '@playwright/test';
import { openQaSession } from './helpers/qaSession';

test.describe('PASS 5 — CIERRE FINAL DE SEGURIDAD, POLÍTICAS, AUDITORÍA Y TRAZABILIDAD', () => {
  test.beforeEach(async ({ page }) => {
    await openQaSession(page, {
      role: 'tenant_admin',
      tenantId: 'd0000000-0000-0000-0000-000000000001',
      tenantName: 'Estudio Nova',
    });
  });

  test('1. Motor de Políticas de Crédito — Simulador, Reglas y Versionado', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/whitelabel?demo=true');
    await expect(page.locator('h1')).toContainText('NOVA Crédito Hipotecario');

    // Navegar al tab Políticas & Riesgo
    const isMobile = await page.evaluate(() => window.innerWidth < 1024);
    if (isMobile) {
      await page.locator('select').first().selectOption('underwriting');
    } else {
      await page.locator('button:has-text("Políticas & Riesgo")').locator('visible=true').first().click();
    }

    await expect(page.locator('text=Motor de Políticas Crediticias y Riesgo').locator('visible=true').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Versión Activa en Producción').locator('visible=true').first()).toBeVisible();

    // Abrir Simulador de Políticas
    await expect(page.locator('button:has-text("PROBAR POLÍTICA")').locator('visible=true').first()).toBeVisible();
    await page.locator('button:has-text("PROBAR POLÍTICA")').locator('visible=true').first().click();

    // Verificar modal del Simulador
    await expect(page.locator('text=Simulador de Políticas').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=Evalúa un caso crediticio contra las reglas vigentes').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=Monto Solicitado (USD)').locator('visible=true').first()).toBeVisible();

    // Probar evaluación en el simulador
    await page.locator('button:has-text("Reevaluar")').locator('visible=true').first().click();
    await expect(page.locator('text=CUMPLE POLÍTICA').locator('visible=true').first()).toBeVisible();

    // Cerrar modal
    await page.locator('button:has-text("Cerrar Simulador")').locator('visible=true').first().click();
  });

  test('2. Estructura de Costos & Aranceles con Desglose Live', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/whitelabel?demo=true');
    const isMobile = await page.evaluate(() => window.innerWidth < 1024);
    if (isMobile) {
      await page.locator('select').first().selectOption('costs');
    } else {
      await page.locator('button:has-text("Costos & Honorarios")').locator('visible=true').first().click();
    }
    
    await expect(page.locator('text=Estructura de Costos y Aranceles Notariales').locator('visible=true').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Conceptos Arancelarios').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=Líquido Neto a Desembolsar al Cliente').locator('visible=true').first()).toBeVisible();
  });

  test('3. Catálogo de 12 Plantillas de Comunicaciones Operativas', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/whitelabel?demo=true');
    const isMobile = await page.evaluate(() => window.innerWidth < 1024);
    if (isMobile) {
      await page.locator('select').first().selectOption('communications');
    } else {
      await page.locator('button:has-text("Comunicaciones")').locator('visible=true').first().click();
    }

    await expect(page.locator('text=Comunicaciones Operativas & Biblioteca de Eventos').locator('visible=true').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Catálogo de Eventos Operativos').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=1. Solicitud Recibida').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=2. Documentación Faltante').locator('visible=true').first()).toBeVisible();
  });

  test('4. Ficha 360° — Consentimientos Legales, Certificado de Firma y Envíos', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/solicitudes/e0000000-0000-0000-0000-000000000001?demo=true');
    await expect(page.locator('text=SOLICITUD').locator('visible=true').first()).toBeVisible({ timeout: 10000 });

    // 1. Consentimientos Legales en Solicitante
    await page.locator('button').filter({ hasText: 'Solicitante' }).first().click();
    await page.locator('button:has-text("Consentimientos (Legal)")').locator('visible=true').first().click();
    await expect(page.locator('text=Registro de Consentimientos Digitales (Ley 18.331)').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=CONSENTIMIENTO VÁLIDO').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=Términos aceptados:').locator('visible=true').first()).toBeVisible();

    // 2. Certificado de Firma y Hash SHA-256 en Documentación
    await page.locator('button').filter({ hasText: 'Documentación' }).first().click();
    await expect(page.locator('text=Firma Electrónica Avanzada').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Ver Evidencia de Firma")').locator('visible=true').first()).toBeVisible();

    await page.locator('button:has-text("Ver Evidencia de Firma")').locator('visible=true').first().click();
    await expect(page.locator('text=Evidencia de Firma Digital Avanzada').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=Hash Criptográfico SHA-256').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('text=Ley N° 18.600').locator('visible=true').first()).toBeVisible();
    await page.locator('button:has-text("Cerrar Ficha Técnica")').locator('visible=true').first().click();

    // 3. Seguimiento y Envío de Comunicación Manual
    await page.locator('button').filter({ hasText: 'Seguimiento' }).first().click();
    await page.locator('button:has-text("Comunicaciones")').locator('visible=true').first().click();
    await expect(page.locator('text=Historial de Notificaciones y Comunicaciones').locator('visible=true').first()).toBeVisible();
    await expect(page.locator('button:has-text("Enviar Notificación")').locator('visible=true').first()).toBeVisible();

    await page.locator('button:has-text("Enviar Notificación")').locator('visible=true').first().click();
    await expect(page.locator('text=Enviar Notificación al Solicitante').locator('visible=true').first()).toBeVisible();
    await page.locator('button:has-text("Cerrar")').locator('visible=true').first().click();
  });

  test('5. Registro Inmutable de Auditoría & Trazabilidad', async ({ page }) => {
    await page.goto('/demo/estudio-nova/admin/auditoria?demo=true');
    await expect(page.locator('h1')).toContainText('Auditoría');
    await expect(page.locator('text=Registro inmutable de acciones críticas').locator('visible=true').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Logs Inmutables (Solo Lectura)').locator('visible=true').first()).toBeVisible();
  });
});
