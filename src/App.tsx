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
import { SignatureReturnPage } from './pages/signature/SignatureReturnPage';

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

// Tenant Demo ESTUDIO NOVA & Portales Tenant
import { EstudioNovaPage } from './pages/demo/nova/EstudioNovaPage';
import { EstudioNovaAccessHubPage } from './pages/demo/nova/EstudioNovaAccessHubPage';
import { TenantSimulatorPage } from './pages/demo/TenantSimulatorPage';
import { TenantWizardPage } from './pages/demo/TenantWizardPage';
import { TenantInvestorDashboardPage } from './pages/demo/TenantInvestorDashboardPage';

// Super Admin Hub
import { SuperAdminDashboardPage } from './pages/admin/SuperAdminDashboardPage';
import { SuperAdminTenantsPage } from './pages/admin/SuperAdminTenantsPage';
import { TenantOnboardingWizardPage } from './pages/admin/TenantOnboardingWizardPage';
import { GenericWhiteLabelLanding } from './pages/landing/GenericWhiteLabelLanding';
import { AdminAiPage } from './pages/admin/AdminAiPage';
import { LendersSolutionPage } from './pages/solutions/LendersSolutionPage';
import { FinancialsSolutionPage } from './pages/solutions/FinancialsSolutionPage';
import { NotariesSolutionPage } from './pages/solutions/NotariesSolutionPage';
import { SaaSModulesCatalogPage } from './pages/saas/SaaSModulesCatalogPage';
import { TenantProvider } from './contexts/TenantContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { OfflineNotice } from './components/ui/OfflineNotice';
import { DemoSalesModeBar } from './components/demo/DemoSalesModeBar';
import { QaSessionBanner } from './components/qa/QaSessionBanner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { isMarketplaceEnabled } from './config/features';

const LenderRouteGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin } = useAuth();
  if (!isMarketplaceEnabled() && !isSuperAdmin) {
    return <NotFoundPage />;
  }
  return <>{children}</>;
};

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
              {/* 1. RUTAS PÚBLICAS MARKETPLACE & INSTITUCIONALES           */}
              {/* ========================================================== */}
              <Route path="/" element={<MarketplaceHome />} />
              <Route path="/simulador" element={<SimulatorPage />} />
              <Route path="/como-funciona" element={<HowItWorksPage />} />
              <Route path="/prestamos" element={<Navigate to="/simulador" replace />} />
              <Route path="/preguntas-frecuentes" element={<FaqPage />} />
              <Route path="/nosotros" element={<AboutPage />} />
              <Route path="/contacto" element={<ContactPage />} />

              {/* Páginas Legales */}
              <Route path="/terminos" element={<TermsPage />} />
              <Route path="/privacidad" element={<PrivacyPage />} />
              <Route path="/seguridad" element={<SecurityPage />} />
              <Route path="/signature/return" element={<SignatureReturnPage />} />

              {/* ========================================================== */}
              {/* 2. RUTAS PÚBLICAS SAAS B2B                                 */}
              {/* ========================================================== */}
              <Route path="/saas" element={<SaaSHome />} />
              <Route path="/saas/modulos" element={<SaaSModulesCatalogPage />} />
              <Route path="/saas/integracion" element={<SaaSIntegrationPage />} />
              <Route path="/saas/plataforma-completa" element={<SaaSFullPlatformPage />} />
              <Route path="/saas/precios" element={<SaaSPricingPage />} />

              {/* Redirecciones SEO de SaaS */}
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

              {/* ========================================================== */}
              {/* 3. SUPER ADMIN HIPOTECALY (/admin)                         */}
              {/* ========================================================== */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminDashboardPage />
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
              {/* Redirecciones de compatibilidad para Super Admin */}
              <Route path="/platform-admin" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/qa" element={<Navigate to="/admin?tab=qa" replace />} />
              <Route path="/app/ai-admin" element={<Navigate to="/admin/ai" replace />} />

              {/* ========================================================== */}
              {/* 4. ARQUITECTURA DEMO & TENANT DINÁMICO (/demo/:tenantSlug)  */}
              {/* ========================================================== */}
              
              {/* Redirecciones Legacy de Estudio Nova */}
              <Route path="/demo" element={<Navigate to="/demo/estudio-nova" replace />} />
              <Route path="/demo/nova" element={<Navigate to="/demo/estudio-nova" replace />} />
              <Route path="/demo/nova/simulador" element={<Navigate to="/demo/estudio-nova/simulador" replace />} />
              <Route path="/demo/nova/solicitar" element={<Navigate to="/demo/estudio-nova/solicitar" replace />} />
              <Route path="/demo/nova/cliente" element={<Navigate to="/demo/estudio-nova/cliente" replace />} />
              <Route path="/demo/nova/mi-cuenta" element={<Navigate to="/demo/estudio-nova/cliente" replace />} />
              <Route path="/demo/nova/admin" element={<Navigate to="/demo/estudio-nova/admin" replace />} />
              <Route path="/demo/nova/inversor" element={<Navigate to="/demo/estudio-nova/inversor" replace />} />
              <Route path="/demo/nova/login" element={<Navigate to="/ingresar?tenant=estudio-nova" replace />} />
              <Route path="/demo/nova/legacy" element={<Navigate to="/demo/estudio-nova" replace />} />
              <Route path="/demo/nova/integrado" element={<Navigate to="/demo/estudio-nova" replace />} />
              <Route path="/demo/nova/full" element={<Navigate to="/demo/estudio-nova" replace />} />

              {/* Tenant Hub de Demostración & Accesos */}
              <Route path="/demo/estudio-nova/accesos" element={<EstudioNovaAccessHubPage />} />
              <Route path="/demo/:tenantSlug/accesos" element={<EstudioNovaAccessHubPage />} />

              {/* Tenant Home Pública */}
              <Route path="/demo/estudio-nova" element={<EstudioNovaPage />} />
              <Route path="/demo/:tenantSlug" element={<GenericWhiteLabelLanding />} />

              {/* Tenant Simulador */}
              <Route path="/demo/estudio-nova/simulador" element={<TenantSimulatorPage />} />
              <Route path="/demo/:tenantSlug/simulador" element={<TenantSimulatorPage />} />

              {/* Tenant Solicitar */}
              <Route path="/demo/estudio-nova/solicitar" element={<TenantWizardPage />} />
              <Route path="/demo/:tenantSlug/solicitar" element={<TenantWizardPage />} />

              {/* Tenant Portal Cliente */}
              <Route
                path="/demo/estudio-nova/cliente"
                element={
                  <ProtectedRoute allowedRoles={['borrower', 'super_admin']}>
                    <ApplicantAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/cliente"
                element={
                  <ProtectedRoute allowedRoles={['borrower', 'super_admin']}>
                    <ApplicantAccount />
                  </ProtectedRoute>
                }
              />

              {/* Tenant Backoffice Operativo */}
              <Route
                path="/demo/:tenantSlug/admin"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'viewer', 'super_admin']}
                    requireTenantMatch
                  >
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/solicitudes"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'viewer', 'super_admin']}
                    requireTenantMatch
                  >
                    <ApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/solicitudes/:id"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'viewer', 'super_admin']}
                    requireTenantMatch
                  >
                    <ApplicationDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/clientes"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'viewer', 'super_admin']}
                    requireTenantMatch
                  >
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/leads"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}
                    requireTenantMatch
                  >
                    <LeadsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/propiedades"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'viewer', 'super_admin']}
                    requireTenantMatch
                  >
                    <PropertiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/documentos"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'viewer', 'super_admin']}
                    requireTenantMatch
                  >
                    <DocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/tasaciones"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'viewer', 'super_admin']}
                    requireTenantMatch
                  >
                    <ValuationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/tareas"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'viewer', 'super_admin']}
                    requireTenantMatch
                  >
                    <TasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/reportes"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'super_admin']}
                    requireTenantMatch
                  >
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/configuracion"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}
                    requireTenantMatch
                  >
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/usuarios"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}
                    requireTenantMatch
                  >
                    <UsersManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/organizacion"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}
                    requireTenantMatch
                  >
                    <OrganizationSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/whitelabel"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}
                    requireTenantMatch
                  >
                    <WhiteLabelBackofficePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/prestamistas"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'super_admin']}
                    requireTenantMatch
                  >
                    <LendersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/inversores"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'super_admin']}
                    requireTenantMatch
                  >
                    <LendersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/prestamistas/:id"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'super_admin']}
                    requireTenantMatch
                  >
                    <LenderDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Tenant Portal Inversor Privado */}
              <Route
                path="/demo/:tenantSlug/inversor"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']} requireTenantMatch>
                    <TenantInvestorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/inversor/oportunidades"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']} requireTenantMatch>
                    <TenantInvestorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/inversor/ofertas"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']} requireTenantMatch>
                    <TenantInvestorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/inversor/mensajes"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']} requireTenantMatch>
                    <TenantInvestorDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* ========================================================== */}
              {/* 5. AUTENTICACIÓN Y ACCESO GENERAL                         */}
              {/* ========================================================== */}
              <Route path="/solicitar" element={<ApplicationWizard />} />
              <Route path="/ingresar" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/recuperar-password" element={<ForgotPasswordPage />} />

              {/* Portal del Solicitante / Cliente Base */}
              <Route
                path="/mi-cuenta"
                element={
                  <ProtectedRoute allowedRoles={['borrower', 'super_admin']}>
                    <ApplicantAccount />
                  </ProtectedRoute>
                }
              />

              {/* White-Label Dinámico por /org/:slug */}
              <Route path="/org/:slug" element={<GenericWhiteLabelLanding />} />
              <Route path="/org/:slug/simulador" element={<TenantSimulatorPage />} />
              <Route path="/org/:slug/solicitar" element={<TenantWizardPage />} />
              <Route
                path="/org/:slug/cliente"
                element={
                  <ProtectedRoute allowedRoles={['borrower', 'super_admin']}>
                    <ApplicantAccount />
                  </ProtectedRoute>
                }
              />

              {/* ========================================================== */}
              {/* 6. RUTAS BACKOFFICE LEGACY /app/*                           */}
              {/* ========================================================== */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'super_admin']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/solicitudes"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'super_admin']}>
                    <ApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/solicitudes/:id"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'super_admin']}>
                    <ApplicationDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/clientes"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'super_admin']}>
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/leads"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}>
                    <LeadsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/propiedades"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'super_admin']}>
                    <PropertiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/documentos"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'super_admin']}>
                    <DocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/tasaciones"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'super_admin']}>
                    <ValuationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/tareas"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'super_admin']}>
                    <TasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/reportes"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'super_admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/configuracion"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/prestamistas"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'super_admin']}>
                    <LendersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/prestamistas/:id"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'super_admin']}>
                    <LenderDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/usuarios"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}>
                    <UsersManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/organizacion"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}>
                    <OrganizationSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/whitelabel"
                element={
                  <ProtectedRoute allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}>
                    <WhiteLabelBackofficePage />
                  </ProtectedRoute>
                }
              />

              {/* ========================================================== */}
              {/* 7. PORTAL LENDER LEGACY MARKETPLACE (Bloqueado por flag)   */}
              {/* ========================================================== */}
              <Route
                path="/lender"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']}>
                    <LenderRouteGate>
                      <LenderDashboardPage />
                    </LenderRouteGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lender/oportunidades"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']}>
                    <LenderRouteGate>
                      <LenderDashboardPage />
                    </LenderRouteGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lender/oportunidades/:id"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']}>
                    <LenderRouteGate>
                      <LenderOpportunityDetailPage />
                    </LenderRouteGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lender/ofertas"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']}>
                    <LenderRouteGate>
                      <LenderOffersPage />
                    </LenderRouteGate>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lender/mensajes"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']}>
                    <LenderRouteGate>
                      <LenderMessagesPage />
                    </LenderRouteGate>
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
