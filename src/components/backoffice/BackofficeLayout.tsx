import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Compass,
  FileCheck,
  CheckSquare,
  Settings,
  Menu,
  X,
  Building2,
  LogOut,
  ExternalLink,
  UserCheck,
  Palette,
  BarChart2,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Search,
  ChevronDown,
  Clock,
  Home,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useOrganizationPermissions } from '../../hooks/useOrganizationPermissions';
import { TenantBrand } from '../common/TenantBrand';
import { getTenantModules, DEFAULT_MODULES_MAP } from '../../lib/tenantModulesService';
import { getApplicationsList } from '../../lib/backofficeService';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const BackofficeLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, isSuperAdmin } = useAuth();
  const { tenant } = useTenant();
  const { hasPermission, hasAnyPermission } = useOrganizationPermissions(tenant.id);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [modules, setModules] = useState(DEFAULT_MODULES_MAP);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [allApps, setAllApps] = useState<any[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tenant.id) return;
    getTenantModules(tenant.id).then(setModules);
    if (isSuperAdmin || hasPermission('applications.view')) {
      getApplicationsList({ organizationId: tenant.id, useDemoMode: Boolean(tenant.demo_mode) })
        .then(setAllApps)
        .catch(() => setAllApps([]));
    } else {
      setAllApps([]);
    }
  }, [tenant.id, tenant.demo_mode, isSuperAdmin, hasPermission('applications.view')]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) setShowCreateMenu(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k' && (isSuperAdmin || hasPermission('applications.view'))) {
        event.preventDefault();
        document.getElementById('universal-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSuperAdmin, hasPermission('applications.view')]);

  const isTenantPath = location.pathname.startsWith('/demo/') || location.pathname.startsWith('/org/');
  // /org is the canonical operational backoffice. /demo remains only for sales/demo experiences.
  const isOrganizationBackoffice = location.pathname.startsWith('/org/');
  const baseRoute = isOrganizationBackoffice
    ? `/org/${tenant.slug}/admin`
    : `/demo/${tenant.slug || 'estudio-nova'}/admin`;
  const can = (permission: string) => isSuperAdmin || hasPermission(permission);
  const canAny = (permissions: string[]) => isSuperAdmin || hasAnyPermission(permissions);

  const navigationGroups: NavGroup[] = [
    {
      title: 'TRABAJO',
      items: [
        { name: 'Inicio', href: baseRoute, icon: LayoutDashboard },
        ...(can('applications.view') ? [{ name: 'Expedientes', href: `${baseRoute}/solicitudes`, icon: FileText }] : []),
        ...(can('applications.view') ? [{ name: 'Tareas', href: `${baseRoute}/tareas`, icon: CheckSquare }] : []),
      ],
    },
    {
      title: 'INFORMACIÓN',
      items: [
        ...(can('clients.view') ? [{ name: 'Clientes', href: `${baseRoute}/clientes`, icon: Users }] : []),
        ...(can('properties.view') ? [{ name: 'Garantías', href: `${baseRoute}/propiedades`, icon: Building2 }] : []),
        ...(can('documents.view') ? [{ name: 'Documentos', href: `${baseRoute}/documentos`, icon: FileCheck }] : []),
        ...(can('appraisals.view') ? [{ name: 'Tasaciones', href: `${baseRoute}/tasaciones`, icon: Compass }] : []),
        ...((modules.investor_portal_enabled || isSuperAdmin) && can('lenders.view')
          ? [{ name: 'Inversores', href: `${baseRoute}/inversores`, icon: UserCheck }]
          : []),
      ],
    },
    {
      title: 'CONTROL',
      items: [
        ...(can('analytics.view') ? [{ name: 'Analítica', href: `${baseRoute}/analitica`, icon: BarChart2 }] : []),
        ...(can('audit.view') ? [{ name: 'Auditoría', href: `${baseRoute}/auditoria`, icon: ShieldCheck }] : []),
      ],
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        ...((modules.white_label_enabled || isSuperAdmin) && can('organization.branding.manage') ? [{ name: 'White Label', href: `${baseRoute}/whitelabel`, icon: Palette }] : []),
        ...(can('organization.integrations.manage') ? [{ name: 'WhatsApp Directo', href: `${baseRoute}/whatsapp`, icon: MessageSquare }] : []),
        ...(canAny(['organization.users.view', 'organization.users.manage', 'organization.roles.manage'])
          ? [{ name: 'Usuarios y permisos', href: `${baseRoute}/usuarios`, icon: Users }]
          : []),
        ...(can('organization.settings.manage') ? [{ name: 'Organización', href: `${baseRoute}/organizacion`, icon: Building2 }] : []),
        ...(can('organization.settings.manage') ? [{ name: 'Configuración', href: `${baseRoute}/configuracion`, icon: Settings }] : []),
      ],
    },
  ].filter((group) => group.items.length > 0);

  const isItemActive = (href: string) => href === baseRoute ? location.pathname === baseRoute : location.pathname.startsWith(href);
  const userDisplayName = user?.email?.split('@')[0] || 'Usuario';
  const userEmail = user?.email || '';
  const canCreateApplication = can('applications.manage');
  const canCreateClient = can('clients.manage');
  const canCreateProperty = can('properties.manage');
  const canManageDocuments = can('documents.manage');
  const hasCreateAction = canCreateApplication || canCreateClient || canCreateProperty || canManageDocuments;

  const renderNavigation = (mobile = false) => (
    <nav className={mobile ? 'space-y-4' : 'flex-1 px-3 py-4 space-y-5 overflow-y-auto'}>
      {navigationGroups.map((group) => (
        <div key={group.title} className="space-y-1">
          <div className={`px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase ${mobile ? 'text-left' : ''}`}>
            {group.title}
          </div>
          {group.items.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => mobile && setMobileDrawerOpen(false)}
                className={`flex items-center space-x-3 px-3 ${mobile ? 'py-2.5 min-h-[44px]' : 'py-2 min-h-[40px]'} rounded-xl text-xs font-semibold transition-all ${active ? 'bg-brand-green text-white shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-slate-bg text-slate-text">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-navy text-white flex-shrink-0 z-30 border-r border-navy-border shadow-xl">
        <div className="h-20 flex items-center px-6 border-b border-navy-border/70 justify-between">
          <Link to={baseRoute} className="flex items-center space-x-3">
            {isOrganizationBackoffice ? (
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-white text-sm shadow-xs">
                  H
                </div>
                <div className="leading-tight">
                  <span className="text-sm font-black text-white tracking-wider block">HIPOTECALY</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Backoffice</span>
                </div>
              </div>
            ) : (
              <TenantBrand isWhite size="sm" customName={tenant.branding.public_name || 'HIPOTECALY'} />
            )}
          </Link>
        </div>

        <div className="px-4 py-3 border-b border-navy-border/40">
          <div className="bg-navy-surface p-2.5 rounded-xl border border-navy-border flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-2 h-2 rounded-full bg-brand-green" />
              <span className="font-semibold text-white truncate">{tenant.branding.public_name || tenant.name}</span>
            </div>
            <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[80px]">{tenant.slug}</span>
          </div>
        </div>

        {isSuperAdmin && isTenantPath && (
          <div className="mx-3 mt-2 p-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-amber-300 uppercase tracking-wide text-[10px]">Estás inspeccionando</span>
            </div>
            <p className="text-amber-200 font-semibold truncate">{tenant.branding.public_name || tenant.name}</p>
            <Link to="/superadmin" className="text-[10px] font-bold text-amber-400 hover:text-amber-300">← Volver al Super Admin</Link>
          </div>
        )}

        {renderNavigation()}

        <div className="p-4 border-t border-navy-border/70">
          <div className="flex items-center justify-between text-xs text-slate-300 px-1">
            <div className="truncate text-left">
              <p className="font-bold text-white truncate capitalize">{userDisplayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
            </div>
            <button onClick={() => signOut?.()} title="Cerrar sesión" className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 min-h-[38px] min-w-[38px] flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 md:h-20 bg-white border-b border-slate-border px-4 sm:px-6 flex items-center justify-between z-20 gap-4">
          <div className="flex items-center space-x-3 flex-1 max-w-xl">
            <button onClick={() => setMobileDrawerOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Abrir navegación">
              <Menu className="w-6 h-6" />
            </button>

            {(isSuperAdmin || can('applications.view')) && (
              <div ref={searchContainerRef} className="relative flex-1">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="universal-search-input"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Buscar expediente, cliente, cédula, padrón... (Ctrl+K)"
                    className="w-full h-10 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy placeholder:text-slate-400 focus:bg-white focus:border-[#102d49] focus:ring-2 focus:ring-[#102d49]/10"
                  />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 text-slate-400 hover:text-navy p-1"><X className="w-3.5 h-3.5" /></button>}
                </div>

                {isSearchFocused && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 max-h-96 overflow-y-auto">
                    {(() => {
                      const query = searchQuery.toLowerCase();
                      const candidates = searchQuery
                        ? allApps.filter((app) => {
                            const borrower = `${app.borrower?.first_name || ''} ${app.borrower?.last_name || ''} ${app.borrower?.document_id || ''} ${app.borrower?.email || ''}`.toLowerCase();
                            const property = `${app.property?.cadastral_number || ''} ${app.property?.department || ''} ${app.property?.property_type || ''}`.toLowerCase();
                            return borrower.includes(query) || property.includes(query) || String(app.public_id || '').toLowerCase().includes(query);
                          }).slice(0, 6)
                        : allApps.slice(0, 4);
                      if (candidates.length === 0) return <div className="px-4 py-6 text-center text-xs text-slate-400">Sin resultados.</div>;
                      return candidates.map((app) => (
                        <button
                          type="button"
                          key={app.id}
                          onClick={() => { setIsSearchFocused(false); setSearchQuery(''); navigate(`${baseRoute}/solicitudes/${app.id}`); }}
                          className="w-full px-4 py-2.5 hover:bg-slate-50 text-left flex items-center gap-2 text-xs"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono font-bold text-[#102d49]">{app.public_id}</span>
                          <span className="text-slate-600 truncate">{app.borrower ? `${app.borrower.first_name} ${app.borrower.last_name}` : 'Expediente'}</span>
                        </button>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {hasCreateAction && (
              <div ref={createMenuRef} className="relative">
                <button onClick={() => setShowCreateMenu(!showCreateMenu)} className="h-10 px-3.5 rounded-xl bg-[#102d49] hover:bg-[#173a5e] text-white text-xs font-bold flex items-center space-x-1.5">
                  <Plus className="w-4 h-4" /><span>Crear</span><ChevronDown className="w-3 h-3 text-slate-300" />
                </button>
                {showCreateMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-left">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">Acciones rápidas</div>
                    {canCreateApplication && <Link to="/solicitar" onClick={() => setShowCreateMenu(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold"><FileText className="w-4 h-4 text-brand-green" />Nuevo Expediente</Link>}
                    {canCreateClient && <Link to={`${baseRoute}/clientes`} onClick={() => setShowCreateMenu(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold"><Users className="w-4 h-4 text-blue-600" />Nuevo Cliente</Link>}
                    {canCreateProperty && <Link to={`${baseRoute}/propiedades`} onClick={() => setShowCreateMenu(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold"><Home className="w-4 h-4 text-purple-600" />Nueva Garantía</Link>}
                    {canManageDocuments && <Link to={`${baseRoute}/documentos`} onClick={() => setShowCreateMenu(false)} className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold"><FileCheck className="w-4 h-4 text-emerald-600" />Nueva Plantilla Documental</Link>}
                  </div>
                )}
              </div>
            )}

            {(tenant.is_white_label || modules.white_label_enabled) ? (
              <div className="flex items-center space-x-1.5">
                {isOrganizationBackoffice ? (
                  <Link
                    to={`/demo/${tenant.slug}/admin`}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 py-2 px-3 rounded-xl transition shadow-2xs min-h-[40px]"
                    title="Ver la vista de administración con la marca y estilo propios de la organización"
                  >
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ver modo White Label</span>
                  </Link>
                ) : (
                  <Link
                    to={`/org/${tenant.slug}/admin`}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 py-2 px-3 rounded-xl transition shadow-2xs min-h-[40px]"
                    title="Volver al panel operativo canónico de Hipotecaly"
                  >
                    <span>Volver a Backoffice Hipotecaly</span>
                  </Link>
                )}

                <Link
                  to={`/demo/${tenant.slug}`}
                  target="_blank"
                  className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-brand-green py-2 px-2.5 rounded-lg hover:bg-slate-50 min-h-[40px]"
                  title="Abrir el portal público y de solicitantes en una nueva pestaña"
                >
                  <span>Portal público</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <Link
                to="/"
                target="_blank"
                className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-brand-green py-2 px-3 rounded-lg hover:bg-slate-50 min-h-[40px]"
              >
                <span>Ver Hipotecaly</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-brand-green-dark border border-brand-green/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green mr-1.5" />Operativo
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-12">{children}</main>
      </div>

      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-navy/80 backdrop-blur-xs" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative w-72 max-w-full bg-navy text-white flex flex-col justify-between py-6 px-4 shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-navy-border">
                {isOrganizationBackoffice ? (
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-white text-sm shadow-xs">
                      H
                    </div>
                    <div className="leading-tight">
                      <span className="text-sm font-black text-white tracking-wider block">HIPOTECALY</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Backoffice</span>
                    </div>
                  </div>
                ) : (
                  <TenantBrand isWhite size="sm" customName={tenant.branding.public_name || 'HIPOTECALY'} />
                )}
                <button onClick={() => setMobileDrawerOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="w-6 h-6" /></button>
              </div>
              {renderNavigation(true)}
            </div>
            <div className="pt-4 border-t border-navy-border space-y-3">
              <Link to="/" onClick={() => setMobileDrawerOpen(false)} className="flex items-center justify-between text-xs text-slate-400 hover:text-white py-2 min-h-[44px]"><span>Abrir Portal de Clientes</span><ExternalLink className="w-4 h-4" /></Link>
              <button onClick={() => { setMobileDrawerOpen(false); signOut?.(); }} className="w-full py-2.5 rounded-lg bg-white/5 text-rose-300 font-semibold text-xs min-h-[44px] flex items-center justify-center">Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
