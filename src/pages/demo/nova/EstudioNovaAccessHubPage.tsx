import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Globe,
  User,
  ShieldCheck,
  TrendingUp,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  Stamp,
} from 'lucide-react';
import { useTenant } from '../../../contexts/TenantContext';

export const EstudioNovaAccessHubPage: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const slug = tenantSlug || 'estudio-nova';
  const brandName = tenant.branding?.public_name || tenant.name || 'Estudio Nova';
  const primaryColor = tenant.branding?.primary_color || '#173a5e';

  useEffect(() => {
    document.title = 'HIPOTECALY — Demo · ' + brandName;
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = 'noindex, nofollow';
    return () => {
      if (metaRobots) {
        metaRobots.content = 'index, follow';
      }
    };
  }, [brandName]);

  const accessCards = [
    {
      id: 'home',
      org: brandName,
      title: 'Sitio público',
      badge: 'Front-Office',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Experiencia que ve una persona antes de iniciar una financiación.',
      path: '/demo/' + slug,
      icon: Globe,
      iconBg: 'bg-[#173a5e] text-white',
      ctaText: 'Ver Sitio Público',
    },
    {
      id: 'client',
      org: 'Cliente',
      title: 'Portal del solicitante',
      badge: 'Prestatario',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Seguimiento de solicitud, documentación y próximos pasos.',
      path: '/demo/' + slug + '/cliente',
      icon: User,
      iconBg: 'bg-blue-600 text-white',
      ctaText: 'Entrar al Portal',
    },
    {
      id: 'backoffice',
      org: 'Backoffice',
      title: 'Equipo ' + brandName,
      badge: 'Operativa',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Gestión de expedientes, clientes, propiedades, documentos y operaciones.',
      path: '/demo/' + slug + '/admin',
      icon: LayoutDashboard,
      iconBg: 'bg-indigo-700 text-white',
      ctaText: 'Abrir Backoffice',
    },
    {
      id: 'notary',
      org: 'Escribanía',
      title: 'Portal del Escribano',
      badge: 'Estudio Notarial',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      description: 'Estudio de títulos, checklist notarial, observaciones, DocFlow y Firma Digital.',
      path: '/demo/' + slug + '/notary',
      icon: Stamp,
      iconBg: 'bg-teal-700 text-white',
      ctaText: 'Ingresar a Escribanía',
    },
    {
      id: 'investor',
      org: 'Inversor',
      title: 'Red privada de inversores',
      badge: 'Módulo opcional',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Capa opcional para organizaciones que trabajan con inversores o prestamistas propios.',
      path: '/demo/' + slug + '/inversor',
      icon: TrendingUp,
      iconBg: 'bg-amber-600 text-white',
      ctaText: 'Ingresar a Inversores',
    },
    {
      id: 'superadmin',
      org: 'HIPOTECALY',
      title: 'Super Admin',
      badge: 'Control Central',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Administración central de tenants, módulos, integraciones y plataforma.',
      path: '/admin',
      icon: ShieldCheck,
      iconBg: 'bg-slate-900 text-white',
      ctaText: 'Consola Super Admin',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-serif font-black text-2xl text-white shadow-md border border-white/20"
              style={{ backgroundColor: primaryColor }}
            >
              <span>N</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight font-serif text-white">
                  HIPOTECALY
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-green text-slate-950">
                  Demo · {brandName}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Recorré la plataforma desde la perspectiva de cada usuario.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={'/demo/' + slug}
              className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Ver Sitio Público
            </Link>
            <Link
              to="/saas"
              className="inline-flex items-center text-xs font-semibold px-3.5 py-2 rounded-lg bg-brand-green hover:bg-brand-green/90 text-slate-950 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              HIPOTECALY SaaS
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-slate-900 tracking-tight">
            HIPOTECALY
          </h1>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-green">
            Demo · {brandName}
          </p>
          <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed pt-1">
            Recorré la plataforma desde la perspectiva de cada usuario.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-slate-300"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className={'w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ' + card.iconBg}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={'px-2.5 py-1 rounded-full text-[11px] font-bold border ' + card.badgeColor}>
                      {card.badge}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      {card.org}
                    </span>
                    <h2 className="text-xl font-bold font-serif text-slate-900 mt-1">
                      {card.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <Link
                    to={card.path}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#173a5e] hover:bg-[#102d49] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm group-hover:shadow"
                    style={{ backgroundColor: card.id === 'home' || card.id === 'backoffice' ? primaryColor : undefined }}
                  >
                    <span>{card.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <div className="text-[11px] text-center text-slate-400 font-mono mt-2 truncate">
                    {card.path}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        HIPOTECALY · Demostración Oficial para {brandName}
      </footer>
    </div>
  );
};
