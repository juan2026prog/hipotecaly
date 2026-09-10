-- ==============================================================================
-- HIPOTECALY: Migration 20260910000035
-- Control de Seguridad Super Admin para Bloquear Integraciones Reales en Organizaciones Demo
-- ==============================================================================

-- 1. Agregar columnas a la tabla organizations si no existen
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS external_integrations_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Agregar columnas a la tabla organization_settings si no existen
ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS external_integrations_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Configurar por defecto a Estudio Nova (organization_id = 'd0000000-0000-0000-0000-000000000001' o slug = 'estudio-nova')
UPDATE organizations
SET
  is_demo = TRUE,
  external_integrations_enabled = FALSE,
  updated_at = NOW()
WHERE slug IN ('estudio-nova', 'nova', 'nova-demo', 'estudio_nova')
   OR id = 'd0000000-0000-0000-0000-000000000001';

UPDATE organization_settings
SET
  is_demo = TRUE,
  external_integrations_enabled = FALSE,
  updated_at = NOW()
WHERE organization_id IN (
  SELECT id FROM organizations WHERE slug IN ('estudio-nova', 'nova', 'nova-demo', 'estudio_nova') OR id = 'd0000000-0000-0000-0000-000000000001'
);

-- 4. Asegurar que las demás organizaciones activas permanezcan en PRODUCCIÓN con integraciones HABILITADAS
UPDATE organizations
SET
  is_demo = FALSE,
  external_integrations_enabled = TRUE,
  updated_at = NOW()
WHERE id <> 'd0000000-0000-0000-0000-000000000001'
  AND slug NOT IN ('estudio-nova', 'nova', 'nova-demo', 'estudio_nova');

-- 5. RPC Segura para actualizar el estado del gate demo desde Super Admin
CREATE OR REPLACE FUNCTION update_organization_demo_gate(
  target_org_id UUID,
  new_is_demo BOOLEAN,
  new_external_integrations_enabled BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user_id UUID;
  is_caller_super_admin BOOLEAN := FALSE;
  target_slug TEXT;
  old_is_demo BOOLEAN;
  old_ext_enabled BOOLEAN;
BEGIN
  calling_user_id := auth.uid();
  
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Verificar si el usuario invocador posee rol super_admin
  SELECT COALESCE(p.is_super_admin, FALSE) INTO is_caller_super_admin
  FROM profiles p
  WHERE p.id = calling_user_id;

  IF NOT is_caller_super_admin THEN
    RAISE EXCEPTION 'Permiso denegado: Únicamente super_admin puede modificar la configuración demo/integraciones de organizaciones.';
  END IF;

  -- Obtener estado anterior
  SELECT slug, is_demo, external_integrations_enabled
  INTO target_slug, old_is_demo, old_ext_enabled
  FROM organizations
  WHERE id = target_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organización no encontrada: %', target_org_id;
  END IF;

  -- Actualizar tabla principal organizations
  UPDATE organizations
  SET
    is_demo = new_is_demo,
    external_integrations_enabled = new_external_integrations_enabled,
    updated_at = NOW()
  WHERE id = target_org_id;

  -- Actualizar o insertar en organization_settings
  INSERT INTO organization_settings (organization_id, is_demo, external_integrations_enabled, updated_at)
  VALUES (target_org_id, new_is_demo, new_external_integrations_enabled, NOW())
  ON CONFLICT (organization_id) DO UPDATE
  SET
    is_demo = EXCLUDED.is_demo,
    external_integrations_enabled = EXCLUDED.external_integrations_enabled,
    updated_at = NOW();

  -- Registrar en auditoría
  INSERT INTO audit_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata,
    created_at
  ) VALUES (
    target_org_id,
    calling_user_id,
    'ORGANIZATION_DEMO_MODE_CHANGED',
    'organization',
    target_org_id::TEXT,
    jsonb_build_object(
      'slug', target_slug,
      'old_is_demo', old_is_demo,
      'new_is_demo', new_is_demo,
      'old_external_integrations_enabled', old_ext_enabled,
      'new_external_integrations_enabled', new_external_integrations_enabled,
      'timestamp', NOW()
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'organization_id', target_org_id,
    'is_demo', new_is_demo,
    'external_integrations_enabled', new_external_integrations_enabled
  );
END;
$$;

GRANT EXECUTE ON FUNCTION update_organization_demo_gate TO authenticated;
