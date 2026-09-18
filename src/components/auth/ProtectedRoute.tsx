import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { AccessDenied } from './AccessDenied';
import { getAllRegisteredTenants } from '../../lib/tenantService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireSuperAdmin?: boolean;
  requireTenantMatch?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireSuperAdmin = false,
  requireTenantMatch = false,
}) => {
  const { user, loading, userRole, isSuperAdmin, hasRole, memberships } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();

  // Durante la carga inicial de auth, evitar saltos o redirecciones prematuras
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-bg">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Verificando autorización...</span>
        </div>
      </div>
    );
  }

  // 1. Verificación de Autenticación
  if (!user) {
    // Redirección obligatoria a login guardando la ruta de origen y tenant (Sin bypass por query param)
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    const tenantParam = tenant.slug ? `&tenant=${encodeURIComponent(tenant.slug)}` : '';
    return <Navigate to={`/ingresar?redirectTo=${redirectTo}${tenantParam}`} replace state={{ from: location }} />;
  }

  // 2. Verificación de Super Admin
  if (requireSuperAdmin && !isSuperAdmin) {
    // A stale /superadmin destination must not strand organization staff on a 403.
    // Send them to their own canonical Hipotecaly backoffice instead.
    const staffRoles: UserRole[] = ['tenant_owner', 'tenant_admin', 'analyst', 'operator'];
    const activeStaffMembership = memberships.find(
      (m) => m.isActive && staffRoles.includes(m.role)
    );
    if (activeStaffMembership) {
      const organization = getAllRegisteredTenants().find(
        (candidate) => candidate.id === activeStaffMembership.organizationId
      );
      if (organization) {
        return <Navigate to={`/org/${organization.slug}/admin`} replace />;
      }
    }

    return (
      <AccessDenied
        requiredRoles={['super_admin']}
        currentRole={userRole}
        message="Esta consola de administración requiere privilegios de Super Admin global de HIPOTECALY."
      />
    );
  }

  // 3. Verificación de Roles Permitidos
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = hasRole(allowedRoles, requireTenantMatch ? tenant.id : undefined);
    if (!isAllowed) {
      return (
        <AccessDenied
          requiredRoles={allowedRoles}
          currentRole={userRole}
          message="Tu cuenta actual no cuenta con los roles necesarios para esta sección."
        />
      );
    }
  }

  // 4. Verificación de Aislamiento de Tenant (si se requiere coincidencia exacta)
  if (requireTenantMatch && !isSuperAdmin && tenant.id !== 'a0000000-0000-0000-0000-000000000001') {
    const belongsToTenant = memberships.some(
      (m) => m.organizationId === tenant.id && m.isActive
    );
    // External lenders are scoped by lenders.organization_id (production tenant guard) and mirrored into
    // trusted app_metadata by the backend. They are intentionally not rows in
    // organization_members, so tenant isolation must accept that authoritative
    // organization scope as well.
    const lenderOrganizationId =
      userRole === 'lender' && typeof user.app_metadata?.organization_id === 'string'
        ? user.app_metadata.organization_id
        : null;
    const hasExternalTenantScope =
      userRole === 'lender' && lenderOrganizationId === tenant.id;

    if (!belongsToTenant && !hasExternalTenantScope) {
      return (
        <AccessDenied
          message={`No pertenecés a la organización ${tenant.name}. Cambiá a tu tenant correspondiente.`}
          currentRole={userRole}
        />
      );
    }
  }

  return <>{children}</>;
};
