-- ==============================================================================
-- HIPOTECALY: Migración 00033 - Security Definer Hardening & Last Admin Concurrency Lock
-- ==============================================================================

-- 1. HARDENING DE FUNCIONES HELPER SECURITY DEFINER (search_path fijo + EXECUTE restringido)

-- is_member_of_org
CREATE OR REPLACE FUNCTION public.is_member_of_org(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND LOWER(status) = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_member_of_org(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member_of_org(UUID) TO authenticated, service_role;

-- is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (is_super_admin = TRUE OR LOWER(role) = 'super_admin')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;

-- get_borrower_id_for_user
CREATE OR REPLACE FUNCTION public.get_borrower_id_for_user(user_uuid UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_effective_id UUID;
  v_borrower_id UUID;
BEGIN
  v_effective_id := COALESCE(user_uuid, auth.uid());
  IF v_effective_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT id INTO v_borrower_id FROM public.borrowers WHERE user_id = v_effective_id LIMIT 1;
  RETURN v_borrower_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_borrower_id_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_borrower_id_for_user(UUID) TO authenticated, service_role;

-- get_lender_org_id
CREATE OR REPLACE FUNCTION public.get_lender_org_id(target_lender_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id FROM public.lenders WHERE id = target_lender_id LIMIT 1;
  RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_lender_org_id(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lender_org_id(UUID) TO authenticated, service_role;

-- is_user_notary
CREATE OR REPLACE FUNCTION public.is_user_notary(target_org_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  IF target_org_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = target_org_id
        AND user_id = v_user_id
        AND LOWER(role) = 'notary'
        AND LOWER(status) = 'active'
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = v_user_id
        AND LOWER(role) = 'notary'
        AND LOWER(status) = 'active'
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.is_user_notary(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_user_notary(UUID) TO authenticated, service_role;

-- accept_organization_invitation_atomic
CREATE OR REPLACE FUNCTION public.accept_organization_invitation_atomic(
  p_token_hash TEXT,
  p_user_id UUID,
  p_user_email TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_inv RECORD;
  v_assigned_role TEXT;
  v_effective_user_id UUID;
BEGIN
  v_effective_user_id := COALESCE(auth.uid(), p_user_id);

  -- 1. Buscar e intentar actualizar atómicamente la invitación
  UPDATE public.organization_invitations
  SET
    status = 'ACCEPTED',
    accepted_at = NOW(),
    accepted_by = v_effective_user_id
  WHERE token_hash = p_token_hash
    AND status = 'PENDING'
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING * INTO v_inv;

  IF v_inv IS NULL THEN
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
    v_effective_user_id,
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
$$;

REVOKE ALL ON FUNCTION public.accept_organization_invitation_atomic(TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_organization_invitation_atomic(TEXT, UUID, TEXT) TO authenticated, service_role;


-- 2. NUEVA RPC ATÓMICA CON LOCK DE CONCURRENCIA PARA MUTACIÓN DE MIEMBROS
CREATE OR REPLACE FUNCTION public.manage_organization_member_atomic(
  p_organization_id UUID,
  p_target_member_id UUID,
  p_action TEXT,
  p_new_role TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_actor_user_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_effective_actor_id UUID;
  v_actor_role TEXT;
  v_actor_status TEXT;
  v_target RECORD;
  v_active_admins_count INT;
  v_target_is_admin BOOLEAN;
  v_clean_new_role TEXT;
BEGIN
  -- A. Advisory Lock por organización para serializar solicitudes concurrentes
  PERFORM pg_advisory_xact_lock(hashtext(p_organization_id::text));

  -- B. Resolver identidad del actor de forma server-side
  v_effective_actor_id := COALESCE(auth.uid(), p_actor_user_id);

  -- C. Validar autorizaciones del actor si está autenticado
  IF v_effective_actor_id IS NOT NULL THEN
    SELECT LOWER(role), LOWER(status)
    INTO v_actor_role, v_actor_status
    FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND user_id = v_effective_actor_id
    LIMIT 1;

    IF (v_actor_role IS NULL OR v_actor_role NOT IN ('tenant_owner', 'owner', 'tenant_admin', 'admin') OR v_actor_status <> 'active')
       AND NOT public.is_super_admin() THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Acceso denegado: Se requieren permisos de Administrador activo en la organización.'
      );
    END IF;
  END IF;

  -- D. Obtener miembro objetivo con FOR UPDATE
  SELECT * INTO v_target
  FROM public.organization_members
  WHERE id = p_target_member_id
    AND organization_id = p_organization_id
  FOR UPDATE;

  IF v_target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Miembro no encontrado en la organización.');
  END IF;

  -- E. Protecciones del Propietario (tenant_owner)
  IF LOWER(v_target.role) = 'tenant_owner' THEN
    IF p_action = 'toggle-status' AND LOWER(COALESCE(p_new_status, '')) IN ('disabled', 'inactive') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'OWNERSHIP_CHANGE_ATTEMPT_BLOCKED: El propietario principal de la organización (tenant_owner) no puede ser desactivado.'
      );
    END IF;

    IF p_action = 'change-role' AND LOWER(COALESCE(p_new_role, '')) NOT IN ('tenant_owner', 'owner') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'OWNERSHIP_CHANGE_ATTEMPT_BLOCKED: El propietario principal de la organización (tenant_owner) no puede ser degradado.'
      );
    END IF;

    IF p_action IN ('remove-member', 'delete-member') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'OWNERSHIP_CHANGE_ATTEMPT_BLOCKED: El propietario principal de la organización (tenant_owner) no puede ser eliminado.'
      );
    END IF;
  END IF;

  -- Bloqueo de auto-escalamiento a tenant_owner
  IF p_action = 'change-role' AND LOWER(COALESCE(p_new_role, '')) IN ('tenant_owner', 'owner') THEN
    IF v_actor_role <> 'tenant_owner' AND NOT public.is_super_admin() THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'OWNERSHIP_CHANGE_ATTEMPT_BLOCKED: No se pueden asignar derechos de propietario principal (tenant_owner) desde la gestión común de roles.'
      );
    END IF;
  END IF;

  -- F. Concurrencia y Salvaguarda Cero Admins
  SELECT COUNT(*) INTO v_active_admins_count
  FROM public.organization_members
  WHERE organization_id = p_organization_id
    AND LOWER(role) IN ('tenant_owner', 'owner', 'tenant_admin', 'admin')
    AND LOWER(status) IN ('active', 'enabled');

  v_target_is_admin := (
    LOWER(v_target.role) IN ('tenant_owner', 'owner', 'tenant_admin', 'admin')
    AND LOWER(v_target.status) IN ('active', 'enabled')
  );

  IF v_target_is_admin AND v_active_admins_count <= 1 THEN
    IF p_action = 'toggle-status' AND LOWER(COALESCE(p_new_status, '')) IN ('disabled', 'inactive') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'LAST_ADMIN_PROTECTION: Tu organización debe conservar al menos un Administrador activo.'
      );
    END IF;

    IF p_action = 'change-role' AND LOWER(COALESCE(p_new_role, '')) NOT IN ('tenant_owner', 'owner', 'tenant_admin', 'admin') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'LAST_ADMIN_PROTECTION: Tu organización debe conservar al menos un Administrador activo.'
      );
    END IF;

    IF p_action IN ('remove-member', 'delete-member') THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'LAST_ADMIN_PROTECTION: Tu organización debe conservar al menos un Administrador activo.'
      );
    END IF;
  END IF;

  -- G. Mutación Atómica
  IF p_action = 'change-role' THEN
    v_clean_new_role := LOWER(p_new_role);
    IF v_clean_new_role IN ('admin', 'administrador') THEN
      v_clean_new_role := 'tenant_admin';
    END IF;

    UPDATE public.organization_members
    SET role = v_clean_new_role
    WHERE id = v_target.id;

    RETURN jsonb_build_object('success', true, 'action', 'change-role', 'role', v_clean_new_role);
  ELSIF p_action = 'toggle-status' THEN
    UPDATE public.organization_members
    SET status = LOWER(p_new_status)
    WHERE id = v_target.id;

    RETURN jsonb_build_object('success', true, 'action', 'toggle-status', 'status', LOWER(p_new_status));
  ELSIF p_action IN ('remove-member', 'delete-member') THEN
    DELETE FROM public.organization_members
    WHERE id = v_target.id;

    RETURN jsonb_build_object('success', true, 'action', 'remove-member');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Acción no válida.');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.manage_organization_member_atomic(UUID, UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_organization_member_atomic(UUID, UUID, TEXT, TEXT, TEXT, UUID) TO authenticated, service_role;
