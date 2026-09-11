import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
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
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
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
import { TasksPage, ReportsPage, AnalyticsPage, SettingsPage } from './pages/backoffice/OtherBackofficePages';
import { TasadorHomePage } from './pages/tasador/TasadorHomePage';
import { TasadorNewAppraisalPage } from './pages/tasador/TasadorNewAppraisalPage';
import { TasadorComparablesPage } from './pages/tasador/TasadorComparablesPage';
import { AuditPage } from './pages/backoffice/AuditPage';
import { LendersPage } from './pages/backoffice/LendersPage';
import { LenderDetailPage } from './pages/backoffice/LenderDetailPage';
import { LenderDashboardPage } from './pages/lender/LenderDashboardPage';
import { LenderOpportunityDetailPage } from './pages/lender/LenderOpportunityDetailPage';
import { LenderOffersPage } from './pages/lender/LenderOffersPage';
import { LenderMessagesPage } from './pages/lender/LenderMessagesPage';
import { UsersManagementPage } from './pages/backoffice/UsersManagementPage';
import { OrganizationSettingsPage } from './pages/backoffice/OrganizationSettingsPage';
import { WhiteLabelBackofficePage } from './pages/backoffice/WhiteLabelBackofficePage';
import { WhatsAppSettingsPage } from './pages/backoffice/WhatsAppSettingsPage';
import { SuperAdminLeadsPage } from './pages/admin/SuperAdminLeadsPage';

// Tenant Demo ESTUDIO NOVA & Portales Tenant
import { EstudioNovaPage } from './pages/demo/nova/EstudioNovaPage';
import { EstudioNovaAccessHubPage } from './pages/demo/nova/EstudioNovaAccessHubPage';
import { TenantSimulatorPage } from './pages/demo/TenantSimulatorPage';
import { TenantWizardPage } from './pages/demo/TenantWizardPage';
import { TenantInvestorDashboardPage } from './pages/demo/TenantInvestorDashboardPage';
import { TenantInvestorProfilePage } from './pages/demo/TenantInvestorProfilePage';

// Portal Notarial & Escribanos (/notary)
import { NotaryDashboardPage } from './pages/notary/NotaryDashboardPage';
import { NotaryApplicationsPage } from './pages/notary/NotaryApplicationsPage';
import { NotaryApplicationDetailPage } from './pages/notary/NotaryApplicationDetailPage';
import { NotaryTasksPage } from './pages/notary/NotaryTasksPage';
import { NotaryDocumentsPage } from './pages/notary/NotaryDocumentsPage';
import { NotarySignaturesPage } from './pages/notary/NotarySignaturesPage';
import { NotaryCalendarPage } from './pages/notary/NotaryCalendarPage';
import { NotaryProfilePage } from './pages/notary/NotaryProfilePage';

// Super Admin Hub
import { SuperAdminDashboardPage } from './pages/admin/SuperAdminDashboardPage';
import { SuperAdminTenantsPage } from './pages/admin/SuperAdminTenantsPage';
import { SuperAdminServicesPage } from './pages/admin/SuperAdminServicesPage';
import { SuperAdminImpersonatePage } from './pages/admin/SuperAdminImpersonatePage';
import { SuperAdminActivityPage } from './pages/admin/SuperAdminActivityPage';
import { SuperAdminTechnicalConfigPage } from './pages/admin/SuperAdminTechnicalConfigPage';
import { SuperAdminAccountPage } from './pages/admin/SuperAdminAccountPage';
import { SuperAdminDocumentsPage } from './pages/admin/SuperAdminDocumentsPage';
import { AdminAiPage } from './pages/admin/AdminAiPage';
import { TenantOnboardingWizardPage } from './pages/admin/TenantOnboardingWizardPage';
import { GenericWhiteLabelLanding } from './pages/landing/GenericWhiteLabelLanding';
import { LendersSolutionPage } from './pages/solutions/LendersSolutionPage';
import { FinancialsSolutionPage } from './pages/solutions/FinancialsSolutionPage';
import { NotariesSolutionPage } from './pages/solutions/NotariesSolutionPage';
import { SaaSModulesCatalogPage } from './pages/saas/SaaSModulesCatalogPage';
import { TenantProvider } from './contexts/TenantContext';
import { DemoViewProvider } from './contexts/DemoViewContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { OfflineNotice } from './components/ui/OfflineNotice';
import { DemoSalesModeBar } from './components/demo/DemoSalesModeBar';
import { DemoViewSelector } from './components/demo/DemoViewSelector';
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

import { useTenant } from './contexts/TenantContext';
import { getAllRegisteredTenants } from './lib/tenantService';

const TenantLeadsRedirect: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  return <Navigate to={`/demo/${tenantSlug || 'estudio-nova'}/admin`} replace />;
};

interface LegacyAppRedirectProps {
  subpath?: string;
  isDynamicParam?: 'solicitudes' | 'prestamistas';
}

const LegacyAppRedirect: React.FC<LegacyAppRedirectProps> = ({ subpath = '', isDynamicParam }) => {
  const { tenant } = useTenant();
  const { user, memberships, isQaSession, qaSessionData, isSuperAdmin } = useAuth();
  const params = useParams<{ id?: string }>();
  const id = params.id;

  // 1. Resolver el tenant canónico del usuario o contexto
  let targetSlug = '';

  // Si hay sesión QA activa, tomar su tenant
  if (isQaSession && qaSessionData?.tenantId) {
    const qaTenant = getAllRegisteredTenants().find((t) => t.id === qaSessionData.tenantId);
    if (qaTenant && qaTenant.slug !== 'hipotecaly') {
      targetSlug = qaTenant.slug;
    }
  }

  // Si el usuario tiene tenant resuelto en TenantContext distinto de la matriz central
  if (!targetSlug && tenant && tenant.slug && tenant.slug !== 'hipotecaly') {
    targetSlug = tenant.slug;
  }

  // Si el usuario autenticado tiene membresías
  if (!targetSlug && memberships && memberships.length > 0) {
    const primaryOrgId = memberships[0].organizationId;
    const orgTenant = getAllRegisteredTenants().find((t) => t.id === primaryOrgId);
    if (orgTenant && orgTenant.slug !== 'hipotecaly') {
      targetSlug = orgTenant.slug;
    }
  }

  // Si estamos en modo demo explícito o URL contiene ?demo=true
  const isDemo = typeof window !== 'undefined' && (
    window.location.search.includes('demo=true') ||
    window.localStorage.getItem('hipotecaly_demo_mode') === 'true'
  );

  if (!targetSlug && isDemo) {
    targetSlug = 'estudio-nova';
  }

  // Si aún no se resolvió tenant
  if (!targetSlug) {
    if (isSuperAdmin || user?.app_metadata?.role === 'super_admin' || user?.app_metadata?.is_super_admin) {
      return <Navigate to="/superadmin" replace />;
    }
    // Si no está autenticado o es visitante/solicitante
    targetSlug = 'estudio-nova';
  }

  let finalPath = `/demo/${targetSlug}/admin`;
  if (subpath) {
    finalPath += `/${subpath}`;
  }
  if (isDynamicParam && id) {
    finalPath += `/${id}`;
  }

  return <Navigate to={finalPath} replace />;
};

const DynamicRootRoute: React.FC = () => {
  const { tenant } = useTenant();

  // Si el host o contexto corresponde a una organización White-Label activa
  if (tenant && tenant.id && tenant.id !== '00000000-0000-0000-0000-000000000000' && tenant.slug !== 'hipotecaly') {
    if (tenant.slug === 'estudio-nova' || tenant.slug === 'nova') {
      return <EstudioNovaPage />;
    }
    return <GenericWhiteLabelLanding />;
  }

  return <MarketplaceHome />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <TenantProvider>
            <DemoViewProvider>
              {/* Barra superior de selección de vistas de modo prueba */}
              <DemoViewSelector />
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
              <Route path="/" element={<DynamicRootRoute />} />
              <Route path="/simulador" element={<SimulatorPage />} />
              <Route path="/como-funciona" element={<HowItWorksPage />} />
              <Route path="/prestamos" element={<Navigate to="/simulador" replace />} />
              <Route path="/preguntas-frecuentes" element={<FaqPage />} />
              <Route path="/nosotros" element={<AboutPage />} />
              <Route path="/contacto" element={<ContactPage />} />

              {/* Autenticación & Solicitud */}
              <Route path="/solicitar" element={<ApplicationWizard />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/ingresar" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/recuperar-clave" element={<ForgotPasswordPage />} />
              <Route path="/forgot-password" element={<Navigate to="/recuperar-clave" replace />} />

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
              {/* 3. SUPER ADMIN HIPOTECALY (/superadmin)                    */}
              {/* ========================================================== */}
              <Route
                path="/superadmin"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/clientes"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminTenantsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/tenants"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminTenantsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/tenants/new"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <TenantOnboardingWizardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/leads"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminLeadsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/documentos"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminDocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/servicios"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminServicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/ver-como-cliente"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminImpersonatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/actividad"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminActivityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/configuracion"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminTechnicalConfigPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/mi-cuenta"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <SuperAdminAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/ia"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <AdminAiPage defaultTab="configuracion" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/tasador"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <AdminAiPage defaultTab="tasador" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/calibracion"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <AdminAiPage defaultTab="tasador_calibration" />
                  </ProtectedRoute>
                }
              />

              {/* Redirecciones de compatibilidad para Super Admin (/admin/* -> /superadmin/*) */}
              <Route path="/admin" element={<Navigate to="/superadmin" replace />} />
              <Route path="/admin/clientes" element={<Navigate to="/superadmin/tenants" replace />} />
              <Route path="/admin/tenants" element={<Navigate to="/superadmin/tenants" replace />} />
              <Route path="/admin/tenants/new" element={<Navigate to="/superadmin/tenants/new" replace />} />
              <Route path="/admin/leads" element={<Navigate to="/superadmin/leads" replace />} />
              <Route path="/admin/documentos" element={<Navigate to="/superadmin/documentos" replace />} />
              <Route path="/admin/servicios" element={<Navigate to="/superadmin/servicios" replace />} />
              <Route path="/admin/ver-como-cliente" element={<Navigate to="/superadmin/ver-como-cliente" replace />} />
              <Route path="/admin/actividad" element={<Navigate to="/superadmin/actividad" replace />} />
              <Route path="/admin/configuracion" element={<Navigate to="/superadmin/configuracion" replace />} />
              <Route path="/admin/mi-cuenta" element={<Navigate to="/superadmin/mi-cuenta" replace />} />
              <Route path="/admin/ai" element={<Navigate to="/superadmin/ia" replace />} />
              <Route path="/admin/tasador" element={<Navigate to="/superadmin/tasador" replace />} />
              <Route path="/admin/calibracion" element={<Navigate to="/superadmin/calibracion" replace />} />
              <Route path="/admin/qa" element={<Navigate to="/superadmin/ver-como-cliente" replace />} />
              <Route path="/platform-admin" element={<Navigate to="/superadmin" replace />} />
              <Route path="/app/ai-admin" element={<Navigate to="/superadmin/ia" replace />} />

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
                element={<TenantLeadsRedirect />}
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
                    <TasadorHomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/tasaciones/nueva"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'viewer', 'super_admin']}
                    requireTenantMatch
                  >
                    <TasadorNewAppraisalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/tasaciones/:id"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'operator', 'notary', 'viewer', 'super_admin']}
                    requireTenantMatch
                  >
                    <TasadorComparablesPage />
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
                path="/demo/:tenantSlug/admin/analitica"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'super_admin']}
                    requireTenantMatch
                  >
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/auditoria"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}
                    requireTenantMatch
                  >
                    <AuditPage />
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
                path="/demo/:tenantSlug/admin/whatsapp"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}
                    requireTenantMatch
                  >
                    <WhatsAppSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/configuracion/whatsapp"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'super_admin']}
                    requireTenantMatch
                  >
                    <WhatsAppSettingsPage />
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
                path="/demo/:tenantSlug/inversor/prestamos"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']} requireTenantMatch>
                    <TenantInvestorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/inversor/propuestas"
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
              <Route
                path="/demo/:tenantSlug/inversor/perfil"
                element={
                  <ProtectedRoute allowedRoles={['lender', 'super_admin']} requireTenantMatch>
                    <TenantInvestorProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Rutas Directas /inversor */}
              <Route
                path="/inversor"
                element={<Navigate to="/demo/estudio-nova/inversor" replace />}
              />
              <Route
                path="/inversor/perfil"
                element={<Navigate to="/demo/estudio-nova/inversor/perfil" replace />}
              />
              <Route
                path="/inversor/oportunidades"
                element={<Navigate to="/demo/estudio-nova/inversor/oportunidades" replace />}
              />
              <Route
                path="/inversor/prestamos"
                element={<Navigate to="/demo/estudio-nova/inversor/prestamos" replace />}
              />
              <Route
                path="/inversor/propuestas"
                element={<Navigate to="/demo/estudio-nova/inversor/propuestas" replace />}
              />
              <Route
                path="/inversor/ofertas"
                element={<Navigate to="/demo/estudio-nova/inversor/propuestas" replace />}
              />

              {/* ========================================================== */}
              {/* 5. AUTENTICACIÓN Y ACCESO GENERAL                         */}
              {/* ========================================================== */}
              <Route path="/solicitar" element={<ApplicationWizard />} />
              <Route path="/ingresar" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/recuperar-password" element={<ForgotPasswordPage />} />

              {/* Portal del Solicitante / Cliente Base y Rutas Alias */}
              <Route
                path="/mi-cuenta"
                element={
                  <ProtectedRoute allowedRoles={['borrower', 'super_admin']}>
                    <ApplicantAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cliente"
                element={
                  <ProtectedRoute allowedRoles={['borrower', 'super_admin']}>
                    <ApplicantAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portal"
                element={
                  <ProtectedRoute allowedRoles={['borrower', 'super_admin']}>
                    <ApplicantAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/panel-cliente"
                element={
                  <ProtectedRoute allowedRoles={['borrower', 'super_admin']}>
                    <ApplicantAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cuenta"
                element={
                  <ProtectedRoute allowedRoles={['borrower', 'super_admin']}>
                    <ApplicantAccount />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
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
              {/* 6. REDIRECCIONES SEGURAS BACKOFFICE LEGACY /app/*         */}
              {/* ========================================================== */}
              <Route path="/app" element={<LegacyAppRedirect />} />
              <Route path="/app/solicitudes" element={<LegacyAppRedirect subpath="solicitudes" />} />
              <Route path="/app/solicitudes/:id" element={<LegacyAppRedirect subpath="solicitudes" isDynamicParam="solicitudes" />} />
              <Route path="/app/clientes" element={<LegacyAppRedirect subpath="clientes" />} />
              <Route path="/app/leads" element={<LegacyAppRedirect />} />
              <Route path="/app/propiedades" element={<LegacyAppRedirect subpath="propiedades" />} />
              <Route path="/app/documentos" element={<LegacyAppRedirect subpath="documentos" />} />
              <Route path="/app/tasaciones" element={<LegacyAppRedirect subpath="tasaciones" />} />
              <Route path="/app/tareas" element={<LegacyAppRedirect subpath="tareas" />} />
              <Route path="/app/reportes" element={<LegacyAppRedirect subpath="reportes" />} />
              <Route path="/app/analitica" element={<LegacyAppRedirect subpath="analitica" />} />
              <Route path="/app/auditoria" element={<LegacyAppRedirect subpath="auditoria" />} />
              <Route path="/app/configuracion" element={<LegacyAppRedirect subpath="configuracion" />} />
              <Route path="/app/prestamistas" element={<LegacyAppRedirect subpath="prestamistas" />} />
              <Route path="/app/prestamistas/:id" element={<LegacyAppRedirect subpath="prestamistas" isDynamicParam="prestamistas" />} />
              <Route path="/app/inversores" element={<LegacyAppRedirect subpath="inversores" />} />
              <Route path="/app/usuarios" element={<LegacyAppRedirect subpath="usuarios" />} />
              <Route path="/app/organizacion" element={<LegacyAppRedirect subpath="organizacion" />} />
              <Route path="/app/whitelabel" element={<LegacyAppRedirect subpath="whitelabel" />} />
              <Route path="/app/*" element={<LegacyAppRedirect />} />

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

              {/* ========================================================== */}
              {/* 8. PORTAL NOTARIAL & ESCRIBANOS (/notary)                  */}
              {/* ========================================================== */}
              <Route
                path="/notary"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notary/expedientes"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notary/expedientes/:id"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryApplicationDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notary/tareas"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryTasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notary/documentos"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryDocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notary/firmas"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotarySignaturesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notary/calendario"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryCalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notary/perfil"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Rutas Tenant Dinámicas Notariales */}
              <Route
                path="/demo/:tenantSlug/notary"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/notary/expedientes"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/notary/expedientes/:id"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryApplicationDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/notary/tareas"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryTasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/notary/documentos"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryDocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/notary/firmas"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotarySignaturesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/notary/calendario"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryCalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/notary/perfil"
                element={
                  <ProtectedRoute allowedRoles={['notary', 'super_admin']}>
                    <NotaryProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback 404 Institucional */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </DemoViewProvider>
          </TenantProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};
