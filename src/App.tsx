import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MarketplaceHome } from './pages/MarketplaceHome';
import { SaaSHome } from './pages/SaaSHome';
import { SaaSIntegrationPage } from './pages/saas/SaaSIntegrationPage';
import { SaaSFullPlatformPage } from './pages/saas/SaaSFullPlatformPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ApplicationWizard } from './pages/wizard/ApplicationWizard';
import { ApplicantAccount } from './pages/account/ApplicantAccount';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { HowItWorksPage, FaqPage, SaaSPricingPage, ContactPage } from './pages/MarketingPages';
import { AboutPage } from './pages/landing/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TermsPage, PrivacyPage, SecurityPage } from './pages/legal/LegalPages';

// Backoffice Pages
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
import { LenderMessagesPage } from './pages/lender/LenderMessagesPage';
import { UsersManagementPage } from './pages/backoffice/UsersManagementPage';
import { OrganizationSettingsPage } from './pages/backoffice/OrganizationSettingsPage';
import { WhiteLabelBackofficePage } from './pages/backoffice/WhiteLabelBackofficePage';
import { LeadsManagementPage } from './pages/backoffice/LeadsManagementPage';

// Tenant Demo NOVA & Super Admin
import { NovaLegacySite } from './pages/demo/nova/NovaLegacySite';
import { NovaIntegratedSite } from './pages/demo/nova/NovaIntegratedSite';
import { NovaFullWhiteLabelSite } from './pages/demo/nova/NovaFullWhiteLabelSite';
import { SuperAdminTenantsPage } from './pages/admin/SuperAdminTenantsPage';
import { TenantOnboardingWizardPage } from './pages/admin/TenantOnboardingWizardPage';
import { GenericWhiteLabelLanding } from './pages/landing/GenericWhiteLabelLanding';
import { AdminAiPage } from './pages/admin/AdminAiPage';
import { PlatformAdminPage } from './pages/admin/PlatformAdminPage';
import { LendersSolutionPage } from './pages/solutions/LendersSolutionPage';
import { FinancialsSolutionPage } from './pages/solutions/FinancialsSolutionPage';
import { NotariesSolutionPage } from './pages/solutions/NotariesSolutionPage';
import { NovaShowroomPage } from './pages/demo/nova/NovaShowroomPage';
import { SaaSModulesCatalogPage } from './pages/saas/SaaSModulesCatalogPage';
import { TenantProvider } from './contexts/TenantContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { OfflineNotice } from './components/ui/OfflineNotice';
import { DemoSalesModeBar } from './components/demo/DemoSalesModeBar';
import { QaSessionBanner } from './components/qa/QaSessionBanner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <TenantProvider>
            {/* Banner global de sesión QA activa */}
            <QaSessionBanner />
            {/* Notificación flotante de PWA sin conexión */}
            <OfflineNotice />
            {/* Barra de navegación comercial para modo demostración y presentaciones */}
            <DemoSalesModeBar />

            <Routes>
              {/* ========================================================== */}
              {/* 1. RUTAS PÚBLICAS MARKETPLACE (Línea A - Propietarios)    */}
              {/* ========================================================== */}
              <Route path="/" element={<MarketplaceHome />} />
              <Route path="/simulador" element={<SimulatorPage />} />
              <Route path="/como-funciona" element={<HowItWorksPage />} />
              <Route path="/prestamos" element={<Navigate to="/simulador" replace />} />
              <Route path="/preguntas-frecuentes" element={<FaqPage />} />
              <Route path="/nosotros" element={<AboutPage />} />
              <Route path="/contacto" element={<ContactPage />} />

              {/* Páginas Legales Institucionales (Sin Soft-404) */}
              <Route path="/terminos" element={<TermsPage />} />
              <Route path="/privacidad" element={<PrivacyPage />} />
              <Route path="/seguridad" element={<SecurityPage />} />

              {/* ========================================================== */}
              {/* 2. RUTAS PÚBLICAS SAAS (Línea B - Empresas & Estudios)     */}
              {/* ========================================================== */}
              <Route path="/saas" element={<SaaSHome />} />
              <Route path="/saas/modulos" element={<SaaSModulesCatalogPage />} />
              <Route path="/saas/integracion" element={<SaaSIntegrationPage />} />
              <Route path="/saas/plataforma-completa" element={<SaaSFullPlatformPage />} />
              <Route path="/saas/precios" element={<SaaSPricingPage />} />

              {/* Redirecciones canónicas desde /plataforma para evitar duplicación y canibalización SEO */}
              <Route path="/plataforma" element={<Navigate to="/saas" replace />} />
              <Route path="/plataforma/modulos" element={<Navigate to="/saas/modulos" replace />} />
              <Route path="/plataforma/integracion" element={<Navigate to="/saas/integracion" replace />} />
              <Route path="/plataforma/plataforma-completa" element={<Navigate to="/saas/plataforma-completa" replace />} />
              <Route path="/plataforma/funcionalidades" element={<Navigate to="/saas" replace />} />
              <Route path="/plataforma/para-quien-es" element={<Navigate to="/saas" replace />} />
              <Route path="/plataforma/white-label" element={<Navigate to="/saas/plataforma-completa" replace />} />
              <Route path="/plataforma/precios" element={<Navigate to="/saas/precios" replace />} />
              <Route path="/plataforma/prestamistas" element={<Navigate to="/empresas/prestamistas" replace />} />
              <Route path="/plataforma/financieras" element={<Navigate to="/empresas/financieras" replace />} />
              <Route path="/plataforma/estudios" element={<Navigate to="/empresas/estudios" replace />} />

              {/* Soluciones Verticales B2B */}
              <Route path="/empresas/prestamistas" element={<LendersSolutionPage />} />
              <Route path="/empresas/financieras" element={<FinancialsSolutionPage />} />
              <Route path="/empresas/estudios" element={<NotariesSolutionPage />} />

              {/* Demostración Comercial Showroom NOVA */}
              <Route path="/demo" element={<NovaShowroomPage />} />
              <Route path="/demo/nova" element={<NovaShowroomPage />} />
              <Route path="/demo/nova/legacy" element={<NovaLegacySite />} />
              <Route path="/demo/nova/integrado" element={<NovaIntegratedSite />} />
              <Route path="/demo/nova/full" element={<NovaFullWhiteLabelSite />} />
              <Route path="/demo/nova/login" element={<LoginPage />} />
              <Route path="/demo/nova/mi-cuenta" element={<ApplicantAccount />} />

              {/* White-Label Dinámico por URL */}
              <Route path="/org/:slug" element={<GenericWhiteLabelLanding />} />
              <Route path="/org/:slug/simulador" element={<GenericWhiteLabelLanding />} />

              {/* ========================================================== */}
              {/* 3. AUTENTICACIÓN Y REGISTRO                                */}
              {/* ========================================================== */}
              <Route path="/solicitar" element={<ApplicationWizard />} />
              <Route path="/ingresar" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/recuperar-password" element={<ForgotPasswordPage />} />

              {/* Portal del Solicitante / Cliente (Protegido) */}
              <Route
                path="/mi-cuenta"
                element={
                  <ProtectedRoute allowedRoles={['borrower', 'super_admin']}>
                    <ApplicantAccount />
                  </ProtectedRoute>
                }
              />

              {/* ========================================================== */}
              {/* 4. SUPER ADMIN HIPOTECALY GLOBAL (Protegido Super Admin)   */}
              {/* ========================================================== */}
              <Route
                path="/platform-admin"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <PlatformAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/qa"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <PlatformAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tenants"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminTenantsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tenants/new"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <TenantOnboardingWizardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ai"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <AdminAiPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/ai-admin"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <AdminAiPage />
                  </ProtectedRoute>
                }
              />

              {/* ========================================================== */}
              {/* 5. BACKOFFICE MULTI-TENANT (Protegido Staff & Admins)      */}
              {/* ========================================================== */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'notary', 'super_admin']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/solicitudes"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'notary', 'super_admin']}>
                    <ApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/solicitudes/:id"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'notary', 'super_admin']}>
                    <ApplicationDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/clientes"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'notary', 'super_admin']}>
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/leads"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'super_admin']}>
                    <LeadsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/propiedades"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'notary', 'super_admin']}>
                    <PropertiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/documentos"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'notary', 'super_admin']}>
                    <DocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/tasaciones"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'notary', 'super_admin']}>
                    <ValuationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/tareas"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'notary', 'super_admin']}>
                    <TasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/reportes"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'super_admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/configuracion"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'super_admin']}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/prestamistas"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'super_admin']}>
                    <LendersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/prestamistas/:id"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'analyst', 'super_admin']}>
                    <LenderDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/usuarios"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'super_admin']}>
                    <UsersManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/organizacion"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'super_admin']}>
                    <OrganizationSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/whitelabel"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'super_admin']}>
                    <WhiteLabelBackofficePage />
                  </ProtectedRoute>
                }
              />

              {/* ========================================================== */}
              {/* 6. PORTAL DEL PRESTAMISTA (Protegido Prestamistas & Admins) */}
              {/* ========================================================== */}
              <Route
                path="/lender"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']}>
                    <LenderDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lender/oportunidades"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']}>
                    <LenderDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lender/oportunidades/:id"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']}>
                    <LenderOpportunityDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lender/ofertas"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']}>
                    <LenderOffersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lender/mensajes"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']}>
                    <LenderMessagesPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback 404 Institucional */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </TenantProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};
