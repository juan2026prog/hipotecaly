// ==============================================================================
// HIPOTECALY DOCFLOW: Suite de Pruebas de Ciclo de Vida, Gestión de Plantillas e Inmutabilidad
// ==============================================================================

import { test, expect } from '@playwright/test';
import { DocumentService } from '../src/lib/docflow';

test.describe('HIPOTECALY DOCFLOW — Template Lifecycle, Deletion & Traceability', () => {
  const testTenantId = 't0000000-0000-0000-0000-000000000001';
  const testCaseId = 'e0000000-0000-0000-0000-000000000001';

  test('1. Plantilla sin uso: Permite edición in-place (versión 1) y hard delete real', async () => {
    // Crear nueva plantilla para el tenant
    const template = await DocumentService.createTemplate({
      tenant_id: testTenantId,
      name: 'Test Plantilla Nueva Sin Uso',
      slug: 'test-plantilla-sin-uso-' + Date.now(),
      description: 'Plantilla de prueba para ciclo de vida',
      category: 'solicitud',
      document_type: 'resumen_solicitud',
      template_content: '<h1>Contenido de prueba {{solicitante_nombre}}</h1>',
      scope: 'tenant',
      origin_type: 'custom',
      required_fields: [],
      output_format: 'pdf',
      status: 'active',
      version: 1,
      requires_signature: false,
      is_global: false,
    });

    expect(template.id).toBeTruthy();
    expect(template.version).toBe(1);

    // Verificar contador de usos inicial
    const usageCount = await DocumentService.getTemplateUsageCount(template.id);
    expect(usageCount).toBe(0);

    // Modificar in-place (sin documentos generados mantiene versión 1)
    const updated = await DocumentService.updateTemplate(template.id, {
      name: 'Test Plantilla Modificada',
      template_content: '<h1>Contenido Modificado</h1>',
    });
    expect(updated?.version).toBe(1);
    expect(updated?.name).toBe('Test Plantilla Modificada');

    // Hard delete permitido porque usage_count == 0
    const deleteResult = await DocumentService.deleteTemplate(template.id);
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.action).toBe('hard_deleted');

    // Verificar que ya no existe
    const fetched = await DocumentService.getTemplateById(template.id);
    expect(fetched).toBeNull();
  });

  test('2. Plantilla con uso: Rechaza hard delete (fail-closed) y exige archivado/retiro conservando historial', async () => {
    // 1. Crear plantilla
    const template = await DocumentService.createTemplate({
      tenant_id: testTenantId,
      name: 'Plantilla Para Generar Documentos',
      slug: 'plantilla-con-documentos-' + Date.now(),
      category: 'legal',
      document_type: 'autorizacion_consulta_clearing',
      template_content: '<p>Autorizo consulta de Clearing para {{solicitante_nombre}}, CI {{solicitante_ci}}</p>',
      scope: 'tenant',
      origin_type: 'custom',
      required_fields: [],
      output_format: 'pdf',
      status: 'active',
      version: 1,
      requires_signature: false,
      is_global: false,
    });

    // 2. Generar un documento usando la plantilla
    const genResult = await DocumentService.generateDocument(
      testCaseId,
      template.id,
      { organizationId: testTenantId, userId: 'u0000000-0000-0000-0000-000000000001' }
    );
    const genDoc = genResult.document;
    expect(genDoc.id).toBeTruthy();
    expect(genDoc.file_hash).toBeTruthy();
    expect(genDoc.content_html).toBeTruthy();

    // 3. Verificar que usage_count es mayor a 0
    const usageCount = await DocumentService.getTemplateUsageCount(template.id);
    expect(usageCount).toBeGreaterThanOrEqual(1);

    // 4. Intentar hard delete -> DEBE SER RECHAZADO
    const deleteResult = await DocumentService.deleteTemplate(template.id);
    expect(deleteResult.success).toBe(false);
    expect(deleteResult.action).toBe('cannot_hard_delete');
    expect(deleteResult.message).toContain('documento(s)');

    // 5. Archivar la plantilla de forma segura
    const archived = await DocumentService.archiveTemplate(template.id);
    expect(archived?.status).toBe('archived');
    expect(archived?.archived_at).toBeTruthy();

    // 6. Verificar que el documento histórico se preserva intacto con su snapshot e inmutabilidad
    const preservedDoc = await DocumentService.getDocumentById(genDoc.id);
    expect(preservedDoc).not.toBeNull();
    expect(preservedDoc?.id).toBe(genDoc.id);
    expect(preservedDoc?.file_hash).toBe(genDoc.file_hash);
    expect(preservedDoc?.content_html).toBe(genDoc.content_html);

    // 7. Restaurar la plantilla
    const restored = await DocumentService.restoreTemplate(template.id);
    expect(restored?.status).toBe('active');
    expect(Boolean(restored?.archived_at)).toBe(false);
  });

  test('3. Versionado seguro: Editar o crear nueva versión incrementa v1 -> v2 manteniendo trazabilidad', async () => {
    // 1. Crear plantilla base v1
    const baseTpl = await DocumentService.createTemplate({
      tenant_id: testTenantId,
      name: 'Plantilla Base Versionable',
      slug: 'plantilla-versionable-' + Date.now(),
      category: 'financiero',
      document_type: 'resumen_solicitud',
      template_content: '<p>Version 1 de {{solicitante_nombre}}</p>',
      scope: 'tenant',
      origin_type: 'custom',
      required_fields: [],
      output_format: 'pdf',
      status: 'active',
      version: 1,
      requires_signature: false,
      is_global: false,
    });
    expect(baseTpl.version).toBe(1);

    // 2. Generar documento con v1
    await DocumentService.generateDocument(
      testCaseId,
      baseTpl.id,
      { organizationId: testTenantId, userId: 'u0000000-0000-0000-0000-000000000001' }
    );

    // 3. Crear nueva versión v2
    const v2 = await DocumentService.createNewTemplateVersion(baseTpl.id, {
      template_content: '<p>Version 2 mejorada con nuevas cláusulas para {{solicitante_nombre}}</p>',
    });

    expect(v2.version).toBe(2);
    expect(v2.slug).toBe(baseTpl.slug);
    expect(v2.parent_template_id).toBe(baseTpl.id);
    expect(v2.parent_version).toBe(1);

    // 4. Historial de versiones debe contener ambas
    const history = await DocumentService.getTemplateVersionHistory(baseTpl.slug, testTenantId);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history.some((h) => h.version === 1)).toBe(true);
    expect(history.some((h) => h.version === 2)).toBe(true);
  });

  test('4. Duplicación: Genera un borrador independiente (Copia de ...) con 0 usos', async () => {
    // 1. Plantilla origen
    const sourceTpl = await DocumentService.createTemplate({
      tenant_id: testTenantId,
      name: 'Contrato Hipotecario Modelo',
      slug: 'contrato-hipotecario-modelo-' + Date.now(),
      category: 'legal',
      document_type: 'borrador_constitucion_hipoteca',
      template_content: '<p>Contrato modelo</p>',
      scope: 'tenant',
      origin_type: 'custom',
      required_fields: [],
      output_format: 'pdf',
      status: 'active',
      version: 1,
      requires_signature: false,
      is_global: false,
    });

    // 2. Duplicar
    const copyTpl = await DocumentService.duplicateTemplate(
      sourceTpl.id,
      testTenantId,
      { userId: 'u0000000-0000-0000-0000-000000000001', userName: 'Admin Test' }
    );

    expect(copyTpl.name).toContain('Copia de');
    expect(copyTpl.status).toBe('draft');
    expect(copyTpl.version).toBe(1);
    expect(copyTpl.origin_type).toBe('custom');

    // 3. El clon tiene 0 usos y se puede hard-deletear directamente
    const copyUsage = await DocumentService.getTemplateUsageCount(copyTpl.id);
    expect(copyUsage).toBe(0);

    const deleteCopy = await DocumentService.deleteTemplate(copyTpl.id);
    expect(deleteCopy.success).toBe(true);
    expect(deleteCopy.action).toBe('hard_deleted');
  });

  test('5. Documentos firmados: Son inmutables, no pueden sobreescribirse ni corromper su hash SHA-256', async () => {
    // 1. Generar documento
    const templates = await DocumentService.getAvailableTemplates(testTenantId);
    const tpl = templates[0];

    const genResult = await DocumentService.generateDocument(
      testCaseId,
      tpl.id,
      { organizationId: testTenantId, userId: 'u0000000-0000-0000-0000-000000000001' }
    );
    const doc = genResult.document;

    // 2. Registrar firma electrónica
    const signedDoc = await DocumentService.markSigned(
      doc.id,
      'https://storage.hipotecaly.local/signed/test-doc.pdf',
      { signer_ip: '192.168.1.100', signer_name: 'Juan Perez' }
    );

    expect(signedDoc?.status).toBe('signed');
    expect(signedDoc?.signed_file_url).toBeTruthy();
    expect(signedDoc?.signature_evidence?.signer_ip).toBe('192.168.1.100');

    // 3. Documento en base mantiene inmutabilidad y hash original
    const docAfter = await DocumentService.getDocumentById(doc.id);
    expect(docAfter?.status).toBe('signed');
    expect(docAfter?.file_hash).toBe(doc.file_hash);
  });

  test('6. Snapshot inmutable crítico: Plantilla modificada, versionada y archivada/retirada mantiene el snapshot histórico y hash SHA-256 intacto', async () => {
    // 1. Crear plantilla original v1
    const tplOriginal = await DocumentService.createTemplate({
      tenant_id: testTenantId,
      name: 'Plantilla Para Prueba de Snapshot Inmutable',
      slug: 'snapshot-inmutable-test-' + Date.now(),
      category: 'legal',
      document_type: 'autorizacion_clearing',
      template_content: '<p>Contenido Original v1 para {{solicitante_nombre}}</p>',
      scope: 'tenant',
      origin_type: 'custom',
      required_fields: [],
      output_format: 'pdf',
      status: 'active',
      version: 1,
      requires_signature: false,
      is_global: false,
    });

    // 2. Generar documento histórico con v1
    const genResult = await DocumentService.generateDocument(
      testCaseId,
      tplOriginal.id,
      { organizationId: testTenantId, userId: 'u0000000-0000-0000-0000-000000000001' }
    );
    const historicalDoc = genResult.document;
    const originalHash = historicalDoc.file_hash;
    const originalContentHtml = historicalDoc.content_html;
    const originalSnapshotJson = JSON.stringify(historicalDoc.snapshot_json);
    const originalVersion = historicalDoc.template_version;

    expect(originalHash).toBeTruthy();
    expect(originalContentHtml).toBeTruthy();
    expect(originalVersion).toBe(1);

    // 3. Modificar la plantilla creando v2 con contenido completamente diferente
    const tplV2 = await DocumentService.createNewTemplateVersion(tplOriginal.id, {
      template_content: '<p>Contenido COMPLETAMENTE DISTINTO v2 con cláusulas adicionales</p>',
    });
    expect(tplV2.version).toBe(2);

    // 4. Archivar y retirar la plantilla original v1
    const retired = await DocumentService.retireTemplate(tplOriginal.id);
    expect(retired?.status).toBe('retired');

    // 5. Volver a consultar el documento histórico emitido originalmente
    const fetchedHistoricalDoc = await DocumentService.getDocumentById(historicalDoc.id);
    expect(fetchedHistoricalDoc).not.toBeNull();

    // 6. Verificación de inmutabilidad estricta:
    // a. content_html histórico no cambia
    expect(fetchedHistoricalDoc?.content_html).toBe(originalContentHtml);
    // b. snapshot_json no cambia
    expect(JSON.stringify(fetchedHistoricalDoc?.snapshot_json)).toBe(originalSnapshotJson);
    // c. template_version histórica sigue siendo 1
    expect(fetchedHistoricalDoc?.template_version).toBe(1);
    // d. hash SHA-256 sigue exactamente igual
    expect(fetchedHistoricalDoc?.file_hash).toBe(originalHash);
  });
});
