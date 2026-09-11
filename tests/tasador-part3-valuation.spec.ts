// ==============================================================================
// HIPOTECALY TASADOR IA - TEST SUITE: PARTE 3 - VALORACIÓN Y EXPEDIENTE
// Certificación de Valoración Matemática, Inmutabilidad de Runs, Dossier y PDF
// ==============================================================================

import { test, expect } from '@playwright/test';
import { AppraisalService } from '../src/lib/tasador/appraisal/AppraisalService';
import { PdfReportGenerator } from '../src/lib/tasador/report/PdfReportGenerator';
import {
  AppraisalPropertyInput,
  AppraisalLocation,
  AppraisalComparableItem,
} from '../src/lib/tasador/appraisal/appraisalTypes';
import * as crypto from 'crypto';

test.describe('Tasador IA - Parte 3: Valoración Final, Expediente Inmutable e Informe PDF', () => {
  const service = AppraisalService.getInstance();
  const orgA = 'org-estudio-nova-test';
  const orgB = 'org-competitor-bank-test';

  const mockTarget: AppraisalPropertyInput = {
    title: 'Apartamento Pocitos 2 Dormitorios',
    propertyType: 'APARTMENT',
    condition: 'VERY_GOOD',
    orientation: 'NORTH',
    constructionYear: 2018,
    layout: {
      bedrooms: 2,
      bathrooms: 2,
      garages: 1,
      totalRooms: 3,
    },
    surfaces: {
      builtAreaM2: 75,
      totalAreaM2: 82,
    },
    amenities: {
      balcony: true,
      terrace: false,
      pool: false,
      barbecue: true,
      security24h: true,
    },
    expensesUyu: 8500,
  };

  const mockLocation: AppraisalLocation = {
    address: 'Av. Brasil 2650',
    streetName: 'Av. Brasil',
    streetNumber: '2650',
    neighborhood: 'Pocitos',
    city: 'Montevideo',
    department: 'Montevideo',
    country: 'Uruguay',
    latitude: -34.9125,
    longitude: -56.1485,
  };

  const createMockComparable = (id: string, priceUsd: number, m2: number, bedrooms = 2, selected = true): AppraisalComparableItem => ({
    id: `comp-${id}`,
    appraisalId: 'test-appraisal-p3',
    propertyMasterId: `master-${id}`,
    listingId: `listing-${id}`,
    similarityScore: 88,
    scoreBreakdown: {
      locationScore: 90,
      propertyTypeScore: 95,
      surfaceScore: 85,
      bedroomsScore: 90,
      bathroomsScore: 85,
      garagesScore: 90,
      recencyScore: 85,
      qualityScore: 85,
    },
    selected,
    status: selected ? 'INCLUDED' : 'EXCLUDED',
    rank: 1,
    candidateData: {
      title: `Comparable ${id}`,
      propertyType: 'APARTMENT',
      condition: 'GOOD',
      neighborhood: 'Pocitos',
      city: 'Montevideo',
      department: 'Montevideo',
      priceUsd,
      currency: 'USD',
      builtAreaM2: m2,
      totalAreaM2: m2 + 5,
      bedrooms,
      bathrooms: 1,
      garages: 1,
      pricePerM2Usd: Math.round(priceUsd / m2),
      adjustedPriceUsd: Math.round(priceUsd * 0.88), // -12% asking price adjustment
      adjustedPricePerM2Usd: Math.round((priceUsd * 0.88) / m2),
      similarityScore: 88,
      sourceCode: 'INFOCASAS',
      sourceName: 'InfoCasas Uruguay',
      daysSincePublication: 15,
      dataQualityScore: 82,
      comparableEligibility: 'DIRECT',
      latitude: -34.9130,
      longitude: -56.1490,
      distanceMeters: 250,
      isSameNeighborhood: true,
      surfaceDiffPercent: 5,
      hasGaragesMatch: true,
      hasBedroomsMatch: true,
    },
  });

  test('1. Validación de Umbral Mínimo N >= 3: Bloqueo estricto con menos de 3 comparables', async () => {
    // Crear tasación con solo 2 comparables
    const app = await service.createAppraisal({
      organizationId: orgA,
      propertyInput: mockTarget,
      location: mockLocation,
    });

    const comps = [
      createMockComparable('1', 190000, 75),
      createMockComparable('2', 205000, 78),
    ];

    await service.saveComparablesReview({
      appraisalId: app.id,
      organizationId: orgA,
      comparables: comps,
      stats: service.calculateDescriptiveStats(comps),
      setQuality: 'BAJA',
      nextStatus: 'COMPARABLES_REVIEWED',
    });

    // Intentar calcular valoración debe fallar con error descriptivo
    await expect(
      service.calculateValuation({
        appraisalId: app.id,
        organizationId: orgA,
        userEmail: 'analista@test.com',
      })
    ).rejects.toThrow(/(mínimo|al menos).*3.*comparables/i);
  });

  test('2. Ejecución de Valoración Matemática Certificada y Redondeo Profesional', async () => {
    const app = await service.createAppraisal({
      organizationId: orgA,
      propertyInput: mockTarget,
      location: mockLocation,
    });

    // 5 comparables válidos
    const comps = [
      createMockComparable('1', 185000, 74),
      createMockComparable('2', 195000, 76),
      createMockComparable('3', 200000, 75),
      createMockComparable('4', 210000, 78),
      createMockComparable('5', 215000, 80),
    ];

    await service.saveComparablesReview({
      appraisalId: app.id,
      organizationId: orgA,
      comparables: comps,
      stats: service.calculateDescriptiveStats(comps),
      setQuality: 'ALTA',
      nextStatus: 'READY_FOR_VALUATION',
    });

    const { run, appraisal } = await service.calculateValuation({
      appraisalId: app.id,
      organizationId: orgA,
      userEmail: 'analista@test.com',
      notes: 'Valoración inicial de colateral',
    });

    // Verificaciones matemáticas
    expect(run).toBeDefined();
    expect(run.runNumber).toBe(1);
    expect(run.engineVersion).toBe('v1.0.0-certified');
    expect(run.comparablesUsedCount).toBe(5);
    expect(run.estimatedMarketValue).toBeGreaterThan(150000);
    expect(run.estimatedMarketValue).toBeLessThan(210000);

    // Redondeo profesional: para valores >= 100.000 debe ser múltiplo de USD 500 o 1000 (sin centavos)
    expect(run.estimatedMarketValue % 500).toBe(0);
    expect(run.valueRangeMin % 1000).toBe(0);
    expect(run.valueRangeMax % 1000).toBe(0);
    expect(run.valueRangeMin).toBeLessThan(run.estimatedMarketValue);
    expect(run.valueRangeMax).toBeGreaterThan(run.estimatedMarketValue);

    // Factores determinísticos y explicables
    expect(run.favorableFactors.length).toBeGreaterThan(0);
    expect(run.confidenceLevel).toBe('ALTA');

    // Estado de la tasación actualizado
    expect(appraisal.status).toBe('VALUATED');
    expect(appraisal.estimatedValue).toBe(run.estimatedMarketValue);
  });

  test('3. Inmutabilidad de Runs y Aislamiento de Snapshot (Deep Clone)', async () => {
    const app = await service.createAppraisal({
      organizationId: orgA,
      propertyInput: mockTarget,
      location: mockLocation,
    });

    const comps = [
      createMockComparable('1', 190000, 75),
      createMockComparable('2', 195000, 75),
      createMockComparable('3', 200000, 75),
      createMockComparable('4', 210000, 75),
    ];

    await service.saveComparablesReview({
      appraisalId: app.id,
      organizationId: orgA,
      comparables: comps,
      stats: service.calculateDescriptiveStats(comps),
      setQuality: 'ALTA',
    });

    // RUN #1
    const res1 = await service.calculateValuation({
      appraisalId: app.id,
      organizationId: orgA,
    });
    expect(res1.run.runNumber).toBe(1);
    const run1TargetSnapshotArea = res1.run.targetPropertySnapshot.surfaces.builtAreaM2;
    expect(run1TargetSnapshotArea).toBe(75);

    // Mutar el inmueble original o excluir comparables
    app.propertyInput.surfaces.builtAreaM2 = 999;
    comps[3].selected = false;
    comps[3].status = 'EXCLUDED';
    comps[3].exclusionReason = 'ATYPICAL_PRICE';

    await service.saveComparablesReview({
      appraisalId: app.id,
      organizationId: orgA,
      comparables: comps,
      stats: service.calculateDescriptiveStats(comps),
      setQuality: 'MEDIA',
    });

    // RUN #2
    const res2 = await service.calculateValuation({
      appraisalId: app.id,
      organizationId: orgA,
      notes: 'RUN #2 tras exclusión de comparable extremo',
    });

    expect(res2.run.runNumber).toBe(2);
    expect(res2.run.comparablesUsedCount).toBe(3);
    expect(res2.run.excludedComparablesCount).toBe(1);

    // El snapshot de RUN #1 se mantiene TOTALMENTE intacto (no mutó)
    const runs = service.getValuationRuns(app.id);
    expect(runs.length).toBe(2);
    expect(runs[0].runNumber).toBe(1);
    expect(runs[0].comparablesUsedCount).toBe(4);
    expect(runs[0].targetPropertySnapshot.surfaces.builtAreaM2).toBe(75);

    // RUN #2 tiene su propio snapshot
    expect(runs[1].runNumber).toBe(2);
    expect(runs[1].comparablesUsedCount).toBe(3);
  });

  test('4. Trazabilidad Completa: Audit Logs y Timeline de Eventos', async () => {
    const app = await service.createAppraisal({
      organizationId: orgA,
      propertyInput: mockTarget,
      location: mockLocation,
    });

    const comps = [
      createMockComparable('1', 190000, 75),
      createMockComparable('2', 195000, 75),
      createMockComparable('3', 200000, 75),
    ];

    await service.saveComparablesReview({
      appraisalId: app.id,
      organizationId: orgA,
      comparables: comps,
      stats: service.calculateDescriptiveStats(comps),
      setQuality: 'MEDIA',
    });

    await service.calculateValuation({
      appraisalId: app.id,
      organizationId: orgA,
      userEmail: 'auditor@banco.com',
    });

    // Generar reporte PDF
    const { report } = await service.generateReportPdf({
      appraisalId: app.id,
      organizationId: orgA,
      userEmail: 'auditor@banco.com',
    });

    // Finalizar tasación
    await service.finalizeAppraisal({
      appraisalId: app.id,
      organizationId: orgA,
      userEmail: 'auditor@banco.com',
    });

    const logs = service.getAuditLogs(app.id);
    expect(logs.length).toBeGreaterThanOrEqual(3);

    const eventTypes = logs.map((l) => l.eventType);
    expect(eventTypes).toContain('VALUATION_EXECUTED');
    expect(eventTypes).toContain('REPORT_GENERATED');
    expect(eventTypes).toContain('APPRAISAL_FINALIZED');

    const finalizedApp = await service.getAppraisal(app.id, orgA);
    expect(finalizedApp?.status).toBe('FINALIZED');
    expect(report.fileName).toMatch(/\.pdf$/);
  });

  test('5. Generador Binario PDF-1.4: Cumplimiento Estricto de Especificación y Hash SHA-256', async () => {
    const app = await service.createAppraisal({
      organizationId: orgA,
      propertyInput: mockTarget,
      location: mockLocation,
    });

    const comps = [
      createMockComparable('1', 190000, 75),
      createMockComparable('2', 195000, 75),
      createMockComparable('3', 200000, 75),
      createMockComparable('4', 210000, 75),
    ];

    await service.saveComparablesReview({
      appraisalId: app.id,
      organizationId: orgA,
      comparables: comps,
      stats: service.calculateDescriptiveStats(comps),
      setQuality: 'ALTA',
    });

    const { run } = await service.calculateValuation({
      appraisalId: app.id,
      organizationId: orgA,
    });

    const pdfResult = await PdfReportGenerator.generateAppraisalPdf(app, run, {
      organizationName: 'BANCO HIPOTECARIO TEST',
      primaryColorHex: '#102d49',
    });

    const pdfBuffer = Buffer.from(pdfResult.pdfBytes);

    // 1. Cabecera binaria PDF-1.4 válida
    const header = pdfBuffer.subarray(0, 8).toString('latin1');
    expect(header.startsWith('%PDF-1.4')).toBe(true);

    // 2. Cierre EOF canónico de PDF
    const tail = pdfBuffer.subarray(pdfBuffer.length - 20).toString('latin1');
    expect(tail).toContain('%%EOF');

    // 3. Estructura de 4 páginas
    const pdfText = pdfBuffer.toString('latin1');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).toBeDefined();
    expect(pageMatches?.length).toBe(4);

    // 4. Integridad criptográfica SHA-256 exacta
    const actualHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    expect(pdfResult.fileHashSha256).toBe(actualHash);

    // 5. Tamaño financiero (> 10 KB)
    expect(pdfResult.fileSizeBytes).toBeGreaterThan(10240);
    expect(pdfResult.fileSizeBytes).toBe(pdfBuffer.length);

    // 6. Contenido del informe: branding y metadatos presentes
    expect(pdfText).toContain('BANCO HIPOTECARIO TEST');
    expect(pdfText).toContain(run.id);
  });

  test('6. Aislamiento Multi-Tenant: Prevención de fuga entre organizaciones', async () => {
    // Tasación creada en Org A
    const appA = await service.createAppraisal({
      organizationId: orgA,
      propertyInput: mockTarget,
      location: mockLocation,
    });

    // Intentar consultar o finalizar desde Org B
    const queryFromOrgB = await service.getAppraisal(appA.id, orgB);
    expect(queryFromOrgB).toBeNull();

    await expect(
      service.calculateValuation({
        appraisalId: appA.id,
        organizationId: orgB, // Org ajena
      })
    ).rejects.toThrow();
  });
});
