# HIPOTECALY — DEMO ACCESS MATRIX

Esta matriz define y audita exhaustivamente los niveles de acceso para todas las rutas y experiencias de HIPOTECALY, separando con absoluta precisión la **Demo Pública**, el **Gate Comercial**, las **Demos Guiadas / Entornos Autorizados** y las **Organizaciones en Producción**.

---

## 1. Clasificación Canónica de Accesos

| Categoría | Definición | Requisitos de Autenticación | Comportamiento |
| :--- | :--- | :--- | :--- |
| **PUBLIC_DEMO** | Rutas institucionales y exploratorias públicas de HIPOTECALY y de la organización demo (Estudio Nova, Button Demo, Embed Demo). | Anónimo (Ninguno) | Libre navegación, uso del simulador interactivo hasta el resultado preliminar. |
| **COMMERCIAL_GATE** | Punto de conversión comercial cuando un visitante público intenta avanzar tras simular o acceder a zonas internas no autorizadas. | N/A (Modal / Panel interactivo) | Muestra el gate comercial con contexto y ofrece "Solicitar Demo" o "Seguir Explorando". |
| **AUTHENTICATED_DEMO**| Acceso completo guiado al portal de solicitante, escribanía, inversores y backoffice demo para presentaciones comerciales y QA. | Autenticado con credenciales demo o sesión de prueba autorizada | Recorrido operativo funcional dentro del tenant demo sin alterar organizaciones de producción. |
| **PRODUCTION** | Rutas de organizaciones reales y prestatarios productivos. | Autenticado + Membresía de Tenant / Borrower | Flujo 100% operativo real sin ningún gate comercial. |
| **SUPERADMIN** | Consola central de administración de plataforma. | Super Admin Global | Gestión de tenants, módulos, calibración y seguridad. |

---

## 2. Matriz Detallada de Rutas

| ROUTE | CURRENT ACCESS | EXPECTED ACCESS | AUTH REQUIRED | ORGANIZATION CONTEXT | ACTION REQUIRED |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | PUBLIC_DEMO | PUBLIC_DEMO | No | Root / Tenant dinámico | Mantener público |
| `/simulador` | PUBLIC_DEMO | PUBLIC_DEMO | No | Central / Tenant | Título: "Simulá tu financiación". Conectar con DemoCommercialGate si no hay org productiva. |
| `/como-funciona` | PUBLIC_DEMO | PUBLIC_DEMO | No | General | Mantener público |
| `/preguntas-frecuentes` | PUBLIC_DEMO | PUBLIC_DEMO | No | General | Mantener público |
| `/nosotros` | PUBLIC_DEMO | PUBLIC_DEMO | No | General | Mantener público |
| `/contacto` | PUBLIC_DEMO | PUBLIC_DEMO | No | General | Recibir source (`simulador`, `button-demo`, `embed-demo`, `estudio-nova`, `backoffice`) y preconfigurar consulta. |
| `/saas` | PUBLIC_DEMO | PUBLIC_DEMO | No | B2B General | Actualizar presentación a 3 modalidades: 01 Solo Botón, 02 Simulador Embebido, 03 Sitio Completo. Aclarar que White Label es transversal a todas. |
| `/saas/modulos` | PUBLIC_DEMO | PUBLIC_DEMO | No | B2B General | Mantener público |
| `/saas/integracion` | PUBLIC_DEMO | PUBLIC_DEMO | No | B2B General | Explicar las modalidades de integración y enlazar a las demos interactivas. |
| `/saas/plataforma-completa` | PUBLIC_DEMO | PUBLIC_DEMO | No | B2B General | Explicar la modalidad 03 Sitio Completo. |
| `/saas/precios` | PUBLIC_DEMO | PUBLIC_DEMO | No | B2B General | Mantener público |
| `/empresas/prestamistas` | PUBLIC_DEMO | PUBLIC_DEMO | No | B2B Vertical | Mantener público |
| `/empresas/financieras` | PUBLIC_DEMO | PUBLIC_DEMO | No | B2B Vertical | Mantener público |
| `/empresas/estudios` | PUBLIC_DEMO | PUBLIC_DEMO | No | B2B Vertical | Mantener público |
| `/demo/estudio-nova` | PUBLIC_DEMO | PUBLIC_DEMO | No | `estudio-nova` | Mantener 100% público. Simulador interactivo en página activa el gate al pulsar "Continuar solicitud". |
| `/demo/estudio-nova/simulador` | PUBLIC_DEMO | PUBLIC_DEMO | No | `estudio-nova` | Simulador alojado público completo de 3 pasos / cálculo en vivo. Al pulsar "Continuar solicitud" -> activa Commercial Gate. |
| `/demo/estudio-nova/integraciones` | PUBLIC_DEMO | PUBLIC_DEMO | No | `estudio-nova` | Hub de selección de integración interactiva (Solo Botón, Embebido, Sitio Completo). |
| `/demo/estudio-nova/integraciones/boton` | PUBLIC_DEMO | PUBLIC_DEMO | No | Web Externa Ficticia | Demo 01 Solo Botón: Web externa con botón CTA -> abre simulador alojado brandeado -> Gate en Continuar Solicitud. |
| `/demo/estudio-nova/integraciones/embebido` | PUBLIC_DEMO | PUBLIC_DEMO | No | Web Externa Ficticia | Demo 02 Simulador Embebido: Web externa con cotizador canónico integrado -> Gate en Continuar Solicitud. |
| `/demo/estudio-nova/solicitar` | AUTHENTICATED_DEMO / GATE | AUTHENTICATED_DEMO / COMMERCIAL_GATE | Sí (si anónimo -> Gate Comercial) | `estudio-nova` | Visitantes públicos anónimos no deben crear solicitudes huérfanas en demo pública; el botón Continuar Solicitud abre el Gate Comercial. |
| `/demo/estudio-nova/cliente` | AUTHENTICATED_DEMO | AUTHENTICATED_DEMO | Sí (`borrower`, `super_admin`) | `estudio-nova` | Acceso directo no autenticado muestra Gate Comercial controlado ("Conocé el Portal del Solicitante"). |
| `/demo/estudio-nova/admin` | AUTHENTICATED_DEMO | AUTHENTICATED_DEMO | Sí (`tenant_admin`, `analyst`, etc.) | `estudio-nova` | Acceso directo no autenticado muestra Gate Comercial controlado ("Conocé el Backoffice de Hipotecaly"). |
| `/demo/estudio-nova/admin/*` | AUTHENTICATED_DEMO | AUTHENTICATED_DEMO | Sí (`tenant_admin`, `analyst`, etc.) | `estudio-nova` | Protegido con ProtectedRoute. Intento anónimo -> Gate comercial seguro sin fuga de datos. |
| `/demo/estudio-nova/notary` | AUTHENTICATED_DEMO | AUTHENTICATED_DEMO | Sí (`notary`, `super_admin`) | `estudio-nova` | Protegido con ProtectedRoute. |
| `/demo/estudio-nova/inversor` | AUTHENTICATED_DEMO / PUBLIC LEAD | AUTHENTICATED_DEMO / PUBLIC LEAD | Mixto (Lead capture público o Dashboard autenticado) | `estudio-nova` | Captación pública protegida. Dashboard requiere auth. |
| `/org/:tenantSlug/admin` | PRODUCTION | PRODUCTION | Sí (`tenant_admin`, `analyst`, `super_admin`) | Tenant Real | Flujo 100% real de producción sin gates comerciales. |
| `/org/:tenantSlug/admin/*` | PRODUCTION | PRODUCTION | Sí (`tenant_admin`, `analyst`, `super_admin`) | Tenant Real | Flujo 100% real de producción sin gates comerciales. |
| `/superadmin` | SUPERADMIN | SUPERADMIN | Sí (`super_admin`) | Central | Consola global protegida. |
| `/superadmin/*` | SUPERADMIN | SUPERADMIN | Sí (`super_admin`) | Central | Consola global protegida. |

---

## 3. Principio de Blindaje de Producción

1. **Producción Intacta:** Cuando un usuario opera bajo una organización real (`tenant.id !== DEMO_ORGANIZATION_ID` y `is_demo === false`), el botón `Continuar solicitud` avanza directamente al Wizard y expediente real.
2. **Demo Control Centralizado:** La detección de contexto se realiza a través de `isDemoMode({ organizationId, organizationSlug, pathname })` garantizando coherencia en toda la arquitectura.
3. **No Data Leaks:** Las rutas internas `/demo/:tenantSlug/admin/*` están protegidas tanto a nivel frontend con `ProtectedRoute` como a nivel RLS y Server Actions.
