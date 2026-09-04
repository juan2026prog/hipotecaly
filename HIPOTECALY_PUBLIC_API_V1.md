# HIPOTECALY — ESPECIFICACIÓN DE API PÚBLICA V1 & WEBHOOKS (2026)

**Versión:** 1.0.0  
**Fecha:** Septiembre 2026  
**Fase:** Macrofase 7 (Enterprise + Integrations + Billing + Security + Commercial Go-Live)  
**Referencia de Código:** [`src/lib/api/publicApiService.ts`](src/lib/api/publicApiService.ts)  

---

## 1. INTRODUCCIÓN Y AUTENTICACIÓN

La **API Pública v1 de HIPOTECALY** permite a entidades financieras, cooperativas, bancos y desarrolladores corporativos interactuar de forma programática con el motor hipotecario.

### 1.1 Autenticación mediante API Key
Todas las peticiones a la API deben incluir el encabezado HTTP:
```http
Authorization: Bearer hpt_live_xxxxxxxxxxxxxxxxxxxxxxxx
```
o
```http
x-api-key: hpt_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

Las claves se generan desde el panel de Super Admin o Configuración de Organización con prefijo seguro `hpt_live_` y alcance granular de permisos (scopes).

### 1.2 Scopes de Acceso
- `read:simulations`: Consulta del simulador financiero institucional.
- `write:applications`: Envío programático de solicitudes y expedientes de crédito.
- `read:applications`: Lectura de estado de expedientes propios del tenant.
- `admin:webhooks`: Alta, baja y administración de endpoints de webhook.

---

## 2. ENDPOINTS PRINCIPALES

### 2.1 Simulación Paramétrica de Crédito
- **Método:** `POST /api/v1/simulations`
- **Scope Requerido:** `read:simulations`
- **Payload Request:**
```json
{
  "propertyValueUsd": 200000,
  "requestedAmountUsd": 80000,
  "termMonths": 36,
  "propertyDepartment": "Montevideo",
  "propertyType": "casa"
}
```
- **Response Exitosa (200 OK):**
```json
{
  "valid": true,
  "ltvPct": 40,
  "maxAllowedLoanUsd": 80000,
  "estimatedMonthlyPaymentUsd": 2638,
  "annualInterestRatePct": 11.5
}
```
- **Response Rechazo de Política (422 Unprocessable Entity):**
```json
{
  "valid": false,
  "ltvPct": 55,
  "maxAllowedLoanUsd": 80000,
  "rejectionReason": "LTV solicitado (55%) supera la política institucional máxima del 40%."
}
```

---

### 2.2 Ingesta de Nueva Solicitud de Crédito
- **Método:** `POST /api/v1/applications`
- **Scope Requerido:** `write:applications`
- **Payload Request:**
```json
{
  "borrowerName": "Santiago Berriel",
  "borrowerEmail": "santiago@credisur.com.uy",
  "borrowerPhone": "+598 99 888 777",
  "requestedAmountUsd": 45000,
  "propertyEstimatedValueUsd": 130000,
  "propertyDepartment": "Maldonado",
  "propertyPadron": "142.508"
}
```
- **Response Exitosa (201 Created):**
```json
{
  "caseId": "API-SOL-849201",
  "tenantId": "tenant_credisur_enterprise_001",
  "status": "prequalified",
  "submittedAt": "2026-09-04T00:25:00Z",
  "accessTrackingUrl": "https://hipotecaly.vercel.app/mi-cuenta?caseId=API-SOL-849201"
}
```

---

## 3. WEBHOOKS & ENTREGA DE EVENTOS

HIPOTECALY despacha notificaciones HTTP POST en tiempo real hacia los endpoints configurados por el tenant:

### 3.1 Eventos Soportados
1. `application.created`: Cuando se registra un nuevo expediente (web o API).
2. `application.status_changed`: Cuando avanza de etapa (ej. pasa a underwriting).
3. `offer.created`: Cuando un inversor presenta una postura financiera formal.
4. `offer.accepted`: Cuando el prestatario acepta la oferta vinculante.
5. `document.verified`: Cuando el perito o Copilot validan un título o comprobante.

### 3.2 Firma Criptográfica de Seguridad (HMAC SHA-256)
Cada despacho incluye la cabecera:
```http
X-Hipotecaly-Signature: sha256=d3b07384d113edec49eaa6238ad5ff00...
```
Permitiendo al receptor validar la autenticidad e integridad del payload.
