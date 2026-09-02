import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MarketplaceHome } from './pages/MarketplaceHome';
import { SaaSHome } from './pages/SaaSHome';
import { SimulatorPage } from './pages/SimulatorPage';
import { HowItWorksPage, FaqPage, SaaSPricingPage, ContactPage } from './pages/MarketingPages';
import { OfflineNotice } from './components/ui/OfflineNotice';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* Notificación flotante de PWA sin conexión */}
      <OfflineNotice />

      <Routes>
        {/* Marketplace HIPOTECALY (Línea A - Propietarios) */}
        <Route path="/" element={<MarketplaceHome />} />
        <Route path="/simulador" element={<SimulatorPage />} />
        <Route path="/como-funciona" element={<HowItWorksPage />} />
        <Route path="/prestamos" element={<SimulatorPage />} />
        <Route path="/preguntas-frecuentes" element={<FaqPage />} />
        <Route path="/nosotros" element={<HowItWorksPage />} />
        <Route path="/contacto" element={<ContactPage />} />

        {/* SaaS HIPOTECALY (Línea B - Estudios, Prestamistas, Financieras) */}
        <Route path="/plataforma" element={<SaaSHome />} />
        <Route path="/plataforma/funcionalidades" element={<SaaSHome />} />
        <Route path="/plataforma/para-quien-es" element={<SaaSHome />} />
        <Route path="/plataforma/white-label" element={<SaaSHome />} />
        <Route path="/plataforma/precios" element={<SaaSPricingPage />} />

        {/* Rutas de autenticación y operativa (Preparadas para Fase 2 y 3) */}
        <Route
          path="/solicitar"
          element={
            <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-bg">
              <div className="max-w-md bg-white p-8 rounded-card border border-slate-border shadow-card space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center mx-auto font-bold text-lg">
                  W
                </div>
                <h2 className="text-2xl font-bold text-navy">Wizard de Solicitud</h2>
                <p className="text-sm text-slate-muted">
                  El wizard mobile-first con persistencia inmediata de drafts en Supabase se implementará en la Fase 2.
                </p>
                <a href="/simulador" className="inline-block text-sm font-semibold text-brand-green hover:underline">
                  ← Volver al simulador
                </a>
              </div>
            </div>
          }
        />

        <Route
          path="/mi-cuenta"
          element={
            <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-bg">
              <div className="max-w-md bg-white p-8 rounded-card border border-slate-border shadow-card space-y-4">
                <div className="w-12 h-12 rounded-xl bg-navy/10 text-navy flex items-center justify-center mx-auto font-bold text-lg">
                  MC
                </div>
                <h2 className="text-2xl font-bold text-navy">Portal del Solicitante</h2>
                <p className="text-sm text-slate-muted">
                  Mi Cuenta PWA con timeline y gestión de documentos se implementará en la Fase 2.
                </p>
                <a href="/" className="inline-block text-sm font-semibold text-brand-green hover:underline">
                  ← Volver a la portada
                </a>
              </div>
            </div>
          }
        />

        <Route
          path="/ingresar"
          element={
            <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-bg">
              <div className="max-w-md bg-white p-8 rounded-card border border-slate-border shadow-card space-y-4">
                <h2 className="text-2xl font-bold text-navy">Ingreso a HIPOTECALY</h2>
                <p className="text-sm text-slate-muted">
                  Autenticación con Supabase Auth preparada para Fase 2.
                </p>
                <a href="/" className="inline-block text-sm font-semibold text-brand-green hover:underline">
                  ← Volver
                </a>
              </div>
            </div>
          }
        />

        <Route
          path="/app"
          element={
            <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-bg">
              <div className="max-w-md bg-white p-8 rounded-card border border-slate-border shadow-card space-y-4">
                <div className="w-12 h-12 rounded-xl bg-navy text-white flex items-center justify-center mx-auto font-bold text-lg">
                  BO
                </div>
                <h2 className="text-2xl font-bold text-navy">Panel Operativo Backoffice</h2>
                <p className="text-sm text-slate-muted">
                  El panel de control multi-tenant con expedientes y valuaciones se activará en la Fase 3.
                </p>
                <a href="/plataforma" className="inline-block text-sm font-semibold text-brand-green hover:underline">
                  ← Ir a HIPOTECALY SaaS
                </a>
              </div>
            </div>
          }
        />

        {/* Fallback 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
