import { test, expect } from '@playwright/test';
import {
  mapApplicationToGuarantee,
  calculateGuaranteeKpis,
  calculateGuaranteeGroupCounts,
  evaluateAppraisalStatus,
  evaluateLegalStatus,
  filterByLtvRange,
  GUARANTEE_GROUPS,
} from '../src/lib/guaranteeManagementService';
import { DEMO_APPLICATIONS } from '../src/lib/backofficeService';

test.describe('GUARANTEES MANAGEMENT - OPERATIONAL REGISTRY, KPIS, LTV & LEGAL STATUS', () => {
  test('1. Los 3 grupos principales de garantías están definidos correctamente', () => {
    expect(GUARANTEE_GROUPS.length).toBe(3);
    const ids = GUARANTEE_GROUPS.map((g) => g.id);
    expect(ids).toEqual(['all', 'requires_attention', 'released_closed']);
  });

  test('2. Mapeo de solicitudes a garantías hipotecarias operativas', () => {
    const guarantees = DEMO_APPLICATIONS.map((app) => mapApplicationToGuarantee(app));

    expect(guarantees.length).toBe(DEMO_APPLICATIONS.length);

    const first = guarantees[0];
    expect(first.publicId).toBe('HIP-DEMO-00124');
    expect(first.borrowerName).toBe('María López');
    expect(first.propertyType).toBe('casa');
    expect(first.department).toBe('Montevideo');
    expect(first.cadastralNumber).toBe('145.892');
    expect(first.value).toBe(240000);
    expect(first.financingAmount).toBe(80000);
    expect(first.ltv).toBeCloseTo(33.33, 1);
    expect(first.ltvFormatted).toBe('33.3%');
    expect(first.legalStatus.status).toBe('libre_gravamenes');
    expect(first.appraisalStatus.status).toBe('vigente');
    expect(first.nextAction.action).toBeDefined();
  });

  test('3. Cálculo de KPIs de Garantías sobre dataset real', () => {
    const guarantees = DEMO_APPLICATIONS.map((app) => mapApplicationToGuarantee(app));
    const kpis = calculateGuaranteeKpis(guarantees);

    expect(kpis.activeCount).toBeGreaterThan(0);
    expect(kpis.totalGuaranteedValue).toBeGreaterThan(0);
    expect(Number(kpis.averageLtv)).toBeGreaterThan(0);
    expect(kpis.requiresAttentionCount).toBeGreaterThanOrEqual(0);
  });

  test('4. Contadores de los 3 grupos principales', () => {
    const guarantees = DEMO_APPLICATIONS.map((app) => mapApplicationToGuarantee(app));
    const counts = calculateGuaranteeGroupCounts(guarantees);

    expect(counts.all).toBe(DEMO_APPLICATIONS.length);
    expect(counts.requires_attention).toBeGreaterThanOrEqual(0);
    expect(counts.released_closed).toBeGreaterThanOrEqual(0);
  });

  test('5. Regla estricta NULL != OK y UNKNOWN != LIBRE DE GRAVAMENES', () => {
    const nullLegal = evaluateLegalStatus(null);
    expect(nullLegal.status).toBe('desconocido');
    expect(nullLegal.label).toBe('Sin verificar');
    expect(nullLegal.verified).toBe(false);

    const unknownLegal = evaluateLegalStatus('desconocido');
    expect(unknownLegal.status).toBe('desconocido');
    expect(unknownLegal.label).toBe('Sin verificar');

    const cleanLegal = evaluateLegalStatus('libre_gravamenes');
    expect(cleanLegal.status).toBe('libre_gravamenes');
    expect(cleanLegal.verified).toBe(true);

    const lienLegal = evaluateLegalStatus('tiene_hipoteca');
    expect(lienLegal.status).toBe('tiene_hipoteca');
    expect(lienLegal.label).toBe('Gravamen detectado');
  });

  test('6. Evaluación de vigencia de tasaciones', () => {
    const pendingVal = evaluateAppraisalStatus(null);
    expect(pendingVal.status).toBe('pendiente');

    const recentVal = evaluateAppraisalStatus({
      preliminary_value: 200000,
      reviewed_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(), // 1 mes
    });
    expect(recentVal.status).toBe('vigente');

    const staleVal = evaluateAppraisalStatus({
      preliminary_value: 200000,
      reviewed_at: new Date(Date.now() - 3600000 * 24 * 220).toISOString(), // ~7 meses
    });
    expect(staleVal.status).toBe('por_actualizar');

    const expiredVal = evaluateAppraisalStatus({
      preliminary_value: 200000,
      reviewed_at: new Date(Date.now() - 3600000 * 24 * 400).toISOString(), // ~13 meses
    });
    expect(expiredVal.status).toBe('vencida');
  });

  test('7. Filtrado por rangos de LTV', () => {
    const gLow = { ltv: 25 } as any;
    const gMid = { ltv: 33.3 } as any;
    const gHigh = { ltv: 45 } as any;

    expect(filterByLtvRange(gLow, 'lt_30')).toBe(true);
    expect(filterByLtvRange(gMid, 'lt_30')).toBe(false);

    expect(filterByLtvRange(gMid, '30_35')).toBe(true);
    expect(filterByLtvRange(gHigh, 'gt_40')).toBe(true);
  });
});
