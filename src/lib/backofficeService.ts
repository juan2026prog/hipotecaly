// ==============================================================================
// HIPOTECALY: Servicio de Backoffice Operativo conectado a PostgreSQL / Supabase
// ==============================================================================

import { supabase } from './supabase';
import { PropertyValuation } from './types';

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
    status: 'info_review',
    current_step: 6,
    requested_amount: 80000,
    currency: 'USD',
    term_months: 36,
    purpose: 'Refacción integral de vivienda y consolidación',
    notes: 'Solicitante con ingresos comprobables dependiente',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    borrower: {
      id: 'b-demo-1',
      first_name: 'María',
      last_name: 'López',
      email: 'maria.lopez@ejemplo.com',
      phone: '099 234 567',
      department: 'Montevideo',
      clearing_status: 'clean',
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
        due_date: '2026-09-10',
        created_at: new Date().toISOString(),
      },
      {
        id: 't-demo-2',
        application_id: 'e0000000-0000-0000-0000-000000000001',
        title: 'Cotejar cédula catastral en Intendencia',
        status: 'completed',
        due_date: '2026-09-05',
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
      {
        id: 'p-demo-2',
        property_id: 'f0000000-0000-0000-0000-000000000001',
        category: 'living',
        file_path: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
        file_name: 'Living_Principal.jpg',
        sort_order: 2,
        created_at: new Date().toISOString(),
      },
    ],
    history: [
      {
        id: 'h-1',
        application_id: 'e0000000-0000-0000-0000-000000000001',
        from_status: undefined,
        to_status: 'draft' as any,
        notes: 'Borrador creado desde el simulador',
        created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
      {
        id: 'h-2',
        application_id: 'e0000000-0000-0000-0000-000000000001',
        from_status: 'draft' as any,
        to_status: 'submitted' as any,
        notes: 'Solicitud enviada por la solicitante',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'h-3',
        application_id: 'e0000000-0000-0000-0000-000000000001',
        from_status: 'submitted' as any,
        to_status: 'info_review' as any,
        notes: 'Analista inició revisión documental',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    public_id: 'HIP-DEMO-00125',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    status: 'property_analysis',
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
      email: 'pedro.gonzalez@ejemplo.com',
      phone: '098 876 543',
      department: 'Montevideo',
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
    tasks: [],
    documents: [],
    photos: [],
    history: [],
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    public_id: 'HIP-DEMO-00126',
    organization_id: 'd0000000-0000-0000-0000-000000000001',
    status: 'offer_available',
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
      email: 'juan.martinez@ejemplo.com',
      phone: '094 555 666',
      department: 'Canelones',
      clearing_status: 'unverified',
    },
    property: {
      id: 'f0000000-0000-0000-0000-000000000003',
      property_type: 'local_comercial',
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
];

/**
 * Métricas operativas del backoffice en tiempo real
 */
export async function getBackofficeMetrics(useDemoMode = false) {
  if (useDemoMode) {
    return {
      newRequests: 2,
      inAnalysis: 1,
      waitingDocs: 1,
      offerAvailable: 1,
      approved: 1,
      totalRequested: 270000,
      isDemo: true,
    };
  }

  try {
    const { data, error } = await withTimeout(
      supabase.from('applications').select('status, requested_amount')
    );
    if (!error && data && data.length > 0) {
      return {
        newRequests: data.filter((d) => d.status === 'submitted').length,
        inAnalysis: data.filter((d) => d.status === 'info_review' || d.status === 'property_analysis').length,
        waitingDocs: data.filter((d) => d.status === 'draft').length,
        offerAvailable: data.filter((d) => d.status === 'offer_available').length,
        approved: data.filter((d) => d.status === 'approved').length,
        totalRequested: data.reduce((acc, curr) => acc + (Number(curr.requested_amount) || 0), 0),
        isDemo: false,
      };
    }
  } catch {
    // Fallback a demo si el backend local no está disponible
  }

  // Fallback con demo claramente identificado
  return {
    newRequests: 2,
    inAnalysis: 1,
    waitingDocs: 1,
    offerAvailable: 1,
    approved: 1,
    totalRequested: 270000,
    isDemo: true,
  };
}

/**
 * Listado de solicitudes con filtros y búsqueda
 */
export async function getApplicationsList(filters?: {
  status?: string;
  department?: string;
  search?: string;
  useDemoMode?: boolean;
}) {
  if (filters?.useDemoMode) {
    return filterApplicationsLocally(DEMO_APPLICATIONS, filters);
  }

  try {
    let query = supabase
      .from('applications')
      .select('*, properties(*), borrowers(*)')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await withTimeout(query);
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch {
    // Continuar a fallback demo
  }

  return filterApplicationsLocally(DEMO_APPLICATIONS, filters);
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
 */
export async function getApplicationDetail(idOrPublicId: string) {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('applications')
        .select('*, properties(*, property_photos(*), property_documents(*)), borrowers(*), property_valuations(*), tasks(*), application_status_history(*)')
        .or(`id.eq.${idOrPublicId},public_id.eq.${idOrPublicId}`)
        .maybeSingle()
    );

    if (!error && data) {
      return data;
    }
  } catch {
    // Fallback a demo
  }

  // Buscar en DEMO
  const found = DEMO_APPLICATIONS.find(
    (a) => a.id === idOrPublicId || a.public_id === idOrPublicId
  );
  return found || DEMO_APPLICATIONS[0];
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
