// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR DE BACKTESTING Y EVALUACIÓN DE PRECISIÓN (FASE 3)
// Validación Cruzada contra Transacciones Reales Verificadas y Reporte de Ground Truth
// ==============================================================================

import { ValuationService } from './ValuationService';
import { NormalizedListing } from '../types/tasadorPipelineTypes';

export interface VerifiedTransactionRecord {
  id: string;
  propertyMasterId: string;
  transactionDate: string;
  transactionPriceUsd: number;
  department: string;
  neighborhood?: string | null;
  propertyType: any;
  builtAreaM2: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  garages?: number | null;
  constructionYear?: number | null;
}

export interface BacktestMetrics {
  status: 'CERTIFIED_EVALUATION' | 'GROUND_TRUTH_INSUFFICIENT';
  totalTransactionsEvaluated: number;
  meanAbsoluteErrorUsd: number;
  meanAbsolutePercentageError: number;  // MAPE
  medianAbsolutePercentageError: number;// MdAPE
  biasUsd: number;                      // Sesgo medio
  overvaluationRatePct: number;
  undervaluationRatePct: number;
  within5PctRate: number;
  within10PctRate: number;
  within20PctRate: number;
  observations: string;
}

export class ValuationBacktestEngine {
  /**
   * Ejecuta el análisis de backtesting sobre transacciones reales de mercado
   */
  public static async runBacktest(
    verifiedTransactions: VerifiedTransactionRecord[],
    historicalListings: NormalizedListing[]
  ): Promise<BacktestMetrics> {
    if (!verifiedTransactions || verifiedTransactions.length < 5) {
      return {
        status: 'GROUND_TRUTH_INSUFFICIENT',
        totalTransactionsEvaluated: verifiedTransactions?.length || 0,
        meanAbsoluteErrorUsd: 0,
        meanAbsolutePercentageError: 0,
        medianAbsolutePercentageError: 0,
        biasUsd: 0,
        overvaluationRatePct: 0,
        undervaluationRatePct: 0,
        within5PctRate: 0,
        within10PctRate: 0,
        within20PctRate: 0,
        observations:
          'GROUND_TRUTH_INSUFFICIENT: No se cuenta con una masa crítica suficiente de transacciones reales cerradas ' +
          'en el registro oficial para certificar métricas de precisión empírica. El sistema opera con consistencia de comparables.',
      };
    }

    const valuationService = ValuationService.getInstance();
    const errorsUsd: number[] = [];
    const errorsPct: number[] = [];
    let overvaluedCount = 0;
    let undervaluedCount = 0;
    let within5 = 0;
    let within10 = 0;
    let within20 = 0;

    for (const tx of verifiedTransactions) {
      // Filtrar listings que hayan sido observados antes de la transacción
      const txDate = new Date(tx.transactionDate).getTime();
      const eligibleListings = historicalListings.filter((l) => {
        if (!l.publicationDate) return true;
        return new Date(l.publicationDate).getTime() <= txDate;
      });

      const valuation = await valuationService.appraiseProperty(
        {
          propertyMasterId: tx.propertyMasterId,
          propertyType: tx.propertyType,
          department: tx.department,
          neighborhood: tx.neighborhood,
          builtAreaM2: tx.builtAreaM2,
          bedrooms: tx.bedrooms,
          bathrooms: tx.bathrooms,
          garages: tx.garages,
          constructionYear: tx.constructionYear,
        },
        eligibleListings
      );

      const diff = valuation.estimatedMarketValue - tx.transactionPriceUsd;
      const absDiff = Math.abs(diff);
      const absPct = (absDiff / tx.transactionPriceUsd) * 100;

      errorsUsd.push(diff);
      errorsPct.push(absPct);

      if (diff > 0) overvaluedCount++;
      else if (diff < 0) undervaluedCount++;

      if (absPct <= 5.0) within5++;
      if (absPct <= 10.0) within10++;
      if (absPct <= 20.0) within20++;
    }

    const n = verifiedTransactions.length;
    const maeUsd = errorsUsd.reduce((acc, e) => acc + Math.abs(e), 0) / n;
    const mape = errorsPct.reduce((acc, e) => acc + e, 0) / n;
    const sortedPct = [...errorsPct].sort((a, b) => a - b);
    const mdape = sortedPct[Math.floor(n / 2)];
    const bias = errorsUsd.reduce((acc, e) => acc + e, 0) / n;

    return {
      status: 'CERTIFIED_EVALUATION',
      totalTransactionsEvaluated: n,
      meanAbsoluteErrorUsd: Math.round(maeUsd),
      meanAbsolutePercentageError: Number(mape.toFixed(2)),
      medianAbsolutePercentageError: Number(mdape.toFixed(2)),
      biasUsd: Math.round(bias),
      overvaluationRatePct: Number(((overvaluedCount / n) * 100).toFixed(1)),
      undervaluationRatePct: Number(((undervaluedCount / n) * 100).toFixed(1)),
      within5PctRate: Number(((within5 / n) * 100).toFixed(1)),
      within10PctRate: Number(((within10 / n) * 100).toFixed(1)),
      within20PctRate: Number(((within20 / n) * 100).toFixed(1)),
      observations: `Evaluación completada sobre ${n} transacciones reales de mercado.`,
    };
  }
}
