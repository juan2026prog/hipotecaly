-- ==============================================================================
-- HIPOTECALY: MIGRACIÓN MACROFASE 9 — ADVERSARIAL SECURITY HARDENING (PASS 2)
-- Migración 00019:
-- 1. search_path seguro (public, pg_temp) en TODAS las funciones SECURITY DEFINER
-- 2. Revocación estricta de permisos PUBLIC y asignación de mínimo privilegio
-- 3. Inmutabilidad forzada por Triggers + Revoke en audit_logs y security_events
-- 4. Aislamiento estricto de Storage Buckets y políticas RLS para storage.objects
-- 5. Endurecimiento de Vistas con security_invoker = true
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER: REFUERZO DE SEARCH_PATH Y PERMISOS MÍNIMOS
-- ------------------------------------------------------------------------------

-- 1.1 Helper is_super_admin
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

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;

-- 1.2 Helper is_member_of_org
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
    IF auth.uid() IS NULL OR target_org_id IS NULL THEN
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

REVOKE ALL ON FUNCTION public.is_member_of_org(UUID, public.member_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member_of_org(UUID, public.member_role) TO authenticated, service_role;

-- 1.3 Helper get_borrower_id_for_user
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
        RETURN NULL;
    END IF;

    SELECT id INTO found_id 
    FROM public.borrowers 
    WHERE user_id = user_uuid 
    LIMIT 1;

    RETURN found_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_borrower_id_for_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_borrower_id_for_user(UUID) TO authenticated, service_role;

-- 1.4 Helper get_lender_org_id
CREATE OR REPLACE FUNCTION public.get_lender_org_id(target_lender_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    org_id UUID;
BEGIN
    IF target_lender_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT organization_id INTO org_id
    FROM public.lenders
    WHERE id = target_lender_id;
    
    RETURN org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_lender_org_id(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_lender_org_id(UUID) TO authenticated, service_role;

-- 1.5 Helper is_user_notary
CREATE OR REPLACE FUNCTION public.is_user_notary(target_org_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    IF target_org_id IS NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid() AND role = 'notary' AND is_active = TRUE
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid() AND organization_id = target_org_id AND role = 'notary' AND is_active = TRUE
        );
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.is_user_notary(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user_notary(UUID) TO authenticated, service_role;

-- 1.6 Helper can_notary_access_app
CREATE OR REPLACE FUNCTION public.can_notary_access_app(target_app_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL OR target_app_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.application_notaries
        WHERE application_id = target_app_id
        AND notary_user_id = auth.uid()
        AND status = 'active'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.can_notary_access_app(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_notary_access_app(UUID) TO authenticated, service_role;

-- 1.7 Helper can_access_application
CREATE OR REPLACE FUNCTION public.can_access_application(target_app_id UUID, target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    is_super BOOLEAN;
    is_notary_role BOOLEAN;
    is_general_staff BOOLEAN;
    is_owner_borrower BOOLEAN;
BEGIN
    IF auth.uid() IS NULL OR target_app_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 1. Super Admin
    SELECT is_super_admin INTO is_super FROM public.profiles WHERE id = auth.uid();
    IF is_super IS TRUE THEN
        RETURN TRUE;
    END IF;

    -- 2. Dueño Solicitante
    SELECT EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.borrowers b ON b.id = a.borrower_id
        WHERE a.id = target_app_id AND b.user_id = auth.uid()
    ) INTO is_owner_borrower;
    IF is_owner_borrower IS TRUE THEN
        RETURN TRUE;
    END IF;

    -- 3. Comprobar si en esta organización el usuario es escribano
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = target_org_id AND user_id = auth.uid() AND role = 'notary' AND is_active = TRUE
    ) INTO is_notary_role;

    IF is_notary_role IS TRUE THEN
        -- Si es escribano, OBLIGATORIAMENTE debe estar asignado activamente
        RETURN public.can_notary_access_app(target_app_id);
    END IF;

    -- 4. Staff general (tenant_admin, tenant_owner, analyst, operator)
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = target_org_id 
        AND user_id = auth.uid() 
        AND role IN ('tenant_owner', 'tenant_admin', 'analyst', 'operator')
        AND is_active = TRUE
    ) INTO is_general_staff;

    RETURN COALESCE(is_general_staff, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.can_access_application(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_application(UUID, UUID) TO authenticated, service_role;

-- 1.8 Funciones de Vault & AI Master Switch (Acceso estricto exclusivo a service_role)
REVOKE ALL ON FUNCTION public.store_openai_vault_secret(TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_openai_vault_secret(TEXT, UUID, TEXT) TO service_role, postgres;

REVOKE ALL ON FUNCTION public.delete_openai_vault_secret(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_openai_vault_secret(UUID) TO service_role, postgres;

REVOKE ALL ON FUNCTION public.set_ai_master_switch(BOOLEAN, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_ai_master_switch(BOOLEAN, UUID) TO service_role, postgres;

REVOKE ALL ON FUNCTION public.get_openai_vault_secret_internal() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_openai_vault_secret_internal() TO service_role, postgres;


-- ------------------------------------------------------------------------------
-- 2. INMUTABILIDAD FORENSE FORZADA EN AUDIT_LOGS Y SECURITY_EVENTS
-- ------------------------------------------------------------------------------

-- Función de excepción para impedir cualquier modificación o eliminación
CREATE OR REPLACE FUNCTION public.prevent_audit_logs_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACIÓN DE SEGURIDAD: Los registros de auditoría y eventos de seguridad son estrictamente inmutables (WORM - Write Once, Read Many). No se permite UPDATE ni DELETE.';
    RETURN NULL;
END;
$$;

-- Triggers en audit_logs y security_events
DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_logs_tampering();

DROP TRIGGER IF EXISTS trg_security_events_immutable ON public.security_events;
CREATE TRIGGER trg_security_events_immutable
BEFORE UPDATE OR DELETE ON public.security_events
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_logs_tampering();

-- Revocación de privilegios de modificación a nivel de PostgreSQL Grants
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM authenticated, anon, PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON public.security_events FROM authenticated, anon, PUBLIC;


-- ------------------------------------------------------------------------------
-- 3. STORAGE BUCKETS: AISLAMIENTO ESTRICTO Y POLÍTICAS RLS DE OBJETOS PRIVADOS
-- ------------------------------------------------------------------------------

-- Asegurar que todos los buckets existentes sean estrictamente privados
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES 
            ('property-photos', 'property-photos', FALSE),
            ('application-documents', 'application-documents', FALSE),
            ('notary-documents', 'notary-documents', FALSE),
            ('signed-contracts', 'signed-contracts', FALSE),
            ('kyc-documents', 'kyc-documents', FALSE)
        ON CONFLICT (id) DO UPDATE SET public = FALSE;
    END IF;
END $$;

-- Revocar acceso anónimo a storage.objects
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        REVOKE ALL ON storage.objects FROM anon, PUBLIC;
        GRANT SELECT, INSERT ON storage.objects TO authenticated;
        GRANT ALL ON storage.objects TO service_role;
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 4. VISTAS: ENFORCEMENT DE SECURITY_INVOKER
-- ------------------------------------------------------------------------------

-- Garantizar que las consultas a vistas evalúen RLS bajo el contexto del usuario ejecutor
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'anonymized_opportunities_view') THEN
        ALTER VIEW public.anonymized_opportunities_view SET (security_invoker = true);
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 5. BASE DE DATOS: REVOCACIÓN DE PERMISOS PÚBLICOS POR DEFECTO
-- ------------------------------------------------------------------------------

REVOKE ALL ON TABLE public.organizations FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.organizations TO authenticated;
GRANT ALL ON TABLE public.organizations TO service_role;

REVOKE ALL ON TABLE public.organization_members FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.organization_members TO authenticated;
GRANT ALL ON TABLE public.organization_members TO service_role;

REVOKE ALL ON TABLE public.tenant_api_keys FROM PUBLIC, anon;
GRANT ALL ON TABLE public.tenant_api_keys TO authenticated, service_role;

REVOKE ALL ON TABLE public.tenant_webhooks FROM PUBLIC, anon;
GRANT ALL ON TABLE public.tenant_webhooks TO authenticated, service_role;

REVOKE ALL ON TABLE public.webhook_deliveries FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.webhook_deliveries TO authenticated, service_role;

REVOKE ALL ON TABLE public.tenant_billing_settings FROM PUBLIC, anon;
GRANT ALL ON TABLE public.tenant_billing_settings TO authenticated, service_role;

REVOKE ALL ON TABLE public.tenant_invoices FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.tenant_invoices TO authenticated, service_role;
