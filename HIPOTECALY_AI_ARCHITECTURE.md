# HIPOTECALY — ARQUITECTURA DE INTELIGENCIA ARTIFICIAL & COPILOTS (2026)

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Fase:** Macrofase 6 (AI + Automation + CRM + Operational Intelligence)  
**Estado:** Producción / Certificado  

---

## 1. INTRODUCCIÓN Y ENFOQUE HYBRID DETERMINISTIC-AI

La infraestructura de Inteligencia Artificial de **HIPOTECALY** no actúa como una "caja negra" que toma resoluciones crediticias autónomas. Su diseño sigue un principio de **IA Asistiva con Humano en el Bucle (Human-in-the-Loop)** y motor híbrido determinístico-estadístico:

1. **Reglas Duras Determinísticas:** Límites de LTV (ej. 40%), importes mínimos/máximos, tipologías de inmueble permitidas y jurisdicciones registrales son validadas por código TypeScript determinístico sin margen de alucinación.
2. **IA Asistiva de Ingesta y Extracción:** Extracción OCR estructurada de escrituras notariales, cédulas catastrales, recibos de sueldo y liquidaciones impositivas.
3. **Semáforo Multidimensional:** 10 categorías de evaluación analizadas objetivamente con fuentes de evidencia, grado de certeza y requerimiento mandatorio de revisión humana en caso de alertas amarillas o rojas.
4. **Cero Retención de Secretos:** Las API Keys del proveedor residen encriptadas exclusivamente en Supabase Vault o variables server-side; el frontend jamás manipula credenciales de IA.

---

## 2. COMPONENTES DEL SUBSISTEMA DE IA

```mermaid
graph TD
    UI[Frontend / Portal Backoffice] --> Gateway[/api/ai/analyze Serverless Function]
    Gateway --> Orchestrator[HipotecalyAiOrchestrator]
    
    subgraph Agents [Ecosistema de Agentes Especializados]
        Orchestrator --> DocAgent[DocumentIntelligenceAgent]
        Orchestrator --> CompAgent[ComparablesAgent]
        Orchestrator --> ValAgent[PropertyValuationAgent]
        Orchestrator --> UndAgent[UnderwritingAgent]
        Orchestrator --> RiskAgent[RiskAgent / Semáforo 10D]
        Orchestrator --> ConsAgent[ConsistencyAgent]
    end

    subgraph Governance [Gobernanza, Costos y Seguridad]
        Orchestrator --> SecretResolver[OpenAiSecretResolver / Vault]
        Orchestrator --> TokenEngine[Token & Cost Calculator]
        Orchestrator --> WalletService[AiWalletService / Ledger 10-5-3]
        Orchestrator --> AuditLog[ai_admin_audit_logs]
    end
```

### 2.1 Agentes de IA
- **`DocumentIntelligenceAgent` ([`server/ai/agents/documentIntelligenceAgent.ts`](server/ai/agents/documentIntelligenceAgent.ts)):**
  Ingesta incremental mediante hash SHA-256 de contenido para evitar reprocesamiento redundante de documentos. Extrae padrón, departamento, propietario, áreas y gravámenes bajo un esquema Zod estricto.
- **`ConsistencyAgent` ([`server/ai/agents/consistencyAgent.ts`](server/ai/agents/consistencyAgent.ts)):**
  Auditoría cruzada entre la solicitud declarada y las extracciones documentales: detecta discrepancias de padrón catastral, titularidad dominial o diferencias de superficie.
- **`PropertyValuationAgent` ([`server/ai/agents/propertyValuationAgent.ts`](server/ai/agents/propertyValuationAgent.ts)):**
  Diferenciación matemática rigurosa entre **Valor de Mercado Estimado**, **Valor Conservador de Garantía (85%)** y **Valor de Liquidación Rápida (70%)**, basado en bases zonales y comparables de mercado.
- **`UnderwritingAgent` ([`server/ai/agents/underwritingAgent.ts`](server/ai/agents/underwritingAgent.ts)):**
  Cálculo determinístico de ratios LTV de mercado y LTV conservador, evaluados contra las políticas crediticias configuradas en el tenant.
- **`RiskAgent` ([`server/ai/agents/riskAgent.ts`](server/ai/agents/riskAgent.ts)):**
  Construcción del semáforo multidimensional en 10 categorías: Tasación, LTV, Titulación, Gravámenes, Situación Registral, Capacidad de Pago, Morosidad, Cobertura, Geografía y Exposición Global.

---

## 3. CONTROL DE CONSUMO Y ESQUEMA DE BILLETERA AI

Para proteger los costos operativos y permitir modelos de negocio SaaS transparentes, el sistema implementa:

1. **Unidad "CASO AI":** Cada análisis completo equivale a una unidad comercial estandarizada consumida de la billetera de la organización.
2. **Caché Semántica y de Documentos:** Los documentos analizados previamente que no hayan sufrido alteraciones son reutilizados directamente de la caché, ahorrando entre un 60% y 80% de tokens de entrada.
3. **Ledger Atómico:** Descuento transaccional en `ai_wallets` con registro de `run_id`, tokens consumidos y desglose en dólares estadounidenses.
4. **Master Switch Global:** El Super Admin puede activar o suspender el motor de IA en caliente desde `/admin/ai` sin reiniciar la aplicación ni afectar los flujos estándar del marketplace.
