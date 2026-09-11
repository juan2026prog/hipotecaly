// ==============================================================================
// HIPOTECALY TASADOR IA - SANITIZADOR DE INFORMACIÓN PERSONAL (PII) (FASE 4)
// Eliminación de Nombres, Teléfonos, Cédulas, Mails y Datos Sensibles antes de IA
// ==============================================================================

export interface SanitizationResult {
  sanitizedText: string;
  piiDetected: boolean;
  redactedItemCount: number;
}

export class PIISanitizer {
  /**
   * Limpia y anonimiza el texto para evitar el envío de datos personales al LLM
   */
  public static sanitize(rawText?: string | null): SanitizationResult {
    if (!rawText || !rawText.trim()) {
      return { sanitizedText: '', piiDetected: false, redactedItemCount: 0 };
    }

    let text = rawText;
    let redactedCount = 0;

    // 1. Detección y reemplazo de Emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const emailMatches = text.match(emailRegex);
    if (emailMatches) {
      redactedCount += emailMatches.length;
      text = text.replace(emailRegex, '[EMAIL_REDACTED]');
    }

    // 2. Detección y reemplazo de Teléfonos (Formato uruguayo celular y fijo)
    // +598 99 123 456, 099123456, 2400 1234, 094-123-456, etc.
    const phoneRegex = /(?:\+?598\s*)?(?:0?9\d{1}[\s.-]?\d{3}[\s.-]?\d{3}|\b2\d{3}[\s.-]?\d{4}\b|\b\d{8,9}\b)/g;
    const phoneMatches = text.match(phoneRegex);
    if (phoneMatches) {
      redactedCount += phoneMatches.length;
      text = text.replace(phoneRegex, '[PHONE_REDACTED]');
    }

    // 3. Detección y reemplazo de Cédulas de Identidad Uruguayas (ej: 1.234.567-8 o 1234567-8)
    const ciRegex = /\b\d{1,2}\.?\d{3}\.?\d{3}[-\s]?\d{1}\b/g;
    const ciMatches = text.match(ciRegex);
    if (ciMatches) {
      redactedCount += ciMatches.length;
      text = text.replace(ciRegex, '[CI_REDACTED]');
    }

    // 4. Frases de contacto directo personal
    const contactPhrases = [
      /tratar\s+con\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+/gi,
      /contacto\s*:\s*[a-zA-ZáéíóúÁÉÍÓÚñÑ]+/gi,
      /llamar\s+a\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+/gi,
      /comunicarse\s+con\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+/gi,
    ];

    for (const phrase of contactPhrases) {
      const phraseMatches = text.match(phrase);
      if (phraseMatches) {
        redactedCount += phraseMatches.length;
        text = text.replace(phrase, '[CONTACT_REDACTED]');
      }
    }

    return {
      sanitizedText: text,
      piiDetected: redactedCount > 0,
      redactedItemCount: redactedCount,
    };
  }
}
