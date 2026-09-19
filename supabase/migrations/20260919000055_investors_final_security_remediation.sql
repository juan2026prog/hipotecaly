-- ==============================================================================
-- HIPOTECALY: REMEDIACIÓN DEFINITIVA DE SEGURIDAD Y RLS MÓDULO INVERSORES
-- ==============================================================================

-- 1. ASEGURAR ROW LEVEL SECURITY HABILITADO
ALTER TABLE public.lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lender_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_interests ENABLE ROW LEVEL SECURITY;

-- 2. LIMPIEZA COMPLETA DE POLÍTICAS LEGACY Y PERMISIVAS EN `lender_rules`
DROP POLICY IF EXISTS "Public read for active lender rules" ON public.lender_rules;
DROP POLICY IF EXISTS "Tenant admins manage lender rules" ON public.lender_rules;
DROP POLICY IF EXISTS "Lender rules tenant isolation select" ON public.lender_rules;
DROP POLICY IF EXISTS "Lender rules select" ON public.lender_rules;
DROP POLICY IF EXISTS "Lender rules staff manage" ON public.lender_rules;
DROP POLICY IF EXISTS "Lender rules investor manage" ON public.lender_rules;
DROP POLICY IF EXISTS "Lender rules select policy" ON public.lender_rules;
DROP POLICY IF EXISTS "Lender rules insert policy" ON public.lender_rules;
DROP POLICY IF EXISTS "Lender rules update policy" ON public.lender_rules;
DROP POLICY IF EXISTS "Lender rules delete policy" ON public.lender_rules;

-- 3. POLÍTICAS CANÓNICAS ESTRICTAS PARA `lender_rules` (TO authenticated ONLY)
CREATE POLICY "Lender rules select policy"
    ON public.lender_rules FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_rules.lender_id
            AND (
                l.user_id = auth.uid()
                OR (l.organization_id IS NOT NULL AND public.is_member_of_org(l.organization_id))
            )
        )
    );

CREATE POLICY "Lender rules insert policy"
    ON public.lender_rules FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_rules.lender_id
            AND (
                l.user_id = auth.uid()
                OR (l.organization_id IS NOT NULL AND public.is_member_of_org(l.organization_id))
            )
        )
    );

CREATE POLICY "Lender rules update policy"
    ON public.lender_rules FOR UPDATE
    TO authenticated
    USING (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_rules.lender_id
            AND (
                l.user_id = auth.uid()
                OR (l.organization_id IS NOT NULL AND public.is_member_of_org(l.organization_id))
            )
        )
    )
    WITH CHECK (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_rules.lender_id
            AND (
                l.user_id = auth.uid()
                OR (l.organization_id IS NOT NULL AND public.is_member_of_org(l.organization_id))
            )
        )
    );

CREATE POLICY "Lender rules delete policy"
    ON public.lender_rules FOR DELETE
    TO authenticated
    USING (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_rules.lender_id
            AND (
                l.user_id = auth.uid()
                OR (l.organization_id IS NOT NULL AND public.is_member_of_org(l.organization_id))
            )
        )
    );

-- 4. LIMPIEZA Y RECREACIÓN DE POLÍTICAS EN `lenders`
DROP POLICY IF EXISTS "Lenders anon block" ON public.lenders;
DROP POLICY IF EXISTS "Lenders select policy" ON public.lenders;
DROP POLICY IF EXISTS "Lenders tenant isolation select" ON public.lenders;
DROP POLICY IF EXISTS "Lenders tenant isolation insert" ON public.lenders;
DROP POLICY IF EXISTS "Lenders tenant isolation update" ON public.lenders;
DROP POLICY IF EXISTS "Lenders insert policy" ON public.lenders;
DROP POLICY IF EXISTS "Lenders update policy" ON public.lenders;
DROP POLICY IF EXISTS "Lenders delete policy" ON public.lenders;

CREATE POLICY "Lenders select policy"
    ON public.lenders FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR user_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

CREATE POLICY "Lenders insert policy"
    ON public.lenders FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

CREATE POLICY "Lenders update policy"
    ON public.lenders FOR UPDATE
    TO authenticated
    USING (
        public.is_super_admin()
        OR user_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    )
    WITH CHECK (
        public.is_super_admin()
        OR user_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

CREATE POLICY "Lenders delete policy"
    ON public.lenders FOR DELETE
    TO authenticated
    USING (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

-- 5. LIMPIEZA Y RECREACIÓN DE POLÍTICAS EN `investor_leads`
DROP POLICY IF EXISTS "Investor leads staff select" ON public.investor_leads;
DROP POLICY IF EXISTS "Investor leads staff insert" ON public.investor_leads;
DROP POLICY IF EXISTS "Investor leads staff update" ON public.investor_leads;
DROP POLICY IF EXISTS "Investor leads staff delete" ON public.investor_leads;

CREATE POLICY "Investor leads staff select"
    ON public.investor_leads FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

CREATE POLICY "Investor leads staff insert"
    ON public.investor_leads FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

CREATE POLICY "Investor leads staff update"
    ON public.investor_leads FOR UPDATE
    TO authenticated
    USING (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    )
    WITH CHECK (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

CREATE POLICY "Investor leads staff delete"
    ON public.investor_leads FOR DELETE
    TO authenticated
    USING (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

-- 6. LIMPIEZA Y RECREACIÓN DE POLÍTICAS EN `investor_interests`
DROP POLICY IF EXISTS "Investor interests select" ON public.investor_interests;
DROP POLICY IF EXISTS "Investor interests insert lender" ON public.investor_interests;
DROP POLICY IF EXISTS "Investor interests update" ON public.investor_interests;
DROP POLICY IF EXISTS "Investor interests delete" ON public.investor_interests;

CREATE POLICY "Investor interests select"
    ON public.investor_interests FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = investor_interests.lender_id
            AND l.user_id = auth.uid()
        )
    );

CREATE POLICY "Investor interests insert lender"
    ON public.investor_interests FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = investor_interests.lender_id
            AND l.user_id = auth.uid()
            AND l.organization_id = investor_interests.organization_id
        )
    );

CREATE POLICY "Investor interests update"
    ON public.investor_interests FOR UPDATE
    TO authenticated
    USING (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = investor_interests.lender_id
            AND l.user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = investor_interests.lender_id
            AND l.user_id = auth.uid()
        )
    );

CREATE POLICY "Investor interests delete"
    ON public.investor_interests FOR DELETE
    TO authenticated
    USING (
        public.is_super_admin()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );
