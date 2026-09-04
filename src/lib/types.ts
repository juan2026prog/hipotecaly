// ==============================================================================
// HIPOTECALY: Tipos TypeScript del Core Multi-Tenant
// ==============================================================================

export type OrgType = 'hipotecaly' | 'lender' | 'estudio' | 'financiera' | 'broker' | 'other';
export type PlatformRole = 'super_admin' | 'platform_admin' | 'analyst' | 'operations' | 'commercial';
export type TenantRole = 'tenant_owner' | 'tenant_admin' | 'analyst' | 'operator' | 'viewer';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'info_review'
  | 'property_analysis'
  | 'matching_lenders'
  | 'offer_available'
  | 'offer_accepted'
  | 'formalization'
  | 'approved'
  | 'funded'
  | 'rejected'
  | 'cancelled';

export function getApplicationStatusLabel(status: ApplicationStatus | string): string {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'submitted':
      return 'Solicitud Recibida';
    case 'info_review':
      return 'Información en Revisión';
    case 'property_analysis':
      return 'Propiedad en Análisis';
    case 'matching_lenders':
      return 'Buscando Propuesta';
    case 'offer_available':
      return 'Propuesta Disponible';
    case 'offer_accepted':
      return 'Propuesta Aceptada';
    case 'formalization':
      return 'Formalización Notarial';
    case 'approved':
      return 'Aprobada';
    case 'funded':
      return 'Desembolsada';
    case 'rejected':
      return 'Rechazada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status || 'Desconocido';
  }
}

export type PropertyType =
  | 'casa'
  | 'apartamento'
  | 'local_comercial'
  | 'terreno'
  | 'campo'
  | 'otro';

export type LegalStatus =
  | 'libre_gravamenes'
  | 'tiene_hipoteca'
  | 'sucesion_en_tramite'
  | 'desconocido';

export type IncomeType =
  | 'dependiente'
  | 'independiente'
  | 'empresa'
  | 'jubilado'
  | 'rentas'
  | 'otro';

export type OpportunityStatus =
  | 'sent'
  | 'viewed'
  | 'interested'
  | 'declined'
  | 'offer_submitted'
  | 'accepted'
  | 'closed';

export type OfferStatus =
  | 'draft'
  | 'submitted'
  | 'presented'
  | 'accepted'
  | 'rejected'
  | 'expired';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  organization_type: OrgType;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationBranding {
  organization_id: string;
  company_name: string;
  public_name?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  support_email?: string;
  support_phone?: string;
  custom_domain?: string;
  hide_hipotecaly_branding: boolean;
  updated_at: string;
}

export interface Borrower {
  id: string;
  user_id?: string;
  organization_id: string;
  id_type: string;
  id_number?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  department: string;
  clearing_status: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  public_id: string;
  organization_id: string;
  borrower_id?: string;
  status: ApplicationStatus;
  current_step: number;
  requested_amount: number;
  currency: string;
  term_months: number;
  purpose?: string;
  notes?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  application_id: string;
  borrower_id?: string;
  property_type: PropertyType;
  department: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  cadastral_number?: string;
  surface_m2?: number;
  bedrooms?: number;
  bathrooms?: number;
  estimated_value: number;
  legal_status: LegalStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyPhoto {
  id: string;
  property_id: string;
  category: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  sort_order: number;
  created_at: string;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  status: string;
  created_at: string;
}

export interface LenderRule {
  id: string;
  lender_id: string;
  max_ltv: number;
  min_loan: number;
  max_loan: number;
  min_term_months: number;
  max_term_months: number;
  accepts_clearing: boolean;
  accepted_property_types: PropertyType[];
  accepted_departments: string[];
  accepted_currencies: string[];
  income_requirements?: string;
  active: boolean;
}

export interface PropertyValuation {
  id: string;
  application_id: string;
  applicant_estimated_value: number;
  preliminary_value: number;
  valuation_min?: number;
  valuation_max?: number;
  confidence: string;
  methodology: string;
  reviewer_id?: string;
  reviewed_at?: string;
  notes?: string;
}

export interface Task {
  id: string;
  application_id: string;
  assigned_to?: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  from_status?: ApplicationStatus;
  to_status: ApplicationStatus;
  changed_by?: string;
  notes?: string;
  created_at: string;
}
