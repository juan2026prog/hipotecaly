-- ==============================================================================
-- HIPOTECALY: Agenda Soberana Multi-Tenant e Integración con Google Calendar
-- Migración 00024: Tablas `calendar_events`, `user_calendar_integrations`,
-- Tipos Enums, Índices y Políticas de Seguridad RLS
-- ==============================================================================

-- 1. ENUMS DE AGENDA
DO $$ BEGIN
    CREATE TYPE calendar_event_type_enum AS ENUM (
        'signature',             -- Firma de escritura / mutuo / hipoteca
        'original_documents',    -- Entrega o cotejo de títulos originales
        'valuation',             -- Inspección o tasación pericial del inmueble
        'client_meeting',        -- Reunión presencial o remota con el solicitante
        'notary_review',         -- Audiencia o revisión notarial de recaudos
        'deadline',              -- Plazo límite o vencimiento registral
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE calendar_event_status_enum AS ENUM (
        'pending_coordination',  -- Pendiente de acordar fecha
        'proposed',              -- Fecha propuesta a las partes
        'scheduled',             -- Confirmada y agendada
        'completed',             -- Realizada con éxito
        'rescheduled',           -- Reprogramada con nueva fecha
        'cancelled'              -- Cancelada
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA PRINCIPAL DE EVENTOS DE AGENDA (calendar_events)
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    event_type calendar_event_type_enum NOT NULL DEFAULT 'signature',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Montevideo',
    location_type VARCHAR(50) NOT NULL DEFAULT 'notary_office', -- 'notary_office', 'virtual', 'property', 'other'
    location_address TEXT,
    virtual_meeting_url TEXT,
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    participants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array con { name, role, email, phone, status }
    required_documents JSONB DEFAULT '[]'::jsonb,
    status calendar_event_status_enum NOT NULL DEFAULT 'scheduled',
    google_calendar_event_id VARCHAR(255),
    google_sync_status VARCHAR(50) DEFAULT 'not_synced', -- 'not_synced', 'synced', 'sync_error'
    google_last_synced_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_cal_events_org ON public.calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_app ON public.calendar_events(application_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_start ON public.calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_cal_events_status ON public.calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_cal_events_type ON public.calendar_events(event_type);

-- 3. TABLA DE INTEGRACIONES DE CALENDARIO POR USUARIO (user_calendar_integrations)
CREATE TABLE IF NOT EXISTS public.user_calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'google_calendar',
    calendar_id VARCHAR(255) NOT NULL DEFAULT 'primary',
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_cal_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_cal_user ON public.user_calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cal_org ON public.user_calendar_integrations(organization_id);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS PARA `calendar_events`
CREATE POLICY "Super admins full access to calendar_events" ON public.calendar_events
    FOR ALL TO authenticated
    USING (public.is_super_admin());

CREATE POLICY "Tenant and case participants view calendar events" ON public.calendar_events
    FOR SELECT TO authenticated
    USING (
        public.is_super_admin()
        OR (application_id IS NOT NULL AND public.can_access_application(application_id, organization_id))
        OR (application_id IS NULL AND public.is_member_of_org(organization_id))
    );

CREATE POLICY "Tenant staff and assigned notaries manage calendar events" ON public.calendar_events
    FOR ALL TO authenticated
    USING (
        public.is_super_admin()
        OR (
            public.is_member_of_org(organization_id)
            AND (
                EXISTS (
                    SELECT 1 FROM public.organization_members
                    WHERE organization_id = calendar_events.organization_id
                    AND user_id = auth.uid()
                    AND role IN ('tenant_owner', 'tenant_admin', 'analyst', 'operator', 'notary')
                    AND is_active = TRUE
                )
            )
        )
    );

-- 6. POLÍTICAS RLS PARA `user_calendar_integrations`
CREATE POLICY "Users manage own calendar integrations" ON public.user_calendar_integrations
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin());
