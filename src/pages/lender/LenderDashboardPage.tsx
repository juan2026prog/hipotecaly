import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LenderLayout } from '../../components/layout/LenderLayout';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface LenderOpportunityItem {
  id: string;
  public_id: string;
  zone: string;
  property_type: string;
  requested_amount: number;
  currency: string;
  preliminary_valuation: number;
  ltv: number;
  term_months: number;
  clearing: string;
  match_score: number;
  status: string;
  sent_at: string;
}

const DEMO_OPPORTUNITIES: LenderOpportunityItem[] = [
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
];

export const LenderDashboardPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<LenderOpportunityItem[]>(DEMO_OPPORTUNITIES);

  useEffect(() => {
    async function loadOpportunities() {
      if (!isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select(`
            id,
            status,
            created_at,
            match_score,
            lender_id,
            application:applications(
              id,
              public_id,
              requested_amount,
              currency,
              term_months,
              properties(
                city,
                department,
                property_type,
                estimated_value
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: LenderOpportunityItem[] = data.map((d: any) => {
            const app = d.application || {};
            const prop = Array.isArray(app.properties) ? app.properties[0] : (app.properties || {});
            const requested = Number(app.requested_amount) || 0;
            const valuation = Number(prop.estimated_value) || (requested > 0 ? requested * 2.5 : 200000);
            const ltv = valuation > 0 ? Math.round((requested / valuation) * 1000) / 10 : 35;
            const zone = [prop.city, prop.department].filter(Boolean).join(' · ') || 'Montevideo';
            const propertyType = prop.property_type || 'Casa';

            return {
              id: d.id,
              public_id: app.public_id || `HIP-${d.id.slice(0, 8).toUpperCase()}`,
              zone,
              property_type: propertyType,
              requested_amount: requested,
              currency: app.currency || 'USD',
              preliminary_valuation: valuation,
              ltv,
              term_months: app.term_months || 36,
              clearing: 'Sin antecedentes registrados',
              match_score: Number(d.match_score) || 90,
              status: d.status || 'sent',
              sent_at: 'Reciente',
            };
          });

          // Combinar con demo opportunities garantizando que opp-1 esté presente
          const combined = [...mapped];
          for (const demo of DEMO_OPPORTUNITIES) {
            if (!combined.some((o) => o.id === demo.id || o.public_id === demo.public_id)) {
              combined.push(demo);
            }
          }
          setOpportunities(combined);
        }
      } catch (err) {
        console.warn('Error cargando oportunidades de Supabase:', err);
      }
    }

    loadOpportunities();
  }, []);

  const metrics = {
    new: opportunities.filter((o) => o.status === 'sent').length,
    inReview: opportunities.filter((o) => o.status === 'under_review' || o.status === 'in_review').length,
    interested: opportunities.filter((o) => o.status === 'interested').length,
    offersSubmitted: opportunities.filter((o) => o.status === 'offer_submitted').length,
    closed: opportunities.filter((o) => o.status === 'funded' || o.status === 'closed').length,
  };

  return (
    <LenderLayout title="Panel de Oportunidades de Financiamiento">
      <div className="space-y-6">

        {/* 5 Tarjetas de Métricas (Regla 4.19) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Nuevas</span>
            <div className="text-2xl font-black text-navy mt-1">{metrics.new}</div>
            <span className="text-[11px] text-brand-green font-semibold">Por evaluar</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">En Revisión</span>
            <div className="text-2xl font-black text-navy mt-1">{metrics.inReview}</div>
            <span className="text-[11px] text-amber-600 font-semibold">Análisis preliminar</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Interesado</span>
            <div className="text-2xl font-black text-navy mt-1">{metrics.interested}</div>
            <span className="text-[11px] text-blue-600 font-semibold">En preparación</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Ofertas Enviadas</span>
            <div className="text-2xl font-black text-navy mt-1">{metrics.offersSubmitted}</div>
            <span className="text-[11px] text-purple-600 font-semibold">Presentada a cliente</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Cerradas</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.closed}</div>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-navy text-white px-2.5 py-0.5 rounded">
                      {opp.public_id}
                    </span>
                    <span className="text-xs font-bold text-navy">{opp.zone}</span>
                    <span className="text-[11px] text-slate-400">· {opp.property_type}</span>
                    <StatusBadge status={opp.status} size="sm" />
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
