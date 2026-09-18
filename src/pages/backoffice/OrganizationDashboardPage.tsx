import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2, Building2, CheckSquare, Compass, ExternalLink, FileCheck, FileText, Globe, LayoutDashboard, MessageSquare, Palette, Settings, ShieldCheck, Sparkles, UserCheck, Users } from 'lucide-react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { useTenant } from '../../contexts/TenantContext';
import { getTenantModules, DEFAULT_MODULES_MAP } from '../../lib/tenantModulesService';
import { getBackofficeMetrics, getApplicationsList } from '../../lib/backofficeService';

type CardItem = readonly [string,string,string,React.ComponentType<{className?:string}>];

export const OrganizationDashboardPage: React.FC = () => {
  const { tenant } = useTenant();
  const base = `/org/${tenant.slug}/admin`;
  const [modules, setModules] = useState(DEFAULT_MODULES_MAP);
  const [metrics, setMetrics] = useState({ active: 0, clients: 0, volume: 0 });

  useEffect(() => {
    if (!tenant.id) return;
    getTenantModules(tenant.id).then(setModules);
    Promise.all([getBackofficeMetrics({ organizationId: tenant.id, isDemoMode: false }), getApplicationsList({ organizationId: tenant.id, useDemoMode: false })])
      .then(([m, apps]) => setMetrics({
        active: apps.filter((a:any) => !['approved','rejected'].includes(a.status)).length,
        clients: new Set(apps.map((a:any) => a.borrower?.id).filter(Boolean)).size,
        volume: Number(m?.totalRequested || apps.reduce((s:number,a:any)=>s+(Number(a.requested_amount)||0),0)),
      })).catch(()=>undefined);
  }, [tenant.id]);

  const core: CardItem[] = [
    ['Expedientes','Solicitudes y ciclo hipotecario.',`${base}/solicitudes`,FileText],
    ['Clientes','Personas y seguimiento comercial.',`${base}/clientes`,Users],
    ['Garantías','Propiedades y garantías.',`${base}/propiedades`,Building2],
    ['Tasador IA','Tasaciones, comparables y valoraciones.',`${base}/tasaciones`,Compass],
    ['Documentos','Documentación y formalización.',`${base}/documentos`,FileCheck],
    ['Tareas','Pendientes y trabajo del equipo.',`${base}/tareas`,CheckSquare],
    ['Inversores','Prestamistas y oportunidades.',`${base}/prestamistas`,UserCheck],
    ['Analítica','Indicadores y resultados.',`${base}/analitica`,BarChart2],
  ];
  const admin: CardItem[] = [
    ['Usuarios y permisos','Equipo, roles y accesos.',`${base}/usuarios`,Users],
    ['Organización','Datos institucionales.',`${base}/organizacion`,Building2],
    ['Configuración','Preferencias e integraciones.',`${base}/configuracion`,Settings],
    ['Auditoría','Trazabilidad y seguridad.',`${base}/auditoria`,ShieldCheck],
    ['WhatsApp Directo','Canal de contacto.',`${base}/whatsapp`,MessageSquare],
  ];
  const Card=({item}:{item:CardItem})=>{const [name,desc,href,Icon]=item;return <Link to={href} className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-[#102d49]/30 transition min-h-[145px] flex flex-col"><div className="w-10 h-10 rounded-xl bg-slate-100 text-[#102d49] flex items-center justify-center mb-4"><Icon className="w-5 h-5"/></div><h3 className="font-bold text-[#102d49]">{name}</h3><p className="text-xs text-slate-500 mt-1 flex-1">{desc}</p><span className="text-xs font-bold text-emerald-700 mt-4 flex items-center">Abrir <ArrowRight className="w-3.5 h-3.5 ml-1"/></span></Link>};

  return <BackofficeLayout><div className="max-w-7xl mx-auto space-y-8 text-left">
    <section className="rounded-3xl bg-[#102d49] text-white p-6 md:p-8"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-300"><LayoutDashboard className="w-4 h-4"/> HIPOTECALY · Panel de organización</div><h1 className="text-3xl md:text-4xl font-serif font-bold mt-3">{tenant.name}</h1><p className="text-sm text-slate-300 mt-2 max-w-3xl">Centro de control para operar Hipotecaly, gestionar tu equipo y acceder a los módulos contratados.</p></section>
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="bg-white rounded-2xl border p-4"><span className="text-xs uppercase font-bold text-slate-400">Expedientes activos</span><p className="text-3xl font-black text-[#102d49]">{metrics.active}</p></div><div className="bg-white rounded-2xl border p-4"><span className="text-xs uppercase font-bold text-slate-400">Clientes</span><p className="text-3xl font-black text-[#102d49]">{metrics.clients}</p></div><div className="bg-white rounded-2xl border p-4"><span className="text-xs uppercase font-bold text-slate-400">Volumen</span><p className="text-2xl font-black text-[#102d49]">USD {metrics.volume.toLocaleString('es-UY')}</p></div></section>
    <section><h2 className="text-xl font-bold text-[#102d49]">Operación</h2><p className="text-sm text-slate-500 mb-4">Todo lo necesario para trabajar en Hipotecaly.</p><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{core.map(item=><Card key={item[0]} item={item}/>)}</div></section>
    {modules.white_label_enabled && <section className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 md:p-7"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5"><div><div className="flex items-center gap-2 text-emerald-800 font-bold text-sm"><Sparkles className="w-4 h-4"/> White Label contratado</div><h2 className="text-2xl font-bold text-[#102d49] mt-2">Tu portal, tu marca</h2><p className="text-sm text-slate-600 mt-1 max-w-2xl">Administrá marca, páginas estáticas, contenido, landing, SEO, dominio, comunicaciones y publicación.</p></div><div className="flex flex-wrap gap-2"><Link to={`${base}/whitelabel`} className="px-4 py-3 rounded-xl bg-[#102d49] text-white text-xs font-bold flex items-center"><Palette className="w-4 h-4 mr-2"/>Administrar White Label</Link><Link to={`/demo/${tenant.slug}`} target="_blank" className="px-4 py-3 rounded-xl bg-white border text-[#102d49] text-xs font-bold flex items-center"><Globe className="w-4 h-4 mr-2"/>Ver mi portal<ExternalLink className="w-3 h-3 ml-2"/></Link></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">{['Marca y diseño','Páginas estáticas','Dominio y SEO','Publicación'].map(x=><Link key={x} to={`${base}/whitelabel`} className="bg-white border border-emerald-100 rounded-xl p-3 text-xs font-bold text-[#102d49]">{x}<ArrowRight className="w-3 h-3 mt-2 text-emerald-700"/></Link>)}</div></section>}
    <section><h2 className="text-xl font-bold text-[#102d49]">Administración</h2><p className="text-sm text-slate-500 mb-4">Configuración, equipo, seguridad e integraciones.</p><div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">{admin.map(item=><Card key={item[0]} item={item}/>)}</div></section>
  </div></BackofficeLayout>;
};