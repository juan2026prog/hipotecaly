-- ==============================================================================
-- HIPOTECALY: Módulo Operativo de Escribanos, Estudio Notarial y RLS Estricto
-- Migración 00016: Tablas Notariales, Asignación de Expedientes, Observaciones,
-- Checklist, Perfil Notarial Profesional y Políticas de Seguridad
-- ==============================================================================

-- 1. ENUMS Y TIPOS NOTARIALES
DO $$ BEGIN
    CREATE TYPE notary_status_enum AS ENUM (
        'not_assigned',
        'assigned',
        'documents_pending',
        'under_review',
        'observed',
        'documentation_complete',
        'drafting',
        'ready_to_sign',
        'signed',
        'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notary_professional_status_enum AS ENUM (
        'pending',
        'verified',
        'authorized',
        'suspended',
        'inactive',
        'verification_failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notary_certificate_status_enum AS ENUM (
        'not_configured',
        'pending',
        'active',
        'expired',
        'revoked',
        'error'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notary_observation_type_enum AS ENUM (
        'documental',
        'registral',
        'catastral',
        'tributaria',
        'dominial',
        'sucesoria',
        'poderes',
        'gravamenes',
        'otra'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notary_severity_level_enum AS ENUM (
        'informativa',
        'requiere_correccion',
        'bloqueante'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. AMPLIAR TABLA `applications` CON `notary_status`
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS notary_status notary_status_enum NOT NULL DEFAULT 'not_assigned';

CREATE INDEX IF NOT EXISTS idx_applications_notary_status ON public.applications(notary_status);

-- 3. TABLA DE ESTUDIOS NOTARIALES (notary_offices)
CREATE TABLE IF NOT EXISTS public.notary_offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50), -- RUT en Uruguay
    address TEXT,
    city VARCHAR(100) DEFAULT 'Montevideo',
    department VARCHAR(100) DEFAULT 'Montevideo',
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notary_offices_org ON public.notary_offices(organization_id);

-- 4. TABLA DE PERFIL PROFESIONAL DEL ESCRIBANO (notary_profiles)
CREATE TABLE IF NOT EXISTS public.notary_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    notary_office_id UUID REFERENCES public.notary_offices(id) ON DELETE SET NULL,
    notarial_fund_affiliate_number VARCHAR(50), -- N.º de afiliado a Caja Notarial
    professional_status notary_professional_status_enum NOT NULL DEFAULT 'pending',
    scj_authorization_status VARCHAR(50) DEFAULT 'pending',
    scj_verified_at TIMESTAMPTZ,
    professional_address TEXT,
    professional_city VARCHAR(100) DEFAULT 'Montevideo',
    professional_department VARCHAR(100) DEFAULT 'Montevideo',
    electronic_domicile VARCHAR(255), -- Domicilio electrónico oficial
    university VARCHAR(150),
    qualification_date DATE,
    role_in_office VARCHAR(50) DEFAULT 'notary', -- 'notary_owner', 'notary', 'notary_assistant', 'notary_admin'
    digital_signature_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    digital_certificate_status notary_certificate_status_enum NOT NULL DEFAULT 'not_configured',
    digital_certificate_expires_at TIMESTAMPTZ,
    digital_certificate_identifier VARCHAR(255),
    certificate_provider VARCHAR(100) DEFAULT 'Abitab',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notary_profiles_user ON public.notary_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_notary_profiles_org ON public.notary_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_notary_profiles_affiliate ON public.notary_profiles(notarial_fund_affiliate_number);

-- 5. TABLA DE ASIGNACIÓN EXPLÍCITA DE ESCRIBANOS (application_notaries)
CREATE TABLE IF NOT EXISTS public.application_notaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    notary_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    role_in_case VARCHAR(50) NOT NULL DEFAULT 'primary_notary', -- 'primary_notary', 'collaborator', 'assistant'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'revoked', 'completed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_app_notary UNIQUE (application_id, notary_user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_notaries_app ON public.application_notaries(application_id);
CREATE INDEX IF NOT EXISTS idx_app_notaries_user ON public.application_notaries(notary_user_id);
CREATE INDEX IF NOT EXISTS idx_app_notaries_org ON public.application_notaries(organization_id);
CREATE INDEX IF NOT EXISTS idx_app_notaries_status ON public.application_notaries(status);

-- 6. TABLA DE CHECKLIST NOTARIAL (notary_checklist_items)
CREATE TABLE IF NOT EXISTS public.notary_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'identificacion', -- 'identificacion', 'dominial', 'catastral', 'tributario', 'registral', 'escritura'
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_review', 'completed', 'observed', 'waived'
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    comments TEXT,
    related_document_id UUID REFERENCES public.property_documents(id) ON DELETE SET NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notary_chk_app ON public.notary_checklist_items(application_id);
CREATE INDEX IF NOT EXISTS idx_notary_chk_status ON public.notary_checklist_items(status);

-- 7. TABLA DE OBSERVACIONES NOTARIALES (notary_observations)
CREATE TABLE IF NOT EXISTS public.notary_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    observation_type notary_observation_type_enum NOT NULL DEFAULT 'documental',
    severity_level notary_severity_level_enum NOT NULL DEFAULT 'requiere_correccion',
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'dismissed'
    responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE,
    related_document_id UUID REFERENCES public.property_documents(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notary_obs_app ON public.notary_observations(application_id);
CREATE INDEX IF NOT EXISTS idx_notary_obs_type ON public.notary_observations(observation_type);
CREATE INDEX IF NOT EXISTS idx_notary_obs_severity ON public.notary_observations(severity_level);
CREATE INDEX IF NOT EXISTS idx_notary_obs_status ON public.notary_observations(status);

-- 8. FUNCIONES DE AYUDA DE AUTORIZACIÓN PARA ESCRIBANOS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_user_notary(target_org_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_notary_access_app(target_app_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.application_notaries
        WHERE application_id = target_app_id
        AND notary_user_id = auth.uid()
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_access_application(target_app_id UUID, target_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_super BOOLEAN;
    is_notary_role BOOLEAN;
    is_general_staff BOOLEAN;
    is_owner_borrower BOOLEAN;
BEGIN
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

    RETURN is_general_staff;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 9. HABILITAR ROW LEVEL SECURITY (RLS) EN NUEVAS TABLAS
ALTER TABLE public.notary_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notary_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notary_observations ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS RLS: notary_offices
CREATE POLICY "View notary offices for tenant members" ON public.notary_offices
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR public.is_member_of_org(organization_id));

CREATE POLICY "Manage notary offices for tenant admins" ON public.notary_offices
    FOR ALL TO authenticated
    USING (
        public.is_super_admin() OR 
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = notary_offices.organization_id 
            AND user_id = auth.uid() 
            AND role IN ('tenant_owner', 'tenant_admin')
        )
    );

-- 11. POLÍTICAS RLS: notary_profiles
CREATE POLICY "View notary profiles in organization" ON public.notary_profiles
    FOR SELECT TO authenticated
    USING (
        public.is_super_admin() 
        OR user_id = auth.uid() 
        OR public.is_member_of_org(organization_id)
    );

CREATE POLICY "Notary updates own profile operational data" ON public.notary_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Tenant admin creates and manages notary profiles" ON public.notary_profiles
    FOR ALL TO authenticated
    USING (
        public.is_super_admin() 
        OR EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = notary_profiles.organization_id 
            AND user_id = auth.uid() 
            AND role IN ('tenant_owner', 'tenant_admin')
        )
    );

-- 12. POLÍTICAS RLS: application_notaries
CREATE POLICY "View application notaries" ON public.application_notaries
    FOR SELECT TO authenticated
    USING (
        public.is_super_admin() 
        OR notary_user_id = auth.uid()
        OR public.can_access_application(application_id, organization_id)
    );

CREATE POLICY "Manage application notaries for admins and analysts" ON public.application_notaries
    FOR ALL TO authenticated
    USING (
        public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = application_notaries.organization_id 
            AND user_id = auth.uid() 
            AND role IN ('tenant_owner', 'tenant_admin', 'analyst')
        )
    );

-- 13. POLÍTICAS RLS: notary_checklist_items
CREATE POLICY "Access notary checklist items" ON public.notary_checklist_items
    FOR ALL TO authenticated
    USING (
        public.is_super_admin()
        OR public.can_access_application(application_id, organization_id)
    );

-- 14. POLÍTICAS RLS: notary_observations
CREATE POLICY "Access notary observations" ON public.notary_observations
    FOR ALL TO authenticated
    USING (
        public.is_super_admin()
        OR public.can_access_application(application_id, organization_id)
    );

-- 15. ACTUALIZAR POLÍTICAS RLS DE `applications` PARA RESTRINGIR AL ESCRIBANO
DROP POLICY IF EXISTS "Borrower sees only own applications; Tenant members see tenant apps" ON public.applications;
CREATE POLICY "Application access with strict notary assignment isolation"
    ON public.applications FOR SELECT
    TO authenticated
    USING (
        public.can_access_application(id, organization_id)
    );

DROP POLICY IF EXISTS "Borrower can update own draft application; Tenant staff can update" ON public.applications;
CREATE POLICY "Application update with strict notary assignment isolation"
    ON public.applications FOR UPDATE
    TO authenticated
    USING (
        (borrower_id = public.get_borrower_id_for_user() AND status = 'draft')
        OR public.can_access_application(id, organization_id)
    );

-- 16. ACTUALIZAR POLÍTICAS RLS DE `properties`, `property_documents`, `property_photos`, `generated_documents`
DROP POLICY IF EXISTS "Property access matches application access" ON public.properties;
CREATE POLICY "Property access matches application access with notary check"
    ON public.properties FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = properties.application_id
            AND public.can_access_application(a.id, a.organization_id)
        )
    );

DROP POLICY IF EXISTS "Property documents access matches application" ON public.property_documents;
CREATE POLICY "Property documents access matches application with notary check"
    ON public.property_documents FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            JOIN public.applications a ON a.id = p.application_id
            WHERE p.id = property_documents.property_id
            AND public.can_access_application(a.id, a.organization_id)
        )
    );

DROP POLICY IF EXISTS "Property photos access matches application" ON public.property_photos;
CREATE POLICY "Property photos access matches application with notary check"
    ON public.property_photos FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.properties p
            JOIN public.applications a ON a.id = p.application_id
            WHERE p.id = property_photos.property_id
            AND public.can_access_application(a.id, a.organization_id)
        )
    );

DROP POLICY IF EXISTS "Tenant members full access generated documents" ON public.generated_documents;
CREATE POLICY "Tenant and assigned notary access generated documents"
    ON public.generated_documents FOR ALL
    TO authenticated
    USING (
        public.is_super_admin()
        OR (case_id IS NOT NULL AND public.can_access_application(case_id, tenant_id))
        OR (case_id IS NULL AND public.is_member_of_org(tenant_id))
    );
