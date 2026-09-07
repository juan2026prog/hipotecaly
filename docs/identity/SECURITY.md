# Seguridad, Privacidad, RLS y Criptografía

Este documento describe los controles de seguridad implementados en el módulo universal de Identidad, KYC y Firma Digital de SiteOS.

---

## 1. Política de Cero Fugas de Secretos (Zero Secret Leaks)

1. **Variables Server-Only**:
   - `DIDIT_API_KEY`
   - `DIDIT_WEBHOOK_SECRET`
   - `FIRMA_GUB_BASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   Estas variables residen exclusivamente en las variables de entorno del servidor y nunca se exponen al frontend (`NEXT_PUBLIC_` / `VITE_`).
2. **Timing-Safe Comparison**:
   La validación de firmas de webhooks utiliza `crypto.timingSafeEqual` para prevenir ataques de canal lateral (timing attacks).
3. **Control de Fugas en Tests**:
   Los tests automatizados de Playwright analizan el HTML y los bundles emitidos al cliente para verificar que ningún secreto ni token de servicio aparezca en el cliente.

---

## 2. Row Level Security (RLS) en Supabase

Cada tabla creada en la migración `20260904000014_identity_kyc_digital_signature_core.sql` tiene RLS habilitado y políticas estrictas:

```sql
-- Ejemplo: isolation por tenant y rol
CREATE POLICY "tenant_staff_view_identity"
  ON identity_verifications
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships
      WHERE user_id = auth.uid()
        AND role IN ('tenant_admin', 'analyst', 'notary')
    )
    OR EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );
```

---

## 3. Logs Inmutables de Auditoría

Tanto `identity_verification_events` como `signature_events` son tablas de sólo adición (append-only) que registran:
- Timestamp UTC exacto (`created_at`).
- Actor responsable (`actor_id`, `actor_type`: 'user' | 'system' | 'provider_webhook').
- Estado anterior y estado nuevo.
- Dirección IP y User Agent si aplican.
- Metadata cruda del evento.

---

## 4. Hash Dual SHA-256 e Integridad de Documentos

Para cada documento firmado:
1. `original_sha256`: Hash criptográfico SHA-256 del archivo original generado por DocFlow.
2. `signed_sha256`: Hash criptográfico SHA-256 del archivo sellado y firmado retornado por AGESIC o el firmante.
3. Se verifica que `signed_sha256 !== original_sha256` y que el certificado esté incrustado.
