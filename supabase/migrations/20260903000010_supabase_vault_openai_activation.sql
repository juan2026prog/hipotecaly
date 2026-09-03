-- ==============================================================================
-- MIGRATION 10: HIPOTECALY AI — ACTIVACIÓN DE OPENAI DESDE SUPER ADMIN CON VAULT
-- Almacenamiento cifrado en Supabase Vault, configuración global de IA y auditoría
-- ==============================================================================

-- 1. Asegurar que la extensión supabase_vault esté activa
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- 2. Tabla de Configuración Global del Proveedor AI (Metadata No Sensible)
CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'openai',
  ai_enabled BOOLEAN NOT NULL DEFAULT false,
  is_configured BOOLEAN NOT NULL DEFAULT false,
  key_last4 VARCHAR(4),
  vault_secret_name VARCHAR(100) NOT NULL DEFAULT 'hipotecaly_openai_api_key',
  vault_secret_id UUID REFERENCES vault.secrets(id) ON DELETE SET NULL,
  last_tested_at TIMESTAMPTZ,
  last_test_status VARCHAR(50) DEFAULT 'UNTESTED', -- 'PASS' | 'FAIL' | 'UNTESTED'
  last_test_message TEXT,
  last_test_models JSONB DEFAULT '[]'::jsonb,
  configured_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_ai_provider_name UNIQUE (provider)
);

-- 3. Tabla de Auditoría de Administración de AI (Zero Secret Keys)
CREATE TABLE IF NOT EXISTS public.ai_admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event VARCHAR(100) NOT NULL, -- 'OPENAI_KEY_CONFIGURED', 'OPENAI_KEY_REPLACED', 'OPENAI_KEY_DELETED', 'OPENAI_CONNECTION_TESTED', 'HIPOTECALY_AI_ACTIVATED', 'HIPOTECALY_AI_DEACTIVATED', 'ADMIN_HEALTH_CHECK'
  admin_user_id UUID,
  result VARCHAR(50) NOT NULL, -- 'SUCCESS' | 'FAILURE'
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lectura pública de ai_enabled e is_configured (solo metadata)
DROP POLICY IF EXISTS "Public read ai_provider_settings metadata" ON public.ai_provider_settings;
CREATE POLICY "Public read ai_provider_settings metadata"
  ON public.ai_provider_settings FOR SELECT
  USING (true);

-- Solo service_role o postgres pueden modificar la configuración o insertar auditorías
DROP POLICY IF EXISTS "Service role manages ai_provider_settings" ON public.ai_provider_settings;
CREATE POLICY "Service role manages ai_provider_settings"
  ON public.ai_provider_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages ai_admin_audit_logs" ON public.ai_admin_audit_logs;
CREATE POLICY "Service role manages ai_admin_audit_logs"
  ON public.ai_admin_audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insertar registro por defecto si no existe
INSERT INTO public.ai_provider_settings (provider, ai_enabled, is_configured, vault_secret_name)
VALUES ('openai', false, false, 'hipotecaly_openai_api_key')
ON CONFLICT (provider) DO NOTHING;

-- ------------------------------------------------------------------------------
-- PROCEDIMIENTO 1: Guardar o Reemplazar Clave en Vault (Atómico)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.store_openai_vault_secret(
  p_secret TEXT,
  p_admin_id UUID,
  p_last4 TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_existing_id UUID;
  v_new_id UUID;
BEGIN
  IF p_secret IS NULL OR length(trim(p_secret)) < 15 THEN
    RAISE EXCEPTION 'Clave inválida proporcionada.';
  END IF;

  -- 1. Buscar si ya existe el secreto en vault.secrets
  SELECT id INTO v_existing_id
  FROM vault.secrets
  WHERE name = 'hipotecaly_openai_api_key'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Actualizar secreto existente
    PERFORM vault.update_secret(
      secret_id := v_existing_id,
      new_secret := p_secret,
      new_name := 'hipotecaly_openai_api_key',
      new_description := 'OpenAI API Key gestionada por Super Admin de HIPOTECALY'
    );
    v_new_id := v_existing_id;
  ELSE
    -- Crear nuevo secreto en vault
    SELECT vault.create_secret(
      new_secret := p_secret,
      new_name := 'hipotecaly_openai_api_key',
      new_description := 'OpenAI API Key gestionada por Super Admin de HIPOTECALY'
    ) INTO v_new_id;
  END IF;

  -- 2. Actualizar metadata en ai_provider_settings
  UPDATE public.ai_provider_settings
  SET
    is_configured = true,
    key_last4 = p_last4,
    vault_secret_id = v_new_id,
    configured_by = p_admin_id,
    last_tested_at = now(),
    last_test_status = 'PASS',
    last_test_message = 'Clave verificada y almacenada en Vault.',
    updated_at = now()
  WHERE provider = 'openai';

  RETURN jsonb_build_object(
    'success', true,
    'configured', true,
    'last4', p_last4,
    'vault_secret_id', v_new_id
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- PROCEDIMIENTO 2: Eliminar Clave de Vault y Desactivar IA
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_openai_vault_secret(
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  -- 1. Eliminar de vault.secrets
  DELETE FROM vault.secrets
  WHERE name = 'hipotecaly_openai_api_key';

  -- 2. Actualizar configuración: desactiva la IA inmediatamente
  UPDATE public.ai_provider_settings
  SET
    is_configured = false,
    ai_enabled = false,
    key_last4 = NULL,
    vault_secret_id = NULL,
    last_test_status = 'UNTESTED',
    last_test_message = 'Clave eliminada por Super Admin.',
    last_test_models = '[]'::jsonb,
    configured_by = p_admin_id,
    updated_at = now()
  WHERE provider = 'openai';

  RETURN jsonb_build_object(
    'success', true,
    'configured', false,
    'ai_enabled', false
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- PROCEDIMIENTO 3: Obtener Clave Descifrada (Uso Exclusivo Server-Side)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_openai_vault_secret_internal()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'hipotecaly_openai_api_key'
  LIMIT 1;

  RETURN v_secret;
END;
$$;

-- Revocar permisos públicos sobre la función que descifra el secreto
REVOKE ALL ON FUNCTION public.get_openai_vault_secret_internal() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_openai_vault_secret_internal() FROM anon;
REVOKE ALL ON FUNCTION public.get_openai_vault_secret_internal() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_openai_vault_secret_internal() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_openai_vault_secret_internal() TO postgres;

-- ------------------------------------------------------------------------------
-- PROCEDIMIENTO 4: Master Switch AI (Activar / Desactivar)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_ai_master_switch(
  p_enabled BOOLEAN,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_configured BOOLEAN;
  v_last_test VARCHAR(50);
BEGIN
  SELECT is_configured, last_test_status INTO v_configured, v_last_test
  FROM public.ai_provider_settings
  WHERE provider = 'openai';

  IF p_enabled THEN
    -- Regla obligatoria: solo se puede activar si está configurada y el test fue exitoso
    IF NOT COALESCE(v_configured, false) THEN
      RAISE EXCEPTION 'No se puede activar HIPOTECALY AI sin una API Key configurada.';
    END IF;

    IF COALESCE(v_last_test, '') != 'PASS' THEN
      RAISE EXCEPTION 'No se puede activar HIPOTECALY AI porque la última prueba de conexión no fue exitosa.';
    END IF;
  END IF;

  UPDATE public.ai_provider_settings
  SET
    ai_enabled = p_enabled,
    updated_at = now()
  WHERE provider = 'openai';

  RETURN jsonb_build_object(
    'success', true,
    'ai_enabled', p_enabled
  );
END;
$$;
