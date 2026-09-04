import { test, expect } from '@playwright/test';
import { AutomationEngine } from '../src/lib/automationEngine';

test.describe('MACROFASE 6: AUTOMATION ENGINE & NOTIFICATION DISPATCH', () => {
  const testTenantId = 'tenant_automation_test_001';

  test.beforeEach(() => {
    AutomationEngine.resetStore();
  });

  test('1. Trigger "application.created" despacha notificaciones para analista y admin', async () => {
    const result = await AutomationEngine.dispatchEvent('application.created', {
      tenantId: testTenantId,
      caseId: 'CASE-AUTO-01',
      applicantName: 'Lucía Méndez',
    });

    expect(result.matchedRules).toBeGreaterThanOrEqual(1);
    expect(result.notificationsCreated).toBeGreaterThanOrEqual(2); // analyst + admin

    const notifications = AutomationEngine.getNotifications(testTenantId);
    expect(notifications.length).toBeGreaterThanOrEqual(2);

    const analystNotif = notifications.find((n) => n.recipientRole === 'analyst');
    expect(analystNotif).toBeDefined();
    expect(analystNotif?.title).toContain('CASE-AUTO-01');
    expect(analystNotif?.message).toContain('Lucía Méndez');
  });

  test('2. Trigger "offer.accepted" genera alerta urgente para lender y sugiere transición de estado', async () => {
    const result = await AutomationEngine.dispatchEvent('offer.accepted', {
      tenantId: testTenantId,
      caseId: 'CASE-AUTO-02',
    });

    expect(result.suggestedStatus).toBe('coordinacion_notarial');

    const lenderNotifs = AutomationEngine.getNotifications(testTenantId, 'lender');
    expect(lenderNotifs.length).toBeGreaterThanOrEqual(1);
    expect(lenderNotifs[0].priority).toBe('urgent');
    expect(lenderNotifs[0].message).toContain('aceptado tu oferta');
  });

  test('3. Marcar notificación como leída actualiza el estado', async () => {
    await AutomationEngine.dispatchEvent('document.uploaded', {
      tenantId: testTenantId,
      caseId: 'CASE-AUTO-03',
      documentName: 'cedula_catastral.pdf',
    });

    const notifs = AutomationEngine.getNotifications(testTenantId);
    expect(notifs[0].read).toBe(false);

    const marked = AutomationEngine.markAsRead(notifs[0].id);
    expect(marked).toBe(true);

    const updated = AutomationEngine.getNotifications(testTenantId);
    expect(updated[0].read).toBe(true);
  });

  test('4. Bitácora de ejecución (Execution Logs) registra eventos con aislamiento por tenant', async () => {
    await AutomationEngine.dispatchEvent('case.stalled', {
      tenantId: testTenantId,
      caseId: 'CASE-STALLED-99',
    });

    await AutomationEngine.dispatchEvent('case.stalled', {
      tenantId: 'other_tenant_999',
      caseId: 'CASE-OTHER-01',
    });

    const tenantLogs = AutomationEngine.getExecutionLogs(testTenantId);
    expect(tenantLogs.length).toBe(1);
    expect(tenantLogs[0].caseId).toBe('CASE-STALLED-99');
    expect(tenantLogs[0].event).toBe('case.stalled');
  });
});
