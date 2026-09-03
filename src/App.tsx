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

// Backoffice Pages (Fase 3)
import { DashboardPage } from './pages/backoffice/DashboardPage';
import { ApplicationsPage } from './pages/backoffice/ApplicationsPage';
import { ApplicationDetailPage } from './pages/backoffice/ApplicationDetailPage';
import { ClientsPage } from './pages/backoffice/ClientsPage';
import { PropertiesPage } from './pages/backoffice/PropertiesPage';
import { DocumentsPage } from './pages/backoffice/DocumentsPage';
import { ValuationsPage, TasksPage, ReportsPage, SettingsPage } from './pages/backoffice/OtherBackofficePages';
import { LendersPage } from './pages/backoffice/LendersPage';
import { LenderDetailPage } from './pages/backoffice/LenderDetailPage';
import { LenderDashboardPage } from './pages/lender/LenderDashboardPage';
import { LenderOpportunityDetailPage } from './pages/lender/LenderOpportunityDetailPage';
import { LenderOffersPage } from './pages/lender/LenderOffersPage';
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

          {/* Autenticación y Solicitante (Fase 2) */}
          <Route path="/solicitar" element={<ApplicationWizard />} />
          <Route path="/mi-cuenta" element={<ApplicantAccount />} />
          <Route path="/ingresar" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar-password" element={<ForgotPasswordPage />} />

          {/* Backoffice Operativo Multi-Tenant (Fase 3) */}
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/solicitudes" element={<ApplicationsPage />} />
          <Route path="/app/solicitudes/:id" element={<ApplicationDetailPage />} />
          <Route path="/app/clientes" element={<ClientsPage />} />
          <Route path="/app/propiedades" element={<PropertiesPage />} />
          <Route path="/app/documentos" element={<DocumentsPage />} />
          <Route path="/app/tasaciones" element={<ValuationsPage />} />
          <Route path="/app/tareas" element={<TasksPage />} />
          <Route path="/app/reportes" element={<ReportsPage />} />
          <Route path="/app/configuracion" element={<SettingsPage />} />
          <Route path="/app/prestamistas" element={<LendersPage />} />
          <Route path="/app/prestamistas/:id" element={<LenderDetailPage />} />

          {/* Portal del Prestamista (Fase 4) */}
          <Route path="/lender" element={<LenderDashboardPage />} />
          <Route path="/lender/oportunidades" element={<LenderDashboardPage />} />
          <Route path="/lender/oportunidades/:id" element={<LenderOpportunityDetailPage />} />
          <Route path="/lender/ofertas" element={<LenderOffersPage />} />

          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
