-- ==============================================================================
-- HIPOTECALY: Base de Datos Core Multi-Tenant y Expansión PropTech/FinTech
-- Migración 00001: Esquema Estructural y Tablas Principales
-- ==============================================================================

-- Habilitar extensión para UUIDs criptográficos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS Y TIPOS DE DATOS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE org_type AS ENUM ('hipotecaly', 'lender', 'estudio', 'financiera', 'broker', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE platform_role AS ENUM ('super_admin', 'platform_admin', 'analyst', 'operations', 'commercial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tenant_role AS ENUM ('tenant_owner', 'tenant_admin', 'analyst', 'operator', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM (
        'draft',
        'submitted',
        'info_review',
        'property_analysis',
        'matching_lenders',
        'offer_available',
        'formalization',
        'approved',
        'rejected',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_type_enum AS ENUM (
        'casa',
        'apartamento',
        'local_comercial',
        'terreno',
        'campo',
        'otro'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE legal_status_enum AS ENUM (
        'libre_gravamenes',
        'tiene_hipoteca',
        'sucesion_en_tramite',
        'desconocido'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE income_type_enum AS ENUM (
        'dependiente',
        'independiente',
        'empresa',
        'jubilado',
        'rentas',
        'otro'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE opportunity_status AS ENUM (
        'sent',
        'viewed',
        'interested',
        'declined',
        'offer_submitted',
        'accepted',
        'closed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE offer_status AS ENUM (
        'draft',
        'submitted',
        'presented',
        'accepted',
        'rejected',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. SECUENCIA PARA GENERACIÓN DE PUBLIC IDs (ej: HIP-2026-00001)
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS application_public_seq START 1;

CREATE OR REPLACE FUNCTION generate_application_public_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.public_id IS NULL OR NEW.public_id = '' THEN
        NEW.public_id := 'HIP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(NEXTVAL('application_public_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. ORGANIZACIONES Y MULTI-TENANCY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    organization_type org_type NOT NULL DEFAULT 'estudio',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_branding (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    public_name VARCHAR(255),
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(20) DEFAULT '#071A35',
    secondary_color VARCHAR(20) DEFAULT '#2DA674',
    accent_color VARCHAR(20) DEFAULT '#E9F6F0',
    support_email VARCHAR(255),
    support_phone VARCHAR(50),
    custom_domain VARCHAR(255),
    hide_hipotecaly_branding BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
    verification_token VARCHAR(255) NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. USUARIOS, PERFILES Y MIEMBROS DE ORGANIZACIÓN
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role tenant_role NOT NULL DEFAULT 'operator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 5. SOLICITANTES (BORROWERS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS borrowers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    id_type VARCHAR(20) NOT NULL DEFAULT 'CI',
    id_number VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    department VARCHAR(100) NOT NULL DEFAULT 'Montevideo',
    clearing_status VARCHAR(50) DEFAULT 'unverified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. SOLICITUDES DE PRÉSTAMO (APPLICATIONS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id VARCHAR(50) UNIQUE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    borrower_id UUID REFERENCES borrowers(id) ON DELETE SET NULL,
    status application_status NOT NULL DEFAULT 'draft',
    current_step INT NOT NULL DEFAULT 1,
    requested_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    term_months INT NOT NULL DEFAULT 36,
    purpose TEXT,
    notes TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_generate_app_public_id
BEFORE INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION generate_application_public_id();

CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status application_status,
    to_status application_status NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. PROPIEDADES EN GARANTÍA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    borrower_id UUID REFERENCES borrowers(id) ON DELETE SET NULL,
    property_type property_type_enum NOT NULL DEFAULT 'casa',
    department VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    neighborhood VARCHAR(100),
    address VARCHAR(255),
    cadastral_number VARCHAR(100), -- Padrón
    surface_m2 NUMERIC(10,2),
    bedrooms INT,
    bathrooms INT,
    estimated_value NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    legal_status legal_status_enum NOT NULL DEFAULT 'libre_gravamenes',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL DEFAULT 'general', -- frente, ambiente_principal, cocina, dormitorios, banos, etc.
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- titulo, plano, contribucion, etc.
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. INGRESOS DEL SOLICITANTE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS borrower_income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    income_type income_type_enum NOT NULL DEFAULT 'dependiente',
    monthly_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'UYU',
    employer_or_source VARCHAR(255),
    proof_document_path TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. VALUACIÓN PRELIMINAR
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    applicant_estimated_value NUMERIC(14,2) NOT NULL,
    preliminary_value NUMERIC(14,2) NOT NULL,
    valuation_min NUMERIC(14,2),
    valuation_max NUMERIC(14,2),
    confidence VARCHAR(50) DEFAULT 'medium',
    methodology VARCHAR(100) DEFAULT 'market_comparables',
    reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. PRESTAMISTAS Y REGLAS (LENDERS & LENDER RULES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    internal_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lender_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
    max_ltv NUMERIC(5,2) NOT NULL DEFAULT 40.00, -- 40.00%
    min_loan NUMERIC(14,2) NOT NULL DEFAULT 10000.00,
    max_loan NUMERIC(14,2) NOT NULL DEFAULT 200000.00,
    min_term_months INT NOT NULL DEFAULT 12,
    max_term_months INT NOT NULL DEFAULT 60,
    accepts_clearing BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_property_types property_type_enum[] NOT NULL DEFAULT '{casa,apartamento,local_comercial,terreno,campo}',
    accepted_departments TEXT[] NOT NULL DEFAULT '{Montevideo,Canelones,Maldonado,Colonia,San Jose,Rocha,Todos}',
    accepted_currencies TEXT[] NOT NULL DEFAULT '{USD}',
    income_requirements TEXT DEFAULT 'Recibo de sueldo o certificado de contador público',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. OPORTUNIDADES Y ASIGNACIONES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunity_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMPTZ,
    status opportunity_status NOT NULL DEFAULT 'sent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(application_id, lender_id)
);

-- ------------------------------------------------------------------------------
-- 12. OFERTAS DE PRESTAMISTAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lender_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
    amount NUMERIC(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    term_months INT NOT NULL,
    rate NUMERIC(5,2) NOT NULL,
    rate_type VARCHAR(50) DEFAULT 'anual_fija',
    estimated_costs NUMERIC(14,2) DEFAULT 0.00,
    notes TEXT,
    expiration_date DATE,
    status offer_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. MENSAJERÍA, TAREAS Y NOTAS DE EXPEDIENTE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. SEGURIDAD, DATA DISCLOSURE Y AUDITORÍA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_disclosures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    lender_id UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
    data_category VARCHAR(100) NOT NULL,
    approved_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    disclosed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. ÍNDICES DE RENDIMIENTO
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_apps_org ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_apps_borrower ON applications(borrower_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_props_app ON properties(application_id);
CREATE INDEX IF NOT EXISTS idx_opps_app ON opportunity_assignments(application_id);
CREATE INDEX IF NOT EXISTS idx_opps_lender ON opportunity_assignments(lender_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
