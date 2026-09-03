import React from 'react';
import { LenderLayout } from '../../components/layout/LenderLayout';
import { Clock, CheckCircle2 } from 'lucide-react';

export const LenderOffersPage: React.FC = () => {
  const offers = [
    {
      id: 'off-1',
      public_id: 'HIP-2026-00124',
      zone: 'Carrasco · Montevideo',
      amount: 100000,
      currency: 'USD',
      rate: 9.5,
      term_months: 36,
      status: 'submitted',
      created_at: 'Hoy',
    },
    {
      id: 'off-2',
      public_id: 'HIP-2026-00135',
      zone: 'Ciudad de la Costa · Canelones',
      amount: 80000,
      currency: 'USD',
      rate: 10.0,
      term_months: 48,
      status: 'presented',
      created_at: 'Ayer',
    },
  ];

  return (
    <LenderLayout title="Ofertas de Financiamiento Emitidas">
      <div className="space-y-6">
        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-border">
            <h2 className="text-base font-bold text-navy">Historial de Propuestas</h2>
            <p className="text-xs text-slate-500">Propuestas económicas enviadas para evaluación y presentación a los solicitantes.</p>
          </div>

          <div className="divide-y divide-slate-border text-xs">
            {offers.map((off) => (
              <div key={off.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold bg-navy text-white px-2 py-0.5 rounded text-[11px]">
                      {off.public_id}
                    </span>
                    <strong className="text-navy">{off.zone}</strong>
                  </div>
                  <div className="text-slate-500">
                    USD {off.amount.toLocaleString('es-UY')} · {off.rate}% Anual · {off.term_months} meses
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      off.status === 'presented'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {off.status === 'presented' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Presentada al cliente
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 mr-1" /> En revisión por mesa de crédito
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LenderLayout>
  );
};
