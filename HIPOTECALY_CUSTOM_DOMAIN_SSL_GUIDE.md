# HIPOTECALY — GUÍA DE CONFIGURACIÓN DE DOMINIOS PERSONALIZADOS & SSL (2026)

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Fase:** Macrofase 7 (Enterprise + Integrations + Billing + Security + Commercial Go-Live)  

---

## 1. INTRODUCCIÓN

El módulo White-Label Avanzado de **HIPOTECALY** permite a financieras, bancos y estudios notariales operar la plataforma bajo su propio dominio institucional (por ejemplo, `creditos.tuempresa.com.uy` o `portal.inversionesdeleste.uy`).

---

## 2. PROCESO DE CONFIGURACIÓN EN 3 PASOS

### Paso 1: Configuración de Registros DNS en el Proveedor del Cliente
El administrador de sistemas del cliente debe crear dos registros en su zona DNS (Cloudflare, AWS Route 53, GoDaddy, Antel, etc.):

1. **Registro CNAME (Enrutamiento de Tráfico):**
   - **Host / Nombre:** `creditos` (o el subdominio elegido)
   - **Tipo:** `CNAME`
   - **Destino:** `cname.vercel-dns.com` o `custom.hipotecaly.com`
   - **TTL:** Automático o 300 segundos

2. **Registro TXT (Validación de Propiedad y Emisión de Certificado SSL):**
   - **Host / Nombre:** `_hipotecaly-challenge.creditos.tuempresa.com.uy`
   - **Tipo:** `TXT`
   - **Valor:** `hpt-verify-d0000000-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (provisto en el Backoffice)

---

### Paso 2: Aprovisionamiento Automatizado de Certificados TLS/SSL
Una vez propagados los registros DNS:
1. El motor de infraestructura emite automáticamente un certificado TLS v1.3 emitido por **Let's Encrypt** o **ZeroSSL**.
2. Renovación 100% automática cada 60 días sin corte de servicio ni intervención manual.
3. HSTS (HTTP Strict Transport Security) forzado con redirección automática de HTTP a HTTPS.

---

### Paso 3: Resolución Dinámica de Tenant por Encabezado Host
Cuando una petición llega a la infraestructura:
1. El middleware serverless inspecciona la cabecera HTTP `Host` (ej. `creditos.tuempresa.com.uy`).
2. Consulta la tabla `tenants` en Supabase buscando coincidencia con el campo `custom_domain`.
3. Inyecta el contexto del tenant en el frontend y backend para renderizar la paleta de colores, logotipo, políticas crediticias y catálogo de productos específico de esa organización.
4. Si el dominio no está registrado o fue suspendido por mora, aplica fallback seguro sin revelar datos de otras organizaciones.
