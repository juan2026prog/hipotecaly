import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogIn, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { adminQaService } from '../../lib/adminQaService';
import { useTenant } from '../../contexts/TenantContext';

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
  const { isQaSession, exitQaSession } = useAuth();
  const { tenant } = useTenant();
  const [switching, setSwitching] = useState(false);

  const targetRole = requiredRoles && requiredRoles.length > 0 ? requiredRoles[0] : 'analyst';

  const handleSwitchRole = async () => {
    setSwitching(true);
    try {
      await adminQaService.createSession({
        role: targetRole,
        tenantId: tenant.id,
        durationHours: 8,
      });
      window.location.reload();
    } catch {
      setSwitching(false);
      alert('No fue posible cambiar de rol automáticamente.');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-bg">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-border shadow-xl text-center space-y-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm ${
          isQaSession ? 'bg-amber-50 border border-amber-200 text-amber-600' : 'bg-rose-50 border border-rose-200 text-rose-600'
        }`}>
          {isQaSession ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
        </div>

        <div className="space-y-2">
          <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            isQaSession ? 'bg-amber-100 text-amber-900' : 'bg-rose-50 text-rose-600'
          }`}>
            {isQaSession ? 'SESIÓN QA · ROL NO COINCIDENTE' : '403 · Acceso Denegado'}
          </span>
          <h1 className="text-2xl font-black text-navy tracking-tight mt-3">
            {isQaSession ? 'Sección de Otro Rol' : 'Permisos Insuficientes'}
          </h1>
          <p className="text-xs text-slate-muted leading-relaxed">
            {isQaSession
              ? `Esta sesión QA corresponde al rol ${currentRole || 'actual'}. No se convierte automáticamente para preservar la integridad de pruebas.`
              : message}
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
                Tu rol QA actual:{' '}
                <span className="font-mono font-bold text-amber-700">
                  {currentRole}
                </span>
              </div>
            )}
          </div>
        )}

        {isQaSession ? (
          <div className="pt-2 space-y-2">
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={switching}
              onClick={handleSwitchRole}
              className="bg-navy hover:bg-slate-800 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${switching ? 'animate-spin' : ''}`} />
              Cambiar sesión QA a {targetRole}
            </Button>
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={exitQaSession}
              className="text-slate-700 border-slate-300"
            >
              Volver a Super Admin
            </Button>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
