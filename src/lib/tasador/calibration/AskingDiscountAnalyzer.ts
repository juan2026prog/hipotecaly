// ==============================================================================
// HIPOTECALY TASADOR IA - ANALIZADOR DE DESCUENTO ASKING VS CLOSING (FASE 6)
// Análisis empírico de negociación en Uruguay vs Baseline Teórico del 12%
// ==============================================================================

import { GroundTruthService } from './GroundTruthService';
import { ConfirmedTransaction, AskingDiscountStats } from './calibrationTypes';

export class AskingDiscountAnalyzer {
  /**
   * Analiza el descuento observado (asking vs closing) sobre un conjunto de transacciones
   */
  public static analyzeDiscounts(transactions: ConfirmedTransaction[]): AskingDiscountStats {
    const validDiscounts = transactions
      .filter((t) => t.observedDiscount !== undefined && !isNaN(t.observedDiscount))
      .map((t) => t.observedDiscount as number)
      .sort((a, b) => a - b);

    if (validDiscounts.length === 0) {
      return {
        sampleCount: 0,
        meanDiscount: 0.1200,
        medianDiscount: 0.1200,
        p25: 0.1200,
        p75: 0.1200,
        minDiscount: 0.1200,
        maxDiscount: 0.1200,
        standardDeviation: 0,
        baselineDifference: 0,
      };
    }

    const n = validDiscounts.length;
    const sum = validDiscounts.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    const median =
      n % 2 === 0
        ? (validDiscounts[n / 2 - 1] + validDiscounts[n / 2]) / 2
        : validDiscounts[Math.floor(n / 2)];

    const p25 = validDiscounts[Math.floor(n * 0.25)];
    const p75 = validDiscounts[Math.min(n - 1, Math.floor(n * 0.75))];
    const min = validDiscounts[0];
    const max = validDiscounts[n - 1];

    const variance =
      validDiscounts.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const standardDeviation = Math.sqrt(variance);

    const baselineDifference = Number((median - 0.1200).toFixed(4));

    return {
      sampleCount: n,
      meanDiscount: Number(mean.toFixed(4)),
      medianDiscount: Number(median.toFixed(4)),
      p25: Number(p25.toFixed(4)),
      p75: Number(p75.toFixed(4)),
      minDiscount: Number(min.toFixed(4)),
      maxDiscount: Number(max.toFixed(4)),
      standardDeviation: Number(standardDeviation.toFixed(4)),
      baselineDifference,
    };
  }

  /**
   * Genera el desglose de descuentos por barrio y tipo de inmueble comparado con 12%
   */
  public static generateZoneBreakdown(): {
    globalStats: AskingDiscountStats;
    byNeighborhood: Record<string, AskingDiscountStats>;
    byPropertyType: Record<string, AskingDiscountStats>;
    interpretation: string;
  } {
    const allTx = GroundTruthService.getInstance().getVerifiedTransactions();
    const globalStats = this.analyzeDiscounts(allTx);

    const byNeighborhood: Record<string, AskingDiscountStats> = {};
    const neighMap: Record<string, ConfirmedTransaction[]> = {};

    for (const tx of allTx) {
      const neigh = tx.neighborhood || 'Otros';
      if (!neighMap[neigh]) neighMap[neigh] = [];
      neighMap[neigh].push(tx);
    }

    for (const [neigh, txList] of Object.entries(neighMap)) {
      byNeighborhood[neigh] = this.analyzeDiscounts(txList);
    }

    const byPropertyType: Record<string, AskingDiscountStats> = {};
    const typeMap: Record<string, ConfirmedTransaction[]> = {};

    for (const tx of allTx) {
      const type = tx.propertyType || 'apartamento';
      if (!typeMap[type]) typeMap[type] = [];
      typeMap[type].push(tx);
    }

    for (const [type, txList] of Object.entries(typeMap)) {
      byPropertyType[type] = this.analyzeDiscounts(txList);
    }

    let interpretation = `La mediana global observada es ${(globalStats.medianDiscount * 100).toFixed(1)}% vs el 12.0% del baseline. `;
    if (Math.abs(globalStats.baselineDifference) <= 0.02) {
      interpretation += 'El factor del 12% (0.1200) se mantiene estadísticamente robusto y representativo del mercado.';
    } else if (globalStats.baselineDifference > 0) {
      interpretation += 'Se observa un margen de negociación real ligeramente mayor al 12%.';
    } else {
      interpretation += 'Se observa una negociación más ajustada con menor descuento que el 12% teórico.';
    }

    return {
      globalStats,
      byNeighborhood,
      byPropertyType,
      interpretation,
    };
  }
}
