# SEGURIDAD KYC E IDENTIDAD — DIDIT INTEGRATION

## 1. Verificación HMAC-SHA256
Webhooks entrantes validados mediante timingSafeEqual y claves server-side (DIDIT_WEBHOOK_SECRET).

## 2. Idempotencia y Replay Protection
Cálculo de hash de payload y prevención de reprocesamiento redundante en identity_verification_events.

## 3. Consentimiento Explícito
Registro en identity_consents con IP y timestamp para cumplimiento de la Ley 18.331.
