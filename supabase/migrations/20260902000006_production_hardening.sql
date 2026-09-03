-- ==============================================================================
-- HIPOTECALY: Migración de Hardening de Producción y Paridad
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.generate_application_public_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    seq_val INT;
BEGIN
    SELECT nextval('public.application_public_id_seq') INTO seq_val;
    NEW.public_id := 'HIP-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(seq_val::text, 4, '0');
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_org(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_super_admin = TRUE
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE user_id = auth.uid() 
          AND organization_id = org_id 
          AND is_active = TRUE
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_borrower_id_for_user(user_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    b_id UUID;
BEGIN
    SELECT id INTO b_id FROM public.borrowers WHERE user_id = user_uuid LIMIT 1;
    RETURN b_id;
END;
$$;

CREATE OR REPLACE VIEW public.anonymized_opportunities_view 
WITH (security_invoker = true)
AS
SELECT 
    o.id AS opportunity_id,
    o.application_id,
    o.lender_id,
    o.status AS opportunity_status,
    o.match_score,
    o.matched_rules,
    o.failed_rules,
    o.warnings,
    o.sent_at,
    o.viewed_at,
    o.expires_at,
    a.public_id,
    a.currency,
    a.requested_amount,
    a.term_months,
    a.purpose,
    p.property_type,
    p.department,
    p.neighborhood,
    p.surface_m2,
    p.estimated_value AS declared_property_value,
    COALESCE(pv.estimated_value, pv.preliminary_value) AS preliminary_valuation,
    COALESCE(pv.confidence_level, pv.confidence) AS valuation_confidence,
    COALESCE(pv.valuation_range_min, pv.valuation_min) AS valuation_range_min,
    COALESCE(pv.valuation_range_max, pv.valuation_max) AS valuation_range_max,
    ROUND((a.requested_amount / NULLIF(COALESCE(pv.estimated_value, pv.preliminary_value, p.estimated_value), 0)) * 100, 1) AS ltv_percentage,
    b.clearing_status
FROM public.opportunities o
JOIN public.applications a ON a.id = o.application_id
JOIN public.properties p ON p.application_id = a.id
LEFT JOIN public.property_valuations pv ON pv.property_id = p.id OR pv.application_id = a.id
LEFT JOIN public.borrowers b ON b.id = a.borrower_id;

DROP POLICY IF EXISTS "Messages access policy" ON public.application_messages;
CREATE POLICY "Messages access policy" ON public.application_messages
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND (
                public.is_member_of_org(a.organization_id) OR
                (a.borrower_id = public.get_borrower_id_for_user(auth.uid()) AND is_internal = FALSE)
            )
        )
    );

DROP POLICY IF EXISTS "Status history access policy" ON public.application_status_history;
CREATE POLICY "Status history access policy" ON public.application_status_history
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND (
                public.is_member_of_org(a.organization_id) OR
                a.borrower_id = public.get_borrower_id_for_user(auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Borrower income policy" ON public.borrower_income;
CREATE POLICY "Borrower income policy" ON public.borrower_income
    FOR ALL TO authenticated
    USING (
        borrower_id = public.get_borrower_id_for_user(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.borrowers b
            WHERE b.id = borrower_id AND public.is_member_of_org(b.organization_id)
        )
    );

DROP POLICY IF EXISTS "Data disclosures policy" ON public.data_disclosures;
CREATE POLICY "Data disclosures policy" ON public.data_disclosures
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND (
                public.is_member_of_org(a.organization_id) OR
                a.borrower_id = public.get_borrower_id_for_user(auth.uid())
            )
        ) OR
        EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_id AND l.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Lenders select policy" ON public.lenders;
CREATE POLICY "Lenders select policy" ON public.lenders
    FOR SELECT TO authenticated
    USING (is_active = TRUE OR user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "Notes policy" ON public.notes;
CREATE POLICY "Notes policy" ON public.notes
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND public.is_member_of_org(a.organization_id)
        )
    );

DROP POLICY IF EXISTS "Valuations policy" ON public.property_valuations;
CREATE POLICY "Valuations policy" ON public.property_valuations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            JOIN public.applications a ON a.id = p.application_id
            WHERE p.id = property_id AND (
                public.is_member_of_org(a.organization_id) OR
                a.borrower_id = public.get_borrower_id_for_user(auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Tasks policy" ON public.tasks;
CREATE POLICY "Tasks policy" ON public.tasks
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND public.is_member_of_org(a.organization_id)
        )
    );
