import { test, expect } from '@playwright/test';
import http from 'http';
import crypto from 'crypto';
import { EnterpriseApiKeyService } from '../server/enterprise/apiKeyService';
import { EnterpriseWebhookDispatcher } from '../server/enterprise/webhookDispatcher';
import { BillingService } from '../src/lib/billingService';
import simulationsHandler from '../server/enterprise/handlers/simulationsHandler';
import applicationsHandler from '../server/enterprise/handlers/applicationsHandler';
import webhooksHandler from '../server/enterprise/handlers/webhooksHandler';

// Helper para invocar Serverless Handlers HTTP en entorno de prueba
async function invokeHandler(handler: Function, reqOptions: {
  method: string;
  headers?: Record<string, string>;
  body?: any;
}) {
  let statusCode = 200;
  let responseBody: any = null;
  const headers: Record<string, string> = {};

  const req = {
    method: reqOptions.method,
    headers: reqOptions.headers || {},
    body: reqOptions.body || {},
  };

  const res = {
    setHeader(key: string, value: string) {
      headers[key] = value;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      responseBody = data;
      return this;
    },
  };

  await handler(req, res);
  return { statusCode, body: responseBody, headers };
}

test.describe('MACROFASE 7.1: REAL PUBLIC API V1 & WEBHOOKS PRODUCTION HARDENING', () => {
  const testTenant = 'tenant_qa_synthetic_credisur';
  let validKeyWithSim: string;
  let validKeyWithApp: string;

  test.beforeEach(async () => {
    EnterpriseApiKeyService.clearCache();
    EnterpriseWebhookDispatcher.clearCache();

    // Generar claves reales con CSPRNG y SHA-256
    const simKeyRes = await EnterpriseApiKeyService.createApiKey({
      tenantId: testTenant,
      name: 'Simulations Read Key',
      scopes: ['read:simulations'],
    });
    validKeyWithSim = simKeyRes.rawKey;

    const appKeyRes = await EnterpriseApiKeyService.createApiKey({
      tenantId: testTenant,
      name: 'Applications Write Key',
      scopes: ['write:applications', 'admin:webhooks'],
    });
    validKeyWithApp = appKeyRes.rawKey;
  });

  test.afterEach(() => {
    EnterpriseApiKeyService.clearCache();
    EnterpriseWebhookDispatcher.clearCache();
  });

  // --------------------------------------------------------------------------
  // 1. TESTS DE AUTENTICACIÓN Y SCOPES REST HTTP
  // --------------------------------------------------------------------------

  test('1.1 Petición a /api/v1/simulations sin cabecera de autenticación retorna 401 Unauthorized', async () => {
    const res = await invokeHandler(simulationsHandler, {
      method: 'POST',
      body: { propertyValueUsd: 100000, requestedAmountUsd: 30000 },
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
    expect(res.body.message).toContain('Cabecera de autenticación ausente');
  });

  test('1.2 Petición con API Key malformada o inválida retorna 401 Unauthorized', async () => {
    const res = await invokeHandler(simulationsHandler, {
      method: 'POST',
      headers: { authorization: 'Bearer hpt_live_invalid_secret_key_9999' },
      body: { propertyValueUsd: 100000, requestedAmountUsd: 30000 },
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain('API Key no válida o inexistente');
  });

  test('1.3 Petición a /api/v1/applications con clave que no tiene scope write:applications retorna 403 Forbidden', async () => {
    const res = await invokeHandler(applicationsHandler, {
      method: 'POST',
      headers: { authorization: `Bearer ${validKeyWithSim}` }, // Solo tiene read:simulations
      body: {
        borrowerName: 'Test Borrower',
        borrowerEmail: 'test@example.com',
        requestedAmountUsd: 30000,
        propertyEstimatedValueUsd: 100000,
      },
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Unauthorized');
    expect(res.body.message).toContain("Se requiere el scope 'write:applications'");
  });

  // --------------------------------------------------------------------------
  // 2. TESTS DE ENDPOINTS REST REALES
  // --------------------------------------------------------------------------

  test('2.1 Simulación institucional exitosa (LTV 35% <= 40%) retorna 200 OK con cálculo paramétrico', async () => {
    const res = await invokeHandler(simulationsHandler, {
      method: 'POST',
      headers: { authorization: `Bearer ${validKeyWithSim}` },
      body: {
        propertyValueUsd: 100000,
        requestedAmountUsd: 35000,
        termMonths: 36,
        propertyDepartment: 'Canelones',
        propertyType: 'casa',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.ltvPct).toBe(35);
    expect(res.body.maxAllowedLoanUsd).toBe(40000); // 40% de 100k
    expect(res.body.estimatedMonthlyPaymentUsd).toBeGreaterThan(0);
    expect(res.body.annualInterestRatePct).toBe(11.5);
  });

  test('2.2 Simulación que supera política máxima (LTV 60% > 40%) retorna 422 Unprocessable Entity', async () => {
    const res = await invokeHandler(simulationsHandler, {
      method: 'POST',
      headers: { authorization: `Bearer ${validKeyWithSim}` },
      body: {
        propertyValueUsd: 100000,
        requestedAmountUsd: 60000, // 60%
        termMonths: 36,
      },
    });

    expect(res.statusCode).toBe(422);
    expect(res.body.valid).toBe(false);
    expect(res.body.ltvPct).toBe(60);
    expect(res.body.rejectionReason).toContain('excede la política crediticia');
  });

  test('2.3 Ingesta de solicitud vía /api/v1/applications valida payload y retorna 201 Created con tracking URL', async () => {
    const res = await invokeHandler(applicationsHandler, {
      method: 'POST',
      headers: { authorization: `Bearer ${validKeyWithApp}` },
      body: {
        borrowerName: 'Ignacio Morales',
        borrowerEmail: 'ignacio@credisur.uy',
        borrowerPhone: '+598 99 123 456',
        requestedAmountUsd: 38000,
        propertyEstimatedValueUsd: 110000,
        propertyDepartment: 'Montevideo',
        propertyPadron: '19.420',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.caseId).toMatch(/^API-/);
    expect(res.body.tenantId).toBe(testTenant);
    expect(res.body.status).toBe('prequalified'); // 38k / 110k = 34% <= 40%
    expect(res.body.accessTrackingUrl).toContain(res.body.caseId);
  });

  // --------------------------------------------------------------------------
  // 3. TESTS DE WEBHOOKS REALES: HTTP SERVER RECEIVER & HMAC-SHA256
  // --------------------------------------------------------------------------

  test('3.1 Webhook HTTP real: Entrega a servidor receptor, validación de cabeceras y firma HMAC-SHA256', async () => {
    let receivedPayload: any = null;
    let receivedSignatureHeader: string | undefined = undefined;
    let receivedEventId: string | undefined = undefined;
    let receivedEventType: string | undefined = undefined;

    // Crear servidor HTTP local receptor de webhooks
    const server = http.createServer((req, res) => {
      receivedSignatureHeader = req.headers['x-hipotecaly-signature'] as string;
      receivedEventId = req.headers['x-hipotecaly-event-id'] as string;
      receivedEventType = req.headers['x-hipotecaly-event-type'] as string;

      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        receivedPayload = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address() as any;
    const receiverUrl = `http://127.0.0.1:${address.port}/webhook-test`;

    try {
      // Registrar webhook
      const webhook = await EnterpriseWebhookDispatcher.registerWebhook({
        tenantId: testTenant,
        url: receiverUrl,
        events: ['application.created'],
      });

      expect(webhook.signingSecret).toMatch(/^whsec_/);

      // Despachar evento
      const testEventPayload = {
        caseId: 'CASE-WH-001',
        borrower: 'Elena Costa',
        amountUsd: 50000,
      };

      const delivery = await EnterpriseWebhookDispatcher.dispatchEventToWebhook(
        webhook,
        'application.created',
        testEventPayload
      );

      // Verificar que el servidor HTTP local recibió el request
      expect(delivery.success).toBe(true);
      expect(delivery.statusCode).toBe(200);
      expect(delivery.attemptNumber).toBe(1);

      expect(receivedPayload).toEqual(testEventPayload);
      expect(receivedEventType).toBe('application.created');
      expect(receivedEventId).toBeDefined();

      // Verificar criptografía de la firma HMAC
      expect(receivedSignatureHeader).toBeDefined();
      const match = receivedSignatureHeader!.match(/t=(\d+),v1=([a-f0-9]+)/);
      expect(match).not.toBeNull();

      const timestamp = match![1];
      const signature = match![2];

      const expectedSignature = crypto
        .createHmac('sha256', webhook.signingSecret)
        .update(`${timestamp}.${JSON.stringify(testEventPayload)}`)
        .digest('hex');

      expect(signature).toBe(expectedSignature);
    } finally {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  test('3.2 Webhook con fallo 500: Dispara reintento y registra error en el delivery log', async () => {
    let callCount = 0;

    const failingServer = http.createServer((req, res) => {
      callCount++;
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    });

    await new Promise<void>((resolve) => failingServer.listen(0, '127.0.0.1', () => resolve()));
    const address = failingServer.address() as any;
    const receiverUrl = `http://127.0.0.1:${address.port}/fail-webhook`;

    try {
      const webhook = await EnterpriseWebhookDispatcher.registerWebhook({
        tenantId: testTenant,
        url: receiverUrl,
        events: ['application.created'],
      });

      const delivery = await EnterpriseWebhookDispatcher.dispatchEventToWebhook(
        webhook,
        'application.created',
        { test: 'failure' },
        2 // Max 2 reintentos
      );

      expect(delivery.success).toBe(false);
      expect(delivery.statusCode).toBe(500);
      expect(delivery.attemptNumber).toBe(2); // Se reintentó
      expect(callCount).toBe(2);
      expect(delivery.errorMessage).toContain('HTTP Error 500');
    } finally {
      failingServer.closeAllConnections?.();
      await new Promise<void>((resolve) => failingServer.close(() => resolve()));
    }
  });

  // --------------------------------------------------------------------------
  // 4. TESTS DE BILLING REALITY: ESTADO FISCAL Y PRECIOS PROVISIONALES
  // --------------------------------------------------------------------------

  test('4.1 Tenant sin suscripción previa recibe estado explícito "trial" sin add-ons auto-asignados', () => {
    const unassignedTenant = 'tenant_new_unconfigured_001';
    const sub = BillingService.getSubscription(unassignedTenant);

    expect(sub.status).toBe('trial');
    expect(sub.planId).toBe('trial');
    expect(sub.activeAddons).toEqual([]); // CERO add-ons regalados
    expect(sub.isProvisionalPricing).toBe(true);
  });

  test('4.2 Generación de factura establece taxStatus "NOT_CONFIGURED" (sin asumir IVA 0% inventado)', () => {
    const invoice = BillingService.generatePeriodInvoice(testTenant, { extraCasesCount: 2 });

    expect(invoice.taxStatus).toBe('NOT_CONFIGURED');
    expect(invoice.taxUsd).toBeUndefined(); // No inventa 0% de IVA
    expect(invoice.isProvisionalPricing).toBe(true);
    expect(invoice.paymentProcessingMode).toBe('MANUAL_RECONCILIATION');
    expect(invoice.lineItems.some((l) => l.description.includes('Tarifa Provisoria'))).toBe(true);
  });
});
