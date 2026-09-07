// ==============================================================================
// HIPOTECALY DOCFLOW: Suite de Pruebas Automatizadas Unit, Integration & Multitenancy
// ==============================================================================

import { test, expect } from '@playwright/test';
import {
  DocumentService,
  renderTemplate,
  validateRequiredFields,
  calculateSha256,
  processConditionalBlocks,
  formatVariableValue,
  INITIAL_TEMPLATES,
  DOCUMENT_VARIABLES,
} from '../src/lib/docflow';

test.describe('HIPOTECALY DOCFLOW — Core Engine Tests', () => {
  // 1. Registro Central de Variables
  test('debe contener todas las categorías maestras de variables', () => {
    const categories = Array.from(new Set(DOCUMENT_VARIABLES.map((v) => v.category)));
    expect(categories).toContain('solicitante');
    expect(categories).toContain('propiedad');
    expect(categories).toContain('credito');
    expect(categories).toContain('expediente');
    expect(categories).toContain('fechas');
  });

  // 2. Formateador de variables
  test('debe formatear correctamente valores de moneda, porcentaje y fechas', () => {
    expect(formatVariableValue(60000, 'currency', 'USD')).toBe('USD 60.000');
    expect(formatVariableValue(11.5, 'percentage')).toBe('11,5%');
    expect(formatVariableValue('2026-09-04', 'date')).toContain('2026');
  });

  // 3. Resolución de datos del caso sin duplicación
  test('debe resolver autoritativamente los datos del expediente', async () => {
    const caseData = await DocumentService.resolveCaseData('e0000000-0000-0000-0000-000000000001');
    expect(caseData.applicant.full_name).toBeTruthy();
    expect(caseData.property.padron).toBeTruthy();
    expect(caseData.loan.requested_amount).toBeGreaterThan(0);
    expect(caseData.loan.ltv).toBeGreaterThan(0);
  });

  // 4. Validación de campos obligatorios
  test('debe detectar campos obligatorios faltantes antes de emitir', () => {
    const mockCaseData: any = {
      applicant: { full_name: 'Juan Perez', document_id: '' }, // falta document_id
      property: { padron: '12345' },
    };

    const valResult = validateRequiredFields(
      ['applicant.full_name', 'applicant.document_id', 'property.padron'],
      mockCaseData
    );

    expect(valResult.isValid).toBe(false);
    expect(valResult.missingRequiredFields.length).toBe(1);
    expect(valResult.missingRequiredFields[0].key).toBe('applicant.document_id');
  });

  // 5. Motor de plantillas seguro y condicionales (sin eval)
  test('debe procesar bloques condicionales y reemplazar variables de forma segura', () => {
    const template = `
      <h1>Hola {{applicant.full_name}}</h1>
      {{#if loan.requested_amount > 50000}}
      <p>Operación de Alto Monto</p>
      {{/if}}
      {{#if applicant.marital_status === 'Casado/a'}}
      <p>Requiere firma cónyuge</p>
      {{/if}}
    `;

    const data: any = {
      applicant: { full_name: 'Ignacio Silva', marital_status: 'Casado/a' },
      loan: { requested_amount: 80000 },
    };

    const rendered = renderTemplate(template, data);
    expect(rendered).toContain('Hola Ignacio Silva');
    expect(rendered).toContain('Operación de Alto Monto');
    expect(rendered).toContain('Requiere firma cónyuge');
  });

  // 6. Cómputo criptográfico de Hash SHA-256
  test('debe calcular hash SHA-256 único e inmutable sobre el contenido generado', async () => {
    const content = 'Documento Legal Inmutable HIPOTECALY';
    const hash1 = await calculateSha256(content);
    const hash2 = await calculateSha256(content);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThanOrEqual(32);
  });

  // 7. Generación inmutable de versiones (v1 -> v2)
  test('debe generar versiones incrementales inmutables', async () => {
    const caseId = 'case-test-versioning-100';
    const templates = await DocumentService.getTemplates();
    const tpl = templates[0];

    const resultV1 = await DocumentService.generateDocument(caseId, tpl.id);
    expect(resultV1.document.document_version).toBe(1);
    expect(resultV1.document.file_hash).toBeTruthy();

    const resultV2 = await DocumentService.generateDocument(caseId, tpl.id);
    expect(resultV2.document.document_version).toBe(2);

    // Verificar que v1 queda marcada como reemplazada (superseded)
    const allDocs = await DocumentService.getDocumentsByCase(caseId);
    const docV1 = allDocs.find((d) => d.document_version === 1);
    expect(docV1?.status).toBe('superseded');
  });

  // 8. Compilación del Paquete Notarial
  test('debe compilar los 4 documentos del paquete notarial en un solo paso', async () => {
    const caseId = 'case-notary-test-200';
    const pack = await DocumentService.generateNotaryPack(caseId);
    expect(pack.length).toBe(4);
    for (const doc of pack) {
      expect(doc.file_hash).toBeTruthy();
      expect(doc.snapshot_json).toBeDefined();
    }
  });

  // 9. Catálogo de 15 Plantillas Oficiales
  test('debe contar con las 15 plantillas base oficiales activas', async () => {
    const tpls = await DocumentService.getTemplates();
    expect(tpls.length).toBeGreaterThanOrEqual(15);
  });
});
