// ==============================================================================
// HIPOTECALY: Rediseño Integral del Panel Inversor (/inversor y /demo/:tenantSlug/inversor)
// Optimizado para la mentalidad del prestamista hipotecario privado
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { TenantInvestorLayout } from '../../components/layout/TenantInvestorLayout';
import { useTenant } from '../../contexts/TenantContext';
import { getTenantModules } from '../../lib/tenantModulesService';
import { Button } from '../../components/ui/Button';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

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
// Datos Iniciales de Demostración Resilientes
// -----------------------------------------------------------------------------

const INITIAL_OPPORTUNITIES: PrivateOpportunity[] = [
  {
    id: 'opp-nova-1',
    public_id: 'NOV-2026-00089',
    zone: 'Carrasco · Montevideo',
    department: 'Montevideo',
    property_type: 'Casa Residencial',
    requested_amount: 100000,
    currency: 'USD',
    preliminary_valuation: 320000,
    financing_ratio: 31.2,
    term_months: 36,
    modality: 'solo_intereses',
    modality_label: 'Solo intereses + capital al vencimiento',
    suggested_rate: 11.5,
    applicant_income_status: 'Ingresos verificados (flujo profesional demostrado)',
    guarantee_status: 'Tasación pericial independiente confirmada',
    documentation_pct: 92,
    status: 'Disponible para propuesta',
    assigned_time: 'Asignada hace 2h',
  },
  {
    id: 'opp-nova-2',
    public_id: 'NOV-2026-00094',
    zone: 'Pocitos · Montevideo',
    department: 'Montevideo',
    property_type: 'Apartamento',
    requested_amount: 65000,
    currency: 'USD',
    preliminary_valuation: 190000,
    financing_ratio: 34.2,
    term_months: 24,
    modality: 'solo_intereses',
    modality_label: 'Solo intereses + capital al vencimiento',
    suggested_rate: 12.0,
    applicant_income_status: 'Balances auditados de empresa comercial',
    guarantee_status: 'Padrón horizontal independiente libre de gravámenes',
    documentation_pct: 95,
    status: 'Disponible para propuesta',
    assigned_time: 'Asignada ayer',
  },
  {
    id: 'opp-nova-3',
    public_id: 'NOV-2026-00102',
    zone: 'Punta Carretas · Montevideo',
    department: 'Montevideo',
    property_type: 'Apartamento',
    requested_amount: 85000,
    currency: 'USD',
    preliminary_valuation: 298000,
    financing_ratio: 28.5,
    term_months: 36,
    modality: 'capital_e_intereses',
    modality_label: 'Capital + intereses',
    suggested_rate: 11.0,
    applicant_income_status: 'Ingresos dependientes en empresa multinacional',
    guarantee_status: 'Inspección técnica ocular realizada',
    documentation_pct: 88,
    status: 'Disponible para propuesta',
    assigned_time: 'Asignada hace 4h',
  },
  {
    id: 'opp-nova-4',
    public_id: 'NOV-2026-00118',
    zone: 'Ciudad de la Costa · Canelones',
    department: 'Canelones',
    property_type: 'Casa',
    requested_amount: 80000,
    currency: 'USD',
    preliminary_valuation: 225000,
    financing_ratio: 35.5,
    term_months: 36,
    modality: 'solo_intereses',
    modality_label: 'Solo intereses + capital al vencimiento',
    suggested_rate: 12.0,
    applicant_income_status: 'Ingresos familiares consolidados',
    guarantee_status: 'Plano de mensura y títulos antecedentes revisados',
    documentation_pct: 90,
    status: 'Disponible para propuesta',
    assigned_time: 'Asignada hace 1d',
  },
];

const INITIAL_LOANS: ActiveLoan[] = [
  {
    id: 'loan-421',
    public_id: 'HIP-2026-00421',
    property_type: 'Apartamento',
    zone: 'Pocitos · Montevideo',
    department: 'Montevideo',
    original_capital: 100000,
    remaining_capital: 100000,
    rate_annual: 12.0,
    term_months: 36,
    modality: 'solo_intereses',
    modality_label: 'Solo intereses + devolución del capital al vencimiento',
    valuation: 280000,
    financing_ratio: 35.7,
    interest_earned_accumulated: 6000,
    next_payment_date: '10/10/2026',
    next_payment_amount: 1000,
    status: 'al_dia',
    status_label: 'Al día',
    start_date: '10/04/2026',
    end_date: '10/04/2029',
    notary_status: 'Hipoteca de 1er Rango inscripta en Registro de la Propiedad',
    notes: 'Prestatario puntual. Pagos acreditados mediante transferencia bancaria el día 10 de cada mes.',
    documents: [
      { name: 'Escritura_Hipoteca_1er_Rango.pdf', type: 'Notarial', date: '10/04/2026', size: '2.4 MB' },
      { name: 'Poliza_Seguro_Incendio_Endosada.pdf', type: 'Seguro', date: '08/04/2026', size: '1.1 MB' },
      { name: 'Informe_Tasacion_Certificada.pdf', type: 'Tasación', date: '02/04/2026', size: '3.8 MB' },
    ],
    messages: [
      { sender: 'Mesa Notarial', time: '10/09/2026 11:20', text: 'Se confirmó la acreditación del cupón mensual N°5 de USD 1.000.', role: 'Escribano' },
      { sender: 'Tú', time: '10/09/2026 11:45', text: 'Recibido correctamente. Gracias.', role: 'Inversor' },
    ],
    schedule: [
      { installment_number: 1, due_date: '10/05/2026', expected_interest: 1000, expected_capital: 0, total_payment: 1000, paid_amount: 1000, remaining_balance: 100000, status: 'pagado' },
      { installment_number: 2, due_date: '10/06/2026', expected_interest: 1000, expected_capital: 0, total_payment: 1000, paid_amount: 1000, remaining_balance: 100000, status: 'pagado' },
      { installment_number: 3, due_date: '10/07/2026', expected_interest: 1000, expected_capital: 0, total_payment: 1000, paid_amount: 1000, remaining_balance: 100000, status: 'pagado' },
      { installment_number: 4, due_date: '10/08/2026', expected_interest: 1000, expected_capital: 0, total_payment: 1000, paid_amount: 1000, remaining_balance: 100000, status: 'pagado' },
      { installment_number: 5, due_date: '10/09/2026', expected_interest: 1000, expected_capital: 0, total_payment: 1000, paid_amount: 1000, remaining_balance: 100000, status: 'pagado' },
      { installment_number: 6, due_date: '10/10/2026', expected_interest: 1000, expected_capital: 0, total_payment: 1000, paid_amount: 1000, remaining_balance: 100000, status: 'pagado' },
      { installment_number: 7, due_date: '10/11/2026', expected_interest: 1000, expected_capital: 0, total_payment: 1000, paid_amount: null, remaining_balance: 100000, status: 'proximo' },
      { installment_number: 8, due_date: '10/12/2026', expected_interest: 1000, expected_capital: 0, total_payment: 1000, paid_amount: null, remaining_balance: 100000, status: 'pendiente' },
    ],
  },
  {
    id: 'loan-389',
    public_id: 'HIP-2026-00389',
    property_type: 'Casa',
    zone: 'Carrasco · Montevideo',
    department: 'Montevideo',
    original_capital: 150000,
    remaining_capital: 150000,
    rate_annual: 11.0,
    term_months: 48,
    modality: 'solo_intereses',
    modality_label: 'Solo intereses + devolución del capital al vencimiento',
    valuation: 450000,
    financing_ratio: 33.3,
    interest_earned_accumulated: 12750,
    next_payment_date: '15/10/2026',
    next_payment_amount: 1375,
    status: 'al_dia',
    status_label: 'Al día',
    start_date: '15/12/2025',
    end_date: '15/12/2029',
    notary_status: 'Hipoteca de 1er Rango inscripta y vigente',
    notes: 'Residencia en Carrasco. Excelente comportamiento de pago.',
    documents: [
      { name: 'Contrato_Mutuo_Hipotecario.pdf', type: 'Notarial', date: '15/12/2025', size: '3.1 MB' },
      { name: 'Certificado_Registros_Publicos.pdf', type: 'Registral', date: '12/12/2025', size: '980 KB' },
    ],
    messages: [
      { sender: 'Mesa Notarial', time: '15/09/2026 09:10', text: 'Comprobante de pago N°9 recibido y conciliado.', role: 'Escribano' },
    ],
    schedule: [
      { installment_number: 1, due_date: '15/01/2026', expected_interest: 1375, expected_capital: 0, total_payment: 1375, paid_amount: 1375, remaining_balance: 150000, status: 'pagado' },
      { installment_number: 2, due_date: '15/02/2026', expected_interest: 1375, expected_capital: 0, total_payment: 1375, paid_amount: 1375, remaining_balance: 150000, status: 'pagado' },
      { installment_number: 3, due_date: '15/03/2026', expected_interest: 1375, expected_capital: 0, total_payment: 1375, paid_amount: 1375, remaining_balance: 150000, status: 'pagado' },
      { installment_number: 4, due_date: '15/04/2026', expected_interest: 1375, expected_capital: 0, total_payment: 1375, paid_amount: 1375, remaining_balance: 150000, status: 'pagado' },
      { installment_number: 5, due_date: '15/05/2026', expected_interest: 1375, expected_capital: 0, total_payment: 1375, paid_amount: 1375, remaining_balance: 150000, status: 'pagado' },
      { installment_number: 6, due_date: '15/06/2026', expected_interest: 1375, expected_capital: 0, total_payment: 1375, paid_amount: 1375, remaining_balance: 150000, status: 'pagado' },
      { installment_number: 7, due_date: '15/07/2026', expected_interest: 1375, expected_capital: 0, total_payment: 1375, paid_amount: 1375, remaining_balance: 150000, status: 'pagado' },
      { installment_number: 8, due_date: '15/08/2026', expected_interest: 1375, expected_capital: 0, total_payment: 1375, paid_amount: 1375, remaining_balance: 150000, status: 'pagado' },
      { installment_number: 9, due_date: '15/09/2026', expected_interest: 1375, expected_capital: 0, total_payment: 1375, paid_amount: 1375, remaining_balance: 150000, status: 'pagado' },
      { installment_number: 10, due_date: '15/10/2026', expected_interest: 1375, expected_capital: 0, total_payment: 1375, paid_amount: null, remaining_balance: 150000, status: 'proximo' },
    ],
  },
];

const INITIAL_PROPOSALS: ProposalItem[] = [
  {
    id: 'prop-101',
    opp_id: 'opp-nova-1',
    public_id: 'NOV-2026-00089',
    property_type: 'Casa Residencial',
    zone: 'Carrasco · Montevideo',
    proposed_amount: 100000,
    proposed_rate: 11.5,
    term_months: 36,
    modality: 'solo_intereses',
    modality_label: 'Solo intereses',
    estimated_interest_yearly: 11500,
    submitted_at: '05/09/2026',
    valid_until: '20/09/2026',
    status: 'enviada',
    conditions: 'Desembolso condicionado a certificación notarial de título perfecto y seguro de incendio endosado.',
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
    modality: 'solo_intereses',
    modality_label: 'Solo intereses',
    estimated_interest_yearly: 8800,
    submitted_at: '28/08/2026',
    valid_until: '12/09/2026',
    status: 'presentada',
    conditions: 'Cancelación sin penalización a partir del mes 12.',
  },
  {
    id: 'prop-085',
    opp_id: 'opp-nova-prev-2',
    public_id: 'NOV-2026-00054',
    property_type: 'Apartamento',
    zone: 'Pocitos · Montevideo',
    proposed_amount: 100000,
    proposed_rate: 12.0,
    term_months: 36,
    modality: 'solo_intereses',
    modality_label: 'Solo intereses',
    estimated_interest_yearly: 12000,
    submitted_at: '14/04/2026',
    valid_until: '29/04/2026',
    status: 'aceptada',
    conditions: 'Formalizada exitosamente bajo operación HIP-2026-00421.',
  },
  {
    id: 'prop-077',
    opp_id: 'opp-nova-prev-3',
    public_id: 'NOV-2026-00041',
    property_type: 'Casa',
    zone: 'Carrasco · Montevideo',
    proposed_amount: 150000,
    proposed_rate: 11.0,
    term_months: 48,
    modality: 'solo_intereses',
    modality_label: 'Solo intereses',
    estimated_interest_yearly: 16500,
    submitted_at: '02/12/2025',
    valid_until: '17/12/2025',
    status: 'aceptada',
    conditions: 'Formalizada exitosamente bajo operación HIP-2026-00389.',
  },
];

// -----------------------------------------------------------------------------
// Funciones Financieras Auxiliares Precisas
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
  const location = useLocation();

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

  // Colecciones de Datos
  const [opportunities, setOpportunities] = useState<PrivateOpportunity[]>(INITIAL_OPPORTUNITIES);
  const [loans, setLoans] = useState<ActiveLoan[]>(INITIAL_LOANS);
  const [proposals, setProposals] = useState<ProposalItem[]>(INITIAL_PROPOSALS);

  // Criterios de Inversión
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [investorCriteria, setInvestorCriteria] = useState<InvestorCriteria>({
    availableCapital: 80000,
    minLoanAmount: 25000,
    maxLoanAmount: 180000,
    minRate: 11.0,
    maxFinancingRatio: 40.0,
    minTermMonths: 12,
    maxTermMonths: 60,
    acceptedPropertyTypes: ['Apartamento', 'Casa Residencial', 'Casa', 'Local Comercial', 'Campo', 'Terreno'],
    acceptedDepartments: ['Montevideo', 'Canelones', 'Maldonado'],
    acceptedModalities: ['solo_intereses', 'capital_e_intereses'],
  });

  // Notas Privadas e Interés por Oportunidad
  const [privateAnalysis, setPrivateAnalysis] = useState<Record<string, {
    interest: 'alto' | 'medio' | 'bajo' | 'descartar';
    notes: string;
  }>>({
    'opp-nova-1': {
      interest: 'alto',
      notes: 'Ubicación consolidada en Carrasco. Buena relación de garantía con 31.2% de financiación.',
    },
    'opp-nova-2': {
      interest: 'medio',
      notes: 'Apartamento céntrico en Pocitos. Evaluar tasa del 12%.',
    },
    'opp-nova-3': {
      interest: 'alto',
      notes: 'Punta Carretas, amortización de capital mensual. Excelente para flujo continuo.',
    },
  });

  // Modales
  const [selectedOppForProposal, setSelectedOppForProposal] = useState<PrivateOpportunity | null>(null);
  const [proposalForm, setProposalForm] = useState({
    amount: 100000,
    rate: 11.5,
    term: 36,
    validityDays: 15,
    conditions: 'Desembolso condicionado a verificación notarial de primer rango y póliza de seguro de incendio endosada.',
  });
  const [proposalSuccessMessage, setProposalSuccessMessage] = useState(false);

  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<ActiveLoan | null>(null);
  const [loanDetailTab, setLoanDetailTab] = useState<'resumen' | 'pagos' | 'garantia' | 'documentos' | 'mensajes'>('resumen');
  const [newLoanMessage, setNewLoanMessage] = useState('');

  // Filtros en pestañas
  const [loanStatusFilter, setLoanStatusFilter] = useState<'todos' | 'activos' | 'formalizacion' | 'atencion' | 'finalizados'>('todos');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<'todas' | 'enviada' | 'presentada' | 'aceptada' | 'rechazada' | 'vencida'>('todas');

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
                status: 'Disponible para propuesta',
                assigned_time: 'Reciente',
              };
            });

            // Combinar garantizando las iniciales
            const combined = [...mappedOpps];
            for (const item of INITIAL_OPPORTUNITIES) {
              if (!combined.some(c => c.id === item.id || c.public_id === item.public_id)) {
                combined.push(item);
              }
            }
            setOpportunities(combined);
          }
        } catch (err) {
          console.warn('Error conectando a Supabase para oportunidades:', err);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [tenant.id]);

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
      { label: 'Porcentaje de financiación', passed: checkRatio, reason: checkRatio ? `${opp.financing_ratio}% ≤ ${investorCriteria.maxFinancingRatio}% máx` : `Supera tu límite de ${investorCriteria.maxFinancingRatio}%` },
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

  // Manejo de Propuesta
  const handleOpenProposal = (opp: PrivateOpportunity) => {
    setSelectedOppForProposal(opp);
    setProposalForm({
      amount: opp.requested_amount,
      rate: opp.suggested_rate || 11.5,
      term: opp.term_months,
      validityDays: 15,
      conditions: 'Desembolso condicionado a verificación notarial de primer rango y póliza de seguro de incendio endosada.',
    });
    setProposalSuccessMessage(false);
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppForProposal) return;

    const yearlyInt = selectedOppForProposal.modality === 'solo_intereses'
      ? calculateInterestOnlyReturns(proposalForm.amount, proposalForm.rate, proposalForm.term).yearlyInterest
      : calculateAmortizingReturns(proposalForm.amount, proposalForm.rate, proposalForm.term).firstMonthInterest * 12;

    const newProp: ProposalItem = {
      id: `prop-${Date.now()}`,
      opp_id: selectedOppForProposal.id,
      public_id: selectedOppForProposal.public_id,
      property_type: selectedOppForProposal.property_type,
      zone: selectedOppForProposal.zone,
      proposed_amount: proposalForm.amount,
      proposed_rate: proposalForm.rate,
      term_months: proposalForm.term,
      modality: selectedOppForProposal.modality,
      modality_label: selectedOppForProposal.modality_label,
      estimated_interest_yearly: yearlyInt,
      submitted_at: 'Hoy',
      valid_until: `${proposalForm.validityDays} días`,
      status: 'enviada',
      conditions: proposalForm.conditions,
    };

    setProposals([newProp, ...proposals]);
    setProposalSuccessMessage(true);

    setTimeout(() => {
      setSelectedOppForProposal(null);
      setProposalSuccessMessage(false);
    }, 1600);
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
              onClick={() => setIsCriteriaModalOpen(true)}
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
                    onClick={() => setIsCriteriaModalOpen(true)}
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

            <div className="space-y-6">
              {opportunities.map((opp) => {
                const matchResult = evaluateCriteriaMatch(opp);
                const isSoloIntereses = opp.modality === 'solo_intereses';
                const interestOnly = calculateInterestOnlyReturns(opp.requested_amount, opp.suggested_rate, opp.term_months);
                const amortizing = calculateAmortizingReturns(opp.requested_amount, opp.suggested_rate, opp.term_months);
                const analysis = privateAnalysis[opp.id] || { interest: 'alto', notes: '' };

                return (
                  <div
                    key={opp.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
                  >
                    {/* Header de la tarjeta */}
                    <div className="bg-slate-50/80 border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {opp.public_id.split('-')[1] || 'NOV'}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{opp.public_id}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-bold text-slate-800">{opp.property_type}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-bold text-slate-900 flex items-center text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <MapPin className="w-3 h-3 mr-1 text-amber-600" />
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

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="text-xs font-semibold shadow-sm"
                          style={{ backgroundColor: primaryColor }}
                          onClick={() => handleOpenProposal(opp)}
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          Presentar propuesta
                        </Button>
                      </div>
                    </div>

                    {/* Cuerpo: Datos Estructurados del Préstamo */}
                    <div className="p-6 space-y-6">
                      
                      {/* Grid de Datos Principales */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Ubicación</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">{opp.zone}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Tipo de Inmueble</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">{opp.property_type}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Valor de Tasación</span>
                          <span className="text-sm font-bold text-slate-900 font-mono block mt-0.5">
                            USD {opp.preliminary_valuation.toLocaleString('es-UY')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Préstamo Solicitado</span>
                          <span className="text-base font-extrabold text-slate-900 font-mono block">
                            USD {opp.requested_amount.toLocaleString('es-UY')}
                          </span>
                        </div>
                        <div className="bg-emerald-50/90 -m-1 p-3 rounded-lg border border-emerald-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                            Porcentaje de Financiación
                          </span>
                          <span className="text-base font-extrabold text-emerald-800 font-mono block mt-0.5">
                            {opp.financing_ratio}%
                          </span>
                          <span className="text-[9px] text-emerald-700 block">Resguardo &gt; 65% valor</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-slate-500 block">Plazo</span>
                          <span className="text-xs font-bold text-slate-900 block mt-0.5">
                            {opp.term_months} meses
                          </span>
                        </div>
                      </div>

                      {/* Modalidad y Desglose Financiero de Ganancia */}
                      <div className="bg-amber-50/40 rounded-xl p-4 sm:p-5 border border-amber-200/70 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/50 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">Modalidad de pago registrada en expediente:</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              {opp.modality_label}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-emerald-800">
                            Tasa indicativa: <strong>{opp.suggested_rate}% anual en USD</strong>
                          </span>
                        </div>

                        {/* CASO A: SOLO INTERESES */}
                        {isSoloIntereses ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                              <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                                <span className="text-[11px] text-slate-500 block">Cobro estimado de intereses</span>
                                <span className="text-base font-extrabold text-emerald-700 font-mono">
                                  USD {interestOnly.monthlyInterest.toLocaleString('es-UY')} / mes
                                </span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                                <span className="text-[11px] text-slate-500 block">Intereses por año</span>
                                <span className="text-base font-bold text-slate-900 font-mono">
                                  USD {interestOnly.yearlyInterest.toLocaleString('es-UY')}
                                </span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                                <span className="text-[11px] text-slate-500 block">Intereses en {opp.term_months} meses</span>
                                <span className="text-base font-extrabold text-emerald-700 font-mono">
                                  USD {interestOnly.totalInterest.toLocaleString('es-UY')}
                                </span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="text-[11px] text-slate-500 block">Capital recuperado al vencimiento</span>
                                <span className="text-base font-bold text-slate-900 font-mono">
                                  USD {interestOnly.capitalAtMaturity.toLocaleString('es-UY')}
                                </span>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-lg border border-amber-200/60 flex items-center space-x-2">
                              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>
                                <strong>Cómo cobrás:</strong> Durante el préstamo cobrás intereses periódicos mensuales. El capital prestado de USD {opp.requested_amount.toLocaleString('es-UY')} se devuelve íntegro al vencimiento del plazo.
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* CASO B: CAPITAL + INTERESES */
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-left">
                              <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                                <span className="text-[11px] text-slate-500 block">Cuota mensual estimada</span>
                                <span className="text-base font-extrabold text-emerald-700 font-mono">
                                  USD {amortizing.monthlyPayment.toLocaleString('es-UY')}
                                </span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                                <span className="text-[11px] text-slate-500 block">Capital incluido (mes 1)</span>
                                <span className="text-sm font-bold text-slate-800 font-mono">
                                  USD {amortizing.firstMonthCapital.toLocaleString('es-UY')}
                                </span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                                <span className="text-[11px] text-slate-500 block">Interés incluido (mes 1)</span>
                                <span className="text-sm font-bold text-emerald-700 font-mono">
                                  USD {amortizing.firstMonthInterest.toLocaleString('es-UY')}
                                </span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-amber-200/80">
                                <span className="text-[11px] text-slate-500 block">Intereses totales estimados</span>
                                <span className="text-base font-extrabold text-emerald-700 font-mono">
                                  USD {amortizing.totalInterest.toLocaleString('es-UY')}
                                </span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <span className="text-[11px] text-slate-500 block">Capital total a recuperar</span>
                                <span className="text-sm font-bold text-slate-900 font-mono">
                                  USD {amortizing.totalCapital.toLocaleString('es-UY')}
                                </span>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-lg border border-amber-200/60 flex items-center space-x-2">
                              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>
                                <strong>Cómo cobrás:</strong> Cada cuota mensual amortiza parte del capital y abona los intereses devengados del mes. El saldo de capital disminuye progresivamente.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Match de Criterios & Notas Privadas */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1 border-t border-slate-100">
                        {/* Compatibilidad con tus criterios */}
                        <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1.5" />
                              Coincide con {matchResult.passedCount} de {matchResult.total} criterios
                            </span>
                            {matchResult.isPerfect ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                Compatibilidad Alta
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                Revisión Parcial
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-xs">
                            {matchResult.checks.map((c, i) => (
                              <div key={i} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-600">{c.label}:</span>
                                <span className={`font-semibold flex items-center ${c.passed ? 'text-emerald-700' : 'text-amber-700'}`}>
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

                        {/* Mi Análisis y Notas Privadas */}
                        <div className="lg:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center">
                              <Edit3 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                              Mis Notas Privadas (Solo vos las ves)
                            </span>
                            <div className="flex items-center space-x-1">
                              {(['alto', 'medio', 'bajo', 'descartar'] as const).map((lvl) => (
                                <button
                                  key={lvl}
                                  onClick={() => {
                                    setPrivateAnalysis(prev => ({
                                      ...prev,
                                      [opp.id]: { ...(prev[opp.id] || { notes: '' }), interest: lvl },
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
                                [opp.id]: { ...(prev[opp.id] || { interest: 'alto' }), notes: txt },
                              }));
                            }}
                            placeholder="Anotaciones privadas sobre la garantía, dudas notariales o estructuración..."
                            className="w-full text-xs bg-white rounded-lg border border-slate-200 p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400"
                          />
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
                <h2 className="text-lg font-bold text-slate-900">Historial de Propuestas Emitidas</h2>
                <p className="text-xs text-slate-500">
                  Ofertas enviadas para evaluación y presentación a los solicitantes.
                </p>
              </div>

              {/* Filtros de Estado */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {(['todas', 'enviada', 'presentada', 'aceptada', 'rechazada', 'vencida'] as const).map((st) => {
                  const labels = {
                    todas: 'Todas',
                    enviada: 'Pendientes',
                    presentada: 'Presentadas',
                    aceptada: 'Aceptadas',
                    rechazada: 'Rechazadas',
                    vencida: 'Vencidas',
                  };
                  return (
                    <button
                      key={st}
                      onClick={() => setProposalStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        proposalStatusFilter === st
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

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Operación</th>
                      <th className="py-3.5 px-4">Zona</th>
                      <th className="py-3.5 px-4 text-right">Monto</th>
                      <th className="py-3.5 px-4 text-center">Tasa Anual</th>
                      <th className="py-3.5 px-4">Modalidad</th>
                      <th className="py-3.5 px-4 text-right">Intereses Estimados</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                      <th className="py-3.5 px-4 text-right">Vigencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proposals
                      .filter(p => proposalStatusFilter === 'todas' || p.status === proposalStatusFilter)
                      .map((prop) => {
                        const badgeStyles: Record<string, string> = {
                          borrador: 'bg-slate-100 text-slate-700',
                          enviada: 'bg-blue-100 text-blue-800',
                          presentada: 'bg-purple-100 text-purple-800',
                          aceptada: 'bg-emerald-100 text-emerald-800',
                          rechazada: 'bg-rose-100 text-rose-800',
                          vencida: 'bg-slate-100 text-slate-500',
                        };

                        const statusLabels: Record<string, string> = {
                          borrador: 'Borrador',
                          enviada: 'Pendiente (en revisión)',
                          presentada: 'Presentada al solicitante',
                          aceptada: 'Aceptada',
                          rechazada: 'Rechazada',
                          vencida: 'Vencida',
                        };

                        return (
                          <tr key={prop.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              {prop.public_id}
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              {prop.zone}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                              USD {prop.proposed_amount.toLocaleString('es-UY')}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                              {prop.proposed_rate}%
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">
                              {prop.modality_label}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                              USD {prop.estimated_interest_yearly.toLocaleString('es-UY')} / año
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${badgeStyles[prop.status] || 'bg-slate-100'}`}>
                                {statusLabels[prop.status]}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-500">
                              {prop.valid_until}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* =================================================================== */}
      {/* MODAL: PRESENTAR PROPUESTA (MODALIDAD SOLO LECTURA)                 */}
      {/* =================================================================== */}
      {selectedOppForProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Formulario de Propuesta
                </span>
                <h3 className="text-lg font-bold text-slate-900">Presentar Propuesta de Financiación</h3>
              </div>
              <button
                onClick={() => setSelectedOppForProposal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {proposalSuccessMessage ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">¡Propuesta Enviada con Éxito!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  La propuesta ha sido enviada al equipo de estructuración de {brandName} para su revisión y presentación al solicitante.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitProposal} className="space-y-4">
                
                {/* 1. Información Fija de la Operación (Solo Lectura) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Propiedad:</span>
                    <strong className="text-slate-900">{selectedOppForProposal.property_type} · {selectedOppForProposal.zone}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Tasación preliminar:</span>
                    <strong className="text-slate-900 font-mono">USD {selectedOppForProposal.preliminary_valuation.toLocaleString('es-UY')}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Préstamo solicitado:</span>
                    <strong className="text-slate-900 font-mono">USD {selectedOppForProposal.requested_amount.toLocaleString('es-UY')}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Porcentaje de financiación:</span>
                    <strong className="text-emerald-700 font-mono">{selectedOppForProposal.financing_ratio}%</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="font-semibold text-slate-700">Modalidad de pago de esta operación:</span>
                    <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] border border-amber-300">
                      🔒 {selectedOppForProposal.modality_label}
                    </span>
                  </div>
                </div>

                {/* 2. Campos Editables del Inversor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ¿Cuánto querés prestar? (USD)
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
                      ¿A qué tasa anual? (% USD)
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
                      Plazo (Meses)
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
                      Vigencia de la propuesta (Días)
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
                    Condiciones particulares o requisitos notariales
                  </label>
                  <textarea
                    rows={2}
                    value={proposalForm.conditions}
                    onChange={(e) => setProposalForm({ ...proposalForm, conditions: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                {/* 3. Cálculo en Vivo Reactivo */}
                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 space-y-2 text-xs">
                  <span className="font-bold text-emerald-900 block">
                    Con esta propuesta cobrarías aproximadamente:
                  </span>
                  {selectedOppForProposal.modality === 'solo_intereses' ? (
                    (() => {
                      const ret = calculateInterestOnlyReturns(proposalForm.amount, proposalForm.rate, proposalForm.term);
                      return (
                        <div className="space-y-1 text-slate-700">
                          <div className="flex justify-between">
                            <span>Intereses por mes:</span>
                            <strong className="text-emerald-800 font-mono">USD {ret.monthlyInterest.toLocaleString('es-UY')}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Intereses por año:</span>
                            <strong className="text-slate-900 font-mono">USD {ret.yearlyInterest.toLocaleString('es-UY')}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Intereses totales ({proposalForm.term} meses):</span>
                            <strong className="text-emerald-800 font-mono">USD {ret.totalInterest.toLocaleString('es-UY')}</strong>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-emerald-200 font-semibold text-slate-900">
                            <span>Capital a recuperar al vencimiento:</span>
                            <span className="font-mono">USD {ret.capitalAtMaturity.toLocaleString('es-UY')}</span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    (() => {
                      const ret = calculateAmortizingReturns(proposalForm.amount, proposalForm.rate, proposalForm.term);
                      return (
                        <div className="space-y-1 text-slate-700">
                          <div className="flex justify-between">
                            <span>Cuota mensual estimada:</span>
                            <strong className="text-emerald-800 font-mono">USD {ret.monthlyPayment.toLocaleString('es-UY')}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Intereses totales estimados:</span>
                            <strong className="text-emerald-800 font-mono">USD {ret.totalInterest.toLocaleString('es-UY')}</strong>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-emerald-200 font-semibold text-slate-900">
                            <span>Capital total recuperado:</span>
                            <span className="font-mono">USD {ret.totalCapital.toLocaleString('es-UY')}</span>
                          </div>
                        </div>
                      );
                    })()
                  )}
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
                    Enviar propuesta
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

      {/* =================================================================== */}
      {/* MODAL: MIS CRITERIOS DE INVERSIÓN                                   */}
      {/* =================================================================== */}
      {isCriteriaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto text-left">
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

            <div className="space-y-4 text-xs">
              
              {/* Capital Disponible */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Capital Disponible para Prestar (USD)
                </label>
                <input
                  type="number"
                  value={investorCriteria.availableCapital}
                  onChange={(e) => setInvestorCriteria({ ...investorCriteria, availableCapital: Number(e.target.value) })}
                  className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {/* Rango de Monto por Préstamo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monto Mínimo por Préstamo (USD)
                  </label>
                  <input
                    type="number"
                    value={investorCriteria.minLoanAmount}
                    onChange={(e) => setInvestorCriteria({ ...investorCriteria, minLoanAmount: Number(e.target.value) })}
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monto Máximo por Préstamo (USD)
                  </label>
                  <input
                    type="number"
                    value={investorCriteria.maxLoanAmount}
                    onChange={(e) => setInvestorCriteria({ ...investorCriteria, maxLoanAmount: Number(e.target.value) })}
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Tasa Mínima y Porcentaje Máximo de Financiación */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tasa Mínima Deseada (% anual)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={investorCriteria.minRate}
                    onChange={(e) => setInvestorCriteria({ ...investorCriteria, minRate: Number(e.target.value) })}
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Porcentaje Máx. Financiación (%)
                  </label>
                  <input
                    type="number"
                    value={investorCriteria.maxFinancingRatio}
                    onChange={(e) => setInvestorCriteria({ ...investorCriteria, maxFinancingRatio: Number(e.target.value) })}
                    className="w-full font-mono bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Tipos de Inmueble Aceptados */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Tipos de Inmueble Aceptados
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Apartamento', 'Casa Residencial', 'Local Comercial', 'Campo', 'Terreno'].map((type) => {
                    const selected = investorCriteria.acceptedPropertyTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? investorCriteria.acceptedPropertyTypes.filter(t => t !== type)
                            : [...investorCriteria.acceptedPropertyTypes, type];
                          setInvestorCriteria({ ...investorCriteria, acceptedPropertyTypes: next });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          selected
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zonas Aceptadas */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Departamentos / Zonas Aceptadas
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'San José'].map((dept) => {
                    const selected = investorCriteria.acceptedDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? investorCriteria.acceptedDepartments.filter(d => d !== dept)
                            : [...investorCriteria.acceptedDepartments, dept];
                          setInvestorCriteria({ ...investorCriteria, acceptedDepartments: next });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          selected
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {selected ? '✓ ' : ''}{dept}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modalidades de Pago Aceptadas */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Modalidades de Pago Aceptadas
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'solo_intereses', label: 'Solo intereses + devolución del capital al vencimiento' },
                    { id: 'capital_e_intereses', label: 'Capital + intereses (cuotas amortizantes)' },
                  ].map((mod) => {
                    const checked = investorCriteria.acceptedModalities.includes(mod.id as PaymentModalityType);
                    return (
                      <label key={mod.id} className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? investorCriteria.acceptedModalities.filter(m => m !== mod.id)
                              : [...investorCriteria.acceptedModalities, mod.id as PaymentModalityType];
                            setInvestorCriteria({ ...investorCriteria, acceptedModalities: next });
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs">{mod.label}</span>
                      </label>
                    );
                  })}
                </div>
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
