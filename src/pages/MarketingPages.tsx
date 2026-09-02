import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { SaaSNavbar } from '../components/layout/SaaSNavbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';

// ----------------------------------------------------------------------
// /como-funciona
// ----------------------------------------------------------------------
export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 py-12 md:py-20 max-w-5xl mx-auto px-4 sm:px-6 text-left">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider bg-brand-green-light px-3 py-1 rounded-full">
            Proceso Transparente
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Cómo funciona HIPOTECALY
          </h1>
          <p className="text-slate-muted text-base">
            Un proceso ágil y ordenado, digital desde el comienzo y formalizado con escribano público.
          </p>
        </div>

        <div className="space-y-8">
          {[
            {
              step: '1',
              title: 'Completá tu solicitud digital',
              desc: 'Ingresá a nuestro simulador y completá los datos básicos del inmueble y el monto que necesitás. Podés guardar tu solicitud como borrador y continuarla en cualquier momento.',
            },
            {
              step: '2',
              title: 'Análisis preliminar de la propiedad',
              desc: 'Revisamos las características declaradas de tu inmueble y cotejamos parámetros de mercado. En esta etapa no revelamos tu identidad personal a los prestamistas.',
            },
            {
              step: '3',
              title: 'Búsqueda de propuestas crediticias',
              desc: 'Nuestro motor evalúa las reglas de los prestamistas habilitados para encontrar opciones compatibles con tu necesidad y LTV (hasta el 40% del valor).',
            },
            {
              step: '4',
              title: 'Presentación de propuesta y formalización legal',
              desc: 'Si contás con una propuesta viable y decidís avanzar, coordinamos la actuación notarial con el escribano para la titulación e hipoteca definitiva.',
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start space-x-5 p-6 rounded-2xl bg-slate-50 border border-slate-border">
              <div className="w-12 h-12 rounded-xl bg-brand-green text-white font-extrabold flex items-center justify-center text-lg shrink-0 shadow-sm">
                {item.step}
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy">{item.title}</h3>
                <p className="text-slate-muted text-sm leading-relaxed mt-1.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/simulador">
            <Button variant="primary" size="lg" className="px-8">
              Simular mi préstamo ahora <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ----------------------------------------------------------------------
// /preguntas-frecuentes
// ----------------------------------------------------------------------
export const FaqPage: React.FC = () => {
  const faqs = [
    {
      q: '¿Qué es un préstamo con garantía hipotecaria?',
      a: 'Es una operación crediticia donde se ofrece un inmueble propio como respaldo del cumplimiento del pago, lo que permite acceder a montos más elevados y plazos de hasta 5 años.',
    },
    {
      q: '¿HIPOTECALY es el prestamista?',
      a: 'No. HIPOTECALY es la plataforma tecnológica y de intermediación que analiza, organiza y conecta tu solicitud con prestamistas calificados, protegiendo tus datos en todo momento.',
    },
    {
      q: '¿Hasta qué porcentaje del valor de la propiedad puedo solicitar?',
      a: 'El LTV (Loan to Value) máximo para el prestamista piloto es del 40% del valor de tasación preliminar, con un tope de hasta USD 200.000.',
    },
    {
      q: '¿Puedo solicitar si estoy en el Clearing de Informes?',
      a: 'Sí, el prestamista piloto acepta evaluar personas que figuren en Clearing, ya que el respaldo principal es la garantía inmobiliaria.',
    },
    {
      q: '¿Qué costos están involucrados?',
      a: 'Los costos notariales, registrales y de tasación son a cargo del solicitante y se coordinan con total transparencia antes de la firma de la hipoteca.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 text-left">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider bg-brand-green-light px-3 py-1 rounded-full">
            Respuestas Claras
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Preguntas Frecuentes
          </h1>
          <p className="text-slate-muted text-base">
            Todo lo que necesitás saber sobre cómo funciona el proceso en HIPOTECALY.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 rounded-xl border border-slate-border bg-slate-50/60">
              <h3 className="text-base font-bold text-navy flex items-start space-x-3">
                <HelpCircle className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-sm text-slate-muted leading-relaxed mt-2.5 pl-8">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ----------------------------------------------------------------------
// /plataforma/precios (Regla 63 - Sin inventar precios)
// ----------------------------------------------------------------------
export const SaaSPricingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-bg">
      <SaaSNavbar />
      <main className="flex-1 py-12 md:py-20 max-w-6xl mx-auto px-4 sm:px-6 text-left">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider bg-brand-green-light px-3 py-1 rounded-full">
            Planes y Soluciones
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Plataforma escalable para cada tamaño de operación
          </h1>
          <p className="text-slate-muted text-base">
            Elegí la modalidad que mejor se adapte al volumen de tu estudio, financiera o empresa.
          </p>
        </div>

        {/* Estructura de 3 planes según Regla 63 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Plan Profesional */}
          <div className="bg-white rounded-card p-7 border border-slate-border shadow-card flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Para Estudios</span>
              <h3 className="text-2xl font-extrabold text-navy mt-1">Plan Profesional</h3>
              <p className="text-xs text-slate-muted mt-2">
                Ideal para estudios jurídicos, contables o tasadores que gestionan solicitudes con sus clientes.
              </p>

              <div className="my-6 py-4 border-y border-slate-100">
                <span className="text-sm font-bold text-navy block">Propuesta a medida</span>
                <span className="text-xs text-slate-400">Facturación mensual o anual según volumen</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Hasta 3 usuarios operativos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Gestión completa de expedientes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Checklist y repositorio documental</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link to="/contacto?plan=profesional">
                <Button variant="secondary" size="md" fullWidth>
                  Solicitar propuesta
                </Button>
              </Link>
            </div>
          </div>

          {/* Plan Business */}
          <div className="bg-white rounded-card p-7 border-2 border-brand-green shadow-card relative flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-green text-white text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full">
              Más elegido
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green">Para Financieras y Equipos</span>
              <h3 className="text-2xl font-extrabold text-navy mt-1">Plan Business</h3>
              <p className="text-xs text-slate-muted mt-2">
                Para empresas de crédito y mesas de inversión con múltiples operadores y analistas.
              </p>

              <div className="my-6 py-4 border-y border-slate-100">
                <span className="text-sm font-bold text-navy block">Propuesta a medida</span>
                <span className="text-xs text-slate-400">Escalamiento según requerimientos</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Usuarios y analistas ilimitados</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Motor de reglas y scoring propio</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Trazabilidad de auditoría y activity feed</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Módulo de valuaciones preliminares</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link to="/contacto?plan=business">
                <Button variant="primary" size="md" fullWidth>
                  Solicitar propuesta
                </Button>
              </Link>
            </div>
          </div>

          {/* Plan White Label */}
          <div className="bg-navy text-white rounded-card p-7 border border-navy-border shadow-floating flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green">Marca Propia</span>
              <h3 className="text-2xl font-extrabold text-white mt-1">White Label</h3>
              <p className="text-xs text-slate-300 mt-2">
                Tu logotipo, colores corporativos, dominio personalizado y portal de clientes exclusivo.
              </p>

              <div className="my-6 py-4 border-y border-navy-border/60">
                <span className="text-sm font-bold text-brand-green block">Infraestructura Dedicada</span>
                <span className="text-xs text-slate-400">Personalización institucional integral</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Dominio propio (ej. prestamos.tumarca.uy)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>100% White-Label sin mención a terceros</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Aislamiento estricto de base de datos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                  <span>Soporte prioritario y SLA corporativo</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link to="/contacto?plan=whitelabel">
                <Button variant="primary" size="md" fullWidth>
                  Solicitar propuesta White Label
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

// ----------------------------------------------------------------------
// /contacto
// ----------------------------------------------------------------------
export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 py-12 md:py-20 max-w-3xl mx-auto px-4 sm:px-6 text-left">
        <div className="text-center space-y-3 mb-10">
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider bg-brand-green-light px-3 py-1 rounded-full">
            Contacto Directo
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Conversá con nuestro equipo
          </h1>
          <p className="text-slate-muted text-sm sm:text-base">
            Dejanos tu consulta o coordiná una reunión para conocer la plataforma.
          </p>
        </div>

        {submitted ? (
          <div className="bg-brand-green-light/40 border border-brand-green/30 rounded-2xl p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-brand-green mx-auto" />
            <h3 className="text-xl font-bold text-navy">Mensaje recibido</h3>
            <p className="text-slate-muted text-sm max-w-md mx-auto">
              Muchas gracias por comunicarte con HIPOTECALY. Un asesor se pondrá en contacto contigo a la brevedad.
            </p>
            <div className="pt-4">
              <Link to="/">
                <Button variant="primary" size="md">Volver al inicio</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="bg-white rounded-card p-6 sm:p-8 border border-slate-border shadow-card space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-text mb-1">Nombre completo</label>
              <input
                required
                type="text"
                placeholder="Juan Pérez"
                className="w-full min-h-[48px] px-4 rounded-btn border border-slate-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-text mb-1">Email de contacto</label>
              <input
                required
                type="email"
                placeholder="juan@estudio.com.uy"
                className="w-full min-h-[48px] px-4 rounded-btn border border-slate-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-text mb-1">Empresa / Estudio / Particular</label>
              <input
                type="text"
                placeholder="Estudio Jurídico Pérez & Asoc."
                className="w-full min-h-[48px] px-4 rounded-btn border border-slate-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-text mb-1">Mensaje o consulta</label>
              <textarea
                rows={4}
                required
                placeholder="Quisiera conocer más sobre las condiciones del préstamo o solicitar una demo del sistema SaaS..."
                className="w-full p-4 rounded-btn border border-slate-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" fullWidth className="mt-2">
              Enviar consulta
            </Button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
};
