# HIPOTECALY — OPENAI SECURITY REPORT
**Fecha:** Septiembre 2026  
**Entorno de Producción:** [https://hipotecaly.vercel.app/](https://hipotecaly.vercel.app/)  

---

## 1. RESUMEN DE SEGURIDAD

1. **Almacenamiento de Secretos:** `OPENAI_API_KEY` se encuentra protegida con cifrado AEAD en **Supabase Vault** (`get_openai_vault_secret_internal`) y respaldada en variables server-side en Vercel.
2. **Cero Exposición Client-Side:** Se auditó el bundle generado (`dist/assets/*.js`). Ninguna clave ni valor en texto plano `sk-proj-...` está expuesto al cliente.
3. **Control de Acceso (RBAC):** Endpoints administrativos de IA requieren rol estricto `super_admin` verificado server-side en Supabase Auth (`verifySuperAdmin` / `requireAiAuthorization`).
4. **Protección Anti-Inyección (Prompt Injection):** Inclusión de delimitadores de seguridad `<DOCUMENT_UNTRUSTED_CONTENT>` en los prompts para evitar ataques de manipulación de instrucciones embebidas en PDFs/imágenes de solicitantes.
5. **Privacidad y RAG (Sanitización PII):** El módulo `GlobalMemorySanitizer` remueve números de Cédula de Identidad, RUT, correos, teléfonos y números de cuenta antes de persistir o indexar memoria en `pgvector`.
6. **Aislamiento Multi-Tenant:** Políticas Row Level Security (RLS) estrictas aplicadas a `ai_wallets`, `ai_case_runs`, `ai_conversations` y `ai_messages` garantizando aislamiento total entre organizaciones.
