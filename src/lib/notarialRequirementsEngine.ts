// ==============================================================================
// HIPOTECALY: Notarial Requirements Engine (Motor Notarial Dinámico Uruguayo)
// Genera dinámicamente los requisitos documentales, catastrales, registrales y
// de representación según la tipología del bien, estado civil y procedencia.
// ==============================================================================

export type MaritalStatusType =
  | 'soltero'
  | 'casado_legal'
  | 'casado_capitulaciones'
  | 'separacion_bienes'
  | 'sociedad_conyugal_disuelta'
  | 'divorciado'
  | 'viudo'
  | 'union_concubinaria_reconocida'
  | 'union_concubinaria_no_reconocida'
  | 'matrimonio_extranjero';

export type PropertyOriginType =
  | 'compraventa'
  | 'sucesion'
  | 'donacion'
  | 'particion'
  | 'adjudicacion'
  | 'remate'
  | 'prescripcion'
  | 'fideicomiso'
  | 'disolucion_conyugal';

export type OwnershipType =
  | 'propietario_unico'
  | 'copropiedad'
  | 'matrimonio'
  | 'nuda_propiedad_usufructo'
  | 'sociedad_anonima'
  | 'sociedad_responsabilidad_limitada'
  | 'fideicomiso'
  | 'garante_tercero_hipotecante';

export type PropertyCadastreType = 'comun' | 'propiedad_horizontal' | 'incorporacion_ph' | 'rural';

export interface DynamicNotaryRequirement {
  id: string;
  category: 'identidad' | 'estado_civil' | 'titularidad' | 'catastro' | 'fiscal' | 'registral' | 'operacion' | 'firma';
  title: string;
  description: string;
  is_blocking: boolean;
  responsible: 'Escribano' | 'Backoffice' | 'Cliente' | 'Acreedor';
  status: 'validado' | 'requiere_revision' | 'pendiente_documento' | 'observado';
  legal_basis?: string;
  ai_finding?: {
    summary: string;
    sources: string[];
    confidence: number;
    match: boolean;
  };
}

export interface CaseNotarialContext {
  maritalStatus: MaritalStatusType;
  propertyOrigin: PropertyOriginType;
  ownership: OwnershipType;
  cadastreType: PropertyCadastreType;
  isBorrowerOwner: boolean;
  isLenderCompany: boolean;
  hasForeignDocuments?: boolean;
}

export class NotarialRequirementsEngine {
  public static generateRequirements(context: CaseNotarialContext): DynamicNotaryRequirement[] {
    const reqs: DynamicNotaryRequirement[] = [];

    // 1. IDENTIDAD & CAPACIDAD
    reqs.push({
      id: 'id-ci-titular',
      category: 'identidad',
      title: 'Cédula de Identidad de las Partes Vigente',
      description: 'Cotejo biométrico y verificación con Dirección Nacional de Identificación Civil.',
      is_blocking: true,
      responsible: 'Cliente',
      status: 'validado',
      legal_basis: 'Ley 18.600 y normativa DNIC',
      ai_finding: {
        summary: 'CI 4.218.930-5 vigente hasta 14/05/2031. Biometría facial con score 99.4%.',
        sources: ['Didit Biometría', 'Documento Escaneado DNIC'],
        confidence: 0.99,
        match: true,
      },
    });

    if (context.hasForeignDocuments) {
      reqs.push({
        id: 'id-doc-extranjero',
        category: 'identidad',
        title: 'Documentación Extranjera Apostillada y Traducida',
        description: 'Apostilla de La Haya y traducción por Traductor Público Nacional cuando corresponda.',
        is_blocking: true,
        responsible: 'Cliente',
        status: 'requiere_revision',
        legal_basis: 'Convención de La Haya 1961 y Ley 15.441',
      });
    }

    // 2. ESTADO CIVIL Y RÉGIMEN PATRIMONIAL
    switch (context.maritalStatus) {
      case 'soltero':
        reqs.push({
          id: 'ec-soltero',
          category: 'estado_civil',
          title: 'Declaración de Estado Civil Soltero',
          description: 'Constancia de no existencia de matrimonio anterior ni unión concubinaria con efectos patrimoniales.',
          is_blocking: false,
          responsible: 'Escribano',
          status: 'validado',
        });
        break;

      case 'casado_legal':
        reqs.push({
          id: 'ec-matrimonio-legal',
          category: 'estado_civil',
          title: 'Partida de Matrimonio y Calificación del Inmueble (Propio vs. Ganancial)',
          description: 'Verificar si el bien fue adquirido a título oneroso durante el matrimonio o por causa lucrativa (propio). Consentimiento conyugal Art. 1801 C.C.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Código Civil Arts. 1955 y 1801',
          ai_finding: {
            summary: 'Matrimonio inscripto en Of. 3 Montevideo el 12/04/2012. Adquisición posterior a título oneroso requiere consentimiento.',
            sources: ['Partida Matrimonio Acta 412', 'Escritura Compraventa 2014'],
            confidence: 0.97,
            match: true,
          },
        });
        break;

      case 'casado_capitulaciones':
        reqs.push({
          id: 'ec-capitulaciones',
          category: 'estado_civil',
          title: 'Escritura de Capitulaciones Matrimoniales Inscriptas',
          description: 'Testimonio de capitulaciones con constancia de inscripción en Registro de Personas (Regímenes Matrimoniales).',
          is_blocking: true,
          responsible: 'Cliente',
          status: 'requiere_revision',
          legal_basis: 'Ley 10.783 y Ley 16.871 Art. 29',
          ai_finding: {
            summary: 'Escritura de fecha 05/11/2015 autorizada por Esc. J. Díaz. Pendiente cotejo con folio de inscripción registral.',
            sources: ['Testimonio Capitulaciones'],
            confidence: 0.88,
            match: false,
          },
        });
        break;

      case 'separacion_bienes':
        reqs.push({
          id: 'ec-separacion-bienes',
          category: 'estado_civil',
          title: 'Sentencia de Separación Judicial de Bienes e Inscripción',
          description: 'Copia autenticada de sentencia firme y certificado de inscripción registral en Regímenes Matrimoniales.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Código Civil Art. 2004',
        });
        break;

      case 'sociedad_conyugal_disuelta':
      case 'divorciado':
        reqs.push({
          id: 'ec-disolucion-particion',
          category: 'estado_civil',
          title: 'Disolución de Sociedad Conyugal y Partición / Adjudicación',
          description: 'Escritura pública de partición judicial o extrajudicial debidamente inscripta en Registro de la Propiedad.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'requiere_revision',
          legal_basis: 'Código Civil Art. 1115 y Ley 16.871',
        });
        break;

      case 'viudo':
        reqs.push({
          id: 'ec-viudez-sucesion',
          category: 'estado_civil',
          title: 'Partida de Defunción y Certificado de Resultancias de Autos (Sucesión)',
          description: 'Declaratoria de herederos e inscripción de resultancias de autos sucesorios sobre la cuota parte indivisa.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'requiere_revision',
          legal_basis: 'Código Civil Art. 1039 y Ley 16.871',
        });
        break;

      case 'union_concubinaria_reconocida':
        reqs.push({
          id: 'ec-union-concubinaria',
          category: 'estado_civil',
          title: 'Sentencia Judicial de Reconocimiento de Unión Concubinaria',
          description: 'Constancia de inscripción en el Registro de Actos Personales y afectación de bienes según Ley 18.246.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Ley 18.246 Art. 5',
        });
        break;

      default:
        break;
    }

    // 3. PROCEDENCIA DEL INMUEBLE (TRACTO SUCESIVO 30 AÑOS)
    switch (context.propertyOrigin) {
      case 'compraventa':
        reqs.push({
          id: 'proc-compraventa',
          category: 'titularidad',
          title: 'Título de Adquisición por Compraventa y Tradición',
          description: 'Escritura original o primera copia con constancia de pago de ITP, IRPF y timbre notarial.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          ai_finding: {
            summary: 'Compraventa del 22/08/2014 autorizada por Esc. Alberto Rossi. Folio 45 Libro 12 Registro Inmobiliario.',
            sources: ['Escritura 2014', 'Matriz DGR'],
            confidence: 0.98,
            match: true,
          },
        });
        break;

      case 'sucesion':
        reqs.push({
          id: 'proc-sucesion',
          category: 'titularidad',
          title: 'Certificado de Resultancias de Autos Sucesorios Inscripto',
          description: 'Verificar pago de ITP por transmisiones sucesorias e inexistencia de herederos preteridos.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'requiere_revision',
          legal_basis: 'Código General del Proceso y Ley 16.871',
        });
        break;

      case 'donacion':
        reqs.push({
          id: 'proc-donacion',
          category: 'titularidad',
          title: 'Estudio de Título Gratuito (Donación) y Riesgo de Oficiosidad',
          description: 'Control de plazo de prescripción de acciones de reducción de donación por herederos forzosos (Art. 1626 C.C.).',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'observado',
          legal_basis: 'Código Civil Arts. 1626 a 1643',
        });
        break;

      case 'particion':
      case 'adjudicacion':
        reqs.push({
          id: 'proc-particion',
          category: 'titularidad',
          title: 'Escritura de Partición y Adjudicación de Hijuela',
          description: 'Cotejo de indivisión y adjudicación material del padrón matriz o unidad.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
        });
        break;

      case 'remate':
        reqs.push({
          id: 'proc-remate',
          category: 'titularidad',
          title: 'Escritura de Aprobación de Remate Judicial / Extrajudicial',
          description: 'Auto judicial de aprobación de remate, mandamiento y toma de posesión.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
        });
        break;

      default:
        break;
    }

    // 4. CATASTRO Y TRIBUTOS INMOBILIARIOS
    reqs.push({
      id: 'cat-cedula',
      category: 'catastro',
      title: 'Cédula Catastral Informada (DNC)',
      description: 'Verificar valor real, vigencia anual y coincidencia de superficie catastral vs. título.',
      is_blocking: true,
      responsible: 'Backoffice',
      status: 'validado',
      legal_basis: 'Dirección Nacional de Catastro',
      ai_finding: {
        summary: 'Padrón 145.892 · Superficie 210 m² · Valor Real $ 4.850.000. Coincidencia exacta con plano de mensura.',
        sources: ['Cédula Catastral 2026', 'Plano Agr. Juan Basso'],
        confidence: 0.99,
        match: true,
      },
    });

    if (context.cadastreType === 'propiedad_horizontal') {
      reqs.push({
        id: 'cat-ph-reglamento',
        category: 'catastro',
        title: 'Reglamento de Copropiedad y Plano de Mensura PH',
        description: 'Plano definitivo inscripto en DNC, cuota de copropiedad y póliza de incendio de áreas comunes.',
        is_blocking: true,
        responsible: 'Escribano',
        status: 'validado',
        legal_basis: 'Ley 10.751 y Ley 14.261',
      });
    }

    reqs.push({
      id: 'fisc-contribucion-primaria',
      category: 'fiscal',
      title: 'Certificados de Libre de Deuda: Contribución Inmobiliaria e Impuesto de Primaria',
      description: 'Comprobantes al día emitidos por la Intendencia Departamental y DGI.',
      is_blocking: true,
      responsible: 'Backoffice',
      status: 'validado',
    });

    // 5. REGISTROS PÚBLICOS (DGR)
    reqs.push({
      id: 'reg-inmobiliaria',
      category: 'registral',
      title: 'Certificado de Registro de la Propiedad Sección Inmobiliaria',
      description: 'Informe de gravámenes, hipotecas, embargos específicos y servidumbres sobre el padrón.',
      is_blocking: true,
      responsible: 'Escribano',
      status: 'validado',
      legal_basis: 'Ley 16.871 Art. 8',
      ai_finding: {
        summary: 'Sin hipotecas vigentes ni embargos específicos al día de la fecha. Gravamen anterior cancelado en 2018.',
        sources: ['Certificado DGR Inmobiliaria N.º 84.192'],
        confidence: 0.96,
        match: true,
      },
    });

    reqs.push({
      id: 'reg-actos-personales',
      category: 'registral',
      title: 'Certificado del Registro Nacional de Actos Personales',
      description: 'Control de inhibiciones generales de bienes, embargos genéricos e interdicciones de los titulares y deudores.',
      is_blocking: true,
      responsible: 'Escribano',
      status: 'requiere_revision',
      legal_basis: 'Ley 16.871 Art. 38',
      ai_finding: {
        summary: 'Certificado solicitado. Requiere revisión final por ampliación de plazo.',
        sources: ['DGR Actos Personales'],
        confidence: 0.85,
        match: false,
      },
    });

    return reqs;
  }
}