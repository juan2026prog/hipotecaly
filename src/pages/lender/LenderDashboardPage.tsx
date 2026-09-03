import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LenderLayout } from '../../components/layout/LenderLayout';
import { Button } from '../../components/ui/Button';
import { ArrowRight } from 'lucide-react';

export const LenderDashboardPage: React.FC = () => {
  // Oportunidades anonimizadas enviadas a este prestamista
  const [opportunities] = useState([
    {
      id: 'opp-1',
      public_id: 'HIP-2026-00124',
      zone: 'Carrasco · Montevideo',
      property_type: 'Casa',
      requested_amount: 100000,
      currency: 'USD',
      preliminary_valuation: 300000,
      ltv: 33.3,
      term_months: 36,
      clearing: 'Sin antecedentes registrados',
      match_score: 94,
      status: 'sent',
      sent_at: 'Hace 2 horas',
    },
    {
      id: 'opp-2',
      public_id: 'HIP-2026-00128',
      zone: 'Pocitos · Montevideo',
      property_type: 'Apartamento',
      requested_amount: 60000,
      currency: 'USD',
      preliminary_valuation: 170000,
      ltv: 35.2,
      term_months: 48,
      clearing: 'Con antecedentes (en análisis)',
      match_score: 88,
      status: 'interested',
      sent_at: 'Ayer',
    },
    {
      id: 'opp-3',
      public_id: 'HIP-2026-00135',
      zone: 'Ciudad de la Costa · Canelones',
      property_type: 'Casa',
      requested_amount: 80000,
      currency: 'USD',
      preliminary_valuation: 220000,
      ltv: 36.4,
      term_months: 60,
      clearing: 'Sin antecedentes registrados',
      match_score: 91,
      status: 'offer_submitted',
      sent_at: 'Hace 3 días',
    },
  ]);

  return (
    <LenderLayout title="Panel de Oportunidades de Financiamiento">
      <div className="space-y-6">

        {/* 5 Tarjetas de Métricas (Regla 4.19) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Nuevas</span>
            <div className="text-2xl font-black text-navy mt-1">1</div>
            <span className="text-[11px] text-brand-green font-semibold">Por evaluar</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">En Revisión</span>
            <div className="text-2xl font-black text-navy mt-1">2</div>
            <span className="text-[11px] text-amber-600 font-semibold">Análisis preliminar</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Interesado</span>
            <div className="text-2xl font-black text-navy mt-1">1</div>
            <span className="text-[11px] text-blue-600 font-semibold">En preparación</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Ofertas Enviadas</span>
            <div className="text-2xl font-black text-navy mt-1">1</div>
            <span className="text-[11px] text-purple-600 font-semibold">Presentada a cliente</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Cerradas</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">2</div>
            <span className="text-[11px] text-emerald-700 font-semibold">Desembolsadas</span>
          </div>
        </div>

        {/* Listado de Oportunidades Anonimizadas */}
        <div className="bg-white rounded-card border border-slate-border shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy">Oportunidades Asignadas Recientes</h2>
              <p className="text-xs text-slate-500">Expedientes anonimizados que coinciden con sus reglas crediticias.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-border">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-navy text-white px-2.5 py-0.5 rounded">
                      {opp.public_id}
                    </span>
                    <span className="text-xs font-bold text-navy">{opp.zone}</span>
                    <span className="text-[11px] text-slate-400">· {opp.property_type}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Score {opp.match_score}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Monto Solicitado</span>
                      <strong className="text-navy font-bold">USD {opp.requested_amount.toLocaleString('es-UY')}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Valuación Preliminar</span>
                      <strong className="text-navy">USD {opp.preliminary_valuation.toLocaleString('es-UY')}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">LTV</span>
                      <strong className="text-brand-green font-bold">{opp.ltv}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Plazo Deseado</span>
                      <strong className="text-navy">{opp.term_months} meses</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <Link to={`/lender/oportunidades/${opp.id}`}>
                    <Button variant="primary" size="sm" className="w-full sm:w-auto">
                      Evaluar Oportunidad <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </LenderLayout>
  );
};
