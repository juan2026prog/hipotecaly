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

export const SimulatorPage: React.FC = () => {
  const navigate = useNavigate();

  // Reglas crediticias activas desde DB / servicio único
  const [rules, setRules] = useState<MarketplaceRuleSet>(DEFAULT_PILOT_RULESET);

  useEffect(() => {
    // Carga de reglas desde PostgreSQL (lenders + lender_rules)
    getActiveMarketplaceRules().then((loadedRules) => {
      setRules(loadedRules);
    });

    // Suscripción a cambios dinámicos en tiempo real o tests
    const unsubscribe = subscribeToRuleChanges((updatedRules) => {
      setRules(updatedRules);
    });

    return () => unsubscribe();
  }, []);

  // Paso actual del Progressive Disclosure (1: Valor y Monto, 2: Propiedad y Ubicación, 3: Ingresos y Resumen)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Estados del Simulador
  const [propertyValue, setPropertyValue] = useState<number>(150000);
  const [requestedAmount, setRequestedAmount] = useState<number>(50000);
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
  const notarialFees = Math.round(requestedAmount * 0.02); // 2.0% arancel orientativo
  const notarialIva = Math.round(notarialFees * 0.22); // 22% IVA
  const registryCertificates = 180; // Certificados Registrales
  const stampsAndFiling = 240; // Timbres e inscripción registral
  const totalEstimatedClosingCosts = notarialFees + notarialIva + registryCertificates + stampsAndFiling;

  const handleFinishSimulation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate('/solicitar', {
      state: {
        propertyValue,
        requestedAmount,
        propertyType,
        department,
        legalStatus,
        incomeType,
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
    <div className="min-h-screen flex flex-col bg-slate-bg text-slate-text">
      <Navbar />

      <main className="flex-1 py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          
          {/* Header del simulador */}
          <div className="text-center space-y-3 mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-3 py-1 rounded-full inline-block">
              Simulador online
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Calculá tu capacidad de crédito
            </h1>
            <p className="text-slate-muted text-sm sm:text-base max-w-lg mx-auto">
              Ingresá el valor estimado de tu propiedad y conocé en segundos el monto al que podés acceder.
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="mb-6 bg-white rounded-xl p-3 border border-slate-border shadow-xs flex items-center justify-between text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                currentStep === 1
                  ? 'bg-navy text-white'
                  : 'text-slate-500 hover:text-navy'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center text-[11px] font-bold">
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
                  ? 'bg-navy text-white'
                  : 'text-slate-500 hover:text-navy'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center text-[11px] font-bold">
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
                  ? 'bg-navy text-white'
                  : 'text-slate-500 hover:text-navy'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              <span>Ingresos y resumen</span>
            </button>
          </div>

          <div className="bg-white rounded-card shadow-card border border-slate-border p-6 sm:p-10 space-y-8 text-left">
            
            {/* ========================================================== */}
            {/* PASO 1: MONTO Y VALOR                                      */}
            {/* ========================================================== */}
            {currentStep === 1 && (
              <div className="space-y-7 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-bold text-navy">
                    Paso 1: Estimación de valor y necesidad
                  </h3>
                  <p className="text-xs text-slate-muted mt-1">
                    Definí el valor estimado de mercado de tu propiedad y cuánto dinero necesitás.
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
                  <div className="mt-4 p-5 rounded-xl bg-gradient-to-r from-navy to-navy-surface text-white border border-navy-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-300 font-medium block">
                        Podrías acceder a hasta:
                      </span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-brand-green tracking-tight">
                        USD {maxBorrowingCapacity.toLocaleString('es-UY')}
                      </div>
                    </div>
                    <div className="text-xs text-slate-300 sm:text-right border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                      <span className="font-semibold text-white block">
                        Hasta el {maxLtvPercent}% del valor
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Tope máximo USD {rules.maxAmount.toLocaleString('es-UY')}
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
                    helperText={`LTV actual: ${currentLtv.toFixed(1)}% del valor estimado.`}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto px-8"
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
                  <h3 className="text-lg font-bold text-navy">
                    Paso 2: Datos del inmueble
                  </h3>
                  <p className="text-xs text-slate-muted mt-1">
                    Detalles del tipo de propiedad y su ubicación en Uruguay.
                  </p>
                </div>

                {/* Tipo de Inmueble */}
                <div>
                  <label className="block text-sm font-semibold text-slate-text mb-2">
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
                              ? 'border-brand-green bg-brand-green-light/60 text-brand-green-dark shadow-sm'
                              : 'border-slate-border text-slate-text hover:border-slate-300 bg-white'
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
                  <label className="block text-sm font-semibold text-slate-text mb-2">
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
                            ? 'border-brand-green bg-brand-green-light/60 text-brand-green-dark shadow-xs'
                            : 'border-slate-border text-slate-text bg-white hover:border-slate-300'
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
                    variant="primary"
                    size="lg"
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
                  <h3 className="text-lg font-bold text-navy">
                    Paso 3: Ingresos y confirmación
                  </h3>
                  <p className="text-xs text-slate-muted mt-1">
                    Tipo de actividad y resumen preliminar de tu simulación.
                  </p>
                </div>

                {/* Tipo de Ingresos */}
                <div>
                  <label className="block text-sm font-semibold text-slate-text mb-2">
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
                            ? 'border-brand-green bg-brand-green-light/60 text-brand-green-dark shadow-xs'
                            : 'border-slate-border text-slate-text bg-white hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resumen Preliminar */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Resumen preliminar de simulación
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Valor inmueble</span>
                      <strong className="text-navy text-sm font-bold">
                        USD {propertyValue.toLocaleString('es-UY')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Monto solicitado</span>
                      <strong className="text-brand-green text-sm font-bold">
                        USD {requestedAmount.toLocaleString('es-UY')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">LTV resultante</span>
                      <strong className="text-navy text-sm font-bold">
                        {currentLtv.toFixed(1)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Ubicación</span>
                      <strong className="text-navy text-sm font-bold capitalize">
                        {department}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Desglose Interactivo de Costos y Gastos Notariales Estimados */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowNotarialBreakdown(!showNotarialBreakdown)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-brand-green flex items-center justify-center shrink-0">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-navy block">
                          Gastos Notariales e Inscripciones Estimadas (Uruguay)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Aprox. USD {totalEstimatedClosingCosts.toLocaleString('es-UY')} (Desglose referencial transparente)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-semibold text-brand-green">
                      <span>{showNotarialBreakdown ? 'Ocultar' : 'Ver detalle'}</span>
                      {showNotarialBreakdown ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {showNotarialBreakdown && (
                    <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/60 space-y-2.5 text-xs animate-in fade-in">
                      <p className="text-[11px] text-slate-500 pt-2 leading-relaxed">
                        En Uruguay, los trámites de formalización hipotecaria requieren intervención notarial y registral ante la DGR. Los importes son orientativos:
                      </p>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-600">Honorarios Notariales (Arancel AEU ~2%):</span>
                          <strong className="text-navy">USD {notarialFees.toLocaleString('es-UY')}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-600">IVA Notarial (22%):</span>
                          <strong className="text-navy">USD {notarialIva.toLocaleString('es-UY')}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-600">Certificados Registrales (Inmobiliaria / Personales):</span>
                          <strong className="text-navy">USD {registryCertificates.toLocaleString('es-UY')}</strong>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200/60">
                          <span className="text-slate-600">Timbres Profesionales e Inscripción Registral:</span>
                          <strong className="text-navy">USD {stampsAndFiling.toLocaleString('es-UY')}</strong>
                        </div>
                        <div className="flex justify-between pt-1.5 font-bold text-navy">
                          <span>Total Estimado de Cierre Notarial:</span>
                          <span className="text-brand-green-dark">USD {totalEstimatedClosingCosts.toLocaleString('es-UY')}</span>
                        </div>
                      </div>

                      <span className="block text-[10px] text-slate-400 italic pt-1">
                        * Estos importes se abonan únicamente al momento de escriturar formalmente ante el escribano público designado.
                      </span>
                    </div>
                  )}
                </div>

                {/* Nota sobre Clearing en Piloto */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-navy">Flexibilidad en antecedentes:</strong> El prestamista del Marketplace admite solicitudes con historial en Clearing de Informes para análisis técnico individualizado.
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="shadow-md text-base min-h-[50px] px-8"
                    disabled={isOverLtv}
                    onClick={() => handleFinishSimulation()}
                  >
                    Continuar solicitud <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
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
                  Toda operación queda sujeta a la verificación formal de títulos de propiedad, valuación presencial o pericial del inmueble y validación de las políticas de riesgo crediticio del prestamista interviniente.
                </p>
              </div>
            </div>

          </div>

          {/* Sellos de Confianza y Seguridad */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>Datos 100% encriptados</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-green" />
              <span>Regulación legal uruguaya</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-brand-green" />
              <span>Sin costos iniciales de tasación</span>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
