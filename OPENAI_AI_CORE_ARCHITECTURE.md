# HIPOTECALY — OPENAI AI CORE: ARQUITECTURA TÉCNICA END-TO-END

**Versión:** 2.0  
**Fecha:** Septiembre 2026  
**Entorno de Producción:** [https://hipotecaly.vercel.app/](https://hipotecaly.vercel.app/)  

---

## 1. FLUJO ARQUITECTÓNICO CENTRAL

```mermaid
graph TD
    Client[Frontend: Hipotecaly / SuperAdmin] --> VercelAPI[/api/integrations/ai/status]
    Client --> ServerlessAI[Serverless AI Gateway]
    
    subgraph Gateway [Hipotecaly AI Gateway]
        ServerlessAI --> AuthGuard[requireAiAuthorization / MFA Guard]
        AuthGuard --> PolicyCheck[Master Switch / Feature Flags]
        PolicyCheck --> SecretResolver[OpenAiSecretResolver / Supabase Vault]
        SecretResolver --> ModelRouter[Model Router / Config]
    end

    subgraph Orchestrator [Hipotecaly AI Core Orchestrator]
        ModelRouter --> DocAgent[Document Intelligence Agent]
        ModelRouter --> ConsistAgent[Consistency Agent]
        ModelRouter --> ValAgent[Property Valuation Agent]
        ModelRouter --> UndAgent[Underwriting Agent]
        ModelRouter --> RiskAgent[Risk Agent / Semáforo 10D]
        ModelRouter --> MemAgent[Memory Retrieval Agent / pgvector]
    end

    subgraph Execution [OpenAI API Execution & Metering]
        DocAgent --> OpenAI[OpenAI API / gpt-4o-mini]
        ValAgent --> OpenAI2[OpenAI API / gpt-4o]
        MemAgent --> Embeddings[text-embedding-3-small]
        OpenAI --> StructuredVal[Structured Zod Validation]
        OpenAI2 --> StructuredVal
        StructuredVal --> CostMeter[Cost Engine & AI Metering]
        CostMeter --> WalletLedger[ai_wallets / ai_wallet_transactions]
        WalletLedger --> AuditLog[ai_case_runs / ai_execution_logs]
    end
```

---

## 2. COMPONENTES Y RESPONSABILIDADES

### 2.1 Principio de Separación Determinístico vs IA
- **Reglas Determinísticas (TypeScript):** LTV, límites de crédito, plazos, validaciones aritméticas, comprobación de gravámenes duros.
- **OpenAI AI Core:** Ingesta de texto escaneado, extracción estructurada JSON con Zod, detección de inconsistencias semánticas, síntesis ejecutiva contextual para el oficial de crédito.

### 2.2 Model Router & Pricing
- `FAST_EXTRACTION`: `gpt-4o-mini` (USD 0.15/1M in, USD 0.60/1M out)
- `DOCUMENT_ANALYSIS`: `gpt-4o` (USD 2.50/1M in, USD 10.00/1M out)
- `ASSISTANT`: `gpt-4o` / Fallback: `gpt-4o-mini`
- `DEEP_REASONING`: `o3-mini` (USD 1.10/1M in, USD 4.40/1M out)
- `EMBEDDINGS`: `text-embedding-3-small` (USD 0.02/1M in)

### 2.3 Seguridad y Supabase Vault
La clave `OPENAI_API_KEY` reside exclusivamente en **Supabase Vault** (secreto `hipotecaly_openai_api_key`) o en variable server-side. El frontend jamás manipula o recibe la clave en texto plano.
