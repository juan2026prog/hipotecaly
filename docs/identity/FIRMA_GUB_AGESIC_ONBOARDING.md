# Checklist Oficial para Solicitud de Acceso e Integración a Firma.gub.uy (AGESIC)

Este documento detalla los requerimientos técnicos y administrativos que deben solicitarse a la **Agencia de Gobierno Electrónico y Sociedad de la Información y del Conocimiento (AGESIC)** de Uruguay para habilitar la conexión LIVE / Homologación con la plataforma **Firma.gub.uy** (Ley N° 18.600).

---

## 1. Datos a Solicitar a AGESIC

| Parámetro | Requerimiento / Campo | Estado |
| :--- | :--- | :---: |
| **Ambiente** | Homologación (Testing/Sandbox) / Producción | `[ ]` |
| **API Gateway Base URL** | Host REST para APIs externas (ej. `https://.../api/v1/externos`) | `[ ]` |
| **Portal Ciudadano URL** | Host para interfaz de firma ciudadana (ej. `https://.../es/pp/firmar`) | `[ ]` |
| **Método Auth API Manager** | `none` \| `bearer` \| `oauth2_client_credentials` | `[ ]` |
| **Client ID** | Identificador de aplicación en API Manager | `[ ]` |
| **Client Secret** | Secreto de aplicación en API Manager (Server-only) | `[ ]` |
| **Scope OAuth** | Alcance de permisos asignados en el API Manager | `[ ]` |
| **Token Endpoint** | URL para solicitar el `access_token` OAuth2 | `[ ]` |
| **Método de Callback** | `POST` y/o `GET` en el webhook receptor | `[ ]` |
| **IP Whitelisting** | Rangos de IP origen de Vercel/Servidor a autorizar en firewall | `[ ]` |
| **Certificados TLS / mTLS** | Requisitos de CA / Mutual TLS en caso de aplicar | `[ ]` |
| **Límites de Tasa (Rate Limits)** | Requests permitidos por minuto / ráfaga | `[ ]` |
| **Tamaño Máximo de PDF** | Límite en MB por archivo en Proceso 1 y Proceso 2 | `[ ]` |
| **Procedimiento a Producción** | Requisitos de homologación y pase formal a producción | `[ ]` |

---

## 2. Configuración en Hipotecaly / SiteOS

Una vez provistos los valores por AGESIC, configurar las siguientes variables de entorno seguras (Vercel Server-Side):

```env
# Proveedor y Modo
SIGNATURE_PROVIDER=firma_gub
SIGNATURE_MODE=test # Cambiar a 'live' únicamente al pasar a producción

# Endpoints Oficiales
FIRMA_GUB_API_BASE_URL=https://[GATEWAY_AGESIC_HOST]
FIRMA_GUB_SIGN_BASE_URL=https://[PORTAL_FIRMA_AGESIC_HOST]
FIRMA_GUB_API_PREFIX=/api/v1/externos
FIRMA_GUB_STATUS_METHOD=GET
FIRMA_GUB_PROCESS2_TRANSPORT=multipart

# API Manager Gateway Auth (Server-only)
FIRMA_GUB_API_MANAGER_AUTH_MODE=oauth2_client_credentials
FIRMA_GUB_API_MANAGER_TOKEN_URL=https://[API_MANAGER_HOST]/oauth/token
FIRMA_GUB_API_MANAGER_CLIENT_ID=[CLIENT_ID]
FIRMA_GUB_API_MANAGER_CLIENT_SECRET=[CLIENT_SECRET]
FIRMA_GUB_API_MANAGER_SCOPE=[SCOPE]

# URLs Públicas de Hipotecaly
FIRMA_GUB_RETURN_URL=https://hipotecaly.vercel.app/signature/return
FIRMA_GUB_NOTIFICATION_URL=https://hipotecaly.vercel.app/api/integrations/signature/firma-gub/webhook
```

---

## 3. Matriz de Validación de Acceso

1. **Test Conexión Segura**:
   - `GET /api/integrations/signature/health`
   - Consulta no destructiva a `GET /api/v1/info/version`.
2. **Prueba en Homologación**:
   - Crear proceso de prueba en DocFlow con documento de test.
   - Firmar con TuID Antel QA o Cédula de Identidad de pruebas.
   - Verificar recepción de webhook y descarga de PDF firmado.
   - Validar hashes `sha256_original` y `sha256_signed`.
3. **Pase a Producción**:
   - Ajustar `SIGNATURE_MODE=live` en Vercel.
   - Ejecutar verificación final sin exponer secretos.
