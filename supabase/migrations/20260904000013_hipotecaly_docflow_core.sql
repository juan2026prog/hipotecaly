-- ==============================================================================
-- HIPOTECALY: Módulo Central DOCFLOW (Infraestructura Documental & Autollenado)
-- Migración 00013: Tablas, Versionado, Snapshots, Hashes y RLS Multi-Tenant
-- ==============================================================================

-- 1. ENUMS Y TIPOS DOCFLOW
DO $$ BEGIN
    CREATE TYPE document_status_enum AS ENUM (
        'draft',
        'data_missing',
        'generated',
        'under_review',
        'approved',
        'ready_for_signature',
        'sent_for_signature',
        'partially_signed',
        'signed',
        'rejected',
        'expired',
        'superseded',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE template_status_enum AS ENUM (
        'draft',
        'active',
        'inactive',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA DE PLANTILLAS DOCUMENTALES (document_templates)
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'solicitud', -- 'solicitud', 'legal', 'financiero', 'inmueble', 'notarial', 'comunicacion'
    document_type VARCHAR(100) NOT NULL DEFAULT 'pdf',
    status template_status_enum NOT NULL DEFAULT 'active',
    version INT NOT NULL DEFAULT 1,
    template_content TEXT NOT NULL,
    output_format VARCHAR(50) NOT NULL DEFAULT 'pdf', -- 'pdf', 'html', 'docx'
    requires_signature BOOLEAN NOT NULL DEFAULT FALSE,
    signature_type VARCHAR(50) DEFAULT 'simple', -- 'simple', 'advanced_electronic', 'notarial'
    required_roles TEXT[] DEFAULT '{applicant}',
    required_fields TEXT[] DEFAULT '{}',
    conditional_rules JSONB DEFAULT '[]'::jsonb,
    signers_config JSONB DEFAULT '[]'::jsonb,
    is_global BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    CONSTRAINT unique_tenant_slug UNIQUE(tenant_id, slug, version)
);

-- 3. TABLA DE DOCUMENTOS GENERADOS & VERSIONADOS (generated_documents)
CREATE TABLE IF NOT EXISTS public.generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
    template_version INT NOT NULL DEFAULT 1,
    document_version INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'expediente',
    document_type VARCHAR(100) NOT NULL,
    status document_status_enum NOT NULL DEFAULT 'generated',
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_url TEXT,
    file_path TEXT,
    file_hash VARCHAR(64), -- SHA-256
    file_size BIGINT DEFAULT 0,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    signed_file_url TEXT,
    signed_at TIMESTAMPTZ,
    signature_evidence JSONB DEFAULT '{}'::jsonb,
    missing_fields TEXT[] DEFAULT '{}',
    change_detected BOOLEAN NOT NULL DEFAULT FALSE,
    superseded_by UUID REFERENCES public.generated_documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ÍNDICES DE RENDIMIENTO DOCFLOW
CREATE INDEX IF NOT EXISTS idx_doc_tpl_tenant ON public.document_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doc_tpl_global ON public.document_templates(is_global);
CREATE INDEX IF NOT EXISTS idx_doc_tpl_slug ON public.document_templates(slug);
CREATE INDEX IF NOT EXISTS idx_gen_docs_case ON public.generated_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_tenant ON public.generated_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_status ON public.generated_documents(status);
CREATE INDEX IF NOT EXISTS idx_gen_docs_hash ON public.generated_documents(file_hash);

-- 5. CONFIGURACIÓN DOCFLOW POR TENANT (MÓDULO & PARÁMETROS)
CREATE TABLE IF NOT EXISTS public.tenant_docflow_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    header_logo_url TEXT,
    legal_name VARCHAR(255),
    legal_representative VARCHAR(255),
    legal_address TEXT,
    document_footer_text TEXT DEFAULT 'Documento emitido electrónicamente por HIPOTECALY DOCFLOW. Validez según Ley N° 18.600.',
    allow_digital_signature BOOLEAN NOT NULL DEFAULT TRUE,
    default_timezone VARCHAR(50) NOT NULL DEFAULT 'America/Montevideo',
    default_language VARCHAR(10) NOT NULL DEFAULT 'es-UY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_docflow_settings ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS: document_templates
-- Super Admin: acceso total
CREATE POLICY "Super admin full access templates" ON public.document_templates
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
    );

-- Lectura de templates globales o pertenecientes al tenant del usuario
CREATE POLICY "Users read global and own tenant templates" ON public.document_templates
    FOR SELECT TO authenticated
    USING (
        is_global = TRUE OR
        tenant_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Edición solo por administradores del tenant
CREATE POLICY "Tenant admins manage own templates" ON public.document_templates
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('tenant_owner', 'tenant_admin')
        )
    );

-- 8. POLÍTICAS RLS: generated_documents
-- Super Admin: acceso total
CREATE POLICY "Super admin full access generated docs" ON public.generated_documents
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
    );

-- Solicitantes (Borrowers): solo ven documentos de sus propias solicitudes
CREATE POLICY "Borrowers view own generated docs" ON public.generated_documents
    FOR SELECT TO authenticated
    USING (
        case_id IN (
            SELECT a.id FROM public.applications a
            JOIN public.borrowers b ON b.id = a.borrower_id
            WHERE b.user_id = auth.uid()
        )
    );

-- Miembros del Tenant: analistas, escribanos y admins de la organización
CREATE POLICY "Tenant members access generated docs" ON public.generated_documents
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- 9. POLÍTICAS RLS: tenant_docflow_settings
CREATE POLICY "Public read tenant docflow settings" ON public.tenant_docflow_settings
    FOR SELECT USING (TRUE);

CREATE POLICY "Tenant admin manage docflow settings" ON public.tenant_docflow_settings
    FOR ALL TO authenticated
    USING (
        tenant_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('tenant_owner', 'tenant_admin')
        )
    );
