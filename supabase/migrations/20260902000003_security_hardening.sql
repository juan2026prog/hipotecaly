-- ==============================================================================
-- HIPOTECALY: MIGRACIÓN DE MICRO-HARDENING DE SEGURIDAD (PRE-FASE 4)
-- ==============================================================================

-- 1. SECURITY DEFINER HARDENING
-- Asegurar search_path estricto (public, pg_temp) y calificación de esquema
-- para prevenir secuestro de búsqueda (search_path hijacking) y escalación de privilegios.

CREATE OR REPLACE FUNCTION public.is_member_of_org(
    target_org_id UUID,
    required_role public.member_role DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Validar super_admin global
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_super_admin = TRUE
    ) THEN
        RETURN TRUE;
    END IF;

    -- Validar membresía en organización específica
    IF required_role IS NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid() 
              AND organization_id = target_org_id 
              AND is_active = TRUE
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid() 
              AND organization_id = target_org_id 
              AND role = required_role 
              AND is_active = TRUE
        );
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.is_member_of_org(UUID, public.member_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member_of_org(UUID, public.member_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_super_admin = TRUE
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_borrower_id_for_user(user_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    found_id UUID;
BEGIN
    IF user_uuid IS NULL OR auth.uid() IS NULL OR user_uuid <> auth.uid() THEN
        -- Solo el propio usuario autenticado puede solicitar su borrower_id
        RETURN NULL;
    END IF;

    SELECT id INTO found_id 
    FROM public.borrowers 
    WHERE user_id = user_uuid 
    LIMIT 1;

    RETURN found_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_borrower_id_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_borrower_id_for_user(UUID) TO authenticated;

-- 2. INMUTABILIDAD ESTRICTA DE AUDIT LOGS (Regla 8)
-- Nadie (ni authenticated ni anon) puede modificar ni borrar registros de auditoría.

REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.prevent_audit_logs_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'Operación denegada: los registros de audit_logs son estrictamente inmutables.';
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_logs_tampering();

-- 3. UNIFICACIÓN DE REGLAS: PRESTAMISTA PILOTO COMO FUENTE DE VERDAD (Regla 2)
-- Las condiciones comerciales pertenecen al prestamista piloto en `lenders` + `lender_rules`.

-- Inserción / Aseguramiento del prestamista piloto por defecto del Marketplace
INSERT INTO public.lenders (
    id,
    organization_id,
    name,
    legal_name,
    tax_id,
    lender_type,
    country,
    contact_email,
    is_active
) VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Prestamista Piloto Hipotecaly',
    'Hipotecaly Capital S.A.',
    '219999990019',
    'private_investor_network',
    'Uruguay',
    'creditos@hipotecaly.uy',
    TRUE
) ON CONFLICT (id) DO UPDATE SET is_active = TRUE;

-- Inserción / Aseguramiento de las reglas crediticias del prestamista piloto
INSERT INTO public.lender_rules (
    id,
    lender_id,
    max_ltv,
    min_amount,
    max_amount,
    currency,
    min_term_months,
    max_term_months,
    accepted_property_types,
    accepted_departments,
    accepts_clearing,
    is_active
) VALUES (
    'c1000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    0.40, -- 40%
    10000,
    200000,
    'USD',
    12,
    60,
    ARRAY['casa'::public.property_type, 'apartamento'::public.property_type, 'terreno'::public.property_type, 'local_comercial'::public.property_type, 'campo'::public.property_type],
    ARRAY['Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'San José', 'Rocha'],
    TRUE,
    TRUE
) ON CONFLICT (id) DO UPDATE SET
    max_ltv = EXCLUDED.max_ltv,
    max_amount = EXCLUDED.max_amount,
    max_term_months = EXCLUDED.max_term_months,
    is_active = TRUE;

-- Función para que el simulador público obtenga las reglas activas del marketplace
CREATE OR REPLACE FUNCTION public.get_active_marketplace_rules()
RETURNS TABLE (
    rule_id UUID,
    lender_name TEXT,
    max_ltv NUMERIC(5,2),
    min_amount NUMERIC(15,2),
    max_amount NUMERIC(15,2),
    currency VARCHAR(3),
    min_term_months INT,
    max_term_months INT,
    accepts_clearing BOOLEAN,
    accepted_property_types public.property_type[],
    accepted_departments TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lr.id AS rule_id,
        l.name::TEXT AS lender_name,
        lr.max_ltv,
        lr.min_amount,
        lr.max_amount,
        lr.currency,
        lr.min_term_months,
        lr.max_term_months,
        lr.accepts_clearing,
        lr.accepted_property_types,
        lr.accepted_departments
    FROM public.lender_rules lr
    JOIN public.lenders l ON l.id = lr.lender_id
    WHERE lr.is_active = TRUE AND l.is_active = TRUE
    ORDER BY lr.created_at ASC
    LIMIT 1;
END;
$$;

-- Otorgar permiso de ejecución a usuarios autenticados y anónimos (simulador público)
GRANT EXECUTE ON FUNCTION public.get_active_marketplace_rules() TO anon, authenticated;

-- 4. PREPARACIÓN DE TABLAS PRE-FASE 4: DATA DISCLOSURES, MENSAJES Y NOTIFICACIONES

-- 4.1 DATA DISCLOSURES (Sistema Anti-Bypass para Fase 4 - Regla 10)
CREATE TABLE IF NOT EXISTS public.data_disclosures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    lender_id UUID NOT NULL REFERENCES public.lenders(id) ON DELETE CASCADE,
    data_category VARCHAR(100) NOT NULL, -- ej. 'property_exact_address', 'borrower_contact', 'full_documents'
    approved_by UUID REFERENCES public.profiles(id),
    reason TEXT NOT NULL,
    disclosed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.data_disclosures ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_disclosures_tenant_isolation ON public.data_disclosures
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND public.is_member_of_org(a.organization_id)
        )
    );

-- 4.2 APPLICATION MESSAGES (Mensajería privada sin exposición de datos de contacto - Regla 11)
CREATE TABLE IF NOT EXISTS public.application_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES public.profiles(id),
    sender_type VARCHAR(50) NOT NULL DEFAULT 'borrower', -- 'borrower', 'analyst', 'lender', 'system'
    message TEXT NOT NULL,
    visibility VARCHAR(50) NOT NULL DEFAULT 'borrower_and_analyst', -- 'internal_only', 'borrower_and_analyst', 'lender_anonymized'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_borrower_policy ON public.application_messages
    FOR ALL
    TO authenticated
    USING (
        sender_user_id = auth.uid() OR
        (
            visibility <> 'internal_only' AND
            EXISTS (
                SELECT 1 FROM public.applications a
                WHERE a.id = application_id 
                  AND a.borrower_id = public.get_borrower_id_for_user(auth.uid())
            )
        )
    );

CREATE POLICY messages_analyst_policy ON public.application_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND public.is_member_of_org(a.organization_id)
        )
    );

-- 4.3 NOTIFICATIONS (Notificaciones multi-canal preparadas para Fase 4 - Regla 12)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    type VARCHAR(100) NOT NULL, -- 'status_changed', 'document_requested', 'offer_received', etc.
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_user_isolation ON public.notifications
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 5. POLÍTICAS DE STORAGE PRIVADO PARA PROPERTY-PHOTOS Y APPLICATION-DOCUMENTS (Regla 6 y 7)
-- Garantizar que ambos buckets sean privados y requieran signed URLs o membresía activa

-- Asegurar que los buckets estén creados como PRIVADOS
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('property-photos', 'property-photos', FALSE),
    ('application-documents', 'application-documents', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

-- Políticas de Storage para property-photos (fotos privadas con RLS)
DROP POLICY IF EXISTS "Photos viewable only by owner or tenant" ON storage.objects;
CREATE POLICY "Photos viewable only by owner or tenant" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'property-photos' AND
        (
            -- Propietario del archivo
            owner = auth.uid() OR
            -- O usuario perteneciente al tenant que administra la propiedad
            EXISTS (
                SELECT 1 FROM public.properties p
                JOIN public.applications a ON a.id = p.application_id
                WHERE p.id::text = (storage.foldername(name))[1]
                  AND public.is_member_of_org(a.organization_id)
            )
        )
    );

DROP POLICY IF EXISTS "Photos uploadable by owner" ON storage.objects;
CREATE POLICY "Photos uploadable by owner" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'property-photos' AND
        owner = auth.uid()
    );

-- Políticas de Storage para application-documents (documentos privados con RLS)
DROP POLICY IF EXISTS "Documents viewable only by owner or tenant" ON storage.objects;
CREATE POLICY "Documents viewable only by owner or tenant" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'application-documents' AND
        (
            owner = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.properties p
                JOIN public.applications a ON a.id = p.application_id
                WHERE p.id::text = (storage.foldername(name))[2]
                  AND public.is_member_of_org(a.organization_id)
            )
        )
    );

DROP POLICY IF EXISTS "Documents uploadable by owner" ON storage.objects;
CREATE POLICY "Documents uploadable by owner" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'application-documents' AND
        owner = auth.uid()
    );
