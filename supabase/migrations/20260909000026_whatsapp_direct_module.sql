-- ==============================================================================
-- HIPOTECALY MIGRATION: 20260909000026_whatsapp_direct_module.sql
-- Módulo Funcional WhatsApp Directo: Control en Dos Niveles, Persistencia y RLS
-- ==============================================================================

-- 1. CREAR TABLA DE CONFIGURACIÓN DE WHATSAPP POR ORGANIZACIÓN (NIVEL 2)
CREATE TABLE IF NOT EXISTS public.tenant_whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  phone_number VARCHAR(30) NOT NULL DEFAULT '59899123456',
  button_text VARCHAR(60) NOT NULL DEFAULT '¿Necesitás ayuda?',
  default_message TEXT NOT NULL DEFAULT 'Hola, estoy visitando su sitio web y quisiera hacer una consulta.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.tenant_whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS RLS EN tenant_whatsapp_settings
DROP POLICY IF EXISTS "Public read for tenant whatsapp settings" ON public.tenant_whatsapp_settings;
CREATE POLICY "Public read for tenant whatsapp settings"
  ON public.tenant_whatsapp_settings
  FOR SELECT
  TO public, anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Tenant admins and super admin manage whatsapp settings" ON public.tenant_whatsapp_settings;
CREATE POLICY "Tenant admins and super admin manage whatsapp settings"
  ON public.tenant_whatsapp_settings
  FOR ALL
  TO authenticated
  USING (public.is_member_of_org(tenant_id) OR public.is_super_admin())
  WITH CHECK (public.is_member_of_org(tenant_id) OR public.is_super_admin());

-- 3. SEED INICIAL PARA TENANT DEMO (ESTUDIO NOVA)
-- 3.1 Nivel 1: Master switch habilitado por Super Admin en tenant_modules
INSERT INTO public.tenant_modules (tenant_id, module_key, enabled, configuration)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'whatsapp_direct_enabled',
  TRUE,
  '{"name": "WhatsApp Directo"}'::jsonb
)
ON CONFLICT (tenant_id, module_key) DO UPDATE
SET enabled = EXCLUDED.enabled, updated_at = NOW();

-- 3.2 Nivel 2: Configuración de la organización Estudio Nova
INSERT INTO public.tenant_whatsapp_settings (
  tenant_id,
  enabled,
  phone_number,
  button_text,
  default_message,
  created_at,
  updated_at
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  TRUE,
  '59899123456',
  '¿Necesitás ayuda?',
  'Hola, estoy visitando el sitio de Estudio Nova y quisiera hacer una consulta.',
  NOW(),
  NOW()
)
ON CONFLICT (tenant_id) DO UPDATE
SET
  phone_number = EXCLUDED.phone_number,
  button_text = EXCLUDED.button_text,
  default_message = EXCLUDED.default_message,
  updated_at = NOW();
