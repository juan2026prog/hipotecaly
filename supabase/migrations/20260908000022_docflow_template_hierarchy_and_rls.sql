-- ==============================================================================
-- HIPOTECALY DOCFLOW: Jerarquía de Plantillas, Versionado, Disponibilidad y RLS
-- Migración 00022: Consolidación de Arquitectura de Plantillas Globales y Tenant
-- ==============================================================================

-- 1. EXTENSIÓN DE TABLA document_templates CON CAMPOS DE JERARQUÍA Y DISPONIBILIDAD
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'document_templates' AND column_name = 'scope') THEN
        ALTER TABLE public.document_templates ADD COLUMN scope VARCHAR(50) NOT NULL DEFAULT 'tenant' CHECK (scope IN ('global', 'tenant'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'document_templates' AND column_name = 'origin_type') THEN
        ALTER TABLE public.document_templates ADD COLUMN origin_type VARCHAR(50) NOT NULL DEFAULT 'custom' CHECK (origin_type IN ('global', 'derived', 'custom'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'document_templates' AND column_name = 'parent_template_id') THEN
        ALTER TABLE public.document_templates ADD COLUMN parent_template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'document_templates' AND column_name = 'parent_version') THEN
        ALTER TABLE public.document_templates ADD COLUMN parent_version INT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'document_templates' AND column_name = 'availability') THEN
        ALTER TABLE public.document_templates ADD COLUMN availability VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (availability IN ('all', 'selected', 'disabled'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'document_templates' AND column_name = 'available_tenant_ids') THEN
        ALTER TABLE public.document_templates ADD COLUMN available_tenant_ids UUID[] DEFAULT NULL;
    END IF;
END $$;

-- 2. EXTENSIÓN DE TABLA generated_documents PARA TRAZABILIDAD HISTÓRICA INMUTABLE
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_documents' AND column_name = 'parent_template_id') THEN
        ALTER TABLE public.generated_documents ADD COLUMN parent_template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_documents' AND column_name = 'parent_template_version') THEN
        ALTER TABLE public.generated_documents ADD COLUMN parent_template_version INT;
    END IF;
END $$;

-- 3. ÍNDICES DE RENDIMIENTO Y CONSULTAS
CREATE INDEX IF NOT EXISTS idx_doc_tpl_scope ON public.document_templates(scope);
CREATE INDEX IF NOT EXISTS idx_doc_tpl_parent ON public.document_templates(parent_template_id);
CREATE INDEX IF NOT EXISTS idx_doc_tpl_origin ON public.document_templates(origin_type);
CREATE INDEX IF NOT EXISTS idx_doc_tpl_availability ON public.document_templates(availability);
CREATE INDEX IF NOT EXISTS idx_doc_tpl_status_scope ON public.document_templates(status, scope);
CREATE INDEX IF NOT EXISTS idx_gen_docs_parent_tpl ON public.generated_documents(parent_template_id, parent_template_version);

-- 4. POLÍTICAS RLS ESTRICTAS PARA document_templates
-- Deshabilitar / recrear políticas para asegurar aislamiento estricto
DROP POLICY IF EXISTS "Super admin full access templates" ON public.document_templates;
DROP POLICY IF EXISTS "Users read global and own tenant templates" ON public.document_templates;
DROP POLICY IF EXISTS "Users read available global and own tenant templates" ON public.document_templates;
DROP POLICY IF EXISTS "Tenant admins manage own templates" ON public.document_templates;
DROP POLICY IF EXISTS "Tenant admins insert own templates" ON public.document_templates;
DROP POLICY IF EXISTS "Tenant admins update own templates" ON public.document_templates;
DROP POLICY IF EXISTS "Tenant admins delete own templates" ON public.document_templates;

-- 4.1 Super Admin: Acceso Total de Administración a todas las plantillas
CREATE POLICY "Super admin full access templates" ON public.document_templates
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_super_admin = TRUE
        )
    );

-- 4.2 Lectura de Plantillas: Propias del tenant o Globales autorizadas
CREATE POLICY "Users read available global and own tenant templates" ON public.document_templates
    FOR SELECT TO authenticated
    USING (
        -- Caso 1: Plantilla privada de su propia organización
        (
            scope = 'tenant' AND
            tenant_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid() AND is_active = TRUE
            )
        )
        OR
        -- Caso 2: Plantilla global oficial activa con disponibilidad universal o asignada
        (
            (scope = 'global' OR is_global = TRUE) AND
            status = 'active' AND
            (
                availability = 'all' OR
                (
                    availability = 'selected' AND
                    EXISTS (
                        SELECT 1 FROM public.organization_members om
                        WHERE om.user_id = auth.uid() AND om.is_active = TRUE
                        AND om.organization_id = ANY(document_templates.available_tenant_ids)
                    )
                )
            )
        )
    );

-- 4.3 Creación: Solo administradores de tenant pueden crear plantillas para SU organización
CREATE POLICY "Tenant admins insert own templates" ON public.document_templates
    FOR INSERT TO authenticated
    WITH CHECK (
        scope = 'tenant' AND
        is_global = FALSE AND
        tenant_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('tenant_owner', 'tenant_admin') AND is_active = TRUE
        )
    );

-- 4.4 Modificación: Solo administradores de tenant pueden modificar plantillas de SU organización (NUNCA globales ni de otros)
CREATE POLICY "Tenant admins update own templates" ON public.document_templates
    FOR UPDATE TO authenticated
    USING (
        scope = 'tenant' AND
        is_global = FALSE AND
        tenant_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('tenant_owner', 'tenant_admin') AND is_active = TRUE
        )
    )
    WITH CHECK (
        scope = 'tenant' AND
        is_global = FALSE AND
        tenant_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('tenant_owner', 'tenant_admin') AND is_active = TRUE
        )
    );

-- 4.5 Eliminación: Solo administradores de tenant pueden eliminar/archivar plantillas de SU organización
CREATE POLICY "Tenant admins delete own templates" ON public.document_templates
    FOR DELETE TO authenticated
    USING (
        scope = 'tenant' AND
        is_global = FALSE AND
        tenant_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('tenant_owner', 'tenant_admin') AND is_active = TRUE
        )
    );
