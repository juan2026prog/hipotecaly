-- ==============================================================================
-- HIPOTECALY: Migración de Snapshot Editorial Compuesto, Publicación Atómica
-- y Auditoría Inmutable de Home White-Label (Fase 6)
-- ==============================================================================

-- 1. Asegurar tabla tenant_audit_logs y sus índices
CREATE TABLE IF NOT EXISTS public.tenant_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_audit_logs_tenant_action ON public.tenant_audit_logs(tenant_id, action, created_at DESC);

-- Habilitar RLS en tenant_audit_logs
ALTER TABLE public.tenant_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members view audit logs" ON public.tenant_audit_logs;
CREATE POLICY "Org members view audit logs"
ON public.tenant_audit_logs
FOR SELECT
TO authenticated
USING (
    is_super_admin() OR
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.user_id = auth.uid()
          AND organization_members.organization_id = tenant_audit_logs.tenant_id
          AND organization_members.is_active = true
    )
);

DROP POLICY IF EXISTS "Org admins create audit logs" ON public.tenant_audit_logs;
CREATE POLICY "Org admins create audit logs"
ON public.tenant_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
    is_super_admin() OR
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.user_id = auth.uid()
          AND organization_members.organization_id = tenant_audit_logs.tenant_id
          AND organization_members.role IN ('tenant_admin', 'tenant_owner')
          AND organization_members.is_active = true
    )
);

-- 2. Asegurar inmutabilidad estricta en organization_home_versions
-- Bloquear UPDATE y DELETE para tenants (las versiones publicadas son congeladas)
DROP POLICY IF EXISTS "Org admins manage home versions" ON public.organization_home_versions;
DROP POLICY IF EXISTS "Org admins insert home versions" ON public.organization_home_versions;

CREATE POLICY "Org admins insert home versions"
ON public.organization_home_versions
FOR INSERT
TO authenticated
WITH CHECK (
    is_super_admin() OR
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.user_id = auth.uid()
          AND organization_members.organization_id = organization_home_versions.organization_id
          AND organization_members.role IN ('tenant_admin', 'tenant_owner')
          AND organization_members.is_active = true
    )
);

-- 3. Stored Procedure para Publicación Atómica de la Home
CREATE OR REPLACE FUNCTION public.publish_organization_home_version(
    p_organization_id UUID,
    p_changelog_notes TEXT,
    p_author_name TEXT,
    p_actor_id UUID,
    p_composite_snapshot JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_version_number INT;
    v_version_label TEXT;
    v_version_id UUID;
    v_previous_snapshot JSONB;
    v_result JSONB;
BEGIN
    -- Validar permisos si es llamado directamente por cliente autenticado
    IF NOT (is_super_admin() OR EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.user_id = auth.uid()
          AND organization_members.organization_id = p_organization_id
          AND organization_members.role IN ('tenant_admin', 'tenant_owner')
          AND organization_members.is_active = true
    )) THEN
        RAISE EXCEPTION 'No tienes permisos suficientes para publicar en esta organización.';
    END IF;

    -- 1. Obtener snapshot previo y calcular número de versión
    SELECT published_snapshot, version_number 
    INTO v_previous_snapshot, v_next_version_number
    FROM public.organization_home_settings
    WHERE organization_id = p_organization_id;

    v_next_version_number := COALESCE(v_next_version_number, 0) + 1;
    v_version_label := 'Versión ' || v_next_version_number || '.0';

    -- 2. Desactivar versiones previas de esta organización
    UPDATE public.organization_home_versions
    SET is_active = false
    WHERE organization_id = p_organization_id;

    -- 3. Insertar nueva versión inmutable
    INSERT INTO public.organization_home_versions (
        organization_id,
        version_number,
        version_label,
        changelog_notes,
        author_name,
        author_id,
        snapshot,
        is_active,
        published_at,
        created_at
    ) VALUES (
        p_organization_id,
        v_next_version_number,
        v_version_label,
        COALESCE(p_changelog_notes, 'Publicación de versión desde el panel White-Label.'),
        COALESCE(p_author_name, 'Admin WhiteLabel'),
        p_actor_id,
        p_composite_snapshot,
        true,
        now(),
        now()
    )
    RETURNING id INTO v_version_id;

    -- 4. Actualizar organization_home_settings
    UPDATE public.organization_home_settings
    SET status = 'published',
        version_number = v_next_version_number,
        published_at = now(),
        published_by = p_actor_id,
        published_snapshot = p_composite_snapshot,
        has_unpublished_changes = false,
        updated_at = now()
    WHERE organization_id = p_organization_id;

    -- 5. Registrar en tenant_audit_logs
    INSERT INTO public.tenant_audit_logs (
        tenant_id,
        actor_id,
        action,
        before_state,
        after_state,
        created_at
    ) VALUES (
        p_organization_id,
        p_actor_id,
        'home_version_published',
        jsonb_build_object('version', v_next_version_number - 1, 'published_snapshot', v_previous_snapshot),
        jsonb_build_object('version', v_next_version_number, 'version_id', v_version_id, 'published_snapshot', p_composite_snapshot, 'changelog', p_changelog_notes),
        now()
    );

    v_result := jsonb_build_object(
        'success', true,
        'version_id', v_version_id,
        'version_number', v_next_version_number,
        'version_label', v_version_label,
        'published_at', now()
    );

    RETURN v_result;
END;
$$;
