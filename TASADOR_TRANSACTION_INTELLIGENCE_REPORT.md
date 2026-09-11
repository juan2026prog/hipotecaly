# INFORME DE ARQUITECTURA E INTEGRACIÓN: TRANSACTION INTELLIGENCE (CLOSED SALES DATA)

**Proyecto:** HIPOTECALY — Plataforma de Crédito Hipotecario y Valuaciones Inmobiliarias  
**Módulo:** Base Inmobiliaria & Transaction Intelligence  
**Estado:** `TRANSACTION_INTELLIGENCE_PRODUCTION_READY` (`PRODUCTION_READY_NO_VERIFIED_CLOSING_DATA_YET`)  
**Fecha:** 11 de Septiembre de 2026  

---

## 1. RESUMEN Y OBJETIVO DE LA CAPA

Se construyó la nueva capa de datos y observabilidad analítica **Transaction Intelligence** dentro del ecosistema del Tasador IA de HIPOTECALY.

### Finalidad:
Permitir el estudio riguroso y empírico de la brecha real entre:

$$\mathbf{PRECIO\ PUBLICADO\ (Initial\ Asking)} \longrightarrow \mathbf{CAMBIOS\ DE\ PRECIO} \longrightarrow \mathbf{\acute{U}LTIMO\ PRECIO\ PUBLICADO\ (Last\ Asking)} \longrightarrow \mathbf{PRECIO\ REAL\ DE\ CIERRE\ (Closing\ Price)}$$

### Principio de Rigor:
> **Despublicado $\mathbf{\ne}$ Vendido:** Una publicación que desaparece o se marca como inactiva en un portal inmobiliario **nunca** se presume vendida ni se infiere un precio de cierre sin respaldo documental explícito.

---

## 2. MODELO CONCEPTUAL Y ESTRUCTURA DE DATOS

Implementado en [`src/lib/tasador/transactions/transactionTypes.ts`](file:///c:/Projects/Hipotecaly/src/lib/tasador/transactions/transactionTypes.ts):

```typescript
export interface PropertyTransaction {
  id: string;
  propertyMasterId: string;
  listingId?: string | null;
  sourceId: string;
  sourceName?: string | null;
  transactionType: TransactionType; // SALE, RENT, PRE_CONSTRUCTION_SALE
  
  // Ubicación & Tipología
  department: string;
  neighborhood: string;
  propertyType: string;
  bedrooms?: number | null;
  builtAreaM2?: number | null;

  // Precios & Descuentos
  askingPriceInitial: number;
  askingPriceLast: number;
  closingPrice: number;
  currency: 'USD' | 'UYU';
  
  // Métricas Derivadas
  discountAbsolute: number;          // askingPriceLast - closingPrice
  discountPercentage: number;        // (askingPriceLast - closingPrice) / askingPriceLast
  initialDiscountPercentage: number; // (askingPriceInitial - closingPrice) / askingPriceInitial
  
  // Fechas & Tiempo en Mercado (DOM)
  listingFirstSeenAt: string;
  listingLastSeenAt: string;
  transactionDate: string;
  daysOnMarket: number;              // transactionDate - listingFirstSeenAt
  
  // Evidencia & Gobernanza
  sourceType: 'INTERNAL_OPERATION' | 'EXTERNAL_AGENCY' | 'PUBLIC_REGISTRY' | 'MANUAL_ENTRY';
  evidenceType: TransactionEvidenceType;
  evidenceUrl?: string | null;
  evidenceReference?: string | null;
  confidence: TransactionConfidenceLevel;
  verificationStatus: TransactionVerificationStatus;
  transactionQualityScore: number;
  
  // Aislamiento Multi-Tenant & Auditoría
  organizationId?: string | null;
  registeredByUserId?: string | null;
  auditTrail?: TransactionAuditRecord[];
}
```

---

## 3. JERARQUÍA DE EVIDENCIA Y NIVELES DE CONFIANZA

| Nivel de Evidencia (`evidenceType`) | Nivel de Confianza (`confidence`) | Apto para Calibración | Descripción |
| :--- | :--- | :---: | :--- |
| `OFFICIAL_RECORD` | `VERIFIED` (100%) | **SÍ** | Escritura pública, registro notarial, Catastro oficial (DNC) |
| `AGENCY_CONFIRMED` | `HIGH` (85-99%) | **SÍ** | Boleto de reserva formal informado por inmobiliaria asociada |
| `MANUAL_VERIFIED` | `HIGH` (85-99%) | **SÍ** | Ingreso auditado por perito o analista Super Admin de Hipotecaly |
| `SELLER_CONFIRMED` | `HIGH` (85-99%) | **SÍ** | Documentación de cierre aportada por propietario vendedor |
| `PARTNER_FEED` | `MEDIUM` (65-84%) | *OBSERVACIONAL* | Feeds B2B agregados pendientes de auditoría notarial |
| `INFERRED` | `UNVERIFIED` (<40%) | **NO** | Inferencia estadística o despublicación de portal (DESCARTADO) |

---

## 4. MÉTRICAS DERIVADAS Y ESTADÍSTICA ROBUSTA

Para cada segmento territorial (Barrio + Tipología) se calculan métricas estadísticas no sesgadas por outliers:
- **Tamaño de muestra ($N$):** Reportado obligatoriamente en todas las consultas y dashboards.
- **Descuento Mediano (P50):** Estimador central para análisis de negociación.
- **Rango Intercuartílico (IQR / P25 - P75):** Amplitud de la banda de negociación típica.
- **Median Absolute Deviation (MAD):** Dispersión robusta.
- **Days on Market (DOM) Mediano:** Días reales desde primera publicación hasta firma de transacción.
- **Calibration Readiness State:**
  - $N < 20 \rightarrow$ `INSUFFICIENT_DATA`
  - $20 \le N < 50 \rightarrow$ `OBSERVATIONAL`
  - $50 \le N < 100 \rightarrow$ `CALIBRATION_CANDIDATE`
  - $N \ge 100 \rightarrow$ `CERTIFIABLE`

---

## 5. SEPARACIÓN ESTRICTA: TRANSACTION INTELLIGENCE $\ne$ VALUACIÓN EN VIVO

1. **Transaction Intelligence** observa y almacena datos históricos reales de transacciones de compraventa.
2. **MarketValueEngine** tasa inmuebles objetivos utilizando el ajuste global certificado de **8.50% (V2)**.
3. Transaction Intelligence **no modifica automáticamente** el parámetro del 8.50%. Genera una alerta interna de gobernanza (`CALIBRATION_REVIEW_RECOMMENDED`) cuando $N \ge 50$ y el spread observado respecto al 8.5% supera el 1.5%, requiriendo aprobación formal y manual del Super Admin mediante `SettingsLifecycleService`.

---

## 6. GOBERNANZA, PRIVACIDAD Y SEGURIDAD

- **Aislamiento Multi-Tenant:** Operaciones iniciadas por organizaciones privadas quedan aisladas bajo su `organizationId`. Solo datos anonimizados y desprovistos de información personal forman parte de los índices agregados.
- **Privacidad Total (Zero PII):** No se almacenan nombres, números de documento, correos ni teléfonos de compradores o vendedores. La base se enfoca exclusivamente en el inmueble físico y la transacción económica.
- **Auditoría Inmutable:** Cada ingreso manual o cambio de estado registra un `TransactionAuditRecord` con `performedByUserId`, rol, valores anteriores, nuevos valores y timestamp.

---

## 7. DASHBOARD SUPERADMIN Y SUITE DE PRUEBAS

- Componente: [`src/components/admin/SuperAdminTransactionIntelligenceTab.tsx`](file:///c:/Projects/Hipotecaly/src/components/admin/SuperAdminTransactionIntelligenceTab.tsx)
- Integrado en `/superadmin/tasador` y Centro de Control.
- Suite de Tests: [`tests/tasador-transaction-intelligence.spec.ts`](file:///c:/Projects/Hipotecaly/tests/tasador-transaction-intelligence.spec.ts) (6/6 tests pasando al 100%).

---

## 8. ESTADO EN PRODUCCIÓN

La infraestructura y los endpoints se encuentran listos y certificados. En producción opera en estado:

$$\mathbf{PRODUCTION\_READY\_NO\_VERIFIED\_CLOSING\_DATA\_YET}$$

No se cargaron transacciones sintéticas ni inventadas, preservando la integridad científica de la plataforma hasta el ingreso de operaciones reales de clientes y fuentes asociadas.
