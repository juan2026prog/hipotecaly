-- ==============================================================================
-- HIPOTECALY TASADOR IA - MIGRACIÓN: VALUATION RUNS, EXPEDIENTE Y REPORTES (PARTE 3)
-- Esquema para ejecuciones inmutables, snapshots congelados, auditoría y PDFs
-- ==============================================================================

-- 1. Tabla de Ejecuciones de Valoración Inmutables (Valuation Runs)
CREATE TABLE IF NOT EXISTS public.appraisal_valuation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appraisal_id TEXT NOT NULL REFERENCES public.appraisals(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    run_number INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    creator_email TEXT,
    engine_version TEXT NOT NULL DEFAULT 'v1.0.0-certified',
    configuration_version INTEGER NOT NULL DEFAULT 1,
    target_property_snapshot JSONB NOT NULL,
    comparable_set_snapshot JSONB NOT NULL,
    comparables_used_count INTEGER NOT NULL DEFAULT 0,
    excluded_comparables_count INTEGER NOT NULL DEFAULT 0,
    estimated_market_value NUMERIC NOT NULL,
    estimated_price_per_m2_usd NUMERIC NOT NULL,
    value_range_min NUMERIC NOT NULL,
    value_range_max NUMERIC NOT NULL,
    confidence_level TEXT NOT NULL CHECK (confidence_level IN ('ALTA', 'MEDIA', 'BAJA')),
    method_estimators JSONB NOT NULL DEFAULT '[]'::jsonb,
    favorable_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    consideration_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsqueda rápida por tasación y organización
CREATE INDEX IF NOT EXISTS idx_valuation_runs_appraisal_id 
    ON public.appraisal_valuation_runs(appraisal_id);
CREATE INDEX IF NOT EXISTS idx_valuation_runs_organization_id 
    ON public.appraisal_valuation_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_valuation_runs_created_at 
    ON public.appraisal_valuation_runs(created_at DESC);

-- 2. Tabla de Registro de Auditoría y Timeline (Audit Logs)
CREATE TABLE IF NOT EXISTS public.appraisal_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appraisal_id TEXT NOT NULL REFERENCES public.appraisals(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    user_id TEXT,
    user_email TEXT,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appraisal_audit_logs_appraisal_id 
    ON public.appraisal_audit_logs(appraisal_id);
CREATE INDEX IF NOT EXISTS idx_appraisal_audit_logs_created_at 
    ON public.appraisal_audit_logs(created_at ASC);

-- 3. Tabla de Metadatos de Informes Profesionales (PDFs generados)
CREATE TABLE IF NOT EXISTS public.appraisal_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appraisal_id TEXT NOT NULL REFERENCES public.appraisals(id) ON DELETE CASCADE,
    run_id UUID REFERENCES public.appraisal_valuation_runs(id) ON DELETE SET NULL,
    organization_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    file_hash_sha256 TEXT NOT NULL,
    branding_used JSONB DEFAULT '{}'::jsonb,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appraisal_reports_appraisal_id 
    ON public.appraisal_reports(appraisal_id);

-- 4. Habilitar RLS con aislamiento estricto por organización
ALTER TABLE public.appraisal_valuation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_reports ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: miembros de la organización pueden leer y crear registros
DROP POLICY IF EXISTS "valuation_runs_org_policy" ON public.appraisal_valuation_runs;
CREATE POLICY "valuation_runs_org_policy" ON public.appraisal_valuation_runs
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true
        )
    );

DROP POLICY IF EXISTS "audit_logs_org_policy" ON public.appraisal_audit_logs;
CREATE POLICY "audit_logs_org_policy" ON public.appraisal_audit_logs
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true
        )
    );

DROP POLICY IF EXISTS "reports_org_policy" ON public.appraisal_reports;
CREATE POLICY "reports_org_policy" ON public.appraisal_reports
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND is_super_admin = true
        )
    );
