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
  const { signUp } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const isFromSaveSimulation = searchParams.get('action') === 'save_simulation';
  const tenantParam = searchParams.get('tenant');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
