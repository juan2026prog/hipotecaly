-- ==============================================================================
-- HIPOTECALY: Migración de Aislamiento Estricto RLS para Red Privada de Inversores
-- Garantiza que inversores, ofertas, oportunidades y reglas pertenezcan al Tenant
-- ==============================================================================

-- 1. Helper function para verificar pertenencia de un lender a una organización
CREATE OR REPLACE FUNCTION public.get_lender_org_id(target_lender_id UUID)
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM public.lenders
    WHERE id = target_lender_id;
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Endurecer Políticas para `lenders`
DROP POLICY IF EXISTS "Lenders tenant isolation select" ON public.lenders;
CREATE POLICY "Lenders tenant isolation select"
    ON public.lenders FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR user_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

DROP POLICY IF EXISTS "Lenders tenant isolation update" ON public.lenders;
CREATE POLICY "Lenders tenant isolation update"
    ON public.lenders FOR UPDATE
    TO authenticated
    USING (
        public.is_super_admin()
        OR user_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

-- 3. Endurecer Políticas para `lender_rules`
DROP POLICY IF EXISTS "Lender rules tenant isolation select" ON public.lender_rules;
CREATE POLICY "Lender rules tenant isolation select"
    ON public.lender_rules FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_rules.lender_id
            AND (l.user_id = auth.uid() OR public.is_member_of_org(l.organization_id))
        )
    );

-- 4. Endurecer Políticas para `opportunities` (Aislamiento por Organización)
DROP POLICY IF EXISTS "Opportunities tenant isolation select" ON public.opportunities;
CREATE POLICY "Opportunities tenant isolation select"
    ON public.opportunities FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.applications a
            JOIN public.lenders l ON l.user_id = auth.uid()
            WHERE a.id = opportunities.application_id
            AND (a.organization_id = l.organization_id OR public.is_member_of_org(a.organization_id))
        )
    );

-- 5. Endurecer Políticas para `offers` (Aislamiento por Organización y Emisor)
DROP POLICY IF EXISTS "Offers tenant isolation select" ON public.offers;
CREATE POLICY "Offers tenant isolation select"
    ON public.offers FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = offers.lender_id
            AND l.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = offers.application_id
            AND (
                public.is_member_of_org(a.organization_id)
                OR (offers.status = 'presented' AND a.borrower_id IN (SELECT id FROM public.borrowers WHERE user_id = auth.uid()))
            )
        )
    );

DROP POLICY IF EXISTS "Offers tenant isolation insert" ON public.offers;
CREATE POLICY "Offers tenant isolation insert"
    ON public.offers FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            JOIN public.applications a ON a.id = offers.application_id
            WHERE l.id = offers.lender_id
            AND l.user_id = auth.uid()
            AND (l.organization_id = a.organization_id)
        )
    );

-- 6. Endurecer Políticas para `data_disclosures`
DROP POLICY IF EXISTS "Data disclosures tenant isolation select" ON public.data_disclosures;
CREATE POLICY "Data disclosures tenant isolation select"
    ON public.data_disclosures FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = data_disclosures.lender_id
            AND l.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = data_disclosures.application_id
            AND public.is_member_of_org(a.organization_id)
        )
    );
