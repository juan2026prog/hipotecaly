import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modo actualización de contraseña al recibir token de recuperación
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    // Detectar si la URL contiene token de recuperación en hash o search
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const search = typeof window !== 'undefined' ? window.location.search : '';
    if (hash.includes('type=recovery') || hash.includes('access_token') || search.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetErr } = await resetPassword(email);
    setLoading(false);

    if (resetErr) {
      setError(resetErr.message);
    } else {
      setSuccess(true);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setPasswordUpdated(true);
      setTimeout(() => {
        navigate('/ingresar');
      }, 2500);
    }
  };

  if (isRecoveryMode) {
    return (
      <AuthLayout
        title="Crear nueva contraseña"
        subtitle="Ingresá tu nueva clave para recuperar el acceso a tu cuenta."
      >
        {passwordUpdated ? (
          <div className="text-center space-y-4 py-3">
            <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto" />
            <h3 className="text-lg font-bold text-navy">¡Contraseña actualizada con éxito!</h3>
            <p className="text-xs text-slate-muted leading-relaxed">
              Redirigiendo a la pantalla de inicio de sesión...
            </p>
            <div className="pt-2">
              <Link to="/ingresar">
                <Button variant="primary" size="md" fullWidth>
                  Iniciar sesión ahora
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Nueva contraseña"
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              label="Confirmar nueva contraseña"
              type="password"
              required
              placeholder="Repetí la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? 'Guardando contraseña...' : 'Actualizar contraseña'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Ingresá tu correo electrónico y te enviaremos un enlace seguro para restablecerla."
    >
      {success ? (
        <div className="text-center space-y-4 py-3">
          <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto" />
          <h3 className="text-lg font-bold text-navy">Correo de recuperación enviado</h3>
          <p className="text-xs text-slate-muted leading-relaxed">
            Si existe una cuenta asociada a <strong>{email}</strong>, recibirás las instrucciones en breve.
          </p>
          <div className="pt-2">
            <Link to="/ingresar">
              <Button variant="primary" size="md" fullWidth>
                Volver a iniciar sesión
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRequestReset} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email registrado"
            type="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace'} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="text-center pt-2">
            <Link to="/ingresar" className="text-xs font-semibold text-slate-500 hover:text-navy">
              ← Regresar al login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
