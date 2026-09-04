import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Credenciales incorrectas o usuario no encontrado.');
    } else {
      const emailLower = email.trim().toLowerCase();
      if (emailLower === 'admin' || emailLower.startsWith('admin')) {
        navigate(redirectTo || '/platform-admin');
      } else if (emailLower === 'operador' || emailLower.startsWith('operador') || emailLower.startsWith('analyst')) {
        navigate(redirectTo || '/app');
      } else if (emailLower === 'prestamista' || emailLower.startsWith('prestamista') || emailLower.startsWith('lender')) {
        navigate(redirectTo || '/lender');
      } else {
        navigate(redirectTo || '/mi-cuenta');
      }
    }
  };

  const handleDemoLogin = async (role: 'super_admin' | 'analyst' | 'borrower' | 'lender', targetPath: string) => {
    const credentials = {
      super_admin: { u: 'admin', p: 'admin123' },
      analyst: { u: 'operador', p: 'demo123' },
      borrower: { u: 'cliente', p: 'demo123' },
      lender: { u: 'prestamista', p: 'demo123' },
    }[role];
    setLoading(true);
    setErrorMessage(null);
    const { error } = await signIn(credentials.u, credentials.p);
    setLoading(false);
    if (!error) {
      navigate(targetPath);
    } else {
      setErrorMessage(error.message);
    }
  };

  return (
    <AuthLayout
      title="Ingresar a tu cuenta"
      subtitle="Consultá el estado de tu solicitud o gestioná tu expediente hipotecario."
    >
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Usuario o Email"
          type="text"
          required
          placeholder="admin o tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Contraseña"
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
            Acceso Rápido de Prueba (Demo)
          </span>
          <span className="text-[10px] text-brand-green font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
            1-Click
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('super_admin', '/platform-admin')}
            className="p-2.5 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 text-left transition-colors text-xs group"
          >
            <span className="font-bold text-amber-950 block group-hover:text-amber-700">👑 Super Admin</span>
            <span className="text-[10px] text-amber-800 font-mono block mt-0.5">admin / admin123</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('analyst', '/app')}
            className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-left transition-colors text-xs group"
          >
            <span className="font-bold text-blue-950 block group-hover:text-blue-700">🏢 Backoffice (SaaS)</span>
            <span className="text-[10px] text-blue-800 font-mono block mt-0.5">operador / demo123</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('borrower', '/mi-cuenta')}
            className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-left transition-colors text-xs group"
          >
            <span className="font-bold text-emerald-950 block group-hover:text-emerald-700">👤 Solicitante</span>
            <span className="text-[10px] text-emerald-800 font-mono block mt-0.5">cliente / demo123</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemoLogin('lender', '/lender')}
            className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 text-left transition-colors text-xs group"
          >
            <span className="font-bold text-purple-950 block group-hover:text-purple-700">💼 Prestamista</span>
            <span className="text-[10px] text-purple-800 font-mono block mt-0.5">prestamista / demo123</span>
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
