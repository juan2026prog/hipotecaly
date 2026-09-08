-- ==============================================================================
-- HIPOTECALY: Migración Macrofase 8 - Endurecimiento Integral de Seguridad Fintech
-- Migración 00018: Tabla inmutable de eventos de seguridad, bloqueo de UPDATE/DELETE
-- en auditoría, aislamiento estricto multi-tenant y optimización de índices RLS.
-- ==============================================================================

-- 1. ENUM DE SEVERIDAD DE SEGURIDAD
DO  BEGIN
    CREATE TYPE security_severity_enum AS ENUM (
        'INFO',
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END ;

-- 2. TABLA INMUTABLE DE EVENTOS DE SEGURIDAD (security_events)
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- ej: SECURITY_FAILED_LOGIN, SECURITY_ACCESS_DENIED, etc.
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    severity security_severity_enum NOT NULL DEFAULT 'INFO',
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de auditoría y análisis forense
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_org ON public.security_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS) EN security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Lectura exclusiva para Super Admins de la plataforma
DROP POLICY IF EXISTS "Super admins read security events" ON public.security_events;
CREATE POLICY "Super admins read security events" ON public.security_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
    );

-- Inserción permitida para registrar eventos desde usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users insert security events" ON public.security_events;
CREATE POLICY "Authenticated users insert security events" ON public.security_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- INMUTABILIDAD ABSOLUTA: Bloquear explícitamente cualquier intento de UPDATE o DELETE
DROP POLICY IF EXISTS "Deny UPDATE on security_events" ON public.security_events;
CREATE POLICY "Deny UPDATE on security_events" ON public.security_events
    FOR UPDATE
    TO authenticated, anon
    USING (false);

DROP POLICY IF EXISTS "Deny DELETE on security_events" ON public.security_events;
CREATE POLICY "Deny DELETE on security_events" ON public.security_events
    FOR DELETE
    TO authenticated, anon
    USING (false);

-- 4. REFUERZO DE INMUTABILIDAD EN audit_logs
-- Garantizar que ningún usuario (incluso tenant_admin) pueda alterar la auditoría histórica
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny UPDATE on audit_logs" ON public.audit_logs;
CREATE POLICY "Deny UPDATE on audit_logs" ON public.audit_logs
    FOR UPDATE
    TO authenticated, anon
    USING (false);

DROP POLICY IF EXISTS "Deny DELETE on audit_logs" ON public.audit_logs;
CREATE POLICY "Deny DELETE on audit_logs" ON public.audit_logs
    FOR DELETE
    TO authenticated, anon
    USING (false);

-- 5. ENDURECIMIENTO DE TABLAS ENTERPRISE CON HELPER is_member_of_org
-- Reforzar tenant_api_keys
DROP POLICY IF EXISTS "tenant_api_keys_strict_isolation" ON public.tenant_api_keys;
CREATE POLICY "tenant_api_keys_strict_isolation" ON public.tenant_api_keys
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
              AND organization_members.organization_id = tenant_api_keys.tenant_id
              AND organization_members.role IN ('tenant_owner', 'tenant_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
              AND organization_members.organization_id = tenant_api_keys.tenant_id
              AND organization_members.role IN ('tenant_owner', 'tenant_admin')
        )
    );

-- Reforzar tenant_webhooks
DROP POLICY IF EXISTS "tenant_webhooks_strict_isolation" ON public.tenant_webhooks;
CREATE POLICY "tenant_webhooks_strict_isolation" ON public.tenant_webhooks
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
              AND organization_members.organization_id = tenant_webhooks.tenant_id
              AND organization_members.role IN ('tenant_owner', 'tenant_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
              AND organization_members.organization_id = tenant_webhooks.tenant_id
              AND organization_members.role IN ('tenant_owner', 'tenant_admin')
        )
    );

-- Reforzar webhook_deliveries
DROP POLICY IF EXISTS "webhook_deliveries_strict_isolation" ON public.webhook_deliveries;
CREATE POLICY "webhook_deliveries_strict_isolation" ON public.webhook_deliveries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
              AND organization_members.organization_id = webhook_deliveries.tenant_id
        )
    );

-- Reforzar tenant_billing_settings
DROP POLICY IF EXISTS "tenant_billing_settings_strict_isolation" ON public.tenant_billing_settings;
CREATE POLICY "tenant_billing_settings_strict_isolation" ON public.tenant_billing_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
              AND organization_members.organization_id = tenant_billing_settings.tenant_id
              AND organization_members.role IN ('tenant_owner', 'tenant_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
              AND organization_members.organization_id = tenant_billing_settings.tenant_id
              AND organization_members.role IN ('tenant_owner', 'tenant_admin')
        )
    );

-- Reforzar tenant_invoices
DROP POLICY IF EXISTS "tenant_invoices_strict_isolation" ON public.tenant_invoices;
CREATE POLICY "tenant_invoices_strict_isolation" ON public.tenant_invoices
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
        OR EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
              AND organization_members.organization_id = tenant_invoices.tenant_id
        )
    );

-- 6. OPTIMIZACIÓN DE ÍNDICES DE CLAVES FORÁNEAS PARA PERFORMANCE DE CONSULTAS RLS
CREATE INDEX IF NOT EXISTS idx_borrowers_user_org ON public.borrowers(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_org ON public.applications(borrower_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON public.organization_members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_case_tenant ON public.generated_documents(case_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_id_verifications_case_tenant ON public.identity_verifications(case_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_sig_processes_case_tenant ON public.signature_processes(case_id, tenant_id);
