// ==============================================================================
// HIPOTECALY: Tenant Investor Portal Dashboard (/demo/:tenantSlug/inversor)
// Portal Privado de Oportunidades y Manifestaciones de Interés No Vinculantes
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Target,
  Building,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  DollarSign,
  X,
  AlertTriangle,
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
  Lender,
  InvestorInterest,
} from '../../lib/lendersService';

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
  modality: 'solo_intereses' | 'capital_e_intereses';
  modality_label: string;
  suggested_rate: number;
  applicant_income_status: string;
  guarantee_status: string;
  documentation_pct: number;
  status: string;
  assigned_time: string;
  notes?: string;
}

export const TenantInvestorDashboardPage: React.FC = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const location = useLocation();

  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';
  const basePath = `/demo/${tenant.slug}/inversor`;

  // Módulo activo
  const [isModuleEnabled, setIsModuleEnabled] = useState(true);
  const [, setLoading] = useState(true);

  // Tab activa según ruta
  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.endsWith('/oportunidades')) return 'oportunidades';
    if (path.endsWith('/intereses') || path.endsWith('/propuestas') || path.endsWith('/ofertas')) return 'intereses';
    return 'inicio';
  }, [location.pathname]);

  // Inversor canónico actual
  const [currentLender, setCurrentLender] = useState<Lender | null>(null);

  // Colecciones de Datos
  const [opportunities, setOpportunities] = useState<PrivateOpportunity[]>([]);
  const [interests, setInterests] = useState<InvestorInterest[]>([]);

  // Filtros de Oportunidades
  const [filterDept, setFilterDept] = useState<string>('todos');
  const [filterType, setFilterType] = useState<string>('todos');

  // Modales
  const [selectedOppForDetail, setSelectedOppForDetail] = useState<PrivateOpportunity | null>(null);
  const [selectedOppForInterest, setSelectedOppForInterest] = useState<PrivateOpportunity | null>(null);
  const [interestForm, setInterestForm] = useState({
    indicatedAmount: 100000,
    message: '',
  });
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSuccessMessage, setInterestSuccessMessage] = useState(false);

  // Criterios del Inversor Centralizados
  const investorCriteria = useMemo(() => {
    const rules = currentLender?.rules;
    return {
      availableCapital: currentLender?.available_capital || 200000,
      minLoanAmount: rules?.min_loan || 10000,
      maxLoanAmount: rules?.max_loan || 250000,
      minRate: rules?.min_rate || 11.0,
      maxFinancingRatio: rules?.max_ltv ? Math.round(rules.max_ltv * 100) : 40,
      minTermMonths: rules?.min_term_months || 12,
      maxTermMonths: rules?.max_term_months || 60,
      acceptedPropertyTypes: (rules?.accepted_property_types as string[]) || ['Apartamento', 'Casa', 'Local Comercial'],
      acceptedDepartments: rules?.accepted_departments || ['Montevideo', 'Canelones', 'Maldonado'],
      acceptedModalities: rules?.accepted_modalities || ['solo_intereses', 'capital_e_intereses'],
    };
  }, [currentLender]);

  // Carga inicial desde Supabase
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
              const val = Number(prop.estimated_value) || (req * 2.5);
              const ratio = val > 0 ? Math.round((req / val) * 1000) / 10 : 35.0;
              const zoneStr = [prop.city || 'Montevideo', prop.department || 'Montevideo'].filter(Boolean).join(' · ');

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
                modality: 'solo_intereses',
                modality_label: 'Solo intereses mensuales + Capital al vencimiento',
                suggested_rate: 11.5,
                applicant_income_status: 'Documentación respaldatoria analizada',
                guarantee_status: 'Garantía con tasación colegiada preliminar',
                documentation_pct: 95,
                status: 'Disponible',
                assigned_time: 'Asignada recientemente',
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
      { label: 'Zona geográfica aceptada', passed: checkZone, reason: checkZone ? 'Zona preferida' : 'Fuera de departamentos preferidos' },
      { label: 'Tipo de inmueble aceptado', passed: checkType, reason: checkType ? `${opp.property_type} aceptado` : 'Tipo de inmueble secundario' },
      { label: 'Financiación máxima (LTV)', passed: checkRatio, reason: checkRatio ? `${opp.financing_ratio}% ≤ ${investorCriteria.maxFinancingRatio}% máx` : `Supera el límite de ${investorCriteria.maxFinancingRatio}%` },
      { label: 'Tasa objetivo', passed: checkRate, reason: checkRate ? `${opp.suggested_rate}% ≥ ${investorCriteria.minRate}% mín` : 'Tasa inferior al objetivo' },
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

  // Manejo de Manifestación de Interés No Vinculante
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
      console.error('Error al registrar manifestación de interés:', err);
    } finally {
      setInterestSubmitting(false);
    }
  };

  // Filtrado de oportunidades
  const filteredOpps = useMemo(() => {
    return opportunities.filter(opp => {
      if (filterDept !== 'todos' && !opp.department.toLowerCase().includes(filterDept.toLowerCase())) {
        return false;
      }
      if (filterType !== 'todos' && !opp.property_type.toLowerCase().includes(filterType.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [opportunities, filterDept, filterType]);

  // Si el módulo está deshabilitado por el tenant
  if (!isModuleEnabled) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center space-y-4 border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Red de Inversores no Habilitada
          </h2>
          <p className="text-xs text-slate-600">
            El módulo de inversores privados no se encuentra activo para {brandName}.
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
                  {activeTab === 'inicio' && 'Resumen del Inversor'}
                  {activeTab === 'oportunidades' && 'Oportunidades de Financiación'}
                  {activeTab === 'intereses' && 'Mis Manifestaciones de Interés'}
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500">
                Red privada de estructuración hipotecaria · {brandName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <Link to={`${basePath}/perfil?tab=criterios`}>
              <button
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 min-h-[40px]"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-600" />
                <span>Mis Criterios de Inversión</span>
              </button>
            </Link>

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
        {/* 1. VISTA: INICIO                                                  */}
        {/* ================================================================= */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Capital disponible declarado</span>
                  <DollarSign className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  USD {investorCriteria.availableCapital.toLocaleString('es-UY')}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Listo para estructurar</span>
                  <Link to={`${basePath}/perfil?tab=datos`} className="text-amber-700 font-semibold hover:underline">
                    Editar
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Oportunidades asignadas</span>
                  <Target className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {opportunities.length}
                </div>
                <div className="text-[11px] text-slate-500">
                  Filtradas según tus criterios de inversión
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Intereses manifestados</span>
                  <Heart className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {interests.length}
                </div>
                <div className="text-[11px] text-slate-500">
                  {interests.filter(i => i.status === 'connected').length} en formalización directa
                </div>
              </div>
            </div>

            {/* Banner Informativo sobre Rol y No Vinculación */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 text-xs text-blue-900 flex items-start space-x-3 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-blue-950 text-sm">
                  Entorno Privado de Estructuración Hipotecaria
                </p>
                <p className="leading-relaxed text-blue-800">
                  Las oportunidades presentadas son analizadas y tasadas por el equipo de {brandName}. Las manifestaciones de interés no constituyen compromisos definitivos ni contratos de préstamo hasta su debida formalización notarial ante escribano público.
                </p>
              </div>
            </div>

            {/* Oportunidades Destacadas */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Oportunidades Recientes Disponibles
                  </h2>
                  <p className="text-xs text-slate-500">
                    Carpetas hipotecarias evaluadas con garantía de primer rango
                  </p>
                </div>
                <Link to={`${basePath}/oportunidades`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Ver todas ({opportunities.length})
                  </Button>
                </Link>
              </div>

              {opportunities.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                  No hay nuevas oportunidades cargadas en este momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunities.slice(0, 4).map((opp) => {
                    const match = evaluateCriteriaMatch(opp);
                    return (
                      <div
                        key={opp.id}
                        className="border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-all bg-slate-50/50 hover:bg-white space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {opp.public_id}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 mt-1">
                              {opp.property_type} en {opp.zone}
                            </h3>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            match.passedCount >= 4
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            Match {match.passedCount}/5
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Monto Solicitado</span>
                            <span className="font-bold text-slate-900 font-mono">
                              USD {opp.requested_amount.toLocaleString('es-UY')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Financiación máxima (LTV)</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {opp.financing_ratio}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setSelectedOppForDetail(opp)}
                            className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                          >
                            Ver análisis técnico
                          </button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenInterestModal(opp)}
                            className="text-xs font-semibold"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Heart className="w-3 h-3 mr-1" />
                            Me Interesa
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* 2. VISTA: OPORTUNIDADES                                           */}
        {/* ================================================================= */}
        {activeTab === 'oportunidades' && (
          <div className="space-y-6">
            
            {/* Filtros */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-slate-600">Departamento:</span>
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="todos">Todos</option>
                    <option value="montevideo">Montevideo</option>
                    <option value="canelones">Canelones</option>
                    <option value="maldonado">Maldonado</option>
                    <option value="colonia">Colonia</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-slate-600">Tipo de Inmueble:</span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="todos">Todos</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="casa">Casa</option>
                    <option value="local">Local Comercial</option>
                    <option value="terreno">Terreno</option>
                  </select>
                </div>
              </div>

              <span className="text-slate-500 font-medium">
                {filteredOpps.length} de {opportunities.length} operaciones
              </span>
            </div>

            {/* Listado de Oportunidades */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredOpps.map((opp) => {
                const match = evaluateCriteriaMatch(opp);
                return (
                  <div
                    key={opp.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {opp.public_id}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {opp.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">
                          {opp.property_type} — {opp.zone}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${
                          match.passedCount >= 4
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          Match {match.passedCount}/5
                        </span>
                      </div>
                    </div>

                    {/* Datos Financieros Clave */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-xs border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Monto</span>
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          USD {opp.requested_amount.toLocaleString('es-UY')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Financiación máx (LTV)</span>
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {opp.financing_ratio}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Plazo</span>
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {opp.term_months} meses
                        </span>
                      </div>
                    </div>

                    {/* Desglose de Criterios */}
                    <div className="space-y-1 text-xs">
                      {match.checks.map((chk, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">{chk.label}</span>
                          <span className={chk.passed ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                            {chk.reason}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedOppForDetail(opp)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center space-x-1"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Ver Análisis Técnico</span>
                      </button>

                      <Button
                        size="sm"
                        onClick={() => handleOpenInterestModal(opp)}
                        className="text-xs font-semibold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Heart className="w-3.5 h-3.5 mr-1.5" />
                        Manifestar Interés
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* 3. VISTA: MIS INTERESES                                           */}
        {/* ================================================================= */}
        {activeTab === 'intereses' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Historial de Manifestaciones de Interés
              </h2>
              <p className="text-xs text-slate-500">
                Operaciones donde has expresado interés para estructuración con {brandName}
              </p>
            </div>

            {interests.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl space-y-3">
                <Heart className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">
                  Aún no has registrado manifestaciones de interés en ninguna oportunidad.
                </p>
                <Link to={`${basePath}/oportunidades`}>
                  <Button size="sm" style={{ backgroundColor: primaryColor }} className="text-xs font-semibold">
                    Explorar Oportunidades
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {interests.map((item) => (
                  <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.opportunity?.application?.public_id || `OPP-${item.opportunity_id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'connected'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : item.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {item.status === 'connected' && 'Partes Conectadas'}
                          {item.status === 'interested' && 'Interés Registrado'}
                          {item.status === 'completed' && 'Formalizada'}
                          {item.status === 'withdrawn' && 'Retirada'}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        Monto indicado: <strong className="text-slate-900 font-mono">USD {Number(item.indicated_amount || 0).toLocaleString('es-UY')}</strong>
                      </p>
                      {item.message && (
                        <p className="text-[11px] text-slate-500 italic">"{item.message}"</p>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <span>Registrado el {new Date(item.created_at).toLocaleDateString('es-UY')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL: ME INTERESA (MANIFESTACIÓN NO VINCULANTE) */}
        {selectedOppForInterest && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-slate-900">
                    Manifestar Interés en Operación
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOppForInterest(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {interestSuccessMessage ? (
                <div className="p-6 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="text-base font-bold text-slate-900">
                    ¡Interés Registrado Exitosamente!
                  </h4>
                  <p className="text-xs text-slate-600">
                    El equipo estructurador de {brandName} ha recibido tu indicación y se pondrá en contacto para avanzar en la formalización notarial.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConfirmInterest} className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-mono text-[10px] text-slate-500">{selectedOppForInterest.public_id}</span>
                    <p className="font-bold text-slate-900">{selectedOppForInterest.property_type} en {selectedOppForInterest.zone}</p>
                    <p className="text-slate-600 font-mono">
                      Monto sugerido: USD {selectedOppForInterest.requested_amount.toLocaleString('es-UY')} · Financiación máx (LTV): {selectedOppForInterest.financing_ratio}%
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Monto de Capital que te Interesaría Colocar (USD)
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={5000}
                      value={interestForm.indicatedAmount}
                      onChange={(e) => setInterestForm({ ...interestForm, indicatedAmount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Comentarios o Requisitos Notariales Específicos (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={interestForm.message}
                      onChange={(e) => setInterestForm({ ...interestForm, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      placeholder="Ej: Prefiero firma en escritura durante los próximos 15 días..."
                    />
                  </div>

                  {/* Advertencia Legal Clara de No Vinculación */}
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Aviso importante:</strong> Esta manifestación de interés NO constituye una oferta vinculante ni un contrato de préstamo. {brandName} actuará como estructurador para coordinar la formalización notarial privada entre las partes.
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
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
                      disabled={interestSubmitting}
                      style={{ backgroundColor: primaryColor }}
                      size="sm"
                      className="font-semibold"
                    >
                      {interestSubmitting ? 'Enviando...' : 'Confirmar Manifestación de Interés'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODAL: DETALLE DE OPORTUNIDAD TÉCNICA */}
        {selectedOppForDetail && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-400">{selectedOppForDetail.public_id}</span>
                  <h3 className="text-base font-bold text-slate-900">{selectedOppForDetail.property_type} en {selectedOppForDetail.zone}</h3>
                </div>
                <button
                  onClick={() => setSelectedOppForDetail(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tasación Colegiada Estimada</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      USD {selectedOppForDetail.preliminary_valuation.toLocaleString('es-UY')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Financiación máxima (LTV)</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {selectedOppForDetail.financing_ratio}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Monto Solicitado</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      USD {selectedOppForDetail.requested_amount.toLocaleString('es-UY')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Plazo y Modalidad</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {selectedOppForDetail.term_months} meses · {selectedOppForDetail.modality === 'solo_intereses' ? 'Solo intereses' : 'Amortizable'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-100">
                    <span className="font-semibold">Estado de Garantía:</span>
                    <span>{selectedOppForDetail.guarantee_status}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg text-blue-800 border border-blue-100">
                    <span className="font-semibold">Análisis de Capacidad:</span>
                    <span>{selectedOppForDetail.applicant_income_status}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOppForDetail(null)}
                >
                  Cerrar
                </Button>
                <Button
                  size="sm"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => {
                    const opp = selectedOppForDetail;
                    setSelectedOppForDetail(null);
                    handleOpenInterestModal(opp);
                  }}
                >
                  <Heart className="w-3.5 h-3.5 mr-1.5" />
                  Me Interesa esta Operación
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </TenantInvestorLayout>
  );
};
