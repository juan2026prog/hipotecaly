import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { getApplicationsList } from '../../lib/backofficeService';
import { useTenant } from '../../contexts/TenantContext';
import { Users, Mail, Phone, MapPin, ChevronRight, UserX, Search, BadgeCheck, FileText } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const { tenant } = useTenant();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadClients() {
      setLoading(true);
      const isDemo = Boolean(tenant.demo_mode);
      const apps = await getApplicationsList({ organizationId: tenant.id, useDemoMode: isDemo });

      // Agrupar por cliente — un cliente puede tener múltiples expedientes
      const clientMap = new Map<string, any>();
      apps.filter((app) => app.borrower).forEach((app) => {
        const key = app.borrower.email || app.borrower.id || app.id;
        if (!clientMap.has(key)) {
          clientMap.set(key, {
            id: app.borrower.id || app.id,
            name: `${app.borrower.first_name} ${app.borrower.last_name}`,
            email: app.borrower.email,
            phone: app.borrower.phone,
            department: app.borrower.department || app.property?.department || 'Montevideo',
            apps: [],
            kycCompleted: false,
          });
        }
        const client = clientMap.get(key)!;
        client.apps.push({ id: app.id, publicId: app.public_id, status: app.status });
        if (app.kyc_status === 'approved' || app.status === 'approved') client.kycCompleted = true;
      });

      setClients(Array.from(clientMap.values()));
      setLoading(false);
    }
    loadClients();
  }, [tenant.id, tenant.demo_mode]);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term) || c.phone?.includes(term);
  });

  const activeCount = clients.filter((c) => c.apps.some((a: any) => a.status !== 'rejected' && a.status !== 'approved')).length;
  const kycCount = clients.filter((c) => c.kycCompleted).length;

  return (
    <BackofficeLayout>
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
              CLIENTES & SOLICITANTES
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
              Directorio de Clientes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Solicitantes con expedientes activos e históricos bajo {tenant.name}.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total clientes', value: clients.length, icon: Users, color: 'text-[#102d49]' },
            { label: 'Con expediente activo', value: activeCount, icon: FileText, color: 'text-amber-700' },
            { label: 'KYC completado', value: kycCount, icon: BadgeCheck, color: 'text-emerald-700' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>{stat.label}</span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className={`text-2xl font-black font-serif ${stat.color}`}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 text-sm focus:border-[#102d49] focus:ring-2 focus:ring-[#102d49]/10"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-border shadow-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-brand-green" />
              {filtered.length} {search ? 'resultado(s)' : 'clientes registrados'}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Cargando directorio...</div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <UserX className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No hay clientes registrados aún.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Los solicitantes aparecerán aquí cuando completen el formulario en el portal de {tenant.name}.
              </p>
              <Link
                to="/"
                target="_blank"
                className="inline-flex items-center text-xs font-bold text-[#102d49] hover:text-brand-green mt-2"
              >
                Ver portal →
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No se encontraron clientes con "{search}".
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((client) => (
                <div
                  key={client.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-navy">{client.name}</h4>
                      {client.kycCompleted && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full flex items-center">
                          <BadgeCheck className="w-3 h-3 mr-0.5" /> KYC
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {client.email && (
                        <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />{client.email}</span>
                      )}
                      {client.phone && (
                        <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />{client.phone}</span>
                      )}
                      <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />{client.department}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-navy block">
                        {client.apps.length} expediente{client.apps.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {client.apps.filter((a: any) => a.status !== 'rejected' && a.status !== 'approved').length} activo{client.apps.filter((a: any) => a.status !== 'rejected' && a.status !== 'approved').length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {client.apps[0] && (
                      <Link
                        to={`/app/solicitudes/${client.apps[0].id}`}
                        className="p-2 text-slate-400 hover:text-brand-green hover:bg-slate-100 rounded-lg transition-colors"
                        title="Ver expediente principal"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BackofficeLayout>
  );
};
