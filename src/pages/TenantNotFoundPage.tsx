import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const TenantNotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <Building2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Código: TENANT_NOT_FOUND
          </span>
          <h1 className="text-2xl font-black text-navy tracking-tight pt-1">
            Organización No Encontrada
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            El portal o identificador al que intentás acceder no existe, no está activo o se encuentra en proceso de configuración.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 text-left space-y-1">
          <p className="font-semibold text-slate-700">Recomendaciones de acceso:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Verificá que el enlace o subdominio esté correctamente escrito.</li>
            <li>Si sos cliente institucional, contactá al soporte de tu financiera.</li>
          </ul>
        </div>

        <div className="pt-2">
          <Link to="/">
            <Button variant="outline" size="md" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Ir a Hipotecaly Central
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
