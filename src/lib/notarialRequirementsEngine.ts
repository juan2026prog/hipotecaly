// ==============================================================================
// HIPOTECALY: Notarial Requirements Engine (Motor Notarial Dinámico Uruguayo)
// Catálogo Maestro Notarial Integral: Estados Civiles, Titularidades,
// Procedencias de Inmuebles, Personas Jurídicas, Representación y Propiedad Horizontal.
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
  | 'sociedad_por_acciones_simplificada'
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
  hasPowerOfAttorney?: boolean;
  hasPriorMortgage?: boolean;
}

export class NotarialRequirementsEngine {
  public static generateRequirements(context: CaseNotarialContext): DynamicNotaryRequirement[] {
    const reqs: DynamicNotaryRequirement[] = [];

    // ==========================================
    // 1. IDENTIDAD Y DEBIDA DILIGENCIA (Didit KYC)
    // ==========================================
    reqs.push({
      id: 'id-ci-titular',
      category: 'identidad',
      title: 'Cédula de Identidad Vigente y Cotejo Biométrico',
      description: 'Verificación biométrica Didit (prueba de vida, reconocimiento facial y autenticidad del documento DNIC).',
      is_blocking: true,
      responsible: 'Cliente',
      status: 'validado',
      legal_basis: 'Ley 18.600 y Decreto 436/011',
      ai_finding: {
        summary: 'CI 4.218.930-5 vigente. Prueba de vida aprobada con score de confianza 99.4%.',
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
        description: 'Apostilla de La Haya y traducción oficial por Traductor Público uruguayo (Ley 15.441).',
        is_blocking: true,
        responsible: 'Cliente',
        status: 'requiere_revision',
        legal_basis: 'Convención de La Haya de 1961 y Ley 15.441',
      });
    }

    if (context.hasPowerOfAttorney) {
      reqs.push({
        id: 'rep-poder-especial',
        category: 'identidad',
        title: 'Poder Especial para Hipotecar y Testimonio Notarial de Vigencia',
        description: 'Poder otorgado en escritura pública con facultades expresas para gravar bienes inmuebles e inscribir hipotecas.',
        is_blocking: true,
        responsible: 'Escribano',
        status: 'validado',
        legal_basis: 'Código Civil Arts. 2056 y 2057',
        ai_finding: {
          summary: 'Poder autorizado el 10/02/2025 ante Esc. J. Gómez. Facultades expresas de gravamen hipotecario verificadas.',
          sources: ['Testimonio de Poder Especial Matriz'],
          confidence: 0.97,
          match: true,
        },
      });
    }

    // ==========================================
    // 2. ESTADO CIVIL Y RÉGIMEN PATRIMONIAL
    // ==========================================
    switch (context.maritalStatus) {
      case 'soltero':
        reqs.push({
          id: 'ec-soltero',
          category: 'estado_civil',
          title: 'Declaración Notarial de Estado Civil Soltero',
          description: 'Constancia notarial en el cuerpo de la escritura sobre inexistencia de impedimentos matrimoniales o uniones concubinarias con efectos reales.',
          is_blocking: false,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Código Civil Art. 83',
        });
        break;

      case 'casado_legal':
        reqs.push({
          id: 'ec-matrimonio-legal',
          category: 'estado_civil',
          title: 'Partida de Matrimonio y Consentimiento Conyugal (Art. 1801 C.C.)',
          description: 'Cotejo de partida de matrimonio. Si el bien fue adquirido constante el matrimonio, se requiere comparecencia del cónyuge.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Código Civil Arts. 1955 y 1801',
          ai_finding: {
            summary: 'Matrimonio inscripto en Of. 3 Montevideo el 12/04/2012. Comparecencia de ambos cónyuges requerida.',
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
          description: 'Testimonio con constancia de inscripción en el Registro de Personas Sección Regímenes Matrimoniales.',
          is_blocking: true,
          responsible: 'Cliente',
          status: 'requiere_revision',
          legal_basis: 'Ley 10.783 y Ley 16.871 Art. 29',
          ai_finding: {
            summary: 'Escritura del 14/05/2018 autorizada por Esc. Roberto Gómez. Inscripta en Actos Personales con el N.º 4512/2018.',
            sources: ['Testimonio de Capitulaciones (PDF)', 'Certificado DGR Actos Personales'],
            confidence: 0.92,
            match: true,
          },
        });
        break;

      case 'separacion_bienes':
        reqs.push({
          id: 'ec-separacion-bienes',
          category: 'estado_civil',
          title: 'Sentencia de Separación Judicial de Bienes e Inscripción',
          description: 'Sentencia judicial ejecutoriada e inscripta en Registro de Actos Personales.',
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
          title: 'Disolución y Liquidación de Sociedad Conyugal (Partición Inscripta)',
          description: 'Escritura pública de partición debidamente inscripta en el Registro de la Propiedad Sección Inmobiliaria.',
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
          title: 'Partida de Defunción e Inscripción de Resultancias de Autos Sucesorios',
          description: 'Declaratoria de herederos del cónyuge causante y adjudicación de la cuota parte indivisa.',
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
          title: 'Sentencia Judicial de Reconocimiento de Unión Concubinaria (Ley 18.246)',
          description: 'Inscripción en el Registro de Actos Personales y acreditación de régimen patrimonial.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Ley 18.246 Art. 5',
        });
        break;

      case 'union_concubinaria_no_reconocida':
        reqs.push({
          id: 'ec-union-no-reconocida',
          category: 'estado_civil',
          title: 'Declaración Notarial de Situación de Convivencia',
          description: 'Declaración jurada notarial de no existencia de derechos reales adquiridos en comunidad concubinaria.',
          is_blocking: false,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Ley 18.246',
        });
        break;

      case 'matrimonio_extranjero':
        reqs.push({
          id: 'ec-matrimonio-extranjero',
          category: 'estado_civil',
          title: 'Partida de Matrimonio Extranjera Legalizada / Apostillada',
          description: 'Apostilla de La Haya y verificación de régimen matrimonial aplicable según domicilio conyugal (Ley 19.920 DIPr).',
          is_blocking: true,
          responsible: 'Cliente',
          status: 'requiere_revision',
          legal_basis: 'Ley 19.920 (Derecho Internacional Privado)',
        });
        break;

      default:
        break;
    }

    // ==========================================
    // 3. TITULARIDAD Y PERSONERÍA
    // ==========================================
    switch (context.ownership) {
      case 'propietario_unico':
        reqs.push({
          id: 'tit-propietario-unico',
          category: 'titularidad',
          title: 'Acreditación de Titularidad Dominial 100%',
          description: 'Verificación de que el deudor o hipotecante ostenta la totalidad del dominio sobre el inmueble.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Código Civil Art. 486',
        });
        break;

      case 'copropiedad':
        reqs.push({
          id: 'tit-copropiedad',
          category: 'titularidad',
          title: 'Consentimiento Notarial de la Totalidad de Copropietarios (Condominio)',
          description: 'Para gravar la totalidad del bien se requiere la firma de todos los condóminos (Art. 1755 C.C.).',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'requiere_revision',
          legal_basis: 'Código Civil Art. 1755',
        });
        break;

      case 'nuda_propiedad_usufructo':
        reqs.push({
          id: 'tit-usufructo',
          category: 'titularidad',
          title: 'Comparecencia Conjunta de Nudo Propietario y Usufructuario',
          description: 'Para otorgar garantía hipotecaria plena sobre el dominio completo deben comparecer el nudo propietario y el usufructuario.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'requiere_revision',
          legal_basis: 'Código Civil Arts. 493 y 2322',
        });
        break;

      case 'garante_tercero_hipotecante':
        reqs.push({
          id: 'tit-tercero-hipotecante',
          category: 'titularidad',
          title: 'Escritura con Comparecencia de Tercero Garante Hipotecante',
          description: 'Diferenciación expresa en la matriz entre la calidad de Deudor Principal del mutuo y Propietario Garante Hipotecario.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Código Civil Art. 2329',
        });
        break;

      case 'sociedad_anonima':
      case 'sociedad_responsabilidad_limitada':
      case 'sociedad_por_acciones_simplificada':
        reqs.push({
          id: 'tit-persona-juridica',
          category: 'titularidad',
          title: 'Certificado Notarial de Personería, Vigencia y Representación Social',
          description: 'Estatuto/Contrato social, inscripción en Registro de Comercio (DGR), libro de actas de asamblea/directorio y control de beneficiario final (Ley 19.484).',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Ley 16.060, Ley 19.820 (SAS) y Ley 19.484',
          ai_finding: {
            summary: 'Sociedad inscripta en Registro de Personas Jurídicas. Representante facultado según acta de directorio vigente.',
            sources: ['Estatuto Social', 'Certificado Notarial de Vigencia'],
            confidence: 0.98,
            match: true,
          },
        });
        break;

      case 'fideicomiso':
        reqs.push({
          id: 'tit-fideicomiso',
          category: 'titularidad',
          title: 'Contrato de Fideicomiso e Instrucciones del Fiduciario',
          description: 'Contrato inscripto en DGR y verificación de facultades fiduciarias de disposición y gravamen.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'requiere_revision',
          legal_basis: 'Ley 17.703',
        });
        break;

      default:
        break;
    }

    // ==========================================
    // 4. PROCEDENCIA DEL INMUEBLE (TRACTO 30 AÑOS)
    // ==========================================
    switch (context.propertyOrigin) {
      case 'compraventa':
        reqs.push({
          id: 'proc-compraventa',
          category: 'titularidad',
          title: 'Título Matriz de Adquisición por Compraventa y Tradición',
          description: 'Escritura original o primera copia con constancia de pago de ITP, IRPF y timbres notariales.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Código Civil Art. 1661',
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
          title: 'Certificado de Resultancias de Autos Sucesorios Inscripto en DGR',
          description: 'Acreditación de apertura judicial, declaratoria de herederos, pago de ITP sucesorio y tracto sucesivo.',
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
          title: 'Estudio de Título Gratuito (Donación) y Control de Oficiosidad',
          description: 'Análisis de prescripción de acciones de reducción de donación por herederos forzosos (Art. 1626 C.C.).',
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
          description: 'Cotejo de indivisión previa y adjudicación material del padrón matriz o unidad.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
        });
        break;

      case 'remate':
        reqs.push({
          id: 'proc-remate',
          category: 'titularidad',
          title: 'Escritura de Aprobación de Remate Judicial y Mandamiento de Posesión',
          description: 'Auto judicial de aprobación de remate, cancelación de gravámenes anteriores y protocolización.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Código General del Proceso Art. 387',
        });
        break;

      case 'prescripcion':
        reqs.push({
          id: 'proc-prescripcion',
          category: 'titularidad',
          title: 'Sentencia Firme de Prescripción Adquisitiva Treintenaria',
          description: 'Inscripción registral de la sentencia definitiva de usucapión y plano de mensura inscripto.',
          is_blocking: true,
          responsible: 'Escribano',
          status: 'validado',
          legal_basis: 'Código Civil Art. 1211',
        });
        break;

      default:
        break;
    }

    // ==========================================
    // 5. CATASTRO Y TRIBUTOS INMOBILIARIOS
    // ==========================================
    reqs.push({
      id: 'cat-cedula',
      category: 'catastro',
      title: 'Cédula Catastral Informada (DNC)',
      description: 'Verificación del valor real, vigencia y coincidencia de superficie catastral vs. título.',
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

    if (context.cadastreType === 'propiedad_horizontal' || context.cadastreType === 'incorporacion_ph') {
      reqs.push({
        id: 'cat-ph-reglamento',
        category: 'catastro',
        title: 'Reglamento de Copropiedad y Plano de Mensura PH',
        description: 'Plano definitivo inscripto en DNC, porcentaje de copropiedad y póliza de seguro de incendio de partes comunes.',
        is_blocking: true,
        responsible: 'Escribano',
        status: 'validado',
        legal_basis: 'Ley 10.751 y Ley 14.261',
      });
    }

    reqs.push({
      id: 'fisc-contribucion-primaria',
      category: 'fiscal',
      title: 'Certificados de Libre de Deuda: Contribución Inmobiliaria y Primaria',
      description: 'Certificado Único Departamental al día y constancia de pago de Impuesto de Primaria (DGI).',
      is_blocking: true,
      responsible: 'Backoffice',
      status: 'validado',
    });

    // ==========================================
    // 6. REGISTROS PÚBLICOS (DGR)
    // ==========================================
    reqs.push({
      id: 'reg-inmobiliaria',
      category: 'registral',
      title: 'Certificado del Registro de la Propiedad Sección Inmobiliaria',
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
      description: 'Control de inhibiciones generales de bienes, embargos genéricos e interdicciones de las partes.',
      is_blocking: true,
      responsible: 'Escribano',
      status: 'requiere_revision',
      legal_basis: 'Ley 16.871 Art. 38',
      ai_finding: {
        summary: 'Certificado solicitado. Requiere revisión final notarial por ampliación de plazo.',
        sources: ['DGR Actos Personales'],
        confidence: 0.85,
        match: false,
      },
    });

    if (context.hasPriorMortgage) {
      reqs.push({
        id: 'reg-cancelacion-hipoteca',
        category: 'registral',
        title: 'Escritura de Cancelación de Hipoteca Previa / Posposición de Rango',
        description: 'Cancelación simultánea o constancia de consentimiento del acreedor anterior para garantizar Primer Grado.',
        is_blocking: true,
        responsible: 'Escribano',
        status: 'requiere_revision',
        legal_basis: 'Código Civil Art. 2340',
      });
    }

    return reqs;
  }
}
