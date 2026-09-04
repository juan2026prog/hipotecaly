import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
