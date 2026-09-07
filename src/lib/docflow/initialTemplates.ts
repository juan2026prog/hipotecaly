// ==============================================================================
// HIPOTECALY DOCFLOW: 15 Plantillas Base Oficiales del Sistema
// ==============================================================================

import { DocumentTemplate } from './types';

export const INITIAL_TEMPLATES: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  // 1. Solicitud de crédito
  {
    name: 'Solicitud Formal de Crédito Hipotecario',
    slug: 'solicitud-credito',
    description: 'Formulario legal de solicitud de financiamiento con garantía hipotecaria.',
    category: 'solicitud',
    document_type: 'solicitud_credito',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: true,
    signature_type: 'simple',
    is_global: true,
    required_roles: ['applicant'],
    required_fields: [
      'applicant.full_name',
      'applicant.document_id',
      'applicant.email',
      'applicant.phone',
      'property.padron',
      'property.department',
      'property.address',
      'property.estimated_value',
      'loan.requested_amount',
      'loan.term_months',
      'case.code',
    ],
    signers_config: [
      { role: 'applicant', label: 'Titular Solicitante', required: true, order: 1 },
    ],
    template_content: `
<div class="docflow-document font-sans text-slate-800 leading-relaxed text-sm p-8">
  <div class="border-b-2 border-navy pb-4 mb-6 flex justify-between items-start">
    <div>
      <h1 class="text-xl font-bold text-navy uppercase tracking-wide">Solicitud de Crédito Hipotecario</h1>
      <p class="text-xs text-slate-500 mt-1">Expediente N° <strong class="font-mono text-navy">{{case.code}}</strong> · Fecha: {{dates.today_formatted}}</p>
    </div>
    <div class="text-right text-xs">
      <span class="font-bold text-navy block">{{tenant.name}}</span>
      <span class="text-slate-500">Gestión de Créditos Privados</span>
    </div>
  </div>

  <div class="space-y-6">
    <!-- 1. Datos del Solicitante -->
    <section>
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 p-2 rounded mb-3">1. Datos Personales del Solicitante</h2>
      <div class="grid grid-cols-2 gap-4 text-xs">
        <div><strong>Nombre completo:</strong> {{applicant.full_name}}</div>
        <div><strong>Documento (CI):</strong> {{applicant.document_id}}</div>
        <div><strong>Correo electrónico:</strong> {{applicant.email}}</div>
        <div><strong>Teléfono celular:</strong> {{applicant.phone}}</div>
        <div><strong>Domicilio particular:</strong> {{applicant.address}}</div>
        <div><strong>Departamento / Localidad:</strong> {{applicant.department}}</div>
        <div><strong>Estado Civil:</strong> {{applicant.marital_status}}</div>
        <div><strong>Ingreso mensual declarado:</strong> {{applicant.monthly_income}}</div>
      </div>
    </section>

    <!-- 2. Datos del Inmueble en Garantía -->
    <section>
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 p-2 rounded mb-3">2. Inmueble Ofrecido en Garantía</h2>
      <div class="grid grid-cols-2 gap-4 text-xs">
        <div><strong>Padrón N°:</strong> {{property.padron}}</div>
        <div><strong>Tipo de inmueble:</strong> {{property.type}}</div>
        <div><strong>Dirección:</strong> {{property.address}}</div>
        <div><strong>Departamento / Ciudad:</strong> {{property.department}} · {{property.city}}</div>
        <div><strong>Superficie declarada:</strong> {{property.area_m2}} m²</div>
        <div><strong>Valor estimado por solicitante:</strong> {{property.estimated_value}}</div>
        <div><strong>Situación Jurídica:</strong> {{property.legal_status}}</div>
      </div>
    </section>

    <!-- 3. Términos Solicitados -->
    <section>
      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 p-2 rounded mb-3">3. Condiciones del Préstamo Solicitado</h2>
      <div class="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div><span class="text-slate-500 block">Monto Solicitado:</span><strong class="text-navy text-sm">{{loan.requested_amount}}</strong></div>
        <div><span class="text-slate-500 block">Plazo:</span><strong class="text-navy text-sm">{{loan.term_months}} meses</strong></div>
        <div><span class="text-slate-500 block">LTV Resultante:</span><strong class="text-navy text-sm">{{loan.ltv}}</strong></div>
      </div>
    </section>

    <!-- Cláusula de Declaración -->
    <div class="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-normal">
      El solicitante declara bajo juramento que toda la información consignada en esta solicitud es verídica y fidedigna, autorizando a {{tenant.name}} a verificar y evaluar los antecedentes correspondientes para la estructuración de la operación hipotecaria.
    </div>

    <!-- Firmas -->
    <div class="pt-12 mt-8 border-t border-slate-200 flex justify-between items-end">
      <div class="w-64 text-center">
        <div class="border-b border-slate-400 mb-2"></div>
        <p class="font-bold text-xs text-navy">{{applicant.full_name}}</p>
        <p class="text-[10px] text-slate-500">C.I. {{applicant.document_id}} · Solicitante</p>
      </div>
      <div class="text-right text-[10px] text-slate-400">
        <p>DocFlow ID: {{case.code}}</p>
        <p>Hash SHA-256 verificado</p>
      </div>
    </div>
  </div>
</div>
`,
  },

  // 2. Autorización de consulta de información
  {
    name: 'Autorización de Consulta de Información Crediticia',
    slug: 'autorizacion-consulta',
    description: 'Autorización expresa para consultas de Clearing de Informes y antecedentes.',
    category: 'legal',
    document_type: 'autorizacion_clearing',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: true,
    signature_type: 'simple',
    is_global: true,
    required_roles: ['applicant'],
    required_fields: [
      'applicant.full_name',
      'applicant.document_id',
      'tenant.name',
      'case.code',
    ],
    signers_config: [
      { role: 'applicant', label: 'Titular Solicitante', required: true, order: 1 },
    ],
    template_content: `
<div class="docflow-document font-sans text-slate-800 leading-relaxed text-sm p-8 max-w-3xl mx-auto">
  <div class="border-b-2 border-navy pb-4 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Autorización de Consulta de Antecedentes</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <p class="text-xs mb-6 text-slate-500">En la ciudad de {{applicant.department}}, a los {{dates.today_formatted}}.</p>

  <div class="space-y-4 text-xs leading-relaxed text-slate-700">
    <p>
      Por la presente, yo, <strong>{{applicant.full_name}}</strong>, titular de la Cédula de Identidad N° <strong>{{applicant.document_id}}</strong>, con domicilio en <strong>{{applicant.address}}</strong>, autorizo expresamente a <strong>{{tenant.name}}</strong> y/o a los prestamistas e inversores vinculados a la plataforma:
    </p>

    <ol class="list-decimal pl-5 space-y-2">
      <li>Consultar mi historial y antecedentes crediticios ante Equifax / Clearing de Informes y cualquier otra base de datos de riesgo comercial y financiero legalmente habilitada en la República Oriental del Uruguay.</li>
      <li>Verificar la autenticidad de la documentación aportada referente a ingresos, situación laboral e inmueble en garantía.</li>
      <li>Compartir de forma estrictamente confidencial la información del expediente con potenciales oferentes de financiamiento a los solos efectos de estructurar la propuesta de crédito hipotecario.</li>
    </ol>

    <p class="mt-4">
      La presente autorización se extiende por el plazo de vigencia del trámite de solicitud y hasta la eventual formalización o cancelación de la misma.
    </p>
  </div>

  <div class="pt-16 mt-12 border-t border-slate-200">
    <div class="w-64">
      <div class="border-b border-slate-400 mb-2"></div>
      <p class="font-bold text-xs text-navy">{{applicant.full_name}}</p>
      <p class="text-[10px] text-slate-500">C.I. {{applicant.document_id}}</p>
      <p class="text-[10px] text-slate-400 mt-1">Firma digital o manuscrita</p>
    </div>
  </div>
</div>
`,
  },

  // 3. Consentimiento de privacidad
  {
    name: 'Consentimiento de Privacidad y Tratamiento de Datos',
    slug: 'consentimiento-privacidad',
    description: 'Consentimiento conforme a la Ley N° 18.331 de Protección de Datos Personales.',
    category: 'legal',
    document_type: 'consentimiento_privacidad',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: true,
    is_global: true,
    required_fields: ['applicant.full_name', 'applicant.document_id', 'applicant.email', 'tenant.name'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <h1 class="text-lg font-bold text-navy uppercase border-b border-navy pb-3 mb-4">Consentimiento de Tratamiento de Datos Personales</h1>
  <p class="text-xs text-slate-600 mb-4">Conforme a las disposiciones de la Ley N° 18.331 de la República Oriental del Uruguay.</p>

  <div class="space-y-4 text-xs text-slate-700">
    <p>
      El titular <strong>{{applicant.full_name}}</strong> (CI: <strong>{{applicant.document_id}}</strong>, Email: <strong>{{applicant.email}}</strong>) consiente de forma libre, previa, expresa e informada que sus datos personales aportados en el marco del expediente <strong>{{case.code}}</strong> sean tratados por <strong>{{tenant.name}}</strong> con el exclusivo fin de intermediación y originación de créditos con garantía hipotecaria.
    </p>
    <p>
      Se garantiza el ejercicio de los derechos de acceso, rectificación, actualización, inclusión o supresión de datos conforme a la normativa vigente.
    </p>
  </div>

  <div class="pt-12 mt-8 border-t border-slate-200">
    <p class="text-xs font-bold text-navy">{{applicant.full_name}}</p>
    <p class="text-[10px] text-slate-500">CI: {{applicant.document_id}} · {{dates.today_formatted}}</p>
  </div>
</div>
`,
  },

  // 4. Declaración jurada
  {
    name: 'Declaración Jurada de Ingresos y Situación Patrimonial',
    slug: 'declaracion-jurada-ingresos',
    description: 'Declaración jurada sobre la veracidad de ingresos y situación de bienes.',
    category: 'financiero',
    document_type: 'declaracion_jurada',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: true,
    is_global: true,
    required_fields: [
      'applicant.full_name',
      'applicant.document_id',
      'applicant.occupation',
      'applicant.monthly_income',
      'property.estimated_value',
    ],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <div class="border-b-2 border-navy pb-3 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Declaración Jurada de Ingresos y Patrimonio</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <div class="space-y-4 text-xs text-slate-700 leading-normal">
    <p>
      Yo, <strong>{{applicant.full_name}}</strong>, titular del documento de identidad N° <strong>{{applicant.document_id}}</strong>, con actividad u ocupación declarada de <strong>{{applicant.occupation}}</strong>:
    </p>
    <p class="p-3 bg-slate-50 border border-slate-200 rounded">
      <strong>DECLARO BAJO JURAMENTO:</strong><br/>
      1. Que percibo un ingreso mensual promedio de <strong>{{applicant.monthly_income}}</strong> proveniente de actividades lícitas.<br/>
      2. Que soy legítimo titular o poseedor con derecho de disposición del inmueble sito en <strong>{{property.address}}</strong>, Padrón N° <strong>{{property.padron}}</strong>, estimado en <strong>{{property.estimated_value}}</strong>.<br/>
      3. Que la situación jurídica del bien se encuentra en estado <strong>{{property.legal_status}}</strong>.
    </p>
  </div>

  <div class="pt-12 mt-8 border-t border-slate-200">
    <div class="w-64 text-center">
      <div class="border-b border-slate-400 mb-2"></div>
      <p class="font-bold text-xs text-navy">{{applicant.full_name}}</p>
      <p class="text-[10px] text-slate-500">C.I. {{applicant.document_id}}</p>
    </div>
  </div>
</div>
`,
  },

  // 5. Declaración de origen de fondos
  {
    name: 'Declaración Jurada de Origen Lícito de Fondos (PLAFT)',
    slug: 'origen-de-fondos',
    description: 'Cumplimiento normativo antilavado de activos y origen lícito de fondos.',
    category: 'legal',
    document_type: 'origen_fondos',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: true,
    is_global: true,
    required_fields: ['applicant.full_name', 'applicant.document_id', 'applicant.occupation'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <h1 class="text-lg font-bold text-navy uppercase border-b border-navy pb-3 mb-4">Declaración de Origen Lícito de Fondos</h1>
  <p class="text-xs text-slate-600 mb-4">En cumplimiento de las normas de Prevención de Lavado de Activos y Financiamiento del Terrorismo (Ley N° 19.574).</p>

  <div class="space-y-4 text-xs text-slate-700">
    <p>
      El compareciente <strong>{{applicant.full_name}}</strong> (CI: <strong>{{applicant.document_id}}</strong>) manifiesta bajo juramento que los fondos y recursos involucrados en la amortización del crédito solicitado provienen y provendrán exclusivamente de actividades lícitas vinculadas a su actividad de <strong>{{applicant.occupation}}</strong>.
    </p>
  </div>

  <div class="pt-12 mt-8 border-t border-slate-200">
    <p class="text-xs font-bold text-navy">{{applicant.full_name}}</p>
    <p class="text-[10px] text-slate-500">CI: {{applicant.document_id}} · {{dates.today_formatted}}</p>
  </div>
</div>
`,
  },

  // 6. Ficha del solicitante
  {
    name: 'Ficha Integral del Solicitante',
    slug: 'ficha-solicitante',
    description: 'Resumen ejecutivo con antecedentes, contacto e ingresos del titular.',
    category: 'solicitud',
    document_type: 'ficha_solicitante',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: false,
    is_global: true,
    required_fields: ['applicant.full_name', 'applicant.document_id', 'applicant.email', 'applicant.monthly_income'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <div class="border-b-2 border-navy pb-3 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Ficha Resumen del Solicitante</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <div class="grid grid-cols-2 gap-4 text-xs mb-6">
    <div><strong>Nombre:</strong> {{applicant.full_name}}</div>
    <div><strong>Cédula:</strong> {{applicant.document_id}}</div>
    <div><strong>Email:</strong> {{applicant.email}}</div>
    <div><strong>Teléfono:</strong> {{applicant.phone}}</div>
    <div><strong>Domicilio:</strong> {{applicant.address}}</div>
    <div><strong>Departamento:</strong> {{applicant.department}}</div>
    <div><strong>Ocupación:</strong> {{applicant.occupation}}</div>
    <div><strong>Ingresos Mensuales:</strong> {{applicant.monthly_income}}</div>
  </div>

  {{#if spouse.full_name}}
  <div class="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
    <h3 class="font-bold text-navy mb-1">Datos del Cónyuge:</h3>
    <p>{{spouse.full_name}} · CI: {{spouse.document_id}}</p>
  </div>
  {{/if}}
</div>
`,
  },

  // 7. Ficha del inmueble
  {
    name: 'Ficha Técnica del Inmueble en Garantía',
    slug: 'ficha-inmueble',
    description: 'Ficha catastral, superficie, ubicación y fotos del bien ofrecido.',
    category: 'inmueble',
    document_type: 'ficha_inmueble',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: false,
    is_global: true,
    required_fields: ['property.padron', 'property.department', 'property.address', 'property.estimated_value'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <div class="border-b-2 border-navy pb-3 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Ficha Técnica del Inmueble</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <div class="grid grid-cols-2 gap-4 text-xs mb-6">
    <div><strong>Padrón:</strong> {{property.padron}}</div>
    <div><strong>Tipo:</strong> {{property.type}}</div>
    <div><strong>Dirección:</strong> {{property.address}}</div>
    <div><strong>Ubicación:</strong> {{property.neighborhood}}, {{property.city}} ({{property.department}})</div>
    <div><strong>Superficie:</strong> {{property.area_m2}} m²</div>
    <div><strong>Valor Estimado:</strong> {{property.estimated_value}}</div>
    <div><strong>Tasación Preliminar:</strong> {{property.appraised_value}}</div>
    <div><strong>Situación Jurídica:</strong> {{property.legal_status}}</div>
  </div>
</div>
`,
  },

  // 8. Resumen de operación
  {
    name: 'Resumen Ejecutivo de la Operación Crediticia',
    slug: 'resumen-operacion',
    description: 'Cuadro global de la operación para análisis de riesgo y comité.',
    category: 'financiero',
    document_type: 'resumen_operacion',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: false,
    is_global: true,
    required_fields: ['case.code', 'applicant.full_name', 'loan.requested_amount', 'property.estimated_value'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <div class="border-b-2 border-navy pb-3 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Resumen Ejecutivo de Operación</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <div class="bg-slate-50 p-4 rounded border border-slate-200 grid grid-cols-3 gap-4 text-xs mb-6">
    <div><span class="text-slate-500 block">Monto Solicitado:</span><strong class="text-navy text-sm">{{loan.requested_amount}}</strong></div>
    <div><span class="text-slate-500 block">Garantía Inmueble:</span><strong class="text-navy text-sm">{{property.estimated_value}}</strong></div>
    <div><span class="text-slate-500 block">LTV:</span><strong class="text-brand-green text-sm">{{loan.ltv}}</strong></div>
  </div>

  <div class="text-xs space-y-2">
    <p><strong>Titular:</strong> {{applicant.full_name}} (CI: {{applicant.document_id}})</p>
    <p><strong>Inmueble:</strong> Padrón {{property.padron}} en {{property.department}}</p>
    <p><strong>Plazo:</strong> {{loan.term_months}} meses · Modalidad: {{loan.repayment_mode}}</p>
  </div>
</div>
`,
  },

  // 9. Oferta de crédito
  {
    name: 'Propuesta / Oferta Formal de Financiamiento',
    slug: 'oferta-credito',
    description: 'Carta de propuesta económica formal emitida por el prestamista.',
    category: 'financiero',
    document_type: 'oferta_credito',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: true,
    is_global: true,
    required_fields: ['loan.approved_amount', 'loan.interest_rate', 'loan.term_months', 'applicant.full_name'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <div class="border-b-2 border-navy pb-3 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Oferta Formal de Crédito Hipotecario</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <p class="text-xs mb-4">Estimado/a <strong>{{applicant.full_name}}</strong>:</p>

  <p class="text-xs mb-4">
    Nos complace presentarle la propuesta formal de financiamiento con garantía hipotecaria bajo las siguientes condiciones principales:
  </p>

  <div class="bg-slate-50 p-4 rounded border border-slate-200 grid grid-cols-2 gap-4 text-xs mb-6">
    <div><strong>Monto Ofrecido:</strong> {{loan.approved_amount}}</div>
    <div><strong>Plazo:</strong> {{loan.term_months}} meses</div>
    <div><strong>Tasa de Interés Anual:</strong> {{loan.interest_rate}}</div>
    <div><strong>Cuota Mensual Estimada:</strong> {{loan.monthly_payment}}</div>
    <div><strong>Modalidad de Pago:</strong> {{loan.repayment_mode}}</div>
    <div><strong>Garantía:</strong> Padrón N° {{property.padron}} ({{property.department}})</div>
  </div>

  <p class="text-xs text-slate-500">Esta oferta mantiene validez por 10 días corridos a contar desde la fecha de emisión.</p>
</div>
`,
  },

  // 10. Aceptación de condiciones
  {
    name: 'Aceptación Formal de Condiciones de Crédito',
    slug: 'aceptacion-condiciones',
    description: 'Aceptación expresa firmada por el solicitante para pasar a etapa notarial.',
    category: 'solicitud',
    document_type: 'aceptacion_condiciones',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: true,
    is_global: true,
    required_fields: ['applicant.full_name', 'applicant.document_id', 'loan.approved_amount'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <h1 class="text-lg font-bold text-navy uppercase border-b border-navy pb-3 mb-4">Aceptación de Condiciones de Crédito</h1>
  <div class="space-y-4 text-xs text-slate-700">
    <p>
      Yo, <strong>{{applicant.full_name}}</strong> (CI: <strong>{{applicant.document_id}}</strong>), declaro aceptar en todos sus términos la oferta de crédito por el monto de <strong>{{loan.approved_amount}}</strong> en un plazo de <strong>{{loan.term_months}} meses</strong>, prestando mi conformidad para avanzar a la fase de escrituración notarial.
    </p>
  </div>
  <div class="pt-12 mt-8 border-t border-slate-200">
    <p class="text-xs font-bold text-navy">{{applicant.full_name}}</p>
    <p class="text-[10px] text-slate-500">Firma de conformidad · {{dates.today_formatted}}</p>
  </div>
</div>
`,
  },

  // 11. Instrucciones al escribano
  {
    name: 'Instrucciones y Minuta para Escribano Actuante',
    slug: 'instrucciones-escribano',
    description: 'Paquete de datos técnicos, partes y cláusulas para la redacción de la hipoteca.',
    category: 'notarial',
    document_type: 'instrucciones_escribano',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: false,
    is_global: true,
    required_fields: ['property.padron', 'applicant.full_name', 'loan.requested_amount'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <div class="border-b-2 border-navy pb-3 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Instrucciones al Escribano Actuante</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <div class="space-y-4 text-xs">
    <section>
      <h3 class="font-bold text-navy mb-1">1. PARTE DEUDORA / HIPOTECANTE:</h3>
      <p>{{applicant.full_name}} · CI {{applicant.document_id}} · Domicilio: {{applicant.address}}, {{applicant.department}}</p>
    </section>

    <section>
      <h3 class="font-bold text-navy mb-1">2. INMUEBLE A GRAVAR:</h3>
      <p>Padrón N° {{property.padron}} · Ubicación: {{property.address}}, {{property.city}}, {{property.department}} · Superficie: {{property.area_m2}} m²</p>
    </section>

    <section>
      <h3 class="font-bold text-navy mb-1">3. CONDICIONES DEL MUTUO HIPOTECARIO:</h3>
      <p>Monto: {{loan.requested_amount}} · Plazo: {{loan.term_months}} meses · Tasa: {{loan.interest_rate}}</p>
    </section>
  </div>
</div>
`,
  },

  // 12. Checklist documental
  {
    name: 'Checklist de Legajo y Documentación Registral',
    slug: 'checklist-documental',
    description: 'Control de recaudos, certificados registrales y títulos para formalización.',
    category: 'notarial',
    document_type: 'checklist_documental',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: false,
    is_global: true,
    required_fields: ['case.code', 'property.padron'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <div class="border-b-2 border-navy pb-3 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Checklist Documental y Registral</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <ul class="text-xs space-y-2.5">
    <li class="flex items-center space-x-2"><span>[✓]</span> <span>Cédula de Identidad del solicitante (vigente).</span></li>
    <li class="flex items-center space-x-2"><span>[✓]</span> <span>Título de propiedad o copia cotejada del Padrón {{property.padron}}.</span></li>
    <li class="flex items-center space-x-2"><span>[ ]</span> <span>Certificado Registral de Actos Personales.</span></li>
    <li class="flex items-center space-x-2"><span>[ ]</span> <span>Certificado Registral Inmobiliario de Gravámenes.</span></li>
    <li class="flex items-center space-x-2"><span>[ ]</span> <span>Cédula Catastral informada y al día.</span></li>
    <li class="flex items-center space-x-2"><span>[ ]</span> <span>Certificado de libre deuda de Contribución Inmobiliaria y Tributos.</span></li>
  </ul>
</div>
`,
  },

  // 13. Resumen de tasación
  {
    name: 'Informe Preliminar de Valuación Inmobiliaria',
    slug: 'resumen-tasacion',
    description: 'Informe preliminar de tasación con comparables y rango de valor de garantía.',
    category: 'tasacion',
    document_type: 'resumen_tasacion',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: false,
    is_global: true,
    required_fields: ['property.padron', 'property.estimated_value'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <div class="border-b-2 border-navy pb-3 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Informe Preliminar de Valuación</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <div class="grid grid-cols-2 gap-4 text-xs mb-4">
    <div><strong>Inmueble:</strong> Padrón {{property.padron}} ({{property.department}})</div>
    <div><strong>Superficie:</strong> {{property.area_m2}} m²</div>
    <div><strong>Valor Declarado:</strong> {{property.estimated_value}}</div>
    <div><strong>Valoración Preliminar:</strong> {{property.appraised_value}}</div>
  </div>

  <div class="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
    <p><strong>LTV Cobertura:</strong> {{loan.ltv}} sobre valor estimado de garantía.</p>
  </div>
</div>
`,
  },

  // 14. Comunicación de aprobación
  {
    name: 'Comunicación Oficial de Aprobación Crediticia',
    slug: 'comunicacion-aprobacion',
    description: 'Notificación oficial de aprobación de la operación para el cliente.',
    category: 'comunicacion',
    document_type: 'comunicacion_aprobacion',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: false,
    is_global: true,
    required_fields: ['applicant.full_name', 'loan.requested_amount', 'case.code'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <div class="border-b-2 border-navy pb-3 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Aprobación de Solicitud de Crédito</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <p class="text-xs mb-4">Estimado/a <strong>{{applicant.full_name}}</strong>:</p>
  <p class="text-xs mb-4">
    Nos complace comunicarle que su solicitud de crédito hipotecario por el monto de <strong>{{loan.requested_amount}}</strong> ha sido <strong>APROBADA</strong> satisfactoriamente.
  </p>
  <p class="text-xs text-slate-600">Nos pondremos en contacto a la brevedad para coordinar la firma notarial.</p>
</div>
`,
  },

  // 15. Comunicación de observaciones
  {
    name: 'Comunicación de Observaciones y Recaudos Pendientes',
    slug: 'comunicacion-observaciones',
    description: 'Detalle de documentación complementaria requerida para continuar el trámite.',
    category: 'comunicacion',
    document_type: 'comunicacion_observaciones',
    status: 'active',
    version: 1,
    output_format: 'pdf',
    requires_signature: false,
    is_global: true,
    required_fields: ['applicant.full_name', 'case.code'],
    template_content: `
<div class="docflow-document font-sans text-slate-800 text-sm p-8 leading-relaxed">
  <div class="border-b-2 border-navy pb-3 mb-6 flex justify-between items-center">
    <h1 class="text-lg font-bold text-navy uppercase">Observaciones del Expediente</h1>
    <span class="font-mono text-xs text-slate-500">{{case.code}}</span>
  </div>

  <p class="text-xs mb-4">Estimado/a <strong>{{applicant.full_name}}</strong>:</p>
  <p class="text-xs mb-4">
    Le informamos que para dar continuidad al análisis de su solicitud <strong>{{case.code}}</strong> se requiere completar o subsanar la siguiente documentación:
  </p>
  <div class="p-4 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 mb-4">
    <p>• Comprobante de ingresos actualizado o certificado contable con timbre profesional.</p>
    <p>• Copia legible del título de propiedad o plano de mensura del Padrón {{property.padron}}.</p>
  </div>
</div>
`,
  },
];
