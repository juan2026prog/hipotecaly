// ==============================================================================
// HIPOTECALY: Servicio de Backoffice Operativo conectado a PostgreSQL / Supabase
// ==============================================================================

import { supabase } from './supabase';
import { PropertyValuation } from './types';
import {
  isDemoMode,
  isDemoOrganization,
  tagDataList,
  tagDataSource,
} from './demoControl';

function withTimeout<T>(promise: PromiseLike<T>, ms = 800): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de conexión')), ms)
    ),
  ]);
}

// Dataset DEMO oficial separado (Reglas 5, 36, 62)
export const DEMO_APPLICATIONS = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    public_id: 'HIP-DEMO-00124',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    status: 'submitted',
    current_step: 6,
    requested_amount: 80000,
    currency: 'USD',
    term_months: 36,
    purpose: 'Refacción integral de vivienda y consolidación',
    notes: 'Solicitante con ingresos comprobables dependiente en rubro IT',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    borrower: {
      id: 'b-demo-1',
      first_name: 'María',
      last_name: 'López',
      document_id: '4.182.930-1',
      email: 'maria.lopez@ejemplo.com',
      phone: '099 234 567',
      address: 'Rambla República de México 5420',
      department: 'Montevideo',
      marital_status: 'Casada',
      occupation: 'Gerente de Proyectos',
      employer: 'Globant Uruguay',
      monthly_income: 145000,
      clearing_status: 'clean',
    },
    spouse: {
      full_name: 'Martín Rodríguez Silva',
      document_id: '3.987.654-2',
    },
    property: {
      id: 'f0000000-0000-0000-0000-000000000001',
      property_type: 'casa',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Carrasco',
      address: 'Zona Carrasco Sur',
      cadastral_number: '145.892',
      surface_m2: 180,
      bedrooms: 3,
      bathrooms: 2,
      estimated_value: 240000,
      legal_status: 'libre_gravamenes',
    },
    valuation: {
      id: 'v-demo-1',
      application_id: 'e0000000-0000-0000-0000-000000000001',
      applicant_estimated_value: 240000,
      preliminary_value: 235000,
      valuation_min: 220000,
      valuation_max: 250000,
      confidence: 'alta',
      methodology: 'comparables_de_mercado',
      reviewed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      notes: 'Valuación preliminar basada en comparables recientes en Carrasco.',
    },
    tasks: [
      {
        id: 't-demo-1',
        application_id: 'e0000000-0000-0000-0000-000000000001',
        title: 'Verificar recibo de sueldo de los últimos 3 meses',
        status: 'pending',
        due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: 't-demo-2',
        application_id: 'e0000000-0000-0000-0000-000000000001',
        title: 'Cotejar cédula catastral en Intendencia',
        status: 'completed',
        due_date: new Date(Date.now() - 86400000 * 1).toISOString(),
        created_at: new Date().toISOString(),
      },
    ],
    documents: [
      {
        id: 'd-demo-1',
        property_id: 'f0000000-0000-0000-0000-000000000001',
        document_type: 'Cedula de Identidad',
        file_path: 'demo/ci_frente_dorso.pdf',
        file_name: 'CI_Maria_Lopez.pdf',
        file_size: 1420000,
        status: 'verified',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'd-demo-2',
        property_id: 'f0000000-0000-0000-0000-000000000001',
        document_type: 'Recibo de Sueldo',
        file_path: 'demo/recibo_sueldo.pdf',
        file_name: 'Recibo_Haberes_Julio.pdf',
        file_size: 890000,
        status: 'pending_review',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
    photos: [
      {
        id: 'p-demo-1',
        property_id: 'f0000000-0000-0000-0000-000000000001',
        category: 'frente',
        file_path: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        file_name: 'Fachada_Carrasco.jpg',
        sort_order: 1,
        created_at: new Date().toISOString(),
      },
    ],
    history: [
      {
        id: 'h-1',
        application_id: 'e0000000-0000-0000-0000-000000000001',
        from_status: undefined,
        to_status: 'submitted',
        notes: 'Solicitud ingresada desde el portal web',
        created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
    ],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    public_id: 'HIP-DEMO-00125',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    status: 'info_review',
    current_step: 6,
    requested_amount: 120000,
    currency: 'USD',
    term_months: 48,
    purpose: 'Expansión de negocio comercial',
    notes: 'Apartamento en Pocitos con garaje',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    borrower: {
      id: 'b-demo-2',
      first_name: 'Pedro',
      last_name: 'González',
      document_id: '3.214.567-8',
      email: 'pedro.gonzalez@ejemplo.com',
      phone: '098 876 543',
      address: 'Benito Blanco 1120 Apto 601',
      department: 'Montevideo',
      marital_status: 'Soltero',
      occupation: 'Empresario Gastronómico',
      employer: 'Grupo Gastronómico del Sur',
      monthly_income: 180000,
      clearing_status: 'clean',
    },
    property: {
      id: 'f0000000-0000-0000-0000-000000000002',
      property_type: 'apartamento',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Pocitos',
      address: 'Benito Blanco esq. Martí',
      cadastral_number: '98.341',
      surface_m2: 110,
      bedrooms: 2,
      bathrooms: 2,
      estimated_value: 310000,
      legal_status: 'libre_gravamenes',
    },
    valuation: {
      id: 'v-demo-2',
      application_id: 'e0000000-0000-0000-0000-000000000002',
      applicant_estimated_value: 310000,
      preliminary_value: 300000,
      valuation_min: 285000,
      valuation_max: 315000,
      confidence: 'alta',
      methodology: 'comparables_de_mercado',
      reviewed_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      notes: 'Edificio de categoría en Pocitos frente rambla lateral.',
    },
    tasks: [
      {
        id: 't-demo-3',
        application_id: 'e0000000-0000-0000-0000-000000000002',
        title: 'Revisar balance certificado por contador público',
        status: 'pending',
        due_date: new Date(Date.now() + 86400000 * 1).toISOString(),
        created_at: new Date().toISOString(),
      },
    ],
    documents: [],
    photos: [],
    history: [],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    public_id: 'HIP-DEMO-00126',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    status: 'property_analysis',
    current_step: 6,
    requested_amount: 70000,
    currency: 'USD',
    term_months: 24,
    purpose: 'Capital de giro',
    notes: 'Local en Solymar',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    borrower: {
      id: 'b-demo-3',
      first_name: 'Juan',
      last_name: 'Martínez',
      document_id: '4.555.666-9',
      email: 'juan.martinez@ejemplo.com',
      phone: '094 555 666',
      address: 'Av. Giannattasio km 23.500',
      department: 'Canelones',
      marital_status: 'Casado',
      occupation: 'Comerciante Independiente',
      employer: 'Distribuidora de la Costa',
      monthly_income: 110000,
      clearing_status: 'clean',
    },
    property: {
      id: 'f0000000-0000-0000-0000-000000000003',
      property_type: 'comercial',
      department: 'Canelones',
      city: 'Ciudad de la Costa',
      neighborhood: 'Solymar',
      address: 'Giannattasio km 23',
      cadastral_number: '21.092',
      surface_m2: 150,
      bedrooms: 0,
      bathrooms: 2,
      estimated_value: 195000,
      legal_status: 'libre_gravamenes',
    },
    valuation: {
      id: 'v-demo-3',
      application_id: 'e0000000-0000-0000-0000-000000000003',
      applicant_estimated_value: 195000,
      preliminary_value: 190000,
      valuation_min: 175000,
      valuation_max: 200000,
      confidence: 'media',
      methodology: 'rentabilidad_comercial',
      reviewed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      notes: 'Local con frente comercial sobre Giannattasio.',
    },
    tasks: [],
    documents: [],
    photos: [],
    history: [],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    public_id: 'HIP-DEMO-00127',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    status: 'evaluation',
    current_step: 6,
    requested_amount: 95000,
    currency: 'USD',
    term_months: 36,
    purpose: 'Inversión inmobiliaria y reforma',
    notes: 'Propiedad en Punta Carretas. Score de riesgo crediticio A+',
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    borrower: {
      id: 'b-demo-4',
      first_name: 'Lucía',
      last_name: 'Fernández',
      document_id: '4.890.123-4',
      email: 'lucia.fernandez@ejemplo.com',
      phone: '091 223 344',
      address: 'Ellauri 890 Apto 302',
      department: 'Montevideo',
      marital_status: 'Divorciada',
      occupation: 'Médica Cardióloga',
      employer: 'CASMU & Hospital Británico',
      monthly_income: 220000,
      clearing_status: 'clean',
    },
    property: {
      id: 'f0000000-0000-0000-0000-000000000004',
      property_type: 'casa',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Punta Carretas',
      address: 'Montero esq. Guipúzcoa',
      cadastral_number: '63.812',
      surface_m2: 140,
      bedrooms: 3,
      bathrooms: 2,
      estimated_value: 280000,
      legal_status: 'libre_gravamenes',
    },
    valuation: {
      id: 'v-demo-4',
      application_id: 'e0000000-0000-0000-0000-000000000004',
      applicant_estimated_value: 280000,
      preliminary_value: 275000,
      valuation_min: 260000,
      valuation_max: 290000,
      confidence: 'alta',
      methodology: 'pericia_profesional',
      reviewed_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      notes: 'Excelente estado de conservación en zona residencial premium.',
    },
    tasks: [],
    documents: [],
    photos: [],
    history: [],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    public_id: 'HIP-DEMO-00128',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    status: 'offer_available',
    current_step: 6,
    requested_amount: 55000,
    currency: 'USD',
    term_months: 24,
    purpose: 'Consolidación de pasivos',
    notes: 'Oferta emitida y disponible para aceptación del cliente',
    created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    borrower: {
      id: 'b-demo-5',
      first_name: 'Carlos',
      last_name: 'Rodríguez',
      document_id: '3.678.901-2',
      email: 'carlos.rodriguez@ejemplo.com',
      phone: '099 887 766',
      address: 'Av. Rivera 4200 Apto 101',
      department: 'Montevideo',
      marital_status: 'Casado',
      occupation: 'Arquitecto',
      employer: 'Estudio Rodríguez & Asoc.',
      monthly_income: 130000,
      clearing_status: 'clean',
    },
    property: {
      id: 'f0000000-0000-0000-0000-000000000005',
      property_type: 'apartamento',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Malvín',
      address: 'Rambla O\'Higgins 4890',
      cadastral_number: '44.510',
      surface_m2: 85,
      bedrooms: 2,
      bathrooms: 1,
      estimated_value: 165000,
      legal_status: 'libre_gravamenes',
    },
    valuation: {
      id: 'v-demo-5',
      application_id: 'e0000000-0000-0000-0000-000000000005',
      applicant_estimated_value: 165000,
      preliminary_value: 160000,
      valuation_min: 150000,
      valuation_max: 170000,
      confidence: 'alta',
      methodology: 'comparables_de_mercado',
      reviewed_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      notes: 'Apartamento con vista al mar y gastos comunes bajos.',
    },
    tasks: [],
    documents: [],
    photos: [],
    history: [],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000006',
    public_id: 'HIP-DEMO-00129',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    status: 'formalization',
    current_step: 6,
    requested_amount: 110000,
    currency: 'USD',
    term_months: 60,
    purpose: 'Construcción y ampliación residencial',
    notes: 'Minuta de hipoteca enviada a Escribanía para firma',
    created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    borrower: {
      id: 'b-demo-6',
      first_name: 'Roberto',
      last_name: 'Benítez',
      document_id: '2.890.345-6',
      email: 'roberto.benitez@ejemplo.com',
      phone: '098 112 233',
      address: 'Av. Joaquín Suárez 3100',
      department: 'Montevideo',
      marital_status: 'Casado',
      occupation: 'Contador Público',
      employer: 'KPMG Uruguay',
      monthly_income: 195000,
      clearing_status: 'clean',
    },
    property: {
      id: 'f0000000-0000-0000-0000-000000000006',
      property_type: 'casa',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Prado',
      address: 'Av. Agraciada 2890',
      cadastral_number: '32.709',
      surface_m2: 240,
      bedrooms: 4,
      bathrooms: 3,
      estimated_value: 340000,
      legal_status: 'libre_gravamenes',
    },
    valuation: {
      id: 'v-demo-6',
      application_id: 'e0000000-0000-0000-0000-000000000006',
      applicant_estimated_value: 340000,
      preliminary_value: 330000,
      valuation_min: 310000,
      valuation_max: 350000,
      confidence: 'alta',
      methodology: 'pericia_profesional',
      reviewed_at: new Date(Date.now() - 3600000 * 96).toISOString(),
      notes: 'Casona clásica en excelente estado sobre padrón único.',
    },
    tasks: [],
    documents: [],
    photos: [],
    history: [],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000007',
    public_id: 'HIP-DEMO-00130',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    status: 'approved',
    current_step: 6,
    requested_amount: 65000,
    currency: 'USD',
    term_months: 36,
    purpose: 'Compra de equipamiento',
    notes: 'Operación escriturada y fondos desembolsados exitosamente',
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    borrower: {
      id: 'b-demo-7',
      first_name: 'Ana',
      last_name: 'Morales',
      document_id: '4.112.334-5',
      email: 'ana.morales@ejemplo.com',
      phone: '099 334 455',
      address: 'Tomás de Tezanos 1240 Apto 402',
      department: 'Montevideo',
      marital_status: 'Soltera',
      occupation: 'Odontóloga',
      employer: 'Clínica Dental Buceo',
      monthly_income: 140000,
      clearing_status: 'clean',
    },
    property: {
      id: 'f0000000-0000-0000-0000-000000000007',
      property_type: 'apartamento',
      department: 'Montevideo',
      city: 'Montevideo',
      neighborhood: 'Buceo',
      address: 'Av. Rivera esq. Propios',
      cadastral_number: '55.128',
      surface_m2: 95,
      bedrooms: 2,
      bathrooms: 1,
      estimated_value: 190000,
      legal_status: 'libre_gravamenes',
    },
    valuation: {
      id: 'v-demo-7',
      application_id: 'e0000000-0000-0000-0000-000000000007',
      applicant_estimated_value: 190000,
      preliminary_value: 185000,
      valuation_min: 175000,
      valuation_max: 195000,
      confidence: 'alta',
      methodology: 'comparables_de_mercado',
      reviewed_at: new Date(Date.now() - 3600000 * 120).toISOString(),
      notes: 'Apartamento a estrenar con cochera propia.',
    },
    tasks: [],
    documents: [],
    photos: [],
    history: [],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000008',
    public_id: 'HIP-DEMO-00131',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    status: 'rejected',
    current_step: 6,
    requested_amount: 150000,
    currency: 'USD',
    term_months: 36,
    purpose: 'Desarrollo inmobiliario',
    notes: 'Rechazado por comité: LTV resultante supera el límite de política (83.3% > 60%)',
    created_at: new Date(Date.now() - 3600000 * 24 * 25).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    borrower: {
      id: 'b-demo-8',
      first_name: 'Gabriel',
      last_name: 'Méndez',
      document_id: '3.445.678-0',
      email: 'gabriel.mendez@ejemplo.com',
      phone: '097 665 544',
      address: 'Ruta Interbalnearia km 28',
      department: 'Canelones',
      marital_status: 'Soltero',
      occupation: 'Desarrollador',
      employer: 'Inversiones del Este',
      monthly_income: 80000,
      clearing_status: 'unverified',
    },
    property: {
      id: 'f0000000-0000-0000-0000-000000000008',
      property_type: 'terreno',
      department: 'Canelones',
      city: 'El Pinar',
      neighborhood: 'El Pinar',
      address: 'Calle Tuyutí Solar 14',
      cadastral_number: '12.449',
      surface_m2: 600,
      bedrooms: 0,
      bathrooms: 0,
      estimated_value: 180000,
      legal_status: 'libre_gravamenes',
    },
    valuation: {
      id: 'v-demo-8',
      application_id: 'e0000000-0000-0000-0000-000000000008',
      applicant_estimated_value: 180000,
      preliminary_value: 160000,
      valuation_min: 140000,
      valuation_max: 175000,
      confidence: 'media',
      methodology: 'comparables_de_mercado',
      reviewed_at: new Date(Date.now() - 3600000 * 140).toISOString(),
      notes: 'Terreno baldío sin nivelación.',
    },
    tasks: [],
    documents: [],
    photos: [],
    history: [],
  },
];

/**
 * Métricas operativas del backoffice en tiempo real
 */
export async function getBackofficeMetrics(options?: { organizationId?: string; isDemoMode?: boolean } | boolean) {
  const isDemo = typeof options === 'boolean'
    ? options
    : isDemoMode({ organizationId: options?.organizationId, isDemoMode: options?.isDemoMode });
  const orgId = typeof options === 'object' ? options.organizationId : undefined;

  if (isDemo && (!orgId || isDemoOrganization(orgId))) {
    return {
      newRequests: DEMO_APPLICATIONS.filter((d) => d.status === 'submitted').length,
      inAnalysis: DEMO_APPLICATIONS.filter((d) => d.status === 'info_review' || d.status === 'property_analysis' || d.status === 'evaluation').length,
      waitingDocs: DEMO_APPLICATIONS.filter((d) => d.status === 'draft').length,
      offerAvailable: DEMO_APPLICATIONS.filter((d) => d.status === 'offer_available').length,
      approved: DEMO_APPLICATIONS.filter((d) => d.status === 'approved' || d.status === 'formalization').length,
      totalRequested: DEMO_APPLICATIONS.reduce((acc, curr) => acc + (Number(curr.requested_amount) || 0), 0),
      isDemo: true,
    };
  }

  try {
    let query = supabase.from('applications').select('status, requested_amount');
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    const { data, error } = await withTimeout(query);
    if (!error && data) {
      return {
        newRequests: data.filter((d) => d.status === 'submitted').length,
        inAnalysis: data.filter((d) => d.status === 'info_review' || d.status === 'property_analysis' || d.status === 'evaluation').length,
        waitingDocs: data.filter((d) => d.status === 'draft').length,
        offerAvailable: data.filter((d) => d.status === 'offer_available').length,
        approved: data.filter((d) => d.status === 'approved' || d.status === 'formalization').length,
        totalRequested: data.reduce((acc, curr) => acc + (Number(curr.requested_amount) || 0), 0),
        isDemo: false,
      };
    }
  } catch {
    // Si no es demo, retornar ceros sin inventar métricas
  }

  return {
    newRequests: 0,
    inAnalysis: 0,
    waitingDocs: 0,
    offerAvailable: 0,
    approved: 0,
    totalRequested: 0,
    isDemo: false,
  };
}

/**
 * Listado de solicitudes con filtros y búsqueda
 * REGLA TÉCNICA: NO_PRODUCTION_MOCK_DATA.
 * Si useDemoMode = false, NUNCA retorna DEMO_APPLICATIONS.
 */
export async function getApplicationsList(filters?: {
  organizationId?: string;
  status?: string;
  department?: string;
  search?: string;
  useDemoMode?: boolean;
}) {
  const isDemo = isDemoMode({ organizationId: filters?.organizationId, isDemoMode: filters?.useDemoMode });
  const orgId = filters?.organizationId;

  if (isDemo) {
    return tagDataList(filterApplicationsLocally(DEMO_APPLICATIONS, filters), true);
  }

  try {
    let query = supabase
      .from('applications')
      .select('*, properties(*), borrowers(*)')
      .order('created_at', { ascending: false });

    if (orgId) {
      query = query.eq('organization_id', orgId);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await withTimeout(query);
    if (!error && data) {
      return tagDataList(filterApplicationsLocally(data, filters), false);
    }
  } catch {
    // Error en base de datos
  }

  // En producción sin demo: retornar lista vacía (empty state legítimo)
  return [];
}

function filterApplicationsLocally(list: any[], filters?: { status?: string; department?: string; search?: string }) {
  return list.filter((app) => {
    if (filters?.status && filters.status !== 'all' && app.status !== filters.status) return false;
    if (filters?.department && filters.department !== 'all' && app.property?.department !== filters.department) return false;
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      const matchId = app.public_id?.toLowerCase().includes(q);
      const matchBorrower = (app.borrower?.first_name + ' ' + app.borrower?.last_name).toLowerCase().includes(q);
      if (!matchId && !matchBorrower) return false;
    }
    return true;
  });
}

/**
 * Detalle completo de un expediente para `/app/solicitudes/:id`
 * REGLA TÉCNICA OBLIGATORIA: Un tenant real autenticado NO puede usar DEMO_APPLICATIONS como fuente productiva.
 */
export async function getApplicationDetail(
  idOrPublicId: string,
  options?: { isDemoMode?: boolean; organizationId?: string }
) {
  const isDemo = isDemoMode({ organizationId: options?.organizationId, isDemoMode: options?.isDemoMode }) ||
    idOrPublicId.includes('demo') ||
    idOrPublicId.includes('DEMO') ||
    idOrPublicId.startsWith('e0000');

  if (isDemo) {
    const normalized = idOrPublicId.replace('2026', 'DEMO');
    const found = DEMO_APPLICATIONS.find(
      (a) =>
        a.id === idOrPublicId ||
        a.public_id === idOrPublicId ||
        a.public_id === normalized ||
        a.public_id.replace('DEMO', '2026') === idOrPublicId
    );
    if (found) return tagDataSource(found, true);
  }

  try {
    let query = supabase
      .from('applications')
      .select('*, properties(*, property_photos(*), property_documents(*)), borrowers(*), property_valuations(*), tasks(*), application_status_history(*)')
      .or(`id.eq.${idOrPublicId},public_id.eq.${idOrPublicId}`);

    if (options?.organizationId) {
      query = query.eq('organization_id', options.organizationId);
    }

    const { data, error } = await withTimeout(query.maybeSingle());

    if (!error && data) {
      return tagDataSource(data, false);
    }
  } catch {
    // Continuar a empty state legítimo
  }

  // En producción sin demo: Retornar null (empty state legítimo)
  return null;
}

/**
 * Actualiza el estado de una solicitud y registra la trazabilidad (Regla 26)
 */
export async function updateApplicationStatus(
  applicationId: string,
  fromStatus: string,
  toStatus: string,
  notes?: string
) {
  try {
    await supabase
      .from('applications')
      .update({ status: toStatus, updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    await supabase.from('application_status_history').insert({
      application_id: applicationId,
      from_status: fromStatus,
      to_status: toStatus,
      notes: notes || `Cambio de estado a ${toStatus}`,
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err };
  }
}

/**
 * Guarda o actualiza una Valuación Preliminar (Regla 22 y 40)
 */
export async function savePropertyValuation(
  valuation: Partial<PropertyValuation> & { application_id: string }
) {
  try {
    const { data, error } = await supabase
      .from('property_valuations')
      .upsert(
        {
          application_id: valuation.application_id,
          applicant_estimated_value: valuation.applicant_estimated_value || 0,
          preliminary_value: valuation.preliminary_value || 0,
          valuation_min: valuation.valuation_min,
          valuation_max: valuation.valuation_max,
          confidence: valuation.confidence || 'media',
          methodology: valuation.methodology || 'comparables_de_mercado',
          notes: valuation.notes,
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: 'application_id' }
      )
      .select()
      .single();

    return { valuation: data, error };
  } catch (err: unknown) {
    return { valuation: null, error: err };
  }
}

/**
 * Crea una tarea para el expediente (Regla 24)
 */
export async function createApplicationTask(task: {
  application_id: string;
  title: string;
  due_date?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        application_id: task.application_id,
        title: task.title,
        due_date: task.due_date,
        status: 'pending',
      })
      .select()
      .single();

    return { task: data, error };
  } catch (err: unknown) {
    return { task: null, error: err };
  }
}
