import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { AccessDenied } from './AccessDenied';

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

  // Soporte para modo presentación comercial o demo institucional
  const isDemoPresentation =
    Boolean(tenant.demo_mode) ||
    location.search.includes('presentation=true') ||
    location.search.includes('demo=true') ||
    location.pathname.startsWith('/demo/nova');

  // 1. Verificación de Autenticación
  if (!user) {
    if (isDemoPresentation) {
      // En modo demo o presentación comercial, se permite la navegación supervisada
      return <>{children}</>;
    }

    // Redirección obligatoria a login guardando la ruta de origen
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/ingresar?redirectTo=${redirectTo}`} replace state={{ from: location }} />;
  }

  // 2. Verificación de Super Admin
  if (requireSuperAdmin && !isSuperAdmin) {
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
    if (!belongsToTenant && !isDemoPresentation) {
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
