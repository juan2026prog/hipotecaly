import React from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { DEMO_APPLICATIONS } from '../../lib/backofficeService';
import { MapPin, ChevronRight } from 'lucide-react';

export const PropertiesPage: React.FC = () => {
  const properties = DEMO_APPLICATIONS.map((app) => ({
    id: app.property.id,
    appId: app.id,
    publicId: app.public_id,
    type: app.property.property_type,
    department: app.property.department,
    neighborhood: app.property.neighborhood,
    estimatedValue: app.property.estimated_value,
    surfaceM2: app.property.surface_m2,
    cadastralNumber: app.property.cadastral_number,
    legalStatus: app.property.legal_status,
  }));

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Garantías y Propiedades
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Registro de inmuebles asociados a solicitudes hipotecarias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-card p-5 border border-slate-border shadow-card flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-green-light text-brand-green-dark">
                    {prop.type}
                  </span>
                  <span className="font-mono text-xs font-bold text-navy">{prop.publicId}</span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-navy capitalize">
                    {prop.type} en {prop.neighborhood || prop.department}
                  </h4>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{prop.department}, Uruguay</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Valor Declarado</span>
                    <span className="font-bold text-navy">USD {prop.estimatedValue.toLocaleString('es-UY')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Superficie</span>
                    <span className="font-bold text-navy">{prop.surfaceM2} m²</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Padrón</span>
                    <span className="font-mono text-slate-700">{prop.cadastralNumber || 'A verificar'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Situación</span>
                    <span className="capitalize text-slate-700">{prop.legalStatus.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/app/solicitudes/${prop.appId}`}
                className="w-full py-2.5 rounded-btn bg-slate-50 hover:bg-slate-100 text-navy font-bold text-xs flex items-center justify-center space-x-1 transition-colors"
              >
                <span>Ver Expediente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </BackofficeLayout>
  );
};
