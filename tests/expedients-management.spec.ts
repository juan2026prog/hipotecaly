import { test, expect } from '@playwright/test';
import {
  matchesExpedientGroup,
  calculateExpedientGroupCounts,
  getExpedientActionInfo,
  matchesAlertFilter,
  EXPEDIENT_GROUPS,
} from '../src/lib/expedientManagementService';
import { DEMO_APPLICATIONS } from '../src/lib/backofficeService';

test.describe('EXPEDIENTES MANAGEMENT - OPERATIONAL GROUPS, FILTERS & NEXT ACTION', () => {
  test('1. Los 5 grupos principales tienen labels y subtítulos definidos', () => {
    expect(EXPEDIENT_GROUPS.length).toBe(5);
    const ids = EXPEDIENT_GROUPS.map((g) => g.id);
    expect(ids).toEqual(['all', 'requires_action', 'in_progress', 'closing', 'finished']);
  });

  test('2. Clasificación correcta de expedientes por grupo operativo', () => {
    // Requires action: submitted, info_review, property_analysis
    expect(matchesExpedientGroup({ status: 'submitted' }, 'requires_action')).toBe(true);
    expect(matchesExpedientGroup({ status: 'info_review' }, 'requires_action')).toBe(true);
    expect(matchesExpedientGroup({ status: 'property_analysis' }, 'requires_action')).toBe(true);
    expect(matchesExpedientGroup({ status: 'approved' }, 'requires_action')).toBe(false);

    // In progress: info_review, property_analysis, evaluation, offer_available
    expect(matchesExpedientGroup({ status: 'evaluation' }, 'in_progress')).toBe(true);
    expect(matchesExpedientGroup({ status: 'offer_available' }, 'in_progress')).toBe(true);
    expect(matchesExpedientGroup({ status: 'draft' }, 'in_progress')).toBe(false);

    // Closing: formalization
    expect(matchesExpedientGroup({ status: 'formalization' }, 'closing')).toBe(true);
    expect(matchesExpedientGroup({ status: 'submitted' }, 'closing')).toBe(false);

    // Finished: approved, rejected, funded, cancelled
    expect(matchesExpedientGroup({ status: 'approved' }, 'finished')).toBe(true);
    expect(matchesExpedientGroup({ status: 'rejected' }, 'finished')).toBe(true);
    expect(matchesExpedientGroup({ status: 'formalization' }, 'finished')).toBe(false);

    // All: any
    expect(matchesExpedientGroup({ status: 'draft' }, 'all')).toBe(true);
    expect(matchesExpedientGroup({ status: 'submitted' }, 'all')).toBe(true);
  });

  test('3. Cálculo dinámico de contadores de los 5 grupos sobre el dataset real', () => {
    const counts = calculateExpedientGroupCounts(DEMO_APPLICATIONS);

    expect(counts.all).toBe(DEMO_APPLICATIONS.length);
    expect(counts.requires_action).toBeGreaterThan(0);
    expect(counts.in_progress).toBeGreaterThan(0);
    expect(counts.closing).toBeGreaterThan(0);
    expect(counts.finished).toBeGreaterThan(0);
  });

  test('4. Derivación centralizada y tipada de Próxima Acción, Responsable y Alertas', () => {
    const submittedApp = { status: 'submitted', requested_amount: 80000 };
    const actionSubmitted = getExpedientActionInfo(submittedApp);

    expect(actionSubmitted.action).toBe('Revisar solicitud');
    expect(actionSubmitted.responsible.name).toBeDefined();
    expect(actionSubmitted.responsible.role).toBe('Mesa de Entrada');
    expect(actionSubmitted.priority).toBe('critical');

    const formalizationApp = { status: 'formalization' };
    const actionFormalization = getExpedientActionInfo(formalizationApp);
    expect(actionFormalization.action).toBe('Gestionar firma');
    expect(actionFormalization.responsible.role).toBe('Escribanía Notarial');

    const approvedApp = { status: 'approved' };
    const actionApproved = getExpedientActionInfo(approvedApp);
    expect(actionApproved.action).toBe('Desembolsar fondos');
    expect(actionApproved.alert.text).toBe('Sin bloqueos');
  });

  test('5. Filtrado por Alertas', () => {
    const appWithWarning = { status: 'info_review' };
    const cleanApp = { status: 'approved' };

    expect(matchesAlertFilter(appWithWarning, 'with_alerts')).toBe(true);
    expect(matchesAlertFilter(cleanApp, 'with_alerts')).toBe(false);

    expect(matchesAlertFilter(cleanApp, 'no_blocks')).toBe(true);
  });
});
