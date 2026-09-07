// ==============================================================================
// HIPOTECALY DOCFLOW: Definición de Tipos Core y Modelos
// ==============================================================================

export type DocFlowStatus =
  | 'draft'
  | 'data_missing'
  | 'generated'
  | 'under_review'
  | 'approved'
  | 'ready_for_signature'
  | 'sent_for_signature'
  | 'partially_signed'
  | 'signed'
  | 'rejected'
  | 'expired'
  | 'superseded'
  | 'archived';

export type TemplateStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type OutputFormat = 'pdf' | 'html' | 'docx';

export type DocumentCategory =
  | 'solicitud'
  | 'legal'
  | 'financiero'
  | 'inmueble'
  | 'tasacion'
  | 'notarial'
  | 'comunicacion'
  | 'expediente';

export type VariableCategory =
  | 'solicitante'
  | 'conyuge'
  | 'propiedad'
  | 'credito'
  | 'prestamista'
  | 'escribano'
  | 'inmobiliaria'
  | 'expediente'
  | 'fechas'
  | 'tenant';

export interface DocVariableDefinition {
  key: string;
  label: string;
  category: VariableCategory;
  dataSource: string;
  dataPath: string;
  type: 'string' | 'number' | 'currency' | 'date' | 'boolean' | 'percentage';
  required?: boolean;
  description?: string;
  sourceLabel?: string;
  exampleValue?: string | number;
}

export interface SignerConfig {
  role: 'applicant' | 'spouse' | 'lender' | 'notary' | 'broker' | 'admin' | 'other';
  label: string;
  required: boolean;
  order: number;
  signatureType?: 'simple' | 'advanced_electronic' | 'notarial';
}

export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_truthy';
  value: any;
  action: 'show_block' | 'hide_block' | 'require_field';
  targetBlockId?: string;
}

export interface DocumentTemplate {
  id: string;
  tenant_id?: string | null;
  name: string;
  slug: string;
  description?: string;
  category: DocumentCategory;
  document_type: string;
  status: TemplateStatus;
  version: number;
  template_content: string;
  output_format: OutputFormat;
  requires_signature: boolean;
  signature_type?: string;
  required_roles?: string[];
  required_fields: string[];
  conditional_rules?: ConditionalRule[];
  signers_config?: SignerConfig[];
  is_global: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface GeneratedDocument {
  id: string;
  tenant_id: string;
  case_id: string;
  template_id?: string | null;
  template_version: number;
  document_version: number;
  title: string;
  category: DocumentCategory;
  document_type: string;
  status: DocFlowStatus;
  generated_by?: string;
  generated_at: string;
  file_url?: string;
  file_path?: string;
  file_hash?: string;
  file_size?: number;
  mime_type?: string;
  snapshot_json: Record<string, any>;
  signed_file_url?: string;
  signed_at?: string;
  signature_evidence?: Record<string, any>;
  missing_fields: string[];
  change_detected: boolean;
  superseded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ResolvedCaseData {
  case: {
    id: string;
    code: string;
    created_at: string;
    status: string;
    days_open: number;
    source: string;
    purpose?: string;
  };
  applicant: {
    first_name: string;
    last_name: string;
    full_name: string;
    document_id: string;
    id_type: string;
    birth_date?: string;
    phone?: string;
    email: string;
    address?: string;
    city?: string;
    department: string;
    marital_status?: string;
    occupation?: string;
    employer?: string;
    monthly_income: number;
    clearing_status?: string;
  };
  spouse?: {
    full_name?: string;
    document_id?: string;
    phone?: string;
    email?: string;
    occupation?: string;
  };
  property: {
    padron: string;
    department: string;
    city: string;
    neighborhood?: string;
    address: string;
    type: string;
    area_m2: number;
    bedrooms: number;
    bathrooms: number;
    estimated_value: number;
    appraised_value: number;
    guarantee_value: number;
    legal_status: string;
  };
  loan: {
    requested_amount: number;
    approved_amount: number;
    currency: string;
    term_months: number;
    interest_rate: number;
    monthly_payment: number;
    ltv: number;
    repayment_mode: string;
  };
  lender?: {
    name: string;
    document_id?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
  };
  notary?: {
    user_id?: string;
    name: string;
    full_name?: string;
    document_number?: string;
    notarial_fund_affiliate_number?: string;
    professional_address?: string;
    professional_city?: string;
    professional_department?: string;
    electronic_domicile?: string;
    notary_office_name?: string;
    digital_certificate_identifier?: string;
    email?: string;
    phone?: string;
    license?: string;
  };
  tenant: {
    id: string;
    name: string;
    legal_name?: string;
    legal_representative?: string;
    legal_address?: string;
    logo_url?: string;
    support_email?: string;
    support_phone?: string;
    footer_text?: string;
  };
  dates: {
    today_iso: string;
    today_formatted: string;
    current_year: number;
    current_month_name: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  missingRequiredFields: Array<{
    key: string;
    label: string;
    category: string;
    path: string;
  }>;
  availableFieldsCount: number;
  totalRequiredCount: number;
}
