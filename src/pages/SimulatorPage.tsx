import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info, CheckCircle2, ShieldCheck, Home } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { calculateMaxLoan, PILOT_LENDER_CONFIG } from '../lib/pilotRules';
import { PropertyType, LegalStatus, IncomeType } from '../lib/types';

export const SimulatorPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados del Simulador con Progressive Disclosure
  const [propertyValue, setPropertyValue] = useState<number>(150000);
  const [requestedAmount, setRequestedAmount] = useState<number>(50000);
  const [propertyType, setPropertyType] = useState<PropertyType>('casa');
  const [department, setDepartment] = useState<string>('Montevideo');
  const [legalStatus, setLegalStatus] = useState<LegalStatus>('libre_gravamenes');
  const [incomeType, setIncomeType] = useState<IncomeType>('dependiente');

  // Cálculo dinámico utilizando el motor de reglas (no hardcodeado)
  const maxBorrowingCapacity = calculateMaxLoan(propertyValue, PILOT_LENDER_CONFIG);
  const currentLtv = propertyValue > 0 ? (requestedAmount / propertyValue) * 100 : 0;
  const isOverLtv = currentLtv > PILOT_LENDER_CONFIG.max_ltv || requestedAmount > PILOT_LENDER_CONFIG.max_loan;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    // Navegar al wizard de solicitud con los datos preliminares en el state
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
                    // Ajustar requested amount si supera el nuevo max
                    const newMax = calculateMaxLoan(val, PILOT_LENDER_CONFIG);
                    if (requestedAmount > newMax) setRequestedAmount(newMax);
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
                    <span className="font-semibold text-white block">Hasta el 40% del valor</span>
                    <span className="text-[11px] text-slate-400">Tope máximo USD {PILOT_LENDER_CONFIG.max_loan.toLocaleString('es-UY')}</span>
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
                      ? `El monto supera el límite del ${PILOT_LENDER_CONFIG.max_ltv}% (máx. USD ${maxBorrowingCapacity.toLocaleString('es-UY')})`
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
                  {(['casa', 'apartamento', 'local_comercial', 'terreno', 'campo', 'otro'] as PropertyType[]).map((type) => (
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
                  {[
                    'Montevideo',
                    'Canelones',
                    'Maldonado',
                    'Colonia',
                    'San José',
                    'Rocha',
                    'Salto',
                    'Paysandú',
                    'Lavalleja',
                    'Durazno',
                    'Soriano',
                    'Tacuarembó',
                    'Rivera',
                    'Artigas',
                    'Cerro Largo',
                    'Florida',
                    'Flores',
                    'Río Negro',
                    'Treinta y Tres'
                  ].map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pregunta 5: Situación jurídica declarada */}
              <div>
                <label className="block text-sm font-semibold text-slate-text mb-2">
                  5. Situación del inmueble
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'libre_gravamenes', label: 'Libre de gravámenes' },
                    { id: 'tiene_hipoteca', label: 'Tiene hipoteca previa' },
                    { id: 'sucesion_en_tramite', label: 'En sucesión / No sé' },
                  ].map((sit) => (
                    <button
                      type="button"
                      key={sit.id}
                      onClick={() => setLegalStatus(sit.id as LegalStatus)}
                      className={`min-h-[46px] px-3 py-2 rounded-btn border text-xs font-semibold transition-all duration-150 ${
                        legalStatus === sit.id
                          ? 'border-brand-green bg-brand-green-light/60 text-brand-green-dark shadow-sm'
                          : 'border-slate-border text-slate-text hover:border-slate-300 bg-white'
                      }`}
                    >
                      {sit.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pregunta 6: Tipo de Ingresos */}
              <div>
                <label className="block text-sm font-semibold text-slate-text mb-2">
                  6. Fuente de tus ingresos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'dependiente', label: 'Dependiente' },
                    { id: 'independiente', label: 'Independiente' },
                    { id: 'empresa', label: 'Empresa' },
                    { id: 'otro', label: 'Otros ingresos' },
                  ].map((inc) => (
                    <button
                      type="button"
                      key={inc.id}
                      onClick={() => setIncomeType(inc.id as IncomeType)}
                      className={`min-h-[46px] px-3 py-2 rounded-btn border text-xs font-semibold transition-all duration-150 ${
                        incomeType === inc.id
                          ? 'border-brand-green bg-brand-green-light/60 text-brand-green-dark shadow-sm'
                          : 'border-slate-border text-slate-text hover:border-slate-300 bg-white'
                      }`}
                    >
                      {inc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Continuar Solicitud */}
              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isOverLtv || requestedAmount <= 0}
                  className="shadow-md text-base"
                >
                  Continuar solicitud <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Disclaimer Legal Obligatorio (Regla 26) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-slate-muted leading-relaxed">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Aviso Importante:</strong> Los valores calculados son estimativos y no constituyen una oferta formal de crédito ni aprobación asegurada. La aprobación y las condiciones finales están sujetas al análisis exhaustivo de la solicitud, la tasación del inmueble, la documentación respaldatoria y las políticas crediticias del prestamista interviniente.
                </p>
              </div>

            </form>
          </div>

          {/* Sellos de Confianza debajo del simulador */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-center text-xs text-slate-muted">
            <div className="flex items-center justify-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>Privacidad 100% protegida</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green" />
              <span>Sin costos de simulación</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Info className="w-4 h-4 text-brand-green" />
              <span>Acompañamiento profesional</span>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
