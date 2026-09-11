// ==============================================================================
// HIPOTECALY TASADOR IA - VALIDADOR DE SALIDAS ESTRUCTURADAS DE IA (FASE 4)
// Validación Estricta con Zod: Rechazo de JSON Inválido o Alucinaciones
// ==============================================================================

import { z } from 'zod';

export const VisionAnalysisSchema = z.object({
  detectedRoomType: z.enum([
    'FACADE',
    'LIVING',
    'KITCHEN',
    'BATHROOM',
    'BEDROOM',
    'BALCONY_TERRACE',
    'GARDEN_PATIO',
    'OTHER',
  ]),
  apparentCondition: z.enum([
    'EXCELLENT',
    'VERY_GOOD',
    'GOOD',
    'FAIR',
    'POOR',
    'NOT_DETERMINABLE',
  ]),
  apparentFinishQuality: z.enum([
    'LUXURY',
    'HIGH',
    'STANDARD',
    'BASIC',
    'NOT_DETERMINABLE',
  ]),
  naturalLightApparent: z.enum(['ABUNDANT', 'MODERATE', 'LOW', 'NOT_DETERMINABLE']),
  humiditySigns: z.enum([
    'NO_VISIBLE_SIGNS',
    'APPARENT_SUPERFICIAL',
    'POSSIBLE_WATER_STAIN',
    'NOT_DETERMINABLE',
  ]),
  visibleHighlights: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});

export const TextAnalysisSchema = z.object({
  renovationStatus: z.enum([
    'RECICLADO_A_NUEVO',
    'BUEN_ESTADO',
    'PARA_RECICLAR',
    'A_ESTRENAR',
    'EN_CONSTRUCCION',
    'NO_ESPECIFICADO',
  ]),
  constructionType: z.enum([
    'TRADICIONAL',
    'STEEL_FRAMING',
    'ISOPANEL',
    'NO_ESPECIFICADO',
  ]),
  viewOrientation: z.string().nullable().optional(),
  specialAmenitiesExtracted: z.array(z.string()),
  occupancyStatus: z.enum(['LIBRE', 'CON_RENTA', 'OCUPADA', 'NO_ESPECIFICADO']),
  confidence: z.number().min(0).max(100),
  extractedFeatures: z.array(
    z.object({
      featureName: z.string(),
      featureValue: z.string(),
      category: z.enum([
        'CONDITION',
        'FINISHES',
        'ENVIRONMENT',
        'STRUCTURE_APPARENT',
        'AMENITY',
      ]),
      confidence: z.number().min(0).max(100),
      evidenceSource: z.enum(['VISION_IMAGE', 'TEXT_DESCRIPTION', 'STRUCTURED_DATA']),
      evidenceSnippet: z.string().nullable().optional(),
      weightInValuation: z.number().default(0.0),
      observationalNotes: z.string(),
    })
  ),
});

export const AppraisalReportSectionsSchema = z.object({
  executiveSummary: z.string().min(10),
  marketContextExplanation: z.string().min(10),
  propertyStrengths: z.array(z.string()),
  propertyWeaknesses: z.array(z.string()),
  visualObservationsSummary: z.array(z.string()),
  dataLimitations: z.array(z.string()),
  methodologyDescription: z.string().min(10),
  legalDisclaimer: z.string().min(10),
});

export class AIOutputValidator {
  public static validateVision(data: unknown) {
    return VisionAnalysisSchema.safeParse(data);
  }

  public static validateTextAnalysis(data: unknown) {
    return TextAnalysisSchema.safeParse(data);
  }

  public static validateReportSections(data: unknown) {
    return AppraisalReportSectionsSchema.safeParse(data);
  }
}
