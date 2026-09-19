-- ==============================================================================
-- HIPOTECALY: MIGRACIÓN MÓDULO CANÓNICO DE INVERSORES, LEADS E INTERESES
-- ==============================================================================

-- 1. EVOLUCIÓN DE `lenders`
ALTER TABLE public.lenders
    ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS source_lead_id UUID,
    ADD COLUMN IF NOT EXISTS investor_type VARCHAR(100) DEFAULT 'Persona';

-- 2. EVOLUCIÓN DE `lender_rules` (CRITERIOS DE INVERSIÓN CANÓNICOS)
ALTER TABLE public.lender_rules
    ADD COLUMN IF NOT EXISTS min_rate NUMERIC(5,2) DEFAULT 11.0,
    ADD COLUMN IF NOT EXISTS accepted_modalities TEXT[] DEFAULT '{solo_intereses,capital_e_intereses}',
    ADD COLUMN IF NOT EXISTS accepted_currencies TEXT[] DEFAULT '{USD}';

-- 3. TABLA DE LEADS DE CAPTACIÓN WHITE LABEL (`investor_leads`)
CREATE TABLE IF NOT EXISTS public.investor_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    investor_type VARCHAR(100) NOT NULL DEFAULT 'Persona',
    contact_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    available_capital NUMERIC(15,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    preferred_min_amount NUMERIC(15,2),
    preferred_max_amount NUMERIC(15,2),
    max_ltv NUMERIC(5,2),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'approved', 'discarded', 'converted'
    converted_lender_id UUID REFERENCES public.lenders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA DE MANIFESTACIONES DE INTERÉS NO VINCULANTES (`investor_interests`)
CREATE TABLE IF NOT EXISTS public.investor_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    lender_id UUID NOT NULL REFERENCES public.lenders(id) ON DELETE CASCADE,
    indicated_amount NUMERIC(15,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    message TEXT,
    non_binding BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'interested', -- 'interested', 'contact_requested', 'connected', 'withdrawn', 'discarded', 'completed'
    connected_at TIMESTAMPTZ,
    connected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    outcome_status VARCHAR(50), -- 'in_negotiation', 'discarded', 'completed'
    outcome_amount NUMERIC(15,2),
    outcome_date TIMESTAMPTZ,
    outcome_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(opportunity_id, lender_id)
);

-- 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_investor_leads_org_status ON public.investor_leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_investor_interests_org_status ON public.investor_interests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_investor_interests_lender ON public.investor_interests(lender_id);
CREATE INDEX IF NOT EXISTS idx_investor_interests_opp ON public.investor_interests(opportunity_id);

-- 6. HABILITAR RLS
ALTER TABLE public.investor_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_interests ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS PARA `investor_leads`
DROP POLICY IF EXISTS "Investor leads staff select" ON public.investor_leads;
CREATE POLICY "Investor leads staff select"
    ON public.investor_leads FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.is_member_of_org(organization_id)
    );

DROP POLICY IF EXISTS "Investor leads staff insert" ON public.investor_leads;
CREATE POLICY "Investor leads staff insert"
    ON public.investor_leads FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR public.is_member_of_org(organization_id)
    );

DROP POLICY IF EXISTS "Investor leads staff update" ON public.investor_leads;
CREATE POLICY "Investor leads staff update"
    ON public.investor_leads FOR UPDATE
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.is_member_of_org(organization_id)
    );

-- 8. POLÍTICAS RLS PARA `investor_interests`
DROP POLICY IF EXISTS "Investor interests select" ON public.investor_interests;
CREATE POLICY "Investor interests select"
    ON public.investor_interests FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.is_member_of_org(organization_id)
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = investor_interests.lender_id
            AND l.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Investor interests insert lender" ON public.investor_interests;
CREATE POLICY "Investor interests insert lender"
    ON public.investor_interests FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR public.is_member_of_org(organization_id)
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = investor_interests.lender_id
            AND l.user_id = auth.uid()
            AND l.organization_id = investor_interests.organization_id
        )
    );

DROP POLICY IF EXISTS "Investor interests update" ON public.investor_interests;
CREATE POLICY "Investor interests update"
    ON public.investor_interests FOR UPDATE
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.is_member_of_org(organization_id)
        OR EXISTS (
            SELECT 1 FROM public.lenders l
            WHERE l.id = investor_interests.lender_id
            AND l.user_id = auth.uid()
        )
    );

-- 9. ENDURECER RLS DE `lenders` Y `lender_rules` (ZERO ANON ACCESS, ORGANIZATIONAL ISOLATION)
DROP POLICY IF EXISTS "Lenders anon block" ON public.lenders;
DROP POLICY IF EXISTS "Lenders select policy" ON public.lenders;
DROP POLICY IF EXISTS "Lenders tenant isolation select" ON public.lenders;

CREATE POLICY "Lenders tenant isolation select"
    ON public.lenders FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR user_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

DROP POLICY IF EXISTS "Lenders tenant isolation insert" ON public.lenders;
CREATE POLICY "Lenders tenant isolation insert"
    ON public.lenders FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
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

-- 10. RPC SEGURO PARA CAPTACIÓN PÚBLICA WHITE LABEL (INSERT SOLAMENTE)
CREATE OR REPLACE FUNCTION public.submit_white_label_investor_lead(
    p_org_slug TEXT,
    p_full_name TEXT,
    p_investor_type TEXT,
    p_contact_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_available_capital NUMERIC,
    p_currency TEXT,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id UUID;
    v_wl_enabled BOOLEAN;
    v_inv_enabled BOOLEAN;
    v_new_lead_id UUID;
BEGIN
    -- 1. Resolver organización por slug
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = p_org_slug LIMIT 1;
    IF v_org_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Organización no encontrada.');
    END IF;

    -- 2. Verificar que los módulos white_label e investors estén habilitados
    SELECT COALESCE(
        (SELECT enabled FROM public.tenant_modules WHERE tenant_id = v_org_id AND module_key = 'white_label_enabled'),
        false
    ) INTO v_wl_enabled;

    SELECT COALESCE(
        (SELECT enabled FROM public.tenant_modules WHERE tenant_id = v_org_id AND module_key = 'investor_portal_enabled'),
        true
    ) INTO v_inv_enabled;

    IF NOT v_wl_enabled OR NOT v_inv_enabled THEN
        RETURN jsonb_build_object('success', false, 'error', 'El canal público de inversores no está habilitado para esta organización.');
    END IF;

    -- 3. Validar payload mínimo
    IF trim(p_full_name) = '' OR trim(p_email) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nombre y correo electrónico son requeridos.');
    END IF;

    -- 4. Insertar Lead
    INSERT INTO public.investor_leads (
        organization_id,
        full_name,
        investor_type,
        contact_name,
        email,
        phone,
        available_capital,
        currency,
        notes,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_org_id,
        trim(p_full_name),
        COALESCE(p_investor_type, 'Persona'),
        trim(p_contact_name),
        lower(trim(p_email)),
        trim(p_phone),
        p_available_capital,
        COALESCE(p_currency, 'USD'),
        p_notes,
        'new',
        NOW(),
        NOW()
    ) RETURNING id INTO v_new_lead_id;

    -- 5. Audit Log inmutable
    INSERT INTO public.audit_logs (
        organization_id,
        action,
        entity,
        entity_id,
        details
    ) VALUES (
        v_org_id,
        'INVESTOR_LEAD_CREATED',
        'investor_leads',
        v_new_lead_id,
        jsonb_build_object(
            'source', 'white_label',
            'full_name', p_full_name,
            'email', lower(trim(p_email)),
            'available_capital', p_available_capital
        )
    );

    RETURN jsonb_build_object('success', true, 'lead_id', v_new_lead_id);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_white_label_investor_lead FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_white_label_investor_lead TO anon, authenticated;
