import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signInWithGoogle } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const isFromSaveSimulation = searchParams.get('action') === 'save_simulation';
  const tenantParam = searchParams.get('tenant');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle({
      targetTenantSlug: tenantParam || undefined,
      intent: 'borrower_signup',
    });
    if (error) {
      setGoogleLoading(false);
      setErrorMessage(error.message || 'Error al conectar con Google.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const { error } = await signUp(email, password, { firstName, lastName, phone });
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Error al crear tu cuenta. Por favor verificá los datos.');
    } else {
      const clientTarget = tenantParam
        ? `/demo/${tenantParam}/cliente`
        : '/demo/estudio-nova/cliente';

      if (isFromSaveSimulation) {
        navigate(`${clientTarget}?tab=simulaciones&saved=true`);
      } else {
        navigate(clientTarget);
      }
    }
  };

  return (
    <AuthLayout
      title="Creá tu cuenta"
      subtitle={
        isFromSaveSimulation
          ? "Registrate para guardar tu simulación y consultarla cuando quieras."
          : "Comenzá tu solicitud y gestioná tu expediente hipotecario con total seguridad."
      }
    >
      {isFromSaveSimulation && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-900 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Simulación lista:</strong> Al registrarte, guardaremos automáticamente el cálculo realizado en tu cuenta.
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
          onClick={handleGoogleSignup}
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
          <span>{googleLoading ? 'Conectando con Google...' : 'Registrarse con Google'}</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            o con formulario de registro
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre"
            type="text"
            required
            placeholder="Juan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label="Apellido"
            type="text"
            required
            placeholder="Pérez"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <Input
          label="Teléfono Celular"
          type="tel"
          required
          placeholder="099 123 456"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          helperText="Para recibir novedades sobre tu solicitud."
        />

        <Input
          label="Email"
          type="email"
          required
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Contraseña"
          type="password"
          required
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="text-xs text-slate-500 pt-1">
          Al registrarte aceptás nuestros{' '}
          <Link to="/terminos" className="text-brand-green font-semibold hover:underline">
            Términos del Servicio
          </Link>{' '}
          y{' '}
          <Link to="/privacidad" className="text-brand-green font-semibold hover:underline">
            Política de Privacidad
          </Link>.
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-muted">
        ¿Ya tenés una cuenta?{' '}
        <Link to="/ingresar" className="font-bold text-navy hover:text-brand-green underline">
          Iniciar sesión
        </Link>
      </div>
    </AuthLayout>
  );
};
