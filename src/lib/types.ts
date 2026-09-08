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

export type NotaryStatus =
  | 'not_assigned'
  | 'assigned'
  | 'under_review'
  | 'observed'
  | 'review_approved'
  | 'originals_required'
  | 'originals_received'
  | 'signature_to_coordinate'
  | 'signature_scheduled'
  | 'signed'
  | 'registration_preparation'
  | 'registration_submitted'
  | 'in_registration'
  | 'registration_observed'
  | 'registration_remedied'
  | 'registered'
  | 'closed'
  // Compatibilidad legacy
  | 'documents_pending'
  | 'documentation_complete'
  | 'drafting'
  | 'ready_to_sign'
  | 'completed';

export function getNotaryStatusLabel(status: NotaryStatus | string): string {
  switch (status) {
    case 'not_assigned':
      return 'No asignado';
    case 'assigned':
      return 'Asignado';
    case 'under_review':
      return 'En revisión notarial';
    case 'observed':
      return 'Observado';
    case 'review_approved':
      return 'Revisión notarial aprobada';
    case 'originals_required':
      return 'Originales requeridos';
    case 'originals_received':
      return 'Originales recibidos y cotejados';
    case 'signature_to_coordinate':
      return 'Firma por coordinar';
    case 'signature_scheduled':
      return 'Firma agendada';
    case 'signed':
      return 'Firmada';
    case 'registration_preparation':
      return 'Preparación registral';
    case 'registration_submitted':
      return 'Presentada ante DGR';
    case 'in_registration':
      return 'En trámite registral';
    case 'registration_observed':
      return 'Observada por Registro';
    case 'registration_remedied':
      return 'Subsanada';
    case 'registered':
      return 'Inscripta definitivamente';
    case 'closed':
      return 'Cerrada / Finalizada';
    case 'documents_pending':
      return 'Esperando documentación';
    case 'documentation_complete':
      return 'Documentación completa';
    case 'drafting':
      return 'Preparando escritura';
    case 'ready_to_sign':
      return 'Revisión notarial aprobada';
    case 'completed':
      return 'Finalizado';
    default:
      return status || 'No asignado';
  }
}

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
  notary_status?: NotaryStatus;
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

// --- MODELOS DEL PERFIL NOTARIAL Y ESTUDIO NOTARIAL ---

export type NotaryProfessionalStatus =
  | 'pending'
  | 'verified'
  | 'authorized'
  | 'suspended'
  | 'inactive'
  | 'verification_failed';

export type NotaryCertificateStatus =
  | 'not_configured'
  | 'pending'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'error';

export type NotaryRoleInOffice =
  | 'notary_owner'
  | 'notary'
  | 'notary_assistant'
  | 'notary_admin';

export interface NotaryOffice {
  id: string;
  organization_id: string;
  name: string;
  legal_name?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  department?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotaryProfile {
  id: string;
  user_id: string;
  organization_id: string;
  notary_office_id?: string;
  notary_office?: NotaryOffice;
  notarial_fund_affiliate_number?: string;
  professional_status: NotaryProfessionalStatus;
  scj_authorization_status: string;
  scj_verified_at?: string;
  professional_address?: string;
  professional_city?: string;
  professional_department?: string;
  electronic_domicile?: string;
  university?: string;
  qualification_date?: string;
  role_in_office: NotaryRoleInOffice;
  digital_signature_enabled: boolean;
  digital_certificate_status: NotaryCertificateStatus;
  digital_certificate_expires_at?: string;
  digital_certificate_identifier?: string;
  certificate_provider?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  document_number?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationNotary {
  id: string;
  application_id: string;
  organization_id: string;
  notary_user_id: string;
  assigned_by?: string;
  assigned_at: string;
  is_primary: boolean;
  role_in_case: 'primary_notary' | 'collaborator' | 'assistant';
  status: 'active' | 'revoked' | 'completed';
  notary_profile?: NotaryProfile;
  created_at: string;
  updated_at: string;
}

export interface NotaryChecklistItem {
  id: string;
  application_id: string;
  organization_id: string;
  title: string;
  category: 'identificacion' | 'dominial' | 'catastral' | 'tributario' | 'registral' | 'escritura';
  is_required: boolean;
  status: 'pending' | 'in_review' | 'completed' | 'observed' | 'waived';
  completed_by?: string;
  completed_at?: string;
  comments?: string;
  related_document_id?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type NotaryObservationType =
  | 'documental'
  | 'registral'
  | 'catastral'
  | 'tributaria'
  | 'dominial'
  | 'sucesoria'
  | 'poderes'
  | 'gravamenes'
  | 'otra';

export type NotarySeverityLevel =
  | 'informativa'
  | 'requiere_correccion'
  | 'bloqueante';

export interface NotaryObservation {
  id: string;
  application_id: string;
  organization_id: string;
  title: string;
  description: string;
  observation_type: NotaryObservationType;
  severity_level: NotarySeverityLevel;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  responsible_id?: string;
  due_date?: string;
  related_document_id?: string;
  created_by?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

