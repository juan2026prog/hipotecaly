// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE TRANSACTION INTELLIGENCE (FASE B)
// Gestión de Cierres Reales, Cálculo Asking-to-Closing, Auditoría y Aislamiento
// ==============================================================================

import {
  PropertyTransaction,
  SegmentTransactionMetrics,
  TransactionIntelligenceDashboardSummary,
  TransactionConfidenceLevel,
  TransactionEvidenceType,
  SegmentCalibrationReadiness,
  TransactionAuditRecord,
} from './transactionTypes';
import { AppraisalSettingsManager } from '../valuation/AppraisalSettingsManager';

export class TransactionIntelligenceService {
  private static instance: TransactionIntelligenceService;

  // Repositorio de transacciones en memoria (complementable por Supabase server-side)
  private transactions: Map<string, PropertyTransaction> = new Map();
  private auditHistory: TransactionAuditRecord[] = [];

  private constructor() {
    // Inicialización limpia: en producción inicia con 0 datos sintéticos.
  }

  public static getInstance(): TransactionIntelligenceService {
    if (!TransactionIntelligenceService.instance) {
      TransactionIntelligenceService.instance = new TransactionIntelligenceService();
    }
    return TransactionIntelligenceService.instance;
  }

  /**
   * Registra una transacción de compraventa cerrada con validación de evidencia y deduplicación estricta
   */
  public registerTransaction(params: {
    propertyMasterId: string;
    listingId?: string | null;
    sourceId: string;
    sourceName?: string | null;
    department: string;
    city?: string | null;
    neighborhood: string;
    propertyType: string;
    bedrooms?: number | null;
    bathrooms?: number | null;
    builtAreaM2?: number | null;
    totalAreaM2?: number | null;
    askingPriceInitial: number;
    askingPriceLast: number;
    closingPrice: number;
    currency?: 'USD' | 'UYU';
    listingFirstSeenAt: string;
    listingLastSeenAt: string;
    transactionDate: string;
    sourceType: 'INTERNAL_OPERATION' | 'EXTERNAL_AGENCY' | 'PUBLIC_REGISTRY' | 'MANUAL_ENTRY';
    evidenceType: TransactionEvidenceType;
    evidenceUrl?: string | null;
    evidenceReference?: string | null;
    confidence?: TransactionConfidenceLevel;
    organizationId?: string | null;
    registeredByUserId?: string | null;
    notes?: string | null;
  }): PropertyTransaction {
    if (params.closingPrice <= 0 || params.askingPriceLast <= 0) {
      throw new Error('Los precios de oferta y cierre deben ser mayores a cero.');
    }

    // 1. Deduplicación determinística: Evitar duplicar la misma transacción real
    // Identificador unívoco: propertyMasterId + transactionDate + closingPrice
    const dedupKey = `${params.propertyMasterId}_${params.transactionDate}_${params.closingPrice}`;
    for (const existing of this.transactions.values()) {
      const exKey = `${existing.propertyMasterId}_${existing.transactionDate}_${existing.closingPrice}`;
      if (exKey === dedupKey) {
        // Actualizar provenance en vez de duplicar
        existing.updatedAt = new Date().toISOString();
        if (params.notes) existing.notes = `${existing.notes || ''} | Provenance: ${params.sourceId}`;
        return existing;
      }
    }

    // 2. Determinar nivel de confianza estricto
    let confidence: TransactionConfidenceLevel = params.confidence || 'MEDIUM';
    if (params.evidenceType === 'OFFICIAL_RECORD' || params.sourceType === 'INTERNAL_OPERATION') {
      confidence = 'VERIFIED';
    } else if (params.evidenceType === 'AGENCY_CONFIRMED' || params.evidenceType === 'MANUAL_VERIFIED') {
      confidence = 'HIGH';
    } else if (params.evidenceType === 'INFERRED') {
      confidence = 'UNVERIFIED';
    }

    // 3. Cálculos de métricas derivadas (Days on Market y Descuentos)
    const firstSeen = new Date(params.listingFirstSeenAt).getTime();
    const txDate = new Date(params.transactionDate).getTime();
    const daysOnMarket = Math.max(1, Math.round((txDate - firstSeen) / (1000 * 60 * 60 * 24)));

    const discountAbsolute = params.askingPriceLast - params.closingPrice;
    const discountPercentage = Number(((discountAbsolute / params.askingPriceLast) * 100).toFixed(2));
    const initialDiscountPercentage = Number(
      (((params.askingPriceInitial - params.closingPrice) / params.askingPriceInitial) * 100).toFixed(2)
    );

    // Score de calidad de la transacción (0 - 100)
    let qualityScore = 70;
    if (confidence === 'VERIFIED') qualityScore = 95;
    else if (confidence === 'HIGH') qualityScore = 85;
    else if (confidence === 'UNVERIFIED') qualityScore = 30;

    const id = `tx_${params.propertyMasterId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const tx: PropertyTransaction = {
      id,
      propertyMasterId: params.propertyMasterId,
      listingId: params.listingId || null,
      sourceId: params.sourceId,
      sourceName: params.sourceName || params.sourceId,
      transactionType: 'SALE',
      department: params.department,
      city: params.city || params.department,
      neighborhood: params.neighborhood,
      propertyType: params.propertyType.toUpperCase(),
      bedrooms: params.bedrooms || null,
      bathrooms: params.bathrooms || null,
      builtAreaM2: params.builtAreaM2 || null,
      totalAreaM2: params.totalAreaM2 || null,
      askingPriceInitial: params.askingPriceInitial,
      askingPriceLast: params.askingPriceLast,
      closingPrice: params.closingPrice,
      currency: params.currency || 'USD',
      discountAbsolute,
      discountPercentage,
      initialDiscountPercentage,
      listingFirstSeenAt: params.listingFirstSeenAt,
      listingLastSeenAt: params.listingLastSeenAt,
      transactionDate: params.transactionDate,
      daysOnMarket,
      sourceType: params.sourceType,
      evidenceType: params.evidenceType,
      evidenceUrl: params.evidenceUrl || null,
      evidenceReference: params.evidenceReference || null,
      confidence,
      verificationStatus: confidence === 'VERIFIED' || confidence === 'HIGH' ? 'VERIFIED' : 'PENDING_REVIEW',
      transactionQualityScore: qualityScore,
      organizationId: params.organizationId || null,
      registeredByUserId: params.registeredByUserId || null,
      notes: params.notes || null,
      createdAt: now,
      updatedAt: now,
    };

    // Auditoría
    const audit: TransactionAuditRecord = {
      id: `audit_${id}_${Date.now()}`,
      transactionId: id,
      action: 'CREATED',
      performedByUserId: params.registeredByUserId || 'system',
      role: 'SUPERADMIN_OR_ANALYST',
      newValues: { closingPrice: tx.closingPrice, discountPercentage: tx.discountPercentage },
      notes: params.notes || 'Registro inicial de transacción',
      timestamp: now,
    };
    tx.auditTrail = [audit];
    this.auditHistory.push(audit);

    this.transactions.set(id, tx);
    return tx;
  }

  /**
   * Obtiene transacciones con filtros de seguridad y verificación
   */
  public getTransactions(params?: {
    onlyVerified?: boolean;
    department?: string;
    neighborhood?: string;
    propertyType?: string;
    organizationId?: string | null;
  }): PropertyTransaction[] {
    let list = Array.from(this.transactions.values());

    if (params?.onlyVerified) {
      list = list.filter((t) => t.confidence === 'VERIFIED' || t.confidence === 'HIGH');
    }
    if (params?.department) {
      list = list.filter((t) => t.department.toLowerCase() === params.department!.toLowerCase());
    }
    if (params?.neighborhood) {
      list = list.filter((t) => t.neighborhood.toLowerCase() === params.neighborhood!.toLowerCase());
    }
    if (params?.propertyType) {
      list = list.filter((t) => t.propertyType.toLowerCase() === params.propertyType!.toLowerCase());
    }
    if (params?.organizationId) {
      // Filtrar sólo las de su tenant o las públicas/globales
      list = list.filter((t) => !t.organizationId || t.organizationId === params.organizationId);
    }

    return list.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  /**
   * Calcula estadísticas robustas segmentadas por Barrio y Tipología
   */
  public computeSegmentMetrics(_options?: { minN?: number }): SegmentTransactionMetrics[] {
    const verified = this.getTransactions({ onlyVerified: true });
    const currentSettings = AppraisalSettingsManager.getInstance().getSettings();
    const globalAdjPct = Number(((currentSettings.askingPriceAdjustment ?? 0.085) * 100).toFixed(2));

    const groups = new Map<string, PropertyTransaction[]>();
    for (const tx of verified) {
      const key = `${tx.department}|${tx.neighborhood}|${tx.propertyType}`;
      const arr = groups.get(key) || [];
      arr.push(tx);
      groups.set(key, arr);
    }

    const results: SegmentTransactionMetrics[] = [];

    for (const [key, txList] of groups.entries()) {
      const [dept, neigh, pType] = key.split('|');
      const N = txList.length;

      let readiness: SegmentCalibrationReadiness = 'INSUFFICIENT_DATA';
      if (N >= 100) readiness = 'CERTIFIABLE';
      else if (N >= 50) readiness = 'CALIBRATION_CANDIDATE';
      else if (N >= 20) readiness = 'OBSERVATIONAL';

      // Descuentos porcentuales ordenados
      const discounts = txList.map((t) => t.discountPercentage).sort((a, b) => a - b);
      const meanDiscount = Number((discounts.reduce((a, b) => a + b, 0) / N).toFixed(2));
      
      const mid = Math.floor(N / 2);
      const medianDiscount = N % 2 !== 0 ? discounts[mid] : Number(((discounts[mid - 1] + discounts[mid]) / 2).toFixed(2));

      const p25Index = Math.floor(N * 0.25);
      const p75Index = Math.floor(N * 0.75);
      const p25Discount = discounts[p25Index] || medianDiscount;
      const p75Discount = discounts[p75Index] || medianDiscount;
      const iqrDiscount = Number((p75Discount - p25Discount).toFixed(2));

      // MAD (Median Absolute Deviation)
      const absDeviations = discounts.map((d) => Math.abs(d - medianDiscount)).sort((a, b) => a - b);
      const madDiscount = absDeviations[Math.floor(absDeviations.length / 2)] || 0;

      // DOM mediano
      const doms = txList.map((t) => t.daysOnMarket).sort((a, b) => a - b);
      const medianDOM = doms[Math.floor(doms.length / 2)] || 45;

      // Precios medianos
      const prices = txList.map((t) => t.closingPrice).sort((a, b) => a - b);
      const medianPrice = prices[Math.floor(prices.length / 2)] || 0;

      const m2Prices = txList.filter((t) => t.builtAreaM2 && t.builtAreaM2 > 0).map((t) => t.closingPrice / t.builtAreaM2!).sort((a, b) => a - b);
      const medianM2 = m2Prices.length > 0 ? Math.round(m2Prices[Math.floor(m2Prices.length / 2)]) : 0;

      const spreadVsGlobal = Number((medianDiscount - globalAdjPct).toFixed(2));
      const reviewRecommended = N >= 50 && Math.abs(spreadVsGlobal) >= 1.5;

      results.push({
        segmentKey: key,
        department: dept,
        neighborhood: neigh,
        propertyType: pType,
        sampleSizeN: N,
        readiness,
        meanDiscountPct: meanDiscount,
        medianDiscountPct: medianDiscount,
        p25DiscountPct: p25Discount,
        p75DiscountPct: p75Discount,
        madDiscountPct: madDiscount,
        iqrDiscountPct: iqrDiscount,
        medianDaysOnMarket: medianDOM,
        medianClosingPriceUsd: medianPrice,
        medianPricePerM2Usd: medianM2,
        currentGlobalAdjustmentPct: globalAdjPct,
        spreadVsGlobalAdjustmentPct: spreadVsGlobal,
        calibrationReviewRecommended: reviewRecommended,
        timeWindow: 'ALL_TIME',
        lastUpdated: new Date().toISOString(),
      });
    }

    return results.sort((a, b) => b.sampleSizeN - a.sampleSizeN);
  }

  /**
   * Genera el Resumen Global para el Dashboard de Super Admin
   */
  public getDashboardSummary(): TransactionIntelligenceDashboardSummary {
    const all = Array.from(this.transactions.values());
    const verified = all.filter((t) => t.confidence === 'VERIFIED' || t.confidence === 'HIGH');
    const unverified = all.filter((t) => t.confidence !== 'VERIFIED' && t.confidence !== 'HIGH');

    const currentSettings = AppraisalSettingsManager.getInstance().getSettings();
    const globalAdjPct = Number(((currentSettings.askingPriceAdjustment ?? 0.085) * 100).toFixed(2));

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const closingsLast30Days = verified.filter((t) => new Date(t.transactionDate).getTime() >= thirtyDaysAgo).length;

    let avgDiscount = 0;
    let medianDiscount = globalAdjPct; // Baseline si N=0
    let medianDOM = 0;

    if (verified.length > 0) {
      avgDiscount = Number((verified.reduce((acc, t) => acc + t.discountPercentage, 0) / verified.length).toFixed(2));
      const sortedDiscounts = verified.map((t) => t.discountPercentage).sort((a, b) => a - b);
      medianDiscount = sortedDiscounts[Math.floor(sortedDiscounts.length / 2)];
      
      const sortedDOM = verified.map((t) => t.daysOnMarket).sort((a, b) => a - b);
      medianDOM = sortedDOM[Math.floor(sortedDOM.length / 2)];
    }

    const neighSet = new Set(verified.map((t) => t.neighborhood));
    const pTypeSet = new Set(verified.map((t) => t.propertyType));

    const confDist = {
      verified: all.filter((t) => t.confidence === 'VERIFIED').length,
      high: all.filter((t) => t.confidence === 'HIGH').length,
      medium: all.filter((t) => t.confidence === 'MEDIUM').length,
      low: all.filter((t) => t.confidence === 'LOW').length,
      unverified: all.filter((t) => t.confidence === 'UNVERIFIED').length,
    };

    const spread = Number((medianDiscount - globalAdjPct).toFixed(2));
    const segments = this.computeSegmentMetrics();

    return {
      kpis: {
        totalVerifiedTransactions: verified.length,
        totalUnverifiedTransactions: unverified.length,
        closingsLast30Days,
        averageDiscountPct: avgDiscount,
        medianDiscountPct: medianDiscount,
        medianDaysOnMarket: medianDOM,
        activeNeighborhoodsCount: neighSet.size,
        activePropertyTypesCount: pTypeSet.size,
        confidenceDistribution: confDist,
      },
      globalComparison: {
        currentGlobalAdjustment: globalAdjPct,
        observedMarketMedian: medianDiscount,
        spreadPercentage: spread,
        sampleSizeTotal: verified.length,
        calibrationReviewRecommended: verified.length >= 75 && Math.abs(spread) >= 1.5,
      },
      segmentMetrics: segments,
      recentTransactions: this.getTransactions().slice(0, 15),
    };
  }

  /**
   * Limpia transacciones de prueba (utilizado en testing)
   */
  public clearAll(): void {
    this.transactions.clear();
    this.auditHistory = [];
  }
}
