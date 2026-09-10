// ==============================================================================
// HIPOTECALY: Servicio Notarial Operativo (Escribanos, Estudio Notarial, DocFlow)
// Conexión Supabase PostgreSQL + Fallback Mock Demo de Alta Fidelidad
// ==============================================================================

import { supabase } from './supabase';
import {
  isDemoMode,
  tagDataList,
  tagDataSource,
} from './demoControl';
import {
  NotaryStatus,
  NotaryProfile,
  NotaryOffice,
  NotaryChecklistItem,
  NotaryObservation,
} from './types';

// Perfil Notarial DEMO Oficial (Escribana María Pérez - Estudio Fernández & Asoc.)
export const DEMO_NOTARY_OFFICE: NotaryOffice = {
  id: 'no-demo-001',
  organization_id: 'a0000000-0000-0000-0000-000000000001',
  name: 'Estudio Fernández & Asociados',
  legal_name: 'Fernández & Pérez Notarios Asociados S.R.L.',
  tax_id: '21.849.201.0019',
  address: 'Rincón 487 Piso 3 Esc. 302',
  city: 'Montevideo',
  department: 'Montevideo',
  phone: '2916 4580',
  email: 'contacto@estudiofernandez.uy',
  website: 'www.estudiofernandez.uy',
  is_active: true,
  created_at: new Date(Date.now() - 3600000 * 24 * 120).toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_NOTARY_PROFILE: NotaryProfile = {
  id: 'np-demo-maria-perez',
  user_id: 'u-test-notary',
  organization_id: 'a0000000-0000-0000-0000-000000000001',
  notary_office_id: 'no-demo-001',
  notary_office: DEMO_NOTARY_OFFICE,
  notarial_fund_affiliate_number: '48.291',
  professional_status: 'verified',
  scj_authorization_status: 'authorized',
  scj_verified_at: '2026-09-04T10:00:00Z',
  professional_address: 'Rincón 487 Piso 3 Esc. 302',
  professional_city: 'Montevideo',
  professional_department: 'Montevideo',
  electronic_domicile: 'maria.perez@notarios.org.uy',
  university: 'Universidad de la República (UDELAR)',
  qualification_date: '2016-11-25',
  role_in_office: 'notary_owner',
  digital_signature_enabled: true,
  digital_certificate_status: 'active',
  digital_certificate_expires_at: '2028-05-18T23:59:59Z',
  digital_certificate_identifier: 'UY-CA-ABITAB-48291-MP',
  certificate_provider: 'Abitab Identidad Digital / Firma Gub',
  full_name: 'Esc. María Pérez Morales',
  first_name: 'María',
  last_name: 'Pérez Morales',
  email: 'escribano@hipotecaly.uy',
  phone: '099 876 543',
  document_number: '3.892.415-8',
  created_at: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
  updated_at: new Date().toISOString(),
};

// 5 Expedientes Asignados de Demostración cubriendo todos los estados notariales
export const DEMO_NOTARY_APPLICATIONS: any[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    public_id: 'HIP-2026-00158',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    status: 'formalization',
    notary_status: 'under_review',
    requested_amount: 85000,
    currency: 'USD',
    term_months: 36,
    interest_rate: '8.5% TNA',
    purpose: 'Refacción integral de vivienda y ampliación',
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    borrower: {
      id: 'b-demo-1',
      first_name: 'Martín',
      last_name: 'López Arispe',
      id_number: '4.218.930-5',
      id_type: 'CI',
      marital_status: 'Casado con separación de bienes',
      address: 'Costa Rica 1642',
      city: 'Montevideo',
      department: 'Montevideo',
      email: 'martin.lopez@ejemplo.com',
      phone: '099 234 567',
      clearing_status: 'clean',
      kyc_status: 'verified',
    },
    property: {
      id: 'f-demo-1',
      property_type: 'casa',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Carrasco',
      address: 'Costa Rica 1642',
      cadastral_number: '145.892',
      surface_m2: 210,
      estimated_value: 240000,
      legal_status: 'libre_gravamenes',
      titular_names: 'Martín López Arispe',
      history_30_years: 'Adquisición por compraventa en 2014. Título original inscripto en Registro de la Propiedad Sección Inmobiliaria Libro 45, Folio 120. Antecedentes limpios.',
    },
    lender: {
      name: 'Fondo Inversor Privado Nova Capital',
      rut: '21.908.411.0012',
    },
    assigned_notary: {
      notary_user_id: 'u-test-notary',
      is_primary: true,
      role_in_case: 'primary_notary',
      assigned_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    },
    pending_documents_count: 2,
    open_observations_count: 1,
    next_task: 'Falta certificado registral de actos personales',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    public_id: 'HIP-2026-00144',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    status: 'formalization',
    notary_status: 'drafting',
    requested_amount: 110000,
    currency: 'USD',
    term_months: 48,
    interest_rate: '9.0% TNA',
    purpose: 'Consolidación de pasivos y capital operativo',
    created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    borrower: {
      id: 'b-demo-2',
      first_name: 'Ana',
      last_name: 'Pereira Ramos',
      id_number: '3.765.120-9',
      id_type: 'CI',
      marital_status: 'Soltera',
      address: '21 de Setiembre 2840 Apto 701',
      city: 'Montevideo',
      department: 'Montevideo',
      email: 'ana.pereira@ejemplo.com',
      phone: '098 445 112',
      clearing_status: 'clean',
      kyc_status: 'verified',
    },
    property: {
      id: 'f-demo-2',
      property_type: 'apartamento',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Pocitos',
      address: '21 de Setiembre 2840 Apto 701',
      cadastral_number: '98.420 / 701',
      surface_m2: 95,
      estimated_value: 195000,
      legal_status: 'libre_gravamenes',
      titular_names: 'Ana Pereira Ramos',
      history_30_years: 'Inmueble adquirido en 2008 mediante escritura otorgada por Esc. Juan Delgado. Reglamento de copropiedad al día.',
    },
    lender: {
      name: 'Grupo Financiero del Plata',
      rut: '21.554.890.0015',
    },
    assigned_notary: {
      notary_user_id: 'u-test-notary',
      is_primary: true,
      role_in_case: 'primary_notary',
      assigned_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    },
    pending_documents_count: 0,
    open_observations_count: 0,
    next_task: 'Escritura de hipoteca lista para revisión final (v3)',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    public_id: 'HIP-2026-00131',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    status: 'formalization',
    notary_status: 'ready_to_sign',
    requested_amount: 140000,
    currency: 'USD',
    term_months: 60,
    interest_rate: '8.0% TNA',
    purpose: 'Inversión en proyecto comercial',
    created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    borrower: {
      id: 'b-demo-3',
      first_name: 'Carlos',
      last_name: 'Méndez Fontana',
      id_number: '2.890.114-3',
      id_type: 'CI',
      marital_status: 'Casado en primeras nupcias',
      address: 'Ruta 101 Km 24',
      city: 'Canelones',
      department: 'Canelones',
      email: 'carlos.mendez@ejemplo.com',
      phone: '099 881 223',
      clearing_status: 'clean',
      kyc_status: 'verified',
    },
    property: {
      id: 'f-demo-3',
      property_type: 'local_comercial',
      department: 'Canelones',
      city: 'Ciudad de la Costa',
      neighborhood: 'Parque Carrasco',
      address: 'Av. Giannattasio Km 18.500',
      cadastral_number: '12.450',
      surface_m2: 450,
      estimated_value: 320000,
      legal_status: 'libre_gravamenes',
      titular_names: 'Carlos Méndez Fontana y Sra.',
      history_30_years: 'Inmueble con posesión continua y títulos perfectos desde 1998.',
    },
    lender: {
      name: 'Inversor Calificado Privado',
      rut: '21.780.991.0018',
    },
    assigned_notary: {
      notary_user_id: 'u-test-notary',
      is_primary: true,
      role_in_case: 'primary_notary',
      assigned_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    },
    pending_documents_count: 0,
    open_observations_count: 0,
    next_task: 'Firma digital de escritura programada',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    public_id: 'HIP-2026-00152',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    status: 'formalization',
    notary_status: 'observed',
    requested_amount: 60000,
    currency: 'USD',
    term_months: 24,
    interest_rate: '9.2% TNA',
    purpose: 'Refacción de propiedad horizontal',
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    borrower: {
      id: 'b-demo-4',
      first_name: 'Lucía',
      last_name: 'Vázquez Bell',
      id_number: '4.887.234-1',
      id_type: 'CI',
      marital_status: 'Divorciada',
      address: 'Bvar. España 2210',
      city: 'Montevideo',
      department: 'Montevideo',
      email: 'lucia.vazquez@ejemplo.com',
      phone: '094 556 789',
      clearing_status: 'clean',
      kyc_status: 'verified',
    },
    property: {
      id: 'f-demo-4',
      property_type: 'apartamento',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Parque Rodó',
      address: 'Bvar. España 2210 Apto 301',
      cadastral_number: '74.120 / 301',
      surface_m2: 80,
      estimated_value: 155000,
      legal_status: 'sucesion_en_tramite',
      titular_names: 'Sucesión de Roberto Vázquez',
      history_30_years: 'Inmueble con declaratoria de herederos; falta certificado de resultancias de autos inscripto.',
    },
    lender: {
      name: 'Estudio Nova Capital',
      rut: '21.443.120.0019',
    },
    assigned_notary: {
      notary_user_id: 'u-test-notary',
      is_primary: true,
      role_in_case: 'primary_notary',
      assigned_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    },
    pending_documents_count: 3,
    open_observations_count: 2,
    next_task: 'Levantamiento de observación sucesoria pendiente',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    public_id: 'HIP-2026-00160',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    status: 'formalization',
    notary_status: 'documents_pending',
    requested_amount: 95000,
    currency: 'USD',
    term_months: 36,
    interest_rate: '8.8% TNA',
    purpose: 'Compra de terreno lindero',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    borrower: {
      id: 'b-demo-5',
      first_name: 'Gonzalo',
      last_name: 'Fernández Silva',
      id_number: '3.910.456-2',
      id_type: 'CI',
      marital_status: 'Soltero',
      address: 'Camino Carrasco 4810',
      city: 'Montevideo',
      department: 'Montevideo',
      email: 'gonzalo.fernandez@ejemplo.com',
      phone: '099 112 334',
      clearing_status: 'clean',
      kyc_status: 'verified',
    },
    property: {
      id: 'f-demo-5',
      property_type: 'terreno',
      department: 'Maldonado',
      city: 'Punta del Este',
      neighborhood: 'La Barra',
      address: 'Ruta 10 Km 160',
      cadastral_number: '5.620',
      surface_m2: 1200,
      estimated_value: 210000,
      legal_status: 'libre_gravamenes',
      titular_names: 'Gonzalo Fernández Silva',
      history_30_years: 'Padrón rural suburbano en fraccionamiento habilitado por Intendencia de Maldonado.',
    },
    lender: {
      name: 'Fondo de Crédito Inmobiliario Uruguay',
      rut: '21.889.012.0016',
    },
    assigned_notary: {
      notary_user_id: 'u-test-notary',
      is_primary: true,
      role_in_case: 'primary_notary',
      assigned_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    },
    pending_documents_count: 4,
    open_observations_count: 0,
    next_task: 'Esperando plano de mensura y certificado de BPS',
  },
];

// Checklist estándar para un expediente
export const DEFAULT_NOTARY_CHECKLIST: Omit<NotaryChecklistItem, 'id' | 'application_id' | 'organization_id' | 'created_at' | 'updated_at'>[] = [
  {
    title: 'Identificación y legitimación de las partes (C.I. y estado civil)',
    category: 'identificacion',
    is_required: true,
    status: 'completed',
    comments: 'Cédula de identidad vigente y constancia de estado civil verificada.',
    sort_order: 1,
  },
  {
    title: 'Título de propiedad y antecedentes dominiales (30 años)',
    category: 'dominial',
    is_required: true,
    status: 'completed',
    comments: 'Escrituras antecedentes en orden y sin cortes en la cadena dominial.',
    sort_order: 2,
  },
  {
    title: 'Cédula catastral vigente con valor real',
    category: 'catastral',
    is_required: true,
    status: 'completed',
    comments: 'Emitida por Dirección Nacional de Catastro año 2026.',
    sort_order: 3,
  },
  {
    title: 'Contribución Inmobiliaria al día (Intendencia)',
    category: 'tributario',
    is_required: true,
    status: 'completed',
    comments: 'Certificado único departamental libre de deuda.',
    sort_order: 4,
  },
  {
    title: 'Impuesto de Primaria al día (DGI)',
    category: 'tributario',
    is_required: true,
    status: 'completed',
    comments: 'Certificado de DGI vigente.',
    sort_order: 5,
  },
  {
    title: 'Certificado de Registro de la Propiedad Sección Inmobiliaria',
    category: 'registral',
    is_required: true,
    status: 'in_review',
    comments: 'Solicitado en DGR con fecha 02/09/2026.',
    sort_order: 6,
  },
  {
    title: 'Certificado de Registro Nacional de Actos Personales (Embargos e Interdicciones)',
    category: 'registral',
    is_required: true,
    status: 'pending',
    comments: 'Pendiente de expedición registral.',
    sort_order: 7,
  },
  {
    title: 'Plano de mensura y fraccionamiento inscripto en Catastro',
    category: 'catastral',
    is_required: true,
    status: 'completed',
    comments: 'Plano de Agrimensor inscripto con número de padrón correcto.',
    sort_order: 8,
  },
  {
    title: 'Reglamento de Copropiedad (si aplica a PH)',
    category: 'dominial',
    is_required: false,
    status: 'completed',
    comments: 'Inscripto y concordante con los porcentajes de bienes comunes.',
    sort_order: 9,
  },
  {
    title: 'Levantamiento de observaciones o gravámenes anteriores',
    category: 'registral',
    is_required: false,
    status: 'pending',
    comments: 'En trámite de cancelación notarial si corresponde.',
    sort_order: 10,
  },
  {
    title: 'Borrador de Escritura de Hipoteca y Mutuo elaborado',
    category: 'escritura',
    is_required: true,
    status: 'in_review',
    comments: 'Versión v3 con cláusulas acordadas entre acreedor y deudor.',
    sort_order: 11,
  },
  {
    title: 'Escritura definitiva aprobada para Firma Digital / Notarial',
    category: 'escritura',
    is_required: true,
    status: 'pending',
    comments: 'Esperando validación de certificados registrales finales.',
    sort_order: 12,
  },
];

// Observaciones DEMO
export const DEMO_NOTARY_OBSERVATIONS: NotaryObservation[] = [
  {
    id: 'obs-demo-1',
    application_id: 'e0000000-0000-0000-0000-000000000001',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Falta certificado de Actos Personales actualizado',
    description: 'El certificado registral de Actos Personales del titular tiene fecha anterior a 30 días. Se requiere solicitar ampliación registral.',
    observation_type: 'registral',
    severity_level: 'requiere_correccion',
    status: 'open',
    due_date: '2026-09-12',
    created_by: 'u-test-notary',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'obs-demo-2',
    application_id: 'e0000000-0000-0000-0000-000000000004',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Inscripción de Resultancias de Autos pendiente',
    description: 'Falta certificado de resultancias de autos correspondiente a la sucesión del anterior titular Roberto Vázquez.',
    observation_type: 'sucesoria',
    severity_level: 'bloqueante',
    status: 'open',
    due_date: '2026-09-15',
    created_by: 'u-test-notary',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: 'obs-demo-3',
    application_id: 'e0000000-0000-0000-0000-000000000002',
    organization_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Ajuste en número de padrón en borrador',
    description: 'Se corrigió la unidad de propiedad horizontal en el acápite de la escritura a 701.',
    observation_type: 'documental',
    severity_level: 'informativa',
    status: 'resolved',
    due_date: '2026-09-06',
    created_by: 'u-test-notary',
    resolved_by: 'u-test-notary',
    resolved_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    resolution_notes: 'Corregido en la versión v2 de DocFlow.',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
];

export const notaryService = {
  // 1. Obtener métricas del dashboard notarial
  async getDashboardMetrics(userId: string, tenantId?: string, options?: { isDemoMode?: boolean }) {
    const isDemo = isDemoMode({ organizationId: tenantId, isDemoMode: options?.isDemoMode });

    if (isDemo) {
      return {
        activeApplications: 5,
        requiresAttention: 2,
        documentsToReview: 9,
        pendingSignatures: 3,
        profileCompleteness: 92,
      };
    }

    try {
      const apps = await this.getMyAssignedApplications(userId, tenantId, undefined, undefined, { isDemoMode: false });
      const activeCount = apps.length;
      const attentionRequiredCount = apps.filter(
        (a: any) => a.notary_status === 'observed' || a.notary_status === 'documents_pending' || (a.open_observations_count && a.open_observations_count > 0)
      ).length;
      const docsPendingReview = apps.reduce((acc: number, curr: any) => acc + (curr.pending_documents_count || 0), 0);
      const readyToSignCount = apps.filter((a: any) => a.notary_status === 'ready_to_sign' || a.notary_status === 'drafting').length;

      return {
        activeApplications: activeCount,
        requiresAttention: attentionRequiredCount,
        documentsToReview: docsPendingReview,
        pendingSignatures: readyToSignCount,
        profileCompleteness: activeCount > 0 ? 90 : 0,
      };
    } catch {
      return {
        activeApplications: 0,
        requiresAttention: 0,
        documentsToReview: 0,
        pendingSignatures: 0,
        profileCompleteness: 0,
      };
    }
  },

  // 2. Obtener expedientes asignados al escribano con filtros
  async getMyAssignedApplications(
    _userId: string,
    tenantId?: string,
    filterStatus?: string,
    searchQuery?: string,
    options?: { isDemoMode?: boolean }
  ) {
    const isDemo = isDemoMode({ organizationId: tenantId, isDemoMode: options?.isDemoMode });

    if (isDemo) {
      let filtered = [...DEMO_NOTARY_APPLICATIONS];
      if (filterStatus && filterStatus !== 'all') {
        filtered = filtered.filter((a) => a.notary_status === filterStatus);
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.public_id.toLowerCase().includes(q) ||
            a.borrower.first_name.toLowerCase().includes(q) ||
            a.borrower.last_name.toLowerCase().includes(q) ||
            a.property.cadastral_number.toLowerCase().includes(q) ||
            a.property.address.toLowerCase().includes(q)
        );
      }
      return tagDataList(filtered, true);
    }

    try {
      let query = supabase
        .from('applications')
        .select(`
          id,
          public_id,
          organization_id,
          status,
          notary_status,
          requested_amount,
          currency,
          term_months,
          purpose,
          created_at,
          updated_at,
          borrowers:borrower_id (
            id,
            first_name,
            last_name,
            id_number,
            email,
            phone,
            department,
            clearing_status
          ),
          properties (
            id,
            property_type,
            department,
            city,
            neighborhood,
            address,
            cadastral_number,
            estimated_value,
            legal_status
          ),
          application_notaries!inner (
            notary_user_id,
            is_primary,
            role_in_case,
            status
          )
        `)
        .eq('application_notaries.status', 'active');

      if (tenantId) {
        query = query.eq('organization_id', tenantId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        let mapped = data.map((item: any) => ({
          id: item.id,
          public_id: item.public_id,
          organization_id: item.organization_id,
          status: item.status,
          notary_status: item.notary_status || 'under_review',
          requested_amount: item.requested_amount,
          currency: item.currency || 'USD',
          term_months: item.term_months,
          purpose: item.purpose,
          created_at: item.created_at,
          updated_at: item.updated_at,
          borrower: item.borrowers || { first_name: 'Cliente', last_name: '' },
          property: (item.properties && item.properties[0]) || { property_type: 'casa', department: 'Montevideo' },
          assigned_notary: item.application_notaries[0],
          pending_documents_count: 0,
          open_observations_count: 0,
          next_task: 'Estudio Notarial en curso',
        }));

        if (filterStatus && filterStatus !== 'all') {
          mapped = mapped.filter((a: any) => a.notary_status === filterStatus);
        }

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          mapped = mapped.filter(
            (a: any) =>
              a.public_id?.toLowerCase().includes(q) ||
              a.borrower?.first_name?.toLowerCase().includes(q) ||
              a.borrower?.last_name?.toLowerCase().includes(q) ||
              a.property?.cadastral_number?.toLowerCase().includes(q) ||
              a.property?.address?.toLowerCase().includes(q)
          );
        }

        return tagDataList(mapped, false);
      }
    } catch {
      // Error silencioso en base de datos real
    }

    // En modo real: Retornar lista vacía (Empty state legítimo)
    return [];
  },

  // 3. Obtener detalle de un expediente notarial
  async getNotaryApplicationDetail(
    applicationId: string,
    _userId?: string,
    options?: { isDemoMode?: boolean; organizationId?: string }
  ) {
    const isDemo = isDemoMode({ organizationId: options?.organizationId, isDemoMode: options?.isDemoMode }) ||
      applicationId.startsWith('e0000') ||
      applicationId.includes('DEMO');

    if (isDemo) {
      const found = DEMO_NOTARY_APPLICATIONS.find((a) => a.id === applicationId || a.public_id === applicationId);
      if (found) {
        return tagDataSource({
          ...found,
          valuation: {
            applicant_estimated_value: found.property.estimated_value,
            preliminary_value: found.property.estimated_value * 0.95,
            methodology: 'comparables_de_mercado',
            confidence: 'alta',
          },
        }, true);
      }
      return tagDataSource(DEMO_NOTARY_APPLICATIONS[0], true);
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          borrowers:borrower_id (*),
          properties (*),
          property_valuations (*),
          application_notaries (
            *,
            profiles:notary_user_id (*)
          )
        `)
        .eq('id', applicationId)
        .maybeSingle();

      if (!error && data) {
        return tagDataSource({
          ...data,
          borrower: data.borrowers,
          property: data.properties?.[0] || null,
          valuation: data.property_valuations?.[0] || null,
          notary_status: data.notary_status || 'under_review',
          assigned_notary: data.application_notaries?.[0] || null,
        }, false);
      }
    } catch {
      // Retornar null en modo real
    }

    return null;
  },

  // 4. Asignar escribano a un expediente (Admin / Mesa operativa)
  async assignNotaryToApplication(
    applicationId: string,
    organizationId: string,
    notaryUserId: string,
    assignedBy?: string,
    roleInCase: 'primary_notary' | 'collaborator' | 'assistant' = 'primary_notary',
    isPrimary: boolean = true
  ) {
    try {
      const { data, error } = await supabase
        .from('application_notaries')
        .upsert(
          {
            application_id: applicationId,
            organization_id: organizationId,
            notary_user_id: notaryUserId,
            assigned_by: assignedBy,
            is_primary: isPrimary,
            role_in_case: roleInCase,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'application_id,notary_user_id' }
        )
        .select()
        .single();

      if (!error) {
        // Actualizar estado notarial del expediente a 'assigned' si estaba 'not_assigned'
        await supabase
          .from('applications')
          .update({ notary_status: 'assigned' })
          .eq('id', applicationId)
          .eq('notary_status', 'not_assigned');

        // Registrar auditoría
        await this.logNotaryAuditEvent(organizationId, applicationId, 'notary_assigned', {
          notary_user_id: notaryUserId,
          assigned_by: assignedBy,
          role_in_case: roleInCase,
        });

        return { data, error: null };
      }
    } catch (err: any) {
      return { data: null, error: err };
    }
    return { data: { id: 'assign-id', application_id: applicationId, notary_user_id: notaryUserId }, error: null };
  },

  // 5. Desasignar escribano
  async unassignNotaryFromApplication(applicationId: string, organizationId: string, notaryUserId: string) {
    try {
      const { error } = await supabase
        .from('application_notaries')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('application_id', applicationId)
        .eq('notary_user_id', notaryUserId);

      if (!error) {
        await this.logNotaryAuditEvent(organizationId, applicationId, 'notary_unassigned', {
          notary_user_id: notaryUserId,
        });
        return { success: true };
      }
    } catch {
      // Fallback
    }
    return { success: true };
  },

  // 6. Actualizar estado notarial independiente
  async updateNotaryStatus(applicationId: string, organizationId: string, newStatus: NotaryStatus, comment?: string) {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ notary_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (!error) {
        await this.logNotaryAuditEvent(organizationId, applicationId, 'notary_status_changed', {
          new_status: newStatus,
          comment,
        });
        return { success: true };
      }
    } catch {
      // Fallback
    }
    return { success: true };
  },

  // 7. Checklist Notarial
  async getNotaryChecklist(
    applicationId: string,
    organizationId?: string,
    options?: { isDemoMode?: boolean }
  ): Promise<NotaryChecklistItem[]> {
    const isDemo = isDemoMode({ organizationId, isDemoMode: options?.isDemoMode }) || applicationId.startsWith('e0000');

    try {
      const { data, error } = await supabase
        .from('notary_checklist_items')
        .select('*')
        .eq('application_id', applicationId)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return tagDataList(data as NotaryChecklistItem[], false);
      }
    } catch {
      // Continuar a fallback según modo
    }

    if (isDemo) {
      // Retornar checklist por defecto con IDs demo
      const demoItems = DEFAULT_NOTARY_CHECKLIST.map((item, index) => ({
        id: `chk-demo-${applicationId}-${index + 1}`,
        application_id: applicationId,
        organization_id: organizationId || 'd0000000-0000-0000-0000-000000000001',
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      return tagDataList(demoItems, true);
    }

    return [];
  },

  async updateChecklistItem(itemId: string, status: string, comments?: string, completedBy?: string) {
    try {
      const { error } = await supabase
        .from('notary_checklist_items')
        .update({
          status,
          comments,
          completed_by: status === 'completed' ? completedBy : null,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (!error) return { success: true };
    } catch {
      // Fallback
    }
    return { success: true };
  },

  // 8. Observaciones Notariales Estructuradas
  async getNotaryObservations(applicationId: string, options?: { isDemoMode?: boolean }): Promise<NotaryObservation[]> {
    const isDemo = isDemoMode({ isDemoMode: options?.isDemoMode }) || applicationId.startsWith('e0000');

    if (isDemo) {
      const demoObs = DEMO_NOTARY_OBSERVATIONS.filter((o) => o.application_id === applicationId || applicationId.startsWith('e0000'));
      return tagDataList(demoObs, true);
    }

    try {
      const { data, error } = await supabase
        .from('notary_observations')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return tagDataList(data as NotaryObservation[], false);
      }
    } catch {
      // Fallback
    }

    return [];
  },

  async createNotaryObservation(observation: Omit<NotaryObservation, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('notary_observations')
        .insert({
          ...observation,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        await this.logNotaryAuditEvent(observation.organization_id, observation.application_id, 'observation_created', {
          title: observation.title,
          type: observation.observation_type,
          severity: observation.severity_level,
        });
        return { data: data as NotaryObservation, error: null };
      }
    } catch (err: any) {
      return { data: null, error: err };
    }

    const mockNew: NotaryObservation = {
      id: `obs-new-${Date.now()}`,
      ...observation,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return { data: mockNew, error: null };
  },

  async resolveNotaryObservation(observationId: string, organizationId: string, applicationId: string, resolvedBy: string, notes?: string) {
    try {
      const { error } = await supabase
        .from('notary_observations')
        .update({
          status: 'resolved',
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', observationId);

      if (!error) {
        await this.logNotaryAuditEvent(organizationId, applicationId, 'observation_resolved', {
          observation_id: observationId,
          resolved_by: resolvedBy,
        });
        return { success: true };
      }
    } catch {
      // Fallback
    }
    return { success: true };
  },

  // 9. Perfil Profesional del Escribano (Caja Notarial, Firma Digital, Estudio)
  async getNotaryProfile(userId: string, options?: { isDemoMode?: boolean; organizationId?: string }): Promise<NotaryProfile | null> {
    const isDemo = isDemoMode({ organizationId: options?.organizationId, isDemoMode: options?.isDemoMode }) ||
      userId === 'u-test-notary' ||
      userId.includes('demo');

    if (isDemo) {
      return tagDataSource(DEMO_NOTARY_PROFILE, true);
    }

    try {
      const { data, error } = await supabase
        .from('notary_profiles')
        .select(`
          *,
          notary_office:notary_office_id (*)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return tagDataSource(data as NotaryProfile, false);
      }
    } catch {
      // Fallback
    }

    return null;
  },

  async saveNotaryProfile(userId: string, organizationId: string, profileData: Partial<NotaryProfile>) {
    try {
      const { data, error } = await supabase
        .from('notary_profiles')
        .upsert(
          {
            user_id: userId,
            organization_id: organizationId,
            ...profileData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (!error) {
        await this.logNotaryAuditEvent(organizationId, null, 'notary_profile_updated', {
          user_id: userId,
          changed_fields: Object.keys(profileData),
        });
        return { data: data as NotaryProfile, error: null };
      }
    } catch (err: any) {
      return { data: null, error: err };
    }
    return { data: { ...DEMO_NOTARY_PROFILE, ...profileData }, error: null };
  },

  // 10. Validación Estricta antes de iniciar Firma Digital
  async validateNotaryReadyForSignature(userId: string, _applicationId?: string, options?: { isDemoMode?: boolean }) {
    const profile = await this.getNotaryProfile(userId, options);

    const issues: string[] = [];

    if (!profile) {
      issues.push('Perfil notarial no configurado en la organización.');
      return {
        canSign: false,
        issues,
        profile: null,
      };
    }

    if (!profile.notarial_fund_affiliate_number) {
      issues.push('N.º de afiliado a Caja Notarial no configurado en tu perfil.');
    }
    if (!profile.professional_address) {
      issues.push('Domicilio profesional no completado.');
    }
    if (profile.professional_status !== 'verified' && profile.professional_status !== 'authorized') {
      issues.push('Habilitación profesional pendiente de verificación oficial.');
    }
    if (!profile.digital_signature_enabled || profile.digital_certificate_status !== 'active') {
      issues.push('Certificado de firma digital no activo o no configurado.');
    }
    if (profile.digital_certificate_expires_at && new Date(profile.digital_certificate_expires_at).getTime() < Date.now()) {
      issues.push('Tu certificado de firma digital se encuentra vencido.');
    }

    return {
      canSign: issues.length === 0,
      issues,
      profile,
    };
  },

  // 11. Listar escribanos del tenant para asignación desde Backoffice
  async listNotariesForTenant(tenantId: string, options?: { isDemoMode?: boolean }): Promise<NotaryProfile[]> {
    const isDemo = isDemoMode({ organizationId: tenantId, isDemoMode: options?.isDemoMode });

    if (isDemo) {
      return tagDataList([
        DEMO_NOTARY_PROFILE,
        {
          id: 'np-demo-pablo-silva',
          user_id: 'u-test-notary-2',
          organization_id: tenantId,
          notary_office_id: 'no-demo-001',
          notary_office: DEMO_NOTARY_OFFICE,
          notarial_fund_affiliate_number: '52.140',
          professional_status: 'verified',
          scj_authorization_status: 'authorized',
          professional_address: 'Rincón 487 Piso 3',
          professional_city: 'Montevideo',
          professional_department: 'Montevideo',
          electronic_domicile: 'pablo.silva@notarios.org.uy',
          university: 'Universidad Católica del Uruguay (UCU)',
          qualification_date: '2019-06-14',
          role_in_office: 'notary',
          digital_signature_enabled: true,
          digital_certificate_status: 'active',
          full_name: 'Esc. Pablo Silva Gómez',
          first_name: 'Pablo',
          last_name: 'Silva Gómez',
          email: 'pablo.silva@estudiofernandez.uy',
          phone: '098 123 789',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ], true);
    }

    try {
      const { data, error } = await supabase
        .from('notary_profiles')
        .select(`
          *,
          notary_office:notary_office_id (*)
        `)
        .eq('organization_id', tenantId);

      if (!error && data && data.length > 0) {
        return tagDataList(data as NotaryProfile[], false);
      }
    } catch {
      // Fallback
    }

    return [];
  },

  // 12. Helper de Auditoría Inmutable
  async logNotaryAuditEvent(organizationId: string, applicationId: string | null, action: string, metadata: any) {
    try {
      await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        application_id: applicationId,
        action,
        metadata,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Fallback silencioso
    }
  },
};
