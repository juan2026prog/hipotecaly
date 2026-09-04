import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Target, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';

export const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Sobre Nosotros | HIPOTECALY';
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-slate-50 via-white to-white text-left border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-green-light text-brand-green-dark border border-brand-green/20">
              <Shield className="w-3.5 h-3.5" />
              <span>NUESTRA IDENTIDAD & MISIÓN</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-navy tracking-tight leading-[1.12] max-w-4xl">
              Transformamos el acceso al crédito con garantía hipotecaria en Uruguay.
            </h1>

            <p className="text-base sm:text-xl text-slate-muted max-w-3xl leading-relaxed">
              HIPOTECALY nació para derribar las barreras burocráticas y la opacidad del crédito con garantía hipotecaria, uniendo tecnología financiera de vanguardia con acompañamiento notarial y técnico riguroso.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link to="/simulador">
                <Button variant="primary" size="lg" className="shadow-md font-bold">
                  Simular mi préstamo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/contacto">
                <Button variant="secondary" size="lg">
                  Contactar al equipo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pilares Institucionales */}
        <section className="py-16 md:py-24 bg-white text-left">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
                NUESTROS PILARES
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-navy tracking-tight">
                Principios que guían nuestra plataforma
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-bg p-8 rounded-card border border-slate-border shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy">Transparencia Radical</h3>
                <p className="text-sm text-slate-muted leading-relaxed">
                  Sin letras chicas ni comisiones ocultas. Cada solicitante y prestamista conoce los parámetros exactos, costos y condiciones antes de formalizar cualquier operación.
                </p>
              </div>

              <div className="bg-slate-bg p-8 rounded-card border border-slate-border shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy">Precisión Tecnológica</h3>
                <p className="text-sm text-slate-muted leading-relaxed">
                  Digitalizamos la originación, análisis de títulos, scoring paramétrico y matching crediticio, reduciendo semanas de trámite a pocos días hábiles.
                </p>
              </div>

              <div className="bg-slate-bg p-8 rounded-card border border-slate-border shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy">Acompañamiento Notarial</h3>
                <p className="text-sm text-slate-muted leading-relaxed">
                  La tecnología no reemplaza la seguridad jurídica: coordinamos peritajes e intervención notarial profesional en cada departamento del país.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Respaldo Institucional & Operativo */}
        <section className="py-16 md:py-20 bg-navy text-white text-left">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-green">
                INFRAESTRUCTURA & SEGURIDAD
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Infraestructura crediticia de nivel institucional
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Operamos con una arquitectura modular segura que cumple con los más altos estándares de protección de datos personales y confidencialidad financiera de la República Oriental del Uruguay.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
                  <span>Cifrado integral de documentos y expedientes hipotecarios.</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
                  <span>Coordinación directa con escribanos y peritos tasadores matriculados.</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
                  <span>Plataforma disponible tanto para personas como entidades financieras (SaaS).</span>
                </div>
              </div>
            </div>

            <div className="bg-navy-surface p-8 rounded-2xl border border-navy-border shadow-2xl space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-navy-border">
                <Building2 className="w-6 h-6 text-brand-green" />
                <div>
                  <h3 className="text-base font-bold text-white">Sede Central</h3>
                  <p className="text-xs text-slate-400">Montevideo, Uruguay</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Para consultas corporativas, alianzas con entidades financieras o estudios notariales, podés contactarnos directamente por nuestros canales institucionales.
              </p>
              <Link to="/contacto" className="block">
                <Button variant="primary" size="md" fullWidth>
                  Contactar al equipo corporativo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
