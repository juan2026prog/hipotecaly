# HIPOTECALY — MATRIZ DE SEGURIDAD, RBAC & ENTERPRISE SSO (2026)

**Versión:** 1.0  
**Fecha:** Septiembre 2026  
**Fase:** Macrofase 7 (Enterprise + Integrations + Billing + Security + Commercial Go-Live)  

---

## 1. INTRODUCCIÓN

La seguridad en **HIPOTECALY** está diseñada bajo el principio de **Defensa en Profundidad (Defense in Depth)** y **Mínimo Privilegio (Least Privilege)**, cumpliendo estrictamente con la directiva `<RULE[user_global]>`:
- Cero almacenamiento de secretos en componentes cliente.
- Encriptación AES-256 en reposo y TLS 1.3 en tránsito.
- Row Level Security (RLS) mandatorio en todas las tablas de Supabase.

---

## 2. MATRIZ DE CONTROL DE ACCESO BASADO EN ROLES (RBAC)

| Capacidad / Recurso | Solicitante (`borrower`) | Inversor (`lender`) | Analista (`analyst`) | Admin Tenant (`admin`) | Super Admin (`super_admin`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Simulador & Solicitud Web** | ✅ Crear | ❌ | ✅ Crear | ✅ Crear | ✅ Acceso Total |
| **Portal "Mi Cuenta"** | ✅ Sus casos | ❌ | ❌ | ❌ | ❌ |
| **Feed de Oportunidades** | ❌ | ✅ Anonimizado | ✅ Completo | ✅ Completo | ✅ Global |
| **Emisión de Ofertas** | ❌ | ✅ Propias | ❌ | ❌ | ❌ |
| **Aceptación de Ofertas** | ✅ Sus ofertas | ❌ | ❌ | ❌ | ❌ |
| **Acceso a Datos de Contacto (Anti-Bypass)** | ✅ Sus datos | 🔒 Solo tras aceptación | ✅ Tenant | ✅ Tenant | ✅ Global |
| **Subida de Documentos** | ✅ Sus casos | ❌ | ✅ Tenant | ✅ Tenant | ✅ Global |
| **Copilot de IA & Riesgo** | ❌ | ❌ | ✅ Ejecutar | ✅ Configurar | ✅ Master Switch |
| **Gestión de Leads & CRM** | ❌ | ❌ | ✅ Gestionar | ✅ Gestionar | ✅ Global |
| **Facturación & Suscripción** | ❌ | ❌ | ❌ | ✅ Su factura | ✅ Toda la red |
| **Generación de API Keys** | ❌ | ❌ | ❌ | ✅ Sus llaves | ✅ Revocar cualquiera |
| **Configuración de Dominio / White-Label** | ❌ | ❌ | ❌ | ✅ Su branding | ✅ Global |

---

## 3. ESPECIFICACIÓN TÉCNICA DE SINGLE SIGN-ON (ENTERPRISE SSO)

Para organizaciones con más de 50 colaboradores o entidades financieras reguladas:

### 3.1 Proveedores de Identidad (IdP) Soportados
- **Microsoft Azure Active Directory (Entra ID)** vía SAML 2.0 / OpenID Connect.
- **Google Workspace Enterprise** vía OIDC.
- **Okta / Ping Identity** vía SAML 2.0.

### 3.2 Flujo de Autenticación
1. El usuario ingresa su correo electrónico corporativo (ej. `analista@financierax.com.uy`).
2. El sistema detecta el dominio `@financierax.com.uy` y redirige al IdP corporativo.
3. El IdP autentica las credenciales con 2FA institucional y emite una aserción SAML firmada.
4. HIPOTECALY valida la firma contra el certificado X.509 del tenant y asigna el rol según los grupos mapeados.
