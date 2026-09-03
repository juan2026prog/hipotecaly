import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { Button } from '../../components/ui/Button';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { getLenderById, saveLenderRules, Lender, LenderRules } from '../../lib/lendersService';
import { ArrowLeft, Save, CheckCircle2, ListChecks } from 'lucide-react';

export const LenderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lender, setLender] = useState<Lender | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'reglas' | 'oportunidades' | 'ofertas' | 'actividad'>('resumen');
  
  // Estados para edición de reglas
  const [maxLtv, setMaxLtv] = useState<number>(40);
  const [minLoan, setMinLoan] = useState<number>(10000);
  const [maxLoan, setMaxLoan] = useState<number>(200000);
  const [minTerm, setMinTerm] = useState<number>(12);
  const [maxTerm, setMaxTerm] = useState<number>(60);
  const [acceptsClearing, setAcceptsClearing] = useState<boolean>(true);
  const [savingRules, setSavingRules] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      getLenderById(id).then((res) => {
        if (res.lender) {
          setLender(res.lender);
          if (res.lender.rules) {
            setMaxLtv(Math.round(res.lender.rules.max_ltv * 100));
            setMinLoan(res.lender.rules.min_loan);
            setMaxLoan(res.lender.rules.max_loan);
            setMinTerm(res.lender.rules.min_term_months);
            setMaxTerm(res.lender.rules.max_term_months);
            setAcceptsClearing(res.lender.rules.accepts_clearing);
          }
        }
        setLoading(false);
      });
    }
  }, [id]);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lender) return;
    setSavingRules(true);
    const updatedRules: Partial<LenderRules> = {
      max_ltv: maxLtv / 100,
      min_loan: minLoan,
      max_loan: maxLoan,
      min_term_months: minTerm,
      max_term_months: maxTerm,
      accepts_clearing: acceptsClearing,
    };
    const { success } = await saveLenderRules(lender.id, updatedRules);
    setSavingRules(false);
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  if (loading) {
    return (
      <BackofficeLayout title="Ficha de Prestamista">
        <div className="bg-white p-12 rounded-card text-center text-slate-muted">Cargando prestamista...</div>
      </BackofficeLayout>
    );
  }

  if (!lender) {
    return (
      <BackofficeLayout title="Prestamista no encontrado">
        <div className="bg-white p-12 rounded-card text-center">
          <p className="text-slate-muted mb-4">No se encontró el prestamista solicitado.</p>
          <Link to="/app/prestamistas">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Volver al catálogo</Button>
          </Link>
        </div>
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout title={`Ficha: ${lender.display_name}`}>
      <div className="space-y-6">

        {/* Barra superior con volver y estado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link to="/app/prestamistas" className="inline-flex items-center text-xs text-slate-500 hover:text-navy font-semibold">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Prestamistas
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
              {lender.status}
            </span>
            <span className="text-xs text-slate-500">
              Capital declarado: <strong>USD {lender.available_capital?.toLocaleString('es-UY') || '1.500.000'}</strong>
            </span>
          </div>
        </div>

        {/* Encabezado del Prestamista */}
        <div className="bg-white rounded-card p-6 border border-slate-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-navy">{lender.display_name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{lender.legal_name || 'Entidad financiera / Inversor privado'}</p>
          </div>
          <div className="text-xs text-slate-600 bg-slate-bg p-3 rounded-lg border border-slate-border">
            <div className="font-semibold text-navy">Contacto Interno (Confidencial):</div>
            <div>{lender.contact_name} · {lender.contact_email}</div>
            <div>{lender.contact_phone}</div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="border-b border-slate-border flex space-x-2 overflow-x-auto">
          {[
            { id: 'resumen', label: 'Resumen' },
            { id: 'reglas', label: 'Reglas Crediticias' },
            { id: 'oportunidades', label: 'Oportunidades Asignadas' },
            { id: 'ofertas', label: 'Ofertas Emitidas' },
            { id: 'actividad', label: 'Historial de Cambios' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-green text-navy'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido de Pestaña: Reglas Crediticias */}
        {activeTab === 'reglas' && (
          <form onSubmit={handleSaveRules} className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-6">
            <div>
              <h3 className="text-base font-bold text-navy">Reglas Financieras del Prestamista</h3>
              <p className="text-xs text-slate-500">
                Estas reglas determinan el matching automático con los expedientes analizados. Las modificaciones quedan registradas inmutablemente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-text mb-1">
                  LTV Máximo Permitido (%)
                </label>
                <input
                  type="number"
                  value={maxLtv}
                  onChange={(e) => setMaxLtv(Number(e.target.value))}
                  min={5}
                  max={60}
                  className="w-full h-11 px-3 border border-slate-border rounded-lg text-sm font-semibold text-navy"
                />
                <span className="text-[11px] text-slate-400">Porcentaje máximo del valor de la garantía.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-text mb-1">
                  Admite Solicitudes con Clearing
                </label>
                <select
                  value={acceptsClearing ? 'si' : 'no'}
                  onChange={(e) => setAcceptsClearing(e.target.value === 'si')}
                  className="w-full h-11 px-3 border border-slate-border rounded-lg text-sm font-semibold text-navy bg-white"
                >
                  <option value="si">Sí — Admite análisis con antecedentes en Clearing</option>
                  <option value="no">No — Requiere historial crediticio 100% limpio</option>
                </select>
              </div>

              <div>
                <CurrencyInput
                  label="Monto Mínimo Financiable"
                  value={minLoan}
                  onChange={(v) => setMinLoan(v)}
                />
              </div>

              <div>
                <CurrencyInput
                  label="Monto Máximo Financiable (Tope)"
                  value={maxLoan}
                  onChange={(v) => setMaxLoan(v)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-text mb-1">
                  Plazo Mínimo (Meses)
                </label>
                <input
                  type="number"
                  value={minTerm}
                  onChange={(e) => setMinTerm(Number(e.target.value))}
                  className="w-full h-11 px-3 border border-slate-border rounded-lg text-sm font-semibold text-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-text mb-1">
                  Plazo Máximo (Meses)
                </label>
                <input
                  type="number"
                  value={maxTerm}
                  onChange={(e) => setMaxTerm(Number(e.target.value))}
                  className="w-full h-11 px-3 border border-slate-border rounded-lg text-sm font-semibold text-navy"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-border flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-xs font-semibold text-emerald-700 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-brand-green" /> Reglas guardadas y auditadas exitosamente
                </span>
              ) : <div />}
              <Button type="submit" variant="primary" disabled={savingRules}>
                <Save className="w-4 h-4 mr-1.5" />
                {savingRules ? 'Guardando...' : 'Guardar Reglas'}
              </Button>
            </div>
          </form>
        )}

        {/* Contenido de Pestaña: Resumen */}
        {activeTab === 'resumen' && (
          <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-4">
            <h3 className="text-base font-bold text-navy">Perfil y Resumen Operativo</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prestamista privado registrado para el programa piloto de financiamiento con garantía hipotecaria en Uruguay. Participa en la recepción de oportunidades anonimizadas para inmuebles residenciales y comerciales en Montevideo y Canelones.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-bg border border-slate-border">
                <span className="text-slate-400 text-xs block">Oportunidades Recibidas</span>
                <span className="text-xl font-black text-navy">12</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-bg border border-slate-border">
                <span className="text-slate-400 text-xs block">Ofertas Enviadas</span>
                <span className="text-xl font-black text-navy">4</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-bg border border-slate-border">
                <span className="text-slate-400 text-xs block">Operaciones Formalizadas</span>
                <span className="text-xl font-black text-emerald-700">2</span>
              </div>
            </div>
          </div>
        )}

        {/* Contenido de Pestaña: Oportunidades */}
        {activeTab === 'oportunidades' && (
          <div className="bg-white rounded-card p-6 border border-slate-border shadow-card text-center text-xs text-slate-500">
            Listado de oportunidades generadas y asignadas a este prestamista.
          </div>
        )}

        {/* Contenido de Pestaña: Ofertas */}
        {activeTab === 'ofertas' && (
          <div className="bg-white rounded-card p-6 border border-slate-border shadow-card text-center text-xs text-slate-500">
            Historial de propuestas económicas emitidas por el prestamista.
          </div>
        )}

        {/* Contenido de Pestaña: Actividad */}
        {activeTab === 'actividad' && (
          <div className="bg-white rounded-card p-6 border border-slate-border shadow-card text-xs text-slate-600 space-y-3">
            <div className="flex items-center space-x-2 text-slate-400">
              <ListChecks className="w-4 h-4 text-brand-green" />
              <span>Registro de auditoría inmutable de cambios en condiciones y estados del prestamista.</span>
            </div>
          </div>
        )}

      </div>
    </BackofficeLayout>
  );
};
