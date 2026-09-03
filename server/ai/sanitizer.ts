// ==============================================================================
// HIPOTECALY AI CORE: GLOBAL_MEMORY_SANITIZER (Anonimizador de Privacidad RAG)
// ==============================================================================

/**
 * Filtro estricto que elimina información personalmente identificable (PII)
 * antes de indexar conocimiento o correcciones en la Memoria Global transversal ("Memoria 3").
 */
export class GlobalMemorySanitizer {
  // Expresiones regulares para datos sensibles uruguayos e internacionales
  private static readonly CI_REGEX = /\b\d{1,2}\.?\d{3}\.?\d{3}-?\d{1}\b/g;
  private static readonly RUT_REGEX = /\b21\d{10}\b/g;
  private static readonly EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private static readonly PHONE_REGEX = /(\+598\s?|09\d{1}\s?|\b2\d{3}\s?)\d{3}\s?\d{3,4}\b/g;
  private static readonly BANK_ACCOUNT_REGEX = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4,8}\b/g;
  private static readonly PADRON_SPECIFIC_REGEX = /\b(padr[oó]n\s*(?:n[uú]mero|n[ºo]|individual|matriz)?)\s*[:#]?\s*(\d+)\b/gi;
  private static readonly SPECIFIC_ADDRESS_REGEX = /\b(calle|avda?\.?|avenida|bvar\.?|bulevar|ruta)\s+([A-Za-z0-9ÁÉÍÓÚáéíóúñÑ\s.]+?)\s+(?:n[ºo]?\s*)?(\d{2,5})(?:\s+(?:apto\.?|apartamento|unidad)\s*([A-Za-z0-9]+))?\b/gi;

  /**
   * Sanitiza un texto eliminando nombres, números de cédula, direcciones exactas y cuentas.
   * Preserva departamentos, tipologías, superficies, porcentajes y patrones analíticos.
   */
  public static sanitize(text: string): string {
    if (!text) return '';

    let cleaned = text;

    // 1. Reemplazar Cédulas de Identidad
    cleaned = cleaned.replace(this.CI_REGEX, '[CI_ANONIMIZADA]');

    // 2. Reemplazar RUTs
    cleaned = cleaned.replace(this.RUT_REGEX, '[RUT_ANONIMIZADO]');

    // 3. Reemplazar Emails
    cleaned = cleaned.replace(this.EMAIL_REGEX, '[EMAIL_REMOVIDO]');

    // 4. Reemplazar Teléfonos
    cleaned = cleaned.replace(this.PHONE_REGEX, '[TELEFONO_REMOVIDO]');

    // 5. Reemplazar Números de Cuenta Bancaria / Tarjetas
    cleaned = cleaned.replace(this.BANK_ACCOUNT_REGEX, '[CUENTA_PROTEGIDA]');

    // 6. Generalizar Padrones exactos a categoría
    cleaned = cleaned.replace(this.PADRON_SPECIFIC_REGEX, 'padrón [PADRON_RESERVADO]');

    // 7. Generalizar Direcciones exactas con numeración a solo zona/arteria
    cleaned = cleaned.replace(this.SPECIFIC_ADDRESS_REGEX, '$1 $2 [ALTURA_PROTEGIDA]');

    // 8. Reemplazar nombres de solicitantes o titulares precedidos de palabras clave
    cleaned = cleaned.replace(/\b(señor|señora|titular|propietario|solicitante|escribano|escribana)\s+([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚ][a-záéíóúñ]+){1,3})/g, '$1 [PROFESIONAL/TITULAR_RESERVADO]');

    return cleaned.trim();
  }

  /**
   * Genera un registro de memoria global derivado y estrictamente anonimizado.
   */
  public static createSanitizedMemoryEntry(params: {
    memoryType: 'valuation_pattern' | 'document_pattern' | 'correction_pattern' | 'underwriting_pattern';
    department: string;
    locality?: string;
    propertyType?: string;
    priceRange?: string;
    rawPatternSummary: string;
    rawInsight: string;
    metrics?: Record<string, unknown>;
  }): {
    memoryType: string;
    department: string;
    locality?: string;
    propertyType?: string;
    priceRange?: string;
    patternSummary: string;
    sanitizedInsight: string;
    metrics: Record<string, unknown>;
  } {
    return {
      memoryType: params.memoryType,
      department: params.department || 'Todos',
      locality: params.locality || 'General',
      propertyType: params.propertyType || 'inmueble',
      priceRange: params.priceRange || 'rango_estandar',
      patternSummary: this.sanitize(params.rawPatternSummary),
      sanitizedInsight: this.sanitize(params.rawInsight),
      metrics: params.metrics || {},
    };
  }
}
