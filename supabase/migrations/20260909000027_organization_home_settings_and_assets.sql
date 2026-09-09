-- ==============================================================================
-- HIPOTECALY MIGRATION: 20260909000027_organization_home_settings_and_assets.sql
-- Personalización de Home White-Label por Organización y Bucket de Assets Públicos
-- ==============================================================================

-- 1. TABLA DE CONFIGURACIÓN DE HOME POR ORGANIZACIÓN
CREATE TABLE IF NOT EXISTS public.organization_home_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Contenido Hero
  hero_eyebrow VARCHAR(255) NOT NULL DEFAULT 'FINANCIACIÓN CON GARANTÍA HIPOTECARIA',
  hero_title TEXT NOT NULL DEFAULT 'Convertí el valor de tu inmueble en capital para avanzar.',
  hero_description TEXT NOT NULL DEFAULT 'Accedé a una evaluación clara y ordenada de tu operación. Viviendas, locales comerciales y campos como respaldo para una financiación adaptada a cada caso.',
  
  -- Botón CTA Principal
  hero_primary_cta_text VARCHAR(100) NOT NULL DEFAULT 'SIMULAR FINANCIACIÓN',
  hero_primary_cta_target VARCHAR(255) NOT NULL DEFAULT '#simulador',
  hero_primary_cta_visible BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Botón CTA Secundario
  hero_secondary_cta_text VARCHAR(100) NOT NULL DEFAULT 'CÓMO FUNCIONA',
  hero_secondary_cta_target VARCHAR(255) NOT NULL DEFAULT '#como-funciona',
  hero_secondary_cta_visible BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Línea Inferior (Trust Line)
  hero_trust_line VARCHAR(255) NOT NULL DEFAULT 'Evaluación inicial online · Proceso documentado · Seguimiento de la operación',
  
  -- Apariencia y Fondo del Hero
  hero_background_mode VARCHAR(30) NOT NULL DEFAULT 'image_overlay', -- 'color' | 'image' | 'image_overlay'
  hero_background_color VARCHAR(30) NOT NULL DEFAULT '#102d49',
  hero_background_image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
  hero_overlay_color VARCHAR(30) NOT NULL DEFAULT '#102d49',
  hero_overlay_opacity NUMERIC(5,2) NOT NULL DEFAULT 65.00, -- Rango 0-100
  hero_image_position VARCHAR(20) NOT NULL DEFAULT 'center', -- 'left' | 'center' | 'right'
  hero_pattern_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Switches de Visibilidad de Secciones en la Home
  show_metrics BOOLEAN NOT NULL DEFAULT TRUE,
  show_property_types BOOLEAN NOT NULL DEFAULT TRUE,
  show_simulator BOOLEAN NOT NULL DEFAULT TRUE,
  show_how_it_works BOOLEAN NOT NULL DEFAULT TRUE,
  show_operation_section BOOLEAN NOT NULL DEFAULT TRUE,
  show_investor_section BOOLEAN NOT NULL DEFAULT TRUE,
  show_faq BOOLEAN NOT NULL DEFAULT TRUE,
  show_contact BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.organization_home_settings ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS RLS PARA organization_home_settings
DROP POLICY IF EXISTS "Public read for organization home settings" ON public.organization_home_settings;
CREATE POLICY "Public read for organization home settings"
  ON public.organization_home_settings
  FOR SELECT
  TO public, anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Org admins and super admin manage organization home settings" ON public.organization_home_settings;
CREATE POLICY "Org admins and super admin manage organization home settings"
  ON public.organization_home_settings
  FOR ALL
  TO authenticated
  USING (public.is_member_of_org(organization_id) OR public.is_super_admin())
  WITH CHECK (public.is_member_of_org(organization_id) OR public.is_super_admin());

-- 3. STORAGE BUCKET PÚBLICO: organization-assets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('organization-assets', 'organization-assets', TRUE)
    ON CONFLICT (id) DO UPDATE SET public = TRUE;
  END IF;
END $$;

-- Políticas de Storage para organization-assets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- Lectura pública para cualquier visitante de la landing
    DROP POLICY IF EXISTS "Public read for organization assets" ON storage.objects;
    CREATE POLICY "Public read for organization assets"
      ON storage.objects
      FOR SELECT
      TO public, anon, authenticated
      USING (bucket_id = 'organization-assets');

    -- Escritura/modificación/eliminación aislada por organización
    DROP POLICY IF EXISTS "Org admins manage organization assets" ON storage.objects;
    CREATE POLICY "Org admins manage organization assets"
      ON storage.objects
      FOR ALL
      TO authenticated
      USING (
        bucket_id = 'organization-assets' AND
        (
          public.is_super_admin() OR
          public.is_member_of_org(((storage.foldername(name))[1])::uuid)
        )
      )
      WITH CHECK (
        bucket_id = 'organization-assets' AND
        (
          public.is_super_admin() OR
          public.is_member_of_org(((storage.foldername(name))[1])::uuid)
        )
      );
  END IF;
END $$;

-- 4. SEED / INSERCIÓN INICIAL PARA ESTUDIO NOVA DEMO
INSERT INTO public.organization_home_settings (
  organization_id,
  hero_eyebrow,
  hero_title,
  hero_description,
  hero_primary_cta_text,
  hero_primary_cta_target,
  hero_primary_cta_visible,
  hero_secondary_cta_text,
  hero_secondary_cta_target,
  hero_secondary_cta_visible,
  hero_trust_line,
  hero_background_mode,
  hero_background_color,
  hero_background_image_url,
  hero_overlay_color,
  hero_overlay_opacity,
  hero_image_position,
  hero_pattern_enabled,
  show_metrics,
  show_property_types,
  show_simulator,
  show_how_it_works,
  show_operation_section,
  show_investor_section,
  show_faq,
  show_contact,
  created_at,
  updated_at
) VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'FINANCIACIÓN CON GARANTÍA HIPOTECARIA',
  'Convertí el valor de tu inmueble en capital para avanzar.',
  'Accedé a una evaluación clara y ordenada de tu operación. Viviendas, locales comerciales y campos con respaldo para una financiación adaptada a cada caso.',
  'SIMULAR FINANCIACIÓN',
  '#simulador',
  TRUE,
  'CÓMO FUNCIONA',
  '#como-funciona',
  TRUE,
  'Evaluación inicial online · Proceso documentado · Seguimiento de la operación',
  'image_overlay',
  '#102d49',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
  '#102d49',
  65.00,
  'center',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (organization_id) DO UPDATE
SET
  hero_eyebrow = EXCLUDED.hero_eyebrow,
  hero_title = EXCLUDED.hero_title,
  hero_description = EXCLUDED.hero_description,
  hero_primary_cta_text = EXCLUDED.hero_primary_cta_text,
  hero_primary_cta_target = EXCLUDED.hero_primary_cta_target,
  hero_secondary_cta_text = EXCLUDED.hero_secondary_cta_text,
  hero_secondary_cta_target = EXCLUDED.hero_secondary_cta_target,
  hero_trust_line = EXCLUDED.hero_trust_line,
  hero_background_mode = EXCLUDED.hero_background_mode,
  hero_background_color = EXCLUDED.hero_background_color,
  hero_background_image_url = EXCLUDED.hero_background_image_url,
  hero_overlay_color = EXCLUDED.hero_overlay_color,
  hero_overlay_opacity = EXCLUDED.hero_overlay_opacity,
  hero_image_position = EXCLUDED.hero_image_position,
  hero_pattern_enabled = EXCLUDED.hero_pattern_enabled,
  updated_at = NOW();
