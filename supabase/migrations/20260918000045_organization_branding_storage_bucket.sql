-- ==============================================================================
-- HIPOTECALY MIGRATION: 20260918000045_organization_branding_storage_bucket.sql
-- Bucket Supabase Storage 'organization-branding' y Políticas de Seguridad Multi-Tenant
-- ==============================================================================

-- 1. EXTENDER organization_branding CON storage_path DE LOGO Y FAVICON
ALTER TABLE public.organization_branding
  ADD COLUMN IF NOT EXISTS logo_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS favicon_storage_path TEXT;

-- 2. CREACIÓN DEL BUCKET: organization-branding
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'organization-branding',
      'organization-branding',
      TRUE,
      5242880, -- 5 MB
      ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
    )
    ON CONFLICT (id) DO UPDATE SET 
      public = TRUE,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
  END IF;
END $$;

-- 3. POLÍTICAS DE ACCESO RLS EN STORAGE PARA organization-branding
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    
    -- Lectura pública para logo y favicon en portales
    DROP POLICY IF EXISTS "Public read for organization branding" ON storage.objects;
    CREATE POLICY "Public read for organization branding"
      ON storage.objects
      FOR SELECT
      TO public, anon, authenticated
      USING (bucket_id = 'organization-branding');

    -- Gestión aislada por organización (subida, actualización y eliminación)
    DROP POLICY IF EXISTS "Org admins manage organization branding objects" ON storage.objects;
    CREATE POLICY "Org admins manage organization branding objects"
      ON storage.objects
      FOR ALL
      TO authenticated
      USING (
        bucket_id = 'organization-branding' AND
        (
          public.is_super_admin() OR
          EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid()
              AND organization_id = ((storage.foldername(name))[1])::uuid
              AND role IN ('tenant_admin', 'tenant_owner', 'admin')
              AND is_active = TRUE
          )
        )
      )
      WITH CHECK (
        bucket_id = 'organization-branding' AND
        (
          public.is_super_admin() OR
          EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid()
              AND organization_id = ((storage.foldername(name))[1])::uuid
              AND role IN ('tenant_admin', 'tenant_owner', 'admin')
              AND is_active = TRUE
          )
        )
      );
  END IF;
END $$;
