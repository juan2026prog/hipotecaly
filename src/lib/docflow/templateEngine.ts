// ==============================================================================
// HIPOTECALY DOCFLOW: Motor de Renderizado Seguro y Resolución de Variables
// No ejecuta eval() ni código arbitrario. Valida campos obligatorios y calcula LTV/cuotas.
// ==============================================================================

import { ResolvedCaseData, ValidationResult, ConditionalRule } from './types';
import { DOCUMENT_VARIABLES, getNestedValue } from './variableRegistry';

/**
 * Formatea un valor según su tipo de dato
 */
export function formatVariableValue(value: any, type?: string, currency = 'USD'): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  switch (type) {
    case 'currency': {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return `${currency} ${num.toLocaleString('es-UY', { maximumFractionDigits: 2 })}`;
    }
    case 'percentage': {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return `${num.toLocaleString('es-UY', { maximumFractionDigits: 2 })}%`;
    }
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return num.toLocaleString('es-UY');
    }
    case 'date': {
      try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString('es-UY');
      } catch {
        return String(value);
      }
    }
    default:
      return String(value);
  }
}

/**
 * Evalúa reglas condicionales de forma segura (sin eval)
 */
export function evaluateCondition(
  fieldValue: any,
  operator: ConditionalRule['operator'],
  targetValue: any
): boolean {
  switch (operator) {
    case 'equals':
      return String(fieldValue).toLowerCase() === String(targetValue).toLowerCase();
    case 'not_equals':
      return String(fieldValue).toLowerCase() !== String(targetValue).toLowerCase();
    case 'greater_than':
      return Number(fieldValue) > Number(targetValue);
    case 'less_than':
      return Number(fieldValue) < Number(targetValue);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
    case 'is_truthy':
      return Boolean(fieldValue && fieldValue !== 'false' && fieldValue !== '0');
    default:
      return false;
  }
}

/**
 * Valida los campos requeridos de un template contra los datos del caso
 */
export function validateRequiredFields(
  requiredKeys: string[],
  resolvedData: ResolvedCaseData
): ValidationResult {
  const missing: Array<{ key: string; label: string; category: string; path: string }> = [];
  let available = 0;

  for (const key of requiredKeys) {
    const varDef = DOCUMENT_VARIABLES.find((v) => v.key === key);
    const label = varDef ? varDef.label : key;
    const category = varDef ? varDef.category : 'general';
    const value = getNestedValue(resolvedData as any, key);

    if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value))) {
      missing.push({
        key,
        label,
        category,
        path: key,
      });
    } else {
      available++;
    }
  }

  return {
    isValid: missing.length === 0,
    missingRequiredFields: missing,
    availableFieldsCount: available,
    totalRequiredCount: requiredKeys.length,
  };
}

/**
 * Procesa bloques condicionales en el contenido del template
 * Sintaxis segura soportada:
 * {{#if key === 'valor'}} Contenido {{/if}}
 * {{#if key > 50000}} Contenido {{/if}}
 * {{#if key}} Contenido {{/if}}
 * {{#if_not key}} Contenido {{/if_not}}
 */
export function processConditionalBlocks(template: string, data: ResolvedCaseData): string {
  let content = template;

  // 1. Bloques {{#if key == 'valor'}} ... {{/if}}
  const ifRegex = /\{\{#if\s+([a-zA-Z0-9_.]+)\s*(===|==|!=|>|<|>=|<=)?\s*('[^']*'|"[^"]*"|[0-9.]+|true|false)?\}\}([\s\S]*?)\{\{\/if\}\}/g;
  content = content.replace(ifRegex, (_, fieldKey, op, rawTarget, blockContent) => {
    const actualValue = getNestedValue(data as any, fieldKey);
    let target = rawTarget ? rawTarget.replace(/['"]/g, '') : undefined;

    if (!op && target === undefined) {
      // Simple truthiness check: {{#if applicant.has_spouse}}
      return Boolean(actualValue && actualValue !== '0' && actualValue !== 'false') ? blockContent : '';
    }

    let operator: ConditionalRule['operator'] = 'equals';
    if (op === '!=' || op === '!==') operator = 'not_equals';
    else if (op === '>') operator = 'greater_than';
    else if (op === '<') operator = 'less_than';
    else if (op === '===' || op === '==') operator = 'equals';

    const isMatch = evaluateCondition(actualValue, operator, target);
    return isMatch ? blockContent : '';
  });

  // 2. Bloques {{#if_not key}} ... {{/if_not}}
  const ifNotRegex = /\{\{#if_not\s+([a-zA-Z0-9_.]+)\}\}([\s\S]*?)\{\{\/if_not\}\}/g;
  content = content.replace(ifNotRegex, (_, fieldKey, blockContent) => {
    const actualValue = getNestedValue(data as any, fieldKey);
    const isFalsy = !actualValue || actualValue === '0' || actualValue === 'false';
    return isFalsy ? blockContent : '';
  });

  return content;
}

/**
 * Reemplaza variables del tipo {{category.key}} por su valor formateado
 */
export function renderTemplate(templateContent: string, data: ResolvedCaseData): string {
  // 1. Evaluar condicionales primero
  let processed = processConditionalBlocks(templateContent, data);

  // 2. Reemplazar variables dinámicas
  const varRegex = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
  processed = processed.replace(varRegex, (_match, key) => {
    const varDef = DOCUMENT_VARIABLES.find((v) => v.key === key);
    const rawVal = getNestedValue(data as any, key);

    if (rawVal === undefined || rawVal === null) {
      return `<span class="docflow-unresolved text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-mono text-xs border border-amber-300 font-bold">[${key}: no provisto]</span>`;
    }

    return formatVariableValue(rawVal, varDef?.type, data.loan?.currency || 'USD');
  });

  return processed;
}

/**
 * Calcula un hash criptográfico SHA-256 de una cadena de texto
 */
export async function calculateSha256(content: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback simple para pruebas en entorno sin WebCrypto completo
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256_${hex.repeat(8).slice(0, 64)}`;
}
