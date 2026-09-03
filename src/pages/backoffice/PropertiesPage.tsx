import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getApplicationsList } from '../../lib/backofficeService';
import { useTenant } from '../../contexts/TenantContext';
import { MapPin, ChevronRight, Home } from 'lucide-react';

export const PropertiesPage: React.FC = () => {
  const { tenant } = useTenant();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const apps = await getApplicationsList({
        organizationId: tenant.id,
        useDemoMode: isDemo,
      });

      const props = apps
        .filter((app) => app.property)
        .map((app) => ({
          id: app.property.id || app.id,
          appId: app.id,
          publicId: app.public_id,
          type: app.property.property_type || 'Inmueble',
          department: app.property.department || 'Montevideo',
          neighborhood: app.property.neighborhood || '',
          estimatedValue: app.property.estimated_value || 0,
          surfaceM2: app.property.surface_m2 || 0,
          cadastralNumber: app.property.cadastral_number || 'A definir',
          legalStatus: app.property.legal_status || 'libre_gravamenes',
        }));

      setProperties(props);
      setLoading(false);
    }
    loadProperties();
  }, [tenant.id, tenant.demo_mode]);

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Garantías y Propiedades
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Registro de inmuebles asociados a solicitudes hipotecarias para {tenant.name}.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Cargando garantías...</div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-card p-12 border border-slate-border text-center space-y-3">
            <Home className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No hay garantías registradas aún.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Las propiedades asociadas a las solicitudes ingresadas se listarán en este panel.
            </p>
          </div>
        ) : (
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
                      <span className="font-bold text-navy">USD {Number(prop.estimatedValue).toLocaleString('es-UY')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Padrón</span>
                      <span className="font-bold text-slate-700">{prop.cadastralNumber}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/app/solicitudes/${prop.appId}`}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center border border-slate-200"
                >
                  Ver expediente <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </BackofficeLayout>
  );
};
