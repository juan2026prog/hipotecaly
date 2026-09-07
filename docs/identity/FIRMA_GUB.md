# Integración Oficial Firma.gub.uy (AGESIC - Uruguay)

Este documento certifica la arquitectura, contratos de API, payloads y seguridad para la integración con la plataforma de firma digital avanzada del gobierno uruguayo **Firma.gub.uy** (AGESIC - Presidencia de la República Oriental del Uruguay), conforme a la **Ley N° 18.600**.

---

## 1. Fuentes de Verdad Oficiales

1. **Manual de integración para consumo APIs Firma.gub.uy**:
   [AGESIC Publicaciones](https://www.gub.uy/agencia-gobierno-electronico-sociedad-informacion-conocimiento/comunicacion/publicaciones/manual-integracion-para-consumo-apis-firmagubuy/manual-integracion-para)
2. **Repositorio Oficial**:
   [https://github.com/agesic/firma.gub.uy](https://github.com/agesic/firma.gub.uy)
3. **Colección Postman Oficial**:
   `Documentos/Manuales de Integración/firma.gub.uy-sistemas-externos-postman-collection 11-07-2022 V1.0.json`
4. **Guía de API Manager**:
   *Consumo de APIs publicadas en API MANAGER.pdf* (AGESIC).

---

## 2. Arquitectura de Endpoints y Discrepancias Documentales

### 2.1 Base URLs Separadas
Se separa estrictamente la URL del Gateway/API Manager de la URL del portal ciudadano de firma:
- **`FIRMA_GUB_API_BASE_URL`**: Gateway / API Manager para REST endpoints.
- **`FIRMA_GUB_SIGN_BASE_URL`**: Host utilizado para construir la URL de redirección ciudadana (`/es/pp/firmar`).

### 2.2 Prefijo de API (`FIRMA_GUB_API_PREFIX`)
- **Default**: `/api/v1/externos` (conforme a la colección Postman oficial y ejemplos de integración).
- **Configurable**: Soporta `/api/externos` u otras versiones según ambiente AGESIC.

### 2.3 Matriz de Endpoints y Discrepancias Documentales Resueltas

| Operación | Método HTTP | Path Oficial | Headers | Casing / Payload |
| :--- | :--- | :--- | :--- | :--- |
| **Proceso 1** (Carga Directa Base64) | `POST` | `{API_BASE}{API_PREFIX}/proceso1` | `Content-Type: application/json` | camelCase (`nombreSistema`, `cantidadFirmantes`, `archivos`, `detalleFirmantes`) |
| **Proceso 2: Carga Archivo** | `POST` | `{API_BASE}{API_PREFIX}/archivo` | `multipart/form-data` o `application/octet-stream` con `Content-Disposition` | Archivo binario o form field `archivo` |
| **Proceso 2: Creación** | `POST` | `{API_BASE}{API_PREFIX}/proceso2` | `Content-Type: application/json` | camelCase con `archivos: [{ id }]` |
| **Consulta Estado** | `GET` (Fallback `HEAD`) | `{API_BASE}{API_PREFIX}/estado/{identificador}` | `Authorization: {claveSeguridad}` **(SIN Bearer)** | Respuesta JSON `{ estado: "FINALIZADO" \| "RECHAZADO" \| ... }` |
| **Descarga Todos** | `GET` | `{API_BASE}{API_PREFIX}/archivos/{identificador}` | `Authorization: {claveSeguridad}` **(SIN Bearer)** | Lista JSON `[{ nombre, contenido: "<base64>" }]` |
| **Descarga Individual** | `GET` | `{API_BASE}{API_PREFIX}/archivo/{fileId}` | `Authorization: {claveSeguridad}` **(SIN Bearer)** | Binario con `Content-Disposition` |
| **Portal Ciudadano Firma** | Redirección Browser | `{SIGN_BASE}/es/pp/firmar?id={identificador}&pass={claveSeguridad}` | N/A | Construida server-side. `pass` jamás expuesto en logs. |
| **Webhook Notificación** | `POST` | `/api/integrations/signature/firma-gub/webhook` | `Content-Type: application/json` | `{ identificador, estado }` |
| **Health Check** | `GET` | `{API_BASE}/api/v1/info/version` | Opcional Gateway Auth | Verificación segura sin crear procesos |

---

## 3. Procesos de Firma

### Proceso 1: Carga y Creación en un Paso (PDFs Base64)
Utilizado para contratos generados por DocFlow donde los documentos se codifican en Base64 directamente:
```json
{
  "nombreSistema": "HIPOTECALY_DOCFLOW",
  "cantidadFirmantes": 1,
  "fechaExpiracion": "31/12/2026 23:59:59",
  "urlNotificacion": "https://hipotecaly.vercel.app/api/integrations/signature/firma-gub/webhook",
  "urlRetorno": "https://hipotecaly.vercel.app/signature/return",
  "archivos": [
    {
      "nombre": "Contrato_Mutuo_Hipotecario.pdf",
      "contenido": "JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmo..."
    }
  ],
  "detalleFirmantes": [
    {
      "orden": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.uy",
      "documento": "41234567",
      "pais": "UY",
      "tipoDocumento": "CI"
    }
  ]
}
```

### Proceso 2: Carga Individual de Archivos Grandes + Creación
1. **Paso A (`POST /archivo`)**: Carga de cada documento recibiendo `{ "idArchivo": "uuid-123" }`.
2. **Paso B (`POST /proceso2`)**: Creación del proceso referenciando `archivos: [{ "id": "uuid-123" }]`.

---

## 4. Normalización de Respuestas y Seguridad de `claveSeguridad`

La respuesta oficial de creación de AGESIC devuelve:
- `identificador`: Identificador único del proceso.
- `claveSeguridad`: Secreto criptográfico del proceso.
- `fechaExpiracion`: Fecha límite de firma.

El adapter normaliza estas propiedades a:
- `providerProcessId`
- `securityKey`
- `expiresAt`

> [!CAUTION]
> **Confidencialidad de `claveSeguridad`**:
> - La `claveSeguridad` es un secreto exclusivo de backend.
> - **NUNCA** debe enviarse a frontend, componentes React, `localStorage`, analíticas ni logs.
> - En logs se redacta automáticamente a `[REDACTED]`.
> - Se almacena cifrada en `signature_processes.security_secret_encrypted`.

---

## 5. API Manager de AGESIC (`FirmaGubGatewayAuthProvider`)

Cuando AGESIC requiere una capa de autenticación a nivel de Gateway perimetral (WSO2 / API Manager):
- **Modos soportados**:
  1. `none`: Conexión directa / ambiente de pruebas sin API Manager.
  2. `bearer`: Token estático de gateway.
  3. `oauth2_client_credentials`: Flujo estándar OAuth2 Client Credentials con obtención automática de `access_token`, caché en memoria y renovación transparente antes de expiración.

Variables dedicadas:
```env
FIRMA_GUB_API_MANAGER_AUTH_MODE=none | bearer | oauth2_client_credentials
FIRMA_GUB_API_MANAGER_TOKEN_URL=https://apimanager.agesic.gub.uy/oauth/token
FIRMA_GUB_API_MANAGER_CLIENT_ID=
FIRMA_GUB_API_MANAGER_CLIENT_SECRET=
FIRMA_GUB_API_MANAGER_SCOPE=
FIRMA_GUB_API_MANAGER_BEARER_TOKEN=
```

---

## 6. Flujo de Notificación Webhook y Verificación

1. **Recepción Webhook**: Firma.gub envía `{ identificador, estado }` a `/api/integrations/signature/firma-gub/webhook`.
2. **Idempotencia**: Verificación por hash de payload en `provider_webhook_events`.
3. **No Confianza Ciega**: El servicio consulta nuevamente el estado oficial mediante `GET /estado/{identificador}` usando la `claveSeguridad`.
4. **Descarga Criptográfica**: Si el estado es `FINALIZADO`, se descargan los archivos firmados desde `/archivos/{identificador}`.
5. **Validación de Cabecera PDF**: Se verifican los magic bytes `%PDF-` (`0x25 0x50 0x44 0x46`).
6. **Cálculo SHA-256**: Se genera el `sha256_signed` de cada documento para auditoría.
7. **Actualización DocFlow**: Se actualiza `generated_documents` y `signature_documents` a estado `signed`.
8. **EventBus**: Emisión de evento interno `signature.process.completed`.

---

## 7. Variables de Entorno

| Variable | Descripción | Entorno / Ámbito |
| :--- | :--- | :--- |
| `FIRMA_GUB_API_BASE_URL` | Base URL del Gateway/API Manager | Server-only |
| `FIRMA_GUB_SIGN_BASE_URL` | Base URL del portal de firma `/es/pp/firmar` | Server-only |
| `FIRMA_GUB_API_PREFIX` | Prefijo de API (Default: `/api/v1/externos`) | Server-only |
| `FIRMA_GUB_STATUS_METHOD` | Método para estado: `GET` o `HEAD` (Default: `GET`) | Server-only |
| `FIRMA_GUB_PROCESS2_TRANSPORT` | Transporte de archivos: `multipart` o `binary` | Server-only |
| `FIRMA_GUB_RETURN_URL` | URL de retorno en navegador | Server-only |
| `FIRMA_GUB_NOTIFICATION_URL` | URL del webhook de notificación | Server-only |
| `FIRMA_GUB_API_MANAGER_AUTH_MODE` | Modo auth gateway (`none`, `bearer`, `oauth2_client_credentials`) | Server-only |
| `SIGNATURE_MODE` | Modo (`mock`, `test`, `live`) | Server / Client |

---

## 8. Ambientes: Homologación vs Producción

- **Homologación AGESIC (Sandbox / Testing)**:
  - URLs de prueba provistas por AGESIC en el trámite de integración.
  - Permite pruebas con certificados de test, TuID Antel QA y Cédula de prueba.
- **Producción AGESIC**:
  - Requiere aprobación formal del formulario de solicitud de consumo de APIs y alta en API Manager de AGESIC.
  - Firma con plena validez legal bajo Ley N° 18.600.

---

## 9. External Access Required (Requerimientos de AGESIC)

Para activar el modo `test` / `live`, AGESIC debe entregar a la organización los siguientes datos concretos (consultar [Checklist de Onboarding](./FIRMA_GUB_AGESIC_ONBOARDING.md)):

1. **API Base URL**: URL del Gateway REST oficial (ej. `https://gateway.agesic.gub.uy`).
2. **Sign Portal Base URL**: Host público del portal ciudadano (ej. `https://firmagub.agesic.gub.uy`).
3. **API Manager Auth Type**: Tipo de autenticación perimetral (`oauth2_client_credentials` o `bearer`).
4. **Client / Application Credentials**: `CLIENT_ID` y `CLIENT_SECRET` provistos en la consola de API Manager de AGESIC.
5. **Token Endpoint**: URL de emisión de tokens OAuth2 (ej. `https://apimanager.agesic.gub.uy/oauth/token`).
6. **Callback Method**: Método preferido para notificaciones (`POST` o `GET`, ambos soportados por Hipotecaly).
7. **IP Allowlisting**: Requisitos de firewall o IP de origen si aplican.
8. **TLS / Client Certificates**: Si el ambiente exige mutual TLS o certificados de cliente.
9. **File Size Limits**: Límite de tamaño de PDF en MB para Proceso 1 vs Proceso 2.
10. **Production Onboarding Procedure**: Protocolo administrativo de homologación para pase a producción.

