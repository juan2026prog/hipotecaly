-- ==============================================================================
-- HIPOTECALY + SITEOS: Módulo Universal de Identidad, KYC y Firma Digital
-- Migración 00014: Tablas, RLS, Aislamiento Multi-Tenant, Auditoría y Hashes
-- ==============================================================================

-- 1. ENUMS Y TIPOS
DO $$ BEGIN
    CREATE TYPE identity_status_enum AS ENUM (
        'created',
        'in_progress',
        'pending_review',
        'verified',
        'failed',
        'resubmission_required',
        'expired',
        'abandoned'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE signature_status_enum AS ENUM (
        'draft',
        'prepared',
        'pending',
        'in_progress',
        'partially_signed',
        'signed',
        'rejected',
        'expired',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE signer_status_enum AS ENUM (
        'pending',
        'notified',
        'opened',
        'signed',
        'rejected',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA DE VERIFICACIONES DE IDENTIDAD (identity_verifications)
CREATE TABLE IF NOT EXISTS public.identity_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    case_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    provider VARCHAR(60) NOT NULL DEFAULT 'mock', -- 'mock', 'veriff', 'sumsub', 'persona', 'local'
    provider_session_id VARCHAR(255),
    session_url TEXT,
    mode VARCHAR(20) NOT NULL DEFAULT 'mock', -- 'mock', 'test', 'live'
    status identity_status_enum NOT NULL DEFAULT 'created',
    provider_status VARCHAR(100),
    decision_code VARCHAR(100),
    reason_code VARCHAR(100),
    reason TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA DE EVENTOS DE IDENTIDAD (identity_verification_events)
CREATE TABLE IF NOT EXISTS public.identity_verification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES public.identity_verifications(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider VARCHAR(60) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    provider_event_id VARCHAR(255),
    payload_hash VARCHAR(64),
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA DE CONSENTIMIENTOS DE PRIVACIDAD / KYC (identity_consents)
CREATE TABLE IF NOT EXISTS public.identity_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    consent_version VARCHAR(50) NOT NULL DEFAULT 'v1.0-2026',
    purpose VARCHAR(100) NOT NULL DEFAULT 'kyc_identity_verification',
    provider VARCHAR(60) NOT NULL DEFAULT 'mock',
    ip_address VARCHAR(45),
    user_agent TEXT,
    agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA DE PROCESOS DE FIRMA DIGITAL (signature_processes)
CREATE TABLE IF NOT EXISTS public.signature_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    case_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    provider VARCHAR(60) NOT NULL DEFAULT 'mock', -- 'mock', 'firma_gub', 'docusign', 'adobesign'
    provider_process_id VARCHAR(255),
    mode VARCHAR(20) NOT NULL DEFAULT 'mock', -- 'mock', 'test', 'live'
    status signature_status_enum NOT NULL DEFAULT 'draft',
    provider_status VARCHAR(100),
    security_secret_encrypted TEXT,
    signer_count INT NOT NULL DEFAULT 1,
    current_signer_index INT NOT NULL DEFAULT 0,
    signing_url TEXT,
    return_url TEXT,
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA DE FIRMANTES (signature_signers)
CREATE TABLE IF NOT EXISTS public.signature_signers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature_process_id UUID NOT NULL REFERENCES public.signature_processes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'applicant', -- 'applicant', 'spouse', 'owner', 'guarantor', 'lender', 'notary'
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    document_country VARCHAR(10) DEFAULT 'UY',
    document_type VARCHAR(50) DEFAULT 'CI',
    document_number_encrypted TEXT,
    order_index INT NOT NULL DEFAULT 0,
    status signer_status_enum NOT NULL DEFAULT 'pending',
    signed_at TIMESTAMPTZ,
    evidence JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLA DE DOCUMENTOS EN PROCESO DE FIRMA (signature_documents)
CREATE TABLE IF NOT EXISTS public.signature_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature_process_id UUID NOT NULL REFERENCES public.signature_processes(id) ON DELETE CASCADE,
    source_document_id UUID REFERENCES public.generated_documents(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    original_storage_path TEXT,
    signed_storage_path TEXT,
    sha256_original VARCHAR(64) NOT NULL,
    sha256_signed VARCHAR(64),
    provider_file_id VARCHAR(255),
    file_size_bytes BIGINT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signed_at TIMESTAMPTZ
);

-- 8. TABLA DE EVENTOS DE FIRMA DIGITAL (signature_events)
CREATE TABLE IF NOT EXISTS public.signature_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature_process_id UUID NOT NULL REFERENCES public.signature_processes(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider VARCHAR(60) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    provider_event_id VARCHAR(255),
    payload_hash VARCHAR(64),
    status VARCHAR(50) NOT NULL DEFAULT 'received',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CONFIGURACIÓN DE IDENTIDAD Y FIRMA POR TENANT (tenant_identity_settings)
CREATE TABLE IF NOT EXISTS public.tenant_identity_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    kyc_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    kyc_provider VARCHAR(60) NOT NULL DEFAULT 'mock',
    kyc_mode VARCHAR(20) NOT NULL DEFAULT 'mock',
    signature_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    signature_provider VARCHAR(60) NOT NULL DEFAULT 'mock',
    signature_mode VARCHAR(20) NOT NULL DEFAULT 'mock',
    byok_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_credentials_encrypted TEXT,
    signature_credentials_encrypted TEXT,
    auto_kyc_trigger BOOLEAN NOT NULL DEFAULT TRUE,
    require_guarantor_kyc BOOLEAN NOT NULL DEFAULT TRUE,
    allowed_signer_roles TEXT[] DEFAULT '{applicant,spouse,guarantor,lender,notary}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABLA DE IDEMPOTENCIA DE WEBHOOKS DE PROVEEDORES (provider_webhook_events)
CREATE TABLE IF NOT EXISTS public.provider_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(60) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'processing',
    response_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_provider_event UNIQUE(provider, event_id)
);

-- 11. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_id_verif_tenant ON public.identity_verifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_id_verif_case ON public.identity_verifications(case_id);
CREATE INDEX IF NOT EXISTS idx_id_verif_user ON public.identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_id_verif_status ON public.identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_id_verif_prov_sess ON public.identity_verifications(provider_session_id);

CREATE INDEX IF NOT EXISTS idx_sig_proc_tenant ON public.signature_processes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sig_proc_case ON public.signature_processes(case_id);
CREATE INDEX IF NOT EXISTS idx_sig_proc_status ON public.signature_processes(status);
CREATE INDEX IF NOT EXISTS idx_sig_proc_prov_id ON public.signature_processes(provider_process_id);

CREATE INDEX IF NOT EXISTS idx_sig_signers_proc ON public.signature_signers(signature_process_id);
CREATE INDEX IF NOT EXISTS idx_sig_docs_proc ON public.signature_documents(signature_process_id);
CREATE INDEX IF NOT EXISTS idx_sig_docs_sha_orig ON public.signature_documents(sha256_original);
CREATE INDEX IF NOT EXISTS idx_sig_docs_sha_signed ON public.signature_documents(sha256_signed);

CREATE INDEX IF NOT EXISTS idx_wh_events_lookup ON public.provider_webhook_events(provider, event_id);

-- 12. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_identity_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_webhook_events ENABLE ROW LEVEL SECURITY;

-- 13. POLÍTICAS RLS: Super Admin (acceso transversal)
CREATE POLICY "Super admin full access identity_verifications" ON public.identity_verifications
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE));

CREATE POLICY "Super admin full access identity_verification_events" ON public.identity_verification_events
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE));

CREATE POLICY "Super admin full access signature_processes" ON public.signature_processes
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE));

CREATE POLICY "Super admin full access signature_signers" ON public.signature_signers
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE));

CREATE POLICY "Super admin full access signature_documents" ON public.signature_documents
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE));

CREATE POLICY "Super admin full access signature_events" ON public.signature_events
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE));

CREATE POLICY "Super admin full access tenant_identity_settings" ON public.tenant_identity_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE));

-- 14. POLÍTICAS RLS: Miembros del Tenant (Admins, Analistas, Escribanos)
CREATE POLICY "Tenant members access identity_verifications" ON public.identity_verifications
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Tenant members access signature_processes" ON public.signature_processes
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Tenant members access signature_signers" ON public.signature_signers
    FOR ALL TO authenticated
    USING (signature_process_id IN (SELECT id FROM public.signature_processes WHERE tenant_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));

CREATE POLICY "Tenant members access signature_documents" ON public.signature_documents
    FOR ALL TO authenticated
    USING (signature_process_id IN (SELECT id FROM public.signature_processes WHERE tenant_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())));

CREATE POLICY "Public read tenant identity settings" ON public.tenant_identity_settings
    FOR SELECT USING (TRUE);

CREATE POLICY "Tenant admins manage identity settings" ON public.tenant_identity_settings
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('tenant_owner', 'tenant_admin')));

-- 15. POLÍTICAS RLS: Solicitantes / Clientes (Borrowers)
CREATE POLICY "Borrowers view own identity_verifications" ON public.identity_verifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR case_id IN (
        SELECT a.id FROM public.applications a
        JOIN public.borrowers b ON b.id = a.borrower_id
        WHERE b.user_id = auth.uid()
    ));

CREATE POLICY "Borrowers view own signature_processes" ON public.signature_processes
    FOR SELECT TO authenticated
    USING (case_id IN (
        SELECT a.id FROM public.applications a
        JOIN public.borrowers b ON b.id = a.borrower_id
        WHERE b.user_id = auth.uid()
    ));

CREATE POLICY "Borrowers view own signature_signers" ON public.signature_signers
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR signature_process_id IN (
        SELECT id FROM public.signature_processes WHERE case_id IN (
            SELECT a.id FROM public.applications a
            JOIN public.borrowers b ON b.id = a.borrower_id
            WHERE b.user_id = auth.uid()
        )
    ));

CREATE POLICY "Borrowers view own signature_documents" ON public.signature_documents
    FOR SELECT TO authenticated
    USING (signature_process_id IN (
        SELECT id FROM public.signature_processes WHERE case_id IN (
            SELECT a.id FROM public.applications a
            JOIN public.borrowers b ON b.id = a.borrower_id
            WHERE b.user_id = auth.uid()
        )
    ));

CREATE POLICY "Users view and create own consents" ON public.identity_consents
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR tenant_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
