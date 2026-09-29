# HIPOTECALY — OPENAI USAGE & COST REPORT
**Fecha:** Septiembre 2026  
**Entorno de Producción:** [https://hipotecaly.vercel.app/](https://hipotecaly.vercel.app/)  

---

## 1. ESQUEMA DE TARIFAS Y METERING

| Modelo | Input (USD / 1M) | Cached Input (USD / 1M) | Output (USD / 1M) | Rol en Hipotecaly |
| :--- | :--- | :--- | :--- | :--- |
| **`gpt-4o-mini`** | $0.1500 | $0.0750 | $0.6000 | Ingesta y OCR ligero de legajos |
| **`gpt-4o`** | $2.5000 | $1.2500 | $10.0000 | Lectura multimodal profunda y asistencia |
| **`o3-mini`** | $1.1000 | $0.5500 | $4.4000 | Razonamiento avanzado en discrepancias |
| **`text-embedding-3-small`** | $0.0200 | $0.0200 | $0.0000 | Vectores semánticos para RAG |

---

## 2. UNIDAD COMERCIAL: "CASO AI" Y BILLETERAS

- **Costo de Referencia:** USD 0.50 = 1.0 CASO AI.
- **Ingesta Incremental:** Reutilización de documentos mediante hash SHA-256 en memoria y DB, logrando ahorros de entre 60% y 80% en tokens de entrada.
- **Esquema Promocional de Onboarding (10 / 5 / 3):**
  - Mes 1: 10 CASOS promocionales cubiertos al 100% por Hipotecaly.
  - Mes 2: 5 CASOS promocionales.
  - Mes 3: 3 CASOS promocionales.
- **Consumo Atómico:** Descuento prioritario de créditos promocionales antes de los créditos adquiridos.
