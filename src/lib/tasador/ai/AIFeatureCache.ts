// ==============================================================================
// HIPOTECALY TASADOR IA - MEMORIA CACHÉ DE CARACTERÍSTICAS IA (FASE 4)
// Deduplicación por Hash SHA-256 para Reducción de Tokens y Latencia
// ==============================================================================

import { VisionImageAnalysisResult, TextAnalysisResult } from './aiTypes';

export class AIFeatureCache {
  private static instance: AIFeatureCache;

  private visionCache: Map<string, VisionImageAnalysisResult> = new Map();
  private textCache: Map<string, TextAnalysisResult> = new Map();
  private hitsCount = 0;
  private missesCount = 0;

  private constructor() {}

  public static getInstance(): AIFeatureCache {
    if (!AIFeatureCache.instance) {
      AIFeatureCache.instance = new AIFeatureCache();
    }
    return AIFeatureCache.instance;
  }

  public getVisionAnalysis(
    sha256Hash: string,
    promptVersion: string,
    modelVersion: string
  ): VisionImageAnalysisResult | null {
    const key = `vis_${sha256Hash}_${promptVersion}_${modelVersion}`;
    const item = this.visionCache.get(key);
    if (item) {
      this.hitsCount++;
      return { ...item, isCached: true };
    }
    this.missesCount++;
    return null;
  }

  public setVisionAnalysis(
    sha256Hash: string,
    promptVersion: string,
    modelVersion: string,
    result: VisionImageAnalysisResult
  ): void {
    const key = `vis_${sha256Hash}_${promptVersion}_${modelVersion}`;
    this.visionCache.set(key, { ...result, isCached: false });
  }

  public getTextAnalysis(
    contentHash: string,
    promptVersion: string
  ): TextAnalysisResult | null {
    const key = `txt_${contentHash}_${promptVersion}`;
    const item = this.textCache.get(key);
    if (item) {
      this.hitsCount++;
      return item;
    }
    this.missesCount++;
    return null;
  }

  public setTextAnalysis(
    contentHash: string,
    promptVersion: string,
    result: TextAnalysisResult
  ): void {
    const key = `txt_${contentHash}_${promptVersion}`;
    this.textCache.set(key, result);
  }

  public getStats(): { hits: number; misses: number; hitRatio: number; cacheSize: number } {
    const total = this.hitsCount + this.missesCount;
    const hitRatio = total > 0 ? Number((this.hitsCount / total).toFixed(4)) : 0;
    return {
      hits: this.hitsCount,
      misses: this.missesCount,
      hitRatio,
      cacheSize: this.visionCache.size + this.textCache.size,
    };
  }

  public clear(): void {
    this.visionCache.clear();
    this.textCache.clear();
    this.hitsCount = 0;
    this.missesCount = 0;
  }
}
