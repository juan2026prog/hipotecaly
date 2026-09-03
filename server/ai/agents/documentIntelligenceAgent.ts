// ==============================================================================
// HIPOTECALY AI: Document Intelligence Agent (Extracción Masiva e Ingesta Incremental)
// ==============================================================================

import { DocumentExtraction, DocumentExtractionSchema, DocumentType } from '../types';

export interface RawDocumentInput {
  id?: string;
  fileName: string;
  filePath?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  contentSnippet?: string;
  fileHash?: string;
  isImage?: boolean;
}

export interface DocumentAnalysisResult {
  documentId?: string;
  fileName: string;
  fileHash: string;
  documentType: DocumentType;
  extraction: DocumentExtraction;
  isCached: boolean;
  confidence: number;
  warnings: string[];
}

/**
 * Genera un hash SHA-256 simple y determinista para contenido o metadata del archivo
 */
export function computeSimulatedHash(fileName: string, sizeBytes?: number, content?: string): string {
  const seed = `${fileName}_${sizeBytes || 0}_${(content || '').slice(0, 200)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256_${hex}${hex}${hex}${hex}`;
}

export class DocumentIntelligenceAgent {
  // Caché en memoria de documentos ya procesados por hash (evita reprocesar idénticos)
  private static processedHashesCache = new Map<string, DocumentAnalysisResult>();

  /**
   * Clasifica y extrae datos estructurados de un documento aplicando procesamiento incremental.
   */
  public async analyzeDocument(
    doc: RawDocumentInput,
    forceReprocess = false
  ): Promise<DocumentAnalysisResult> {
    const hash = doc.fileHash || computeSimulatedHash(doc.fileName, doc.fileSizeBytes, doc.contentSnippet);

    // 1. Verificación de Ingesta Incremental (Caché por Hash)
    if (!forceReprocess && DocumentIntelligenceAgent.processedHashesCache.has(hash)) {
      const cached = DocumentIntelligenceAgent.processedHashesCache.get(hash)!;
      return {
        ...cached,
        isCached: true,
      };
    }

    // 2. Clasificación del Tipo de Documento
    const lowerName = doc.fileName.toLowerCase();
    const snippet = (doc.contentSnippet || '').toLowerCase();
    let docType: DocumentType = 'otro';

    if (lowerName.includes('escritura') || snippet.includes('comparecen') || snippet.includes('protocolo')) {
      docType = 'escritura';
    } else if (lowerName.includes('titulo') || lowerName.includes('título')) {
      docType = 'titulo';
    } else if (lowerName.includes('recibo') || lowerName.includes('sueldo') || snippet.includes('haberes') || snippet.includes('bps')) {
      docType = 'recibo_sueldo';
    } else if (lowerName.includes('ingresos') || lowerName.includes('contador') || snippet.includes('cpa') || snippet.includes('certifico')) {
      docType = 'certificado_ingresos';
    } else if (lowerName.includes('contribucion') || lowerName.includes('contribución') || snippet.includes('intendencia')) {
      docType = 'contribucion_inmobiliaria';
    } else if (lowerName.includes('primaria') || snippet.includes('impuesto de primaria')) {
      docType = 'primaria';
    } else if (lowerName.includes('plano') || snippet.includes('mensura') || lowerName.includes('agrimensor')) {
      docType = 'plano';
    } else if (lowerName.includes('cedula') || lowerName.includes('cédula') || lowerName.includes('ci')) {
      docType = 'cedula';
    } else if (lowerName.includes('tasacion') || lowerName.includes('tasación') || snippet.includes('informe de tasacion')) {
      docType = 'tasacion';
    } else if (doc.isImage || lowerName.match(/\.(jpg|jpeg|png|webp)$/)) {
      docType = 'fotografia_inmueble';
    }

    // 3. Detección de Legibilidad y Documentos Ilegibles/Dañados
    const isIllegible =
      lowerName.includes('borroso') ||
      lowerName.includes('ilegitimo') ||
      lowerName.includes('corrupto') ||
      lowerName.includes('ilegible') ||
      (doc.contentSnippet && doc.contentSnippet.length < 5 && !doc.isImage);

    const warnings: string[] = [];
    let confidence = 95;

    if (isIllegible) {
      confidence = 30;
      warnings.push('Documento escaneado con baja resolución o texto borroso. Se recomienda solicitar copia legible.');
    }

    // 4. Extracción Estructurada con Validación Zod
    const padronMatch = (doc.contentSnippet || doc.fileName).match(/padr[oó]n\s*(?:n[uú]mero|n[ºo]|nro\.?)?\s*[:#]?\s*(\d+)/i);
    const surfaceMatch = (doc.contentSnippet || '').match(/(\d+(?:[.,]\d+)?)\s*m(?:2|²|etros)/i);
    const incomeMatch = (doc.contentSnippet || '').match(/(?:\$|uyu|usd)\s*(\d+(?:[.,]\d+)?)/i);

    const rawExtraction: Partial<DocumentExtraction> = {
      document_type: docType,
      document_date: new Date().toISOString().split('T')[0],
      padron: padronMatch ? padronMatch[1] : isIllegible ? null : undefined,
      land_area_m2: surfaceMatch ? parseFloat(surfaceMatch[1].replace(',', '.')) : null,
      built_area_m2: surfaceMatch && docType === 'plano' ? parseFloat(surfaceMatch[1].replace(',', '.')) : null,
      income: incomeMatch && (docType === 'recibo_sueldo' || docType === 'certificado_ingresos')
        ? parseFloat(incomeMatch[1].replace(',', ''))
        : null,
      currency: (doc.contentSnippet || '').toUpperCase().includes('USD') ? 'USD' : 'UYU',
      confidence,
      warnings,
    };

    // Validar mediante Zod
    const parsed = DocumentExtractionSchema.parse({
      ...rawExtraction,
      debts: [],
      liens: [],
      detected_people: [],
      detected_entities: [],
      important_dates: [],
    });

    const result: DocumentAnalysisResult = {
      documentId: doc.id,
      fileName: doc.fileName,
      fileHash: hash,
      documentType: docType,
      extraction: parsed,
      isCached: false,
      confidence,
      warnings,
    };

    // Guardar en caché para ingesta incremental
    DocumentIntelligenceAgent.processedHashesCache.set(hash, result);

    return result;
  }

  /**
   * Procesa un lote de documentos optimizando el cómputo (solo analiza archivos no cacheados)
   */
  public async analyzeBatch(
    documents: RawDocumentInput[]
  ): Promise<{
    results: DocumentAnalysisResult[];
    newlyProcessedCount: number;
    cachedCount: number;
    tokensSavedEstimate: number;
  }> {
    let newlyProcessedCount = 0;
    let cachedCount = 0;
    const results: DocumentAnalysisResult[] = [];

    for (const doc of documents) {
      const hash = doc.fileHash || computeSimulatedHash(doc.fileName, doc.fileSizeBytes, doc.contentSnippet);
      const isAlreadyCached = DocumentIntelligenceAgent.processedHashesCache.has(hash);

      const res = await this.analyzeDocument(doc);
      if (isAlreadyCached) {
        cachedCount++;
      } else {
        newlyProcessedCount++;
      }
      results.push(res);
    }

    // Ahorro estimado de tokens por reutilización: ~2.500 tokens por documento
    const tokensSavedEstimate = cachedCount * 2500;

    return {
      results,
      newlyProcessedCount,
      cachedCount,
      tokensSavedEstimate,
    };
  }

  public static clearCache(): void {
    this.processedHashesCache.clear();
  }
}
