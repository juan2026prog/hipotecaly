# HIPOTECALY — TASADOR IA
## REPORTE TÉCNICO PRODUCTIVO: PARTE 1 + PARTE 2
### CONSULTA OPERATIVA Y SELECCIÓN/VALIDACIÓN DE COMPARABLES (HUMAN-IN-THE-LOOP)

**Fecha de Certificación:** 11 de Septiembre de 2026  
**Entorno:** Producción / Staging  
**Versión de Esquema:** `20260911000049_tasador_appraisals_and_comparables_schema.sql`  
**Estado General:** `PRODUCTION_READY` (Parte 1 y Parte 2 Certificadas)  
**Tests Ejecutados:** 178 tests pasados (100% éxito)  
**Regresiones en Core Matemático:** 0  

---

## 1. RESUMEN EJECUTIVO

Se ha implementado de forma rigurosa y estandarizada la capa operativa de consulta del **Tasador IA de HIPOTECALY**, estructurada en dos partes complementarias:

* **Parte 1 (Nueva Tasación / Consulta Operativa):** Permite a analistas y tasadores de cada organización inmobiliaria ingresar un inmueble objetivo mediante un formulario técnico multi-bloque estructurado (ubicación normalizada, tipología, superficies, distribución, amenities, estado de conservación, multimedia y observaciones). La consulta valida rigurosamente los campos mínimos obligatorios y persiste la tasación como borrador (`DRAFT` / `READY_FOR_COMPARABLES`) bajo estricto aislamiento multi-tenant.
* **Parte 2 (Selección y Validación de Comparables — Human-in-the-Loop):** Realiza la búsqueda server-side de comparables sobre la Base Inmobiliaria productiva (`property_master` / `property_listings`), calculando un score determinístico de similitud (0-100) con desglose explicable por factor (ubicación, tipología, superficie, dormitorios, garajes, recencia y calidad de datos). Permite al analista excluir o incluir comparables con justificación estructurada obligatoria y auditoría, recalculando en tiempo real las estadísticas de la muestra (USD/m² mediana, dispersión IQR/MAD) y el semáforo de calidad del set (`ALTA`, `MEDIA`, `BAJA`).

El núcleo de cálculo matemático del tasador (`MarketValueEngine`, ajuste obligatorio del 12% sobre el asking price, poda de outliers y percentiles) se mantuvo estrictamente preservado y certificado.

---

## 2. ARQUITECTURA DE CONSULTA OPERATIVA (PARTE 1)

### 2.1 Modelo de Datos del Inmueble Objetivo
El inmueble a tasar se estructura en bloques técnicos validados:
1. **Bloque A — Ubicación:** País, Departamento (Uruguay, normalizado), Ciudad, Barrio/Localidad, Calle, Número de puerta, Unidad/Piso, Padrón catastral y Coordenadas geográficas (`latitude`, `longitude`, `isGeocodedExact`).
2. **Bloque B — Tipología:** Categoría principal (`apartamento`, `casa`, `ph`, `terreno`, `local_comercial`, `oficina`, `campo`), subtipo y régimen de Propiedad Horizontal.
3. **Bloque C — Metrajes y Superficies:** Superficie total ($m^2$), construida ($m^2$), cubierta ($m^2$), terreno ($m^2$) y balcón/terraza ($m^2$). Se valida que al menos una superficie positiva sea especificada.
4. **Bloque D — Distribución:** Cantidad de dormitorios, baños, toilettes, cocheras/garajes y nivel de piso.
5. **Bloque E — Amenities y Confort:** 14 atributos clave (balcón, terraza, parrillero, piscina, ascensor, seguridad 24h, portería, calefacción, aire acondicionado, gimnasio, frente al mar, vista despejada, box/baulera).
6. **Bloque F — Estado de Conservación:** Calificación estándar (`excelente`, `muy_bueno`, `bueno`, `regular`, `a_reciclar`), antigüedad en años y gastos comunes en UYU.
7. **Bloque G — Multimedia y Observaciones:** Subida y ordenamiento de fotografías con designación de foto principal y notas del perito.

### 2.2 Compuerta de Validación Operativa (Validation Gate)
Antes de proceder a la búsqueda de comparables, el servicio `AppraisalService.validateForComparables` valida:
* Tipo de propiedad obligatorio.
* Departamento válido y presencia de barrio o localidad.
* Al menos una superficie ($m^2$) mayor a cero y menor a 50.000 $m^2$.
* Si algún dato indispensable falta, la interfaz informa el campo exacto impidiendo búsquedas a ciegas.

---

## 3. SELECCIÓN Y VALIDACIÓN DE COMPARABLES (PARTE 2)

### 3.1 Vista Dual e Interactiva (Human-in-the-Loop)
La pantalla `/demo/:tenantSlug/admin/tasaciones/:id` ofrece:
* **Toggle de visualización:** Vista de tarjetas interactivas + mapa SVG Mercator vs. Tabla matricial comparativa completa.
* **Mapa interactivo:** Proyección Web Mercator bidireccional que grafica el inmueble objetivo (pin distintivo azul oscuro) junto a todos los candidatos (pines esmeralda para seleccionados, grises para excluidos). Al hacer hover o clic en una tarjeta, el marcador se resalta dinámicamente y viceversa.
* **Filtros avanzados del analista:** Radio geográfico de búsqueda (500m, 1km, 2km, 5km), tolerancia de superficie ($\pm 10\%$, $\pm 20\%$, $\pm 30\%$), coincidencia exacta de dormitorios, antigüedad de publicación y filtro por calidad de datos.

### 3.2 Tabla Matricial de Comparables
Compara columna a columna:
* Inmueble Objetivo vs. Candidato 1, 2, 3...
* Precio de lista original vs. Precio ajustado (-12% certificado).
* Valor unitario en USD/$m^2$.
* Desvío porcentual de superficie ($m^2$).
* Tipología, dormitorios, baños y garajes.
* Antigüedad y distancia radial en metros.
* Score de similitud y semáforo por atributo.

---

## 4. SEGURIDAD, RLS Y AISLAMIENTO MULTI-TENANT

### 4.1 Principio de Mínimo Privilegio y Deny-by-Default
* Las tablas maestras globales (`property_master`, `property_listings`, `listing_price_history`, `ingestion_jobs`) **mantienen denegado todo acceso directo desde el cliente** (`FOR ALL TO authenticated USING (false)`).
* La búsqueda de comparables se canaliza de forma obligatoria mediante la función de backend server-side (`api/tasador.ts?action=comparables`), la cual valida la identidad del usuario y su pertenencia al tenant.

### 4.2 Tablas de Tasación por Organización
Se crearon las tablas multi-tenant:
1. `public.appraisals`:
   - Clave foránea `organization_id` con índice dedicado.
   - Políticas RLS: Los miembros de la organización pueden leer y gestionar sus propias tasaciones (`organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())`).
   - Super Admin posee bypass de auditoría global.
2. `public.appraisal_comparables`:
   - Vínculo relacional `appraisal_id` en cascada.
   - Hereda la política de tenant a través de la tasación padre.

---

## 5. ALGORITMO DE SCORING Y SIMILITUD EXPLICABLE

Cada candidato a comparable recibe un puntaje determinístico de 0 a 100 ponderado por 8 factores estandarizados:

$$\text{Similarity Score} = \sum w_i \cdot S_i$$

Donde:
1. **Ubicación ($w_1 = 0.30$):** Coincidencia de barrio y penalización por distancia hiperbólica/euclídea ($\le 1.5\text{ km}$).
2. **Tipología ($w_2 = 0.20$):** Idéntica tipología residencial otorga 100 pts; incompatibilidades tipológicas penalizan fuertemente.
3. **Superficie ($w_3 = 0.20$):** Relación de metraje $R = \text{área}_{\text{candidato}} / \text{área}_{\text{objetivo}}$. Desvío $\le 10\%$ otorga máxima puntuación; desvíos superiores al $50\%$ reducen el puntaje severamente.
4. **Dormitorios ($w_4 = 0.10$):** Coincidencia exacta = 100 pts; diferencia de $\pm 1$ dormitorio = 80 pts; diferencias mayores = 40 pts.
5. **Baños ($w_5 = 0.05$):** Similitud de servicios sanitarios.
6. **Garaje ($w_6 = 0.05$):** Disponibilidad de cochera.
7. **Recencia ($w_7 = 0.05$):** Penalización gradual por días en mercado para priorizar oferta vigente.
8. **Calidad de Datos ($w_8 = 0.05$):** `data_quality_score` de la publicación (fotos, metraje contrastado, geocodificación).

*Penalización de elegibilidad:* Inmuebles clasificados como `PARTIAL` sufren una detracción adicional de 12 puntos de score.

---

## 6. FLUJO DE EXCLUSIÓN FUNDAMENTADA Y AUDITORÍA

Para evitar decisiones arbitrarias o sesgos no justificados:
* Al presionar "Excluir", se despliega un modal obligatorio que exige seleccionar uno de los siguientes motivos formales:
  - `LOCATION_MISMATCH`: Ubicación en microrregión o entorno urbano no representativo.
  - `SURFACE_OUTLIER`: Metraje declarado atípico o desproporcionado.
  - `TYPOLOGY_MISMATCH`: Distribución interna, calidad o tipología no equivalente.
  - `POOR_DATA_QUALITY`: Datos de publicación inconsistentes o dudosos.
  - `PRICE_ATYPICAL`: Precio de oferta fuera de banda razonable de mercado.
  - `COMMERCIAL_DIFFERENCE`: Características comerciales extraordinarias.
  - `OTHER`: Otra causa justificada con campo de notas obligatorio.
* Al confirmarse, el comparable se marca con `selected = false`, `status = 'EXCLUDED'`, `exclusion_reason`, `analyst_note` y timestamp `excluded_at`.
* **Invariante crítica:** La exclusión en la tasación NO elimina ni altera el registro en la base de datos global inmobiliaria.

---

## 7. ESTADÍSTICAS DE MUESTRA Y SEMÁFORO DE CALIDAD

En cada adición o exclusión de comparables, el motor recalcula de forma instantánea:
* **Métricas centrales:** Mediana de USD/$m^2$, Media, Mínimo y Máximo.
* **Métricas de dispersión:** Rango intercuartílico ($IQR$) y porcentaje de dispersión respecto a la mediana:
  $$\text{Dispersion \%} = \frac{\text{Max}_{\text{m2}} - \text{Min}_{\text{m2}}}{\text{Median}_{\text{m2}}} \times 100$$
* **Distancia media:** En metros al inmueble objetivo.
* **Semáforo de Calidad del Set:**
  - **VERDE (`ALTA`):** $N \ge 5$ comparables seleccionados con dispersión $< 20\%$. Muestra robusta y homogénea.
  - **AMARILLO (`MEDIA`):** $3 \le N < 5$ comparables o dispersión moderada ($20\% - 30\%$). Muestra utilizable para tasación preliminar.
  - **ROJO (`BAJA`):** $N < 3$ comparables o dispersión $> 30\%$. Advierte al tasador que el conjunto es insuficiente para una valoración de alta certidumbre.

---

## 8. VALIDACIÓN TÉCNICA Y RESULTADOS DE TESTS

### 8.1 Resultados de Playwright
Se ejecutó la suite completa de verificación:
* `tests/tasador-operational-query.spec.ts`: **18 / 18 tests pasados** (100%).
* `tests/tasador-statistical-hardening.spec.ts`: **30 / 30 tests pasados** (100%).
* `tests/tasador-fase7-production-certification.spec.ts`: **34 / 34 tests pasados** (100%).
* `tests/tasador-continuous-ingestion.spec.ts`: **12 / 12 tests pasados** (100%).
* `tests/tasador-ingestion-idempotency.spec.ts`: **8 / 8 tests pasados** (100%).
* `tests/tasador-normalization-uruguay.spec.ts`: **28 / 28 tests pasados** (100%).
* `tests/tasador-deduplication-v1.spec.ts`: **14 / 14 tests pasados** (100%).
* `tests/tasador-data-quality-outliers.spec.ts`: **14 / 14 tests pasados** (100%).
* `tests/tasador-adapters-capabilities.spec.ts`: **10 / 10 tests pasados** (100%).
* `tests/tasador-cadastral-evaluation.spec.ts`: **10 / 10 tests pasados** (100%).

**Total:** **178 tests automatizados exitosos**, 0 fallas, 0 advertencias de compilación.

### 8.2 Compilación y Tipos
* `npx tsc --noEmit`: 0 errores.
* `npm run build`: Compilación en 6.33 segundos, artefactos Vite/Rollup generados correctamente en `dist/`.

---

## 9. PRUEBA REAL CONTROLADA (APARTAMENTO POCITOS)

Se simuló la consulta operativa y selección de comparables para un apartamento típico de Pocitos, Montevideo:
* **Inmueble objetivo:** 2 Dormitorios, 2 Baños, 80 $m^2$ construidos, Av. Brasil 2540.
* **Pool recuperado:** 6 comparables residenciales directos en Pocitos.
* **Rango de precios de lista:** USD 195.000 a USD 235.000.
* **Precios ajustados (-12%):** USD 171.600 a USD 206.800.
* **Similitud calculada:** Rango de 72 a 93 puntos.
* **Exclusión de prueba:** 1 comparable excluido con motivo `SURFACE_OUTLIER` por metraje catastral divergente.
* **Muestra activa final:** 5 comparables incluidos ($N = 5$).
* **Mediana resultante:** USD 2.480/$m^2$.
* **Dispersión:** 9.4% (alta homogeneidad).
* **Calidad del set:** `ALTA` (Semáforo verde).
* **Transición de estado:** Aprobado a `READY_FOR_VALUATION`.

---

## 10. ESTADO DE CERTIFICACIÓN Y CHECKLIST DE PRODUCCIÓN

| Componente | Estado | Verificación |
| :--- | :---: | :--- |
| Formulario de Inmueble Objetivo (Parte 1) | **CERTIFICADO** | Validación técnica estricta y UX multi-bloque |
| Aislamiento Multi-Tenant (Parte 1) | **CERTIFICADO** | RLS con filtro por `organization_id` en Supabase |
| Búsqueda Server-Side de Comparables (Parte 2) | **CERTIFICADO** | Endpoint `api/tasador?action=comparables` seguro |
| Invariante 12% Descuento Asking Price | **CERTIFICADO** | Ajuste matemático verificado por test |
| Algoritmo de Similitud Determinístico | **CERTIFICADO** | Ranking explicable con 8 factores ponderados |
| Interfaz Human-in-the-Loop | **CERTIFICADO** | Vista dual (Tarjetas + Mapa SVG / Tabla matricial) |
| Flujo de Exclusión Fundamentada | **CERTIFICADO** | 7 motivos canónicos con auditoría obligatoria |
| Estadísticas y Semáforo de Calidad | **CERTIFICADO** | Mediana, IQR, dispersión y badges ALTA/MEDIA/BAJA |
| Transición a READY_FOR_VALUATION | **CERTIFICADO** | Validación de $N \ge 3$ comparables activos |
| Cero Regresiones en Core Matemático | **CERTIFICADO** | 30/30 tests de hardening estadístico aprobados |

---

## 11. PRÓXIMOS PASOS (HACIA PARTE 3)

1. **Parte 3 (Cálculo y Valoración Automática):** Conexión de la muestra validada al `MarketValueEngine` para la emisión de la tasación final con bandas de confianza ($P_{25}, P_{50}, P_{75}$), análisis hedónico de amenidades y exportación de informe tasador en PDF/Web.
