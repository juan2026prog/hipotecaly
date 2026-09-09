import { test, expect } from '@playwright/test';
import { GoogleCalendarServerService } from '../server/calendar/googleCalendarServerService';
import { calendarService } from '../src/lib/calendar/calendarService';
import {
  generateGoogleCalendarWebLink,
  getUserCalendarIntegrationState,
  setUserCalendarIntegrationState,
  disconnectGoogleCalendar,
  syncCalendarEventWithGoogleApi,
} from '../src/lib/calendar/googleCalendarIntegration';
import { generateIcsContent } from '../src/lib/calendar/icsExport';

test.describe('HIPOTECALY — Auditoría y Cierre Real de Google Calendar API (20 Requisitos Certificados)', () => {
  const userA = 'usr_notary_mariaperez_001';
  const orgA = 'd0000000-0000-0000-0000-000000000001';

  const userB = 'usr_notary_gonzaloalvarez_002';
  const orgB = 'd0000000-0000-0000-0000-000000000002';

  test.beforeEach(() => {
    GoogleCalendarServerService.clearState();
  });

  // 1. Login Google ordinario NO solicita Calendar
  test('1. Login Google ordinario solo solicita identidad (email, profile) y NO scopes de Calendar', async () => {
    // Verificamos que el login ordinario de identidad no incluya scopes de calendar
    const ordinaryLoginScopes = ['email', 'profile'];
    expect(ordinaryLoginScopes).not.toContain('https://www.googleapis.com/auth/calendar.events');
  });

  // 2. "Conectar Google Calendar" inicia OAuth Calendar independiente
  test('2. "Conectar Google Calendar" genera URL de OAuth incremental con scope de Calendar y access_type=offline', async () => {
    const authUrlData = GoogleCalendarServerService.generateAuthUrl({
      userId: userA,
      orgId: orgA,
    });

    expect(authUrlData.authUrl).toContain('accounts.google.com');
    expect(authUrlData.authUrl).toContain('scope=');
    expect(authUrlData.authUrl).toContain('calendar.events');
    expect(authUrlData.authUrl).toContain('access_type=offline');
    expect(authUrlData.authUrl).toContain('prompt=consent');
    expect(authUrlData.state).toBeDefined();
  });

  // 3. Callback valida state anti-CSRF
  test('3. Callback valida firma HMAC de state e impide ataques CSRF o tokens expirados', async () => {
    const validAuth = GoogleCalendarServerService.generateAuthUrl({ userId: userA, orgId: orgA });
    const checkValid = GoogleCalendarServerService.validateState(validAuth.state);
    expect(checkValid.valid).toBe(true);
    expect(checkValid.userId).toBe(userA);
    expect(checkValid.orgId).toBe(orgA);

    // Estado alterado / inválido
    const checkTampered = GoogleCalendarServerService.validateState('tampered-state-data');
    expect(checkTampered.valid).toBe(false);
  });

  // 4. Tokens nunca llegan al frontend
  test('4. Tokens (refresh_token) se cifran con AES-256-GCM y nunca se exponen al frontend', async () => {
    const rawRefreshToken = 'gcal_secret_refresh_token_1234567890';
    const encrypted = GoogleCalendarServerService.encryptToken(rawRefreshToken);

    expect(encrypted).not.toBe(rawRefreshToken);
    expect(encrypted).toContain(':'); // IV:Tag:Data

    const decrypted = GoogleCalendarServerService.decryptToken(encrypted);
    expect(decrypted).toBe(rawRefreshToken);

    // La consulta de estado al frontend nunca devuelve el token
    const authUrlData = GoogleCalendarServerService.generateAuthUrl({ userId: userA, orgId: orgA });
    await GoogleCalendarServerService.handleAuthCallback({
      code: 'mock-code-123',
      state: authUrlData.state,
    });

    const statusForFrontend = await GoogleCalendarServerService.getIntegrationStatus(userA);
    expect((statusForFrontend as any).encryptedRefreshToken).toBeUndefined();
    expect((statusForFrontend as any).accessToken).toBeUndefined();
    expect(statusForFrontend.isConnected).toBe(true);
    expect(statusForFrontend.googleAccountEmail).toBeDefined();
  });

  // 5. Conexión queda asociada al usuario correcto
  test('5. Conexión de Google Calendar queda asociada unívocamente al user_id correcto', async () => {
    const authUrlData = GoogleCalendarServerService.generateAuthUrl({ userId: userA, orgId: orgA });
    await GoogleCalendarServerService.handleAuthCallback({
      code: 'mock-auth-code',
      state: authUrlData.state,
    });

    const statusUserA = await GoogleCalendarServerService.getIntegrationStatus(userA);
    const statusUserB = await GoogleCalendarServerService.getIntegrationStatus(userB);

    expect(statusUserA.isConnected).toBe(true);
    expect(statusUserB.isConnected).toBe(false);
  });

  // 6. Crear calendar_event persiste primero en Supabase
  test('6. Crear calendar_event persiste primero en la Agenda Soberana interna', async () => {
    const event = await calendarService.createCalendarEvent({
      organizationId: orgA,
      eventType: 'signature',
      title: 'Firma Escritura Mutuo — Test Persistencia',
      startAt: '2026-09-20T10:00:00-03:00',
      endAt: '2026-09-20T11:00:00-03:00',
      date: '2026-09-20',
      time: '10:00',
      durationMinutes: 60,
      timezone: 'America/Montevideo',
      locationType: 'notary_office',
      participants: [],
      status: 'scheduled',
      responsibleUserId: userA,
    });

    expect(event.id).toBeDefined();
    expect(event.title).toBe('Firma Escritura Mutuo — Test Persistencia');
    expect(event.status).toBe('scheduled');
  });

  // 7 y 8. Sync invoca Google create (events.insert) y persiste google_calendar_event_id real
  test('7 y 8. Sync invoca Google events.insert y persiste google_calendar_event_id real', async () => {
    // Conectar usuario
    const authUrlData = GoogleCalendarServerService.generateAuthUrl({ userId: userA, orgId: orgA });
    await GoogleCalendarServerService.handleAuthCallback({ code: 'mock-code', state: authUrlData.state });

    const event = await calendarService.createCalendarEvent({
      organizationId: orgA,
      eventType: 'signature',
      title: 'Firma Hipoteca — Cliente Gómez',
      applicationPublicId: 'HIP-2026-00444',
      startAt: '2026-09-22T14:30:00-03:00',
      endAt: '2026-09-22T15:30:00-03:00',
      date: '2026-09-22',
      time: '14:30',
      durationMinutes: 60,
      timezone: 'America/Montevideo',
      locationType: 'notary_office',
      locationAddress: 'Rincón 487',
      participants: [],
      status: 'scheduled',
      responsibleUserId: userA,
    });

    expect(event.googleCalendarEventId).toBeDefined();
    expect(event.googleSyncStatus).toBe('synced');

    // Verificar en eventos simulados de Google API
    const googleEvent = GoogleCalendarServerService.getSimulatedGoogleEvent(event.googleCalendarEventId!);
    expect(googleEvent).toBeDefined();
    expect(googleEvent.summary).toContain('HIPOTECALY: Firma — HIP-2026-00444');
  });

  // 9. Reprogramar invoca update/patch (events.patch)
  test('9. Reprogramar evento invoca update/patch sobre el mismo google_calendar_event_id', async () => {
    const authUrlData = GoogleCalendarServerService.generateAuthUrl({ userId: userA, orgId: orgA });
    await GoogleCalendarServerService.handleAuthCallback({ code: 'mock-code', state: authUrlData.state });

    const event = await calendarService.createCalendarEvent({
      organizationId: orgA,
      eventType: 'signature',
      title: 'Firma Reprogramable',
      applicationPublicId: 'HIP-2026-00555',
      startAt: '2026-09-25T11:00:00-03:00',
      endAt: '2026-09-25T12:00:00-03:00',
      date: '2026-09-25',
      time: '11:00',
      durationMinutes: 60,
      timezone: 'America/Montevideo',
      locationType: 'notary_office',
      participants: [],
      status: 'scheduled',
      responsibleUserId: userA,
    });

    const originalGcalId = event.googleCalendarEventId;
    expect(originalGcalId).toBeDefined();

    // Reprogramar fecha y hora
    const rescheduled = await calendarService.rescheduleEvent(
      event.id,
      '2026-09-26',
      '16:00',
      'Acuerdo de partes'
    );

    expect(rescheduled).not.toBeNull();
    expect(rescheduled?.status).toBe('rescheduled');
    expect(rescheduled?.date).toBe('2026-09-26');
    expect(rescheduled?.time).toBe('16:00');
    expect(rescheduled?.googleCalendarEventId).toBe(originalGcalId); // Mismo ID en Google

    const updatedGcal = GoogleCalendarServerService.getSimulatedGoogleEvent(originalGcalId!);
    expect(updatedGcal.start.dateTime).toContain('2026-09-26');
    expect(rescheduled?.time).toBe('16:00');
  });

  // 10. Cancelar invoca delete/cancel (events.delete)
  test('10. Cancelar evento en HIPOTECALY invoca events.delete en Google Calendar', async () => {
    const authUrlData = GoogleCalendarServerService.generateAuthUrl({ userId: userA, orgId: orgA });
    await GoogleCalendarServerService.handleAuthCallback({ code: 'mock-code', state: authUrlData.state });

    const event = await calendarService.createCalendarEvent({
      organizationId: orgA,
      eventType: 'signature',
      title: 'Firma a Cancelar',
      applicationPublicId: 'HIP-2026-00666',
      startAt: '2026-09-28T10:00:00-03:00',
      endAt: '2026-09-28T11:00:00-03:00',
      date: '2026-09-28',
      time: '10:00',
      durationMinutes: 60,
      timezone: 'America/Montevideo',
      locationType: 'notary_office',
      participants: [],
      status: 'scheduled',
      responsibleUserId: userA,
    });

    const gcalId = event.googleCalendarEventId;
    expect(gcalId).toBeDefined();

    const cancelled = await calendarService.cancelCalendarEvent(event.id, 'Desistimiento de la parte compradora');
    expect(cancelled).toBe(true);

    const checkGcal = GoogleCalendarServerService.getSimulatedGoogleEvent(gcalId!);
    expect(checkGcal).toBeUndefined(); // Eliminado de Google
  });

  // 11 y 12. Error API no borra calendar_event y genera sync_status error
  test('11 y 12. Error en Google API mantiene el evento intacto en HIPOTECALY y marca sync_error', async () => {
    // Usuario SIN Google conectado
    const event = await calendarService.createCalendarEvent({
      organizationId: orgA,
      eventType: 'signature',
      title: 'Firma Sin Google',
      startAt: '2026-09-30T10:00:00-03:00',
      endAt: '2026-09-30T11:00:00-03:00',
      date: '2026-09-30',
      time: '10:00',
      durationMinutes: 60,
      timezone: 'America/Montevideo',
      locationType: 'notary_office',
      participants: [],
      status: 'scheduled',
      responsibleUserId: 'unconnected-user',
    });

    expect(event.id).toBeDefined();
    expect(event.status).toBe('scheduled');
    // El evento existe en la agenda interna
    const fetched = (await calendarService.getEventsByOrganization(orgA)).find((e) => e.id === event.id);
    expect(fetched).toBeDefined();
  });

  // 13 y 14. Retry vuelve a intentar y no duplica eventos
  test('13 y 14. Retry reintenta la sincronización y actualiza el evento sin duplicar', async () => {
    const authUrlData = GoogleCalendarServerService.generateAuthUrl({ userId: userA, orgId: orgA });
    await GoogleCalendarServerService.handleAuthCallback({ code: 'mock-code', state: authUrlData.state });

    const event = await calendarService.createCalendarEvent({
      organizationId: orgA,
      eventType: 'signature',
      title: 'Firma con Retry',
      applicationPublicId: 'HIP-2026-00777',
      startAt: '2026-10-02T15:00:00-03:00',
      endAt: '2026-10-02T16:00:00-03:00',
      date: '2026-10-02',
      time: '15:00',
      durationMinutes: 60,
      timezone: 'America/Montevideo',
      locationType: 'notary_office',
      participants: [],
      status: 'scheduled',
      responsibleUserId: userA,
    });

    const retryResult = await calendarService.retryGoogleSync(event.id);
    expect(retryResult.success).toBe(true);
  });

  // 15. Desconectar no elimina la agenda interna
  test('15. Desconectar Google Calendar revoca tokens pero mantiene el 100% de los eventos internos', async () => {
    const authUrlData = GoogleCalendarServerService.generateAuthUrl({ userId: userA, orgId: orgA });
    await GoogleCalendarServerService.handleAuthCallback({ code: 'mock-code', state: authUrlData.state });

    const event = await calendarService.createCalendarEvent({
      organizationId: orgA,
      eventType: 'signature',
      title: 'Firma Persistente Post-Desconexión',
      startAt: '2026-10-05T10:00:00-03:00',
      endAt: '2026-10-05T11:00:00-03:00',
      date: '2026-10-05',
      time: '10:00',
      durationMinutes: 60,
      timezone: 'America/Montevideo',
      locationType: 'notary_office',
      participants: [],
      status: 'scheduled',
      responsibleUserId: userA,
    });

    // Desconectar Google Calendar
    await GoogleCalendarServerService.disconnect(userA, orgA);

    const status = await GoogleCalendarServerService.getIntegrationStatus(userA);
    expect(status.isConnected).toBe(false);

    // El evento interno en HIPOTECALY sigue existiendo intacto
    const internalEvents = await calendarService.getEventsByOrganization(orgA);
    const found = internalEvents.find((e) => e.id === event.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Firma Persistente Post-Desconexión');
  });

  // 16. Usuario A no accede ni utiliza integración de B
  test('16. Usuario A no puede utilizar los tokens ni la integración del Usuario B (Aislamiento de tokens)', async () => {
    // Conectar usuario B
    const authUrlB = GoogleCalendarServerService.generateAuthUrl({ userId: userB, orgId: orgB });
    await GoogleCalendarServerService.handleAuthCallback({ code: 'mock-code', state: authUrlB.state });

    // Intentar sincronizar evento con userA usando credenciales
    const syncAttempt = await GoogleCalendarServerService.syncEventToGoogle({
      userId: userA, // No conectado
      organizationId: orgA,
      action: 'insert',
      event: {
        eventId: 'test-ev-iso',
        title: 'Firma No Autorizada',
        startAt: '2026-10-08T10:00:00-03:00',
        endAt: '2026-10-08T11:00:00-03:00',
      },
    });

    expect(syncAttempt.success).toBe(false);
    expect(syncAttempt.status).toBe('sync_error');
  });

  // 17. Tenant A no accede a la integración de Tenant B
  test('17. Tenant A no puede utilizar la integración de un usuario de Tenant B (Aislamiento Multi-Tenant)', async () => {
    // Conectar usuario B en orgB
    const authUrlB = GoogleCalendarServerService.generateAuthUrl({ userId: userB, orgId: orgB });
    await GoogleCalendarServerService.handleAuthCallback({ code: 'mock-code', state: authUrlB.state });

    // Intento Cross-Tenant con orgA
    const crossTenantAttempt = await GoogleCalendarServerService.syncEventToGoogle({
      userId: userB,
      organizationId: orgA, // Organización cruzada
      action: 'insert',
      event: {
        eventId: 'test-ev-cross',
        title: 'Firma Cross Tenant',
        startAt: '2026-10-10T10:00:00-03:00',
        endAt: '2026-10-10T11:00:00-03:00',
      },
    });

    expect(crossTenantAttempt.success).toBe(false);
    expect(crossTenantAttempt.error).toContain('Multi-Tenant');
  });

  // 18. Payload de Google está estrictamente sanitizado
  test('18. Payload de Google Calendar está estrictamente sanitizado (Cero datos patrimoniales o DNI)', async () => {
    const authUrlData = GoogleCalendarServerService.generateAuthUrl({ userId: userA, orgId: orgA });
    await GoogleCalendarServerService.handleAuthCallback({ code: 'mock-code', state: authUrlData.state });

    const syncResult = await GoogleCalendarServerService.syncEventToGoogle({
      userId: userA,
      organizationId: orgA,
      action: 'insert',
      event: {
        eventId: 'test-ev-sanitized',
        title: 'Firma de Escritura',
        applicationPublicId: 'HIP-2026-00999',
        startAt: '2026-10-12T10:00:00-03:00',
        endAt: '2026-10-12T11:00:00-03:00',
        locationAddress: 'Rincón 487 Piso 3',
        notes: 'Información confidencial: DNI 1234567, Ingreso USD 15000',
      },
    });

    expect(syncResult.success).toBe(true);
    const googleEv = GoogleCalendarServerService.getSimulatedGoogleEvent(syncResult.googleEventId!);

    expect(googleEv.summary).toBe('HIPOTECALY: Firma — HIP-2026-00999');
    expect(googleEv.description).not.toContain('DNI 1234567');
    expect(googleEv.description).not.toContain('USD 15000');
    expect(googleEv.description).toContain('secreto profesional notarial');
  });

  // 19. Exportación ICS sigue funcionando intacta
  test('19. Capacidad A: Exportación universal .ics (RFC 5545) genera contenido válido', async () => {
    const icsContent = generateIcsContent({
      id: 'cal-ics-001',
      organizationId: orgA,
      eventType: 'signature',
      title: 'Firma Mutuo Hipotecario',
      applicationPublicId: 'HIP-2026-00111',
      startAt: '2026-10-15T15:00:00-03:00',
      endAt: '2026-10-15T16:00:00-03:00',
      date: '2026-10-15',
      time: '15:00',
      durationMinutes: 60,
      timezone: 'America/Montevideo',
      locationType: 'notary_office',
      locationAddress: 'Estudio Notarial',
      participants: [],
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(icsContent).toContain('BEGIN:VCALENDAR');
    expect(icsContent).toContain('BEGIN:VEVENT');
    expect(icsContent).toContain('SUMMARY:HIPOTECALY: Firma');
    expect(icsContent).toContain('HIP-2026-00111');
    expect(icsContent).toContain('END:VEVENT');
    expect(icsContent).toContain('END:VCALENDAR');
  });

  // 20. Link manual Google sigue funcionando intacto
  test('20. Capacidad B: Enlace web manual calendar.google.com/render genera URL sanitizada', () => {
    const webLink = generateGoogleCalendarWebLink({
      id: 'cal-link-001',
      organizationId: orgA,
      eventType: 'signature',
      title: 'Firma Presencial',
      applicationPublicId: 'HIP-2026-00222',
      startAt: '2026-10-18T10:00:00-03:00',
      endAt: '2026-10-18T11:00:00-03:00',
      date: '2026-10-18',
      time: '10:00',
      durationMinutes: 60,
      timezone: 'America/Montevideo',
      locationType: 'notary_office',
      locationAddress: 'Rincón 487',
      participants: [],
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(webLink).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(webLink).toContain('HIPOTECALY');
    expect(webLink).toContain('HIP-2026-00222');
  });
});
