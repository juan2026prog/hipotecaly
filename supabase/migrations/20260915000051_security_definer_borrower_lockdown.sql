-- Migration: 20260915000051_security_definer_borrower_lockdown.sql
-- Description: Restrict get_borrower_id_for_user so that non-super-admins can only resolve their own auth.uid()

CREATE OR REPLACE FUNCTION public.get_borrower_id_for_user(user_uuid UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_effective_id UUID;
  v_borrower_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- If user_uuid is provided and differs from auth.uid(), verify if caller is super_admin or service_role
  IF user_uuid IS NOT NULL AND user_uuid IS DISTINCT FROM auth.uid() THEN
    -- Check if current role is service_role or user is super_admin
    IF current_user = 'service_role' OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
      v_effective_id := user_uuid;
    ELSE
      v_is_admin := public.is_super_admin();
      IF v_is_admin THEN
        v_effective_id := user_uuid;
      ELSE
        -- Force callers without admin privilege to their own auth.uid()
        v_effective_id := auth.uid();
      END IF;
    END IF;
  ELSE
    v_effective_id := COALESCE(user_uuid, auth.uid());
  END IF;

  IF v_effective_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_borrower_id FROM public.borrowers WHERE user_id = v_effective_id LIMIT 1;
  RETURN v_borrower_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_borrower_id_for_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_borrower_id_for_user(UUID) TO authenticated, service_role;
