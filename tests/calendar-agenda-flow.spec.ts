import { test, expect } from '@playwright/test';

test.describe('HIPOTECALY — Sovereign Agenda & Google Calendar Integration E2E Flow', () => {

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('1. Notary Calendar: Carga agenda soberana y botones de Google Calendar', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'notary');
    });
    await page.goto('/notary/calendario');

    // Header y título de agenda soberana
    await expect(page.locator('text=Agenda Notarial Soberana')).toBeVisible();

    // Calendario visual
    await expect(page.locator('text=Septiembre 2026').first()).toBeVisible();

    // Botón de Google Calendar
    const gcalBtn = page.locator('a:has-text("Google Cal")').first();
    await expect(gcalBtn).toBeVisible({ timeout: 10000 });
    const href = await gcalBtn.getAttribute('href');
    expect(href).toContain('calendar.google.com/calendar/render');
    expect(href).toContain('HIPOTECALY');
  });

  test('2. Notary Signatures: Visualiza firmas por coordinar y firmas agendadas con acciones reales', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'notary');
    });
    await page.goto('/notary/firmas');

    // Título y secciones
    await expect(page.locator('h2:has-text("Firmas Notariales")')).toBeVisible();
    await expect(page.locator('text=1. Firmas por Coordinar')).toBeVisible();
    await expect(page.locator('text=2. Firmas Agendadas')).toBeVisible();

    // Botones de acción
    await expect(page.locator('button:has-text("Firma FEA")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Reprogramar")').first()).toBeVisible();

    // Click en Reprogramar abre modal
    await page.locator('button:has-text("Reprogramar")').first().click();
    await expect(page.locator('text=Reprogramar Cita Notarial')).toBeVisible();
    await page.locator('form button:has-text("Cancelar")').click();
    await expect(page.locator('text=Reprogramar Cita Notarial')).not.toBeVisible();
  });

  test('3. Notary Expediente Detail: Mesa notarial con coordinación de firma y originales', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('hipotecaly_test_role', 'notary');
    });
    await page.goto('/notary/expedientes/e0000000-0000-0000-0000-000000000001');

    // Navegación de pestañas
    await expect(page.locator('text=47 verificaciones ejecutadas').first()).toBeVisible({ timeout: 10000 });

    // Pestaña Revisión Notarial y Originales
    await page.locator('button:has-text("Revisión Jurídica")').click();
    await expect(page.locator('text=Estado General de Revisión Jurídica')).toBeVisible();

    // Pestaña Escritura y Firma
    await page.locator('button:has-text("Escritura y Firma")').click();
    await expect(page.locator('text=Escritura de Hipoteca y Mutuo')).toBeVisible();
  });

  test('4. Unit tests: Verificación de utilidades de Google Calendar y CalendarService', async () => {
    const { calendarService } = await import('../src/lib/calendar/calendarService');
    const { generateGoogleCalendarWebLink } = await import('../src/lib/calendar/googleCalendarIntegration');

    const testEvent = {
      id: 'cal-test-e2e',
      organizationId: 'org-test',
      applicationId: 'app-test',
      applicationPublicId: 'HIP-2026-99999',
      eventType: 'signature' as const,
      title: 'Firma Test E2E',
      description: 'Test description',
      startAt: '2026-09-20T10:00:00-03:00',
      endAt: '2026-09-20T10:45:00-03:00',
      date: '2026-09-20',
      time: '10:00',
      durationMinutes: 45,
      timezone: 'America/Montevideo',
      locationType: 'notary_office' as const,
      locationAddress: 'Rincón 487',
      participants: [{ name: 'Juan Test', role: 'Deudor' as const, email: 'juan@test.com' }],
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const link = generateGoogleCalendarWebLink(testEvent);
    expect(link).toContain('https://calendar.google.com/calendar/render');
    expect(link).toContain('HIPOTECALY');
    expect(link).toContain('HIP-2026-99999');

    // Verificar que calendarService puede crear y reprogramar eventos
    const created = await calendarService.createCalendarEvent(testEvent);
    expect(created.id).toBeDefined();

    const rescheduled = await calendarService.rescheduleEvent(created.id, '2026-09-22', '14:00', 'Test reason');
    expect(rescheduled).not.toBeNull();
    expect(rescheduled?.date).toBe('2026-09-22');
    expect(rescheduled?.time).toBe('14:00');
  });

});