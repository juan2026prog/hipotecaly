import React, { useState, useEffect } from 'react';
import { LenderLayout } from '../../components/layout/LenderLayout';
import { Clock, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface OfferItem {
  id: string;
  public_id: string;
  zone: string;
  amount: number;
  currency: string;
  rate: number;
  term_months: number;
  status: string;
  created_at: string;
}

const DEMO_OFFERS: OfferItem[] = [
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

export const LenderOffersPage: React.FC = () => {
  const [offers, setOffers] = useState<OfferItem[]>(DEMO_OFFERS);

  useEffect(() => {
    async function loadOffers() {
      if (!isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase
          .from('offers')
          .select(`
            id,
            amount,
            currency,
            interest_rate,
            term_months,
            status,
            created_at,
            application:applications(
              id,
              public_id,
              properties(city, department)
            )
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: OfferItem[] = data.map((d: any) => {
            const app = d.application || {};
            const prop = Array.isArray(app.properties) ? app.properties[0] : (app.properties || {});
            const zone = [prop.city, prop.department].filter(Boolean).join(' · ') || 'Montevideo';

            return {
              id: d.id,
              public_id: app.public_id || `HIP-${d.id.slice(0, 8).toUpperCase()}`,
              zone,
              amount: Number(d.amount) || 0,
              currency: d.currency || 'USD',
              rate: Number(d.interest_rate) || 0,
              term_months: Number(d.term_months) || 36,
              status: d.status || 'submitted',
              created_at: 'Reciente',
            };
          });

          const combined = [...mapped];
          for (const demo of DEMO_OFFERS) {
            if (!combined.some((o) => o.id === demo.id || o.public_id === demo.public_id)) {
              combined.push(demo);
            }
          }
          setOffers(combined);
        }
      } catch (err) {
        console.warn('Error al cargar ofertas de prestamista:', err);
      }
    }

    loadOffers();
  }, []);

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
