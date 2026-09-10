-- ==============================================================================
-- HIPOTECALY: Migración 00032 - Seguridad de Invitaciones, Hash CSPRNG, RPC Atómica y RLS
-- ==============================================================================

-- 1. Agregar columnas y restricciones a organization_invitations
ALTER TABLE IF EXISTS public.organization_invitations
ADD COLUMN IF NOT EXISTS token_hash TEXT,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS accepted_by UUID;

-- Crear índice único para token_hash si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_invitation_token_hash'
  ) THEN
    ALTER TABLE public.organization_invitations
    ADD CONSTRAINT unique_invitation_token_hash UNIQUE (token_hash);
  END IF;
END $$;

-- 2. Función RPC Atómica para la aceptación segura de invitaciones
CREATE OR REPLACE FUNCTION public.accept_organization_invitation_atomic(
  p_token_hash TEXT,
  p_user_id UUID,
  p_user_email TEXT
) RETURNS JSONB AS $$
DECLARE
  v_inv RECORD;
  v_assigned_role TEXT;
BEGIN
  -- 1. Buscar e intentar actualizar atómicamente la invitación
  UPDATE public.organization_invitations
  SET
    status = 'ACCEPTED',
    accepted_at = NOW(),
    accepted_by = p_user_id
  WHERE token_hash = p_token_hash
    AND status = 'PENDING'
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING * INTO v_inv;

  IF v_inv IS NULL THEN
    -- Verificar causa del fallo
    SELECT * INTO v_inv FROM public.organization_invitations WHERE token_hash = p_token_hash LIMIT 1;
    IF v_inv IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invitación no encontrada o token inválido.');
    ELSIF v_inv.status = 'ACCEPTED' THEN
      RETURN jsonb_build_object('success', false, 'error', 'La invitación ya fue utilizada previamente.');
    ELSIF v_inv.status = 'REVOKED' THEN
      RETURN jsonb_build_object('success', false, 'error', 'La invitación ha sido revocada.');
    ELSIF v_inv.expires_at <= NOW() THEN
      RETURN jsonb_build_object('success', false, 'error', 'La invitación ha expirado y ya no puede ser aceptada.');
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'No se pudo procesar la invitación.');
    END IF;
  END IF;

  -- 2. Validar coincidencia de email (case-insensitive)
  IF LOWER(TRIM(v_inv.email)) <> LOWER(TRIM(p_user_email)) THEN
    -- Revertir estado de la invitación
    UPDATE public.organization_invitations
    SET status = 'PENDING', accepted_at = NULL, accepted_by = NULL
    WHERE id = v_inv.id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVITATION_EMAIL_MISMATCH: El correo autenticado no coincide con el destinatario de la invitación.'
    );
  END IF;

  -- 3. Mapear rol técnico (NUNCA tenant_owner)
  v_assigned_role := LOWER(v_inv.role);
  IF v_assigned_role IN ('tenant_owner', 'owner', 'admin', 'administrador') THEN
    v_assigned_role := 'tenant_admin';
  END IF;

  -- 4. Crear o actualizar membresía de la organización
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    email,
    role,
    status,
    created_at
  ) VALUES (
    v_inv.organization_id,
    p_user_id,
    p_user_email,
    v_assigned_role,
    'active',
    NOW()
  )
  ON CONFLICT (organization_id, user_id) DO UPDATE
  SET role = EXCLUDED.role, status = 'active';

  RETURN jsonb_build_object(
    'success', true,
    'role', v_assigned_role,
    'organization_id', v_inv.organization_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS Hardening en organization_invitations y organization_members
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view tenant invitations" ON public.organization_invitations;
CREATE POLICY "Members can view tenant invitations"
ON public.organization_invitations FOR SELECT
TO authenticated
USING (public.is_member_of_org(organization_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "Deny direct browser write to invitations" ON public.organization_invitations;
CREATE POLICY "Deny direct browser write to invitations"
ON public.organization_invitations FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());
