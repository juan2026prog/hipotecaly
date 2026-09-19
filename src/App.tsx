import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PageLoadingSpinner } from './components/ui/PageLoadingSpinner';

// 1. Public & Core Pages (Lazy Loaded)
const MarketplaceHome = React.lazy(() => import('./pages/MarketplaceHome').then((m) => ({ default: m.MarketplaceHome })));
const SaaSHome = React.lazy(() => import('./pages/SaaSHome').then((m) => ({ default: m.SaaSHome })));
const SaaSIntegrationPage = React.lazy(() => import('./pages/saas/SaaSIntegrationPage').then((m) => ({ default: m.SaaSIntegrationPage })));
const SaaSFullPlatformPage = React.lazy(() => import('./pages/saas/SaaSFullPlatformPage').then((m) => ({ default: m.SaaSFullPlatformPage })));
const SimulatorPage = React.lazy(() => import('./pages/SimulatorPage').then((m) => ({ default: m.SimulatorPage })));
const ApplicationWizard = React.lazy(() => import('./pages/wizard/ApplicationWizard').then((m) => ({ default: m.ApplicationWizard })));
const ApplicantAccount = React.lazy(() => import('./pages/account/ApplicantAccount').then((m) => ({ default: m.ApplicantAccount })));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const AuthCallbackPage = React.lazy(() => import('./pages/auth/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage })));
const HowItWorksPage = React.lazy(() => import('./pages/MarketingPages').then((m) => ({ default: m.HowItWorksPage })));
const FaqPage = React.lazy(() => import('./pages/MarketingPages').then((m) => ({ default: m.FaqPage })));
const SaaSPricingPage = React.lazy(() => import('./pages/MarketingPages').then((m) => ({ default: m.SaaSPricingPage })));
const ContactPage = React.lazy(() => import('./pages/MarketingPages').then((m) => ({ default: m.ContactPage })));
const AboutPage = React.lazy(() => import('./pages/landing/AboutPage').then((m) => ({ default: m.AboutPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const TermsPage = React.lazy(() => import('./pages/legal/LegalPages').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = React.lazy(() => import('./pages/legal/LegalPages').then((m) => ({ default: m.PrivacyPage })));
const SecurityPage = React.lazy(() => import('./pages/legal/LegalPages').then((m) => ({ default: m.SecurityPage })));
const SignatureReturnPage = React.lazy(() => import('./pages/signature/SignatureReturnPage').then((m) => ({ default: m.SignatureReturnPage })));

// 2. Backoffice Pages (Lazy Loaded)
const DashboardPage = React.lazy(() => import('./pages/backoffice/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ApplicationsPage = React.lazy(() => import('./pages/backoffice/ApplicationsPage').then((m) => ({ default: m.ApplicationsPage })));
const ApplicationDetailPage = React.lazy(() => import('./pages/backoffice/ApplicationDetailPage').then((m) => ({ default: m.ApplicationDetailPage })));
const ClientsPage = React.lazy(() => import('./pages/backoffice/ClientsPage').then((m) => ({ default: m.ClientsPage })));
const PropertiesPage = React.lazy(() => import('./pages/backoffice/PropertiesPage').then((m) => ({ default: m.PropertiesPage })));
const DocumentsPage = React.lazy(() => import('./pages/backoffice/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const TasksPage = React.lazy(() => import('./pages/backoffice/OtherBackofficePages').then((m) => ({ default: m.TasksPage })));
const ReportsPage = React.lazy(() => import('./pages/backoffice/OtherBackofficePages').then((m) => ({ default: m.ReportsPage })));
const AnalyticsPage = React.lazy(() => import('./pages/backoffice/OtherBackofficePages').then((m) => ({ default: m.AnalyticsPage })));
const SettingsPage = React.lazy(() => import('./pages/backoffice/OtherBackofficePages').then((m) => ({ default: m.SettingsPage })));
const TasadorHomePage = React.lazy(() => import('./pages/tasador/TasadorHomePage').then((m) => ({ default: m.TasadorHomePage })));
const TasadorNewAppraisalPage = React.lazy(() => import('./pages/tasador/TasadorNewAppraisalPage').then((m) => ({ default: m.TasadorNewAppraisalPage })));
const TasadorComparablesPage = React.lazy(() => import('./pages/tasador/TasadorComparablesPage').then((m) => ({ default: m.TasadorComparablesPage })));
const AuditPage = React.lazy(() => import('./pages/backoffice/AuditPage').then((m) => ({ default: m.AuditPage })));
const InvestorsPage = React.lazy(() => import('./pages/backoffice/InvestorsPage').then((m) => ({ default: m.InvestorsPage })));
const InvestorDetailPage = React.lazy(() => import('./pages/backoffice/InvestorDetailPage').then((m) => ({ default: m.InvestorDetailPage })));
const UsersManagementPage = React.lazy(() => import('./pages/backoffice/UsersManagementPage').then((m) => ({ default: m.UsersManagementPage })));
const OrganizationSettingsPage = React.lazy(() => import('./pages/backoffice/OrganizationSettingsPage').then((m) => ({ default: m.OrganizationSettingsPage })));
const WhiteLabelBackofficePage = React.lazy(() => import('./pages/backoffice/WhiteLabelBackofficePage').then((m) => ({ default: m.WhiteLabelBackofficePage })));
const WhatsAppSettingsPage = React.lazy(() => import('./pages/backoffice/WhatsAppSettingsPage').then((m) => ({ default: m.WhatsAppSettingsPage })));
const SuperAdminLeadsPage = React.lazy(() => import('./pages/admin/SuperAdminLeadsPage').then((m) => ({ default: m.SuperAdminLeadsPage })));

// 3. Lender / Marketplace (Lazy Loaded)
const LenderDashboardPage = React.lazy(() => import('./pages/lender/LenderDashboardPage').then((m) => ({ default: m.LenderDashboardPage })));
const LenderOpportunityDetailPage = React.lazy(() => import('./pages/lender/LenderOpportunityDetailPage').then((m) => ({ default: m.LenderOpportunityDetailPage })));
const LenderOffersPage = React.lazy(() => import('./pages/lender/LenderOffersPage').then((m) => ({ default: m.LenderOffersPage })));
const LenderMessagesPage = React.lazy(() => import('./pages/lender/LenderMessagesPage').then((m) => ({ default: m.LenderMessagesPage })));

// 4. Tenant Demo ESTUDIO NOVA & Portales Tenant (Lazy Loaded)
const EstudioNovaPage = React.lazy(() => import('./pages/demo/nova/EstudioNovaPage').then((m) => ({ default: m.EstudioNovaPage })));
const EstudioNovaAccessHubPage = React.lazy(() => import('./pages/demo/nova/EstudioNovaAccessHubPage').then((m) => ({ default: m.EstudioNovaAccessHubPage })));
const TenantSimulatorPage = React.lazy(() => import('./pages/demo/TenantSimulatorPage').then((m) => ({ default: m.TenantSimulatorPage })));
const TenantWizardPage = React.lazy(() => import('./pages/demo/TenantWizardPage').then((m) => ({ default: m.TenantWizardPage })));
const TenantInvestorDashboardPage = React.lazy(() => import('./pages/demo/TenantInvestorDashboardPage').then((m) => ({ default: m.TenantInvestorDashboardPage })));
const TenantInvestorProfilePage = React.lazy(() => import('./pages/demo/TenantInvestorProfilePage').then((m) => ({ default: m.TenantInvestorProfilePage })));

// 5. Portal Notarial & Escribanos (Lazy Loaded)
const NotaryDashboardPage = React.lazy(() => import('./pages/notary/NotaryDashboardPage').then((m) => ({ default: m.NotaryDashboardPage })));
const NotaryApplicationsPage = React.lazy(() => import('./pages/notary/NotaryApplicationsPage').then((m) => ({ default: m.NotaryApplicationsPage })));
const NotaryApplicationDetailPage = React.lazy(() => import('./pages/notary/NotaryApplicationDetailPage').then((m) => ({ default: m.NotaryApplicationDetailPage })));
const NotaryTasksPage = React.lazy(() => import('./pages/notary/NotaryTasksPage').then((m) => ({ default: m.NotaryTasksPage })));
const NotaryDocumentsPage = React.lazy(() => import('./pages/notary/NotaryDocumentsPage').then((m) => ({ default: m.NotaryDocumentsPage })));
const NotarySignaturesPage = React.lazy(() => import('./pages/notary/NotarySignaturesPage').then((m) => ({ default: m.NotarySignaturesPage })));
const NotaryCalendarPage = React.lazy(() => import('./pages/notary/NotaryCalendarPage').then((m) => ({ default: m.NotaryCalendarPage })));
const NotaryProfilePage = React.lazy(() => import('./pages/notary/NotaryProfilePage').then((m) => ({ default: m.NotaryProfilePage })));

// 6. Super Admin Hub (Lazy Loaded)
const SuperAdminDashboardPage = React.lazy(() => import('./pages/admin/SuperAdminDashboardPage').then((m) => ({ default: m.SuperAdminDashboardPage })));
const SuperAdminTenantsPage = React.lazy(() => import('./pages/admin/SuperAdminTenantsPage').then((m) => ({ default: m.SuperAdminTenantsPage })));
const SuperAdminServicesPage = React.lazy(() => import('./pages/admin/SuperAdminServicesPage').then((m) => ({ default: m.SuperAdminServicesPage })));
const SuperAdminImpersonatePage = React.lazy(() => import('./pages/admin/SuperAdminImpersonatePage').then((m) => ({ default: m.SuperAdminImpersonatePage })));
const SuperAdminActivityPage = React.lazy(() => import('./pages/admin/SuperAdminActivityPage').then((m) => ({ default: m.SuperAdminActivityPage })));
const SuperAdminTechnicalConfigPage = React.lazy(() => import('./pages/admin/SuperAdminTechnicalConfigPage').then((m) => ({ default: m.SuperAdminTechnicalConfigPage })));
const SuperAdminAccountPage = React.lazy(() => import('./pages/admin/SuperAdminAccountPage').then((m) => ({ default: m.SuperAdminAccountPage })));
const SuperAdminDocumentsPage = React.lazy(() => import('./pages/admin/SuperAdminDocumentsPage').then((m) => ({ default: m.SuperAdminDocumentsPage })));
const AdminAiPage = React.lazy(() => import('./pages/admin/AdminAiPage').then((m) => ({ default: m.AdminAiPage })));
const TenantOnboardingWizardPage = React.lazy(() => import('./pages/admin/TenantOnboardingWizardPage').then((m) => ({ default: m.TenantOnboardingWizardPage })));

// 7. Solutions & Verticales (Lazy Loaded)
const GenericWhiteLabelLanding = React.lazy(() => import('./pages/landing/GenericWhiteLabelLanding').then((m) => ({ default: m.GenericWhiteLabelLanding })));
const WhiteLabelInvestPage = React.lazy(() => import('./pages/white-label/WhiteLabelInvestPage').then((m) => ({ default: m.WhiteLabelInvestPage })));
const LendersSolutionPage = React.lazy(() => import('./pages/solutions/LendersSolutionPage').then((m) => ({ default: m.LendersSolutionPage })));
const FinancialsSolutionPage = React.lazy(() => import('./pages/solutions/FinancialsSolutionPage').then((m) => ({ default: m.FinancialsSolutionPage })));
const NotariesSolutionPage = React.lazy(() => import('./pages/solutions/NotariesSolutionPage').then((m) => ({ default: m.NotariesSolutionPage })));
const SaaSModulesCatalogPage = React.lazy(() => import('./pages/saas/SaaSModulesCatalogPage').then((m) => ({ default: m.SaaSModulesCatalogPage })));

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

              <Suspense fallback={<PageLoadingSpinner />}>
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
              {/* 4. BACKOFFICE REAL DE ORGANIZACIÓN (/org/:tenantSlug/admin) */}
              {/* White Label is optional; these routes never depend on /demo. */}
              {/* ========================================================== */}
              <Route path="/org/:tenantSlug/admin" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','operator','notary','viewer','super_admin']} requireTenantMatch><DashboardPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/solicitudes" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','operator','notary','viewer','super_admin']} requireTenantMatch><ApplicationsPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/solicitudes/:id" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','operator','notary','viewer','super_admin']} requireTenantMatch><ApplicationDetailPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/clientes" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','operator','notary','viewer','super_admin']} requireTenantMatch><ClientsPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/propiedades" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','operator','notary','viewer','super_admin']} requireTenantMatch><PropertiesPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/documentos" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','operator','notary','viewer','super_admin']} requireTenantMatch><DocumentsPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/tasaciones" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','operator','notary','viewer','super_admin']} requireTenantMatch><TasadorHomePage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/tasaciones/nueva" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','operator','notary','viewer','super_admin']} requireTenantMatch><TasadorNewAppraisalPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/tasaciones/:id" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','operator','notary','viewer','super_admin']} requireTenantMatch><TasadorComparablesPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/tareas" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','operator','notary','viewer','super_admin']} requireTenantMatch><TasksPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/reportes" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','super_admin']} requireTenantMatch><ReportsPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/analitica" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','super_admin']} requireTenantMatch><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/auditoria" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','super_admin']} requireTenantMatch><AuditPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/configuracion" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','super_admin']} requireTenantMatch><SettingsPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/usuarios" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','super_admin']} requireTenantMatch><UsersManagementPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/organizacion" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','super_admin']} requireTenantMatch><OrganizationSettingsPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/whitelabel" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','super_admin']} requireTenantMatch><WhiteLabelBackofficePage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/whatsapp" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','super_admin']} requireTenantMatch><WhatsAppSettingsPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/prestamistas" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','super_admin']} requireTenantMatch><InvestorsPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/inversores" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','super_admin']} requireTenantMatch><InvestorsPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/prestamistas/:id" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','super_admin']} requireTenantMatch><InvestorDetailPage /></ProtectedRoute>} />
              <Route path="/org/:tenantSlug/admin/inversores/:id" element={<ProtectedRoute allowedRoles={['tenant_admin','tenant_owner','analyst','super_admin']} requireTenantMatch><InvestorDetailPage /></ProtectedRoute>} />

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

              {/* Tenant Invertir (White Label Lead Capture) */}
              <Route path="/demo/estudio-nova/invertir" element={<WhiteLabelInvestPage />} />
              <Route path="/demo/:tenantSlug/invertir" element={<WhiteLabelInvestPage />} />
              <Route path="/org/:tenantSlug/invertir" element={<WhiteLabelInvestPage />} />

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
                    <InvestorsPage />
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
                    <InvestorsPage />
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
                    <InvestorDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demo/:tenantSlug/admin/inversores/:id"
                element={
                  <ProtectedRoute
                    allowedRoles={['tenant_admin', 'tenant_owner', 'analyst', 'super_admin']}
                    requireTenantMatch
                  >
                    <InvestorDetailPage />
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
                path="/demo/:tenantSlug/inversor/intereses"
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
          </Suspense>
          </DemoViewProvider>
          </TenantProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};
