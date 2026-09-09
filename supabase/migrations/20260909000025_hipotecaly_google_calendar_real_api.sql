-- ==============================================================================
-- HIPOTECALY: Google Calendar API Real - Credenciales Server-Side y Estado
-- Migración 00025: Extensión de `user_calendar_integrations` con soporte para
-- tokens cifrados, scopes incrementales y estado de conexión
-- ==============================================================================

-- 1. Añadir columnas a `user_calendar_integrations` si no existen
ALTER TABLE public.user_calendar_integrations
    ADD COLUMN IF NOT EXISTS google_account_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS google_account_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
    ADD COLUMN IF NOT EXISTS encrypted_refresh_token TEXT,
    ADD COLUMN IF NOT EXISTS access_token_vault_id TEXT,
    ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS scopes JSONB DEFAULT '["https://www.googleapis.com/auth/calendar.events"]'::jsonb,
    ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- 2. Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_user_cal_status ON public.user_calendar_integrations(connection_status);
CREATE INDEX IF NOT EXISTS idx_user_cal_email ON public.user_calendar_integrations(google_account_email);

-- 3. Actualizar políticas RLS: los tokens y campos de sincronización solo son accesibles
-- por el usuario dueño de la cuenta o por el Super Admin
CREATE OR REPLACE POLICY "Users manage own calendar integrations" ON public.user_calendar_integrations
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin());
