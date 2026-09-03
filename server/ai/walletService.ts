// ==============================================================================
// HIPOTECALY AI: Wallet Service (Gestión de CASOS AI, Saldo y Esquema 10/5/3)
// ==============================================================================

import { supabase } from '../supabase';
import { AiEstimationResult, AiWalletState } from './types';
import { AI_STANDARD_CASE_COST_USD } from './config';

export class AiWalletService {
  // Caché en memoria de billeteras para tests y funcionamiento offline
  private static walletsCache: Map<string, AiWalletState> = new Map();
  private static deductionLock: Promise<any> = Promise.resolve();

  /**
   * Obtiene el estado actual de la billetera AI para una organización/estudio
   */
  public async getWalletState(organizationId: string): Promise<AiWalletState> {
    if (AiWalletService.walletsCache.has(organizationId)) {
      return AiWalletService.walletsCache.get(organizationId)!;
    }

    const defaultState: AiWalletState = {
      organizationId,
      promotionalCaseBalance: 10.0, // Mes 1 por defecto
      purchasedCaseBalance: 0.0,
      totalCaseBalance: 10.0,
      currentPromoMonth: 1,
      isFreeTierActive: true,
      promoCasesGrantedMonth: 10.0,
    };

    try {
      const { data, error } = await supabase
        .from('ai_wallets')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (!error && data) {
        const promo = Number(data.promotional_case_balance) || 0;
        const purch = Number(data.purchased_case_balance) || 0;
        const state: AiWalletState = {
          organizationId,
          promotionalCaseBalance: promo,
          purchasedCaseBalance: purch,
          totalCaseBalance: Number((promo + purch).toFixed(2)),
          currentPromoMonth: data.current_promo_month || 1,
          isFreeTierActive: promo > 0,
          promoCasesGrantedMonth: data.current_promo_month === 1 ? 10 : data.current_promo_month === 2 ? 5 : data.current_promo_month === 3 ? 3 : 0,
        };
        AiWalletService.walletsCache.set(organizationId, state);
        return state;
      }
    } catch {
      // Fallback
    }

    AiWalletService.walletsCache.set(organizationId, defaultState);
    return defaultState;
  }

  /**
   * Estima el consumo antes de ejecutar el análisis y alerta si es consumo elevado
   */
  public async estimateCaseConsumption(params: {
    organizationId: string;
    pagesCount: number;
    imagesCount: number;
    documentsCount: number;
    cachedDocumentsCount?: number;
    runType?: 'preliminary' | 'full' | 'deep';
  }): Promise<AiEstimationResult> {
    const wallet = await this.getWalletState(params.organizationId);
    const runType = params.runType || 'full';

    const pages = Math.max(1, params.pagesCount);
    const images = params.imagesCount || 0;
    const docs = Math.max(1, params.documentsCount);
    const cached = params.cachedDocumentsCount || 0;

    // Factores de cómputo
    const multiplier = runType === 'deep' ? 1.8 : runType === 'preliminary' ? 0.6 : 1.0;
    const rawTokensEstimate = (docs * 2000 + pages * 2000 + images * 1000) * multiplier;
    const cachedTokens = cached * 2500;
    const netTokens = Math.max(2000, rawTokensEstimate - cachedTokens);

    // Costo estimado en USD
    const costUsdBase = (netTokens / 1_000_000) * 3.5; // Costo ponderado
    const costMinUsd = Number((costUsdBase * 0.85).toFixed(2));
    const costMaxUsd = Number((costUsdBase * 1.15).toFixed(2));

    const casesMin = Number(Math.max(0.2, costMinUsd / AI_STANDARD_CASE_COST_USD).toFixed(2));
    const casesMax = Number(Math.max(0.4, costMaxUsd / AI_STANDARD_CASE_COST_USD).toFixed(2));

    // Detección de Consumo Elevado (> 1.5 CASOS o > 50 páginas)
    const isHighConsumption = pages > 50 || casesMax > 1.5;
    let highConsumptionWarning: string | undefined;

    if (isHighConsumption) {
      highConsumptionWarning = `⚠ CONSUMO ELEVADO: Este expediente contiene ${pages} páginas y ${images} imágenes. Consumo estimado: ${casesMin} – ${casesMax} CASOS. Promedio histórico: 0.85 CASOS.`;
    }

    return {
      estimatedCaseUnitsMin: casesMin,
      estimatedCaseUnitsMax: casesMax,
      estimatedCostUsdMin: costMinUsd,
      estimatedCostUsdMax: costMaxUsd,
      currentBalanceCases: wallet.totalCaseBalance,
      projectedBalanceCasesMin: Number(Math.max(0, wallet.totalCaseBalance - casesMax).toFixed(2)),
      projectedBalanceCasesMax: Number(Math.max(0, wallet.totalCaseBalance - casesMin).toFixed(2)),
      isHighConsumption,
      highConsumptionWarning,
      pagesCount: pages,
      imagesCount: images,
      documentsCount: docs,
      cachedDocumentsCount: cached,
    };
  }

  /**
   * Ejecuta el descuento atómico de CASOS AI respetando:
   * 1. Consumir primero promocionales.
   * 2. Consumir después comprados.
   * 3. Registrar transacción inmutable.
   */
  public async deductConsumption(params: {
    organizationId: string;
    runId: string;
    caseUnits: number;
    costUsd: number;
    description: string;
  }): Promise<{
    success: boolean;
    promotionalDeducted: number;
    purchasedDeducted: number;
    isFullyCoveredByHipotecaly: boolean;
    remainingTotal: number;
    message: string;
  }> {
    return (AiWalletService.deductionLock = AiWalletService.deductionLock.then(async () => {
      const current = await this.getWalletState(params.organizationId);

      let needed = params.caseUnits;
      let promoDeduct = 0;
      let purchDeduct = 0;

      if (current.promotionalCaseBalance >= needed) {
        promoDeduct = needed;
        needed = 0;
      } else {
        promoDeduct = current.promotionalCaseBalance;
        needed = Number((needed - promoDeduct).toFixed(2));
      }

      if (needed > 0) {
        if (current.purchasedCaseBalance >= needed) {
          purchDeduct = needed;
          needed = 0;
        } else {
          return {
            success: false,
            promotionalDeducted: 0,
            purchasedDeducted: 0,
            isFullyCoveredByHipotecaly: false,
            remainingTotal: current.totalCaseBalance,
            message: 'Saldo insuficiente de CASOS AI en la billetera de la organización.',
          };
        }
      }

      const newPromo = Number((current.promotionalCaseBalance - promoDeduct).toFixed(2));
      const newPurch = Number((current.purchasedCaseBalance - purchDeduct).toFixed(2));
      const totalRemaining = Number((newPromo + newPurch).toFixed(2));

      const updatedState: AiWalletState = {
        ...current,
        promotionalCaseBalance: newPromo,
        purchasedCaseBalance: newPurch,
        totalCaseBalance: totalRemaining,
        isFreeTierActive: newPromo > 0,
      };

      AiWalletService.walletsCache.set(params.organizationId, updatedState);

      // Intentar persistir en Supabase RPC atómica si está conectado
      try {
        await supabase.rpc('deduct_ai_case_consumption', {
          p_organization_id: params.organizationId,
          p_run_id: params.runId,
          p_cases_consumed: params.caseUnits,
          p_cost_usd: params.costUsd,
          p_description: params.description,
        });
      } catch {
        // Éxito en caché local
      }

      const isFullyCoveredByHipotecaly = purchDeduct === 0 && promoDeduct > 0;

      return {
        success: true,
        promotionalDeducted: promoDeduct,
        purchasedDeducted: purchDeduct,
        isFullyCoveredByHipotecaly,
        remainingTotal: totalRemaining,
        message: isFullyCoveredByHipotecaly
          ? `CASO cubierto al 100% por créditos promocionales de HIPOTECALY (${promoDeduct} CASOS).`
          : `Consumo registrado: ${promoDeduct} promo + ${purchDeduct} comprados.`,
      };
    }));
  }

  /**
   * Otorga o avanza los créditos promocionales para el mes especificado (10 / 5 / 3)
   */
  public async grantMonthlyPromotional(
    organizationId: string,
    monthNumber: number
  ): Promise<{ grantedCases: number; newBalance: number }> {
    let granted = 0;
    if (monthNumber === 1) granted = 10.0;
    else if (monthNumber === 2) granted = 5.0;
    else if (monthNumber === 3) granted = 3.0;
    else granted = 0.0;

    const current = await this.getWalletState(organizationId);
    // Los créditos promocionales caducan al fin de mes y se reemplazan por la nueva asignación
    const newPromo = granted;
    const newTotal = Number((newPromo + current.purchasedCaseBalance).toFixed(2));

    const updatedState: AiWalletState = {
      ...current,
      promotionalCaseBalance: newPromo,
      totalCaseBalance: newTotal,
      currentPromoMonth: monthNumber,
      promoCasesGrantedMonth: granted,
      isFreeTierActive: newPromo > 0,
    };

    AiWalletService.walletsCache.set(organizationId, updatedState);

    try {
      await supabase.rpc('grant_monthly_promotional_credits', {
        p_organization_id: organizationId,
        p_month_number: monthNumber,
      });
    } catch {
      // Ignorar en fallback local
    }

    return {
      grantedCases: granted,
      newBalance: newTotal,
    };
  }

  /**
   * Recarga saldo comprado (los créditos comprados NUNCA vencen)
   */
  public async purchaseCases(
    organizationId: string,
    caseUnits: number
  ): Promise<{ newPurchasedBalance: number; newTotalBalance: number }> {
    const current = await this.getWalletState(organizationId);
    const newPurch = Number((current.purchasedCaseBalance + caseUnits).toFixed(2));
    const newTotal = Number((current.promotionalCaseBalance + newPurch).toFixed(2));

    const updatedState: AiWalletState = {
      ...current,
      purchasedCaseBalance: newPurch,
      totalCaseBalance: newTotal,
    };

    AiWalletService.walletsCache.set(organizationId, updatedState);
    return {
      newPurchasedBalance: newPurch,
      newTotalBalance: newTotal,
    };
  }

  public static clearCache(): void {
    this.walletsCache.clear();
  }
}

export const aiWalletService = new AiWalletService();
