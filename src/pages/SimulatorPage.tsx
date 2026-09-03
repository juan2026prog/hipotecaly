import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info, CheckCircle2, ShieldCheck, Home } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { CurrencyInput } from '../components/ui/CurrencyInput';
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

  // Estados del Simulador con Progressive Disclosure
  const [propertyValue, setPropertyValue] = useState<number>(150000);
  const [requestedAmount, setRequestedAmount] = useState<number>(50000);
  const [propertyType, setPropertyType] = useState<PropertyType>('casa');
  const [department, setDepartment] = useState<string>('Montevideo');
  const [legalStatus, setLegalStatus] = useState<LegalStatus>('libre_gravamenes');
  const [incomeType, setIncomeType] = useState<IncomeType>('dependiente');

  // Cálculo dinámico utilizando el motor de reglas (no hardcodeado)
  const capacityResult = calculateBorrowingCapacity(propertyValue, rules);
  const maxBorrowingCapacity = capacityResult.maxAmount;
  const maxLtvPercent = capacityResult.maxLtvPercentage;

  const currentLtv = propertyValue > 0 ? (requestedAmount / propertyValue) * 100 : 0;
  const isOverLtv = currentLtv > maxLtvPercent || requestedAmount > rules.maxAmount;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-bg">
      <Navbar />

      <main className="flex-1 py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          
          {/* Header del simulador */}
          <div className="text-center space-y-3 mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-green bg-brand-green-light px-3 py-1 rounded-full inline-block">
              Simulador Online
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
              Calculá tu capacidad de crédito
            </h1>
            <p className="text-slate-muted text-sm sm:text-base max-w-lg mx-auto">
              Ingresá el valor aproximado de tu propiedad y conocé de forma instantánea el monto estimativo al que podrías acceder.
            </p>
          </div>

          <div className="bg-white rounded-card shadow-card border border-slate-border p-6 sm:p-10 space-y-8 text-left">
            <form onSubmit={handleContinue} className="space-y-7">
              
              {/* Pregunta 1: ¿Cuánto vale aproximadamente tu propiedad? */}
              <div>
                <CurrencyInput
                  label="1. ¿Cuánto vale aproximadamente tu propiedad?"
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
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-navy to-navy-surface text-white border border-navy-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

              {/* Pregunta 2: ¿Cuánto dinero necesitás solicitar? */}
              <div>
                <CurrencyInput
                  label="2. ¿Cuánto dinero necesitás solicitar?"
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

              {/* Pregunta 3: Tipo de Inmueble */}
              <div>
                <label className="block text-sm font-semibold text-slate-text mb-2">
                  3. Tipo de propiedad
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(rules.acceptedPropertyTypes || ['casa', 'apartamento', 'terreno', 'local_comercial', 'campo']).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setPropertyType(type)}
                      className={`min-h-[46px] px-3 py-2 rounded-btn border text-xs font-semibold capitalize transition-all duration-150 flex items-center justify-center space-x-1.5 ${
                        propertyType === type
                          ? 'border-brand-green bg-brand-green-light/60 text-brand-green-dark shadow-sm'
                          : 'border-slate-border text-slate-text hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>{type.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pregunta 4: Departamento en Uruguay */}
              <div>
                <label htmlFor="dept" className="block text-sm font-semibold text-slate-text mb-1.5">
                  4. Departamento donde se ubica el inmueble
                </label>
                <select
                  id="dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full min-h-[48px] px-4 rounded-btn border border-slate-border bg-white text-slate-text font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  {(rules.acceptedDepartments || ['Montevideo', 'Canelones', 'Maldonado', 'Colonia']).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pregunta 5: Situación Legal del Inmueble */}
              <div>
                <label className="block text-sm font-semibold text-slate-text mb-2">
                  5. Situación jurídica del inmueble
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
                          ? 'border-brand-green bg-brand-green-light/60 text-brand-green-dark'
                          : 'border-slate-border text-slate-text bg-white hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pregunta 6: Situación de Ingresos */}
              <div>
                <label className="block text-sm font-semibold text-slate-text mb-2">
                  6. Tipo de actividad o ingresos principales
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
                          ? 'border-brand-green bg-brand-green-light/60 text-brand-green-dark'
                          : 'border-slate-border text-slate-text bg-white hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nota sobre Clearing en Piloto */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-navy">Flexibilidad en antecedentes:</strong> El prestamista del Marketplace admite solicitudes con historial en Clearing de Informes para análisis técnico individualizado.
                </div>
              </div>

              {/* Botón de envío */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full shadow-md text-base min-h-[50px]"
                  disabled={isOverLtv}
                >
                  Continuar solicitud <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>

            {/* Disclaimer Regulatorio y Legal Obligatorio */}
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
