# SEGURIDAD Y GOBERNANZA DE HIPOTECALY AI CORE

## 1. No-Exposición Directa a PostgreSQL
HIPOTECALY AI opera como servicio backend consultivo intermediado por validación de permisos y desinfección previa.

## 2. Sanitización PII en Memoria RAG (GlobalMemorySanitizer)
- Cédulas y RUTs anonimizados.
- Supresión de cuentas bancarias, correos y números telefónicos.
- Generalización de direcciones exactas.

## 3. Custodia de Claves en Supabase Vault
Claves cifradas con AEAD en Supabase Vault sin acceso frontend.

## 4. No-Rechazo Automático
Toda decisión de crédito mantiene supervisión y aprobación humana.
