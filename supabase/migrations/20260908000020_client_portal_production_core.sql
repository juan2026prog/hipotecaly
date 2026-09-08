-- ==============================================================================
-- HIPOTECALY: Módulo Productivo del Panel Cliente
-- Migración 00020: Tabla de Simulaciones, Documentos Personales Reutilizables,
-- Snapshots de Expedientes y RLS Multi-Tenant
-- ==============================================================================

-- 1. TABLA DE SIMULACIONES GUARDADAS (simulations)
CREATE TABLE IF NOT EXISTS public.simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    requested_amount NUMERIC(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    property_value NUMERIC(14,2) NOT NULL,
    term_months INT NOT NULL DEFAULT 36,
    property_type VARCHAR(50) NOT NULL DEFAULT 'apartamento',
    department VARCHAR(100) NOT NULL DEFAULT 'Montevideo',
    legal_status VARCHAR(50) DEFAULT 'libre_gravamenes',
    income_type VARCHAR(50) DEFAULT 'dependiente',
    repayment_mode VARCHAR(50) DEFAULT 'solo_intereses', -- 'solo_intereses', 'capital_intereses'
    monthly_payment_estimated NUMERIC(14,2) NOT NULL,
    rate_annual NUMERIC(6,2) NOT NULL DEFAULT 11.00,
    ltv_percentage NUMERIC(6,2) NOT NULL,
    closing_costs_estimated NUMERIC(14,2) DEFAULT 0.00,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA DE DOCUMENTOS PERSONALES REUTILIZABLES (borrower_personal_documents)
CREATE TABLE IF NOT EXISTS public.borrower_personal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    borrower_id UUID REFERENCES public.borrowers(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    document_type VARCHAR(80) NOT NULL, -- 'cedula_identidad', 'irpf', 'recibo_sueldo_1', 'recibo_sueldo_2', 'recibo_sueldo_3', 'comprobante_domicilio'
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'received', 'verified', 'in_review', 'requires_update'
    file_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT DEFAULT 0,
    file_hash VARCHAR(64), -- SHA-256
    mime_type VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA DE SNAPSHOTS INMUTABLES DE EXPEDIENTES (application_snapshots)
CREATE TABLE IF NOT EXISTS public.application_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    snapshot_type VARCHAR(50) NOT NULL DEFAULT 'submission', -- 'submission', 'approval', 'signature_ready'
    borrower_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    income_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    property_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    terms_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_simulations_user ON public.simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_org ON public.simulations(organization_id);
CREATE INDEX IF NOT EXISTS idx_simulations_app ON public.simulations(application_id);
CREATE INDEX IF NOT EXISTS idx_b_pers_docs_user ON public.borrower_personal_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_b_pers_docs_org ON public.borrower_personal_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_b_pers_docs_type ON public.borrower_personal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_app_snapshots_app ON public.application_snapshots(application_id);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrower_personal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_snapshots ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA SIMULACIONES
DROP POLICY IF EXISTS "simulations_select_owner" ON public.simulations;
CREATE POLICY "simulations_select_owner" ON public.simulations
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = simulations.organization_id
            AND om.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "simulations_insert_owner" ON public.simulations;
CREATE POLICY "simulations_insert_owner" ON public.simulations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

DROP POLICY IF EXISTS "simulations_update_owner" ON public.simulations;
CREATE POLICY "simulations_update_owner" ON public.simulations
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = simulations.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'analyst')
        )
    );

DROP POLICY IF EXISTS "simulations_delete_owner" ON public.simulations;
CREATE POLICY "simulations_delete_owner" ON public.simulations
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- 7. POLÍTICAS RLS PARA DOCUMENTOS PERSONALES
DROP POLICY IF EXISTS "b_pers_docs_select_owner" ON public.borrower_personal_documents;
CREATE POLICY "b_pers_docs_select_owner" ON public.borrower_personal_documents
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = borrower_personal_documents.organization_id
            AND om.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "b_pers_docs_insert_owner" ON public.borrower_personal_documents;
CREATE POLICY "b_pers_docs_insert_owner" ON public.borrower_personal_documents
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

DROP POLICY IF EXISTS "b_pers_docs_update_owner" ON public.borrower_personal_documents;
CREATE POLICY "b_pers_docs_update_owner" ON public.borrower_personal_documents
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = borrower_personal_documents.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'analyst')
        )
    );

DROP POLICY IF EXISTS "b_pers_docs_delete_owner" ON public.borrower_personal_documents;
CREATE POLICY "b_pers_docs_delete_owner" ON public.borrower_personal_documents
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- 8. POLÍTICAS RLS PARA SNAPSHOTS DE EXPEDIENTE
DROP POLICY IF EXISTS "app_snapshots_select" ON public.application_snapshots;
CREATE POLICY "app_snapshots_select" ON public.application_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            JOIN public.borrowers b ON a.borrower_id = b.id
            WHERE a.id = application_snapshots.application_id
            AND b.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = application_snapshots.organization_id
            AND om.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "app_snapshots_insert" ON public.application_snapshots;
CREATE POLICY "app_snapshots_insert" ON public.application_snapshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.applications a
            JOIN public.borrowers b ON a.borrower_id = b.id
            WHERE a.id = application_snapshots.application_id
            AND b.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = application_snapshots.organization_id
            AND om.user_id = auth.uid()
        )
    );
