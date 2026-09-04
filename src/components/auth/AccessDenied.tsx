import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '../ui/Button';

interface AccessDeniedProps {
  requiredRoles?: string[];
  currentRole?: string | null;
  message?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRoles,
  currentRole,
  message = 'No tenés permisos para acceder a esta sección de la plataforma.',
}) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-bg">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-border shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
            403 · Acceso Denegado
          </span>
          <h1 className="text-2xl font-black text-navy tracking-tight mt-3">
            Permisos Insuficientes
          </h1>
          <p className="text-xs text-slate-muted leading-relaxed">
            {message}
          </p>
        </div>

        {requiredRoles && requiredRoles.length > 0 && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
            <div className="text-slate-500 font-medium">
              Roles autorizados:{' '}
              <span className="font-mono font-bold text-navy">
                {requiredRoles.join(', ')}
              </span>
            </div>
            {currentRole && (
              <div className="text-slate-500 font-medium">
                Tu rol actual:{' '}
                <span className="font-mono font-bold text-rose-600">
                  {currentRole}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link to="/" className="flex-1">
            <Button variant="secondary" size="md" fullWidth>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
            </Button>
          </Link>
          <Link to="/ingresar" className="flex-1">
            <Button variant="primary" size="md" fullWidth>
              <LogIn className="w-4 h-4 mr-2" /> Cambiar Cuenta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
