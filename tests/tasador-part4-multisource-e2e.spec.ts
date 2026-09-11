// ==============================================================================
// HIPOTECALY TASADOR IA - TEST SUITE: PARTE 4 - MULTI-FUENTE Y CERTIFICACIÓN E2E
// Re-Health Check Honesto, Deduplicación Cross-Source, Unique Property Rule y E2E
// ==============================================================================

import { test, expect } from '@playwright/test';
import { AppraisalService } from '../src/lib/tasador/appraisal/AppraisalService';
import { AdapterRegistry } from '../src/lib/tasador/adapters/AdapterRegistry';
import { PdfReportGenerator } from '../src/lib/tasador/report/PdfReportGenerator';
import {
  AppraisalPropertyInput,
  AppraisalLocation,
  AppraisalComparableItem,
} from '../src/lib/tasador/appraisal/appraisalTypes';
import * as crypto from 'crypto';

test.describe('Tasador IA - Parte 4: Expansión Multi-Fuente y Certificación E2E', () => {
  const service = AppraisalService.getInstance();
  const registry = AdapterRegistry.getInstance();
  const orgA = 'org-banco-fiduciario-test';

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

  test('1. Re-Health Check y Gobernanza de las Fuentes Inmobiliarias (Sin Evasión)', async () => {
    // Verificar que todas las fuentes candidatas están registradas con capabilities explícitas
    const expectedSources = [
      'acs_uy',
      'bado_asociados_uy',
      'caldeiro_uy',
      'canepa_uy',
      'century21_uy',
      'engel_volkers_uy',
      'kosak_uy',
      'meikle_uy',
      'nicolas_modena_uy',
      'remax_uy',
      'terramar_uy',
    ];

    for (const code of expectedSources) {
      const adapter = registry.getAdapter(code);
      expect(adapter).toBeDefined();
      expect(adapter?.sourceCode).toBe(code);
      expect(adapter?.baseUrl).toBeDefined();
    }

    // Verificar que las fuentes bloqueadas o con WAF severo NO intentan bypass ilegal
    const gallito = registry.getAdapter('gallito_uy');
    expect(gallito?.capability).toBe('BLOCKED');

    const sothebys = registry.getAdapter('sothebys_uy');
    expect(sothebys?.capability).toBe('REQUIRES_AUTHORIZATION');
  });

  test('2. Unique Property Comparable Rule: Bloqueo de inflación artificial de muestra con duplicados cross-source', async () => {
    const app = await service.createAppraisal({
      organizationId: orgA,
      propertyInput: mockTarget,
      location: mockLocation,
    });

    // Crear 3 items de comparables, pero 2 de ellos pertenecen al MISMO inmueble físico (mismo propertyMasterId)
    const compsWithDuplicate: AppraisalComparableItem[] = [
      {
        id: 'comp_info_01',
        appraisalId: app.id,
        propertyMasterId: 'pm_pocitos_dup_same_building', // Inmueble 1 (InfoCasas)
        listingId: 'list_info_01',
        similarityScore: 92,
        scoreBreakdown: { locationScore: 90, propertyTypeScore: 95, surfaceScore: 90, bedroomsScore: 90, bathroomsScore: 90, garagesScore: 90, recencyScore: 90, qualityScore: 90 },
        selected: true,
        status: 'INCLUDED',
        rank: 1,
        candidateData: {
          title: 'Apartamento Pocitos 75m2 en InfoCasas',
          propertyType: 'APARTMENT',
          condition: 'GOOD',
          neighborhood: 'Pocitos',
          city: 'Montevideo',
          department: 'Montevideo',
          priceUsd: 195000,
          currency: 'USD',
          builtAreaM2: 75,
          totalAreaM2: 80,
          bedrooms: 2,
          bathrooms: 1,
          garages: 1,
          pricePerM2Usd: 2600,
          adjustedPriceUsd: 171600,
          adjustedPricePerM2Usd: 2288,
          similarityScore: 92,
          sourceCode: 'infocasas',
          sourceName: 'InfoCasas Uruguay',
          daysSincePublication: 10,
          dataQualityScore: 90,
          comparableEligibility: 'DIRECT',
        },
      },
      {
        id: 'comp_remax_01',
        appraisalId: app.id,
        propertyMasterId: 'pm_pocitos_dup_same_building', // Mismo Inmueble 1 publicado en RE/MAX
        listingId: 'list_remax_01',
        similarityScore: 90,
        scoreBreakdown: { locationScore: 90, propertyTypeScore: 95, surfaceScore: 90, bedroomsScore: 90, bathroomsScore: 90, garagesScore: 90, recencyScore: 90, qualityScore: 90 },
        selected: true,
        status: 'INCLUDED',
        rank: 2,
        candidateData: {
          title: 'Exclusivo Apartamento Pocitos 75m2 en Remax',
          propertyType: 'APARTMENT',
          condition: 'GOOD',
          neighborhood: 'Pocitos',
          city: 'Montevideo',
          department: 'Montevideo',
          priceUsd: 193000,
          currency: 'USD',
          builtAreaM2: 75,
          totalAreaM2: 80,
          bedrooms: 2,
          bathrooms: 1,
          garages: 1,
          pricePerM2Usd: 2573,
          adjustedPriceUsd: 169840,
          adjustedPricePerM2Usd: 2264,
          similarityScore: 90,
          sourceCode: 'remax_uy',
          sourceName: 'RE/MAX Uruguay',
          daysSincePublication: 15,
          dataQualityScore: 88,
          comparableEligibility: 'DIRECT',
        },
      },
      {
        id: 'comp_c21_01',
        appraisalId: app.id,
        propertyMasterId: 'pm_pocitos_independent_02', // Inmueble 2 (Century 21)
        listingId: 'list_c21_01',
        similarityScore: 88,
        scoreBreakdown: { locationScore: 88, propertyTypeScore: 95, surfaceScore: 85, bedroomsScore: 90, bathroomsScore: 85, garagesScore: 90, recencyScore: 85, qualityScore: 85 },
        selected: true,
        status: 'INCLUDED',
        rank: 3,
        candidateData: {
          title: 'Planta luminosa Pocitos',
          propertyType: 'APARTMENT',
          condition: 'VERY_GOOD',
          neighborhood: 'Pocitos',
          city: 'Montevideo',
          department: 'Montevideo',
          priceUsd: 205000,
          currency: 'USD',
          builtAreaM2: 78,
          totalAreaM2: 82,
          bedrooms: 2,
          bathrooms: 2,
          garages: 1,
          pricePerM2Usd: 2628,
          adjustedPriceUsd: 180400,
          adjustedPricePerM2Usd: 2312,
          similarityScore: 88,
          sourceCode: 'century21_uy',
          sourceName: 'Century 21 Uruguay',
          daysSincePublication: 18,
          dataQualityScore: 89,
          comparableEligibility: 'DIRECT',
        },
      },
    ];

    await service.saveComparablesReview({
      appraisalId: app.id,
      organizationId: orgA,
      comparables: compsWithDuplicate,
      stats: service.calculateDescriptiveStats(compsWithDuplicate),
      setQuality: 'MEDIA',
      nextStatus: 'READY_FOR_VALUATION',
    });

    // Aunque hay 3 listings seleccionados, solo hay 2 inmuebles físicos distintos (N = 2).
    // La regla debe colapsar los duplicados y BLOQUEAR la valoración matemática.
    await expect(
      service.calculateValuation({
        appraisalId: app.id,
        organizationId: orgA,
      })
    ).rejects.toThrow(/(mínimo|al menos).*3.*comparables/i);

    // Ahora agregamos un 3er inmueble físico independiente
    const thirdIndependentComp: AppraisalComparableItem = {
      id: 'comp_kosak_01',
      appraisalId: app.id,
      propertyMasterId: 'pm_pocitos_independent_03', // Inmueble 3 (Kosak)
      listingId: 'list_kosak_01',
      similarityScore: 86,
      scoreBreakdown: { locationScore: 85, propertyTypeScore: 95, surfaceScore: 85, bedroomsScore: 90, bathroomsScore: 85, garagesScore: 90, recencyScore: 85, qualityScore: 85 },
      selected: true,
      status: 'INCLUDED',
      rank: 4,
      candidateData: {
        title: 'Unidad sólida con garaje Pocitos',
        propertyType: 'APARTMENT',
        condition: 'GOOD',
        neighborhood: 'Pocitos',
        city: 'Montevideo',
        department: 'Montevideo',
        priceUsd: 198000,
        currency: 'USD',
        builtAreaM2: 74,
        totalAreaM2: 79,
        bedrooms: 2,
        bathrooms: 1,
        garages: 1,
        pricePerM2Usd: 2675,
        adjustedPriceUsd: 174240,
        adjustedPricePerM2Usd: 2354,
        similarityScore: 86,
        sourceCode: 'kosak_uy',
        sourceName: 'Kosak Inversiones',
        daysSincePublication: 25,
        dataQualityScore: 86,
        comparableEligibility: 'DIRECT',
      },
    };

    const validPool = [...compsWithDuplicate, thirdIndependentComp];
    await service.saveComparablesReview({
      appraisalId: app.id,
      organizationId: orgA,
      comparables: validPool,
      stats: service.calculateDescriptiveStats(validPool),
      setQuality: 'MEDIA',
    });

    // Ahora con 3 inmuebles físicos independientes, la valoración DEBE ejecutarse con éxito
    const { run } = await service.calculateValuation({
      appraisalId: app.id,
      organizationId: orgA,
    });

    expect(run).toBeDefined();
    // La muestra usada debe ser 3 (los 3 inmuebles físicos distintos, con el duplicado colapsado al de mayor score)
    expect(run.comparablesUsedCount).toBe(3);
    expect(run.estimatedMarketValue).toBeGreaterThan(150000);
  });

  test('3. Búsqueda Multi-Fuente Integrada: Coexistencia armónica de portales inmobiliarios', async () => {
    // La búsqueda server-side devuelve candidatos representativos de múltiples fuentes
    const result = service.searchComparablesFallback(mockTarget);
    expect(result.candidates.length).toBeGreaterThanOrEqual(6);

    const sourcesFound = new Set(result.candidates.map((c) => c.candidateData.sourceCode));
    expect(sourcesFound.has('infocasas')).toBe(true);
    expect(sourcesFound.has('remax_uy')).toBe(true);
    expect(sourcesFound.has('century21_uy')).toBe(true);
    expect(sourcesFound.has('kosak_uy')).toBe(true);
    expect(sourcesFound.has('acs_uy')).toBe(true);

    // Todos los comparables tienen aplicado el -12% de asking price adjustment
    for (const c of result.candidates) {
      expect(c.candidateData.adjustedPriceUsd).toBeLessThan(c.candidateData.priceUsd);
      expect(c.candidateData.askingPriceAdjustmentApplied).toBe(true);
    }
  });

  test('4. Flujo End-to-End Completo: Creación -> Búsqueda Multi-Fuente -> Exclusión -> Valoración -> Dossier -> PDF', async () => {
    // Paso 1: Creación de Tasación
    const app = await service.createAppraisal({
      organizationId: orgA,
      propertyInput: mockTarget,
      location: mockLocation,
    });
    expect(app.id).toBeDefined();
    expect(app.status).toBe('READY_FOR_COMPARABLES');

    // Paso 2: Búsqueda de Comparables Multi-Fuente
    const searchRes = service.searchComparablesFallback(mockTarget);
    expect(searchRes.candidates.length).toBeGreaterThanOrEqual(6);

    await service.saveComparablesReview({
      appraisalId: app.id,
      organizationId: orgA,
      comparables: searchRes.candidates,
      stats: searchRes.stats,
      setQuality: searchRes.setQuality,
      nextStatus: 'COMPARABLES_FOUND',
    });

    // Paso 3: Human-in-the-Loop: Exclusión fundamentada de comparable extremo
    const compToExclude = searchRes.candidates[searchRes.candidates.length - 1];
    await service.excludeComparable(
      app.id,
      compToExclude.id,
      'ATYPICAL_SURFACE',
      'Superficie atípica superior al rango del colateral'
    );

    const updatedReview = await service.getAppraisal(app.id, orgA);
    const excluded = (updatedReview?.comparables || []).find((c) => c.id === compToExclude.id);
    expect(excluded?.selected).toBe(false);
    expect(excluded?.status).toBe('EXCLUDED');
    expect(excluded?.exclusionReason).toBe('ATYPICAL_SURFACE');

    // Paso 4: Ejecución de Valoración Matemática (RUN #1)
    const valResult = await service.calculateValuation({
      appraisalId: app.id,
      organizationId: orgA,
      userEmail: 'analista.senior@banco.com',
      notes: 'Colateral residencial apto para hipoteca garantizada',
    });

    expect(valResult.run.runNumber).toBe(1);
    expect(valResult.appraisal.status).toBe('VALUATED');
    expect(valResult.run.confidenceLevel).toMatch(/(ALTA|MEDIA)/);

    // Paso 5: Generación de Informe PDF Profesional Binario
    const pdfRes = await service.generateReportPdf({
      appraisalId: app.id,
      organizationId: orgA,
      runId: valResult.run.id,
      userEmail: 'analista.senior@banco.com',
      branding: {
        organizationName: 'BANCO FIDUCIARIO PRIVADO',
        primaryColorHex: '#102d49',
        reportTitle: 'DICTAMEN PERICIAL DEFINITIVO DE TASACION',
      },
    });

    expect(pdfRes.report.fileHashSha256).toBeDefined();
    expect(pdfRes.pdfBytes.length).toBeGreaterThan(10000);

    const pdfBuffer = Buffer.from(pdfRes.pdfBytes);
    expect(pdfBuffer.subarray(0, 8).toString('latin1')).toBe('%PDF-1.4');
    expect(pdfBuffer.toString('latin1')).toContain('%%EOF');

    const calculatedSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    expect(pdfRes.report.fileHashSha256).toBe(calculatedSha256);

    // Paso 6: Finalización y Archivo Formal de la Tasación
    const finalized = await service.finalizeAppraisal({
      appraisalId: app.id,
      organizationId: orgA,
      userEmail: 'analista.senior@banco.com',
    });

    expect(finalized.status).toBe('FINALIZED');

    // Paso 7: Verificación del Dossier y Auditoría Forense
    const runs = service.getValuationRuns(app.id);
    const logs = service.getAuditLogs(app.id);
    const reports = service.getReports(app.id);

    expect(runs.length).toBe(1);
    expect(reports.length).toBe(1);
    expect(logs.length).toBeGreaterThanOrEqual(3);

    const logTypes = logs.map((l) => l.eventType);
    expect(logTypes).toContain('VALUATION_EXECUTED');
    expect(logTypes).toContain('REPORT_GENERATED');
    expect(logTypes).toContain('APPRAISAL_FINALIZED');
  });

  test('5. Wave 1 Expansion: Descubrimiento e Ingesta Real de las 4 Fuentes Operativas', async () => {
    const sources = ['remax_uy', 'century21_uy', 'acs_uy', 'kosak_uy'];

    for (const src of sources) {
      const adapter = registry.getAdapter(src);
      expect(adapter).toBeDefined();

      const health = await adapter!.healthCheck();
      expect(health.status).toBe(200);

      const items = await adapter!.discoverListings({ limit: 10, department: 'montevideo' });
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        expect(item.sourceCode).toBe(src);
        expect(item.currentPriceRaw).toBeGreaterThan(50000);
        expect(item.currencyRaw).toBe('USD');
        expect(item.totalAreaM2Raw).toBeGreaterThan(20);
        expect(item.departmentRaw).toBeDefined();
        expect(item.neighborhoodRaw).toBeDefined();
      }
    }
  });

  test('6. Wave 1 Cross-Source Deduplication: Detección Real de Inmuebles Multi-Portal y Cero False Merges', async () => {
    // Inmueble físico real publicado en múltiples inmobiliarias: Av. Brasil 2650, Apto 402, Pocitos
    const remaxListing = await registry.getAdapter('remax_uy')!.fetchListing('rmx_pocitos_101');
    const c21Listing = await registry.getAdapter('century21_uy')!.fetchListing('c21_pocitos_201');
    const acsaListing = await registry.getAdapter('acs_uy')!.fetchListing('acs_pocitos_301');
    const kosakListing = await registry.getAdapter('kosak_uy')!.fetchListing('ksk_pocitos_401');

    expect(remaxListing).toBeDefined();
    expect(c21Listing).toBeDefined();
    expect(acsaListing).toBeDefined();
    expect(kosakListing).toBeDefined();

    // Normalización
    const normRemax = await registry.getAdapter('remax_uy')!.normalizeListing(remaxListing!);
    const normC21 = await registry.getAdapter('century21_uy')!.normalizeListing(c21Listing!);
    const normAcsa = await registry.getAdapter('acs_uy')!.normalizeListing(acsaListing!);
    const normKosak = await registry.getAdapter('kosak_uy')!.normalizeListing(kosakListing!);

    // Deduplicación y resolución de master
    const masterResolver = service['masterResolver'] || (await import('../src/lib/tasador/master/PropertyMasterResolver')).PropertyMasterResolver.getInstance();
    const res1 = masterResolver.resolveMaster(normRemax);
    const res2 = masterResolver.resolveMaster(normC21);
    const res3 = masterResolver.resolveMaster(normAcsa);
    const res4 = masterResolver.resolveMaster(normKosak);

    // Los 4 listings deben confluir en el MISMO property_master (TRUE_DUPLICATE cluster)
    expect(res1.master.id).toBe(res2.master.id);
    expect(res2.master.id).toBe(res3.master.id);
    expect(res3.master.id).toBe(res4.master.id);
    expect(res1.master.listingIds.length).toBeGreaterThanOrEqual(4);

    // Inmueble independiente no debe fusionarse (CERO FALSE MERGES)
    const independentListing = await registry.getAdapter('remax_uy')!.fetchListing('rmx_cordon_103');
    const normIndep = await registry.getAdapter('remax_uy')!.normalizeListing(independentListing!);
    const resIndep = masterResolver.resolveMaster(normIndep);

    expect(resIndep.master.id).not.toBe(res1.master.id);
    expect(resIndep.isNew).toBe(true);
  });
});

