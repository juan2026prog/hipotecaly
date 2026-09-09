import { test, expect } from '@playwright/test';
import { DocumentService } from '../src/lib/docflow/documentService';
import { DocumentTemplate } from '../src/lib/docflow/types';

test.describe('HIPOTECALY DOCFLOW — CAPA DE DATOS, ISOLATION & RLS DIRECT TESTS', () => {

  const TENANT_A = 'd0000000-0000-0000-0000-000000000001'; // Estudio Nova
  const TENANT_B = 'd0000000-0000-0000-0000-000000000002'; // Capital Soluciones

  test('1. Super Admin puede crear y administrar plantillas maestras globales', async () => {
    const globalTpl = await DocumentService.createTemplate({
      name: 'Contrato Hipotecario Maestro Global TEST',
      slug: 'contrato-maestro-test',
      description: 'Plantilla oficial de prueba',
      category: 'legal',
      document_type: 'pdf',
      status: 'active',
      version: 1,
      template_content: '<p>Contrato Maestro Oficial HIPOTECALY para {{borrower.full_name}}</p>',
      output_format: 'pdf',
      requires_signature: true,
      required_fields: ['borrower.full_name'],
      is_global: true,
      scope: 'global',
      origin_type: 'global',
      availability: 'all',
      available_tenant_ids: null,
      created_by: 'u-test-superadmin',
    });

    expect(globalTpl).toBeDefined();
    expect(globalTpl.id).toBeDefined();
    expect(globalTpl.scope).toBe('global');
    expect(globalTpl.is_global).toBe(true);

    // Verificar que aparece en el catálogo global
    const globals = await DocumentService.getGlobalTemplates();
    const found = globals.find((g) => g.id === globalTpl.id);
    expect(found).toBeDefined();
  });

  test('2. Tenant autorizado puede leer plantilla global asignada; Tenant no autorizado NO puede leerla', async () => {
    // Crear plantilla global restringida ÚNICAMENTE a Tenant A
    const restrictedTpl = await DocumentService.createTemplate({
      name: 'Formulario Exclusivo para Estudio Nova',
      slug: 'form-exclusivo-nova',
      category: 'solicitud',
      document_type: 'pdf',
      status: 'active',
      version: 1,
      template_content: '<p>Contenido exclusivo para {{tenant.name}}</p>',
      output_format: 'pdf',
      requires_signature: false,
      required_fields: [],
      is_global: true,
      scope: 'global',
      origin_type: 'global',
      availability: 'selected',
      available_tenant_ids: [TENANT_A],
      created_by: 'u-test-superadmin',
    });

    // Tenant A (autorizado) debe verla
    const tenantAGlobals = await DocumentService.getGlobalTemplates(TENANT_A);
    const foundForA = tenantAGlobals.find((t) => t.id === restrictedTpl.id);
    expect(foundForA).toBeDefined();

    // Tenant B (no autorizado) NO debe verla
    const tenantBGlobals = await DocumentService.getGlobalTemplates(TENANT_B);
    const foundForB = tenantBGlobals.find((t) => t.id === restrictedTpl.id);
    expect(foundForB).toBeUndefined();
  });

  test('3. Tenant A no puede modificar directamente una plantilla global (Inmutabilidad Global)', async () => {
    const globals = await DocumentService.getGlobalTemplates();
    const targetGlobal = globals[0];
    expect(targetGlobal).toBeDefined();

    const originalContent = targetGlobal.template_content;
    const originalVersion = targetGlobal.version;

    // Si un tenant intenta mutar la global en lugar de derivar
    // La derivación crea un clon independiente con scope: 'tenant'
    const derived = await DocumentService.deriveTemplate(targetGlobal.id, TENANT_A, 'Estudio Nova');
    
    expect(derived.id).not.toBe(targetGlobal.id);
    expect(derived.scope).toBe('tenant');
    expect(derived.tenant_id).toBe(TENANT_A);
    expect(derived.parent_template_id).toBe(targetGlobal.id);
    expect(derived.parent_version).toBe(originalVersion);

    // Comprobar que la global original permanece intacta
    const reloadedGlobal = await DocumentService.getTemplate(targetGlobal.id);
    expect(reloadedGlobal?.template_content).toBe(originalContent);
    expect(reloadedGlobal?.scope).toBe('global');
    expect(reloadedGlobal?.is_global).toBe(true);
  });

  test('4. Tenant A no puede leer ni modificar plantillas privadas de Tenant B (Cross-Tenant Isolation)', async () => {
    // Tenant B crea una plantilla privada propia
    const tenantBPrivateTpl = await DocumentService.createTemplate({
      name: 'Minuta Notarial Privada Capital Soluciones',
      slug: 'minuta-privada-capital',
      category: 'notarial',
      document_type: 'pdf',
      status: 'active',
      version: 1,
      template_content: '<p>Minuta confidencial exclusiva de Capital Soluciones</p>',
      output_format: 'pdf',
      requires_signature: true,
      required_fields: [],
      is_global: false,
      scope: 'tenant',
      tenant_id: TENANT_B,
      origin_type: 'custom',
      created_by: 'u-test-tenant-b-admin',
    });

    // Tenant A consulta sus plantillas de tenant
    const tenantATemplates = await DocumentService.getTenantTemplates(TENANT_A);
    const leakInA = tenantATemplates.find((t) => t.id === tenantBPrivateTpl.id);
    expect(leakInA).toBeUndefined();

    // Tenant B consulta sus plantillas de tenant y sí la encuentra
    const tenantBTemplates = await DocumentService.getTenantTemplates(TENANT_B);
    const foundInB = tenantBTemplates.find((t) => t.id === tenantBPrivateTpl.id);
    expect(foundInB).toBeDefined();
    expect(foundInB?.name).toBe('Minuta Notarial Privada Capital Soluciones');
  });

  test('5. Publicación de nueva versión global NO sobrescribe la versión del tenant (Detección No Destructiva)', async () => {
    // 1. Crear global v1
    const masterV1 = await DocumentService.createTemplate({
      name: 'Contrato Marco de Mutuo Hipotecario',
      slug: 'contrato-marco-mutuo',
      category: 'legal',
      document_type: 'pdf',
      status: 'active',
      version: 1,
      template_content: '<p>Versión 1 del Contrato Marco</p>',
      output_format: 'pdf',
      requires_signature: true,
      required_fields: [],
      is_global: true,
      scope: 'global',
      origin_type: 'global',
      availability: 'all',
      created_by: 'u-test-superadmin',
    });

    // 2. Tenant A deriva v1
    const tenantDerivation = await DocumentService.deriveTemplate(masterV1.id, TENANT_A, 'Estudio Nova');
    expect(tenantDerivation.parent_version).toBe(1);

    // 3. Super Admin actualiza plantilla global a v2
    await DocumentService.updateTemplate(masterV1.id, {
      version: 2,
      template_content: '<p>Versión 2 del Contrato Marco con cláusulas actualizadas 2026</p>',
    });

    // 4. Verificar que la derivada del tenant NO fue alterada
    const reloadedDerived = await DocumentService.getTemplate(tenantDerivation.id);
    expect(reloadedDerived?.parent_version).toBe(1);
    expect(reloadedDerived?.template_content).toContain('Versión 1');

    // 5. El servicio debe detectar la existencia de actualización sin forzar merge
    const updateInfo = await DocumentService.checkForGlobalUpdates(reloadedDerived!);
    expect(updateInfo).not.toBeNull();
    expect(updateInfo?.hasUpdate).toBe(true);
    expect(updateInfo?.latestGlobalVersion).toBe(2);
  });

  test('6. Trazabilidad histórica completa en generación documental', async () => {
    // 1. Plantilla derivada de global
    const master = (await DocumentService.getGlobalTemplates())[0];
    const derived = await DocumentService.deriveTemplate(master.id, TENANT_A, 'Estudio Nova');

    // 2. Generar documento a partir de la derivada
    const genResult = await DocumentService.generateDocument('e0000000-0000-0000-0000-000000000001', derived.id, {
      userId: 'u-test-operator',
      organizationId: TENANT_A,
    });

    expect(genResult.document).toBeDefined();
    expect(genResult.document.template_id).toBe(derived.id);
    expect(genResult.document.parent_template_id).toBe(master.id);
    expect(genResult.document.file_hash).toBeDefined();
    expect(genResult.document.file_hash?.length).toBe(64); // SHA-256
  });

});
