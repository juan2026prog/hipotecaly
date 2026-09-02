import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/mi-cuenta';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Credenciales incorrectas o usuario no encontrado.');
    } else {
      navigate(redirectTo);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-bg">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md space-y-6 text-left">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-navy text-white flex items-center justify-center mx-auto shadow-sm">
              <Shield className="w-6 h-6 text-brand-green" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Ingresar a tu cuenta
            </h1>
            <p className="text-xs sm:text-sm text-slate-muted">
              Consultá el estado de tu solicitud o gestioná tu expediente hipotecario.
            </p>
          </div>

          <div className="bg-white rounded-card p-6 sm:p-8 border border-slate-border shadow-card">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-brand-green focus:ring-brand-green" />
                  <span>Recordarme</span>
                </label>
                <Link to="/recuperar-password" className="font-semibold text-brand-green hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
                  {loading ? 'Ingresando...' : 'Iniciar sesión'} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-muted space-y-2">
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
          </div>

          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />
            <span>Acceso seguro protegido con encriptación SSL</span>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
