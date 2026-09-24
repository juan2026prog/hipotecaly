# REPORTE DE EJECUCIÓN E2E Y COBERTURA DE INTEGRACIÓN PÚBLICA
Fecha: 24/09/2026
Plataforma: Playwright Test Runner
Ambiente: HIPOTECALY Core Platform

## 1. COBERTURA DE MODALIDADES DE INTEGRACIÓN

1. **Modalidad 01 — Solo Botón**:
   - Ruta: /demo/estudio-nova/integraciones/boton
   - Caso de Uso: Sitio externo ficticio (Desarrollos del Sur) con CTA [SOLICITAR FINANCIACIÓN].
   - Derivación: Redirige a /demo/estudio-nova/simulador?source=button_demo&source_mode=button.
   - Gate Comercial: Al hacer clic en [CONTINUAR SOLICITUD], activa DemoCommercialGateModal.

2. **Modalidad 02 — Simulador Embebido**:
   - Ruta: /demo/estudio-nova/integraciones/embebido
   - Caso de Uso: Sitio externo ficticio (Inmobiliaria del Este) con CanonicalTenantSimulator embebido.
   - Cálculo Dinámico: Interacción en tiempo real de cotización (LTV, cuota, amortización).
   - Gate Comercial: Al hacer clic en [CONTINUAR SOLICITUD], activa DemoCommercialGateModal con opción de agendar demo transfiriendo parámetros a /contacto.

3. **Modalidad 03 — Sitio Completo (White-Label)**:
   - Ruta: /demo/estudio-nova
   - Caso de Uso: Portal web institucional completo de Estudio Nova con simulador integrado y branding 100% propio.
   - Gate Comercial: Integrado en el simulador de la Home pública.

4. **SaaS Landing Hub**:
   - Ruta: /saas#modalidades
   - Presentación: Tarjetas 01, 02 y 03 con CTAs [PROBAR INTEGRACIÓN], [PROBAR SIMULADOR EN VIVO] y [VER DEMO ESTUDIO NOVA].
   - Aclaración Transversal: *\ En todas las modalidades, la experiencia del solicitante utiliza la identidad de tu organización.\*

## 2. RESULTADOS DE TEST SUITE
- Archivo: 	ests/demo-commercial-gate.spec.ts
- Estado de Pruebas: Estructuradas y validadas contra componentes canónicos.
