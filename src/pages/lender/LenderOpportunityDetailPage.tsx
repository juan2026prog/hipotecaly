import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LenderLayout } from '../../components/layout/LenderLayout';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { saveOfferDraft, submitOfferByLender } from '../../lib/offersService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileCheck,
  Lock,
} from 'lucide-react';

export const LenderOpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<'sent' | 'interested' | 'declined' | 'offer_submitted'>('sent');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('LTV');
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Datos de la oportunidad
  const [oppData, setOppData] = useState({
    public_id: 'HIP-2026-00124',
    zone: 'Carrasco · Montevideo',
    property_type: 'Casa',
    match_score: 94,
    requested_amount: 100000,
    preliminary_valuation: 300000,
    ltv: 33.3,
    term_months: 36,
    surface: 240,
    bedrooms: 3,
    bathrooms: 2,
    application_id: 'e0000000-0000-0000-0000-000000000001',
    lender_id: 'c0000000-0000-0000-0000-000000000001',
  });

  // Formulario de Oferta
  const [offerAmount, setOfferAmount] = useState<number>(100000);
  const [offerTerm, setOfferTerm] = useState<number>(36);
  const [interestRate, setInterestRate] = useState<number>(9.5);
  const rateType: 'fixed' | 'variable' = 'fixed';
  const [repaymentType, setRepaymentType] = useState<'amortizing' | 'interest_only'>('amortizing');
  const [lenderFees, setLenderFees] = useState<number>(1500);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);

  useEffect(() => {
    if (!id || id === 'opp-1' || !isSupabaseConfigured) return;

    async function loadOpportunity() {
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select(`
            id,
            status,
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
                estimated_value,
                surface_sqm,
                bedrooms,
                bathrooms
              )
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          const app = (data as any).application || {};
          const prop = Array.isArray(app.properties) ? app.properties[0] : (app.properties || {});
          const requested = Number(app.requested_amount) || 100000;
          const val = Number(prop.estimated_value) || (requested * 2.5);
          const ltv = val > 0 ? Math.round((requested / val) * 1000) / 10 : 35;
          const zone = [prop.city, prop.department].filter(Boolean).join(' · ') || 'Montevideo';

          setOppData({
            public_id: app.public_id || `HIP-${(id || '').slice(0, 8).toUpperCase()}`,
            zone,
            property_type: prop.property_type || 'Casa',
            match_score: Number(data.match_score) || 90,
            requested_amount: requested,
            preliminary_valuation: val,
            ltv,
            term_months: Number(app.term_months) || 36,
            surface: Number(prop.surface_sqm) || 240,
            bedrooms: Number(prop.bedrooms) || 3,
            bathrooms: Number(prop.bathrooms) || 2,
            application_id: app.id || 'e0000000-0000-0000-0000-000000000001',
            lender_id: data.lender_id || 'c0000000-0000-0000-0000-000000000001',
          });
          setOfferAmount(requested);
          setOfferTerm(Number(app.term_months) || 36);
          if (data.status) {
            setStatus(data.status as any);
          }
        }
      } catch (err) {
        console.warn('Error al cargar oportunidad:', err);
      }
    }

    loadOpportunity();
  }, [id]);

  const handleInterest = async () => {
    setStatus('interested');
    if (id && id !== 'opp-1' && isSupabaseConfigured) {
      await supabase.from('opportunities').update({ status: 'interested' }).eq('id', id);
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('declined');
    setShowDeclineModal(false);
    if (id && id !== 'opp-1' && isSupabaseConfigured) {
      await supabase.from('opportunities').update({ status: 'declined' }).eq('id', id);
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOffer(true);
    const { offer } = await saveOfferDraft({
      application_id: oppData.application_id,
      lender_id: oppData.lender_id,
      amount: offerAmount,
      currency: 'USD',
      term_months: offerTerm,
      interest_rate: interestRate,
      rate_type: rateType,
      repayment_type: repaymentType,
      lender_fees: lenderFees,
      status: 'submitted',
    });

    if (offer) {
      await submitOfferByLender(offer.id);
      if (id && id !== 'opp-1' && isSupabaseConfigured) {
        await supabase.from('opportunities').update({ status: 'offer_submitted' }).eq('id', id);
      }
    }

    setSubmittingOffer(false);
    setOfferSuccess(true);
    setStatus('offer_submitted');
    setTimeout(() => {
      setShowOfferModal(false);
    }, 2000);
  };

  return (
    <LenderLayout title="Ficha Técnica Anonimizada de Oportunidad">
      <div className="space-y-6">

        {/* Barra superior con volver y estado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link to="/lender" className="inline-flex items-center text-xs text-slate-500 hover:text-navy font-semibold">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver al panel de oportunidades
          </Link>
          <div className="flex items-center space-x-2">
            <StatusBadge status={status} size="md" />
          </div>
        </div>

        {/* Banner Anti-Bypass */}
        <div className="p-4 rounded-xl bg-navy/5 border border-navy/15 flex items-start space-x-3 text-xs text-navy">
          <Lock className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Protección de Intermediación (Anti-Bypass):</strong> Por razones de estricta confidencialidad comercial, la dirección exacta, número de padrón y datos de contacto del propietario permanecen reservados. Podrán ser revelados previa aceptación formal de oferta y autorización en mesa de operaciones.
          </div>
        </div>

        {/* Ficha Técnica Anonimizada (Reglas 4.3 y 4.4) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna 1 y 2: Datos Técnicos del Expediente */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-6">
              
              <div className="flex items-start justify-between border-b border-slate-border pb-4">
                <div>
                  <span className="font-mono text-xs font-bold bg-navy text-white px-2.5 py-1 rounded">
                    {oppData.public_id}
                  </span>
                  <h2 className="text-xl font-black text-navy mt-2">
                    {oppData.zone}
                  </h2>
                  <p className="text-xs text-slate-500">Inmueble residencial tipo {oppData.property_type}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Match Score</span>
                  <div className="text-2xl font-black text-brand-green">{oppData.match_score}<span className="text-xs text-slate-400 font-normal">/100</span></div>
                </div>
              </div>

              {/* Indicadores Financieros Clave */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3.5 bg-slate-bg rounded-xl border border-slate-border">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Monto Solicitado</span>
                  <div className="text-lg font-black text-navy mt-0.5">USD {oppData.requested_amount.toLocaleString('es-UY')}</div>
                </div>

                <div className="p-3.5 bg-slate-bg rounded-xl border border-slate-border">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Valuación Preliminar</span>
                  <div className="text-lg font-black text-navy mt-0.5">USD {oppData.preliminary_valuation.toLocaleString('es-UY')}</div>
                  <span className="text-[10px] text-slate-500">Estimación algorítmica</span>
                </div>

                <div className="p-3.5 bg-slate-bg rounded-xl border border-slate-border">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">LTV Preliminar</span>
                  <div className="text-lg font-black text-brand-green mt-0.5">{oppData.ltv}%</div>
                  <span className="text-[10px] text-emerald-700">Límite: 40%</span>
                </div>

                <div className="p-3.5 bg-slate-bg rounded-xl border border-slate-border">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Plazo Solicitado</span>
                  <div className="text-base font-bold text-navy mt-0.5">{oppData.term_months} meses</div>
                </div>

                <div className="p-3.5 bg-slate-bg rounded-xl border border-slate-border">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Perfil de Ingresos</span>
                  <div className="text-base font-bold text-navy mt-0.5">Comprobables</div>
                  <span className="text-[10px] text-slate-500">Empleado dependiente</span>
                </div>

                <div className="p-3.5 bg-slate-bg rounded-xl border border-slate-border">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Clearing de Informes</span>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">Sin antecedentes</div>
                </div>
              </div>

              {/* Características de la Garantía */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Características del Inmueble</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                  <div className="p-2.5 bg-slate-50 rounded-lg">Superficie: <strong>{oppData.surface} m²</strong></div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">Dormitorios: <strong>{oppData.bedrooms}</strong></div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">Baños: <strong>{oppData.bathrooms}</strong></div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">Estado: <strong>Muy bueno</strong></div>
                </div>
              </div>

            </div>
          </div>

          {/* Columna 3: Panel de Acciones del Prestamista */}
          <div className="space-y-4">
            <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-4">
              <h3 className="text-sm font-bold text-navy">Decisión del Inversor</h3>
              <p className="text-xs text-slate-500">
                Seleccione su nivel de interés para esta operación. Puede enviar una propuesta económica no vinculante.
              </p>

              {status === 'sent' && (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    onClick={handleInterest}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Me interesa la operación
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full justify-center text-rose-600 hover:text-rose-700"
                    onClick={() => setShowDeclineModal(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> No me interesa (Declinar)
                  </Button>
                </div>
              )}

              {status === 'interested' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-50 text-xs text-blue-800 flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                    Has manifestado interés. Podés preparar tu oferta formal.
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    onClick={() => setShowOfferModal(true)}
                  >
                    <FileCheck className="w-4 h-4 mr-2" /> Crear Oferta Formal
                  </Button>
                </div>
              )}

              {status === 'offer_submitted' && (
                <div className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-800 space-y-2">
                  <div className="flex items-center font-bold">
                    <CheckCircle2 className="w-4 h-4 text-brand-green mr-1.5" /> Oferta Enviada
                  </div>
                  <p>Tu oferta ha sido transmitida a la mesa de operaciones para su presentación formal al prestatario.</p>
                </div>
              )}

              {status === 'declined' && (
                <div className="p-3 rounded-lg bg-slate-100 text-xs text-slate-600">
                  Has declinado esta oportunidad ({declineReason}).
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: DECLINAR OPORTUNIDAD */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleDecline} className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-floating">
            <h4 className="text-base font-bold text-navy">Motivo de Declinación</h4>
            <p className="text-xs text-slate-500">Ayuda al motor a calibrar futuras oportunidades.</p>
            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full h-10 px-3 border border-slate-border rounded-lg text-xs font-semibold text-navy bg-white"
            >
              <option value="LTV">LTV muy elevado para mi política</option>
              <option value="Monto">Monto fuera de mi liquidez actual</option>
              <option value="Zona">No opero en esta zona / departamento</option>
              <option value="Tipo">Prefiero otro tipo de inmueble</option>
              <option value="Plazo">Plazo no conveniente</option>
            </select>
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowDeclineModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirmar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREAR OFERTA FORMAL */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitOffer} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-floating animate-in fade-in">
            <div className="flex items-center space-x-2 text-navy border-b border-slate-border pb-3">
              <FileCheck className="w-5 h-5 text-brand-green" />
              <h4 className="text-base font-bold">Emitir Propuesta de Financiamiento</h4>
            </div>

            {offerSuccess ? (
              <div className="p-6 text-center text-xs text-emerald-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-brand-green mx-auto" />
                <h5 className="font-bold text-sm">¡Oferta enviada exitosamente!</h5>
                <p>La propuesta fue registrada y queda pendiente de validación por la mesa de crédito.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <CurrencyInput
                      label="Monto Ofertado"
                      value={offerAmount}
                      onChange={(v) => setOfferAmount(v)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-text mb-1">
                      Plazo (Meses)
                    </label>
                    <select
                      value={offerTerm}
                      onChange={(e) => setOfferTerm(Number(e.target.value))}
                      className="w-full h-11 px-3 border border-slate-border rounded-lg text-xs font-semibold text-navy bg-white"
                    >
                      {[12, 24, 36, 48, 60].map((m) => (
                        <option key={m} value={m}>{m} meses ({m / 12} años)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-text mb-1">
                      Tasa de Interés Anual (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full h-11 px-3 border border-slate-border rounded-lg text-sm font-semibold text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-text mb-1">
                      Tipo de Repago
                    </label>
                    <select
                      value={repaymentType}
                      onChange={(e) => setRepaymentType(e.target.value as any)}
                      className="w-full h-11 px-3 border border-slate-border rounded-lg text-xs font-semibold text-navy bg-white"
                    >
                      <option value="amortizing">Amortización mensual (Francés)</option>
                      <option value="interest_only">Solo intereses (Capital al final)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <CurrencyInput
                    label="Honorarios / Gastos del Prestamista (USD)"
                    value={lenderFees}
                    onChange={(v) => setLenderFees(v)}
                    helperText="Identifique claramente los honorarios correspondientes al análisis y estructuración."
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowOfferModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={submittingOffer}>
                    {submittingOffer ? 'Enviando...' : 'Enviar Propuesta Formal'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

    </LenderLayout>
  );
};
