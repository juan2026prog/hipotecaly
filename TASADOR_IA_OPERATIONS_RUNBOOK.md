# HIPOTECALY — TASADOR IA
## RUNBOOK OPERATIVO Y PROTOCOLO DE INCIDENTES (OPERATIONS RUNBOOK V1.0)
### CERTIFICACIÓN INTEGRAL DE PRODUCCIÓN — FASE 7 FINAL

---

## 1. INTRODUCCIÓN Y ROLES OPERACIONALES

Este runbook describe los procedimientos estándar de operación, diagnóstico y mitigación de incidentes del **Tasador IA** de HIPOTECALY en entorno de producción.

### Responsables:
- **Super Admin de Plataforma:** Gestión de gobernanza, aprobación de calibraciones, auditoría de costos y control de fuentes.
- **Analista / Escribano de Organización:** Operación diaria de expedientes, vinculación de garantías colaterales y registro de peritajes SAU.
- **Equipo de Infraestructura:** Mantenimiento de bases de datos, APIs de OpenAI y monitoreo de salud.

---

## 2. PROCEDIMIENTOS ANTE INCIDENTES OPERATIVOS

### Procedimiento 01: Falla o Bloqueo WAF de una Fuente Externa (Source Broken / WAF 403)
* **Síntoma:** Un crawler reporta `HTTP 403 Forbidden` o fallos continuos de conexión.
* **Acción Inmediata:**
  1. El `CircuitBreaker` interno del adaptador cambia automáticamente el estado de la fuente a `BLOCKED` o `DEGRADED`.
  2. **Regla Estricta:** NUNCA intentar evasiones agresivas o bypass de Cloudflare.
  3. Ingresar a `/superadmin/tasador` y verificar el estado de la fuente en el *Source Health Dashboard*.
  4. Deshabilitar `ingestion_enabled` para esa fuente hasta coordinar acceso formal o API institucional.
  5. Las publicaciones preexistentes en la base de datos se preservan inmutables.

### Procedimiento 02: Caída o Timeout de la API de OpenAI (OpenAI Down / High Latency)
* **Síntoma:** El enriquecimiento cualitativo de la tasación excede los 10 segundos o retorna error 500/503.
* **Acción Inmediata:**
  1. El motor activa automáticamente el modo `FALLBACK_HEURISTIC`.
  2. La tasación matemática concluye con **100% de éxito y precisión determinística**.
  3. En la interfaz del expediente se visualiza la advertencia `FALLBACK (DETERMINÍSTICO EXITOSO)`.
  4. No se interrumpe la evaluación de la solicitud crediticia ni el expediente.

### Procedimiento 03: Alerta de Desviación de Mercado o Descuento de Oferta (Asking Discount Drift)
* **Síntoma:** El análisis de Ground Truth (`AskingDiscountAnalyzer`) detecta que el descuento observado en compraventas reales difiere significativamente del 12.00% (ej. promedio observado de 15.4%).
* **Acción Inmediata:**
  1. El sistema genera una propuesta de calibración en estado `PENDING_REVIEW` (Modo Sombra).
  2. El Super Admin ingresa a `/superadmin/calibracion` y revisa las métricas de backtesting sobre el Holdout Set.
  3. Si la muestra es estadísticamente suficiente (N ≥ 75 transacciones verificadas), el Super Admin puede aprobar la propuesta.
  4. Se crea la versión `V2` de settings de forma inmutable; las tasaciones pasadas conservan `V1`.

### Procedimiento 04: Spike de Tasaciones con Nivel de Confianza Bajo (Low Confidence Spike)
* **Síntoma:** Múltiples tasaciones en un área geográfica arrojan `Confidence < 50` o estado `INSUFFICIENT_COMPARABLES`.
* **Acción Inmediata:**
  1. Verificar en `/superadmin/tasador` si la ingesta de dicha localidad tiene listings activos suficientes.
  2. Si el mercado tiene baja liquidez u oferta escasa, el sistema exige honestamente un **Peritaje Profesional SAU**.
  3. El analista del expediente hace click en "Ingresar Peritaje" e incorpora la tasación de un arquitecto o perito habilitado.

### Procedimiento 05: Reversión Inmediata de Configuración (Rollback de Settings)
* **Síntoma:** Una nueva versión de parámetros (`V2`) genera dispersión no deseada en el backtesting de producción.
* **Acción Inmediata:**
  1. Acceder a `/superadmin/calibracion`.
  2. Seleccionar la versión previa deseada (ej. `V1`) y hacer click en `Ejecutar Rollback`.
  3. Ingresar el motivo de auditoría. El gestor restaura los parámetros de `V1` creando una nueva versión activa con trazabilidad completa.

---

## 3. CHECKLIST DIARIO DE SALUD OPERATIVA (HEALTH MONITORING)

1. **Revisar `/superadmin/tasador`:** Confirmar que al menos las 2 fuentes líderes (`infocasas`, `mercadolibre_uy`) reporten estado `HEALTHY`.
2. **Revisar Consumo IA (`/superadmin/ia`):** Verificar que el gasto acumulado en USD no supere el límite mensual configurado en `BudgetGuard`.
3. **Revisar Nuevas Transacciones Ground Truth (`/superadmin/calibracion`):** Asegurar que las escrituras notariales ingresadas cuenten con copia de comprobante notarial.

---

## 4. CONTACTO DE ESCALABILIDAD
* **Soporte Técnico:** `tech@hipotecaly.com`
* **Gobernanza y Peritajes:** `auditoria@hipotecaly.com`
