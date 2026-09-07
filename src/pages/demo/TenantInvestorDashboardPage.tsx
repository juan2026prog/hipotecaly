// ==============================================================================
// HIPOTECALY: Tenant Private Investor Dashboard (/demo/:tenantSlug/inversor)
// Red Privada de Inversores del Tenant con Aislamiento Estricto y Datos Protegidos
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Target,
  MessageSquare,
  Lock,
  ShieldCheck,
  Sliders,
  Send,
  Eye,
  CheckCircle2,
  DollarSign,
  Building,
  Edit3,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { TenantInvestorLayout } from '../../components/layout/TenantInvestorLayout';
import { useTenant } from '../../contexts/TenantContext';
import { getTenantModules } from '../../lib/tenantModulesService';
import { Button } from '../../components/ui/Button';

interface PrivateOpportunity {
  id: string;
  public_id: string;
  zone: string;
  property_type: string;
  requested_amount: number;
  currency: string;
  preliminary_valuation: number;
  financing_ratio: number; // Porcentaje de financiación (NO LTV)
  term_months: number;
  modality: string;
  applicant_income_status: string;
  guarantee_status: string;
  documentation_pct: number;
  status: string;
  assigned_time: string;
  criteria_match: {
    property_type: boolean;
    zone: boolean;
    ratio: boolean;
    amount: boolean;
  };
}

interface ProposalItem {
  id: string;
  opp_id: string;
  public_id: string;
  property_type: string;
  zone: string;
  proposed_amount: number;
  proposed_rate: number;
  term_months: number;
  submitted_at: string;
  valid_until: string;
  status: 'borrador' | 'enviada' | 'presentada' | 'aceptada' | 'rechazada' | 'vencida';
}

export const TenantInvestorDashboardPage: React.FC = () => {
  const { tenant } = useTenant();
  const location = useLocation();

  const [isModuleEnabled, setIsModuleEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Subsección según ruta
  const isOfertas = location.pathname.endsWith('/ofertas');
  const isMensajes = location.pathname.endsWith('/mensajes');

  // Estado de análisis privado por oportunidad (almacenado localmente)
  const [privateAnalysis, setPrivateAnalysis] = useState<Record<string, {
    interest: 'alto' | 'medio' | 'bajo' | 'descartar';
    notes: string;
    offeredAmount: number;
    targetYield: number;
    perceivedRisk: 'Bajo' | 'Moderado' | 'Alto';
  }>>({
    'opp-nova-1': {
      interest: 'alto',
      notes: 'Excelente ubicación en Carrasco. Consultar con el analista si el cliente acepta amortización semestral de capital.',
      offeredAmount: 100000,
      targetYield: 11.5,
      perceivedRisk: 'Bajo',
    },
    'opp-nova-2': {
      interest: 'medio',
      notes: 'Apartamento en Pocitos con buena liquidez. Evaluar plazo de 24 meses.',
      offeredAmount: 65000,
      targetYield: 12.0,
      perceivedRisk: 'Moderado',
    },
    'opp-nova-3': {
      interest: 'alto',
      notes: 'Punta Carretas, sólida tasación y porcentaje de financiación muy conservador (28.5%).',
      offeredAmount: 85000,
      targetYield: 11.0,
      perceivedRisk: 'Bajo',
    }
  });

  // Modal para presentar propuesta
  const [selectedOppForProposal, setSelectedOppForProposal] = useState<PrivateOpportunity | null>(null);
  const [proposalForm, setProposalForm] = useState({
    amount: 100000,
    rate: 11.5,
    term: 36,
    paymentModality: 'Mensual vencido (solo intereses)',
    originationFee: '1.5% al cierre',
    validityDays: 15,
    conditions: 'Desembolso condicionado a certificación notarial de título perfecto y póliza de seguro de incendio endosada.',
  });
  const [proposalSubmittedSuccess, setProposalSubmittedSuccess] = useState(false);

  // Modal para actualizar criterios de inversión
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [investorCriteria, setInvestorCriteria] = useState({
    availableCapital: 245000,
    maxFinancingRatio: 40,
    preferredZones: ['Carrasco', 'Pocitos', 'Punta Carretas'],
    minRate: 11.0,
  });

  const [opportunities] = useState<PrivateOpportunity[]>([
    {
      id: 'opp-nova-1',
      public_id: 'NOV-2026-00089',
      zone: 'Carrasco · Montevideo',
      property_type: 'Casa Residencial',
      requested_amount: 100000,
      currency: 'USD',
      preliminary_valuation: 320000,
      financing_ratio: 31.2,
      term_months: 36,
      modality: 'Solo intereses mensual · Capital al vencimiento',
      applicant_income_status: 'Verificados (relación cuota/ingreso: 18%)',
      guarantee_status: 'Analizada por tasador independiente certificado',
      documentation_pct: 92,
      status: 'Disponible para propuesta',
      assigned_time: 'Asignada hace 2h',
      criteria_match: {
        property_type: true,
        zone: true,
        ratio: true,
        amount: true,
      },
    },
    {
      id: 'opp-nova-2',
      public_id: 'NOV-2026-00094',
      zone: 'Pocitos · Montevideo',
      property_type: 'Apartamento 3 Dormitorios',
      requested_amount: 65000,
      currency: 'USD',
      preliminary_valuation: 190000,
      financing_ratio: 34.2,
      term_months: 24,
      modality: 'Solo intereses trimestral · Capital al vencimiento',
      applicant_income_status: 'Verificados (empresario con balances auditados)',
      guarantee_status: 'Padrón horizontal independiente libre de gravámenes',
      documentation_pct: 95,
      status: 'Disponible para propuesta',
      assigned_time: 'Asignada ayer',
      criteria_match: {
        property_type: true,
        zone: true,
        ratio: true,
        amount: true,
      },
    },
    {
      id: 'opp-nova-3',
      public_id: 'NOV-2026-00102',
      zone: 'Punta Carretas · Montevideo',
      property_type: 'Casa Padrón Único',
      requested_amount: 85000,
      currency: 'USD',
      preliminary_valuation: 298000,
      financing_ratio: 28.5,
      term_months: 36,
      modality: 'Solo intereses mensual · Amortizaciones voluntarias',
      applicant_income_status: 'Verificados (flujo de ingresos profesional comprobado)',
      guarantee_status: 'Tasación técnica presencial confirmada',
      documentation_pct: 88,
      status: 'Disponible para propuesta',
      assigned_time: 'Asignada hace 4h',
      criteria_match: {
        property_type: true,
        zone: true,
        ratio: true,
        amount: true,
      },
    },
  ]);

  const [proposals, setProposals] = useState<ProposalItem[]>([
    {
      id: 'prop-101',
      opp_id: 'opp-nova-1',
      public_id: 'NOV-2026-00089',
      property_type: 'Casa Residencial',
      zone: 'Carrasco · Montevideo',
      proposed_amount: 100000,
      proposed_rate: 11.5,
      term_months: 36,
      submitted_at: '05/09/2026',
      valid_until: '20/09/2026',
      status: 'enviada',
    },
    {
      id: 'prop-098',
      opp_id: 'opp-nova-prev-1',
      public_id: 'NOV-2026-00072',
      property_type: 'Apartamento',
      zone: 'Punta Carretas · Montevideo',
      proposed_amount: 80000,
      proposed_rate: 11.0,
      term_months: 24,
      submitted_at: '28/08/2026',
      valid_until: '12/09/2026',
      status: 'presentada',
    },
    {
      id: 'prop-085',
      opp_id: 'opp-nova-prev-2',
      public_id: 'NOV-2026-00054',
      property_type: 'Chalet',
      zone: 'Punta Gorda · Montevideo',
      proposed_amount: 120000,
      proposed_rate: 12.0,
      term_months: 36,
      submitted_at: '14/08/2026',
      valid_until: '29/08/2026',
      status: 'aceptada',
    },
    {
      id: 'prop-077',
      opp_id: 'opp-nova-prev-3',
      public_id: 'NOV-2026-00041',
      property_type: 'Terreno',
      zone: 'Parque Miramar · Canelones',
      proposed_amount: 50000,
      proposed_rate: 12.5,
      term_months: 18,
      submitted_at: '02/08/2026',
      valid_until: '17/08/2026',
      status: 'vencida',
    },
  ]);

  useEffect(() => {
    async function checkModule() {
      setLoading(true);
      if (tenant.id) {
        const modules = await getTenantModules(tenant.id);
        setIsModuleEnabled(modules.investor_portal_enabled ?? true);
      }
      setLoading(false);
    }
    checkModule();
  }, [tenant.id]);

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';

  const handleOpenProposal = (opp: PrivateOpportunity) => {
    setSelectedOppForProposal(opp);
    setProposalForm({
      amount: opp.requested_amount,
      rate: 11.5,
      term: opp.term_months,
      paymentModality: 'Mensual vencido (solo intereses)',
      originationFee: '1.5% al cierre',
      validityDays: 15,
      conditions: 'Desembolso condicionado a verificación notarial de primer rango y póliza de seguro endosada.',
    });
    setProposalSubmittedSuccess(false);
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppForProposal) return;

    const newProp: ProposalItem = {
      id: `prop-${Date.now()}`,
      opp_id: selectedOppForProposal.id,
      public_id: selectedOppForProposal.public_id,
      property_type: selectedOppForProposal.property_type,
      zone: selectedOppForProposal.zone,
      proposed_amount: proposalForm.amount,
      proposed_rate: proposalForm.rate,
      term_months: proposalForm.term,
      submitted_at: 'Hoy',
      valid_until: '15 días',
      status: 'enviada',
    };

    setProposals([newProp, ...proposals]);
    setProposalSubmittedSuccess(true);
    setTimeout(() => {
      setSelectedOppForProposal(null);
      setProposalSubmittedSuccess(false);
    }, 1800);
  };

  const handleUpdateNotes = (oppId: string, notes: string) => {
    setPrivateAnalysis(prev => ({
      ...prev,
      [oppId]: {
        ...prev[oppId] || { interest: 'alto', notes: '', offeredAmount: 0, targetYield: 11.5, perceivedRisk: 'Bajo' },
        notes
      }
    }));
  };

  const handleUpdateInterest = (oppId: string, interest: 'alto' | 'medio' | 'bajo' | 'descartar') => {
    setPrivateAnalysis(prev => ({
      ...prev,
      [oppId]: {
        ...prev[oppId] || { interest: 'alto', notes: '', offeredAmount: 0, targetYield: 11.5, perceivedRisk: 'Bajo' },
        interest
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f9]">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isModuleEnabled === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f9] px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Módulo no habilitado</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            La red privada de inversores no se encuentra activa para la organización {brandName}.
          </p>
          <Link to={`/demo/${tenant.slug}`}>
            <Button variant="outline" size="sm">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TenantInvestorLayout title={`Red Privada de Inversores — ${brandName}`}>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* ================================================================= */}
        {/* SECCIÓN A: ARRIBA — QUÉ REQUIERE ATENCIÓN AHORA                  */}
        {/* ================================================================= */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Panel Inversor Calificado
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400 font-mono">Red Privada {brandName}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                {isOfertas ? 'Historial de Propuestas de Financiación' : isMensajes ? 'Mensajes y Consultas Técnicas' : 'Oportunidades Asignadas a tu Perfil'}
              </h1>
              
              {/* Avisos de contexto activos */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span><strong>3 operaciones nuevas</strong> asignadas a tu perfil esta semana</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span><strong>1 propuesta</strong> pendiente de respuesta por parte de {brandName}</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Capital disponible declarado: <strong>USD {investorCriteria.availableCapital.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>

            {/* Acciones directas */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsCriteriaModalOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-300" />
                <span>Actualizar mis criterios</span>
              </button>
              <Link to={`/demo/${tenant.slug}/inversor/ofertas`}>
                <button
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm text-slate-900 bg-amber-400 hover:bg-amber-300"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver propuestas enviadas</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECCIÓN B: CENTRO — OPERACIONES CON DATOS PROTEGIDOS             */}
        {/* ================================================================= */}
        {!isMensajes && !isOfertas && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Operaciones Disponibles para Evaluación</h2>
                <p className="text-xs text-slate-500">
                  Operaciones pre-evaluadas y tasadas por el equipo de {brandName} con garantía hipotecaria de primer rango.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {opportunities.length} operaciones activas
              </span>
            </div>

            <div className="space-y-6">
              {opportunities.map((opp) => {
                const analysis = privateAnalysis[opp.id] || {
                  interest: 'alto',
                  notes: '',
                  offeredAmount: opp.requested_amount,
                  targetYield: 11.5,
                  perceivedRisk: 'Bajo',
                };

                return (
                  <div
                    key={opp.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
                  >
                    {/* 1. Cabecera de la Tarjeta */}
                    <div className="bg-slate-50/70 border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                          {opp.public_id.split('-')[1] || 'NOV'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{opp.public_id}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-semibold text-slate-700">{opp.property_type}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-600">{opp.zone}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {opp.status}
                            </span>
                            <span className="text-[11px] text-slate-400">· {opp.assigned_time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="text-xs shadow-sm font-semibold"
                          style={{ backgroundColor: primaryColor }}
                          onClick={() => handleOpenProposal(opp)}
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          Presentar Propuesta de Financiación
                        </Button>
                      </div>
                    </div>

                    {/* 2. Cuerpo: Datos Financieros Clave y Métricas */}
                    <div className="p-6 space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/70">
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Monto Solicitado</span>
                          <span className="text-base font-extrabold text-slate-900 font-mono">
                            USD {opp.requested_amount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Tasación Preliminar</span>
                          <span className="text-base font-bold text-slate-800 font-mono">
                            USD {opp.preliminary_valuation.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-emerald-50/80 -m-1 p-3 rounded-lg border border-emerald-200/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                            Porcentaje de Financiación
                          </span>
                          <span className="text-base font-extrabold text-emerald-700 font-mono">
                            {opp.financing_ratio}%
                          </span>
                          <span className="text-[9px] text-emerald-600 block">Garantía sólida 1er rango</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Plazo Solicitado</span>
                          <span className="text-sm font-bold text-slate-800">
                            {opp.term_months} meses
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Modalidad de Pago</span>
                          <span className="text-xs font-semibold text-slate-700 leading-tight block">
                            {opp.modality}
                          </span>
                        </div>
                      </div>

                      {/* 3. Indicadores de Confianza y Calidad */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50/50 border border-slate-200/60">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Ingresos del Solicitante</span>
                            <span className="text-[11px] text-slate-500 leading-snug block">{opp.applicant_income_status}</span>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50/50 border border-slate-200/60">
                          <Building className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Garantía Hipotecaria</span>
                            <span className="text-[11px] text-slate-500 leading-snug block">{opp.guarantee_status}</span>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50/50 border border-slate-200/60">
                          <FileCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Documentación (Completada {opp.documentation_pct}%)</span>
                            <span className="text-[11px] text-slate-500 leading-snug block">Título notarial y planos catastrales verificados</span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Aviso de Datos Protegidos (Anti-bypass estricto) */}
                      <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                        <div className="flex items-center space-x-2">
                          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                          <span className="font-semibold">Política de Privacidad y Blindaje Notarial:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-amber-800">
                          <span>Identidad del solicitante: <strong>🔒 Protegida</strong></span>
                          <span>•</span>
                          <span>Dirección exacta: <strong>🔒 Disponible en formalización</strong></span>
                          <span>•</span>
                          <span>Documentos sensibles: <strong>🔒 Acceso restringido</strong></span>
                        </div>
                      </div>

                      {/* 5. Zona Interactiva de la Tarjeta (Mi Análisis & Criterios) */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-100">
                        {/* Mi Análisis Privado */}
                        <div className="lg:col-span-8 bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                              <span className="text-xs font-bold text-slate-800">Mi Análisis Privado (Solo visible para vos)</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[11px] text-slate-500 font-medium">Interés:</span>
                              {(['alto', 'medio', 'bajo', 'descartar'] as const).map((lvl) => (
                                <button
                                  key={lvl}
                                  onClick={() => handleUpdateInterest(opp.id, lvl)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${
                                    analysis.interest === lvl
                                      ? lvl === 'alto' ? 'bg-emerald-600 text-white' : lvl === 'medio' ? 'bg-blue-600 text-white' : lvl === 'bajo' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <textarea
                              rows={2}
                              value={analysis.notes}
                              onChange={(e) => handleUpdateNotes(opp.id, e.target.value)}
                              placeholder="Escribí notas privadas sobre esta operación..."
                              className="w-full text-xs bg-white rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400"
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>Monto a ofrecer: <strong className="text-slate-800">USD {opp.requested_amount.toLocaleString()}</strong></span>
                            <span>Rentabilidad estimada: <strong className="text-emerald-700 font-bold">11.5% anual</strong></span>
                            <span>Riesgo percibido: <strong className="text-slate-800">{analysis.perceivedRisk}</strong></span>
                          </div>
                        </div>

                        {/* Compatibilidad con tus criterios */}
                        <div className="lg:col-span-4 bg-emerald-50/40 rounded-xl p-4 border border-emerald-100 space-y-2.5">
                          <div className="flex items-center space-x-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span className="text-xs font-bold text-emerald-900">Compatibilidad de Criterios</span>
                          </div>
                          
                          <div className="space-y-1.5 text-[11px] text-slate-700">
                            <div className="flex items-center justify-between">
                              <span>Tipo de propiedad:</span>
                              <span className="font-bold text-emerald-800 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Residencial
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Zona geográfica:</span>
                              <span className="font-bold text-emerald-800 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> {opp.zone.split('·')[0].trim()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Financiación:</span>
                              <span className="font-bold text-emerald-800 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> &le; 40% ({opp.financing_ratio}%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Monto solicitado:</span>
                              <span className="font-bold text-emerald-800 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> En rango
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECCIÓN C: ABAJO — HISTORIAL DE PROPUESTAS Y MÉTRICAS             */}
        {/* ================================================================= */}
        <div className="space-y-6 pt-2">
          {/* 1. Tabla de Propuestas Enviadas */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Historial de Propuestas de Financiación</h3>
                <p className="text-xs text-slate-500">
                  Seguimiento de ofertas remitidas a la mesa de estructuración de {brandName}.
                </p>
              </div>
              <Link to={`/demo/${tenant.slug}/inversor/oportunidades`}>
                <Button variant="outline" size="sm" className="text-xs">
                  <Target className="w-3.5 h-3.5 mr-1" />
                  Ver Todas las Operaciones
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Operación</th>
                    <th className="py-3 px-4">Monto Ofrecido</th>
                    <th className="py-3 px-4">Tasa Anual</th>
                    <th className="py-3 px-4">Plazo</th>
                    <th className="py-3 px-4">Fecha Envío</th>
                    <th className="py-3 px-4">Vigencia</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposals.map((prop) => {
                    const badgeStyles: Record<string, string> = {
                      borrador: 'bg-slate-100 text-slate-700 border-slate-200',
                      enviada: 'bg-blue-50 text-blue-800 border-blue-200',
                      presentada: 'bg-purple-50 text-purple-800 border-purple-200',
                      aceptada: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                      rechazada: 'bg-rose-50 text-rose-800 border-rose-200',
                      vencida: 'bg-slate-100 text-slate-500 border-slate-200',
                    };

                    const statusLabels: Record<string, string> = {
                      borrador: 'Borrador',
                      enviada: 'Enviada (en revisión)',
                      presentada: 'Presentada al cliente',
                      aceptada: 'Aceptada',
                      rechazada: 'Rechazada',
                      vencida: 'Vencida',
                    };

                    return (
                      <tr key={prop.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-medium">
                          <div className="font-mono font-bold text-slate-900">{prop.public_id}</div>
                          <div className="text-[11px] text-slate-500">{prop.property_type} · {prop.zone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                          USD {prop.proposed_amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                          {prop.proposed_rate}% USD
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {prop.term_months} meses
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {prop.submitted_at}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {prop.valid_until}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyles[prop.status] || 'bg-slate-100'}`}>
                            {statusLabels[prop.status]}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => alert(`Detalles de propuesta ${prop.public_id}`)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                            >
                              Ver Detalle
                            </button>
                            {prop.status === 'enviada' && (
                              <button
                                onClick={() => alert(`Modificar propuesta ${prop.public_id}`)}
                                className="px-2 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors"
                              >
                                Modificar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Resumen de Actividad del Inversor (Métricas Consolidadas) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500 block">Total Propuestas</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">12</div>
              <span className="text-[10px] text-slate-400">Histórico de ofertas</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500 block">Propuestas Aceptadas</span>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">4</div>
              <span className="text-[10px] text-emerald-600 font-medium">33.3% tasa de éxito</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500 block">Capital Colocado</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5 font-mono">USD 380.000</div>
              <span className="text-[10px] text-slate-400">En 4 hipotecas vigentes</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500 block">Tasa Prom. Ponderada</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">11.8%</div>
              <span className="text-[10px] text-slate-400">Anual en USD</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-medium text-slate-500 block">Financiación Prom. Cartera</span>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">33.4%</div>
              <span className="text-[10px] text-emerald-600 font-medium">Alto resguardo de capital</span>
            </div>
          </div>
        </div>

        {/* Mensajería Directa */}
        {isMensajes && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Mensajes y Consultas de Operaciones</h2>
            <p className="text-xs text-slate-500">
              Comunicación directa y cifrada con el equipo analista y notarial de {brandName}.
            </p>
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No tenés mensajes pendientes en este momento.
            </div>
          </div>
        )}

      </div>

      {/* =================================================================== */}
      {/* MODAL: PRESENTAR PROPUESTA DE FINANCIACIÓN                         */}
      {/* =================================================================== */}
      {selectedOppForProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{selectedOppForProposal.public_id}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">{selectedOppForProposal.zone}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Presentar Propuesta de Financiación</h3>
              </div>
              <button
                onClick={() => setSelectedOppForProposal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {proposalSubmittedSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">¡Propuesta Enviada Exitosamente!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  La propuesta ha sido enviada a la mesa de estructuración de {brandName} para su revisión y presentación formal al solicitante.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between items-center text-slate-600">
                  <span>Monto Solicitado: <strong className="text-slate-900 font-mono">USD {selectedOppForProposal.requested_amount.toLocaleString()}</strong></span>
                  <span>Porcentaje de Financiación: <strong className="text-emerald-700 font-mono">{selectedOppForProposal.financing_ratio}%</strong></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monto a Financiar (USD)
                    </label>
                    <input
                      type="number"
                      value={proposalForm.amount}
                      onChange={(e) => setProposalForm({ ...proposalForm, amount: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tasa de Interés Anual Propuesta (% USD)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={proposalForm.rate}
                      onChange={(e) => setProposalForm({ ...proposalForm, rate: Number(e.target.value) })}
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Plazo Propuesto (Meses)
                    </label>
                    <input
                      type="number"
                      value={proposalForm.term}
                      onChange={(e) => setProposalForm({ ...proposalForm, term: Number(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vigencia de la Oferta (Días)
                    </label>
                    <input
                      type="number"
                      value={proposalForm.validityDays}
                      onChange={(e) => setProposalForm({ ...proposalForm, validityDays: Number(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modalidad de Cobro de Intereses
                  </label>
                  <select
                    value={proposalForm.paymentModality}
                    onChange={(e) => setProposalForm({ ...proposalForm, paymentModality: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="Mensual vencido (solo intereses)">Mensual vencido (solo intereses)</option>
                    <option value="Trimestral vencido (solo intereses)">Trimestral vencido (solo intereses)</option>
                    <option value="Francés (cuotas iguales capital + interés)">Francés (cuotas iguales capital + interés)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condiciones Particulares o Requisitos Notariales
                  </label>
                  <textarea
                    rows={2}
                    value={proposalForm.conditions}
                    onChange={(e) => setProposalForm({ ...proposalForm, conditions: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOppForProposal(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="font-semibold shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Enviar Propuesta a {brandName}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ACTUALIZAR CRITERIOS DE INVERSIÓN                            */}
      {/* =================================================================== */}
      {isCriteriaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Mis Criterios de Inversión</h3>
              </div>
              <button
                onClick={() => setIsCriteriaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Capital Disponible Declarado (USD)
                </label>
                <input
                  type="number"
                  value={investorCriteria.availableCapital}
                  onChange={(e) => setInvestorCriteria({ ...investorCriteria, availableCapital: Number(e.target.value) })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Porcentaje Máximo de Financiación Permitido (%)
                </label>
                <input
                  type="number"
                  value={investorCriteria.maxFinancingRatio}
                  onChange={(e) => setInvestorCriteria({ ...investorCriteria, maxFinancingRatio: Number(e.target.value) })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                <span className="text-[10px] text-slate-400">Recomendado &le; 40% para primer rango hipotecario.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tasa Mínima Deseada (% USD anual)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={investorCriteria.minRate}
                  onChange={(e) => setInvestorCriteria({ ...investorCriteria, minRate: Number(e.target.value) })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCriteriaModalOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                size="sm"
                style={{ backgroundColor: primaryColor }}
                onClick={() => {
                  alert('Criterios de inversión actualizados correctamente.');
                  setIsCriteriaModalOpen(false);
                }}
              >
                Guardar Criterios
              </Button>
            </div>
          </div>
        </div>
      )}

    </TenantInvestorLayout>
  );
};

