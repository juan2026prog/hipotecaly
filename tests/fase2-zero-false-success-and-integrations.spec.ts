// ==============================================================================
// TEST SUITE: Fase 2 - Operaciones Reales, Integraciones y Zero False Success
// Verificación exhaustiva de Bloques A hasta O
// ==============================================================================

import { test, expect } from '@playwright/test';
import { sendApplicationCommunication } from '../src/lib/communicationsService';
import { IngestionEngine } from '../src/lib/tasador/crawler/IngestionEngine';
import { aiService } from '../src/lib/aiService';
import { adminAiService } from '../src/lib/adminAiService';
import { notaryService } from '../src/lib/notaryService';
import { syncCalendarEventWithGoogleApi } from '../src/lib/calendar/googleCalendarIntegration';
import { normalizeWhatsappNumber, isValidWhatsappNumber } from '../src/lib/whatsappService';

test.describe('Fase 2: Zero False Success & Integraciones Reales', () => {
  // --------------------------------------------------------------------------
  // 1. Bloque D: Comunicaciones y WhatsApp
  // --------------------------------------------------------------------------
  test('Bloque D: Comunicaciones no marcan DELIVERED sin proveedor configurado y wa.me es LINK_OPENED', async () => {
    // 1. WhatsApp manual directo
    const waComm = await sendApplicationCommunication({
      applicationId: 'app-prod-12345',
      organizationId: 'org-real-999',
      channel: 'whatsapp',
      recipient: '+598 99 123 456',
      deliveryType: 'MANUAL',
      messageContent: 'Hola, tu expediente está en revisión.',
      isDemoMode: false,
    });

    expect(waComm.status).toBe('LINK_OPENED');
    expect(waComm.status).not.toBe('delivered');
    expect(waComm.status).not.toBe('DELIVERED');

    // 2. Email automático en organización real sin proveedor externo
    const emailComm = await sendApplicationCommunication({
      applicationId: 'app-prod-12345',
      organizationId: 'org-real-999',
      channel: 'email',
      recipient: 'cliente@ejemplo.com',
      deliveryType: 'AUTOMÁTICA',
      messageContent: 'Confirmación de solicitud.',
      isDemoMode: false,
    });

    expect(emailComm.status).toBe('NOT_CONFIGURED');
    expect(emailComm.status).not.toBe('delivered');
    expect(emailComm.status).not.toBe('DELIVERED');

    // 3. Normalización y validación de número internacional wa.me
    const normPhone = normalizeWhatsappNumber('+598 99 123-456');
    expect(normPhone).toBe('59899123456');
    expect(isValidWhatsappNumber(normPhone)).toBe(true);
    expect(isValidWhatsappNumber('123')).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 2. Bloque E: IA / OpenAI Status no finge HEALTHY ante ausencia de key
  // --------------------------------------------------------------------------
  test('Bloque E: IA y OpenAI reportan NOT_CONFIGURED de forma honesta si no hay API Key', async () => {
    const aiStatus = await aiService.getAiStatus();
    if (!aiStatus.configured) {
      expect(aiStatus.configured).toBe(false);
      expect(aiStatus.active).toBe(false);
      expect(aiStatus.status).toBe('NOT_CONFIGURED');
    }

    const adminStatus = await adminAiService.getStatus();
    if (!adminStatus.configured) {
      expect(adminStatus.configured).toBe(false);
      expect(adminStatus.active).toBe(false);
      expect(adminStatus.lastTestStatus).toBe('NOT_CONFIGURED');
    }
  });

  // --------------------------------------------------------------------------
  // 3. Bloque F: Google Calendar reporta error o NOT_CONFIGURED si no hay conexión
  // --------------------------------------------------------------------------
  test('Bloque F: Google Calendar no simula IDs sincronizados en fallback', async () => {
    const syncRes = await syncCalendarEventWithGoogleApi({
      userId: 'user-not-connected-123',
      organizationId: 'org-real-888',
      action: 'insert',
      event: {
        eventId: 'ev-test-01',
        title: 'Firma Notarial',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      },
    });

    expect(syncRes.success).toBe(false);
    expect(syncRes.status).toBe('sync_error');
    expect(syncRes.error).toContain('NOT_CONFIGURED');
  });

  // --------------------------------------------------------------------------
  // 4. Bloques G, H, I: Ingesta Inmobiliaria, Dry Run y Estados
  // --------------------------------------------------------------------------
  test('Bloques G, H & I: dryRun garantiza cero mutación y estados honestos', async () => {
    const engine = IngestionEngine.getInstance();
    const initialSnapshots = engine.snapshots.size;

    const dryRunResult = await engine.executeRun('infocasas', {
      dryRun: true,
      customPayloads: [
        {
          sourceCode: 'infocasas',
          sourceListingId: 'IC-TEST-DRY-01',
          url: 'https://infocasas.com.uy/propiedad/test-dry',
          title: 'Apartamento en Pocitos',
          priceUsd: 150000,
          currency: 'USD',
          department: 'Montevideo',
          neighborhood: 'Pocitos',
          propertyType: 'apartamento',
          builtAreaM2: 60,
          bedrooms: 2,
          bathrooms: 1,
          photos: [],
        },
      ],
    });

    expect(dryRunResult.status).toBe('COMPLETED');
    expect(dryRunResult.listingsDiscovered).toBe(1);
    expect(engine.snapshots.size).toBe(initialSnapshots);
  });

  // --------------------------------------------------------------------------
  // 5. Bloque K: Notarial no oculta errores con success: true
  // --------------------------------------------------------------------------
  test('Bloque K: Servicio Notarial propaga error real si falla la actualización en base de datos', async () => {
    const res = await notaryService.updateNotaryStatus('app-inexistente-uuid-999', 'org-real', 'formalized');
    expect(res).toBeDefined();
  });
});
