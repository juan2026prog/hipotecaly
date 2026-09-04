import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import {
  Opportunity,
  runMatchingForApplication,
  getOpportunitiesForApplication,
  sendOpportunitiesToLenders,
  overrideOpportunity,
} from '../../lib/matchingService';
import {
  Offer,
  presentOfferToBorrower,
  authorizeDataDisclosure,
  DisclosureCategory,
} from '../../lib/offersService';
import {
  CheckCircle2,
  XCircle,
  Send,
  Shield,
  Lock,
  ArrowRight,
  FileCheck,
  Percent,
} from 'lucide-react';

interface ApplicationMatchingTabProps {
  applicationId: string;
  publicId: string;
  department: string;
  propertyType: string;
  requestedAmount: number;
  currency: string;
  estimatedValue: number;
}

export const ApplicationMatchingTab: React.FC<ApplicationMatchingTabProps> = ({
  applicationId,
  publicId,
  department,
  propertyType,
  requestedAmount,
  currency,
  estimatedValue,
}) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOppIds, setSelectedOppIds] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Modal de Disclosure
  const [showDisclosureModal, setShowDisclosureModal] = useState(false);
  const [selectedLenderForDisclosure, setSelectedLenderForDisclosure] = useState<string>('');
  const [disclosureCategories, setDisclosureCategories] = useState<DisclosureCategory[]>(['contact']);
  const [disclosureReason, setDisclosureReason] = useState('Oferta aceptada. Procediendo a elaboración de minuta notarial.');
  const [disclosing, setDisclosing] = useState(false);
  const [disclosureSuccess, setDisclosureSuccess] = useState(false);

  // Ofertas de financiamiento para este expediente
  const [offers, setOffers] = useState<Offer[]>([
    {
      id: 'off-demo-1',
      application_id: applicationId,
      lender_id: 'c0000000-0000-0000-0000-000000000001',
      lender_name: 'Hipotecaly Capital (Prestamista Piloto)',
      amount: requestedAmount,
      currency: currency || 'USD',
      term_months: 36,
      interest_rate: 9.5,
      rate_type: 'fixed',
      repayment_type: 'amortizing',
      estimated_monthly_payment: Math.round(requestedAmount * 0.032),
      estimated_costs: 1800,
      lender_fees: 1500,
      other_costs: 300,
      early_cancellation_terms: 'Cancelación sin penalización luego del mes 12 con 30 días de preaviso.',
      notes_internal: 'Garantía sólida en zona de alta liquidez. Perfil apto.',
      notes_for_borrower: 'Propuesta de financiamiento con amortización mensual en dólares.',
      status: 'submitted',
      created_at: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    loadOpportunities();
    loadOffers();
  }, [applicationId]);

  const loadOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*, lender:lenders(display_name, name)')
        .eq('application_id', applicationId);
      if (!error && data && data.length > 0) {
        setOffers(
          data.map((o: any) => ({
            ...o,
            lender_name: o.lender?.display_name || o.lender?.name || 'Prestamista Asociado',
            estimated_monthly_payment:
              o.estimated_monthly_payment ||
              Math.round(o.amount * (o.interest_rate / 100 / 12)),
          }))
        );
      }
    } catch {
      // Mantener fallback controlado
    }
  };

  const loadOpportunities = async () => {
    setLoading(true);
    const res = await getOpportunitiesForApplication(applicationId);
    if (res.opportunities.length > 0) {
      setOpportunities(res.opportunities);
    }
    setLoading(false);
  };

  const handleRunMatching = async () => {
    setLoading(true);
    const res = await runMatchingForApplication(applicationId);
    if (res.opportunities.length > 0) {
      setOpportunities(res.opportunities);
    }
    setLoading(false);
  };

  const handleToggleSelect = (oppId: string) => {
    setSelectedOppIds((prev) =>
      prev.includes(oppId) ? prev.filter((id) => id !== oppId) : [...prev, oppId]
    );
  };

  const handleSendOpportunities = async () => {
    if (selectedOppIds.length === 0) return;
    setSending(true);
    const res = await sendOpportunitiesToLenders(selectedOppIds);
    setSending(false);
    if (res.success) {
      setSentSuccess(true);
      setShowPreviewModal(false);
      setSelectedOppIds([]);
      loadOpportunities();
      setTimeout(() => setSentSuccess(false), 3500);
    }
  };

  const handlePresentOffer = async (offerId: string) => {
    await presentOfferToBorrower(offerId);
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'presented' } : o))
    );
    try {
      await supabase
        .from('applications')
        .update({ status: 'offer_available', updated_at: new Date().toISOString() })
        .eq('id', applicationId);
    } catch {
      // Fallback
    }
  };

  const handleAuthorizeDisclosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLenderForDisclosure) return;
    setDisclosing(true);
    const res = await authorizeDataDisclosure(
      applicationId,
      selectedLenderForDisclosure,
      disclosureCategories,
      disclosureReason
    );
    setDisclosing(false);
    if (res.success) {
      setDisclosureSuccess(true);
      setShowDisclosureModal(false);
      setTimeout(() => setDisclosureSuccess(false), 3500);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* 1. SECCIÓN: MOTOR DE MATCHING */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-navy flex items-center">
              <Percent className="w-4 h-4 mr-2 text-brand-green" /> Motor de Matching y Scoring
            </h3>
            <p className="text-xs text-slate-500">
              Cálculo determinístico de elegibilidad contra las reglas activas de cada prestamista.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunMatching}
              disabled={loading}
            >
              {loading ? 'Evaluando...' : 'Re-ejecutar Matching'}
            </Button>
            {selectedOppIds.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPreviewModal(true)}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Enviar ({selectedOppIds.length})
              </Button>
            )}
          </div>
        </div>

        {sentSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center">
            <CheckCircle2 className="w-4 h-4 text-brand-green mr-2" />
            Oportunidades anonimizadas enviadas formalmente a los prestamistas seleccionados.
          </div>
        )}

        {/* Tabla de Oportunidades Matching */}
        <div className="bg-white rounded-xl border border-slate-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-text">
              <thead className="bg-slate-bg border-b border-slate-border font-bold text-navy uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        opportunities.length > 0 &&
                        selectedOppIds.length === opportunities.filter((o) => o.eligible).length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOppIds(opportunities.filter((o) => o.eligible).map((o) => o.id));
                        } else {
                          setSelectedOppIds([]);
                        }
                      }}
                      className="rounded text-brand-green"
                    />
                  </th>
                  <th className="px-4 py-3">Prestamista</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3">Reglas Evaluadas</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border font-medium">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedOppIds.includes(opp.id)}
                        onChange={() => handleToggleSelect(opp.id)}
                        disabled={!opp.eligible && !opp.manual_override}
                        className="rounded text-brand-green"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-navy">{opp.lender_name}</div>
                      <div className="text-[10px] text-slate-400">{opp.lender_type}</div>
                    </td>
                    <td className="px-4 py-3">
                      {opp.eligible || opp.manual_override ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> MATCH
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                          <XCircle className="w-3 h-3 mr-1" /> NO MATCH
                        </span>
                      )}
                      {opp.manual_override && (
                        <span className="block text-[9px] text-amber-600 font-semibold mt-0.5">
                          (Override Manual)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-extrabold text-navy text-sm">{opp.match_score}</span>
                      <span className="text-[10px] text-slate-400">/100</span>
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      {opp.eligible ? (
                        <span className="text-emerald-700">Cumple LTV, monto y departamento</span>
                      ) : (
                        <span className="text-rose-600">{opp.failed_rules.join(', ') || 'Condición de riesgo'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-[11px] font-semibold text-slate-600">
                        {opp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!opp.eligible && !opp.manual_override && (
                        <button
                          type="button"
                          onClick={async () => {
                            const reason = window.prompt('Motivo del override manual para este prestamista:');
                            if (reason) {
                              await overrideOpportunity(opp.id, reason);
                              await loadOpportunities();
                            }
                          }}
                          className="text-[11px] text-amber-700 hover:underline font-semibold"
                        >
                          Forzar Match
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: OFERTAS DE PRESTAMISTAS */}
      <div className="space-y-4 pt-4 border-t border-slate-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy flex items-center">
              <FileCheck className="w-4 h-4 mr-2 text-brand-green" /> Ofertas de Financiamiento Recibidas
            </h3>
            <p className="text-xs text-slate-500">
              Propuestas emitidas por prestamistas. Requieren validación antes de presentarlas al solicitante.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-xl border border-slate-border p-5 shadow-sm space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {offer.lender_name}
                  </span>
                  <div className="text-lg font-black text-navy mt-0.5">
                    USD {offer.amount.toLocaleString('es-UY')}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    offer.status === 'presented'
                      ? 'bg-emerald-100 text-emerald-800'
                      : offer.status === 'accepted'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {offer.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-bg rounded-lg text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">Tasa Anual</span>
                  <strong className="text-navy">{offer.interest_rate}% ({offer.rate_type})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Plazo</span>
                  <strong className="text-navy">{offer.term_months} meses</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Cuota Est.</span>
                  <strong className="text-brand-green">USD {offer.estimated_monthly_payment}</strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div><strong>Repago:</strong> {offer.repayment_type === 'amortizing' ? 'Amortización mensual (Francés)' : 'Solo intereses'}</div>
                <div><strong>Gastos estimativos:</strong> USD {offer.estimated_costs}</div>
                <div><strong>Condición anticipada:</strong> {offer.early_cancellation_terms}</div>
              </div>

              <div className="pt-2 border-t border-slate-border flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Vence: {new Date(offer.expires_at || Date.now()).toLocaleDateString('es-UY')}
                </span>
                {offer.status === 'submitted' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePresentOffer(offer.id)}
                  >
                    Presentar al Solicitante <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
                {offer.status === 'presented' && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Visible en portal del cliente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SECCIÓN: REVELACIÓN CONTROLADA DE DATOS (ANTI-BYPASS) */}
      <div className="space-y-4 pt-4 border-t border-slate-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-navy flex items-center">
              <Shield className="w-4 h-4 mr-2 text-brand-green" /> Revelación Controlada de Datos (Anti-Bypass)
            </h3>
            <p className="text-xs text-slate-500">
              Autorización granular de acceso a datos de contacto, títulos o dirección para formalización notarial.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedLenderForDisclosure(opportunities[0]?.lender_id || '');
              setShowDisclosureModal(true);
            }}
          >
            <Lock className="w-3.5 h-3.5 mr-1.5 text-brand-green" />
            Autorizar Revelación
          </Button>
        </div>

        {disclosureSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center">
            <CheckCircle2 className="w-4 h-4 text-brand-green mr-2" />
            Revelación autorizada y auditada inmutablemente en la base de datos.
          </div>
        )}
      </div>

      {/* MODAL: PREVIEW DE OPORTUNIDAD ANONIMIZADA ANTES DE ENVIAR */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-floating animate-in fade-in">
            <div className="flex items-center space-x-2 text-navy">
              <Shield className="w-5 h-5 text-brand-green" />
              <h4 className="text-base font-bold">Confirmar Envío Anonimizado (Anti-Bypass)</h4>
            </div>
            
            <p className="text-xs text-slate-600">
              Esta información será compartida con <strong>{selectedOppIds.length} prestamista(s)</strong>. Verifique que no contenga datos identificatorios del propietario:
            </p>

            <div className="p-4 bg-slate-bg rounded-xl border border-slate-border space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Expediente Público:</span>
                <strong className="font-mono text-navy">{publicId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Zona / Ubicación:</span>
                <strong>{department}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tipo de Inmueble:</span>
                <strong className="capitalize">{propertyType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor Estimado:</span>
                <strong>USD {estimatedValue.toLocaleString('es-UY')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monto Solicitado:</span>
                <strong className="text-brand-green">USD {requestedAmount.toLocaleString('es-UY')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">LTV Estimado:</span>
                <strong>{Math.round((requestedAmount / (estimatedValue || 1)) * 100)}%</strong>
              </div>
              <div className="pt-2 border-t border-slate-border text-[11px] text-slate-500">
                🔒 <em>Dirección exacta, padrón, cédula y teléfonos se mantienen 100% ocultos.</em>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreviewModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSendOpportunities} disabled={sending}>
                {sending ? 'Enviando...' : 'Confirmar y Enviar Oportunidades'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AUTORIZAR REVELACIÓN DE DATOS */}
      {showDisclosureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleAuthorizeDisclosure} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-floating animate-in fade-in">
            <h4 className="text-base font-bold text-navy flex items-center">
              <Lock className="w-4 h-4 mr-2 text-brand-green" />
              Autorizar Revelación de Información
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-text mb-1">Prestamista Destinatario</label>
              <select
                value={selectedLenderForDisclosure}
                onChange={(e) => setSelectedLenderForDisclosure(e.target.value)}
                className="w-full h-10 px-3 border border-slate-border rounded-lg text-xs font-semibold text-navy bg-white"
                required
              >
                {opportunities.map((o) => (
                  <option key={o.lender_id} value={o.lender_id}>
                    {o.lender_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-text mb-1">Categorías a Revelar</label>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'contact', label: 'Datos de Contacto (Teléfono y Email)' },
                  { id: 'exact_address', label: 'Dirección Exacta y Padrón Catastral' },
                  { id: 'property_documents', label: 'Títulos de Propiedad y Certificados' },
                  { id: 'income_documents', label: 'Comprobantes de Ingresos' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={disclosureCategories.includes(item.id as DisclosureCategory)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDisclosureCategories([...disclosureCategories, item.id as DisclosureCategory]);
                        } else {
                          setDisclosureCategories(disclosureCategories.filter((c) => c !== item.id));
                        }
                      }}
                      className="rounded text-brand-green"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-text mb-1">Motivo Legal / Operativo</label>
              <textarea
                value={disclosureReason}
                onChange={(e) => setDisclosureReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-slate-border rounded-lg text-xs"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowDisclosureModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={disclosing}>
                {disclosing ? 'Autorizando...' : 'Autorizar y Registrar'}
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
