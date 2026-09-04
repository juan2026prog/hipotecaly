// ==============================================================================
// HIPOTECALY: Páginas Legales e Institucionales (/terminos, /privacidad, /seguridad)
// Conforme al Marco Regulatorio de la República Oriental del Uruguay (Ley N° 18.331)
// ==============================================================================

import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ShieldCheck, FileText, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

// ----------------------------------------------------------------------
// 1. TÉRMINOS DEL SERVICIO (/terminos)
// ----------------------------------------------------------------------
export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <Navbar />
      <main className="flex-1 py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 text-left">
        {/* Header */}
        <div className="space-y-3 border-b border-slate-border pb-8 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-green-light text-brand-green-dark">
            <FileText className="w-3.5 h-3.5" />
            <span>Marco Regulatorio y Contractual</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Términos y Condiciones del Servicio
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted">
            Última actualización: Septiembre de 2026 · República Oriental del Uruguay
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-600">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">1. Naturaleza de la Plataforma</h2>
            <p>
              HIPOTECALY es una plataforma tecnológica de intermediación digital y software como servicio (SaaS)
              diseñada para facilitar la originación, estructuración, análisis preliminar y gestión de operaciones
              de crédito con garantía hipotecaria en el territorio de la República Oriental del Uruguay.
            </p>
            <p>
              HIPOTECALY <strong>no es una entidad de intermediación financiera</strong> en los términos de la Ley
              N° 15.322, no capta depósitos del público ni actúa como banco comercial. Toda operación de crédito es
              acordada libre y privadamente entre solicitantes propietarios y prestamistas privados, instituciones o
              financieras independientes, instrumentándose mediante escritura pública ante Escribano Público.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">2. Solicitudes y Documentación</h2>
            <p>
              El solicitante garantiza la veracidad, exactitud y vigencia de la información y documentación aportada a
              través del portal, incluyendo títulos de propiedad, cédulas catastrales, certificados registrales y
              documentos de identidad. La presentación de una solicitud no constituye obligación de otorgamiento de
              crédito por parte de HIPOTECALY ni de los prestamistas asociados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">3. Condiciones Crediticias y Simulador</h2>
            <p>
              Los cálculos provistos en los simuladores web de HIPOTECALY y de los tenants de Marca Blanca (White-Label)
              tienen carácter estimativo y preliminar. Las tasas de interés definitivas, montos aprobados, aranceles
              notariales de escrituración y plazos de amortización quedarán exclusivamente estipulados en la oferta formal
              y en la correspondiente escritura de hipoteca.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">4. Cláusula de Secreto Profesional y Notarial</h2>
            <p>
              Las consultas jurídicas y notariales inherentes al análisis de títulos son ejecutadas por profesionales
              habilitados por la Suprema Corte de Justicia y la Asociación de Escribanos del Uruguay, rigiéndose bajo el
              más estricto deber de confidencialidad y reserva notarial.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">5. Jurisdicción y Ley Aplicable</h2>
            <p>
              Estos Términos se rigen e interpretan de acuerdo con las leyes de la República Oriental del Uruguay.
              Cualquier controversia derivada de la utilización de la plataforma será sometida a los Tribunales de la ciudad
              de Montevideo, Uruguay.
            </p>
          </section>
        </div>

        <div className="pt-10 border-t border-slate-border mt-10">
          <Link to="/">
            <Button variant="secondary" size="md">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. POLÍTICA DE PRIVACIDAD (/privacidad)
// ----------------------------------------------------------------------
export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <Navbar />
      <main className="flex-1 py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 text-left">
        {/* Header */}
        <div className="space-y-3 border-b border-slate-border pb-8 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-green-light text-brand-green-dark">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Protección de Datos Personales</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Política de Privacidad
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted">
            Conforme a la Ley N° 18.331 de Protección de Datos Personales y Acción de Habeas Data de Uruguay.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-600">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">1. Compromiso de Confidencialidad</h2>
            <p>
              HIPOTECALY garantiza el tratamiento confidencial y seguro de todos los datos personales y crediticios
              proporcionados por usuarios solicitantes, inversores y operadores del sistema, en estricto cumplimiento de la
              Ley N° 18.331 y decretos reglamentarios vigentes en Uruguay.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">2. Información que Recopilamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Datos Identificatorios:</strong> Nombre completo, documento de identidad (Cédula de Identidad o RUT), teléfono y correo electrónico.</li>
              <li><strong>Datos Patrimoniales e Inmobiliarios:</strong> Padrón catastral, departamento, localidad, superficie, gravámenes previos y fotografías de la propiedad ofrecida en garantía.</li>
              <li><strong>Datos Financieros:</strong> Monto requerido, plazos, destino de los fondos e ingresos estimados.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">3. Finalidad del Tratamiento</h2>
            <p>
              Los datos se recopilan con el propósito exclusivo de:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Evaluar la viabilidad preliminar de la operación crediticia.</li>
              <li>Generar la coincidencia (matching) confidencial con prestamistas calificados.</li>
              <li>Proveer al escribano interviniente los elementos para el estudio de títulos.</li>
              <li>Alimentar los modelos analíticos y de tasación mediante datos previamente anonimizados.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">4. No Comercialización de Datos</h2>
            <p>
              HIPOTECALY <strong>bajo ninguna circunstancia vende, cede ni comercializa</strong> bases de datos personales
              a terceros para fines publicitarios ni de mercadotecnia ajena al servicio hipotecario solicitado.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">5. Derechos del Titular (ARCO)</h2>
            <p>
              El titular de los datos puede ejercer en cualquier momento sus derechos de acceso, rectificación, actualización,
              inclusión o supresión de sus datos personales enviando una solicitud a <code>privacidad@hipotecaly.uy</code>.
            </p>
          </section>
        </div>

        <div className="pt-10 border-t border-slate-border mt-10">
          <Link to="/">
            <Button variant="secondary" size="md">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. SEGURIDAD DE LA INFORMACIÓN (/seguridad)
// ----------------------------------------------------------------------
export const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <Navbar />
      <main className="flex-1 py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 text-left">
        {/* Header */}
        <div className="space-y-3 border-b border-slate-border pb-8 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-navy text-brand-green">
            <Lock className="w-3.5 h-3.5" />
            <span>Infraestructura Segura & Cifrado</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Seguridad y Blindaje de la Información
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted">
            Arquitectura de aislamiento multi-tenant, cifrado de extremo a extremo y gobernanza criptográfica.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-slate-bg p-5 rounded-2xl border border-slate-border space-y-2">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy">Cifrado de Reposo y Tránsito</h3>
            <p className="text-xs text-slate-500">
              Protocolo TLS 1.3 en todas las conexiones y cifrado AES-256 en almacenamiento.
            </p>
          </div>

          <div className="bg-slate-bg p-5 rounded-2xl border border-slate-border space-y-2">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy">Aislamiento RLS en PostgreSQL</h3>
            <p className="text-xs text-slate-500">
              Políticas de Row Level Security garantizan que cada organización solo accede a sus propios datos.
            </p>
          </div>

          <div className="bg-slate-bg p-5 rounded-2xl border border-slate-border space-y-2">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy">Supabase Vault AEAD</h3>
            <p className="text-xs text-slate-500">
              Gestión de secretos criptográficos en bóveda segura sin exposición al cliente frontend.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-600">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">1. Almacenamiento Privado de Documentación Sensible</h2>
            <p>
              Los títulos de propiedad, estados contables, recibos de ingresos y cédulas de identidad se almacenan en
              buckets privados de Supabase Storage con acceso estrictamente restringido mediante URLs firmadas temporales
              con expiración automática. No existen enlaces públicos permanentes a documentos sensibles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">2. Sanitización Estricta de Inteligencia Artificial</h2>
            <p>
              El motor de Inteligencia Artificial (HIPOTECALY AI CORE) incorpora un pipeline de sanitización automática
              que elimina números de Cédula de Identidad, nombres de personas físicas, teléfonos y datos sensibles antes
              de almacenar patrones en la memoria vectorial global compartida.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy">3. Pistas de Auditoría Inmutables</h2>
            <p>
              Toda acción crítica ejecutada en el sistema (cambio de estado de expediente, modificación de límites crediticios,
              acceso a documentación o emisión de ofertas) se registra en tablas de auditoría inmutables protegidas por triggers
              anti-manipulación a nivel de base de datos.
            </p>
          </section>
        </div>

        <div className="pt-10 border-t border-slate-border mt-10">
          <Link to="/">
            <Button variant="secondary" size="md">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};
