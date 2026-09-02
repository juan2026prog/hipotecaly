import React from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { DEMO_APPLICATIONS } from '../../lib/backofficeService';
import { Users, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const clients = DEMO_APPLICATIONS.map((app) => ({
    id: app.borrower.id,
    name: `${app.borrower.first_name} ${app.borrower.last_name}`,
    email: app.borrower.email,
    phone: app.borrower.phone,
    department: app.borrower.department,
    appId: app.id,
    publicId: app.public_id,
    amount: app.requested_amount,
    status: app.status,
  }));

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Clientes y Solicitantes
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Directorio de solicitantes con expedientes activos bajo RLS.
          </p>
        </div>

        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-brand-green" /> Total Registrados: {clients.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {clients.map((client) => (
              <div
                key={client.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-navy">{client.name}</h4>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> {client.email}
                    </span>
                    <span className="flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> {client.phone}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {client.department}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <span className="font-mono text-xs font-bold text-navy block">{client.publicId}</span>
                    <span className="text-[11px] text-brand-green font-semibold">USD {client.amount.toLocaleString('es-UY')}</span>
                  </div>
                  <Link
                    to={`/app/solicitudes/${client.appId}`}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-brand-green hover:text-white transition-colors text-slate-600"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
};
