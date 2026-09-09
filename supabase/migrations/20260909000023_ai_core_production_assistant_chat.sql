-- ==============================================================================
-- HIPOTECALY: Migración Fase AI Asistente Contextual & Prompts Versionados
-- Migración 20260909000023_ai_core_production_assistant_chat.sql
-- ==============================================================================

-- 1. TABLA DE CONVERSACIONES DEL ASISTENTE IA
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Consulta de Expediente',
    context_snapshot JSONB DEFAULT '{}'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA DE MENSAJES DE CONVERSACIÓN
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb, -- Referencias a documentos, expediente o políticas
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    model VARCHAR(100),
    prompt_version VARCHAR(50),
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    cost_usd NUMERIC(10,5) DEFAULT 0.00000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATÁLOGO DE PROMPTS VERSIONADOS (SUPER ADMIN MANAGEMENT)
CREATE TABLE IF NOT EXISTS public.ai_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    version VARCHAR(50) NOT NULL DEFAULT 'v1.0.0',
    description TEXT,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT,
    output_schema JSONB DEFAULT '{}'::jsonb,
    model_profile VARCHAR(50) NOT NULL DEFAULT 'reasoning',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_ai_conversations_org ON public.ai_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_app ON public.ai_conversations(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_name ON public.ai_prompt_templates(name);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Políticas de Conversaciones: Usuario / Organización autorizada
DROP POLICY IF EXISTS "Users can access their org conversations" ON public.ai_conversations;
CREATE POLICY "Users can access their org conversations" ON public.ai_conversations
    FOR ALL TO authenticated
    USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

-- Políticas de Mensajes: Quien tenga acceso a la conversación
DROP POLICY IF EXISTS "Users can access conversation messages" ON public.ai_messages;
CREATE POLICY "Users can access conversation messages" ON public.ai_messages
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations c
            WHERE c.id = conversation_id AND (public.is_member_of_org(c.organization_id) OR public.is_super_admin())
        )
    );

-- Políticas de Prompts: Lectura para usuarios autenticados, gestión Super Admin
DROP POLICY IF EXISTS "Authenticated read prompt templates" ON public.ai_prompt_templates;
CREATE POLICY "Authenticated read prompt templates" ON public.ai_prompt_templates
    FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Super Admin manage prompt templates" ON public.ai_prompt_templates;
CREATE POLICY "Super Admin manage prompt templates" ON public.ai_prompt_templates
    FOR ALL TO authenticated USING (public.is_super_admin());

-- 6. SEED DE PROMPTS DEL SISTEMA
INSERT INTO public.ai_prompt_templates (name, version, description, system_prompt, model_profile)
VALUES
(
    'assistant_chat',
    'v1.0.0',
    'System prompt para el Asistente IA Contextual en Backoffice',
    'Sos HIPOTECALY AI, el Asistente Experto en Triaje, Legajos y Análisis Hipotecario en Uruguay. Respondés consultas de oficiales de crédito y escribanos con base estricta en el expediente, documentos y políticas. Si no tenés suficiente evidencia, declaralo explícitamente.',
    'assistant'
),
(
    'document_extraction',
    'v1.0.0',
    'Extracción estructurada de documentos inmobiliarios y notariales',
    'Sos el motor de extracción documental de HIPOTECALY. Tu función es extraer padrón, titular, superficie, gravámenes y fechas en formato JSON estricto sin inventar información.',
    'fast_extraction'
),
(
    'case_summary',
    'v1.0.0',
    'Síntesis ejecutiva y cruces de inconsistencias para el informe de expediente',
    'Sos el redactor del dictamen preliminar de HIPOTECALY AI. Elaborá una síntesis clara, fortalezas y acciones requeridas para el analista humano.',
    'reasoning'
)
ON CONFLICT (name) DO UPDATE SET
    system_prompt = EXCLUDED.system_prompt,
    updated_at = NOW();
