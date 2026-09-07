-- ==============================================================================
-- HIPOTECALY: Migración 20260907000017_advanced_electronic_signature.sql
-- Infraestructura de Firma Electrónica Avanzada (FEA - Ley 18.600 Uruguay / Firma.gub.uy)
-- ==============================================================================

-- 1. Modificar tabla generated_documents con campos de congelamiento y auditoría FEA
ALTER TABLE public.generated_documents 
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sha256_before_signature TEXT,
  ADD COLUMN IF NOT EXISTS sha256_after_signature TEXT,
  ADD COLUMN IF NOT EXISTS signed_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS requires_notarial_electronic_support BOOLEAN DEFAULT false;

-- 2. Crear tabla signature_processes
CREATE TABLE IF NOT EXISTS public.signature_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  generated_document_id UUID REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  document_version INTEGER NOT NULL DEFAULT 1,
  document_title TEXT NOT NULL,
  signer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  signer_role TEXT NOT NULL DEFAULT 'notary',
  provider TEXT NOT NULL DEFAULT 'firma_gub',
  external_process_id TEXT,
  external_file_id TEXT,
  status TEXT NOT NULL DEFAULT 'initiated',
  original_sha256 TEXT NOT NULL,
  signed_sha256 TEXT,
  original_file_url TEXT,
  signed_file_url TEXT,
  is_notarial_electronic_document BOOLEAN DEFAULT false,
  requires_notarial_electronic_support BOOLEAN DEFAULT false,
  notarial_support_code TEXT,
  long_term_signature BOOLEAN DEFAULT true,
  signature_valid BOOLEAN DEFAULT NULL,
  certificate_valid BOOLEAN DEFAULT NULL,
  certificate_status TEXT,
  signer_identity TEXT,
  certificate_subject TEXT,
  certificate_issuer TEXT,
  certificate_serial TEXT,
  certificate_fingerprint TEXT,
  signing_time TIMESTAMPTZ,
  timestamp_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  redirected_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  callback_received_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT
);

-- 3. Crear tabla signature_process_signers para multi-firmantes
CREATE TABLE IF NOT EXISTS public.signature_process_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_process_id UUID NOT NULL REFERENCES public.signature_processes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  person_id TEXT,
  full_name TEXT NOT NULL,
  document_number TEXT,
  role TEXT NOT NULL,
  signing_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  certificate_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_sig_proc_app ON public.signature_processes(application_id);
CREATE INDEX IF NOT EXISTS idx_sig_proc_org ON public.signature_processes(organization_id);
CREATE INDEX IF NOT EXISTS idx_sig_proc_status ON public.signature_processes(status);
CREATE INDEX IF NOT EXISTS idx_sig_proc_signer ON public.signature_processes(signer_user_id);
CREATE INDEX IF NOT EXISTS idx_sig_signers_proc ON public.signature_process_signers(signature_process_id);

-- 4. Habilitar RLS
ALTER TABLE public.signature_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_process_signers ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para signature_processes
CREATE POLICY "Tenant members can view signature processes"
  ON public.signature_processes FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.application_notaries an
      WHERE an.application_id = signature_processes.application_id
        AND an.notary_user_id = auth.uid()
    )
    OR
    signer_user_id = auth.uid()
  );

CREATE POLICY "Tenant members and assigned notaries can insert signature processes"
  ON public.signature_processes FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.application_notaries an
      WHERE an.application_id = signature_processes.application_id
        AND an.notary_user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members and assigned notaries can update signature processes"
  ON public.signature_processes FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.application_notaries an
      WHERE an.application_id = signature_processes.application_id
        AND an.notary_user_id = auth.uid()
    )
  );

-- 6. Políticas RLS para signature_process_signers
CREATE POLICY "Users can view process signers in their scope"
  ON public.signature_process_signers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.signature_processes sp
      WHERE sp.id = signature_process_signers.signature_process_id
        AND (
          sp.organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.application_notaries an
            WHERE an.application_id = sp.application_id
              AND an.notary_user_id = auth.uid()
          )
          OR sp.signer_user_id = auth.uid()
          OR signature_process_signers.user_id = auth.uid()
        )
    )
  );
