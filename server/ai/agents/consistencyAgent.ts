// ==============================================================================
// HIPOTECALY AI: Consistency Agent (Cruce Documental, Inconsistencias y Faltantes)
// ==============================================================================

import { ConsistencyIssue } from '../types';
import { DocumentAnalysisResult } from './documentIntelligenceAgent';

export interface ConsistencyCheckInput {
  borrower: {
    firstName: string;
    lastName: string;
    idNumber?: string;
    declaredIncome?: number;
  };
  property: {
    cadastralNumber?: string; // Padrón
    surfaceM2?: number;
    department: string;
    address?: string;
  };
  analyzedDocuments: DocumentAnalysisResult[];
}

export class ConsistencyAgent {
  /**
   * Ejecuta cruces entre la solicitud declarada y las extracciones documentales
   */
  public evaluateConsistency(input: ConsistencyCheckInput): {
    issues: ConsistencyIssue[];
    missingRequiredDocs: string[];
    isConsistent: boolean;
  } {
    const issues: ConsistencyIssue[] = [];
    const missingRequiredDocs: string[] = [];

    // 1. Verificación de Documentos Obligatorios Faltantes
    const presentTypes = new Set(input.analyzedDocuments.map((d) => d.documentType));

    if (!presentTypes.has('escritura') && !presentTypes.has('titulo')) {
      missingRequiredDocs.push('Título de Propiedad o Escritura Pública de Adquisición');
      issues.push({
        id: 'missing_title',
        severity: 'critica',
        category: 'documentacion',
        title: 'Falta Título de Propiedad o Escritura',
        description: 'No se detectó documento notarial acreditante del dominio del inmueble ofrecido en garantía.',
        declared_value: 'Inmueble declarado en garantía',
        evidenced_value: 'Sin título o escritura en legajo',
        recommendation: 'Solicitar copia escaneada completa del título de propiedad o primera copia de escritura.',
      });
    }

    if (!presentTypes.has('recibo_sueldo') && !presentTypes.has('certificado_ingresos')) {
      missingRequiredDocs.push('Comprobante de Ingresos (Recibo de sueldo o certificado de contador público)');
      issues.push({
        id: 'missing_income_proof',
        severity: 'media',
        category: 'ingresos',
        title: 'Falta Comprobante Formal de Ingresos',
        description: 'No se acreditó documentalmente la capacidad de repago declarada en la solicitud.',
        declared_value: `Ingresos declarados: USD/UYU ${input.borrower.declaredIncome || 'No especificado'}`,
        evidenced_value: 'Sin recibo ni certificado de ingresos',
        recommendation: 'Cargar los últimos 3 recibos de haberes o balance/certificado emitido por Contador Público.',
      });
    }

    // 2. Cruce de Padrón Inmobiliario (Catastro vs Documentos)
    const declaredPadron = input.property.cadastralNumber?.trim();
    if (declaredPadron) {
      for (const doc of input.analyzedDocuments) {
        const docPadron = doc.extraction.padron?.trim();
        if (docPadron && docPadron !== declaredPadron) {
          issues.push({
            id: `padron_mismatch_${doc.documentId || doc.fileName}`,
            severity: 'critica',
            category: 'consistencia_registral',
            title: `Inconsistencia en Número de Padrón (${doc.documentType})`,
            description: `El padrón detectado en el documento "${doc.fileName}" (${docPadron}) no coincide con el padrón ingresado en el expediente (${declaredPadron}).`,
            declared_value: declaredPadron,
            evidenced_value: docPadron,
            source_document_name: doc.fileName,
            recommendation: 'Verificar si el inmueble sufrió reparcelamiento, fraccionamiento o si corresponde a otra unidad.',
          });
        }
      }
    }

    // 3. Cruce de Titular Registral vs Solicitante del Préstamo
    for (const doc of input.analyzedDocuments) {
      if (doc.documentType === 'escritura' || doc.documentType === 'titulo') {
        const rawOwner = doc.extraction.property_owner || doc.extraction.holder;
        const docOwner = rawOwner?.toLowerCase().trim();
        const borrowerDisplayName = `${input.borrower.firstName} ${input.borrower.lastName}`.trim();

        if (docOwner && !docOwner.includes(input.borrower.lastName.toLowerCase())) {
          issues.push({
            id: `owner_mismatch_${doc.documentId || doc.fileName}`,
            severity: 'critica',
            category: 'titularidad',
            title: 'Discrepancia de Titularidad Dominial',
            description: `El titular detectado en el documento de propiedad ("${rawOwner}") no coincide con el solicitante del préstamo ("${borrowerDisplayName}").`,
            declared_value: borrowerDisplayName,
            evidenced_value: rawOwner || docOwner,
            source_document_name: doc.fileName,
            recommendation: 'Aclarar si el titular comparece como fiador hipotecario o si se trata de una sucesión en trámite.',
          });
        }
      }
    }

    // 4. Cruce de Superficie (Declarada vs Plano / Título)
    const declaredSurface = input.property.surfaceM2;
    if (declaredSurface && declaredSurface > 0) {
      for (const doc of input.analyzedDocuments) {
        const docSurface = doc.extraction.land_area_m2 || doc.extraction.built_area_m2;
        if (docSurface && Math.abs(declaredSurface - docSurface) / declaredSurface > 0.20) {
          issues.push({
            id: `surface_mismatch_${doc.documentId || doc.fileName}`,
            severity: 'media',
            category: 'propiedad',
            title: 'Diferencia Significativa de Superficie',
            description: `La superficie declarada (${declaredSurface} m²) difiere más de un 20% respecto a la indicada en "${doc.fileName}" (${docSurface} m²).`,
            declared_value: `${declaredSurface} m²`,
            evidenced_value: `${docSurface} m²`,
            source_document_name: doc.fileName,
            recommendation: 'Verificar si la diferencia obedece a área exclusiva vs área común con cuotaparte.',
          });
        }
      }
    }

    return {
      issues,
      missingRequiredDocs,
      isConsistent: issues.filter((i) => i.severity === 'critica').length === 0,
    };
  }
}
