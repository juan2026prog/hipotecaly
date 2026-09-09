// ==============================================================================
// HIPOTECALY: Auth Callback Handler para Google OAuth y Supabase Auth
// Resuelve sesión, roles RBAC, membresías multi-tenant y redirige con seguridad.
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getAllRegisteredTenants } from '../../lib/tenantService';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin, userRole, memberships, loading: authLoading } = useAuth();

  const [statusText, setStatusText] = useState('Verificando autenticación con Google...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const processAuth = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');
        const explicitRedirect = searchParams.get('redirectTo');
        const tenantParam = searchParams.get('tenant');

        if (errorParam || errorDesc) {
          if (isMounted) {
            setErrorMessage(errorDesc || errorParam || 'Error en la autenticación con el proveedor.');
            setIsProcessing(false);
          }
          return;
        }

        // Si hay código de autorización PKCE pendiente de intercambio
        if (code) {
          setStatusText('Intercambiando código de seguridad...');
          try {
            await supabase.auth.exchangeCodeForSession(code);
          } catch {
            // Continuar si ya fue intercambiado por el listener global
          }
        }

        // Obtener sesión activa de Supabase
        setStatusText('Cargando perfil y credenciales...');
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

        if (sessionErr || !session?.user) {
          // Si aún está cargando la suscripción global de auth, esperar un momento
          if (authLoading) return;

          if (isMounted) {
            setErrorMessage('No se pudo establecer una sesión segura. Por favor, intentá nuevamente.');
            setIsProcessing(false);
          }
          return;
        }

        const currentUser = session.user;
        setStatusText('Resolviendo permisos y organización...');

        // 1. Resolver si es Super Admin
        let isSuper = isSuperAdmin;
        if (!isSuper) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', currentUser.id)
            .maybeSingle();
          if (profile?.is_super_admin) isSuper = true;
        }

        // 2. Resolver membresías de tenant
        const { data: memsData } = await supabase
          .from('organization_members')
          .select('organization_id, role, is_active')
          .eq('user_id', currentUser.id);

        const activeMems = memsData?.filter((m) => m.is_active) || [];

        // 3. Determinar tenant objetivo
        let targetTenantSlug = tenantParam || 'estudio-nova';
        if (activeMems.length > 0) {
          const primaryMem = activeMems.find((m) => m.organization_id !== 'a0000000-0000-0000-0000-000000000001') || activeMems[0];
          const matchTenant = getAllRegisteredTenants().find((t) => t.id === primaryMem.organization_id);
          if (matchTenant) targetTenantSlug = matchTenant.slug;
        }

        // 4. Determinar destino según perfil
        let destination = '';
        if (explicitRedirect && !explicitRedirect.startsWith('/auth') && !explicitRedirect.startsWith('/login') && !explicitRedirect.startsWith('/ingresar')) {
          destination = explicitRedirect;
        } else if (isSuper || currentUser.app_metadata?.role === 'super_admin' || currentUser.app_metadata?.role === 'platform_admin' || currentUser.app_metadata?.is_super_admin) {
          destination = '/superadmin';
        } else if (activeMems.some((m) => m.role === 'tenant_admin' || (m.role as string) === 'tenant_owner' || m.role === 'analyst' || m.role === 'operator')) {
          destination = `/demo/${targetTenantSlug}/admin`;
        } else if (activeMems.some((m) => m.role === 'notary')) {
          destination = '/notary';
        } else if (activeMems.some((m) => m.role === 'lender')) {
          destination = `/demo/${targetTenantSlug}/inversor`;
        } else {
          // Prestatario / Cliente
          destination = `/demo/${targetTenantSlug}/cliente`;
        }

        if (isMounted) {
          setStatusText('¡Autenticado con éxito! Redirigiendo...');
          setTimeout(() => {
            navigate(destination, { replace: true });
          }, 400);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Error inesperado durante la autenticación.');
          setIsProcessing(false);
        }
      }
    };

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [location.search, authLoading, isSuperAdmin, userRole, memberships, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        {/* Logo / Header */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-brand-green" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">
            HIPOTECALY<span className="text-brand-green">.</span>
          </span>
        </div>

        {isProcessing ? (
          <div className="space-y-4 py-4">
            <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Iniciando sesión segura</h3>
              <p className="text-xs text-slate-500">{statusText}</p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="space-y-4 py-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No pudimos completar el acceso</h3>
              <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 text-left">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/ingresar', { replace: true })}
              >
                Volver al inicio de sesión <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{statusText}</h3>
          </div>
        )}

        <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4">
          Conexión cifrada de extremo a extremo · Supabase Auth & Google OAuth
        </div>
      </div>
    </div>
  );
};
