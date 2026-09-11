-- ==============================================================================
-- MIGRACIÓN 20260911000049: Tasador IA - Esquema Multi-Tenant de Tasaciones Operativas
-- Tablas 'appraisals' y 'appraisal_comparables' con RLS estricto y auditoría
-- ==============================================================================

-- 1. TABLA PRINCIPAL DE TASACIONES OPERATIVAS (appraisals)
CREATE TABLE IF NOT EXISTS public.appraisals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'READY_FOR_COMPARABLES', 'COMPARABLES_FOUND', 'COMPARABLES_REVIEWED', 'READY_FOR_VALUATION')
    ),
    property_input JSONB NOT NULL DEFAULT '{}'::jsonb,
    location JSONB NOT NULL DEFAULT '{}'::jsonb,
    selected_comparables_count INTEGER DEFAULT 0,
    set_quality VARCHAR(20) DEFAULT 'MEDIA' CHECK (set_quality IN ('ALTA', 'MEDIA', 'BAJA')),
    descriptive_stats JSONB DEFAULT '{}'::jsonb,
    estimated_value NUMERIC(15, 2),
    valuation_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA DE COMPARABLES SELECCIONADOS / CONTEXTUALES POR TASACIÓN (appraisal_comparables)
CREATE TABLE IF NOT EXISTS public.appraisal_comparables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appraisal_id UUID NOT NULL REFERENCES public.appraisals(id) ON DELETE CASCADE,
    property_master_id UUID REFERENCES public.property_master(id) ON DELETE SET NULL,
    listing_id UUID REFERENCES public.property_listings(id) ON DELETE SET NULL,
    similarity_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    selected BOOLEAN NOT NULL DEFAULT true,
    exclusion_reason TEXT,
    analyst_note TEXT,
    rank INTEGER NOT NULL DEFAULT 1,
    candidate_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ÍNDICES DE RENDIMIENTO Y MULTI-TENANCY
CREATE INDEX IF NOT EXISTS idx_appraisals_org_status ON public.appraisals(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_appraisals_created_by ON public.appraisals(created_by);
CREATE INDEX IF NOT EXISTS idx_appraisals_created_at ON public.appraisals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appraisal_comparables_appraisal ON public.appraisal_comparables(appraisal_id, rank);
CREATE INDEX IF NOT EXISTS idx_appraisal_comparables_selected ON public.appraisal_comparables(appraisal_id, selected);

-- 4. TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.fn_appraisals_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appraisals_updated_at ON public.appraisals;
CREATE TRIGGER trg_appraisals_updated_at
BEFORE UPDATE ON public.appraisals
FOR EACH ROW EXECUTE FUNCTION public.fn_appraisals_touch_updated_at();

DROP TRIGGER IF EXISTS trg_appraisal_comparables_updated_at ON public.appraisal_comparables;
CREATE TRIGGER trg_appraisal_comparables_updated_at
BEFORE UPDATE ON public.appraisal_comparables
FOR EACH ROW EXECUTE FUNCTION public.fn_appraisals_touch_updated_at();

-- 5. BLINDAJE RLS (ROW LEVEL SECURITY)
ALTER TABLE public.appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_comparables ENABLE ROW LEVEL SECURITY;

-- Revocar accesos públicos y anónimos
REVOKE ALL ON public.appraisals FROM PUBLIC, anon;
REVOKE ALL ON public.appraisal_comparables FROM PUBLIC, anon;

-- POLÍTICAS PARA public.appraisals
DROP POLICY IF EXISTS "authenticated_select_appraisals" ON public.appraisals;
CREATE POLICY "authenticated_select_appraisals"
ON public.appraisals FOR SELECT
TO authenticated
USING (
    public.is_member_of_org(organization_id) OR public.is_super_admin()
);

DROP POLICY IF EXISTS "authenticated_insert_appraisals" ON public.appraisals;
CREATE POLICY "authenticated_insert_appraisals"
ON public.appraisals FOR INSERT
TO authenticated
WITH CHECK (
    public.is_member_of_org(organization_id) OR public.is_super_admin()
);

DROP POLICY IF EXISTS "authenticated_update_appraisals" ON public.appraisals;
CREATE POLICY "authenticated_update_appraisals"
ON public.appraisals FOR UPDATE
TO authenticated
USING (
    public.is_member_of_org(organization_id) OR public.is_super_admin()
)
WITH CHECK (
    public.is_member_of_org(organization_id) OR public.is_super_admin()
);

DROP POLICY IF EXISTS "authenticated_delete_appraisals" ON public.appraisals;
CREATE POLICY "authenticated_delete_appraisals"
ON public.appraisals FOR DELETE
TO authenticated
USING (
    public.is_member_of_org(organization_id) OR public.is_super_admin()
);

DROP POLICY IF EXISTS "service_role_all_appraisals" ON public.appraisals;
CREATE POLICY "service_role_all_appraisals"
ON public.appraisals FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- POLÍTICAS PARA public.appraisal_comparables (heredadas via appraisal_id)
DROP POLICY IF EXISTS "authenticated_select_appraisal_comparables" ON public.appraisal_comparables;
CREATE POLICY "authenticated_select_appraisal_comparables"
ON public.appraisal_comparables FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.appraisals a
        WHERE a.id = appraisal_comparables.appraisal_id
        AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
    )
);

DROP POLICY IF EXISTS "authenticated_insert_appraisal_comparables" ON public.appraisal_comparables;
CREATE POLICY "authenticated_insert_appraisal_comparables"
ON public.appraisal_comparables FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.appraisals a
        WHERE a.id = appraisal_comparables.appraisal_id
        AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
    )
);

DROP POLICY IF EXISTS "authenticated_update_appraisal_comparables" ON public.appraisal_comparables;
CREATE POLICY "authenticated_update_appraisal_comparables"
ON public.appraisal_comparables FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.appraisals a
        WHERE a.id = appraisal_comparables.appraisal_id
        AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.appraisals a
        WHERE a.id = appraisal_comparables.appraisal_id
        AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
    )
);

DROP POLICY IF EXISTS "authenticated_delete_appraisal_comparables" ON public.appraisal_comparables;
CREATE POLICY "authenticated_delete_appraisal_comparables"
ON public.appraisal_comparables FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.appraisals a
        WHERE a.id = appraisal_comparables.appraisal_id
        AND (public.is_member_of_org(a.organization_id) OR public.is_super_admin())
    )
);

DROP POLICY IF EXISTS "service_role_all_appraisal_comparables" ON public.appraisal_comparables;
CREATE POLICY "service_role_all_appraisal_comparables"
ON public.appraisal_comparables FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Otorgar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appraisals TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appraisal_comparables TO authenticated, service_role;
