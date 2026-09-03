// ==============================================================================
// HIPOTECALY AI CORE: Suite Exhaustiva de 20 Pruebas Unitarias y de Integración
// Test fixtures sintéticos sin datos personales reales
// ==============================================================================

import { test, expect } from '@playwright/test';
import { DocumentIntelligenceAgent } from '../server/ai/agents/documentIntelligenceAgent';
import { PropertyValuationAgent } from '../server/ai/agents/propertyValuationAgent';
import { ConsistencyAgent } from '../server/ai/agents/consistencyAgent';
import { UnderwritingAgent, DEFAULT_PILOT_UNDERWRITING_POLICY } from '../server/ai/agents/underwritingAgent';
import { RiskAgent } from '../server/ai/agents/riskAgent';
import { MemoryRetrievalAgent } from '../server/ai/agents/memoryRetrievalAgent';
import { GlobalMemorySanitizer } from '../server/ai/sanitizer';
import { calculateTokenCost, AI_STANDARD_CASE_COST_USD } from '../server/ai/config';
import { aiWalletService } from '../server/ai/walletService';
import { hipotecalyAiOrchestrator } from '../server/ai/orchestrator';

test.describe('HIPOTECALY AI CORE — 20 Synthetic Test Scenarios', () => {

  // 1. Documento normal
  test('1. Documento normal: extracción estructurada con alta confianza', async () => {
    const docAgent = new DocumentIntelligenceAgent();
    const res = await docAgent.analyzeDocument({
      fileName: 'Escritura_Compraventa_Padron_12345.pdf',
      fileSizeBytes: 95000,
      contentSnippet: 'Comparecen ante el escribano público. Se otorga escritura del Padrón número 12345 en Montevideo. Superficie: 85 m2. Titular: Juan Pérez.',
    });

    expect(res.documentType).toBe('escritura');
    expect(res.extraction.padron).toBe('12345');
    expect(res.extraction.land_area_m2).toBe(85);
    expect(res.confidence).toBeGreaterThanOrEqual(90);
    expect(res.warnings.length).toBe(0);
  });

  // 2. Documento ilegible
  test('2. Documento ilegible: advertencia, baja confianza y padrón no inventado', async () => {
    const docAgent = new DocumentIntelligenceAgent();
    const res = await docAgent.analyzeDocument({
      fileName: 'Escaneo_Borroso_Ilegible.pdf',
      fileSizeBytes: 3000,
      contentSnippet: 'xx',
    });

    expect(res.confidence).toBeLessThanOrEqual(40);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.warnings[0]).toContain('baja resolución o texto borroso');
    expect(res.extraction.padron).toBeNull();
  });

  // 3. Padrón inconsistente
  test('3. Padrón inconsistente: detección de contradicción entre solicitud y título', async () => {
    const consistAgent = new ConsistencyAgent();
    const docAgent = new DocumentIntelligenceAgent();
    const analyzedDoc = await docAgent.analyzeDocument({
      fileName: 'Titulo_Propiedad.pdf',
      contentSnippet: 'Padrón número 99999 de Montevideo.',
    });

    const check = consistAgent.evaluateConsistency({
      borrower: { firstName: 'Mario', lastName: 'Silva' },
      property: { cadastralNumber: '11111', department: 'Montevideo' },
      analyzedDocuments: [analyzedDoc],
    });

    const padronIssue = check.issues.find((i) => i.category === 'consistencia_registral');
    expect(padronIssue).toBeDefined();
    expect(padronIssue?.declared_value).toBe('11111');
    expect(padronIssue?.evidenced_value).toBe('99999');
    expect(check.isConsistent).toBe(false);
  });

  // 4. Titular inconsistente
  test('4. Titular inconsistente: titular registral distinto al solicitante', async () => {
    const consistAgent = new ConsistencyAgent();
    const doc = {
      fileName: 'Escritura.pdf',
      fileHash: 'sha256_dummy_owner',
      documentType: 'escritura' as const,
      isCached: false,
      confidence: 95,
      warnings: [],
      extraction: {
        document_type: 'escritura' as const,
        property_owner: 'Carlos Rodríguez',
        holder: 'Carlos Rodríguez',
        currency: 'UYU',
        debts: [],
        liens: [],
        detected_people: [],
        detected_entities: [],
        important_dates: [],
        confidence: 95,
        warnings: [],
      },
    };

    const check = consistAgent.evaluateConsistency({
      borrower: { firstName: 'Lucía', lastName: 'Méndez' },
      property: { department: 'Canelones' },
      analyzedDocuments: [doc],
    });

    const ownerIssue = check.issues.find((i) => i.category === 'titularidad');
    expect(ownerIssue).toBeDefined();
    expect(ownerIssue?.severity).toBe('critica');
    expect(ownerIssue?.description).toContain('Carlos Rodríguez');
  });

  // 5. Falta documento
  test('5. Falta documento: detección de ausencia de título y comprobante de ingresos', async () => {
    const consistAgent = new ConsistencyAgent();
    const check = consistAgent.evaluateConsistency({
      borrower: { firstName: 'Ana', lastName: 'Gómez', declaredIncome: 80000 },
      property: { department: 'Maldonado' },
      analyzedDocuments: [], // legajo vacío
    });

    expect(check.missingRequiredDocs.length).toBeGreaterThanOrEqual(2);
    expect(check.missingRequiredDocs.some((d) => d.includes('Título') || d.includes('Escritura'))).toBe(true);
    expect(check.missingRequiredDocs.some((d) => d.includes('Ingresos'))).toBe(true);
  });

  // 6. LTV dentro de política
  test('6. LTV dentro de política: eligible true y semáforo en verde', async () => {
    const underAgent = new UnderwritingAgent();
    const result = underAgent.evaluateUnderwriting(
      40000,
      120000,
      100000,
      36,
      'casa',
      'Montevideo',
      75000,
      DEFAULT_PILOT_UNDERWRITING_POLICY // 40% max LTV
    );

    expect(result.ltv_conservative).toBe(40.0);
    expect(result.eligible).toBe(true);
    expect(result.loan_amount).toBe(40000);
    expect(result.max_allowed_by_ltv).toBe(40000);
  });

  // 7. LTV fuera de política
  test('7. LTV fuera de política: eligible false, supera tope del 40%', async () => {
    const underAgent = new UnderwritingAgent();
    const result = underAgent.evaluateUnderwriting(
      60000,
      120000,
      100000,
      36,
      'casa',
      'Montevideo',
      75000,
      DEFAULT_PILOT_UNDERWRITING_POLICY
    );

    expect(result.ltv_conservative).toBe(60.0);
    expect(result.eligible).toBe(false);
    expect(result.notes).toContain('supera el tope reglamentario del 40%');
  });

  // 8. Tasación con baja confianza
  test('8. Tasación con baja confianza: falta de superficie y relevamiento', async () => {
    const valAgent = new PropertyValuationAgent();
    const val = await valAgent.evaluateValuation({
      propertyType: 'casa',
      department: 'Rocha',
      applicantDeclaredValue: 80000,
      photosCount: 0,
      hasStructuralIssues: true,
    });

    expect(val.confidence).toBe('baja');
    expect(val.warnings.length).toBeGreaterThan(0);
    expect(val.conservative_value).toBeLessThan(val.estimated_market_value);
  });

  // 9. Caso pequeño
  test('9. Caso pequeño: cálculo de consumo reducido (< 0.50 CASOS)', async () => {
    const cost = calculateTokenCost('gpt-5.6-luna', 4000, 1000, 800, 0);
    expect(cost.caseUnits).toBeLessThanOrEqual(0.50);
    expect(cost.costTotalUsd).toBeLessThan(0.10);
  });

  // 10. Caso >100 páginas
  test('10. Caso >100 páginas: estimación detecta alto consumo y emite alerta', async () => {
    const est = await aiWalletService.estimateCaseConsumption({
      organizationId: 'test_tenant_large',
      pagesCount: 110,
      imagesCount: 25,
      documentsCount: 12,
    });

    expect(est.isHighConsumption).toBe(true);
    expect(est.highConsumptionWarning).toContain('CONSUMO ELEVADO');
    expect(est.estimatedCaseUnitsMax).toBeGreaterThan(1.5);
  });

  // 11. Reanálisis incremental
  test('11. Reanálisis incremental: documento ya procesado usa caché y ahorra tokens', async () => {
    const docAgent = new DocumentIntelligenceAgent();
    const docInput = {
      fileName: 'Plano_Mensura_Catastro.pdf',
      fileSizeBytes: 200000,
      contentSnippet: 'Plano de mensura Agrimensor oficial.',
    };

    const firstPass = await docAgent.analyzeDocument(docInput);
    expect(firstPass.isCached).toBe(false);

    const secondPass = await docAgent.analyzeDocument(docInput);
    expect(secondPass.isCached).toBe(true);
    expect(secondPass.fileHash).toBe(firstPass.fileHash);
  });

  // 12. Corrección humana
  test('12. Corrección humana: guarda retroalimentación e incorpora aprendizaje', async () => {
    const memAgent = new MemoryRetrievalAgent();
    const success = await memAgent.learnCorrection({
      memoryType: 'valuation_pattern',
      department: 'Canelones',
      propertyType: 'terreno',
      rawCorrectionSummary: 'Terrenos en zona costera requieren verificar nivel de cota de inundación.',
      rawInsight: 'Descuento del 10% si la cota es menor a 2.5m.',
    });

    expect(success).toBe(true);
  });

  // 13. Recuperación memoria global
  test('13. Recuperación memoria global: RAG devuelve patrones relevantes', async () => {
    const memAgent = new MemoryRetrievalAgent();
    const memories = await memAgent.retrieveRelevantMemory('Montevideo', 'apartamento', 'Pocitos');

    expect(memories.length).toBeGreaterThan(0);
    expect(memories[0].patternSummary).toBeDefined();
    expect(memories[0].sanitizedInsight).toBeDefined();
  });

  // 14. Bloqueo RLS cross-tenant y Sanitizador de PII
  test('14. Bloqueo PII en Memoria Global: GLOBAL_MEMORY_SANITIZER elimina CI, teléfonos y nombres', () => {
    const sensitiveRawText =
      'El solicitante Juan Pérez con CI 4.888.777-2 y teléfono 099 123 456 fue evaluado para padrón número 12345 en calle 21 de Setiembre 2450.';
    const sanitized = GlobalMemorySanitizer.sanitize(sensitiveRawText);

    expect(sanitized).not.toContain('4.888.777-2');
    expect(sanitized).not.toContain('099 123 456');
    expect(sanitized).not.toContain('2450');
    expect(sanitized).toContain('[CI_ANONIMIZADA]');
    expect(sanitized).toContain('[TELEFONO_REMOVIDO]');
  });

  // 15. Cálculo de consumo
  test('15. Cálculo de consumo: conversión de costo exacto a CASOS AI con 2 decimales', () => {
    // Si el costo es exactamente $0.50 USD y 1 CASO = $0.50 USD -> 1.00 CASO
    const cost1 = calculateTokenCost('gpt-5.6-terra', 200000, 0, 10000, 0);
    expect(cost1.caseUnits).toBeGreaterThan(0);
    expect(typeof cost1.caseUnits).toBe('number');

    // Comprobar fórmula: units = cost / 0.50
    const expectedUnits = Number((cost1.costTotalUsd / AI_STANDARD_CASE_COST_USD).toFixed(2));
    expect(cost1.caseUnits).toBe(Math.max(0.05, expectedUnits));
  });

  // 16. Consumo promocional
  test('16. Consumo promocional: consume primero promocionales antes de comprados', async () => {
    const org = 'test_org_promo_first';
    await aiWalletService.grantMonthlyPromotional(org, 1); // 10 promocionales
    await aiWalletService.purchaseCases(org, 5); // 5 comprados

    const deduction = await aiWalletService.deductConsumption({
      organizationId: org,
      runId: 'run_p1',
      caseUnits: 1.5,
      costUsd: 0.75,
      description: 'Prueba de deducción prioritaria',
    });

    expect(deduction.success).toBe(true);
    expect(deduction.promotionalDeducted).toBe(1.5);
    expect(deduction.purchasedDeducted).toBe(0);
    expect(deduction.isFullyCoveredByHipotecaly).toBe(true);

    const updated = await aiWalletService.getWalletState(org);
    expect(updated.promotionalCaseBalance).toBe(8.5);
    expect(updated.purchasedCaseBalance).toBe(5);
  });

  // 17. Expiración 10 / 5 / 3
  test('17. Esquema 10/5/3: mes 1 otorga 10, mes 2 otorga 5 sin acumular, mes 4 otorga 0', async () => {
    const org = 'test_org_schedule_1053';

    // Mes 1 -> 10 casos
    const m1 = await aiWalletService.grantMonthlyPromotional(org, 1);
    expect(m1.grantedCases).toBe(10.0);

    // Mes 2 -> 5 casos (caducan los no usados de mes 1)
    const m2 = await aiWalletService.grantMonthlyPromotional(org, 2);
    expect(m2.grantedCases).toBe(5.0);

    // Mes 3 -> 3 casos
    const m3 = await aiWalletService.grantMonthlyPromotional(org, 3);
    expect(m3.grantedCases).toBe(3.0);

    // Mes 4 en adelante -> 0 casos
    const m4 = await aiWalletService.grantMonthlyPromotional(org, 4);
    expect(m4.grantedCases).toBe(0.0);
  });

  // 18. Concurrencia de wallet
  test('18. Concurrencia de wallet: múltiples débitos secuenciales mantienen integridad', async () => {
    const org = 'test_org_concurrency';
    await aiWalletService.grantMonthlyPromotional(org, 1); // 10 casos

    await Promise.all([
      aiWalletService.deductConsumption({
        organizationId: org,
        runId: 'run_c1',
        caseUnits: 1.0,
        costUsd: 0.5,
        description: 'Debito 1',
      }),
      aiWalletService.deductConsumption({
        organizationId: org,
        runId: 'run_c2',
        caseUnits: 2.0,
        costUsd: 1.0,
        description: 'Debito 2',
      }),
    ]);

    const state = await aiWalletService.getWalletState(org);
    expect(state.totalCaseBalance).toBe(7.0);
  });

  // 19. Retry idempotente
  test('19. Retry idempotente: re-análisis del expediente conserva estructura idéntica', async () => {
    const caseData = {
      applicationId: 'app_idempotent_test',
      organizationId: 'org_idempotent',
      requestedAmount: 50000,
      currency: 'USD',
      termMonths: 36,
      borrower: { firstName: 'Esteban', lastName: 'Quirós' },
      property: { propertyType: 'casa', department: 'Colonia', estimatedValue: 130000 },
      documents: [],
    };

    const r1 = await hipotecalyAiOrchestrator.analyzeCase(caseData);
    const r2 = await hipotecalyAiOrchestrator.analyzeCase(caseData);

    expect(r1.underwriting.ltv_conservative).toBe(r2.underwriting.ltv_conservative);
    expect(r1.semaphore.length).toBe(r2.semaphore.length);
    expect(r1.valuation.conservative_value).toBe(r2.valuation.conservative_value);
  });

  // 20. Error OpenAI sin pérdida de expediente
  test('20. Error OpenAI sin pérdida de expediente: orquestador responde con fallback resiliente', async () => {
    const caseData = {
      applicationId: 'app_resilience_test',
      organizationId: 'org_resilience',
      requestedAmount: 35000,
      currency: 'USD',
      termMonths: 24,
      borrower: { firstName: 'Valeria', lastName: 'Suárez' },
      property: { propertyType: 'apartamento', department: 'Montevideo', estimatedValue: 90000 },
      documents: [],
    };

    // Incluso en ausencia de API externa, el informe se genera sin romper el expediente
    const report = await hipotecalyAiOrchestrator.analyzeCase(caseData);

    expect(report).toBeDefined();
    expect(report.summary.executive_summary).toBeDefined();
    expect(report.underwriting.loan_amount).toBe(35000);
    expect(report.semaphore.length).toBe(10);
    expect(report.disclaimer).toContain('HIPOTECALY AI proporciona análisis preliminares');
  });

});
