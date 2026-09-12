# TASADOR IA — REPORTE DE PREPARACIÓN DE BASE INMOBILIARIA NACIONAL
## HIPOTECALY — NATIONAL DATABASE IMPORT READINESS REPORT

**Fecha de Certificación:** 2026-09-11  
**Módulo:** `src/lib/tasador/import/` (NationalDatabaseImportService)  
**Estado:** CERTIFICADO OPERATIVO  
**Veredicto de Arquitectura:** `NATIONAL_DATA_IMPORT_STAGE_READY`

---

### 1. OBJETIVO Y ALCANCE

El presente informe documenta la arquitectura, modelos de datos, validaciones y procedimientos de importación masiva desarrollados en HIPOTECALY para incorporar catálogos y datasets de inmobiliarias independientes, tasadores periciales y bases de datos inmobiliarias a escala nacional en Uruguay, sin comprometer la integridad del motor del Tasador IA ni saturar la base de datos principal con datos corruptos o no verificados.

---

### 2. ARQUITECTURA DE STAGING SEGURO EN 3 ETAPAS

Para blindar la base de datos productiva (`property_master` y `property_listings`), se diseñó e implementó un pipeline desacoplado en tres fases secuenciales:

```
[ Dataset Externo / CSV / JSON ]
              │
              ▼
    [ FASE 1: STAGING & NORMALIZACIÓN CANÓNICA ]
    - Inserción en `property_import_batches` y `staged_property_records`
    - Normalización de tipos de propiedad, monedas (USD/UYU), padrones y coordenadas
    - Aislamiento total: NINGÚN registro corrupto bloquea el lote completo
              │
              ▼
    [ FASE 2: PREVIEW DE VALIDACIÓN & DEDUPLICACIÓN CONSERVADORA ]
    - Detección de duplicados cross-source y cross-batch
    - Regla estricta `NULL != NULL` (evita falsos positivos si faltan datos clave)
    - Cálculo de métricas de lote: Total, Válidos, Con Advertencias, Rechazados
    - Inspección visual en Super Admin antes de autorizar el commit
              │
              ▼
    [ FASE 3: COMMIT ATÓMICO & TRAZABILIDAD SERVER-SIDE ]
    - Promoción atómica a `property_master` y `property_listings`
    - Asignación inmutable de `import_batch_id` y `source_batch_metadata`
    - Rollback granular por lote si se detectan anomalías posteriores
```

---

### 3. ESQUEMA CANÓNICO DE IMPORTACIÓN

El servicio `NationalDatabaseImportService` opera sobre un esquema canónico tipado (`CanonicalImportPayload` / `CanonicalPropertyRecord`):

| Campo Canónico | Tipo | Obligatorio | Regla de Normalización y Validación |
| :--- | :--- | :--- | :--- |
| `sourceAgencyId` | `string` | Sí | Identificador de la inmobiliaria o fuente origen |
| `sourceAgencyName` | `string` | Sí | Nombre legal/comercial de la inmobiliaria |
| `externalId` | `string` | Sí | ID interno en el sistema de la inmobiliaria |
| `propertyType` | `string` | Sí | Normalizado a `APARTMENT`, `HOUSE`, `LAND`, `COMMERCIAL`, `OFFICE` |
| `operationType` | `string` | Sí | Normalizado a `SALE`, `RENT`, `TEMPORARY_RENT` |
| `priceAmount` | `number` | Sí | Monto positivo (> 0); si viene en UYU se almacena tipo de cambio |
| `currency` | `string` | Sí | ISO `USD` o `UYU` |
| `neighborhood` | `string` | Sí | Normalizado a lista oficial de barrios de Uruguay |
| `department` | `string` | Sí | Departamento de Uruguay (Montevideo, Canelones, Maldonado, etc.) |
| `coveredAreaM2` | `number` | Sí | Metraje cubierto (> 0) |
| `totalAreaM2` | `number` | No | Metraje total; si falta, asume $\ge$ `coveredAreaM2` |
| `padron` | `string` | No | Padrón catastral alfanumérico normalizado (ej. "84210") |
| `street` | `string` | No | Nombre de calle normalizado sin abreviaturas sucias |
| `streetNumber` | `string` | No | Número de puerta depurado |
| `unitNumber` | `string` | No | Unidad o apartamento |
| `latitude` | `number` | No | Validado en rango Uruguay $[-35.5, -30.0]$ |
| `longitude` | `number` | No | Validado en rango Uruguay $[-58.5, -53.0]$ |
| `transactionDate`| `string` | No | Fecha ISO si es operación cerrada |
| `isClosedSale` | `boolean`| No | Flag de venta confirmada vs oferta activa |

---

### 4. REGLA ESTRICTA DE DEDUPLICACIÓN: `NULL != NULL`

Uno de los mayores riesgos de importar catálogos incompletos es la **falsa deduplicación**:
* Si dos propiedades de inmobiliarias distintas se ubican en *"Pocitos, 2 Dormitorios"* pero a ambas les falta el número de puerta y el padrón (`NULL`), un sistema descuidado las fusionaría en un único `property_master`.
* **Regla Implementada:** Si los identificadores exactos (padrón o dirección completa `calle + número + unidad`) son `NULL` o están ausentes, el sistema **NUNCA** las fusiona automáticamente.
* En su lugar, se clasifica como `POSSIBLE_DUPLICATE` (o nuevo master independiente), registrando una advertencia técnica en la auditoría del lote.

---

### 5. INTEGRACIÓN Y AISLAMIENTO CON EL CORE DEL TASADOR

1. **Inmutabilidad del Motor de Tasación:** La ingesta masiva no altera las fórmulas matemáticas del `MarketValueEngine` ni el multiplicador de ajuste de oferta (fijado en 8.5% en V2).
2. **Exclusión de Listings Corruptos:** Las tasaciones operativas solo consultan propiedades con estado `VALIDATED` y flags de calidad superados.
3. **Disponibilidad Inmediata para Comparables:** Los registros válidos promovidos pasan a estar disponibles para el motor de comparables con su trazabilidad de origen preservada.

---

### 6. CERTIFICACIÓN DE PRUEBAS AUTOMATIZADAS

La suite de pruebas automatizadas `tests/tasador-national-database-import.spec.ts` certifica:
* **Test 1:** Staging seguro de lotes masivos sin tocar `property_master` hasta el commit.
* **Test 2:** Aislamiento de registros corruptos (coordenadas fuera de Uruguay, precios negativos, metrajes nulos) permitiendo la aprobación parcial de registros válidos.
* **Test 3:** Cumplimiento de la regla `NULL != NULL` frente a direcciones incompletas.
* **Test 4:** Fusión exitosa a `property_master` existente cuando coinciden de forma unívoca padrón o dirección completa.
* **Test 5:** Commit atómico y trazabilidad por `importBatchId`.

---

**Firma pericial:**  
*Equipo de Arquitectura e Infraestructura de HIPOTECALY — Tasador IA*  
*Certificado emitido para despliegue en Producción.*
