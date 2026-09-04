import { test, expect } from '@playwright/test';
import { AiClientService, AI_SAFETY_DISCLAIMER } from '../src/lib/ai/aiClientService';

test.describe('MACROFASE 6: AI INTELLIGENCE & COPILOT SAFETY ARCHITECTURE', () => {
  const mockCase = {
    caseId: 'CASE-UY-2026-001',
    tenantId: 'd0000000-0000-0000-0000-000000000001', // NOVA
    borrowerName: 'Martín Rodríguez',
    requestedAmountUsd: 40000,
    declaredPropertyValueUsd: 120000,
    propertyDepartment: 'Montevideo',
    propertyPadron: '142.508',
    documentsCount: 3,
  };

  test('1. Análisis de Expediente con LTV Saludable (<= 40%) produce semáforos verdes y recomendación favorable', async () => {
    const analysis = await AiClientService.analyzeCaseClient(mockCase);

    expect(analysis.caseId).toBe('CASE-UY-2026-001');
    expect(analysis.overallRiskLevel).toBe('bajo');
    expect(analysis.valuation.estimatedMarketValueUsd).toBe(120000);
    expect(analysis.valuation.conservativeValueUsd).toBe(102000); // 85%
    expect(analysis.valuation.ltvEstimatedPct).toBe(33); // 40k / 120k = 33%

    // Semáforo LTV debe estar en green
    const ltvSemaphore = analysis.semaphores.find((s) => s.category === 'ltv');
    expect(ltvSemaphore).toBeDefined();
    expect(ltvSemaphore?.status).toBe('green');
    expect(ltvSemaphore?.requiresHumanReview).toBe(false);

    // Recomendación y Safety Disclaimer
    expect(analysis.summary.recommendation).toContain('Apto para publicación');
    expect(analysis.summary.disclaimer).toBe(AI_SAFETY_DISCLAIMER);
  });

  test('2. Expediente con LTV Excedente (> 50%) dispara semáforo rojo y revisión humana obligatoria', async () => {
    const highRiskCase = {
      ...mockCase,
      caseId: 'CASE-UY-HIGH-RISK',
      requestedAmountUsd: 70000,
      declaredPropertyValueUsd: 100000, // 70% LTV
    };

    const analysis = await AiClientService.analyzeCaseClient(highRiskCase);

    expect(analysis.overallRiskLevel).toBe('alto');
    expect(analysis.valuation.ltvEstimatedPct).toBe(70);

    const ltvSemaphore = analysis.semaphores.find((s) => s.category === 'ltv');
    expect(ltvSemaphore?.status).toBe('red');
    expect(ltvSemaphore?.requiresHumanReview).toBe(true);
    expect(analysis.summary.recommendation).toContain('Requiere ajuste de monto');
  });

  test('3. Document Intelligence detecta titular, padrón y emite hallazgos', async () => {
    const analysis = await AiClientService.analyzeCaseClient(mockCase);

    expect(analysis.documents.length).toBeGreaterThan(0);
    const doc = analysis.documents[0];
    expect(doc.fileName).toBe('escritura_adquisicion.pdf');
    expect(doc.detectedOwner).toBe('Martín Rodríguez');
    expect(doc.detectedPadron).toBe('142.508');
    expect(doc.status).toBe('valid');
  });
});
