# HIPOTECALY — Manual de Operaciones y Ciclo de Vida del Expediente

## 1. Ciclo de Vida del Expediente Hipotecario

Todo crédito con garantía hipotecaria procesado a través del Marketplace o SaaS sigue la siguiente máquina de estados finita:

1. **`draft` (Borrador):** El solicitante completa el wizard paso a paso. Se mantiene persistencia local UX no autoritativa marcada explícitamente como no sincronizada.
2. **`submitted` (Recibido):** Confirmado en Supabase con generación de `public_id` único (ej: `HIP-2026-00124`).
3. **`in_review` (En Revisión Inicial):** La mesa de operaciones valida la coherencia inicial de los ingresos y datos del inmueble.
4. **`property_analysis` (Propiedad en Análisis):** Tasación preliminar automatizada y validación del LTV contra el tope de la regla de prestamistas activa.
5. **`searching_proposal` (Buscando Propuesta / Matching):** Ejecución del motor `match_application_to_lenders(target_id)`. Se evalúan LTV, montos, plazos, clearing, departamento y tipo de inmueble.
6. **`with_proposal` (Propuesta Disponible):** Ofertas cargadas por prestamistas validadas por el analista y presentadas formalmente al prestatario en `/mi-cuenta`.
7. **`offer_accepted` (Propuesta Aceptada):** El solicitante acepta una de las propuestas comparadas.
8. **`formalization_pending` (Formalización Notarial):** Escribano público revisa títulos y certificados. Se habilita la autorización de revelación controlada de datos (`data_disclosures`).
9. **`disbursed` (Finalizada / Desembolsada):** Firma de escritura pública de hipoteca en escribanía y desembolso del capital.
10. **`rejected` / `cancelled` (Rechazada / Cancelada):** Operación cerrada con motivo formal auditado.

---

## 2. Motor de Matching y Scoring Explicable (0 a 100)

El motor calcula el score determinístico de compatibilidad:
- **LTV (hasta 30 pts):** Si LTV $\le$ `max_ltv` (30 pts). Si excede la regla del prestamista, se asigna 0 pts y se declara `is_eligible = false`.
- **Monto Financiable (hasta 20 pts):** Dentro de `min_loan` y `max_loan` del prestamista.
- **Tipo de Inmueble (hasta 15 pts):** Casa, apartamento, terreno, local o campo admitido por el prestamista.
- **Ubicación Geográfica (hasta 10 pts):** Departamento de Uruguay dentro de la cobertura del inversor.
- **Clearing de Informes (hasta 5 pts):** Antecedentes crediticios compatibles con la tolerancia del inversor.
- **Documentación de Ingresos (hasta 20 pts):** Comprobantes laborales o contables aportados.

### Overrides Manuales
Analistas con rol `admin` pueden forzar un match en caso de garantías extraordinarias mediante `overrideOpportunity(id, reason)`, registrando obligatoriamente el motivo y auditando la acción.

---

## 3. Matriz de Roles y Permisos (RBAC)

| Rol | Alcance | Permisos Clave |
|---|---|---|
| **Administrador (`admin`)** | Organización | Control total de expedientes, usuarios, facturación, white-label y overrides. |
| **Analista de Crédito (`analyst`)** | Expedientes | Tasación de garantías, revisión de ingresos, matching y presentación de ofertas. |
| **Escribano Notarial (`notary`)** | Jurídico / Títulos | Estudio de títulos de propiedad, certificados de gravámenes y minutas notariales. |
| **Observador (`viewer`)** | Auditoría | Acceso de solo lectura para auditores externos, inversores o socios. |
| **Prestamista (`lender`)** | Portal Prestamista | Vista de oportunidades anonimizadas, manifestar interés, declinar y crear ofertas. |
| **Prestatario (`borrower`)** | Portal Solicitante | Carga de documentos propios, seguimiento del expediente y comparador de ofertas. |

---

## 4. Tareas Operativas y SLAs

- **Revisión inicial de expediente:** Máximo 4 horas hábiles tras recepción.
- **Tasación preliminar:** Máximo 8 horas hábiles.
- **Presentación de ofertas de prestamistas:** Máximo 48 horas hábiles.
- **Validez estándar de propuestas económicas:** 15 días corridos.
