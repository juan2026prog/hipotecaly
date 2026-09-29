# HIPOTECALY — OPENAI AI CORE: CURRENT STATE AUDIT
**Fecha:** Septiembre 2026  
**Entorno de Producción:** [https://hipotecaly.vercel.app/](https://hipotecaly.vercel.app/)  
**Dominio:** AI Core, Document Intelligence, Expedient Intelligence, Asistente Contextual, Supabase Vault, Cost Engine & Metering  

---

## 1. RESUMEN EJECUTIVO DE LA AUDITORÍA

Se ha ejecutado una inspección profunda y exhaustiva de todo el repositorio `HIPOTECALY`, abarcando servicios backend (`server/ai/`), Serverless Functions Vercel (`api/`), páginas frontend de administración Super Admin (`src/pages/admin/`), componentes de visualización de expedientes (`src/components/ai/`), esquemas de base de datos Supabase (`supabase/migrations/`) y suites de prueba Playwright (`tests/`).

> [!IMPORTANT]
> **REGLA MANDATORIA DE ALCANCE:** El **Tasador IA** cuenta con arquitectura propia de modelos hedónicos, ingestión de portales inmobiliarios y calibración zonal independiente y **NO** forma parte de esta implementación ni ha sido modificado. Se mantiene estricta separación entre el motor determinístico financiero y el motor interpretativo de OpenAI.

---

## 2. MATRIZ DE COMPONENTES AI CORE

| Componente | Archivo / Ubicación | Estado | Diagnóstico y Acción Realizada |
| :--- | :--- | :--- | :--- |
| **OpenAI Secret Resolver (Server-Side Vault)** | [`server/ai/openAiSecretResolver.ts`](file:///c:/Projects/Hipotecaly/server/ai/openAiSecretResolver.ts) | **EXISTE (CERTIFICADO)** | Resuelve clave encriptada vía RPC de Supabase Vault (`get_openai_vault_secret_internal`) con fallback local controlado. Cero exposición en frontend. |
| **AI Gateway & Orchestrator** | [`server/ai/orchestrator.ts`](file:///c:/Projects/Hipotecaly/server/ai/orchestrator.ts) | **EXISTE (CERTIFICADO)** | Coordina análisis documental, tasación conservadora, cruces de inconsistencias y underwriting determinístico. |
| **Model Router & Pricing Registry** | [`server/ai/config.ts`](file:///c:/Projects/Hipotecaly/server/ai/config.ts) | **EXISTE (CERTIFICADO)** | Mapeo canónico a modelos oficiales OpenAI (`gpt-4o-mini`, `gpt-4o`, `o3-mini`, `text-embedding-3-small`) con tarifas por millón de tokens y unidad "CASO AI". |
| **Document Intelligence Agent** | [`server/ai/agents/documentIntelligenceAgent.ts`](file:///c:/Projects/Hipotecaly/server/ai/agents/documentIntelligenceAgent.ts) | **EXISTE (CERTIFICADO)** | Ingesta incremental con cálculo de hash SHA-256 (64 caracteres) y caché en memoria para ahorro de tokens. Validación Zod estricta. |
| **Consistency Agent (Cross-Checks)** | [`server/ai/agents/consistencyAgent.ts`](file:///c:/Projects/Hipotecaly/server/ai/agents/consistencyAgent.ts) | **EXISTE (CERTIFICADO)** | Detecta discrepancias entre datos de solicitud y documentos notariales (Padrón, Titularidad, Superficie). |
| **Risk Agent (Semáforo 10D)** | [`server/ai/agents/riskAgent.ts`](file:///c:/Projects/Hipotecaly/server/ai/agents/riskAgent.ts) | **EXISTE (CERTIFICADO)** | Evalúa 10 dimensiones normativas objetivas: tasación, LTV, titularidad, documentación, ingresos, deudas, consistencia, propiedad, riesgo y elegibilidad. |
| **Underwriting Agent (Híbrido)** | [`server/ai/agents/underwritingAgent.ts`](file:///c:/Projects/Hipotecaly/server/ai/agents/underwritingAgent.ts) | **EXISTE (CERTIFICADO)** | Reglas crediticias determinísticas basadas en código TypeScript estricto (Haircut 15%, LTV máx 40%). Cero alucinación. |
| **Context Builder (Anti-Injection)** | [`server/ai/contextBuilder.ts`](file:///c:/Projects/Hipotecaly/server/ai/contextBuilder.ts) | **EXISTE (CERTIFICADO)** | Delimitadores de seguridad `<DOCUMENT_UNTRUSTED_CONTENT>` y grounding factual estricto. |
| **Memoria Global RAG & pgvector** | [`server/ai/agents/memoryRetrievalAgent.ts`](file:///c:/Projects/Hipotecaly/server/ai/agents/memoryRetrievalAgent.ts) | **EXISTE (CERTIFICADO)** | Búsqueda vectorial anonimizada mediante `text-embedding-3-small` y `match_global_memory`. |
| **Sanitizador de Privacidad PII** | [`server/ai/sanitizer.ts`](file:///c:/Projects/Hipotecaly/server/ai/sanitizer.ts) | **EXISTE (CERTIFICADO)** | Remueve cédulas, teléfonos, emails, cuentas y nombres antes de indexar conocimiento global. |
| **Multi-Tenant Metering & Wallet** | [`server/ai/walletService.ts`](file:///c:/Projects/Hipotecaly/server/ai/walletService.ts) | **EXISTE (CERTIFICADO)** | Gestión de saldos, esquema 10/5/3 promocional y descuento atómico transaccional de CASOS AI. |
| **Serverless Integration Gateway** | [`api/integrations.ts`](file:///c:/Projects/Hipotecaly/api/integrations.ts) | **EXISTE (CERTIFICADO)** | Endpoints `/api/integrations/ai/status` y verificación de salud sin exponer variables privadas. |
| **SuperAdmin AI Control Center** | [`src/pages/admin/AdminAiPage.tsx`](file:///c:/Projects/Hipotecaly/src/pages/admin/AdminAiPage.tsx) | **EXISTE (CERTIFICADO)** | Panel con Master Switch, estado de modelos, prueba técnica directa (Health Check), auditoría y gestión Vault. |
| **Pestaña AI en Expediente** | [`src/components/ai/HipotecalyAiTab.tsx`](file:///c:/Projects/Hipotecaly/src/components/ai/HipotecalyAiTab.tsx) | **EXISTE (CERTIFICADO)** | Visualización de 10 secciones, estimación previa de consumo, alertas y retroalimentación humana. |

---

## 3. CONCLUSIÓN DE AUDITORÍA
La arquitectura existente en HIPOTECALY es sólida, modular y cumple estrictamente con el principio de mínima exposición de secretos y separación de responsabilidades financieras determinísticas vs analíticas de IA.
