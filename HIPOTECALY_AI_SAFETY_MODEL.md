# HIPOTECALY — MODELO DE SEGURIDAD, ÉTICA Y TRANSPARENCIA DE IA (2026)

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Fase:** Macrofase 6 (AI + Automation + CRM + Operational Intelligence)  
**Referencia Legal y Técnica:** [`src/lib/ai/aiClientService.ts`](src/lib/ai/aiClientService.ts), [`server/ai/sanitizer.ts`](server/ai/sanitizer.ts)  

---

## 1. DECLARACIÓN FORMAL DE TRANSPARENCIA & DISCLAIMER

Toda interfaz, reporte o informe analítico que incorpore asistencia de modelos generativos o heurísticos de Inteligencia Artificial exhibe de forma destacada el descargo de responsabilidad legal:

> **"Asistente de Inteligencia Artificial para análisis preliminar y triaje de expedientes. Las conclusiones generadas son de carácter orientativo y no constituyen dictamen notarial, peritaje vinculante ni aprobación definitiva de crédito. La resolución final corresponde exclusivamente a los comités de crédito humanos y prestamistas verificados."**

---

## 2. PILARES DE SEGURIDAD Y BLINDAJE

### 2.1 Principio de Humano en el Bucle (Human-in-the-Loop)
- La IA **nunca** rechaza ni aprueba automáticamente una operación hipotecaria.
- Si se detecta un semáforo rojo (ej. LTV > 40% o discrepancia en titularidad registral), el sistema marca el expediente como `requires_human_review: true` y genera una recomendación explicativa sin bloquear de forma irreversible al solicitante.

### 2.2 Sanitización de Datos y Privacidad (PII Sanitization)
- El sanitizador [`sanitizer.ts`](server/ai/sanitizer.ts) filtra y anonimiza números de teléfono directos, correos electrónicos personales y datos confidenciales antes de invocar APIs externas de procesamiento de lenguaje natural.
- Los padrones catastrales y datos registrales sensibles se mantienen dentro del perímetro de persistencia segura de Supabase.

### 2.3 Blindaje contra Alucinaciones Mediante Esquemas Rígidos
- Todas las salidas de los agentes de IA se validan mediante esquemas **Zod** tipados (`types.ts`). Si un modelo produce un payload que no cumple la estructura esperada, la respuesta es descartada y se activa el fallback determinístico seguro.

### 2.4 Neutralidad y Prevención de Sesgos
- Las reglas de tasación y underwriting evalúan estrictamente el **colateral inmobiliario (LTV)** y la **consistencia documental objetiva**. No se incorporan variables discriminatorias ni perfiles subjetivos en la evaluación del riesgo.
