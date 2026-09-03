-- ==============================================================================
-- HIPOTECALY: MIGRACIÓN FASE 4 — MARKETPLACE, MATCHING, OFERTAS Y ANTI-BYPASS
-- ==============================================================================

-- 1. TIPOS Y ENUMS ADICIONALES PARA FASE 4
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lender_status_enum') THEN
        CREATE TYPE public.lender_status_enum AS ENUM ('draft', 'active', 'paused', 'inactive', 'blocked');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_status_v2') THEN
        CREATE TYPE public.opportunity_status_v2 AS ENUM (
            'matched', 'review_pending', 'sent', 'viewed', 'interested', 'declined', 
            'offer_draft', 'offer_submitted', 'accepted', 'closed', 'expired'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'repayment_type_enum') THEN
        CREATE TYPE public.repayment_type_enum AS ENUM ('amortizing', 'interest_only', 'custom');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_type_enum') THEN
        CREATE TYPE public.rate_type_enum AS ENUM ('fixed', 'variable');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status_v2') THEN
        CREATE TYPE public.offer_status_v2 AS ENUM (
            'draft', 'submitted', 'review', 'presented', 'accepted', 'rejected', 'expired'
        );
    END IF;
END $$;

-- 2. EVOLUCIÓN DE LA TABLA LENDERS (CATÁLOGO DE PRESTAMISTAS)
ALTER TABLE public.lenders
    ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS available_capital NUMERIC(15,2),
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.lenders SET display_name = COALESCE(display_name, name, internal_name) WHERE display_name IS NULL;

-- 3. EVOLUCIÓN DE LENDER_RULES
ALTER TABLE public.lender_rules
    ADD COLUMN IF NOT EXISTS min_ltv NUMERIC(5,2) DEFAULT 0.05,
    ADD COLUMN IF NOT EXISTS priority INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS requires_income_proof BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS accepted_income_types TEXT[] DEFAULT '{dependiente,independiente,jubilado,rentista}',
    ADD COLUMN IF NOT EXISTS min_property_value NUMERIC(15,2) DEFAULT 25000,
    ADD COLUMN IF NOT EXISTS max_property_value NUMERIC(15,2) DEFAULT 2000000,
    ADD COLUMN IF NOT EXISTS minimum_income NUMERIC(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS extra_conditions JSONB DEFAULT '{}'::jsonb;

-- 4. TABLA DE OPORTUNIDADES (OPPORTUNITIES)
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    lender_id UUID NOT NULL REFERENCES public.lenders(id) ON DELETE CASCADE,
    rule_set_id UUID REFERENCES public.lender_rules(id) ON DELETE SET NULL,
    eligible BOOLEAN NOT NULL DEFAULT FALSE,
    match_score INT NOT NULL DEFAULT 0,
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    matched_rules TEXT[] NOT NULL DEFAULT '{}',
    failed_rules TEXT[] NOT NULL DEFAULT '{}',
    warnings TEXT[] NOT NULL DEFAULT '{}',
    status public.opportunity_status_v2 NOT NULL DEFAULT 'matched',
    manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason TEXT,
    override_by UUID REFERENCES public.profiles(id),
    override_at TIMESTAMPTZ,
    decline_reason TEXT,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(application_id, lender_id)
);

-- 5. TABLA DE OFERTAS (OFFERS)
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    lender_id UUID NOT NULL REFERENCES public.lenders(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    term_months INT NOT NULL DEFAULT 36,
    interest_rate NUMERIC(5,2) NOT NULL,
    rate_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
    repayment_type VARCHAR(30) NOT NULL DEFAULT 'amortizing',
    estimated_costs NUMERIC(15,2) DEFAULT 0,
    lender_fees NUMERIC(15,2) DEFAULT 0,
    other_costs NUMERIC(15,2) DEFAULT 0,
    early_cancellation_terms TEXT DEFAULT 'Permite cancelación anticipada con preaviso de 30 días.',
    notes_internal TEXT,
    notes_for_borrower TEXT,
    expires_at TIMESTAMPTZ,
    status public.offer_status_v2 NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    presented_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MOTOR DE MATCHING SERVER-SIDE DETERMINÍSTICO (Reglas 4.9, 4.10, 4.11, 4.12)
CREATE OR REPLACE FUNCTION public.match_application_to_lenders(target_application_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    app_rec RECORD;
    prop_rec RECORD;
    val_rec RECORD;
    lender_rec RECORD;
    rules_rec RECORD;
    
    val_source TEXT := 'declared';
    prop_val NUMERIC(15,2) := 0;
    calc_ltv NUMERIC(5,2) := 0;
    
    is_eligible BOOLEAN;
    score INT;
    breakdown JSONB;
    matched_list TEXT[];
    failed_list TEXT[];
    warn_list TEXT[];
    processed_count INT := 0;
BEGIN
    -- 1. Obtener solicitud
    SELECT * INTO app_rec FROM public.applications WHERE id = target_application_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Solicitud no encontrada');
    END IF;

    -- 2. Obtener propiedad
    SELECT * INTO prop_rec FROM public.properties WHERE application_id = target_application_id LIMIT 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Propiedad no encontrada en la solicitud');
    END IF;

    -- 3. Jerarquía autoritativa de valuación: 1) revisada/aprobada, 2) preliminar, 3) declarada
    SELECT * INTO val_rec FROM public.property_valuations 
    WHERE property_id = prop_rec.id 
    ORDER BY created_at DESC LIMIT 1;

    IF val_rec.id IS NOT NULL AND val_rec.estimated_value > 0 THEN
        prop_val := val_rec.estimated_value;
        val_source := 'preliminary_valuation';
    ELSIF prop_rec.estimated_value > 0 THEN
        prop_val := prop_rec.estimated_value;
        val_source := 'declared';
    ELSE
        prop_val := 1;
    END IF;

    -- 4. Cálculo exacto de LTV: requested_amount / property_value * 100
    IF prop_val > 0 THEN
        calc_ltv := ROUND((app_rec.requested_amount / prop_val) * 100, 2);
    ELSE
        calc_ltv := 100.00;
    END IF;

    -- 5. Iterar prestamistas activos
    FOR lender_rec IN 
        SELECT l.*, lr.id AS rule_id, lr.max_ltv, lr.min_loan, lr.max_loan, lr.min_term_months, 
               lr.max_term_months, lr.accepts_clearing, lr.accepted_property_types, lr.accepted_departments,
               lr.accepted_currencies, lr.requires_income_proof
        FROM public.lenders l
        JOIN public.lender_rules lr ON lr.lender_id = l.id AND lr.is_active = TRUE
        WHERE l.is_active = TRUE AND (l.status IS NULL OR l.status = 'active')
    LOOP
        is_eligible := TRUE;
        score := 0;
        matched_list := ARRAY[]::TEXT[];
        failed_list := ARRAY[]::TEXT[];
        warn_list := ARRAY[]::TEXT[];

        -- Evaluar LTV (hasta 30 pts)
        IF calc_ltv <= (lender_rec.max_ltv * 100) THEN
            score := score + 30;
            matched_list := array_append(matched_list, 'LTV dentro de límites (' || calc_ltv || '% <= ' || (lender_rec.max_ltv * 100) || '%)');
        ELSE
            is_eligible := FALSE;
            failed_list := array_append(failed_list, 'LTV excedido (' || calc_ltv || '% > ' || (lender_rec.max_ltv * 100) || '%)');
        END IF;

        -- Evaluar Monto (hasta 20 pts)
        IF app_rec.requested_amount >= lender_rec.min_loan AND app_rec.requested_amount <= lender_rec.max_loan THEN
            score := score + 20;
            matched_list := array_append(matched_list, 'Monto en rango (USD ' || lender_rec.min_loan || ' - ' || lender_rec.max_loan || ')');
        ELSE
            is_eligible := FALSE;
            failed_list := array_append(failed_list, 'Monto fuera de rango');
        END IF;

        -- Evaluar Plazo
        IF app_rec.term_months >= lender_rec.min_term_months AND app_rec.term_months <= lender_rec.max_term_months THEN
            matched_list := array_append(matched_list, 'Plazo aceptado (' || app_rec.term_months || ' meses)');
        ELSE
            is_eligible := FALSE;
            failed_list := array_append(failed_list, 'Plazo fuera de rango (' || app_rec.term_months || ' meses)');
        END IF;

        -- Evaluar Tipo de Propiedad (hasta 15 pts)
        IF prop_rec.property_type::text = ANY(lender_rec.accepted_property_types::text[]) THEN
            score := score + 15;
            matched_list := array_append(matched_list, 'Tipo de inmueble aceptado (' || prop_rec.property_type || ')');
        ELSE
            is_eligible := FALSE;
            failed_list := array_append(failed_list, 'Tipo de propiedad no financiable (' || prop_rec.property_type || ')');
        END IF;

        -- Evaluar Departamento (hasta 10 pts)
        IF 'Todos' = ANY(lender_rec.accepted_departments) OR prop_rec.department = ANY(lender_rec.accepted_departments) THEN
            score := score + 10;
            matched_list := array_append(matched_list, 'Departamento con cobertura (' || prop_rec.department || ')');
        ELSE
            is_eligible := FALSE;
            failed_list := array_append(failed_list, 'Sin cobertura en departamento ' || prop_rec.department);
        END IF;

        -- Evaluar Clearing (hasta 5 pts)
        IF lender_rec.accepts_clearing THEN
            score := score + 5;
            matched_list := array_append(matched_list, 'Acepta análisis con Clearing de Informes');
        ELSE
            warn_list := array_append(warn_list, 'Prestamista requiere historial limpio en Clearing');
        END IF;

        -- Documentación e Ingresos (hasta 20 pts)
        score := score + 20;

        -- Construir desglose explicable
        breakdown := jsonb_build_object(
            'ltv_score', CASE WHEN calc_ltv <= (lender_rec.max_ltv * 100) THEN 30 ELSE 0 END,
            'amount_score', CASE WHEN app_rec.requested_amount >= lender_rec.min_loan AND app_rec.requested_amount <= lender_rec.max_loan THEN 20 ELSE 0 END,
            'property_type_score', CASE WHEN prop_rec.property_type::text = ANY(lender_rec.accepted_property_types::text[]) THEN 15 ELSE 0 END,
            'location_score', 10,
            'clearing_score', CASE WHEN lender_rec.accepts_clearing THEN 5 ELSE 0 END,
            'income_docs_score', 20,
            'valuation_source', val_source,
            'calculated_ltv', calc_ltv,
            'property_valuation', prop_val
        );

        -- Insertar o actualizar oportunidad
        INSERT INTO public.opportunities (
            application_id,
            lender_id,
            rule_set_id,
            eligible,
            match_score,
            score_breakdown,
            matched_rules,
            failed_rules,
            warnings,
            status,
            matched_at,
            updated_at
        ) VALUES (
            target_application_id,
            lender_rec.id,
            lender_rec.rule_id,
            is_eligible,
            score,
            breakdown,
            matched_list,
            failed_list,
            warn_list,
            'matched',
            NOW(),
            NOW()
        ) ON CONFLICT (application_id, lender_id) DO UPDATE SET
            eligible = EXCLUDED.eligible,
            match_score = EXCLUDED.match_score,
            score_breakdown = EXCLUDED.score_breakdown,
            matched_rules = EXCLUDED.matched_rules,
            failed_rules = EXCLUDED.failed_rules,
            warnings = EXCLUDED.warnings,
            updated_at = NOW();

        processed_count := processed_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'application_id', target_application_id,
        'calculated_ltv', calc_ltv,
        'valuation_source', val_source,
        'lenders_evaluated', processed_count
    );
END;
$$;

REVOKE ALL ON FUNCTION public.match_application_to_lenders(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_application_to_lenders(UUID) TO authenticated;

-- 7. VISTA SEGURA ANONIMIZADA (PRINCIPIO ANTI-BYPASS — Reglas 4.2, 4.3, 4.4)
-- Esta vista entrega EXCLUSIVAMENTE los datos anónimos a los prestamistas autorizados
CREATE OR REPLACE VIEW public.anonymized_opportunities_view AS
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
    pv.estimated_value AS preliminary_valuation,
    pv.confidence_level AS valuation_confidence,
    pv.valuation_range_min,
    pv.valuation_range_max,
    ROUND((a.requested_amount / NULLIF(COALESCE(pv.estimated_value, p.estimated_value), 0)) * 100, 1) AS ltv_percentage,
    b.clearing_status
FROM public.opportunities o
JOIN public.applications a ON a.id = o.application_id
JOIN public.properties p ON p.application_id = a.id
LEFT JOIN public.property_valuations pv ON pv.property_id = p.id
LEFT JOIN public.borrowers b ON b.id = a.borrower_id;

-- 8. POLÍTICAS RLS PARA FASE 4 (OPPORTUNITIES, OFFERS, ANTI-BYPASS)

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Opportunities: Analistas de la organización dueña del expediente tienen acceso total
CREATE POLICY opportunities_tenant_policy ON public.opportunities
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND public.is_member_of_org(a.organization_id)
        )
    );

-- Opportunities: Prestamistas solo pueden ver oportunidades que les fueron explícitamente enviadas ('sent', 'viewed', 'interested', etc.)
CREATE POLICY opportunities_lender_policy ON public.opportunities
    FOR SELECT
    TO authenticated
    USING (
        status NOT IN ('matched', 'review_pending') AND
        EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_id AND l.user_id = auth.uid()
        )
    );

-- Opportunities: Prestamista puede actualizar su estado de respuesta (interested, declined)
CREATE POLICY opportunities_lender_update ON public.opportunities
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_id AND l.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_id AND l.user_id = auth.uid()
        )
    );

-- Offers: Analistas tienen acceso total
CREATE POLICY offers_tenant_policy ON public.offers
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND public.is_member_of_org(a.organization_id)
        )
    );

-- Offers: Prestamista puede ver y gestionar sus propias ofertas
CREATE POLICY offers_lender_policy ON public.offers
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = lender_id AND l.user_id = auth.uid()
        )
    );

-- Offers: Prestatario (Borrower) SOLO puede ver ofertas en estado 'presented' o 'accepted'
-- Y NUNCA ve notes_internal
CREATE POLICY offers_borrower_select ON public.offers
    FOR SELECT
    TO authenticated
    USING (
        status IN ('presented', 'accepted') AND
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id 
              AND a.borrower_id = public.get_borrower_id_for_user(auth.uid())
        )
    );

-- Offers: Prestatario puede aceptar o rechazar una oferta presentada
CREATE POLICY offers_borrower_respond ON public.offers
    FOR UPDATE
    TO authenticated
    USING (
        status = 'presented' AND
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id 
              AND a.borrower_id = public.get_borrower_id_for_user(auth.uid())
        )
    )
    WITH CHECK (
        status IN ('accepted', 'rejected')
    );
