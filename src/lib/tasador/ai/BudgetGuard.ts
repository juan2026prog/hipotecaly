// ==============================================================================
// HIPOTECALY TASADOR IA - GUARDIA DE PRESUPUESTO Y LÍMITES DE IA (FASE 4)
// Control de Gasto Máximo por Tasación y Protección contra Bucles
// ==============================================================================

export interface BudgetConfig {
  maxCostPerValuationUsd: number; // e.g. 0.05 USD
  maxImagesPerValuation: number;  // e.g. 6 imágenes
  maxDescriptionChars: number;    // e.g. 4000 caracteres
  maxRetries: number;             // e.g. 1
  aiEnabled: boolean;
  visionEnabled: boolean;
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  maxCostPerValuationUsd: 0.05,
  maxImagesPerValuation: 6,
  maxDescriptionChars: 4000,
  maxRetries: 1,
  aiEnabled: true,
  visionEnabled: true,
};

export class BudgetGuard {
  private static instance: BudgetGuard;
  private config: BudgetConfig = { ...DEFAULT_BUDGET_CONFIG };

  private constructor() {}

  public static getInstance(): BudgetGuard {
    if (!BudgetGuard.instance) {
      BudgetGuard.instance = new BudgetGuard();
    }
    return BudgetGuard.instance;
  }

  public getConfig(): BudgetConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<BudgetConfig>): BudgetConfig {
    this.config = { ...this.config, ...partial };
    return this.getConfig();
  }

  public canProceed(currentCostUsd: number, imagesRequested?: number): {
    allowed: boolean;
    reason?: string;
  } {
    if (!this.config.aiEnabled) {
      return { allowed: false, reason: 'AI_DISABLED_BY_ADMIN' };
    }

    if (currentCostUsd >= this.config.maxCostPerValuationUsd) {
      return {
        allowed: false,
        reason: `BUDGET_EXCEEDED: Costo acumulado ($${currentCostUsd}) supera el límite por tasación ($${this.config.maxCostPerValuationUsd})`,
      };
    }

    if (imagesRequested && imagesRequested > this.config.maxImagesPerValuation) {
      return {
        allowed: false,
        reason: `IMAGE_LIMIT_EXCEEDED: Cantidad de imágenes (${imagesRequested}) supera el límite permitido (${this.config.maxImagesPerValuation})`,
      };
    }

    return { allowed: true };
  }
}
