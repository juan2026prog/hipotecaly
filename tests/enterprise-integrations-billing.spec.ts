import http from 'http';
import { test, expect } from '@playwright/test';
import { PublicApiService } from '../src/lib/api/publicApiService';
import { BillingService } from '../src/lib/billingService';
import {
  hasTenantEntitlement,
  enableTenantModule,
  canEnableModule,
  getActiveModuleIdsForTenant,
} from '../src/lib/moduleCatalogService';

test.describe('MACROFASE 7: ENTERPRISE, INTEGRATIONS, BILLING & SIMULATED TENANT', () => {
  const enterpriseTenantId = 'tenant_credisur_enterprise_001';

  test.beforeEach(() => {
    PublicApiService.resetStore();
    BillingService.resetStore();
  });

  test('1. Public API: Generación de API Key, Autenticación y Control de Scopes', async () => {
    const { apiKey, record } = await PublicApiService.generateApiKey(
      enterpriseTenantId,
      'CrediSur Core ERP Key',
      ['read:simulations', 'write:applications']
    );

    expect(apiKey).toMatch(/^hpt_live_/);
    expect(record.tenantId).toBe(enterpriseTenantId);
    expect(record.keyPrefix).toBe(apiKey.slice(0, 14) + '...');

    // Autenticación con scope concedido
    const authSuccess = await PublicApiService.authenticateApiKey(apiKey, 'read:simulations');
    expect(authSuccess.valid).toBe(true);
    expect(authSuccess.tenantId).toBe(enterpriseTenantId);

    // Intento con scope no concedido
    const authForbidden = await PublicApiService.authenticateApiKey(apiKey, 'admin:webhooks');
    expect(authForbidden.valid).toBe(false);
    expect(authForbidden.error).toContain('Permiso insuficiente');

    // Intento con clave inválida
    const authInvalid = await PublicApiService.authenticateApiKey('hpt_live_fake_key_999');
    expect(authInvalid.valid).toBe(false);
  });

  test('2. Public API: Simulación Paramétrica institucional y envío de solicitudes', async () => {
    // 2.1 Simulación
    const simOk = PublicApiService.executeSimulation({
      propertyValueUsd: 200000,
      requestedAmountUsd: 80000, // 40% LTV
      termMonths: 36,
      propertyDepartment: 'Montevideo',
      propertyType: 'casa',
    });

    expect(simOk.valid).toBe(true);
    expect(simOk.ltvPct).toBe(40);
    expect(simOk.maxAllowedLoanUsd).toBe(80000);
    expect(simOk.estimatedMonthlyPaymentUsd).toBeGreaterThan(0);

    // Simulación con LTV excedido
    const simExceeded = PublicApiService.executeSimulation({
      propertyValueUsd: 100000,
      requestedAmountUsd: 65000, // 65% LTV
      termMonths: 24,
      propertyDepartment: 'Canelones',
      propertyType: 'apartamento',
    });
    expect(simExceeded.valid).toBe(false);
    expect(simExceeded.rejectionReason).toContain('supera la política');

    // 2.2 Ingesta programática de solicitud
    const appRes = await PublicApiService.submitApplication(enterpriseTenantId, {
      borrowerName: 'Santiago Berriel',
      borrowerEmail: 'santiago@credisur.com.uy',
      borrowerPhone: '099 888 777',
      requestedAmountUsd: 45000,
      propertyEstimatedValueUsd: 130000,
      propertyDepartment: 'Maldonado',
    });

    expect(appRes.caseId).toMatch(/^API-SOL-/);
    expect(appRes.tenantId).toBe(enterpriseTenantId);
    expect(appRes.status).toBe('prequalified');
    expect(appRes.accessTrackingUrl).toContain(appRes.caseId);
  });

  test('3. Webhooks Dispatcher: Suscripción a eventos y entrega de payloads', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address() as any;
    const testUrl = `http://127.0.0.1:${address.port}/webhooks/hipotecaly`;

    try {
      const webhook = await PublicApiService.registerWebhook(
        enterpriseTenantId,
        testUrl,
        ['application.created', 'offer.accepted']
      );

      expect(webhook.id).toBeDefined();
      expect(webhook.active).toBe(true);

      // Disparar solicitud que genera evento
      await PublicApiService.submitApplication(enterpriseTenantId, {
        borrowerName: 'Camila Rossi',
        borrowerEmail: 'camila@credisur.com.uy',
        borrowerPhone: '091 222 333',
        requestedAmountUsd: 30000,
        propertyEstimatedValueUsd: 100000,
        propertyDepartment: 'Colonia',
      });

      const logs = PublicApiService.getWebhookLogs(enterpriseTenantId);
      expect(logs.length).toBe(1);
      expect(logs[0].event).toBe('application.created');
      expect(logs[0].statusCode).toBe(200);
      expect(logs[0].success).toBe(true);
    } finally {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  test('4. Billing Engine: Cálculo de cuota de plan, add-ons y excedentes de uso', () => {
    // Configurar suscripción Platform mensual con sindicación y servicing
    BillingService.updateSubscription(enterpriseTenantId, {
      planId: 'platform',
      billingCycle: 'monthly',
      activeAddons: ['capital_syndication', 'servicing_loan_management'],
    });

    // Generar factura del período con 5 expedientes excedentes
    const invoice = BillingService.generatePeriodInvoice(enterpriseTenantId, {
      extraCasesCount: 5,
    });

    expect(invoice.invoiceNumber).toMatch(/^(PROV-)?INV-2026-/);
    expect(invoice.status).toBe('pending');
    expect(invoice.lineItems.length).toBe(4); // Plan + Sindicación + Servicing + Overages

    // Base Platform = 799, Sindicación = 149, Servicing = 199, 5 overages * 15 = 75
    // Total = 799 + 149 + 199 + 75 = 1222
    expect(invoice.totalUsd).toBe(1222);

    // Conciliación de pago
    const paidOk = BillingService.markInvoicePaid(invoice.id);
    expect(paidOk).toBe(true);

    const invoicesList = BillingService.getInvoices(enterpriseTenantId);
    expect(invoicesList[0].status).toBe('paid');
    expect(invoicesList[0].paidAt).toBeDefined();
  });

  test('5. Primer Tenant Real Simulado ("CREDI-SUR") con Aislamiento Total', async () => {
    const credisurTenantId = 'tenant_simulated_credisur_uy';

    // 1. Obtener módulos iniciales del tenant nuevo: deben ser todos los INCLUDED
    const credisurModules = await getActiveModuleIdsForTenant(credisurTenantId);
    expect(credisurModules).toContain('core_tenancy');
    expect(credisurModules).toContain('origination_simulator');
    expect(credisurModules).toContain('capital_antibypass');

    // 2. Comprobar que Add-ons no están activos por defecto
    const hasSyndicationInitial = await hasTenantEntitlement(credisurTenantId, 'capital_syndication');
    expect(hasSyndicationInitial).toBe(false);

    // 3. Validar activación progresiva cumpliendo dependencias
    const canEnableSyndication = await canEnableModule(credisurTenantId, 'capital_syndication');
    expect(canEnableSyndication.allowed).toBe(true);

    const activation = await enableTenantModule(credisurTenantId, 'capital_syndication');
    expect(activation.success).toBe(true);

    const hasSyndicationNow = await hasTenantEntitlement(credisurTenantId, 'capital_syndication');
    expect(hasSyndicationNow).toBe(true);

    // 4. Verificar que el tenant de referencia (NOVA) y un tenant tercero no fueron alterados
    const thirdPartyHasSyndication = await hasTenantEntitlement('tenant_third_party_random', 'capital_syndication');
    expect(thirdPartyHasSyndication).toBe(false);
  });
});
