import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  ShieldCheck,
  Home,
  Building2,
  TreePine,
  Briefcase,
  Layers,
  Scale,
  ChevronDown,
  ChevronUp,
  Bookmark,
  X,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { Select } from '../components/ui/Select';
import { PropertyType, LegalStatus, IncomeType } from '../lib/types';
import {
  getActiveMarketplaceRules,
  calculateBorrowingCapacity,
  subscribeToRuleChanges,
  MarketplaceRuleSet,
  DEFAULT_PILOT_RULESET,
} from '../lib/rulesService';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { clientSimulationService } from '../lib/clientSimulationService';

export const SimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const isNova = tenant.slug === 'estudio-nova' || tenant.slug === 'nova' || tenant.slug === 'estudio_nova';
  const isWhiteLabel = tenant.is_white_label || isNova;

  // Reglas crediticias activas desde DB / servicio único
  const [rules, setRules] = useState<MarketplaceRuleSet>(DEFAULT_PILOT_RULESET);

  useEffect(() => {
    // Carga de reglas
    getActiveMarketplaceRules().then((loadedRules) => {
      setRules(loadedRules);
    });

    const unsubscribe = subscribeToRuleChanges((updatedRules) => {
      setRules(updatedRules);
    });

    return () => unsubscribe();
  }, []);

  const { user } = useAuth();

  // Estados de Guardado de Simulación
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Paso actual del Progressive Disclosure (1: Valor y Monto, 2: Propiedad y Ubicación, 3: Ingresos y Resumen)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Estados del Simulador
  const [propertyValue, setPropertyValue] = useState<number>(200000);
  const [requestedAmount, setRequestedAmount] = useState<number>(70000);
  const [propertyType, setPropertyType] = useState<PropertyType>('casa');
  const [department, setDepartment] = useState<string>('Montevideo');
  const [legalStatus, setLegalStatus] = useState<LegalStatus>('libre_gravamenes');
  const [incomeType, setIncomeType] = useState<IncomeType>('dependiente');
  const [showNotarialBreakdown, setShowNotarialBreakdown] = useState<boolean>(false);

  // Cálculo dinámico utilizando el motor de reglas
  const capacityResult = calculateBorrowingCapacity(propertyValue, rules);
  const maxBorrowingCapacity = capacityResult.maxAmount;
  const maxLtvPercent = capacityResult.maxLtvPercentage;

  const currentLtv = propertyValue > 0 ? (requestedAmount / propertyValue) * 100 : 0;
  const isOverLtv = currentLtv > maxLtvPercent || requestedAmount > rules.maxAmount;

  // Estimación Notarial Transparente (Uruguay - Arancel AEU + Timbres + Certificados)
  const notarialFees = Math.round(requestedAmount * 0.02);
  const notarialIva = Math.round(notarialFees * 0.22);
  const registryCertificates = 180;
  const stampsAndFiling = 240;
  const totalEstimatedClosingCosts = notarialFees + notarialIva + registryCertificates + stampsAndFiling;

  const estimatedMonthlyPayment = Math.round((requestedAmount * 0.11) / 12);

  const handleSaveSimulation = async () => {
    const simData = {
      requestedAmount,
      currency: 'USD',
      propertyValue,
      termMonths: 36,
      propertyType,
      department,
      legalStatus,
      incomeType,
      repaymentMode: 'solo_intereses',
      monthlyPaymentEstimated: estimatedMonthlyPayment,
      rateAnnual: 11.0,
      ltvPercentage: currentLtv,
      closingCostsEstimated: totalEstimatedClosingCosts,
      organizationId: tenant.id,
    };

    if (user?.id) {
      // Usuario autenticado: guardar de inmediato en Supabase
      await clientSimulationService.saveSimulation(simData, user.id, tenant.id);
      setSavedSuccessToast(true);
    } else {
      // Usuario NO autenticado: guardar pendiente y abrir diálogo/flujo de login
      clientSimulationService.savePendingSimulation(simData);
      setAuthModalOpen(true);
    }
  };

  const handleFinishSimulation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sourceParam = isNova ? 'estudio_nova' : tenant.slug;
    navigate(`/solicitar?monto=${requestedAmount}&valor_propiedad=${propertyValue}&source=${sourceParam}`, {
      state: {
        propertyValue,
        requestedAmount,
        propertyType,
        department,
        legalStatus,
        incomeType,
        source: sourceParam,
        organizationId: tenant.id,
      },
    });
  };

  const propertyTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    casa: Home,
    apartamento: Building2,
    terreno: TreePine,
    local_comercial: Briefcase,
    campo: Layers,
  };

  return (
    <div className={`min-h-screen flex flex-col ${isWhiteLabel ? 'bg-white text-[#27384a]' : 'bg-slate-bg text-slate-text'}`}>
      <Navbar />

      <main className="flex-1 py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          
          {/* Header del simulador */}
          <div className="text-center space-y-3 mb-8">
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block ${
              isWhiteLabel
                ? 'text-[#173a5e] bg-[#173a5e]/10'
                : 'text-brand-green bg-brand-green-light'
            }`}>
              {isNova ? 'Estudio Nova · Cotizador' : 'Simulador online'}
            </span>
            <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isWhiteLabel ? 'font-serif text-[#173a5e]' : 'text-navy'}`}>
              Calculá tu capacidad de crédito
            </h1>
            <p className={`text-sm sm:text-base max-w-lg mx-auto ${isWhiteLabel ? 'text-[#718096]' : 'text-slate-muted'}`}>
              Ingresá el valor estimado de tu propiedad y conocé en segundos el monto al que podés acceder.
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="mb-6 bg-white rounded-xl p-3 border border-[#dfe5ea] shadow-xs flex items-center justify-between text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                currentStep === 1
                  ? isWhiteLabel ? 'bg-[#173a5e] text-white' : 'bg-navy text-white'
                  : 'text-slate-500 hover:text-navy'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                isWhiteLabel ? 'bg-[#f4b43b] text-[#102d49]' : 'bg-brand-green'
              }`}>
                1
              </span>
              <span>Monto y valor</span>
            </button>

            <span className="text-slate-300">→</span>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                currentStep === 2
                  ? isWhiteLabel ? 'bg-[#173a5e] text-white' : 'bg-navy text-white'
                  : 'text-slate-500 hover:text-navy'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                isWhiteLabel ? 'bg-[#f4b43b] text-[#102d49]' : 'bg-brand-green'
              }`}>
                2
              </span>
              <span>Propiedad</span>
            </button>

            <span className="text-slate-300">→</span>

            <button
              type="button"
              onClick={() => {
                if (!isOverLtv) setCurrentStep(3);
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                currentStep === 3
                  ? isWhiteLabel ? 'bg-[#173a5e] text-white' : 'bg-navy text-white'
                  : 'text-slate-500 hover:text-navy'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                isWhiteLabel ? 'bg-[#f4b43b] text-[#102d49]' : 'bg-brand-green'
              }`}>
                3
              </span>
              <span>Ingresos y resumen</span>
            </button>
          </div>

          <div className="bg-white rounded-card shadow-card border border-[#dfe5ea] p-6 sm:p-10 space-y-8 text-left">
            
            {/* ========================================================== */}
            {/* PASO 1: MONTO Y VALOR                                      */}
            {/* ========================================================== */}
            {currentStep === 1 && (
              <div className="space-y-7 animate-in fade-in">
                <div>
                  <h3 className={`text-lg font-bold ${isWhiteLabel ? 'font-serif text-[#173a5e]' : 'text-navy'}`}>
                    Paso 1: Estimación de valor y necesidad
                  </h3>
                  <p className="text-xs text-[#718096] mt-1">
                    Definí el valor estimado de mercado de tu propiedad y cuánto capital deseás solicitar.
                  </p>
                </div>

                {/* Pregunta 1: ¿Cuánto vale aproximadamente tu propiedad? */}
                <div>
                  <CurrencyInput
                    label="¿Cuánto vale aproximadamente tu propiedad?"
                    value={propertyValue}
                    onChange={(val) => {
                      setPropertyValue(val);
                      const newCapacity = calculateBorrowingCapacity(val, rules);
                      if (requestedAmount > newCapacity.maxAmount) {
                        setRequestedAmount(newCapacity.maxAmount);
                      }
                    }}
                    helperText="Valor de mercado estimativo en Dólares Estadounidenses (USD)."
                  />

                  {/* Banner de Capacidad Máxima Estimada */}
                  <div className={`mt-4 p-5 rounded-xl text-white border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isWhiteLabel
                      ? 'bg-gradient-to-r from-[#102d49] to-[#173a5e] border-white/10'
                      : 'bg-gradient-to-r from-navy to-navy-surface border-navy-border'
                  }`}>
                    <div>
                      <span className="text-xs text-slate-300 font-medium block">
                        Podrías acceder a hasta:
                      </span>
                      <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                        isWhiteLabel ? 'text-[#f4b43b]' : 'text-brand-green'
                      }`}>
                        USD {maxBorrowingCapacity.toLocaleString('es-UY')}
                      </div>
                    </div>
                    <div className="text-xs text-slate-300 sm:text-right border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                      <span className="font-semibold text-white block">
                        Hasta el {maxLtvPercent}% del valor
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Tope de referencia USD {rules.maxAmount.toLocaleString('es-UY')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pregunta 2: ¿Cuánto dinero necesitás? */}
                <div>
                  <CurrencyInput
                    label="¿Cuánto dinero necesitás solicitar?"
                    value={requestedAmount}
                    onChange={(val) => setRequestedAmount(val)}
                    error={
                      isOverLtv
                        ? `El monto supera el límite del ${maxLtvPercent}% (máx. USD ${maxBorrowingCapacity.toLocaleString('es-UY')})`
                        : undefined
                    }
                    helperText={`Representa el ${currentLtv.toFixed(1)}% del valor estimado de la garantía.`}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant={isWhiteLabel ? 'navy' : 'primary'}
                    size="lg"
                    className={`w-full sm:w-auto px-8 ${isWhiteLabel ? 'bg-[#173a5e] hover:bg-[#102d49] text-white uppercase tracking-wider font-bold' : ''}`}
                    disabled={isOverLtv}
                    onClick={() => setCurrentStep(2)}
                  >
                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* PASO 2: TIPO, UBICACIÓN Y SITUACIÓN LEGAL                  */}
            {/* ========================================================== */}
            {currentStep === 2 && (
              <div className="space-y-7 animate-in fade-in">
                <div>
                  <h3 className={`text-lg font-bold ${isWhiteLabel ? 'font-serif text-[#173a5e]' : 'text-navy'}`}>
                    Paso 2: Datos del inmueble
                  </h3>
                  <p className="text-xs text-[#718096] mt-1">
                    Detalles del tipo de propiedad y su ubicación en Uruguay.
                  </p>
                </div>

                {/* Tipo de Inmueble */}
                <div>
                  <label className="block text-sm font-semibold text-[#27384a] mb-2">
                    Tipo de propiedad
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(rules.acceptedPropertyTypes || ['casa', 'apartamento', 'terreno', 'local_comercial', 'campo']).map((type) => {
                      const Icon = propertyTypeIcons[type] || Home;
                      const isSelected = propertyType === type;
                      return (
                        <button
                          type="button"
                          key={type}
                          onClick={() => setPropertyType(type)}
                          className={`min-h-[46px] px-3 py-2.5 rounded-btn border text-xs font-semibold capitalize transition-all duration-150 flex items-center justify-center space-x-2 ${
                            isSelected
                              ? isWhiteLabel
                                ? 'border-[#173a5e] bg-[#173a5e]/10 text-[#173a5e] font-bold shadow-xs'
                                : 'border-brand-green bg-brand-green-light/60 text-brand-green-dark shadow-sm'
                              : 'border-[#dfe5ea] text-[#27384a] hover:border-slate-300 bg-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{type.replace('_', ' ')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Departamento */}
                <div>
                  <Select
                    label="Departamento donde se ubica el inmueble"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    options={(rules.acceptedDepartments || ['Montevideo', 'Canelones', 'Maldonado', 'Colonia']).map((dept) => ({
                      value: dept,
                      label: dept,
                    }))}
                  />
                </div>

                {/* Situación Legal */}
                <div>
                  <label className="block text-sm font-semibold text-[#27384a] mb-2">
                    Situación jurídica del inmueble
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'libre_gravamenes', label: 'Libre de gravámenes' },
                      { id: 'con_hipoteca_bancaria', label: 'Con hipoteca bancaria' },
                      { id: 'en_sucesion', label: 'En sucesión / Trámite' },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setLegalStatus(item.id as LegalStatus)}
                        className={`min-h-[44px] px-3 py-2 rounded-btn border text-xs font-semibold transition-all ${
                          legalStatus === item.id
                            ? isWhiteLabel
                              ? 'border-[#173a5e] bg-[#173a5e]/10 text-[#173a5e] font-bold shadow-xs'
                              : 'border-brand-green bg-brand-green-light/60 text-brand-green-dark shadow-xs'
                            : 'border-[#dfe5ea] text-[#27384a] bg-white hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver
                  </Button>
                  <Button
                    type="button"
                    variant={isWhiteLabel ? 'navy' : 'primary'}
                    size="lg"
                    className={isWhiteLabel ? 'bg-[#173a5e] hover:bg-[#102d49] text-white uppercase tracking-wider font-bold' : ''}
                    onClick={() => setCurrentStep(3)}
                  >
                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* PASO 3: INGRESOS Y RESUMEN FINAL                           */}
            {/* ========================================================== */}
            {currentStep === 3 && (
              <div className="space-y-7 animate-in fade-in">
                <div>
                  <h3 className={`text-lg font-bold ${isWhiteLabel ? 'font-serif text-[#173a5e]' : 'text-navy'}`}>
                    Paso 3: Ingresos y confirmación
                  </h3>
                  <p className="text-xs text-[#718096] mt-1">
                    Tipo de actividad y resumen preliminar de tu simulación.
                  </p>
                </div>

                {/* Tipo de Ingresos */}
                <div>
                  <label className="block text-sm font-semibold text-[#27384a] mb-2">
                    Tipo de actividad o ingresos principales
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'dependiente', label: 'Empleado' },
                      { id: 'independiente', label: 'Independiente' },
                      { id: 'jubilado', label: 'Jubilado' },
                      { id: 'rentista', label: 'Rentista' },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setIncomeType(item.id as IncomeType)}
                        className={`min-h-[44px] px-3 py-2 rounded-btn border text-xs font-semibold transition-all ${
                          incomeType === item.id
                            ? isWhiteLabel
                              ? 'border-[#173a5e] bg-[#173a5e]/10 text-[#173a5e] font-bold shadow-xs'
                              : 'border-brand-green bg-brand-green-light/60 text-brand-green-dark shadow-xs'
                            : 'border-[#dfe5ea] text-[#27384a] bg-white hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resumen Preliminar */}
                <div className="p-5 rounded-xl bg-[#f5f7f9] border border-[#dfe5ea] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#245f91]">
                    Resumen preliminar de simulación
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[#718096] block">Valor inmueble</span>
                      <strong className="text-[#173a5e] text-sm font-bold">
                        USD {propertyValue.toLocaleString('es-UY')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#718096] block">Monto solicitado</span>
                      <strong className={`text-sm font-bold ${isWhiteLabel ? 'text-[#173a5e]' : 'text-brand-green'}`}>
                        USD {requestedAmount.toLocaleString('es-UY')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#718096] block">Porcentaje financiado</span>
                      <strong className="text-[#173a5e] text-sm font-bold">
                        {currentLtv.toFixed(1)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#718096] block">Ubicación</span>
                      <strong className="text-[#173a5e] text-sm font-bold capitalize">
                        {department}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Desglose Interactivo de Costos y Gastos Notariales Estimados */}
                <div className="rounded-xl border border-[#dfe5ea] bg-white overflow-hidden transition-all shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowNotarialBreakdown(!showNotarialBreakdown)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isWhiteLabel ? 'bg-[#173a5e]/10 text-[#173a5e]' : 'bg-emerald-50 text-brand-green'
                      }`}>
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#173a5e] block">
                          Gastos Notariales e Inscripciones Estimadas (Uruguay)
                        </span>
                        <span className="text-[11px] text-[#718096]">
                          Aprox. USD {totalEstimatedClosingCosts.toLocaleString('es-UY')} (Desglose referencial transparente)
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 text-xs font-semibold ${
                      isWhiteLabel ? 'text-[#173a5e]' : 'text-brand-green'
                    }`}>
                      <span>{showNotarialBreakdown ? 'Ocultar' : 'Ver detalle'}</span>
                      {showNotarialBreakdown ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {showNotarialBreakdown && (
                    <div className="p-4 pt-0 border-t border-[#dfe5ea] bg-[#f5f7f9] space-y-2.5 text-xs animate-in fade-in">
                      <p className="text-[11px] text-[#718096] pt-2 leading-relaxed">
                        En Uruguay, los trámites de formalización hipotecaria requieren intervención notarial y registral ante la DGR. Los importes son orientativos:
                      </p>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between py-1 border-b border-[#dfe5ea]">
                          <span className="text-slate-600">Honorarios Notariales (Arancel AEU ~2%):</span>
                          <strong className="text-[#173a5e]">USD {notarialFees.toLocaleString('es-UY')}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#dfe5ea]">
                          <span className="text-slate-600">IVA Notarial (22%):</span>
                          <strong className="text-[#173a5e]">USD {notarialIva.toLocaleString('es-UY')}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#dfe5ea]">
                          <span className="text-slate-600">Certificados Registrales (Inmobiliaria / Personales):</span>
                          <strong className="text-[#173a5e]">USD {registryCertificates.toLocaleString('es-UY')}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#dfe5ea]">
                          <span className="text-slate-600">Timbres Profesionales e Inscripción Registral:</span>
                          <strong className="text-[#173a5e]">USD {stampsAndFiling.toLocaleString('es-UY')}</strong>
                        </div>
                        <div className="flex justify-between pt-1.5 font-bold text-[#173a5e]">
                          <span>Total Estimado de Cierre Notarial:</span>
                          <span className={isWhiteLabel ? 'text-[#173a5e] font-mono' : 'text-brand-green-dark font-mono'}>USD {totalEstimatedClosingCosts.toLocaleString('es-UY')}</span>
                        </div>
                      </div>

                      <span className="block text-[10px] text-slate-400 italic pt-1">
                        * Estos importes se abonan únicamente al momento de escriturar formalmente ante el escribano público designado.
                      </span>
                    </div>
                  )}
                </div>

                {/* Nota sobre Análisis de Crédito */}
                <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  isWhiteLabel ? 'bg-[#173a5e]/5 border-[#173a5e]/20' : 'bg-emerald-50/70 border-emerald-200/80'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isWhiteLabel ? 'text-[#245f91]' : 'text-brand-green'}`} />
                  <div className="text-xs text-[#27384a] leading-relaxed">
                    <strong className="text-[#173a5e]">Evaluación basada en el activo:</strong> La solicitud se evalúa principalmente en base a las características y solidez de la garantía inmobiliaria ofrecida.
                  </div>
                </div>

                {/* Toast de Éxito de Guardado */}
                {savedSuccessToast && (
                  <div className="p-4 bg-emerald-900 text-white rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between text-xs font-bold animate-in fade-in">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Simulación guardada en tu cuenta.</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => navigate('/mi-cuenta?tab=simulaciones')}
                        className="underline text-emerald-200 hover:text-white"
                      >
                        Ver mis simulaciones →
                      </button>
                      <button type="button" onClick={() => setSavedSuccessToast(false)} className="text-emerald-300 ml-2">✕</button>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setCurrentStep(2)}
                    className="w-full sm:w-auto"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver
                  </Button>

                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleSaveSimulation}
                      className="w-full sm:w-auto text-xs font-bold border-slate-300 hover:bg-slate-50 flex items-center justify-center !rounded-xl"
                    >
                      <Bookmark className="w-4 h-4 mr-1.5 text-slate-600" />
                      Guardar simulación
                    </Button>

                    <Button
                      type="button"
                      variant={isWhiteLabel ? 'navy' : 'primary'}
                      size="lg"
                      className={`w-full sm:w-auto shadow-md text-sm min-h-[46px] px-6 ${
                        isWhiteLabel ? 'bg-[#173a5e] hover:bg-[#102d49] text-white uppercase tracking-wider font-bold !rounded-xl' : '!rounded-xl'
                      }`}
                      disabled={isOverLtv}
                      onClick={() => handleFinishSimulation()}
                    >
                      Continuar solicitud <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal para solicitar Login o Registro al Guardar */}
            {authModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                        <Bookmark className="w-4 h-4 text-amber-700" />
                      </div>
                      <h3 className="text-base font-serif font-bold text-slate-900">
                        Guardar Simulación
                      </h3>
                    </div>
                    <button
                      onClick={() => setAuthModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Iniciá sesión para guardar esta simulación por <strong>USD {requestedAmount.toLocaleString('es-UY')}</strong> y consultarla o iniciar tu trámite cuando quieras.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Tus datos ya quedaron preservados; no tendrás que volver a completar el simulador.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={() => {
                        setAuthModalOpen(false);
                        navigate('/ingresar?action=save_simulation&redirect=simulador');
                      }}
                      className="!bg-[#102d49] text-white font-bold text-xs !rounded-xl"
                    >
                      Iniciar sesión para guardar →
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      fullWidth
                      onClick={() => {
                        setAuthModalOpen(false);
                        navigate('/registro?action=save_simulation&redirect=simulador');
                      }}
                      className="text-xs font-bold text-slate-700 hover:bg-slate-50 !rounded-xl"
                    >
                      Crear una cuenta gratis
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer Regulatorio */}
            <div className="pt-6 border-t border-slate-100 flex items-start space-x-3 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>
                  <strong>Aviso Importante:</strong> El resultado de este simulador es referencial, preliminar y no constituye una oferta vinculante ni aprobación de crédito.
                </p>
                <p>
                  Toda operación queda sujeta a la verificación formal de títulos de propiedad, valuación pericial del inmueble y análisis de las condiciones configuradas para esta financiación.
                </p>
              </div>
            </div>

          </div>

          {/* Sellos de Confianza y Seguridad */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className={`w-4 h-4 ${isWhiteLabel ? 'text-[#245f91]' : 'text-brand-green'}`} />
              <span>Datos 100% encriptados</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className={`w-4 h-4 ${isWhiteLabel ? 'text-[#245f91]' : 'text-brand-green'}`} />
              <span>Regulación legal uruguaya</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Info className={`w-4 h-4 ${isWhiteLabel ? 'text-[#245f91]' : 'text-brand-green'}`} />
              <span>Sin costos iniciales de tasación</span>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
