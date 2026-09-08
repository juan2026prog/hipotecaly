-- ==============================================================================
-- HIPOTECALY MIGRATION: 20260908000021_super_admin_and_platform_mode.sql
-- Gestión de Super Admin Real, Modo de Plataforma (Producción / Prueba),
-- Usuario Universal de Demostración (admin@estudionova.uy) y Auditoría
-- ==============================================================================

-- 1. TABLA DE CONFIGURACIÓN DE PLATAFORMA (PRODUCCIÓN / PRUEBA)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    platform_mode TEXT NOT NULL DEFAULT 'test' CHECK (platform_mode IN ('production', 'test')),
    test_user_email TEXT NOT NULL DEFAULT 'admin@estudionova.uy',
    test_user_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Inserción inicial de configuración global por defecto
INSERT INTO public.platform_settings (id, platform_mode, test_user_email, test_user_enabled, updated_at)
VALUES ('global', 'test', 'admin@estudionova.uy', TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS en platform_settings
DROP POLICY IF EXISTS "allow_read_platform_settings" ON public.platform_settings;
CREATE POLICY "allow_read_platform_settings"
    ON public.platform_settings
    FOR SELECT
    TO public, authenticated, anon
    USING (TRUE);

DROP POLICY IF EXISTS "allow_super_admin_update_platform_settings" ON public.platform_settings;
CREATE POLICY "allow_super_admin_update_platform_settings"
    ON public.platform_settings
    FOR UPDATE
    TO authenticated
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

-- 2. SEED DE SUPER ADMIN REAL EN PROFILES
DO $$
BEGIN
    -- Si ya existe el perfil por email:
    UPDATE public.profiles
    SET is_super_admin = TRUE,
        role = 'super_admin',
        first_name = COALESCE(first_name, 'Juan Manuel'),
        last_name = COALESCE(last_name, 'Castillo'),
        updated_at = NOW()
    WHERE email = 'juanmacastillo2008@gmail.com';

    -- Si no existe, crear perfil con ID reservado para bootstrap
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'juanmacastillo2008@gmail.com') THEN
        INSERT INTO public.profiles (
            id,
            email,
            first_name,
            last_name,
            role,
            is_super_admin,
            created_at,
            updated_at
        ) VALUES (
            'f0000000-0000-0000-0000-000000000001',
            'juanmacastillo2008@gmail.com',
            'Juan Manuel',
            'Castillo',
            'super_admin',
            TRUE,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET is_super_admin = TRUE, role = 'super_admin';
    END IF;

    -- Membresía en HIPOTECALY Central (Tenant a0000000-0000-0000-0000-000000000001)
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        'a0000000-0000-0000-0000-000000000001',
        'f0000000-0000-0000-0000-000000000001',
        'super_admin',
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (organization_id, user_id) DO UPDATE
    SET role = 'super_admin', is_active = TRUE;
END $$;

-- 3. SEED DE USUARIO UNIVERSAL DE DEMOSTRACIÓN (admin@estudionova.uy)
DO $$
BEGIN
    -- Asegurar perfil con rol test_universal e is_super_admin = FALSE
    UPDATE public.profiles
    SET is_super_admin = FALSE,
        role = 'test_universal',
        first_name = 'Usuario',
        last_name = 'Pruebas Estudio Nova',
        updated_at = NOW()
    WHERE email = 'admin@estudionova.uy';

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'admin@estudionova.uy') THEN
        INSERT INTO public.profiles (
            id,
            email,
            first_name,
            last_name,
            role,
            is_super_admin,
            created_at,
            updated_at
        ) VALUES (
            'd1111111-1111-1111-1111-111111111111',
            'admin@estudionova.uy',
            'Usuario',
            'Pruebas Estudio Nova',
            'test_universal',
            FALSE,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET is_super_admin = FALSE, role = 'test_universal';
    END IF;

    -- Membresía en Estudio Nova (Tenant d0000000-0000-0000-0000-000000000001)
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        'd0000000-0000-0000-0000-000000000001',
        'd1111111-1111-1111-1111-111111111111',
        'tenant_owner',
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (organization_id, user_id) DO UPDATE
    SET role = 'tenant_owner', is_active = TRUE;
END $$;

-- 4. FUNCIONES DE GESTIÓN SEGURA
CREATE OR REPLACE FUNCTION public.get_platform_mode()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(platform_mode, 'test')
    FROM public.platform_settings
    WHERE id = 'global'
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_platform_mode() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_mode() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.set_platform_mode(new_mode TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_super BOOLEAN;
BEGIN
    IF new_mode NOT IN ('production', 'test') THEN
        RAISE EXCEPTION 'Modo no válido. Debe ser production o test.';
    END IF;

    -- Comprobar autorización de Super Admin
    SELECT is_super_admin INTO is_super
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT COALESCE(is_super, FALSE) THEN
        RAISE EXCEPTION 'Acceso denegado: Se requiere rol super_admin para cambiar el modo de plataforma.';
    END IF;

    UPDATE public.platform_settings
    SET platform_mode = new_mode,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE id = 'global';

    -- Registro en Auditoría
    INSERT INTO public.audit_logs (
        organization_id,
        user_id,
        user_name,
        user_role,
        action,
        module,
        record_identifier,
        new_value,
        created_at
    ) VALUES (
        'a0000000-0000-0000-0000-000000000001',
        auth.uid(),
        'Super Admin',
        'super_admin',
        'PLATFORM_MODE_CHANGED',
        'Configuración Global',
        'platform_mode',
        new_mode,
        NOW()
    );

    RETURN jsonb_build_object('success', TRUE, 'platform_mode', new_mode);
END;
$$;

REVOKE ALL ON FUNCTION public.set_platform_mode(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_platform_mode(TEXT) TO authenticated;
