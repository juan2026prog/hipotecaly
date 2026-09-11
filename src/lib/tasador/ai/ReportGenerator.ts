// ==============================================================================
// HIPOTECALY TASADOR IA - GENERADOR DE REPORTE Y EXPLICABILIDAD IA (FASE 4)
// Explicación Profesional Estructurada sobre Resultados ya Calculados
// ==============================================================================

import { ValuationResultReport } from '../valuation/valuationTypes';
import {
  AIAppraisalReportSection,
  TextAnalysisResult,
  VisionImageAnalysisResult,
} from './aiTypes';

export class ReportGenerator {
  /**
   * Genera las secciones estructuradas del informe de tasación
   * REGLA ESTRICTA: La explicación recibe los números ya calculados y NO los modifica.
   */
  public static generateReportSections(
    valuation: ValuationResultReport,
    textAnalysis?: TextAnalysisResult | null,
    visionAnalyses?: VisionImageAnalysisResult[]
  ): AIAppraisalReportSection {
    const target = valuation.targetProperty;
    const valValueStr = `USD ${valuation.estimatedMarketValue.toLocaleString('es-UY')}`;
    const valLowStr = `USD ${valuation.estimatedRangeLow.toLocaleString('es-UY')}`;
    const valHighStr = `USD ${valuation.estimatedRangeHigh.toLocaleString('es-UY')}`;
    const valM2Str = `USD ${valuation.estimatedPricePerM2Usd.toLocaleString('es-UY')}/m²`;

    // 1. Resumen Ejecutivo
    const executiveSummary =
      `Valor de mercado estimado para el inmueble tipología ${target.propertyType} ubicado en ` +
      `${target.neighborhood || target.department}: ${valValueStr} (${valM2Str}). ` +
      `Rango estimado de mercado entre ${valLowStr} y ${valHighStr} con un índice de confianza ` +
      `del ${valuation.confidence.confidenceScore}% (${valuation.confidence.confidenceLevel}). ` +
      `La estimación se sustentó en el análisis de ${valuation.effectiveComparablesUsed} propiedades comparables ` +
      `normalizadas y deduplicadas de mercado.`;

    // 2. Contexto de Mercado
    const adjPctStr = valuation.askingPriceAdjustmentPercentage ? `${(valuation.askingPriceAdjustmentPercentage * 100).toFixed(2)}%` : '8.50%';
    const marketContextExplanation =
      `El análisis de comparables en el segmento ${target.propertyType} dentro del área de influencia ` +
      `(${valuation.geographicSearchLevel === 'IMMEDIATE' ? 'zona inmediata < 800m' : target.neighborhood || target.department}) ` +
      `indica un comportamiento de precios unitarios con mediana representativa en torno a los ${valM2Str}. ` +
      `Se aplicó el factor de ajuste de oferta asking_price_adjustment (${adjPctStr}) exactamente una vez sobre las publicaciones de portal ` +
      `para aproximar el valor a condiciones probables de cierre de mercado.`;

    // 3. Fortalezas de la Propiedad
    const propertyStrengths: string[] = [];
    if (target.builtAreaM2 >= 80) propertyStrengths.push(`Superficie edificada amplia (${target.builtAreaM2} m²)`);
    if (target.bedrooms && target.bedrooms >= 2) propertyStrengths.push(`Distribución funcional con ${target.bedrooms} dormitorios`);
    if (target.garages && target.garages >= 1) propertyStrengths.push(`Disponibilidad de ${target.garages} plaza(s) de garaje/cochera`);
    if (textAnalysis?.renovationStatus === 'RECICLADO_A_NUEVO') propertyStrengths.push('Inmueble con reciclaje reciente declarado');
    if (textAnalysis?.viewOrientation === 'VISTA_AL_MAR') propertyStrengths.push('Orientación y visual costera destacada');
    if (propertyStrengths.length === 0) propertyStrengths.push('Ubicación en zona con demanda residencial sostenida');

    // 4. Debilidades / Factores de Riesgo
    const propertyWeaknesses: string[] = [];
    if (!target.garages || target.garages === 0) propertyWeaknesses.push('Inmueble sin garaje propio especificado');
    if (textAnalysis?.renovationStatus === 'PARA_RECICLAR') propertyWeaknesses.push('Inmueble declarado para reciclar o refaccionar');
    if (valuation.geographicSearchLevel === 'DEPARTMENT' || valuation.geographicSearchLevel === 'LOCALITY') {
      propertyWeaknesses.push('Baja densidad de comparables idénticos en la manzana inmediata');
    }
    if (propertyWeaknesses.length === 0) propertyWeaknesses.push('Factores de depreciación estándar por antigüedad de construcción');

    // 5. Observaciones Visuales (Computer Vision en Shadow Mode)
    const visualObservationsSummary: string[] = [];
    if (visionAnalyses && visionAnalyses.length > 0) {
      for (const v of visionAnalyses) {
        visualObservationsSummary.push(
          `Ambiente ${v.detectedRoomType}: Estado aparente ${v.apparentCondition}, terminaciones ${v.apparentFinishQuality}, ` +
          `luz natural ${v.naturalLightApparent}. (${v.humiditySigns})`
        );
      }
    } else {
      visualObservationsSummary.push('Inspección visual basada en material fotográfico público disponible.');
    }

    // 6. Limitaciones de Datos
    const dataLimitations: string[] = [];
    dataLimitations.push('Datos basados en información pública de portales e inmobiliarias normalizados');
    if (valuation.outliersExcludedCount > 0) {
      dataLimitations.push(`Se aislaron ${valuation.outliersExcludedCount} publicaciones atípicas (outliers) por distorsión de precio/m²`);
    }
    if (valuation.confidence.warnings.length > 0) {
      dataLimitations.push(...valuation.confidence.warnings);
    }

    // 7. Descripción Metodológica
    const methodologyDescription =
      `Metodología híbrida determinística HIPOTECALY V1: Ensamble robusto que combina Mediana Ponderada (35%), ` +
      `Media Recortada al 10% (30%), Precio por m² Ponderado (25%) y Ajuste Directo de Coeficientes (10%). ` +
      `Filtrado estadístico de outliers mediante Rango Intercuartílico (IQR 1.5x). Ponderación por similitud ` +
      `multidimensional (ubicación, superficie, tipología, recencia y calidad de datos).`;

    // 8. Disclaimer Legal Obligatorio
    const legalDisclaimer =
      `AVISO LEGAL Y DE RIESGO: El presente informe constituye una estimación automatizada generada por el ` +
      `Tasador IA de HIPOTECALY para fines informativos y de análisis de mercado. No constituye una tasación pericial ` +
      `formal ni sustituye el dictamen de un perito tasador habilitado o la evaluación humana del comité de crédito. ` +
      `Las decisiones de otorgamiento crediticio y los porcentajes de financiación (LTV) son resueltos exclusivamente ` +
      `por las políticas de underwriting de la entidad financiera.`;

    return {
      executiveSummary,
      marketContextExplanation,
      propertyStrengths,
      propertyWeaknesses,
      visualObservationsSummary,
      dataLimitations,
      methodologyDescription,
      legalDisclaimer,
    };
  }
}
