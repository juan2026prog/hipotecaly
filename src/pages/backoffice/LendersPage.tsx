import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { Button } from '../../components/ui/Button';
import { getLendersList, Lender } from '../../lib/lendersService';
import { Plus, Shield, ArrowRight, CheckCircle2, PauseCircle, AlertCircle } from 'lucide-react';

export const LendersPage: React.FC = () => {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLendersList().then((res) => {
      setLenders(res.lenders);
      setLoading(false);
    });
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <PauseCircle className="w-3 h-3 mr-1" /> Pausado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            <AlertCircle className="w-3 h-3 mr-1" /> {status}
          </span>
        );
    }
  };

  return (
    <BackofficeLayout title="Red de Prestamistas e Inversores">
      <div className="space-y-6">
        
        {/* Header con botón de acción */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
              Prestamistas e Inversores Registrados
            </h2>
            <p className="text-xs sm:text-sm text-slate-muted mt-1">
              Administración de inversores privados, family offices y estudios con capital. Los datos de contacto son estrictamente confidenciales.
            </p>
          </div>
          <Button variant="primary" size="md" className="shrink-0 shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Nuevo Prestamista
          </Button>
        </div>

        {/* Banner Anti-Bypass */}
        <div className="p-4 rounded-xl bg-navy/5 border border-navy/10 flex items-start space-x-3 text-xs text-navy">
          <Shield className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
          <div>
            <strong>Protección de Intermediación (Anti-Bypass):</strong> Los prestamistas activos únicamente reciben expedientes en formato anonimizado y no pueden visualizar datos personales del solicitante sin revelación formalmente autorizada.
          </div>
        </div>

        {/* Tabla Desktop y Cards Móviles */}
        {loading ? (
          <div className="bg-white rounded-card p-12 text-center text-slate-muted border border-slate-border">
            Cargando catálogo de prestamistas...
          </div>
        ) : (
          <div className="bg-white rounded-card shadow-card border border-slate-border overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-text">
                <thead className="bg-slate-bg border-b border-slate-border font-bold text-navy uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Prestamista / Entidad</th>
                    <th className="px-5 py-3.5">Tipo</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5">LTV Máx</th>
                    <th className="px-5 py-3.5">Rango de Préstamo</th>
                    <th className="px-5 py-3.5">Clearing</th>
                    <th className="px-5 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border font-medium">
                  {lenders.map((lender) => (
                    <tr key={lender.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-navy text-sm">{lender.display_name}</div>
                        <div className="text-[11px] text-slate-400">{lender.legal_name || 'Inversor privado registrado'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="capitalize">{lender.lender_type.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(lender.status)}
                      </td>
                      <td className="px-5 py-4 font-bold text-navy">
                        {lender.rules ? `${Math.round(lender.rules.max_ltv * 100)}%` : '40%'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        USD {lender.rules?.min_loan.toLocaleString('es-UY') || '10.000'} - USD {lender.rules?.max_loan.toLocaleString('es-UY') || '200.000'}
                      </td>
                      <td className="px-5 py-4">
                        {lender.rules?.accepts_clearing ? (
                          <span className="text-emerald-700 font-semibold">Admite</span>
                        ) : (
                          <span className="text-slate-400">Solo limpio</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link to={`/app/prestamistas/${lender.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Ficha <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Versión Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-border">
              {lenders.map((lender) => (
                <div key={lender.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-navy text-sm">{lender.display_name}</h4>
                      <p className="text-[11px] text-slate-400">{lender.legal_name || 'Inversor privado'}</p>
                    </div>
                    {getStatusBadge(lender.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-bg p-2.5 rounded-lg">
                    <div>
                      <span className="text-slate-400 block text-[10px]">LTV Máximo</span>
                      <strong className="text-navy">{lender.rules ? `${Math.round(lender.rules.max_ltv * 100)}%` : '40%'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tope</span>
                      <strong className="text-navy">USD {lender.rules?.max_loan.toLocaleString('es-UY') || '200.000'}</strong>
                    </div>
                  </div>
                  <Link to={`/app/prestamistas/${lender.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Gestionar Ficha <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </BackofficeLayout>
  );
};
