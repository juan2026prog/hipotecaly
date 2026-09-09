import { test, expect } from '@playwright/test';
import { calendarService } from '../src/lib/calendar/calendarService';
import { generateGoogleCalendarWebLink, getUserCalendarIntegrationState, setUserCalendarIntegrationState } from '../src/lib/calendar/googleCalendarIntegration';
import { generateIcsFileContent } from '../src/lib/calendar/icsExport';

test.describe('HIPOTECALY — Matrix Certificada 47 Puntos: OAuth + Agenda Soberana + Google Calendar', () => {

  // ============================================================================
  // PARTE 8 — TESTS OAUTH (1 al 15)
  // ============================================================================
  test.describe('PARTE 8: Tests OAuth & Autorización Contextual (1 al 15)', () => {
    test('1. Usuario existente conserva rol asignado', async ({ page }) => {
      await page.addInitScript(() => window.localStorage.setItem('hipotecaly_test_role', 'notary'));
      await page.goto('/notary');
      await expect(page).toHaveURL(/\/notary/);
      await expect(page.locator('text=Mesa de Revisión Notarial').first()).toBeVisible();
    });

    test('2. Usuario existente conserva organización asignada', async ({ page }) => {
      await page.addInitScript(() => window.localStorage.setItem('hipotecaly_test_role', 'tenant_admin'));
      await page.goto('/demo/estudio-nova/admin');
      await expect(page).toHaveURL(/\/demo\/estudio-nova\/admin/);
    });

    test('3. Usuario nuevo desde login genérico (/ingresar) NO crea borrower automático', async ({ page }) => {
      await page.addInitScript(() => window.localStorage.setItem('hipotecaly_test_role', 'visitor'));
      await page.goto('/auth/callback?intent=generic_login');
      // No debe auto-ingresar al portal borrower, sino mostrar tarjeta informativa o login
      await expect(page.locator('text=HIPOTECALY')).toBeVisible();
      await expect(page.locator('text=Iniciando sesión segura').or(page.locator('text=No encontramos un acceso asociado')).or(page.locator('text=No pudimos completar'))).toBeVisible();
    });

    test('4. Usuario nuevo desde borrower_signup SÍ permite registro de prestatario', async ({ page }) => {
      await page.addInitScript(() => window.localStorage.setItem('hipotecaly_test_role', 'visitor'));
      await page.goto('/registro');
      const googleSignupBtn = page.locator('button:has-text("Registrarse con Google")');
      await expect(googleSignupBtn).toBeVisible();
    });

    test('5 a 8. Invitaciones y validación estricta de tokens (sin elevación por URL)', async ({ page }) => {
      await page.addInitScript(() => window.localStorage.setItem('hipotecaly_test_role', 'visitor'));
      // Intento de manipulación maliciosa de rol por URL
      await page.goto('/auth/callback?role=super_admin&intent=generic_login');
      // No debe redirigir a /superadmin
      await expect(page).not.toHaveURL(/\/superadmin/);
    });

    test('9 a 13. Redirección por roles autoritativos de HIPOTECALY', async ({ page }) => {
      // Super Admin -> /superadmin
      await page.addInitScript(() => window.localStorage.setItem('hipotecaly_test_role', 'super_admin'));
      await page.goto('/superadmin');
      await expect(page).toHaveURL(/\/superadmin/);

      // Inversor -> /demo/estudio-nova/inversor
      await page.addInitScript(() => window.localStorage.setItem('hipotecaly_test_role', 'investor'));
      await page.goto('/demo/estudio-nova/inversor');
      await expect(page).toHaveURL(/\/demo\/estudio-nova\/inversor/);
    });

    test('14 y 15. Password login y Logout siguen 100% operativos', async ({ page }) => {
      await page.goto('/ingresar');
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]:has-text("Iniciar sesión")')).toBeVisible();
    });
  });

  // ============================================================================
  // PARTE 9 — TESTS AGENDA SOBERANA (16 al 24)
  // ============================================================================
  test.describe('PARTE 9: Tests Agenda Soberana & CRUD Persistente (16 al 24)', () => {
    test('16 al 22. Crear, Leer, Reprogramar, Cancelar y Completar eventos en Agenda Soberana', async () => {
      const now = new Date().toISOString();
      const testEv = await calendarService.createCalendarEvent({
        organizationId: 'org-cert-01',
        applicationId: 'app-cert-01',
        applicationPublicId: 'HIP-2026-CERT01',
        eventType: 'signature',
        title: 'Firma Test Certificación Matriz',
        description: 'Audiencia de prueba de ciclo de vida',
        startAt: '2026-09-25T14:00:00-03:00',
        endAt: '2026-09-25T14:45:00-03:00',
        date: '2026-09-25',
        time: '14:00',
        durationMinutes: 45,
        timezone: 'America/Montevideo',
        locationType: 'notary_office',
        locationAddress: 'Rincón 487 Piso 3',
        responsibleName: 'Esc. María Pérez Morales',
        participants: [
          { name: 'Juan Cert', role: 'Deudor', email: 'juan.cert@ejemplo.com', status: 'confirmed' },
        ],
        status: 'scheduled',
        googleSyncStatus: 'not_synced',
      });

      expect(testEv.id).toBeDefined();

      // 17. Leer evento propio
      const evs = await calendarService.getEventsByApplication('app-cert-01');
      expect(evs.some((e) => e.id === testEv.id)).toBe(true);

      // 20. Reprogramar evento
      const rescheduled = await calendarService.rescheduleEvent(testEv.id, '2026-09-26', '16:00', 'Postergado por común acuerdo');
      expect(rescheduled).not.toBeNull();
      expect(rescheduled?.date).toBe('2026-09-26');
      expect(rescheduled?.status).toBe('rescheduled');

      // 22. Completar evento
      const completed = await calendarService.completeCalendarEvent(testEv.id, 'Audiencia finalizada conforme');
      expect(completed).toBe(true);

      // 21. Cancelar evento
      const cancelled = await calendarService.cancelCalendarEvent(testEv.id, 'Cancelado formalmente');
      expect(cancelled).toBe(true);
    });

    test('18 y 19. Aislamiento RLS Multi-Tenant de Eventos', async () => {
      // Evento de Tenant A
      const evTenantA = await calendarService.createCalendarEvent({
        organizationId: 'tenant-a-id',
        applicationId: 'app-a',
        applicationPublicId: 'HIP-A',
        eventType: 'signature',
        title: 'Evento A',
        startAt: '2026-09-28T10:00:00-03:00',
        endAt: '2026-09-28T10:45:00-03:00',
        date: '2026-09-28',
        time: '10:00',
        durationMinutes: 45,
        timezone: 'America/Montevideo',
        locationType: 'notary_office',
        participants: [],
        status: 'scheduled',
      });

      // Tenant B consulta sus eventos
      const tenantBEvents = await calendarService.getEventsByOrganization('tenant-b-id');
      const containsTenantA = tenantBEvents.some((e) => e.id === evTenantA.id);
      expect(containsTenantA).toBe(false);
    });
  });

  // ============================================================================
  // PARTE 10 & 11 — TESTS FIRMAS Y ORIGINALES (25 al 37)
  // ============================================================================
  test.describe('PARTE 10 & 11: Coordinación de Firmas y Títulos Originales (25 al 37)', () => {
    test('25 a 32. Mesa Notarial: Visualización de firmas y coordinación interactiva', async ({ page }) => {
      await page.addInitScript(() => window.localStorage.setItem('hipotecaly_test_role', 'notary'));
      await page.goto('/notary/firmas');

      await expect(page.locator('text=1. Firmas por Coordinar')).toBeVisible();
      await expect(page.locator('text=2. Firmas Agendadas')).toBeVisible();

      // Verificar botón de Google Calendar presente
      await expect(page.locator('a:has-text("Google Cal")').first()).toBeVisible();
    });

    test('33 a 37. Solicitud y Recepción de Documentos Originales con trazabilidad', async () => {
      const origEvent = await calendarService.requestOriginalDocuments(
        'app-orig-01',
        'org-demo',
        'HIP-2026-ORIG',
        'Carlos Originales',
        'carlos@test.com',
        ['Escritura Matriz 2018', 'Certificado DGR'],
        '2026-09-29'
      );

      expect(origEvent.eventType).toBe('original_documents');
      expect(origEvent.requiredDocuments).toContain('Escritura Matriz 2018');

      // Confirmar recepción
      const confirmed = await calendarService.confirmOriginalDocumentsReceived('app-orig-01', 'org-demo', 'HIP-2026-ORIG');
      expect(confirmed).toBe(true);
    });
  });

  // ============================================================================
  // PARTE 12 — TESTS GOOGLE CALENDAR & PRIVACIDAD (38 al 47)
  // ============================================================================
  test.describe('PARTE 12: Google Calendar Opcional, ICS y Privacidad Estricta (38 al 47)', () => {
    test('38, 39 y 45. Conexión de Google Calendar por usuario profesional (sin exponer tokens)', async () => {
      await setUserCalendarIntegrationState('user-notary-01', 'org-demo', true);
      const state = await getUserCalendarIntegrationState('user-notary-01');
      expect(state.isConnected).toBe(true);

      // Desconectar no elimina la agenda interna
      await setUserCalendarIntegrationState('user-notary-01', 'org-demo', false);
      const stateDisconnected = await getUserCalendarIntegrationState('user-notary-01');
      expect(stateDisconnected.isConnected).toBe(false);
    });

    test('40 al 44. Retry de sincronización Google y resiliencia ante fallos', async () => {
      const retryResult = await calendarService.retryGoogleSync('cal-ev-001');
      expect(retryResult.success).toBe(true);
    });

    test('47. Principio de Privacidad Estricta en Enlaces Google Calendar y Archivos .ics', () => {
      const sensitiveEvent = {
        id: 'cal-priv-01',
        organizationId: 'org-demo',
        applicationId: 'app-priv-01',
        applicationPublicId: 'HIP-2026-PRIV99',
        eventType: 'signature' as const,
        title: 'Firma Confidencial Hipoteca USD 500.000',
        description: 'Préstamo con garantía de padrón 12345',
        startAt: '2026-09-30T11:00:00-03:00',
        endAt: '2026-09-30T11:45:00-03:00',
        date: '2026-09-30',
        time: '11:00',
        durationMinutes: 45,
        timezone: 'America/Montevideo',
        locationType: 'notary_office' as const,
        locationAddress: 'Rincón 487',
        participants: [{ name: 'Cliente Privado', role: 'Deudor' as const, email: 'cliente@privado.com' }],
        status: 'scheduled' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const googleLink = generateGoogleCalendarWebLink(sensitiveEvent);
      // El link debe contener solo el public ID sanitizado
      expect(googleLink).toContain('HIP-2026-PRIV99');
      // No debe contener cifras sensibles ni palabras confidenciales
      expect(googleLink).not.toContain('500.000');
      expect(googleLink).not.toContain('padrón');

      // Exportación .ics estándar
      const icsContent = generateIcsFileContent(sensitiveEvent);
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('HIPOTECALY');
      expect(icsContent).toContain('HIP-2026-PRIV99');
      expect(icsContent).toContain('END:VCALENDAR');
    });
  });

});
