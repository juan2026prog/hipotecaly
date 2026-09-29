# HIPOTECALY — OPENAI TEST REPORT
**Fecha:** Septiembre 2026  
**Entorno de Producción:** [https://hipotecaly.vercel.app/](https://hipotecaly.vercel.app/)  

---

## 1. RESULTADOS DE LA SUITE DE TESTING

### 1.1 Tests Automatizados Ejecutados
Se ejecutaron **20 pruebas de certificación de IA** mediante Playwright (`tests/ai-certification-production.spec.ts`):

- **A1. Perfiles de Modelos:** Verificación de roles (`gpt-4o-mini`, `gpt-4o`, `o3-mini`, `text-embedding-3-small`), costos y políticas de fallback. (OK)
- **B1. Ingesta y Extracción Documental:** Cálculo de hash SHA-256 de 64 caracteres, clasificación de legajos y validación Zod. (OK)
- **C1. Caché Documental:** Ahorro comprobado de tokens en segundo análisis con idéntico SHA-256. (OK)
- **D1. Cruces Documentales (Cross-Checks):** Detección de discrepancias en Padrón (12345 vs 12354) con severidad crítica. (OK)
- **E1. Reglas Financieras vs IA:** Haircut del 15% determinístico sobre valor de mercado y LTV máximo 40%. (OK)
- **F1. Semáforo de Riesgo (10D):** Evaluación objetiva en 10 categorías normativas. (OK)
- **G1. Context Builder & Anti-Injection:** Delimitadores `<DOCUMENT_UNTRUSTED_CONTENT>` y resistencia a manipulación de instrucciones. (OK)
- **H1. Memoria Global RAG:** Recuperación semántica anonimizada sin filtración de PII. (OK)
- **I1. Billetera y Consumo:** Deducción atómica transaccional respetando créditos promocionales. (OK)
- **J1. Resiliencia y Contingencia:** Operación fluida sin caídas ante contingencias de red o proveedor. (OK)

### 1.2 Resumen de Ejecución
- **Total de pruebas:** 20 passed.
- **TypeScript Typecheck (`npx tsc --noEmit`):** 0 errores.
- **Build de Producción (`npm run build`):** Exitoso.
