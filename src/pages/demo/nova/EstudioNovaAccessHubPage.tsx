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
  Layers,
  Building2,
} from 'lucide-react';

export const EstudioNovaAccessHubPage: React.FC = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug || 'estudio-nova';

  useEffect(() => {
    document.title = 'Hub de Demostración & Accesos — Estudio Nova | HIPOTECALY';
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
  }, []);

  const accessCards = [
    {
      id: 'home',
      title: 'Sitio Web Público Nova',
      category: 'Front-Office White Label',
      badge: 'Público / Consumidor',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Página institucional 100% personalizada con simulador de préstamos paramétrico, tipos de garantía y captura de leads.',
      path: '/demo/' + slug,
      icon: Globe,
      iconBg: 'bg-[#173a5e] text-white',
      bullets: [
        'Branding visual propio (colores, logo, tipografía)',
        'Simulador en vivo conectado a reglas de originación',
        'Flujo de solicitud guiada /demo/' + slug + '/solicitar',
      ],
      ctaText: 'Ver Sitio Público',
    },
    {
      id: 'client',
      title: 'Portal de Clientes',
      category: 'Autogestión del Solicitante',
      badge: 'Rol: Borrower',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Espacio protegido para el prestatario. Permite seguir el estado del expediente, subir documentación requerida y firmar.',
      path: '/demo/' + slug + '/cliente',
      icon: User,
      iconBg: 'bg-blue-600 text-white',
      bullets: [
        'Expediente digital y checklist documental',
        'Seguimiento en tiempo real de etapas notariales',
        'Descarga de liquidaciones y constancias',
      ],
      ctaText: 'Entrar al Portal Cliente',
    },
    {
      id: 'backoffice',
      title: 'Backoffice Nova',
      category: 'Operativa & Administración',
      badge: 'Rol: Tenant Admin / Analyst',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Consola de gestión integral de solicitudes, legajos de propiedades, evaluación de riesgo, tareas y configuración de reglas.',
      path: '/demo/' + slug + '/admin',
      icon: LayoutDashboard,
      iconBg: 'bg-indigo-700 text-white',
      bullets: [
        'Pipeline de solicitudes con scoring y estados',
        'Gestión de legajos de propiedades y tasaciones',
        'Configuración de tasas, LTV y comisiones del tenant',
      ],
      ctaText: 'Abrir Backoffice Nova',
    },
    {
      id: 'investor',
      title: 'Red de Inversores',
      category: 'Marketplace Privado',
      badge: 'Rol: Lender / Inversor',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Módulo de fondeo donde inversores y financieras privadas revisan oportunidades colateralizadas pre-aprobadas.',
      path: '/demo/' + slug + '/inversor',
      icon: TrendingUp,
      iconBg: 'bg-amber-600 text-white',
      bullets: [
        'Oportunidades con LTV, rentabilidad y garantía',
        'Envío de posturas y ofertas de fondeo',
        'Monitoreo de cartera y cobranzas',
      ],
      ctaText: 'Ingresar a Red de Inversores',
    },
    {
      id: 'superadmin',
      title: 'Super Admin Hipotecaly',
      category: 'Consola Global SaaS',
      badge: 'Rol: Super Admin Global',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Panel maestro de infraestructura SaaS. Gestión multi-inquilino, provisión de tenants, feature flags y auditoría global.',
      path: '/admin',
      icon: ShieldCheck,
      iconBg: 'bg-slate-900 text-white',
      bullets: [
        'Directorio de organizaciones y tenants activos',
        'Activación modular y feature flags por tenant',
        'Métricas globales de volumen y seguridad',
      ],
      ctaText: 'Consola Super Admin',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-[#173a5e] border border-white/20 flex items-center justify-center font-serif font-black text-2xl text-white shadow-md">
              <span>N</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight font-serif text-white">
                  ESTUDIO NOVA
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                  Demo Oficial
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Centro de demostración comercial y mapeo de accesos de la arquitectura SaaS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={'/demo/' + slug}
              className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Ver Home Nova
            </Link>
            <Link
              to="/saas"
              className="inline-flex items-center text-xs font-semibold px-4 py-2 rounded-lg bg-brand-green hover:bg-brand-green/90 text-slate-950 transition-colors shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              HIPOTECALY SaaS B2B
            </Link>
          </div>
        </div>
      </header>
      <section className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-[#173a5e]" />
            <span>Arquitectura Multi-Portal & White Label</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-slate-900 tracking-tight">
            Hub de Accesos de la Plataforma
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Explorá cada portal con su rol y permisos correspondientes. La arquitectura aísla la experiencia de prestatarios, operadores, inversores y administración general en un único core multi-tenant.
          </p>
        </div>
      </section>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-slate-300">
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
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      {card.category}
                    </span>
                    <h2 className="text-xl font-bold font-serif text-slate-900 mt-1">
                      {card.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <ul className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-700">
                    {card.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-[#173a5e] font-bold mr-2">✓</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <Link
                    to={card.path}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#173a5e] hover:bg-[#102d49] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm group-hover:shadow">
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
        <section className="mt-12 bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="w-5 h-5 text-[#173a5e]" />
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Resumen de Rutas y Reglas del Sistema
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">1. Simulación & Solicitud</span>
              <p className="text-slate-600">
                Públicas sin autenticación. Resuelven automáticamente los parámetros y límites del tenant activo.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">2. Protección de Rutas</span>
              <p className="text-slate-600">
                Si un usuario desautenticado entra directo a un portal privado, se redirige a login preservando el tenant.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">3. Red de Inversores</span>
              <p className="text-slate-600">
                Verifica el flag investor_portal_enabled antes de admitir posturas de fondeo.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">4. Super Admin</span>
              <p className="text-slate-600">
                Aislado en /admin con layout independiente sin mezclar con backoffices de clientes.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        HIPOTECALY White Label Engine · Demostración Oficial para Estudio Nova
      </footer>
    </div>
  );
};
