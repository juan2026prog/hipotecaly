import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Target,
  Building,
  ShieldCheck,
  Sliders,
  Send,
  CheckCircle2,
  DollarSign,
  Edit3,
  X,
  AlertTriangle,
  Calendar,
  Clock,
  Download,
  FileText,
  ChevronRight,
  TrendingUp,
  MapPin,
  Check,
  Info,
  Lock,
  Heart,
} from 'lucide-react';
import { TenantInvestorLayout } from '../../components/layout/TenantInvestorLayout';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { getTenantModules } from '../../lib/tenantModulesService';
import { Button } from '../../components/ui/Button';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  getLendersList,
  getInvestorInterests,
  submitInvestorInterest,
  updateLenderData,
  Lender,
  InvestorInterest,
} from '../../lib/lendersService';

// -----------------------------------------------------------------------------
// Tipos de Datos del Dominio
// -----------------------------------------------------------------------------

export type PaymentModalityType = 'solo_intereses' | 'capital_e_intereses';

export interface PrivateOpportunity {
  id: string;
  public_id: string;
  zone: string;
  department: string;
  property_type: string;
  requested_amount: number;
  currency: string;
  preliminary_valuation: number;
  financing_ratio: number; // Porcentaje de financiación (NO LTV)
  term_months: number;
  modality: PaymentModalityType;
  modality_label: string;
  suggested_rate: number;
  applicant_income_status: string;
  guarantee_status: string;
  documentation_pct: number;
  status: string;
  assigned_time: string;
}

export interface PaymentScheduleItem {
  installment_number: number;
  due_date: string;
  expected_interest: number;
  expected_capital: number;
  total_payment: number;
  paid_amount: number | null;
  remaining_balance: number;
  status: 'pagado' | 'proximo' | 'pendiente' | 'vencido';
}

export interface ActiveLoan {
  id: string;
  public_id: string;
  property_type: string;
  zone: string;
  department: string;
  original_capital: number;
  remaining_capital: number;
  rate_annual: number;
  term_months: number;
  modality: PaymentModalityType;
  modality_label: string;
  valuation: number;
  financing_ratio: number;
  interest_earned_accumulated: number;
  next_payment_date: string;
  next_payment_amount: number;
  status: 'al_dia' | 'atencion' | 'formalizacion' | 'finalizado';
  status_label: string;
  start_date: string;
  end_date: string;
  notary_status: string;
  schedule: PaymentScheduleItem[];
  notes?: string;
  documents: Array<{ name: string; type: string; date: string; size: string }>;
  messages: Array<{ sender: string; time: string; text: string; role: string }>;
}

export interface ProposalItem {
  id: string;
  opp_id: string;
  public_id: string;
  property_type: string;
  zone: string;
  proposed_amount: number;
  proposed_rate: number;
  term_months: number;
  modality: PaymentModalityType;
  modality_label: string;
  estimated_interest_yearly: number;
  submitted_at: string;
  valid_until: string;
  status: 'borrador' | 'enviada' | 'presentada' | 'aceptada' | 'rechazada' | 'vencida';
  conditions?: string;
}

export interface InvestorCriteria {
  availableCapital: number;
  minLoanAmount: number;
  maxLoanAmount: number;
  minRate: number;
  maxFinancingRatio: number;
  minTermMonths: number;
  maxTermMonths: number;
  acceptedPropertyTypes: string[];
  acceptedDepartments: string[];
  acceptedModalities: PaymentModalityType[];
}

// -----------------------------------------------------------------------------
// Funciones Financieras Auxiliares Precisas
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

function calculateInterestOnlyReturns(principal: number, rateAnnualPct: number, termMonths: number) {
  const monthlyInterest = (principal * (rateAnnualPct / 100)) / 12;
  const yearlyInterest = principal * (rateAnnualPct / 100);
  const totalInterest = monthlyInterest * termMonths;
  const capitalAtMaturity = principal;
  return {
    monthlyInterest: Math.round(monthlyInterest),
    yearlyInterest: Math.round(yearlyInterest),
    totalInterest: Math.round(totalInterest),
    capitalAtMaturity: Math.round(capitalAtMaturity),
  };
}

function calculateAmortizingReturns(principal: number, rateAnnualPct: number, termMonths: number) {
  if (principal <= 0 || termMonths <= 0) {
    return { monthlyPayment: 0, firstMonthInterest: 0, firstMonthCapital: 0, totalInterest: 0, totalCapital: principal };
  }
  const r = rateAnnualPct / 100 / 12;
  if (r === 0) {
    const pmt = principal / termMonths;
    return { monthlyPayment: Math.round(pmt), firstMonthInterest: 0, firstMonthCapital: Math.round(pmt), totalInterest: 0, totalCapital: principal };
  }
  const factor = Math.pow(1 + r, termMonths);
  const monthlyPayment = (principal * (r * factor)) / (factor - 1);
  const firstMonthInterest = principal * r;
  const firstMonthCapital = monthlyPayment - firstMonthInterest;
  const totalInterest = monthlyPayment * termMonths - principal;
  return {
    monthlyPayment: Math.round(monthlyPayment),
    firstMonthInterest: Math.round(firstMonthInterest),
    firstMonthCapital: Math.round(firstMonthCapital),
    totalInterest: Math.round(totalInterest),
    totalCapital: Math.round(principal),
  };
}

// -----------------------------------------------------------------------------
// Componente Principal: TenantInvestorDashboardPage
// -----------------------------------------------------------------------------

export const TenantInvestorDashboardPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';
  const basePath = `/demo/${tenant.slug}/inversor`;

  const [isModuleEnabled, setIsModuleEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Determinar vista activa por URL
  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.endsWith('/oportunidades')) return 'oportunidades';
    if (path.endsWith('/prestamos')) return 'prestamos';
    if (path.endsWith('/propuestas') || path.endsWith('/ofertas')) return 'propuestas';
    if (path.endsWith('/mensajes')) return 'prestamos';
    return 'inicio';
  }, [location.pathname]);

  // Inversor canónico actual
  const [currentLender, setCurrentLender] = useState<Lender | null>(null);

  // Colecciones de Datos
  const [opportunities, setOpportunities] = useState<PrivateOpportunity[]>([]);
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [interests, setInterests] = useState<InvestorInterest[]>([]);

  // Criterios del Inversor Centralizados
  const investorCriteria: InvestorCriteria = useMemo(() => {
    const rules = currentLender?.rules;
    return {
      availableCapital: currentLender?.available_capital || 200000,
      minLoanAmount: rules?.min_loan || 10000,
      maxLoanAmount: rules?.max_loan || 200000,
      minRate: rules?.min_rate || 11.0,
      maxFinancingRatio: rules?.max_ltv ? rules.max_ltv * 100 : 40.0,
      minTermMonths: rules?.min_term_months || 12,
      maxTermMonths: rules?.max_term_months || 60,
      acceptedPropertyTypes: (rules?.accepted_property_types as string[]) || ['Apartamento', 'Casa', 'Local Comercial', 'Campo'],
      acceptedDepartments: rules?.accepted_departments || ['Montevideo', 'Canelones', 'Maldonado'],
      acceptedModalities: (rules?.accepted_modalities as PaymentModalityType[]) || ['solo_intereses', 'capital_e_intereses'],
    };
  }, [currentLender]);

  const handleOpenProfileTab = (tab: 'datos' | 'verificacion' | 'fondos' | 'criterios' | 'documentos' | 'firma' | 'cuenta' | 'notificaciones') => {
    navigate(`${basePath}/perfil?tab=${tab}`);
  };

  // Notas Privadas e Interés por Oportunidad
  const [privateAnalysis, setPrivateAnalysis] = useState<Record<string, {
    interest: 'alto' | 'medio' | 'bajo' | 'descartar';
    notes: string;
  }>>({});

  // Modales
  const [selectedOppForDetail, setSelectedOppForDetail] = useState<PrivateOpportunity | null>(null);
  const [selectedOppForInterest, setSelectedOppForInterest] = useState<PrivateOpportunity | null>(null);
  const [interestForm, setInterestForm] = useState({
    indicatedAmount: 100000,
    message: '',
  });
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSuccessMessage, setInterestSuccessMessage] = useState(false);

  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<ActiveLoan | null>(null);
  const [loanDetailTab, setLoanDetailTab] = useState<'resumen' | 'pagos' | 'garantia' | 'documentos' | 'mensajes'>('resumen');
  const [newLoanMessage, setNewLoanMessage] = useState('');

  // Filtros en pestañas
  const [loanStatusFilter, setLoanStatusFilter] = useState<'todos' | 'activos' | 'formalizacion' | 'atencion' | 'finalizados'>('todos');

  // Carga inicial y Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (tenant.id) {
        const modules = await getTenantModules(tenant.id);
        setIsModuleEnabled(modules.investor_portal_enabled ?? true);
      }

      if (isSupabaseConfigured) {
        try {
          const { lenders } = await getLendersList({ organizationId: tenant.id });
          let matchedLender = lenders[0] || null;
          if (user?.id) {
            const userLender = lenders.find(l => l.user_id === user.id || l.contact_email === user.email);
            if (userLender) matchedLender = userLender;
          }
          setCurrentLender(matchedLender);

          const { data: oppData } = await supabase
            .from('opportunities')
            .select(`
              id, status, match_score, created_at,
              application:applications(
                id, public_id, requested_amount, currency, term_months,
                properties(city, department, property_type, estimated_value)
              )
            `)
            .order('created_at', { ascending: false });

          if (oppData && oppData.length > 0) {
            const mappedOpps: PrivateOpportunity[] = oppData.map((d: any) => {
              const app = d.application || {};
              const prop = Array.isArray(app.properties) ? app.properties[0] : (app.properties || {});
              const req = Number(app.requested_amount) || 100000;
              const val = Number(prop.estimated_value) || (req * 2.8);
              const ratio = val > 0 ? Math.round((req / val) * 1000) / 10 : 35.0;
              const zoneStr = [prop.city || 'Pocitos', prop.department || 'Montevideo'].filter(Boolean).join(' · ');

              return {
                id: d.id,
                public_id: app.public_id || `NOV-${d.id.slice(0, 8).toUpperCase()}`,
                zone: zoneStr,
                department: prop.department || 'Montevideo',
                property_type: prop.property_type || 'Apartamento',
                requested_amount: req,
                currency: app.currency || 'USD',
                preliminary_valuation: val,
                financing_ratio: ratio,
                term_months: Number(app.term_months) || 36,
                modality: 'solo_intereses' as PaymentModalityType,
                modality_label: 'Solo intereses + capital al vencimiento',
                suggested_rate: 11.5,
                applicant_income_status: 'Documentación de ingresos verificada',
                guarantee_status: 'Garantía en análisis por tasador colegiado',
                documentation_pct: 90,
                status: 'Disponible',
                assigned_time: 'Reciente',
              };
            });
            setOpportunities(mappedOpps);
          } else {
            setOpportunities([]);
          }

          if (matchedLender?.id) {
            const { interests: myInterests } = await getInvestorInterests({
              organizationId: tenant.id,
              lenderId: matchedLender.id,
            });
            setInterests(myInterests);
          }
        } catch (err) {
          console.warn('Error conectando a Supabase para oportunidades:', err);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [tenant.id, user?.id]);

  // KPIs del Dashboard Calculados
  const dashboardKpis = useMemo(() => {
    const totalLent = loans.reduce((acc, l) => acc + (l.status === 'al_dia' || l.status === 'atencion' ? l.remaining_capital : 0), 0);
    const availableCapital = investorCriteria.availableCapital;
    const monthlyInterestExpected = loans.reduce((acc, l) => {
      if (l.status === 'al_dia' || l.status === 'atencion') {
        const ret = l.modality === 'solo_intereses'
          ? calculateInterestOnlyReturns(l.remaining_capital, l.rate_annual, l.term_months).monthlyInterest
          : calculateAmortizingReturns(l.remaining_capital, l.rate_annual, l.term_months).firstMonthInterest;
        return acc + ret;
      }
      return acc;
    }, 0);
    const accumulatedInterest = loans.reduce((acc, l) => acc + l.interest_earned_accumulated, 0);
    const hasAttention = loans.some(l => l.status === 'atencion');

    return {
      totalLent,
      availableCapital,
      monthlyInterestExpected,
      accumulatedInterest,
      hasAttention,
    };
  }, [loans, investorCriteria.availableCapital]);

  // Evaluador de Match de Criterios (X de 5)
  const evaluateCriteriaMatch = (opp: PrivateOpportunity) => {
    const checkZone = investorCriteria.acceptedDepartments.some(dept =>
      opp.department.toLowerCase().includes(dept.toLowerCase()) ||
      opp.zone.toLowerCase().includes(dept.toLowerCase())
    );
    const checkType = investorCriteria.acceptedPropertyTypes.some(t =>
      opp.property_type.toLowerCase().includes(t.toLowerCase()) ||
      t.toLowerCase().includes(opp.property_type.toLowerCase())
    );
    const checkRatio = opp.financing_ratio <= investorCriteria.maxFinancingRatio;
    const checkRate = (opp.suggested_rate || 11.5) >= investorCriteria.minRate;
    const checkModality = investorCriteria.acceptedModalities.includes(opp.modality);

    const checks = [
      { label: 'Zona geográfica aceptada', passed: checkZone, reason: checkZone ? 'Zona dentro de tus preferencias' : 'Fuera de departamentos preferidos' },
      { label: 'Tipo de inmueble aceptado', passed: checkType, reason: checkType ? `${opp.property_type} aceptado` : 'Tipo de inmueble no prioritario' },
      { label: 'Financiación máxima (LTV)', passed: checkRatio, reason: checkRatio ? `${opp.financing_ratio}% ≤ ${investorCriteria.maxFinancingRatio}% máx` : `Supera tu límite de ${investorCriteria.maxFinancingRatio}%` },
      { label: 'Tasa compatible', passed: checkRate, reason: checkRate ? `${opp.suggested_rate}% ≥ ${investorCriteria.minRate}% mín` : 'Tasa por debajo de tu objetivo' },
      { label: 'Modalidad aceptada', passed: checkModality, reason: checkModality ? 'Modalidad compatible' : 'Modalidad no seleccionada' },
    ];

    const passedCount = checks.filter(c => c.passed).length;
    return {
      total: checks.length,
      passedCount,
      isPerfect: passedCount === checks.length,
      checks,
    };
  };

  // Manejo de Interés
  const handleOpenInterestModal = (opp: PrivateOpportunity) => {
    setSelectedOppForInterest(opp);
    setInterestForm({
      indicatedAmount: opp.requested_amount,
      message: '',
    });
    setInterestSuccessMessage(false);
  };

  const handleConfirmInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppForInterest) return;

    setInterestSubmitting(true);
    try {
      const lenderId = currentLender?.id || 'd0000000-0000-0000-0000-000000000001';
      const orgId = tenant.id || 'd0000000-0000-0000-0000-000000000001';

      const res = await submitInvestorInterest({
        organizationId: orgId,
        opportunityId: selectedOppForInterest.id,
        lenderId: lenderId,
        indicatedAmount: interestForm.indicatedAmount,
        currency: selectedOppForInterest.currency || 'USD',
        message: interestForm.message,
      });

      if (res.interest) {
        setInterests(prev => [res.interest as InvestorInterest, ...prev]);
        setInterestSuccessMessage(true);
        setTimeout(() => {
          setSelectedOppForInterest(null);
          setInterestSuccessMessage(false);
        }, 1800);
      }
    } catch (err) {
      console.error('Error al registrar interés:', err);
    } finally {
      setInterestSubmitting(false);
    }
  };

  // Enviar mensaje en detalle de préstamo
  const handleSendLoanMessage = () => {
    if (!selectedLoanForDetail || !newLoanMessage.trim()) return;
    const updated = {
      ...selectedLoanForDetail,
      messages: [
        ...selectedLoanForDetail.messages,
        {
          sender: 'Tú',
          time: 'Ahora',
          text: newLoanMessage.trim(),
          role: 'Inversor',
        },
      ],
    };
    setSelectedLoanForDetail(updated);
    setLoans(loans.map(l => l.id === updated.id ? updated : l));
    setNewLoanMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f9]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
    <TenantInvestorLayout title={`Panel Inversor — ${brandName}`}>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Top Control Bar: Contexto del Inversor & Mis Criterios */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  {activeTab === 'inicio' && 'Resumen de Mis Préstamos'}
                  {activeTab === 'oportunidades' && 'Oportunidades de Financiación'}
                  {activeTab === 'prestamos' && 'Cartera de Préstamos Activos'}
                  {activeTab === 'propuestas' && 'Propuestas de Financiación Emitidas'}
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500">
                Red de fondeo con garantía hipotecaria de primer rango · {brandName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={() => handleOpenProfileTab('criterios')}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 min-h-[40px]"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              <span>Mis Criterios de Inversión</span>
            </button>

            {activeTab !== 'oportunidades' && (
              <Link to={`${basePath}/oportunidades`}>
                <Button size="sm" className="text-xs font-semibold shadow-sm" style={{ backgroundColor: primaryColor }}>
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  Ver Oportunidades
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* 1. VISTA: INICIO — VERDADERO DASHBOARD DEL PRESTAMISTA            */}
        {/* ================================================================= */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            
            {/* 4 KPIs Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Capital Prestado */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Capital prestado</span>
                  <DollarSign className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  USD {dashboardKpis.totalLent.toLocaleString('es-UY')}
                </div>
                <div className="text-[11px] text-slate-500">
                  En {loans.filter(l => l.status === 'al_dia' || l.status === 'atencion').length} préstamos con garantía hipotecaria
                </div>
              </div>

              {/* KPI 2: Capital Disponible */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Capital disponible</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono tracking-tight">
                  USD {dashboardKpis.availableCapital.toLocaleString('es-UY')}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Listo para colocar</span>
                  <button
                    onClick={() => handleOpenProfileTab('fondos')}
                    className="text-amber-700 font-semibold hover:underline"
                  >
                    Ajustar
                  </button>
                </div>
              </div>

              {/* KPI 3: Intereses a cobrar este mes */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Intereses a cobrar este mes</span>
                  <Calendar className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  USD {dashboardKpis.monthlyInterestExpected.toLocaleString('es-UY')}
                </div>
                <div className="text-[11px] text-slate-500">
                  Rendimiento mensual contratado
                </div>
              </div>

              {/* KPI 4: Intereses cobrados acumulados */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Intereses cobrados acumulados</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono tracking-tight">
                  USD {dashboardKpis.accumulatedInterest.toLocaleString('es-UY')}
                </div>
                <div className="text-[11px] text-slate-500">
                  Ganancia neta percibida hasta hoy
                </div>
              </div>
            </div>

            {/* Estado Global y Tabla de Próximos Cobros */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-slate-900">Próximos cobros</h2>
                    {dashboardKpis.hasAttention ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        ⚠ 1 préstamo requiere atención
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ Todos los préstamos están al día
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Cronograma de pagos de intereses y amortización de tus operaciones vigentes.
                  </p>
                </div>

                <Link to={`${basePath}/prestamos`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Ver todos los préstamos
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Operación</th>
                      <th className="py-3.5 px-4">Barrio / Zona</th>
                      <th className="py-3.5 px-4 text-right">Capital Pendiente</th>
                      <th className="py-3.5 px-4 text-center">Tasa</th>
                      <th className="py-3.5 px-4">Próximo Cobro</th>
                      <th className="py-3.5 px-4 text-right">Importe</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {loan.public_id}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {loan.zone}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          USD {loan.remaining_capital.toLocaleString('es-UY')}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                          {loan.rate_annual}%
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          <span className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loan.next_payment_date}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                          USD {loan.next_payment_amount.toLocaleString('es-UY')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.status === 'al_dia' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                            {loan.status_label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedLoanForDetail(loan)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                          >
                            Ver préstamo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nuevas Oportunidades: Resumen Condensado */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Nuevas operaciones disponibles
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-white">
                  {opportunities.length} operaciones coinciden con tus criterios de inversión
                </h3>
                <p className="text-xs text-slate-300">
                  Tasadas y analizadas con garantía hipotecaria de primer rango en Montevideo y Canelones.
                </p>
              </div>

              <Link to={`${basePath}/oportunidades`}>
                <Button className="font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-md whitespace-nowrap min-h-[44px]">
                  <Target className="w-4 h-4 mr-2" />
                  Ver oportunidades
                </Button>
              </Link>
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* 2. VISTA: OPORTUNIDADES — INFORMACIÓN PARA DECIDIR               */}
        {/* ================================================================= */}
        {activeTab === 'oportunidades' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Operaciones Asignadas a tu Perfil</h2>
                <p className="text-xs text-slate-500">
                  Evaluá el inmueble, el porcentaje de financiación y los cobros proyectados según la modalidad de cada operación.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
                {opportunities.length} disponibles
              </span>
            </div>

            {/* Banner si el inversor pausó temporalmente la recepción */}
            {currentLender?.status === 'paused' && (
              <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span>
                    <strong>Recepción de oportunidades pausada:</strong> Temporalmente no estás recibiendo nuevas operaciones. Tus criterios guardados y préstamos activos se mantienen intactos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (currentLender?.id) {
                      await updateLenderData(currentLender.id, { status: 'active' }, user?.id);
                      setCurrentLender(prev => prev ? { ...prev, status: 'active', is_active: true } : null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shrink-0 shadow-sm"
                >
                  Volver a recibir oportunidades
                </button>
              </div>
            )}

            <div className="space-y-4">
              {opportunities.map((opp) => {
                const matchResult = evaluateCriteriaMatch(opp);
                const isSoloIntereses = opp.modality === 'solo_intereses';

                return (
                  <div
                    key={opp.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
                  >
                    {/* Header de la tarjeta */}
                    <div className="bg-slate-50/80 border-b border-slate-200/80 px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {opp.public_id.split('-')[1] || 'NOV'}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{opp.public_id}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-bold text-slate-800">{opp.property_type}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-semibold text-slate-700 flex items-center bg-white px-2 py-0.5 rounded border border-slate-200">
                              <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                              {opp.zone}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {opp.status}
                            </span>
                            <span className="text-[11px] text-slate-400">· {opp.assigned_time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Píldora de Match Compacta */}
                      <div className="flex items-center space-x-2">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1.5 border ${
                          matchResult.isPerfect
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          <ShieldCheck className={`w-3.5 h-3.5 ${matchResult.isPerfect ? 'text-emerald-600' : 'text-amber-600'}`} />
                          <span>{matchResult.passedCount}/{matchResult.total} criterios compatibles</span>
                        </div>
                      </div>
                    </div>

                    {/* Cuerpo: Datos Esenciales del Inmueble y Préstamo (Nivel 1) */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Tipo Inmueble</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">{opp.property_type}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Ubicación</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5 truncate" title={opp.zone}>{opp.zone}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Préstamo Solicitado</span>
                          <span className="text-sm font-extrabold text-slate-900 font-mono block mt-0.5">
                            USD {opp.requested_amount.toLocaleString('es-UY')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Tasación Inmueble</span>
                          <span className="text-xs font-bold text-slate-800 font-mono block mt-0.5">
                            USD {opp.preliminary_valuation.toLocaleString('es-UY')}
                          </span>
                        </div>
                        <div className="bg-emerald-50/80 -m-1 p-3 rounded-lg border border-emerald-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                            Financiación
                          </span>
                          <span className="text-sm font-extrabold text-emerald-800 font-mono block mt-0.5">
                            {opp.financing_ratio}%
                          </span>
                          <span className="text-[9px] text-emerald-700 block">Resguardo &gt; 65%</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Plazo / Modalidad</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">
                            {opp.term_months}m · {isSoloIntereses ? 'Solo Int.' : 'Cap.+Int.'}
                          </span>
                        </div>
                      </div>

                      {/* Modalidad de Pago Fija (Solo Lectura) & Barra de Acciones */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-500">Modalidad registrada:</span>
                          <span className="bg-amber-100/80 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] border border-amber-300/80">
                            🔒 {opp.modality_label}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-emerald-700 font-semibold">
                            Tasa indicativa: {opp.suggested_rate}% anual
                          </span>
                        </div>

                        {/* 2 Botones de Acción: Ver Operación & Presentar Propuesta */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => setSelectedOppForDetail(opp)}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 min-h-[38px]"
                          >
                            Ver operación
                          </button>
                          <Button
                            size="sm"
                            className="text-xs font-semibold shadow-sm min-h-[38px]"
                            style={{ backgroundColor: primaryColor }}
                            onClick={() => handleOpenInterestModal(opp)}
                          >
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            [ ME INTERESA ]
                          </Button>
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
        {/* 3. VISTA: MIS PRÉSTAMOS — GESTIÓN DE CARTERA                      */}
        {/* ================================================================= */}
        {activeTab === 'prestamos' && (
          <div className="space-y-6">
            
            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mis Préstamos Hipotecarios</h2>
                <p className="text-xs text-slate-500">
                  Seguimiento de operaciones formalizadas, cobros periódicos y documentación notarial.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {(['todos', 'activos', 'formalizacion', 'atencion', 'finalizados'] as const).map((st) => {
                  const labels = {
                    todos: 'Todos',
                    activos: 'Activos',
                    formalizacion: 'En formalización',
                    atencion: 'Con atención',
                    finalizados: 'Finalizados',
                  };
                  return (
                    <button
                      key={st}
                      onClick={() => setLoanStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        loanStatusFilter === st
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {labels[st]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tarjetas de Préstamo Activo */}
            <div className="space-y-4">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        HIP
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-slate-900">{loan.public_id}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-bold text-slate-800">{loan.property_type} · {loan.zone}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{loan.modality_label}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🟢 {loan.status_label}
                      </span>
                      <Button
                        size="sm"
                        style={{ backgroundColor: primaryColor }}
                        className="text-xs font-semibold shadow-sm"
                        onClick={() => {
                          setSelectedLoanForDetail(loan);
                          setLoanDetailTab('resumen');
                        }}
                      >
                        Ver préstamo
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Grid de Datos del Préstamo */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Capital prestado</span>
                      <span className="text-base font-extrabold text-slate-900 font-mono block">
                        USD {loan.original_capital.toLocaleString('es-UY')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Tasa anual</span>
                      <span className="text-base font-bold text-emerald-700 block">
                        {loan.rate_annual}% anual
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Valor de la garantía</span>
                      <span className="text-sm font-bold text-slate-800 font-mono block">
                        USD {loan.valuation.toLocaleString('es-UY')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Financiación</span>
                      <span className="text-sm font-bold text-emerald-800 block">
                        {loan.financing_ratio}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Próximo cobro ({loan.next_payment_date})</span>
                      <span className="text-base font-extrabold text-slate-900 font-mono block">
                        USD {loan.next_payment_amount.toLocaleString('es-UY')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Intereses cobrados</span>
                      <span className="text-base font-extrabold text-emerald-700 font-mono block">
                        USD {loan.interest_earned_accumulated.toLocaleString('es-UY')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* 4. VISTA: PROPUESTAS — SEGUIMIENTO DE OFERTAS                     */}
        {/* ================================================================= */}
        {activeTab === 'propuestas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mis Intereses Registrados</h2>
                <p className="text-xs text-slate-500">
                  Manifestaciones no vinculantes enviadas a la mesa de originación y estructuración.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                {interests.length} registros
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {interests.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No has manifestado interés aún</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Explorá las oportunidades activas y utilizá el botón <strong>[ ME INTERESA ]</strong> para indicar tu preferencia no vinculante.
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 text-xs font-semibold"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => navigate(`${basePath}/oportunidades`)}
                  >
                    Ver Oportunidades
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Fecha</th>
                        <th className="py-3.5 px-4">Operación</th>
                        <th className="py-3.5 px-4 text-right">Monto Indicado</th>
                        <th className="py-3.5 px-4">Carácter</th>
                        <th className="py-3.5 px-4 text-center">Estado</th>
                        <th className="py-3.5 px-4">Mensaje / Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {interests.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(item.created_at).toLocaleDateString('es-UY')}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {item.opportunity?.application?.public_id || item.opportunity_id?.slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {item.indicated_amount ? `USD ${item.indicated_amount.toLocaleString('es-UY')}` : 'A convenir'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              No vinculante
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'connected'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : item.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : item.status === 'discarded'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {item.status === 'connected'
                                ? '🤝 Conectado'
                                : item.status === 'completed'
                                ? 'Cerrado'
                                : item.status === 'discarded'
                                ? 'Descartado'
                                : 'Manifestado'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                            {item.message || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* =================================================================== */}
      {/* MODAL: VER OPERACIÓN (DETALLE Y ANÁLISIS DE LA OPORTUNIDAD)        */}
      {/* =================================================================== */}
      {selectedOppForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5 text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedOppForDetail.public_id.split('-')[1] || 'NOV'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{selectedOppForDetail.public_id}</h3>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-700">{selectedOppForDetail.property_type}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                    {selectedOppForDetail.zone}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedOppForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Datos del Inmueble y Garantía */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-xs font-bold text-slate-900 flex items-center">
                  <Building className="w-4 h-4 mr-1.5 text-slate-600" />
                  Garantía Inmobiliaria
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Financiación: {selectedOppForDetail.financing_ratio}%
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Tipo de inmueble:</span>
                  <strong className="text-slate-800">{selectedOppForDetail.property_type}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Ubicación:</span>
                  <strong className="text-slate-800">{selectedOppForDetail.zone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Tasación preliminar:</span>
                  <strong className="text-slate-900 font-mono">USD {selectedOppForDetail.preliminary_valuation.toLocaleString('es-UY')}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Préstamo solicitado:</span>
                  <strong className="text-slate-900 font-mono">USD {selectedOppForDetail.requested_amount.toLocaleString('es-UY')}</strong>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div><strong>Estado de la garantía:</strong> {selectedOppForDetail.guarantee_status}</div>
                <div><strong>Verificación de ingresos:</strong> {selectedOppForDetail.applicant_income_status}</div>
              </div>
            </div>

            {/* 2. Modalidad y Desglose Financiero Proyectado */}
            <div className="bg-amber-50/50 rounded-xl p-4 sm:p-5 border border-amber-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-800">Modalidad registrada:</span>
                  <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] border border-amber-300">
                    🔒 {selectedOppForDetail.modality_label}
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-800">
                  Tasa indicativa: <strong>{selectedOppForDetail.suggested_rate}% anual en USD</strong>
                </span>
              </div>

              {selectedOppForDetail.modality === 'solo_intereses' ? (
                (() => {
                  const ret = calculateInterestOnlyReturns(selectedOppForDetail.requested_amount, selectedOppForDetail.suggested_rate, selectedOppForDetail.term_months);
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                        <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                          <span className="text-[11px] text-slate-500 block">Cobro estimado de intereses</span>
                          <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono block mt-0.5">
                            USD {ret.monthlyInterest.toLocaleString('es-UY')} / mes
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                          <span className="text-[11px] text-slate-500 block">Intereses por año</span>
                          <span className="text-sm sm:text-base font-bold text-slate-900 font-mono block mt-0.5">
                            USD {ret.yearlyInterest.toLocaleString('es-UY')}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                          <span className="text-[11px] text-slate-500 block">Intereses en {selectedOppForDetail.term_months} meses</span>
                          <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono block mt-0.5">
                            USD {ret.totalInterest.toLocaleString('es-UY')}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-[11px] text-slate-500 block">Capital al vencimiento</span>
                          <span className="text-sm sm:text-base font-bold text-slate-900 font-mono block mt-0.5">
                            USD {ret.capitalAtMaturity.toLocaleString('es-UY')}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-amber-200/60 flex items-center space-x-2">
                        <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>
                          <strong>Estructura:</strong> Cobrás intereses mensuales. El capital prestado de USD {selectedOppForDetail.requested_amount.toLocaleString('es-UY')} se cancela íntegro al final del plazo ({selectedOppForDetail.term_months} meses).
                        </span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const ret = calculateAmortizingReturns(selectedOppForDetail.requested_amount, selectedOppForDetail.suggested_rate, selectedOppForDetail.term_months);
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                        <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                          <span className="text-[11px] text-slate-500 block">Cuota mensual estimada</span>
                          <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono block mt-0.5">
                            USD {ret.monthlyPayment.toLocaleString('es-UY')}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                          <span className="text-[11px] text-slate-500 block">Interés mensual (mes 1)</span>
                          <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono block mt-0.5">
                            USD {ret.firstMonthInterest.toLocaleString('es-UY')}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                          <span className="text-[11px] text-slate-500 block">Intereses totales estimados</span>
                          <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono block mt-0.5">
                            USD {ret.totalInterest.toLocaleString('es-UY')}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-[11px] text-slate-500 block">Capital total amortizado</span>
                          <span className="text-sm sm:text-base font-bold text-slate-900 font-mono block mt-0.5">
                            USD {ret.totalCapital.toLocaleString('es-UY')}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-amber-200/60 flex items-center space-x-2">
                        <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>
                          <strong>Estructura:</strong> Cada cuota mensual amortiza capital e intereses. El saldo deudor disminuye con cada vencimiento.
                        </span>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* 3. Compatibilidad con Criterios de Inversión */}
            {(() => {
              const match = evaluateCriteriaMatch(selectedOppForDetail);
              return (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1.5" />
                      Compatibilidad con tus Criterios ({match.passedCount} de {match.total})
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      match.isPerfect ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {match.isPerfect ? 'Cumple 100% tus criterios' : 'Revisión parcial'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {match.checks.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-white border border-slate-100">
                        <span className="text-slate-600 text-[11px]">{c.label}:</span>
                        <span className={`font-semibold text-[11px] flex items-center ${c.passed ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {c.passed ? (
                            <Check className="w-3 h-3 mr-1 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                          )}
                          {c.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 4. Mis Notas Privadas */}
            {(() => {
              const analysis = privateAnalysis[selectedOppForDetail.id] || { interest: 'alto', notes: '' };
              return (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center">
                      <Edit3 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      Mis Notas Privadas (Solo visibles por vos)
                    </span>
                    <div className="flex items-center space-x-1">
                      {(['alto', 'medio', 'bajo', 'descartar'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            setPrivateAnalysis(prev => ({
                              ...prev,
                              [selectedOppForDetail.id]: { ...(prev[selectedOppForDetail.id] || { notes: '' }), interest: lvl },
                            }));
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${
                            analysis.interest === lvl
                              ? lvl === 'alto' ? 'bg-emerald-600 text-white' : lvl === 'medio' ? 'bg-blue-600 text-white' : lvl === 'bajo' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={analysis.notes}
                    onChange={(e) => {
                      const txt = e.target.value;
                      setPrivateAnalysis(prev => ({
                        ...prev,
                        [selectedOppForDetail.id]: { ...(prev[selectedOppForDetail.id] || { interest: 'alto' }), notes: txt },
                      }));
                    }}
                    placeholder="Anotaciones privadas sobre la tasación, dudas notariales o estructuración..."
                    className="w-full text-xs bg-white rounded-lg border border-slate-200 p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400"
                  />
                </div>
              );
            })()}

            {/* Footer con Acciones */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedOppForDetail(null)}
              >
                Cerrar
              </Button>
              <Button
                size="sm"
                className="font-semibold shadow-sm"
                style={{ backgroundColor: primaryColor }}
                onClick={() => {
                  const opp = selectedOppForDetail;
                  setSelectedOppForDetail(null);
                  handleOpenInterestModal(opp);
                }}
              >
                <Heart className="w-3.5 h-3.5 mr-1.5 fill-current" />
                [ ME INTERESA ]
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: MANIFESTAR INTERÉS ([ ME INTERESA ] - NON BINDING)          */}
      {/* =================================================================== */}
      {selectedOppForInterest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Manifestación de Interés
                </span>
                <h3 className="text-lg font-bold text-slate-900">Manifestar Interés en Operación</h3>
              </div>
              <button
                onClick={() => setSelectedOppForInterest(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {interestSuccessMessage ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">¡Interés Registrado Correctamente!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  El administrador de la red ha recibido tu manifestación de interés y se pondrá en contacto para coordinar los detalles.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmInterest} className="space-y-4">
                {/* Disclaimer legal explícito */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Aviso de Carácter No Vinculante:</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Esta manifestación no constituye una oferta vinculante ni un compromiso de desembolso. El administrador de la red se pondrá en contacto para coordinar los detalles.
                  </p>
                </div>

                {/* Resumen de la operación */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operación:</span>
                    <strong className="text-slate-900 font-mono">{selectedOppForInterest.public_id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Inmueble / Ubicación:</span>
                    <strong className="text-slate-900">{selectedOppForInterest.property_type} · {selectedOppForInterest.zone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monto solicitado:</span>
                    <strong className="text-slate-900 font-mono">USD {selectedOppForInterest.requested_amount.toLocaleString('es-UY')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Financiación máx. (LTV):</span>
                    <strong className="text-emerald-700 font-mono">{selectedOppForInterest.financing_ratio}%</strong>
                  </div>
                </div>

                {/* Monto Indicativo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto indicativo que deseás financiar (USD)
                  </label>
                  <input
                    type="number"
                    value={interestForm.indicatedAmount}
                    onChange={(e) => setInterestForm({ ...interestForm, indicatedAmount: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    required
                  />
                </div>

                {/* Comentarios o sugerencias */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Comentarios o condiciones sugeridas (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={interestForm.message}
                    onChange={(e) => setInterestForm({ ...interestForm, message: e.target.value })}
                    placeholder="Ej. Interés sujeto a verificación de títulos y tasación ocular presencial..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOppForInterest(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={interestSubmitting}
                    className="font-bold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white min-h-[38px]"
                  >
                    {interestSubmitting ? 'Enviando...' : 'Confirmar interés'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DETALLE DEL PRÉSTAMO (4 BLOQUES + PESTAÑAS INTERNAS)         */}
      {/* =================================================================== */}
      {selectedLoanForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5 text-left">
            
            {/* Header del Préstamo */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  HIP
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{selectedLoanForDetail.public_id}</h3>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-700">{selectedLoanForDetail.property_type} · {selectedLoanForDetail.zone}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{selectedLoanForDetail.notary_status}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedLoanForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas Contextuales del Préstamo */}
            <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold">
              {(['resumen', 'pagos', 'garantia', 'documentos', 'mensajes'] as const).map((tab) => {
                const labels = {
                  resumen: 'Resumen',
                  pagos: 'Calendario de Cobros',
                  garantia: 'Garantía Hipotecaria',
                  documentos: `Documentos (${selectedLoanForDetail.documents.length})`,
                  mensajes: `Mensajes (${selectedLoanForDetail.messages.length})`,
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setLoanDetailTab(tab)}
                    className={`pb-2.5 px-3 border-b-2 transition-all ${
                      loanDetailTab === tab
                        ? 'border-slate-900 text-slate-900 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* TAB: RESUMEN (LOS 4 BLOQUES ESTRUCTURALES) */}
            {loanDetailTab === 'resumen' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Bloque A: Dinero Prestado */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                      A. Dinero prestado
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Capital original:</span>
                      <strong className="text-slate-900 font-mono">USD {selectedLoanForDetail.original_capital.toLocaleString('es-UY')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Capital pendiente:</span>
                      <strong className="text-slate-900 font-mono">USD {selectedLoanForDetail.remaining_capital.toLocaleString('es-UY')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tasa de interés:</span>
                      <strong className="text-emerald-700">{selectedLoanForDetail.rate_annual}% anual</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plazo contratado:</span>
                      <strong className="text-slate-800">{selectedLoanForDetail.term_months} meses</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Modalidad:</span>
                      <strong className="text-slate-800">{selectedLoanForDetail.modality_label}</strong>
                    </div>
                  </div>

                  {/* Bloque B: Lo que estoy cobrando */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                      B. Lo que estoy cobrando
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Intereses cobrados acumulados:</span>
                      <strong className="text-emerald-700 font-mono">USD {selectedLoanForDetail.interest_earned_accumulated.toLocaleString('es-UY')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Próximo pago:</span>
                      <strong className="text-slate-900">{selectedLoanForDetail.next_payment_date}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Importe del próximo pago:</span>
                      <strong className="text-emerald-700 font-mono">USD {selectedLoanForDetail.next_payment_amount.toLocaleString('es-UY')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Intereses pendientes estimados:</span>
                      <strong className="text-slate-800 font-mono">
                        USD {((selectedLoanForDetail.original_capital * (selectedLoanForDetail.rate_annual / 100) / 12) * (selectedLoanForDetail.term_months - 6)).toLocaleString('es-UY')}
                      </strong>
                    </div>
                  </div>

                  {/* Bloque C: Garantía */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                      C. Garantía hipotecaria
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tipo de propiedad:</span>
                      <strong className="text-slate-800">{selectedLoanForDetail.property_type}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Barrio / Zona:</span>
                      <strong className="text-slate-800">{selectedLoanForDetail.zone}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Valor de tasación:</span>
                      <strong className="text-slate-900 font-mono">USD {selectedLoanForDetail.valuation.toLocaleString('es-UY')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Porcentaje de financiación:</span>
                      <strong className="text-emerald-700 font-mono">{selectedLoanForDetail.financing_ratio}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estado registral:</span>
                      <strong className="text-slate-800">1er Rango Inscripto</strong>
                    </div>
                  </div>

                  {/* Bloque D: Estado */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1">
                      D. Estado del préstamo
                    </span>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Cumplimiento:</span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        🟢 {selectedLoanForDetail.status_label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fecha de inicio:</span>
                      <strong className="text-slate-800">{selectedLoanForDetail.start_date}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vencimiento del préstamo:</span>
                      <strong className="text-slate-800">{selectedLoanForDetail.end_date}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Notas de seguimiento:</span>
                      <span className="text-[11px] text-slate-600">{selectedLoanForDetail.notes}</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB: CALENDARIO DE PAGOS */}
            {loanDetailTab === 'pagos' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Cronograma de cobros para modalidad: <strong>{selectedLoanForDetail.modality_label}</strong></span>
                  <span className="text-[11px]">Moneda: <strong>USD</strong></span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="py-2.5 px-3">N°</th>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3 text-right">Interés esperado</th>
                        <th className="py-2.5 px-3 text-right">Capital</th>
                        <th className="py-2.5 px-3 text-right">Cobrado</th>
                        <th className="py-2.5 px-3 text-right">Saldo pendiente</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLoanForDetail.schedule.map((row) => (
                        <tr key={row.installment_number} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-mono text-slate-500">#{row.installment_number}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{row.due_date}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                            USD {row.expected_interest.toLocaleString('es-UY')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            USD {row.expected_capital.toLocaleString('es-UY')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {row.paid_amount !== null ? `USD ${row.paid_amount.toLocaleString('es-UY')}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                            USD {row.remaining_balance.toLocaleString('es-UY')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.status === 'pagado' ? 'bg-emerald-100 text-emerald-800' :
                              row.status === 'proximo' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {row.status === 'pagado' ? 'Pagado' : row.status === 'proximo' ? 'Próximo' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: GARANTÍA */}
            {loanDetailTab === 'garantia' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900">Detalles Registrales y Técnicos</h4>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-500 block">Tipo de inmueble:</span>
                      <strong>{selectedLoanForDetail.property_type}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ubicación protegida:</span>
                      <strong>{selectedLoanForDetail.zone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tasación al originar:</span>
                      <strong className="font-mono">USD {selectedLoanForDetail.valuation.toLocaleString('es-UY')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Porcentaje de financiación:</span>
                      <strong className="text-emerald-700">{selectedLoanForDetail.financing_ratio}%</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    La dirección registral completa y los antecedentes de dominio están custodiados bajo secreto notarial por {brandName}.
                  </span>
                </div>
              </div>
            )}

            {/* TAB: DOCUMENTOS */}
            {loanDetailTab === 'documentos' && (
              <div className="space-y-3 text-xs">
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedLoanForDetail.documents.map((doc, idx) => (
                    <div key={idx} className="p-3.5 bg-white flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <div>
                          <strong className="text-slate-900 block">{doc.name}</strong>
                          <span className="text-[11px] text-slate-400">{doc.type} · {doc.date} · {doc.size}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Descargando copia autorizada: ${doc.name}`)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: MENSAJES */}
            {loanDetailTab === 'mensajes' && (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 max-h-56 overflow-y-auto">
                  {selectedLoanForDetail.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl ${
                        msg.sender === 'Tú'
                          ? 'bg-amber-100/70 ml-8 text-right border border-amber-200'
                          : 'bg-white mr-8 border border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <strong className="text-slate-700">{msg.sender} ({msg.role})</strong>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-slate-800 text-xs">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newLoanMessage}
                    onChange={(e) => setNewLoanMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendLoanMessage()}
                    placeholder="Escribí una consulta sobre este préstamo a la mesa de estructuración..."
                    className="flex-1 text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <Button size="sm" onClick={handleSendLoanMessage} style={{ backgroundColor: primaryColor }}>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Enviar
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLoanForDetail(null)}
              >
                Cerrar
              </Button>
            </div>

          </div>
        </div>
      )}

    </TenantInvestorLayout>
  );
};
