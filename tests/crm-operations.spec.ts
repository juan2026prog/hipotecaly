import { test, expect } from '@playwright/test';
import { CrmService } from '../src/lib/crmService';

test.describe('MACROFASE 6: CRM LEAD PIPELINE, OPERATIONAL TASKS & TIMELINE', () => {
  const testTenant = 'tenant_crm_test_001';

  test.beforeEach(() => {
    CrmService.resetStore();
  });

  test('1. Creación de Lead en Pipeline y avance de etapa', () => {
    const lead = CrmService.createLead({
      tenantId: testTenant,
      applicantName: 'Gonzalo Silva',
      applicantEmail: 'gonzalo@ejemplo.com',
      applicantPhone: '099 123 456',
      requestedAmountUsd: 50000,
      propertyEstimatedValueUsd: 150000,
      propertyDepartment: 'Canelones',
      stage: 'lead',
      caseId: 'CASE-CRM-01',
    });

    expect(lead.id).toBeDefined();
    expect(lead.stage).toBe('lead');

    // Avanzar etapa a 'prequalified'
    const updated = CrmService.updateLeadStage(testTenant, lead.id, 'prequalified', 'Analista Juan');
    expect(updated).not.toBeNull();
    expect(updated?.stage).toBe('prequalified');

    // Comprobar filtro de leads por etapa
    const leadsInPrequalified = CrmService.getLeads(testTenant, 'prequalified');
    expect(leadsInPrequalified.length).toBe(1);

    const leadsInClosing = CrmService.getLeads(testTenant, 'closing');
    expect(leadsInClosing.length).toBe(0);
  });

  test('2. Asignación de Tareas Operativas y actualización de estado', () => {
    const task = CrmService.createTask({
      tenantId: testTenant,
      caseId: 'CASE-CRM-02',
      title: 'Validación de Cédula Catastral',
      description: 'Verificar no afectación a expropiaciones en Intendencia de Canelones.',
      priority: 'high',
      assigneeRole: 'analyst',
      assigneeName: 'Carlos Analista',
      dueDate: '2026-09-15',
    });

    expect(task.id).toBeDefined();
    expect(task.status).toBe('todo');

    // Modificar a completed
    const completedTask = CrmService.updateTaskStatus(testTenant, task.id, 'completed', 'Carlos Analista');
    expect(completedTask?.status).toBe('completed');
    expect(completedTask?.completedAt).toBeDefined();

    const openTasks = CrmService.getTasks(testTenant, { status: 'todo' });
    expect(openTasks.length).toBe(0);

    const doneTasks = CrmService.getTasks(testTenant, { status: 'completed' });
    expect(doneTasks.length).toBe(1);
  });

  test('3. Bitácora Cronológica de Actividad (Timeline)', () => {
    const lead = CrmService.createLead({
      tenantId: testTenant,
      applicantName: 'Ana Ferreira',
      applicantEmail: 'ana@ejemplo.com',
      applicantPhone: '098 765 432',
      requestedAmountUsd: 30000,
      propertyEstimatedValueUsd: 90000,
      propertyDepartment: 'Maldonado',
      stage: 'lead',
      caseId: 'CASE-CRM-03',
    });

    CrmService.createTask({
      tenantId: testTenant,
      caseId: 'CASE-CRM-03',
      title: 'Pedir ampliación de plano',
      description: 'El plano municipal no muestra el alero trasero.',
      priority: 'medium',
      assigneeRole: 'underwriter',
    });

    const timeline = CrmService.getTimeline(testTenant, 'CASE-CRM-03');
    expect(timeline.length).toBeGreaterThanOrEqual(2);

    const actions = timeline.map((t) => t.action);
    expect(actions).toContain('LEAD_REGISTERED');
    expect(actions).toContain('TASK_CREATED');
  });
});
