// ==============================================================================
// HIPOTECALY TASADOR IA - ANALIZADOR DE TEXTO Y DESCRIPCIONES (FASE 4)
// Guardrails Anti Prompt-Injection, Sanitización PII y Extracción Estructurada
// ==============================================================================

import { TextAnalysisResult, QualitativeFeature } from './aiTypes';
import { PIISanitizer } from './PIISanitizer';
import { AIFeatureCache } from './AIFeatureCache';
import { cleanText } from '../normalization/UruguayLocationDictionary';
import { computeSha256Hash } from '../adapters/SourceAdapter';

export class PropertyTextAnalyzer {
  private static readonly PROMPT_VERSION = 'TXT_V1_2026';

  /**
   * Analiza la descripción textual del listing de forma segura
   */
  public static async analyze(
    rawDescription?: string | null,
    rawTitle?: string | null
  ): Promise<TextAnalysisResult> {
    const combined = `${rawTitle || ''} ${rawDescription || ''}`.trim();
    if (!combined) {
      return {
        renovationStatus: 'NO_ESPECIFICADO',
        constructionType: 'NO_ESPECIFICADO',
        viewOrientation: null,
        specialAmenitiesExtracted: [],
        occupancyStatus: 'NO_ESPECIFICADO',
        confidence: 0,
        extractedFeatures: [],
      };
    }

    // 1. Sanitización de PII
    const { sanitizedText } = PIISanitizer.sanitize(combined);
    const contentHash = computeSha256Hash(sanitizedText);

    // 2. Comprobar Caché
    const cache = AIFeatureCache.getInstance();
    const cached = cache.getTextAnalysis(contentHash, PropertyTextAnalyzer.PROMPT_VERSION);
    if (cached) {
      return cached;
    }

    // 3. Extracción Heurística Determinística Segura con Guardrails
    // (Trata el texto como datos no ejecutables)
    const clean = cleanText(sanitizedText);
    const extractedFeatures: QualitativeFeature[] = [];
    const specialAmenities: string[] = [];

    // Estado de reciclaje
    let renovationStatus: TextAnalysisResult['renovationStatus'] = 'NO_ESPECIFICADO';
    if (
      clean.includes('reciclado a nuevo') ||
      clean.includes('totalmente reciclado') ||
      clean.includes('impecable estado') ||
      clean.includes('reciclada a nuevo')
    ) {
      renovationStatus = 'RECICLADO_A_NUEVO';
      extractedFeatures.push({
        featureName: 'renovation_status',
        featureValue: 'RECICLADO_A_NUEVO',
        category: 'CONDITION',
        confidence: 95,
        evidenceSource: 'TEXT_DESCRIPTION',
        evidenceSnippet: 'Mención explícita de reciclaje a nuevo en texto',
        weightInValuation: 0.0, // SHADOW MODE
        observationalNotes: 'Inmueble declarado reciclado integralmente',
      });
    } else if (
      clean.includes('para reciclar') ||
      clean.includes('a reciclar') ||
      clean.includes('requiere reparaciones') ||
      clean.includes('a refaccionar')
    ) {
      renovationStatus = 'PARA_RECICLAR';
      extractedFeatures.push({
        featureName: 'renovation_status',
        featureValue: 'PARA_RECICLAR',
        category: 'CONDITION',
        confidence: 90,
        evidenceSource: 'TEXT_DESCRIPTION',
        evidenceSnippet: 'Mención de necesidad de refacción/reciclaje',
        weightInValuation: 0.0, // SHADOW MODE
        observationalNotes: 'Inmueble requiere intervención de reciclaje',
      });
    } else if (clean.includes('a estrenar') || clean.includes('estrena')) {
      renovationStatus = 'A_ESTRENAR';
    } else if (clean.includes('buen estado') || clean.includes('excelente estado')) {
      renovationStatus = 'BUEN_ESTADO';
    }

    // Tipo de construcción
    let constructionType: TextAnalysisResult['constructionType'] = 'NO_ESPECIFICADO';
    if (
      clean.includes('construccion tradicional') ||
      clean.includes('doble pared de ladrillo') ||
      clean.includes('ladrillo a la vista')
    ) {
      constructionType = 'TRADICIONAL';
      extractedFeatures.push({
        featureName: 'construction_type',
        featureValue: 'TRADICIONAL',
        category: 'STRUCTURE_APPARENT',
        confidence: 90,
        evidenceSource: 'TEXT_DESCRIPTION',
        evidenceSnippet: 'Construcción tradicional declarada',
        weightInValuation: 0.0,
        observationalNotes: 'Estructura declarada de mampostería tradicional',
      });
    } else if (clean.includes('steel framing') || clean.includes('steel frame')) {
      constructionType = 'STEEL_FRAMING';
    } else if (clean.includes('isopanel')) {
      constructionType = 'ISOPANEL';
    }

    // Vistas y orientación
    let viewOrientation: string | null = null;
    if (
      clean.includes('vista al mar') ||
      clean.includes('primera linea') ||
      clean.includes('frente al mar') ||
      clean.includes('rambla')
    ) {
      viewOrientation = 'VISTA_AL_MAR';
      extractedFeatures.push({
        featureName: 'view_quality',
        featureValue: 'VISTA_AL_MAR',
        category: 'ENVIRONMENT',
        confidence: 85,
        evidenceSource: 'TEXT_DESCRIPTION',
        evidenceSnippet: 'Mención de vista panorámica al mar o rambla',
        weightInValuation: 0.0,
        observationalNotes: 'Atractivo visual costero destacado en publicación',
      });
    } else if (clean.includes('vista despejada')) {
      viewOrientation = 'VISTA_DESPEJADA';
    } else if (clean.includes('orientacion norte')) {
      viewOrientation = 'ORIENTACION_NORTE';
    }

    // Estado ocupacional
    let occupancyStatus: TextAnalysisResult['occupancyStatus'] = 'NO_ESPECIFICADO';
    if (clean.includes('con renta') || clean.includes('alquilado')) {
      occupancyStatus = 'CON_RENTA';
    } else if (clean.includes('vacia') || clean.includes('libre') || clean.includes('desocupada')) {
      occupancyStatus = 'LIBRE';
    }

    // Amenities adicionales
    if (clean.includes('parrillero propio') || clean.includes('barbacoa propia')) {
      specialAmenities.push('PARRILLERO_PROPIO');
    }
    if (clean.includes('calefaccion central') || clean.includes('losa radiante')) {
      specialAmenities.push('LOSA_RADIANTE');
    }

    const result: TextAnalysisResult = {
      renovationStatus,
      constructionType,
      viewOrientation,
      specialAmenitiesExtracted: specialAmenities,
      occupancyStatus,
      confidence: 85,
      extractedFeatures,
    };

    // Guardar en caché
    cache.setTextAnalysis(contentHash, PropertyTextAnalyzer.PROMPT_VERSION, result);

    return result;
  }
}
