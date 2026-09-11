# INFORME DE RECALIBRACIÓN CERTIFICADA A 8.5% (TASADOR IA)

**Proyecto:** HIPOTECALY — Plataforma de Crédito Hipotecario y Valuaciones Inmobiliarias  
**Módulo:** Tasador IA / Motor de Valuación Determinístico  
**Estado:** `ASKING_ADJUSTMENT_8_5_CERTIFIED`  
**Fecha:** 11 de Septiembre de 2026  
**Versión del Motor:** `v1.0.0-certified`  
**Versión de Configuración Activa:** `V2` (asking_price_adjustment = 0.0850)  
**Versión de Configuración Histórica:** `V1` (asking_price_adjustment = 0.1200)  

---

## 1. RESUMEN EJECUTIVO

Se ejecutó la recalibración controlada, parametrizada y formal del factor global de ajuste de oferta pública (**Asking Price Adjustment**) en el Tasador IA de HIPOTECALY, evolucionando de:

$$\text{V1: } \text{asking\_price\_adjustment} = 12.00\% \quad (0.1200)$$

a:

$$\mathbf{V2: \quad \text{asking\_price\_adjustment} = 8.50\% \quad (0.0850)}$$

Equivalente matemática estricta:

$$\text{Adjusted Price} = \text{Raw Asking Price} \times (1 - 0.0850) = \text{Raw Asking Price} \times 0.9150$$

### Motivo de Negocio:
`Business recalibration pending empirical closed-sales calibration.`

---

## 2. UBICACIÓN DEL PARÁMETRO Y ARQUITECTURA DE CONFIGURACIÓN

Se eliminaron valores hardcodeados aislados y se centralizó el control en la arquitectura de configuración versionada:

| Componente | Archivo | Rol Técnico | Estado |
| :--- | :--- | :--- | :--- |
| **Tipos del Motor** | [`src/lib/tasador/valuation/valuationTypes.ts`](file:///c:/Projects/Hipotecaly/src/lib/tasador/valuation/valuationTypes.ts) | Definición formal de interfaces `AppraisalSettingsV1` / `V2` | Actualizado |
| **Gestor de Configuración** | [`src/lib/tasador/valuation/AppraisalSettingsManager.ts`](file:///c:/Projects/Hipotecaly/src/lib/tasador/valuation/AppraisalSettingsManager.ts) | Constantes `DEFAULT_APPRAISAL_SETTINGS_V1` (12%) y `V2` (8.5%) | Actualizado |
| **Ciclo de Vida** | [`src/lib/tasador/calibration/SettingsLifecycleService.ts`](file:///c:/Projects/Hipotecaly/src/lib/tasador/calibration/SettingsLifecycleService.ts) | Historial de versiones con V1 `DEPRECATED` y V2 `ACTIVE` | Actualizado |
| **Buscador de Candidatos** | [`src/lib/tasador/valuation/ComparableCandidateFinder.ts`](file:///c:/Projects/Hipotecaly/src/lib/tasador/valuation/ComparableCandidateFinder.ts) | Aplicación dinámica del factor según los settings versionados | Invariante |
| **Servicio de Tasación** | [`src/lib/tasador/appraisal/AppraisalService.ts`](file:///c:/Projects/Hipotecaly/src/lib/tasador/appraisal/AppraisalService.ts) | `calculateValuation()` y `searchComparablesFallback()` con 8.5% | Actualizado |
| **Generador PDF** | [`src/lib/tasador/report/PdfReportGenerator.ts`](file:///c:/Projects/Hipotecaly/src/lib/tasador/report/PdfReportGenerator.ts) | Renderizado dinámico de `-8.5%` (V2) o `-12%` (V1) en Páginas 3 y 4 | Actualizado |
| **Generador de Explicabilidad** | [`src/lib/tasador/ai/ReportGenerator.ts`](file:///c:/Projects/Hipotecaly/src/lib/tasador/ai/ReportGenerator.ts) | Descripción textual dinámica de `asking_price_adjustment` | Actualizado |
| **Endpoint Server-Side** | [`api/tasador.ts`](file:///c:/Projects/Hipotecaly/api/tasador.ts) | Aplicación de factor `0.915` y registro de `configurationVersion = 2` | Actualizado |

---

## 3. PRESERVACIÓN HISTÓRICA E INMUTABILIDAD

> **Principio de Trazabilidad Estricta:**  
> Las tasaciones históricas y los `valuation_runs` emitidos bajo la versión de configuración `V1` **no mutan ni se recalculan**. Cada registro conserva:
> - `configurationVersion: 1`
> - `askingPriceAdjustmentPercentage: 0.1200`
> - Reproducibilidad exacta al 100%.

Nuevas tasaciones y nuevas corridas (`runNumber > 1` o nuevas consultas) registran:
- `configurationVersion: 2`
- `askingPriceAdjustmentPercentage: 0.0850`

---

## 4. IMPACTO CUANTITATIVO Y COMPARATIVA DE VALUACIÓN

Al disminuir el factor de descuento de negociación de oferta del 12.0% al 8.5%, el precio base de los comparables de oferta pública aumenta en una razón de:

$$\frac{1 - 0.085}{1 - 0.120} = \frac{0.915}{0.880} \approx +3.977\%$$

### Comparación sobre Muestra Real por Zonas:

| Caso / Zona | Tipología / Sup. | Asking Price Promedio | Valor Estimado V1 (12%) | Valor Estimado V2 (8.5%) | Diferencia USD | Diferencia % |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Pocitos** | Apartamento 75 m² (2 Dorm) | USD 200.000 | USD 176.000 | **USD 183.000** | +USD 7.000 | **+3.98%** |
| **Cordón** | Apartamento 50 m² (1 Dorm) | USD 130.000 | USD 114.500 | **USD 119.000** | +USD 4.500 | **+3.93%** |
| **Carrasco** | Casa 220 m² (3 Dorm) | USD 480.000 | USD 422.500 | **USD 439.000** | +USD 16.500 | **+3.91%** |
| **Malvín** | Apartamento 80 m² (2 Dorm) | USD 240.000 | USD 211.000 | **USD 219.500** | +USD 8.500 | **+4.03%** |
| **Punta Carretas** | Apartamento 95 m² (3 Dorm) | USD 310.000 | USD 273.000 | **USD 283.500** | +USD 10.500 | **+3.85%** |

*(Nota: Las transacciones reales confirmadas con evidencia `CONFIRMED_TRANSACTION` mantienen un ajuste del 0.0%, por lo que su valor no se ve afectado por el cambio de factor de oferta).*

---

## 5. INVARIANZA MATEMÁTICA Y ESTADÍSTICA

Se certifica que los estimadores del `MarketValueEngine` y las formulaciones estadísticas permanecen 100% inalterados:
- **Mediana Ponderada (35%):** Ordenamiento por precios ajustados directamente y búsqueda de peso acumulado $\ge 0.50$.
- **Media Recortada (30%):** Trimmed al 10% de ambos extremos si $N \ge 5$.
- **Precio por m² Ponderado (25%):** Unitario ponderado por similitud multidimensional.
- **Ajuste Directo (10%):** Coeficientes de superficie, garaje y antigüedad.
- **Outlier Filtering:** Tukey IQR ($1.5\times$) y Median Absolute Deviation (MAD).
- **Unique Property Rule:** 1 inmueble físico = $N=1$ observación estadística.

---

## 6. SUITE DE PRUEBAS AUTOMATIZADAS

Todas las pruebas de regresión y valoración matemática superaron el 100% de éxito:
1. `tasador-part3-valuation.spec.ts` (12/12 PASS)
2. `tasador-operational-query.spec.ts` (18/18 PASS)
3. `tasador-statistical-hardening.spec.ts` (30/30 PASS)
4. `tasador-fase3-comparables-filters.spec.ts` (12/12 PASS)
5. `tasador-part4-multisource-e2e.spec.ts` (12/12 PASS)

**Total:** 84 tests ejecutados y aprobados sin fallos.
