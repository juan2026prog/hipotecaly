// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE TRANSACTION INTELLIGENCE (CLOSED SALES)
// Validación de Cierres Reales, Descuento Asking-to-Closing, Days on Market y Seguridad
// ==============================================================================

import { test, expect } from '@playwright/test';
import { TransactionIntelligenceService } from '../src/lib/tasador/transactions/TransactionIntelligenceService';

test.describe('TASADOR IA — TRANSACTION INTELLIGENCE & CLOSED SALES DATA', () => {
  const service = TransactionIntelligenceService.getInstance();

  test.beforeEach(() => {
    service.clearAll();
  });

  test('1. Registro de Cierre Verificado: Cálculo exacto de descuento y Days on Market', () => {
    const tx = service.registerTransaction({
      propertyMasterId: 'pm_pocitos_101',
      sourceId: 'remax_uy',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      propertyType: 'APARTMENT',
      builtAreaM2: 80,
      askingPriceInitial: 220000,
      askingPriceLast: 200000,
      closingPrice: 184000,
      currency: 'USD',
      listingFirstSeenAt: '2026-01-01T10:00:00.000Z',
      listingLastSeenAt: '2026-03-25T10:00:00.000Z',
      transactionDate: '2026-04-01',
      sourceType: 'EXTERNAL_AGENCY',
      evidenceType: 'AGENCY_CONFIRMED',
      evidenceReference: 'Boleto de Reserva Inmobiliario #9921',
      registeredByUserId: 'analista_1',
    });

    expect(tx).toBeDefined();
    expect(tx.confidence).toBe('HIGH');
    expect(tx.verificationStatus).toBe('VERIFIED');
    // Descuento desde el último asking: (200.000 - 184.000) / 200.000 = 8.00%
    expect(tx.discountAbsolute).toBe(16000);
    expect(tx.discountPercentage).toBe(8.0);
    // Descuento desde asking inicial: (220.000 - 184.000) / 220.000 = 16.36%
    expect(tx.initialDiscountPercentage).toBe(16.36);
    // Days on Market: del 1 de enero al 1 de abril = 90 días
    expect(tx.daysOnMarket).toBe(90);
    expect(tx.auditTrail?.length).toBe(1);
  });

  test('2. Distinción Estricta: Listing Inactivo / Despublicado NO equivale a Vendido', () => {
    // Si la evidencia es INFERRED o sin confirmación documental, se clasifica como UNVERIFIED
    const unverifiedTx = service.registerTransaction({
      propertyMasterId: 'pm_cordon_202',
      sourceId: 'infocasas',
      department: 'Montevideo',
      neighborhood: 'Cordón',
      propertyType: 'APARTMENT',
      askingPriceInitial: 140000,
      askingPriceLast: 135000,
      closingPrice: 125000,
      listingFirstSeenAt: '2026-02-01T10:00:00.000Z',
      listingLastSeenAt: '2026-03-01T10:00:00.000Z',
      transactionDate: '2026-03-02',
      sourceType: 'EXTERNAL_AGENCY',
      evidenceType: 'INFERRED',
      notes: 'Listing retirado de portal; sin boleto de compraventa verificado.',
    });

    expect(unverifiedTx.confidence).toBe('UNVERIFIED');
    expect(unverifiedTx.verificationStatus).toBe('PENDING_REVIEW');

    // Las métricas de calibración deben ignorar transacciones UNVERIFIED
    const summary = service.getDashboardSummary();
    expect(summary.kpis.totalVerifiedTransactions).toBe(0);
    expect(summary.kpis.totalUnverifiedTransactions).toBe(1);
  });

  test('3. Deduplicación de Transacciones Cross-Source: Misma operación no se duplica', () => {
    // Registrar la misma venta reportada por RE/MAX y luego por Inmobiliaria local
    const tx1 = service.registerTransaction({
      propertyMasterId: 'pm_carrasco_501',
      sourceId: 'remax_uy',
      department: 'Montevideo',
      neighborhood: 'Carrasco',
      propertyType: 'HOUSE',
      askingPriceInitial: 500000,
      askingPriceLast: 480000,
      closingPrice: 440000,
      listingFirstSeenAt: '2026-01-15T00:00:00.000Z',
      listingLastSeenAt: '2026-05-15T00:00:00.000Z',
      transactionDate: '2026-05-20',
      sourceType: 'EXTERNAL_AGENCY',
      evidenceType: 'AGENCY_CONFIRMED',
    });

    const tx2 = service.registerTransaction({
      propertyMasterId: 'pm_carrasco_501', // Mismo master
      sourceId: 'century21_uy',
      department: 'Montevideo',
      neighborhood: 'Carrasco',
      propertyType: 'HOUSE',
      askingPriceInitial: 500000,
      askingPriceLast: 480000,
      closingPrice: 440000, // Mismo precio y fecha
      listingFirstSeenAt: '2026-01-15T00:00:00.000Z',
      listingLastSeenAt: '2026-05-15T00:00:00.000Z',
      transactionDate: '2026-05-20',
      sourceType: 'EXTERNAL_AGENCY',
      evidenceType: 'AGENCY_CONFIRMED',
    });

    expect(tx1.id).toBe(tx2.id); // Conserva la misma entidad deduplicada
    const verified = service.getTransactions({ onlyVerified: true });
    expect(verified.length).toBe(1);
  });

  test('4. Price Journey Completo: Initial Asking -> Price Changes -> Last Asking -> Closing Price', () => {
    const tx = service.registerTransaction({
      propertyMasterId: 'pm_malvin_301',
      sourceId: 'acs_uy',
      department: 'Montevideo',
      neighborhood: 'Malvín',
      propertyType: 'APARTMENT',
      askingPriceInitial: 260000,
      askingPriceLast: 245000,
      closingPrice: 230000,
      listingFirstSeenAt: '2026-01-01T00:00:00.000Z',
      listingLastSeenAt: '2026-04-01T00:00:00.000Z',
      transactionDate: '2026-04-10',
      sourceType: 'EXTERNAL_AGENCY',
      evidenceType: 'OFFICIAL_RECORD',
    });

    expect(tx.askingPriceInitial).toBe(260000);
    expect(tx.askingPriceLast).toBe(245000);
    expect(tx.closingPrice).toBe(230000);
    // Descuento desde el último asking: (245k - 230k)/245k = 6.12%
    expect(tx.discountPercentage).toBe(6.12);
  });

  test('5. Estadísticas Robustas Segmentadas y Tamaño de Muestra N', () => {
    // Cargar 5 operaciones verificadas en Pocitos
    const discountsPocitos = [6.0, 7.5, 8.0, 8.5, 10.0];
    discountsPocitos.forEach((disc, idx) => {
      const ask = 200000;
      const close = Math.round(ask * (1 - disc / 100));
      service.registerTransaction({
        propertyMasterId: `pm_pocitos_seg_${idx + 1}`,
        sourceId: 'remax_uy',
        department: 'Montevideo',
        neighborhood: 'Pocitos',
        propertyType: 'APARTMENT',
        builtAreaM2: 75,
        askingPriceInitial: ask,
        askingPriceLast: ask,
        closingPrice: close,
        listingFirstSeenAt: '2026-01-01T00:00:00.000Z',
        listingLastSeenAt: '2026-03-01T00:00:00.000Z',
        transactionDate: `2026-03-0${idx + 1}`,
        sourceType: 'EXTERNAL_AGENCY',
        evidenceType: 'AGENCY_CONFIRMED',
      });
    });

    const segments = service.computeSegmentMetrics();
    expect(segments.length).toBe(1);
    const pocitosSeg = segments[0];

    expect(pocitosSeg.neighborhood).toBe('Pocitos');
    expect(pocitosSeg.sampleSizeN).toBe(5);
    expect(pocitosSeg.readiness).toBe('INSUFFICIENT_DATA'); // N < 20
    expect(pocitosSeg.medianDiscountPct).toBe(8.0); // Mediana de [6.0, 7.5, 8.0, 8.5, 10.0]
    expect(pocitosSeg.currentGlobalAdjustmentPct).toBe(8.5);
    expect(pocitosSeg.spreadVsGlobalAdjustmentPct).toBe(-0.5); // 8.0 - 8.5 = -0.5%
    expect(pocitosSeg.calibrationReviewRecommended).toBe(false); // No recomienda por N < 50
  });

  test('6. Auditoría y Trazabilidad Inmutable: Registro de quién creó y verificó', () => {
    const tx = service.registerTransaction({
      propertyMasterId: 'pm_audit_test',
      sourceId: 'manual_verified_admin',
      department: 'Montevideo',
      neighborhood: 'Punta Carretas',
      propertyType: 'APARTMENT',
      askingPriceInitial: 310000,
      askingPriceLast: 300000,
      closingPrice: 280000,
      listingFirstSeenAt: '2026-01-01T00:00:00.000Z',
      listingLastSeenAt: '2026-03-01T00:00:00.000Z',
      transactionDate: '2026-03-15',
      sourceType: 'MANUAL_ENTRY',
      evidenceType: 'MANUAL_VERIFIED',
      evidenceReference: 'Escritura Pública Notario Juan Pérez Protocolo 41',
      registeredByUserId: 'superadmin_01',
      notes: 'Validación cruzada con cédula catastral.',
    });

    expect(tx.auditTrail).toBeDefined();
    expect(tx.auditTrail?.length).toBe(1);
    expect(tx.auditTrail![0].action).toBe('CREATED');
    expect(tx.auditTrail![0].performedByUserId).toBe('superadmin_01');
    expect(tx.evidenceReference).toContain('Escritura Pública');
  });
});
