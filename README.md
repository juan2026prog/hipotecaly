# HIPOTECALY — Plataforma Tecnológica de Financiación Hipotecaria

Plataforma PropTech/FinTech multi-tenant de intermediación y gestión tecnológica de préstamos con garantía hipotecaria en Uruguay.

HIPOTECALY opera con dos líneas comerciales sobre un mismo núcleo tecnológico:
1. **Marketplace HIPOTECALY (`/`)**: Dirigido a propietarios e inversores que necesitan financiación ágil y acompañada utilizando su inmueble como garantía.
2. **HIPOTECALY SaaS / White Label (`/plataforma`)**: Dirigido a estudios jurídicos, notariales, financieras, brokers e instituciones de crédito que buscan digitalizar su captación, análisis crediticio y administración de expedientes.

---

## 🏗️ Arquitectura del Sistema

```
                   HIPOTECALY
                       │
           ┌───────────┴───────────┐
           │                       │
      MARKETPLACE                 SaaS
       (Borrowers)              (Tenants)
           │                       │
           └───────────┬───────────┘
                       │
                CORE HIPOTECALY
      ┌────────────────┼─────────────────┐
      │                │                 │
 Solicitudes      Propiedades        Documentos
      │                │                 │
      ├──────────── Expedientes ─────────┤
      │                                  │
 Prestamistas ── Rules ── Matching ── Ofertas
      │
 Data Masking & Disclosures
      │
 Audit Logs & Notifications
                       │
             PostgreSQL / Auth / RLS
                Storage / Functions
                       │
               Vite + React (PWA)
```

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, Vite 6, TypeScript (strict mode), Tailwind CSS, React Router v6, Lucide Icons.
- **PWA**: `vite-plugin-pwa`, Service Worker con política segura de no cacheo de datos confidenciales, Manifest standalone, soporte offline (`OfflineNotice`).
- **Base de Datos & Auth**: PostgreSQL con Supabase (23 tablas multi-tenant, Row Level Security estricta, triggers de auditoría e IDs legibles `HIP-YYYY-XXXXX`).
- **Deploy**: Preparado para Vercel con rewrites SPA y headers de seguridad HTTP (`vercel.json`).

---

## 🚀 Puesta en Marcha Local

### 1. Clonar e instalar dependencias
```bash
git clone <repo-url>
cd Hipotecaly
npm install
```

### 2. Configurar variables de entorno
Copiar `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```
Completar con las credenciales públicas de Supabase:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=tu-anon-key-local
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

### 4. Compilación y Linting
```bash
# Compilar TypeScript y bundle de producción (PWA)
npm run build

# Analizar código con ESLint 9
npm run lint
```

---

## 📂 Estructura del Proyecto

```
/Hipotecaly
├── docs/
│   └── SUPABASE_CLOUD_MIGRATION.md  # Guía de migración Local -> Cloud
├── public/
│   ├── favicon.svg                  # Isotipo oficial HIPOTECALY
│   ├── pwa-192x192.png              # Icono PWA
│   ├── pwa-512x512.png              # Icono PWA maskable
│   └── robots.txt                   # Directivas SEO y protección de rutas privadas
├── src/
│   ├── components/
│   │   ├── layout/                  # Navbar, SaaSNavbar, Footer
│   │   ├── mockups/                 # DashboardMockup, MobileTrackerMockup (HTML/CSS)
│   │   └── ui/                      # Button, Card, Badge, Input, CurrencyInput, OfflineNotice
│   ├── lib/
│   │   ├── pilotRules.ts            # Motor de reglas y evaluación del prestamista piloto
│   │   ├── supabase.ts              # Cliente Supabase seguro
│   │   └── types.ts                 # Modelos de datos TypeScript
│   ├── pages/
│   │   ├── MarketplaceHome.tsx      # Portada Marketplace (Imagen 1)
│   │   ├── SaaSHome.tsx             # Portada SaaS B2B (Imagen 2)
│   │   ├── SimulatorPage.tsx        # Simulador dinámico con LTV y topes
│   │   └── MarketingPages.tsx       # Precios, Cómo funciona, FAQ, Contacto
│   ├── App.tsx                      # Enrutador principal
│   ├── index.css                    # Design system y tokens Tailwind
│   └── main.tsx                     # Entry point y registro PWA
├── supabase/
│   ├── migrations/
│   │   ├── 20260902000001_initial_schema.sql  # 23 tablas y enums
│   │   └── 20260902000002_rls_policies.sql    # Políticas de RLS y aislamiento
│   └── seed/
│       ├── pilot.sql                # Configuración oficial del prestamista piloto
│       └── demo.sql                 # Solicitudes y datos ficticios (DEMO)
├── vercel.json                      # Configuración de despliegue y rewrites SPA
└── package.json
```

---

## 🛡️ Seguridad y Blindaje de Secretos

Bajo ninguna circunstancia se versionan archivos `.env`, claves `service_role`, credenciales ni secretos dentro del repositorio. Todo secreto vive exclusivamente en la infraestructura segura del servidor.
