# INFORME TÉCNICO Y COMERCIAL: DEMOSTRACIÓN VISUAL DE MODALIDADES DE INTEGRACIÓN B2B

**Plataforma:** HIPOTECALY Core  
**Entorno de Demostración:** Estudio Nova (/demo/estudio-nova)  
**Fecha:** 23 de Septiembre de 2026  
**Estado:** Implementado, Verificado y Desplegado en Producción  

---

## 1. RESUMEN EJECUTIVO

Se implementó el entorno visual interactivo de demostración de **Modalidades de Integración B2B** para empresas que ya cuentan con su propio sitio web institucional y desean integrar Hipotecaly.

### Arquitectura de Demostración:
- **Estudio Nova (/demo/estudio-nova)**: Representa la demostración de **Sitio Completo / FULL** (no se duplica ni se crea otra demo completa).
- **Selector de Integraciones (/demo/estudio-nova/integraciones)**: Punto de entrada comercial durante reuniones para presentar las dos modalidades sin alterar la configuración del sistema.
- **Modalidad A · EMBED (/demo/estudio-nova/integraciones/embebido)**: Simula la web existente de un cliente ("Inmobiliaria del Este") con el **Simulador Canónico Real** incrustado.
- **Modalidad B · BUTTON (/demo/estudio-nova/integraciones/boton)**: Simula la web existente de un cliente ("Desarrollos del Sur") con botón CTA que deriva al **Simulador Alojado Brandeado**.

Ambas modalidades utilizan el mismo motor de reglas, el mismo portal de solicitantes (/demo/estudio-nova/solicitar y /demo/estudio-nova/cliente) y el mismo backoffice operativo (/demo/estudio-nova/admin).

---

## 2. RUTAS CREADAS Y REUTILIZADAS

| Ruta | Propósito | Componente | Contexto de Organización |
|---|---|---|---|
| /demo/:tenantSlug/integraciones | Hub y Selector de Demostración de Integraciones | IntegrationDemoHubPage | Estudio Nova (d0000000-0000-0000-0000-000000000001) |
| /demo/:tenantSlug/integraciones/embebido | Demo A: Simulador Embebido + Botón | IntegrationEmbedDemoPage | Estudio Nova / Web Externa Demo |
| /demo/:tenantSlug/integraciones/boton | Demo B: Solo Botón | IntegrationButtonDemoPage | Estudio Nova / Web Externa Demo |
| /demo/:tenantSlug/accesos | Hub Central de Accesos Demo con sección de Integraciones | EstudioNovaAccessHubPage | Estudio Nova |
| /demo/:tenantSlug/simulador | Simulador Alojado Canónico Brandeado | TenantSimulatorPage | Estudio Nova |
| /demo/:tenantSlug/solicitar | Wizard Digital de Solicitud de Expediente | TenantWizardPage / ApplicationWizard | Estudio Nova |
| /demo/:tenantSlug/cliente | Portal de Autogestión del Solicitante | ApplicantAccount | Estudio Nova |
| /demo/:tenantSlug/admin | Backoffice Operativo y de Gestión | DashboardPage / Backoffice Suite | Estudio Nova |

---

## 3. COMPONENTES REUTILIZADOS Y CERO DUPLICACIÓN DE LÓGICA

1. **CanonicalTenantSimulator (src/components/simulator/CanonicalTenantSimulator.tsx)**:
   - Componente canónico reutilizable para integración embebida y páginas de cotización.
   - Conectado reactivamente al servicio de reglas crediticias (getTenantLendingRules).
   - Mismas fórmulas financieras de LTV, cuotas amortizables / solo intereses y validaciones.
2. **DemoSalesModeBar (src/components/demo/DemoSalesModeBar.tsx)**:
   - Barra flotante de presentación comercial con acceso directo a Modos Integración.
3. **TenantContext (src/contexts/TenantContext.tsx)**:
   - Resolución canónica del tenant preservada en todas las transiciones.
4. **ApplicationWizard (src/pages/wizard/ApplicationWizard.tsx)**:
   - Mismo formulario estructurado receptor de parámetros monto, alor_propiedad, plazo, modalidad, source y source_mode.

---

## 4. DESCRIPCIÓN VISUAL DE LAS DOS DEMOS

### Opción A — SIMULADOR EMBEBIDO + BOTÓN
- **Superficie:** Simula el sitio web institucional de "Inmobiliaria del Este".
- **Comportamiento:** 
  - La persona interactúa con el cotizador directamente en la página de la inmobiliaria.
  - El cotizador calcula cuota en USD, valida topes de LTV y monto máximo en tiempo real.
  - Al presionar **CONTINUAR SOLICITUD**, el usuario pasa al Wizard de Solicitud con todos los valores precargados bajo la marca y reglas de **Estudio Nova**.
- **Barra de Presentación:** Incluye botones rápidos para:
  - ← Volver a Modos de Integración
  - Probar Solo Botón
  - Sitio Completo (Estudio Nova)

### Opción B — SOLO BOTÓN
- **Superficie:** Simula el sitio web de "Desarrollos del Sur".
- **Comportamiento:**
  - La web externa solo presenta un llamado a la acción: **SOLICITAR FINANCIACIÓN**.
  - Al presionar el botón, el usuario es redirigido a la página de simulación pública alojada por Hipotecaly con el branding integral de **Estudio Nova** (logo, colores institucionales, teléfonos de soporte y reglas).
  - Al simular y presionar continuar, avanza al Portal del Solicitante.
- **Barra de Presentación:** Mantiene la navegación fluida para exposiciones comerciales.

---

## 5. FLUJOS PROBADOS Y RESULTADOS E2E

Se implementó y ejecutó la suite automatizada 	ests/integration-modes-visual-demo.spec.ts:

1. **DEMO TEST 0 (Selector de Modos de Integración):**
   - Comprueba que el selector muestre únicamente [ SIMULADOR + BOTÓN ] y [ SOLO BOTÓN ].
   - Confirma que **NO** se incluya una tercera tarjeta de "Sitio completo", respetando que Estudio Nova ya es esa demostración.
2. **DEMO TEST 1 (Simulador Embebido + Botón):**
   - Simulación reactiva en tiempo real en la web simulada.
   - Verificación de LTV y cuota mensual calculada.
   - Navegación al Wizard con parámetros (monto, alor_propiedad, source=embed_demo, source_mode=embed).
   - Identidad visual de Estudio Nova preservada.
3. **DEMO TEST 2 (Solo Botón):**
   - Clic en SOLICITAR FINANCIACIÓN.
   - Apertura del simulador alojado bajo la marca Estudio Nova.
   - Continuación hacia el portal del solicitante.
4. **DEMO TEST 3 (Aislamiento y Alternancia en Presentación Comercial):**
   - Transiciones directas entre Demo A, Demo B, Selector y Sitio Completo.
   - Verificación de ausencia de contaminación de sesión o pérdida de contexto de organización.

---

## 6. CONFIRMACIONES CLAVE DE ARQUITECTURA

- **Mismo Core:** Ambas modalidades ejecutan el mismo motor de cotización, originación y gestión.
- **Cero duplicación:** No se crearon nuevos backoffices, portales de cliente ni bases de datos paralelas.
- **Aislamiento de marca:** El solicitante final siempre opera bajo la identidad corporativa de la organización (Estudio Nova), sin filtraciones de branding genérico.
- **Modo Presentación Operativo:** Navegación en 1 clic entre todas las vistas para demostraciones comerciales en vivo.
