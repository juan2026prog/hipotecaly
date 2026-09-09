import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAuth } from '../../contexts/AuthContext';
import { getAllRegisteredTenants } from '../../lib/tenantService';
import { ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const searchParams = new URLSearchParams(location.search);
  const isFromSaveSimulation = searchParams.get('action') === 'save_simulation';
  const tenantParam = searchParams.get('tenant');

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle({
      redirectTo,
      targetTenantSlug: tenantParam || undefined,
      intent: isFromSaveSimulation ? 'borrower_signup' : 'generic_login',
    });
    if (error) {
      setGoogleLoading(false);
      setErrorMessage(error.message || 'Error al conectar con Google.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const { error, role, isSuperAdmin: isSuper, memberships: userMems } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Credenciales incorrectas o usuario no encontrado.');
    } else {
      let targetTenantSlug = tenantParam || 'estudio-nova';
      if (userMems && userMems.length > 0) {
        const activeMem = userMems.find((m) => m.isActive && m.organizationId !== 'a0000000-0000-0000-0000-000000000001') || userMems[0];
        if (activeMem) {
          const allTenants = getAllRegisteredTenants();
          const match = allTenants.find((t) => t.id === activeMem.organizationId);
          if (match) targetTenantSlug = match.slug;
        }
      }

      let destination = '';
      if (redirectTo) {
        destination = redirectTo;
      } else if (isSuper || role === 'super_admin' || role === 'platform_admin') {
        destination = '/superadmin';
      } else if (role === 'tenant_admin' || role === 'tenant_owner' || role === 'analyst' || role === 'operator') {
        destination = `/demo/${targetTenantSlug}/admin`;
      } else if (role === 'notary') {
        destination = '/notary';
      } else if (role === 'lender') {
        destination = `/demo/${targetTenantSlug}/inversor`;
      } else {
        const clientTarget = `/demo/${targetTenantSlug}/cliente`;
        destination = isFromSaveSimulation ? `${clientTarget}?tab=simulaciones&saved=true` : clientTarget;
      }

      console.log('[AUTH] redirect ->', destination);
      navigate(destination);
    }
  };

  const handleDemoLogin = async (roleType: 'super_admin' | 'analyst' | 'borrower' | 'lender' | 'notary', targetPath: string) => {
    const credentials = {
      super_admin: { u: 'admin@hipotecaly.uy', p: 'admin123' },
      analyst: { u: 'operador@hipotecaly.uy', p: 'demo123' },
      borrower: { u: 'cliente@hipotecaly.uy', p: 'demo123' },
      lender: { u: 'prestamista@hipotecaly.uy', p: 'demo123' },
      notary: { u: 'escribano@hipotecaly.uy', p: 'demo123' },
    }[roleType];
    setLoading(true);
    setErrorMessage(null);
    const { error } = await signIn(credentials.u, credentials.p);
    setLoading(false);
    if (!error) {
      console.log('[AUTH] demo redirect ->', targetPath);
      navigate(targetPath);
    } else {
      setErrorMessage(error.message);
    }
  };

  return (
    <AuthLayout
      title="Ingresar a tu cuenta"
      subtitle={
        isFromSaveSimulation
          ? "Iniciá sesión para guardar esta simulación y consultarla cuando quieras."
          : "Consultá el estado de tu solicitud o gestioná tu expediente hipotecario."
      }
    >
      {isFromSaveSimulation && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-900 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Simulación lista:</strong> Al iniciar sesión, guardaremos automáticamente el cálculo realizado en tu cuenta.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Botón de Acceso Rápido con Google OAuth */}
      <div className="space-y-4 mb-5">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition-all flex items-center justify-center space-x-3 disabled:opacity-60 disabled:cursor-not-allowed hover:border-slate-400 active:scale-[0.99]"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            o con tu usuario / email
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Usuario o Email"
          name="email"
          type="email"
          required
          placeholder="admin o tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Contraseña"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <Checkbox
            label="Recordarme"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link to="/recuperar-password" className="font-semibold text-brand-green hover:underline whitespace-nowrap">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>

      {/* Panel de Acceso Rápido de Demostración y QA */}
      <div className="mt-6 pt-5 border-t border-slate-200 space-y-3 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-500" />
            Acceso Rápido Demo / Pruebas
          </span>
          <span className="text-[10px] text-brand-green font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
            1-Click Demo
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('borrower', '/demo/estudio-nova/cliente')}
            className="p-2.5 rounded-xl border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-left transition-all text-xs group shadow-xs"
          >
            <span className="font-bold text-emerald-950 block group-hover:text-emerald-700">👤 Portal Cliente</span>
            <span className="text-[10px] text-emerald-800 font-mono block mt-0.5">cliente / demo123</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('analyst', '/demo/estudio-nova/admin')}
            className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-left transition-colors text-xs group"
          >
            <span className="font-bold text-blue-950 block group-hover:text-blue-700">🏢 Backoffice</span>
            <span className="text-[10px] text-blue-800 font-mono block mt-0.5">operador / demo123</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('notary', '/notary')}
            className="p-2.5 rounded-xl border border-teal-300 bg-teal-50/70 hover:bg-teal-100/80 text-left transition-colors text-xs group"
          >
            <span className="font-bold text-teal-950 block group-hover:text-teal-700">📜 Escribano</span>
            <span className="text-[10px] text-teal-800 font-mono block mt-0.5">escribano / demo123</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('lender', '/demo/estudio-nova/inversor')}
            className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-left transition-colors text-xs group"
          >
            <span className="font-bold text-purple-950 block group-hover:text-purple-700">💼 Inversores</span>
            <span className="text-[10px] text-purple-800 font-mono block mt-0.5">prestamista / demo123</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('super_admin', '/admin')}
            className="p-2.5 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 text-left transition-colors text-xs group"
          >
            <span className="font-bold text-amber-950 block group-hover:text-amber-700">👑 Super Admin</span>
            <span className="text-[10px] text-amber-800 font-mono block mt-0.5">admin / admin123</span>
          </button>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-muted space-y-2">
        <p>
          ¿Todavía no tenés cuenta?{' '}
          <Link to="/registro" className="font-bold text-navy hover:text-brand-green underline">
            Registrate aquí
          </Link>
        </p>
        <p>
          ¿Querés solicitar financiación?{' '}
          <Link to="/simulador" className="font-semibold text-brand-green hover:underline">
            Iniciar simulación
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
