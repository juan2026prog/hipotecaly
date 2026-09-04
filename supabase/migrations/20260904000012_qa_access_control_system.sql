-- ==============================================================================
-- HIPOTECALY: Base de Datos Core Multi-Tenant
-- Migración 00012: Sistema de Control de Acceso QA, Sesiones e Inspección Segura
-- ==============================================================================

-- 1. Tabla de Configuración Global de Acceso QA
CREATE TABLE IF NOT EXISTS qa_access_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['borrower', 'analyst', 'operator', 'tenant_admin', 'lender', 'super_admin'],
    max_duration_hours INTEGER NOT NULL DEFAULT 24,
    default_duration_hours INTEGER NOT NULL DEFAULT 8,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar configuración por defecto si no existe
INSERT INTO qa_access_settings (id, enabled, allowed_roles, max_duration_hours, default_duration_hours)
VALUES ('default', TRUE, ARRAY['borrower', 'analyst', 'operator', 'tenant_admin', 'lender', 'super_admin'], 24, 8)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla de Sesiones de Acceso QA
CREATE TABLE IF NOT EXISTS qa_access_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL,
    qa_user_id UUID NULL,
    role TEXT NOT NULL,
    tenant_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired')),
    source TEXT NOT NULL DEFAULT 'super_admin_ui',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Índices para búsqueda rápida y expiración
CREATE INDEX IF NOT EXISTS idx_qa_sessions_status ON qa_access_sessions(status);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_tenant ON qa_access_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_expires ON qa_access_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_qa_sessions_user ON qa_access_sessions(qa_user_id);

-- 3. Tabla de Auditoría de Acceso QA
CREATE TABLE IF NOT EXISTS qa_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES qa_access_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'QA_SESSION_CREATED',
            'QA_SESSION_USED',
            'QA_SESSION_ROLE_CHANGED',
            'QA_SESSION_REVOKED',
            'QA_SESSION_EXPIRED'
        )
    ),
    user_id UUID NULL,
    tenant_id UUID NULL,
    role TEXT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_audit_session ON qa_audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_qa_audit_event ON qa_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_qa_audit_created ON qa_audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ------------------------------------------------------------------------------
ALTER TABLE qa_access_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_access_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_audit_logs ENABLE ROW LEVEL SECURITY;

-- Funciones y políticas RLS: Exclusivo para Super Admin
DO $$ BEGIN
    DROP POLICY IF EXISTS "SuperAdmin all on qa_access_settings" ON qa_access_settings;
    CREATE POLICY "SuperAdmin all on qa_access_settings"
        ON qa_access_settings
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM organization_members
                WHERE organization_members.user_id = auth.uid()
                  AND organization_members.organization_id = 'a0000000-0000-0000-0000-000000000001'
                  AND organization_members.role IN ('tenant_owner', 'tenant_admin')
            )
            OR (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super_admin'
        );
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "SuperAdmin all on qa_access_sessions" ON qa_access_sessions;
    CREATE POLICY "SuperAdmin all on qa_access_sessions"
        ON qa_access_sessions
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM organization_members
                WHERE organization_members.user_id = auth.uid()
                  AND organization_members.organization_id = 'a0000000-0000-0000-0000-000000000001'
                  AND organization_members.role IN ('tenant_owner', 'tenant_admin')
            )
            OR (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super_admin'
        );
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "SuperAdmin all on qa_audit_logs" ON qa_audit_logs;
    CREATE POLICY "SuperAdmin all on qa_audit_logs"
        ON qa_audit_logs
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM organization_members
                WHERE organization_members.user_id = auth.uid()
                  AND organization_members.organization_id = 'a0000000-0000-0000-0000-000000000001'
                  AND organization_members.role IN ('tenant_owner', 'tenant_admin')
            )
            OR (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super_admin'
        );
EXCEPTION
    WHEN undefined_table THEN null;
END $$;
