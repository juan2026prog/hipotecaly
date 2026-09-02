import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MarketplaceHome } from './pages/MarketplaceHome';
import { SaaSHome } from './pages/SaaSHome';
import { SimulatorPage } from './pages/SimulatorPage';
import { ApplicationWizard } from './pages/wizard/ApplicationWizard';
import { ApplicantAccount } from './pages/account/ApplicantAccount';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { HowItWorksPage, FaqPage, SaaSPricingPage, ContactPage } from './pages/MarketingPages';
import { OfflineNotice } from './components/ui/OfflineNotice';

export const App: React.FC = () => {
  return (
    <AuthProvider>
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

          {/* Rutas de Autenticación y Solicitud (Fase 2) */}
          <Route path="/solicitar" element={<ApplicationWizard />} />
          <Route path="/mi-cuenta" element={<ApplicantAccount />} />
          <Route path="/ingresar" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar-password" element={<ForgotPasswordPage />} />

          {/* Rutas de Backoffice (Fase 3) */}
          <Route
            path="/app/*"
            element={
              <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-bg">
                <div className="max-w-md bg-white p-8 rounded-card border border-slate-border shadow-card space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-navy text-white flex items-center justify-center mx-auto font-bold text-lg">
                    BO
                  </div>
                  <h2 className="text-2xl font-bold text-navy">Panel Operativo Backoffice</h2>
                  <p className="text-sm text-slate-muted">
                    El backoffice administrativo multi-tenant se implementará en la Fase 3.
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
    </AuthProvider>
  );
};
