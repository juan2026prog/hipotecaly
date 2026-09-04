import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { SaaSNavbar } from '../../components/layout/SaaSNavbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { SAAS_MODULE_CATALOG, ModuleCategory, ModuleTier } from '../../lib/moduleCatalogService';

export const SaaSModulesCatalogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');

  useEffect(() => {
    document.title = 'Catálogo de Módulos y Add-Ons | HIPOTECALY SaaS Platform';
  }, []);

  const categories: ModuleCategory[] = Array.from(
    new Set(SAAS_MODULE_CATALOG.map((m) => m.category))
  );

  const filteredModules = SAAS_MODULE_CATALOG.filter((m) => {
    const matchCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchTier = selectedTier === 'all' || m.tier === selectedTier;
    return matchCategory && matchTier;
  });

  const getTierBadge = (tier: ModuleTier) => {
    switch (tier) {
      case 'included':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-brand-green border border-emerald-200">
            INCLUDED
          </span>
        );
      case 'addon':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-600 border border-blue-200">
            ADD-ON
          </span>
        );
      case 'enterprise':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-50 text-purple-600 border border-purple-200">
            ENTERPRISE
          </span>
        );
      case 'coming_soon':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            COMING SOON
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-text">
      <SaaSNavbar />

      {/* ============================================================== */}
      {/* 1. HERO SECTION DEL CATÁLOGO                                    */}
      {/* ============================================================== */}
      <section className="relative pt-12 pb-14 md:pt-18 md:pb-20 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-navy text-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-brand-green/20 text-brand-green border border-brand-green/30">
            <Layers className="w-3.5 h-3.5" />
            <span>ARQUITECTURA MODULAR SAAS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Catálogo Oficial de Módulos & Add-Ons HIPOTECALY
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            Explorá cada capacidad tecnológica disponible para potenciar tu entidad. Activá módulos incluidos en tu plan o incorporá add-ons especializados en caliente sin interrumpir tu operatoria.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/contacto?demo=true">
              <Button variant="primary" size="lg" className="shadow-floating font-bold">
                Solicitar Propuesta Modular <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/saas/precios">
              <Button variant="outline" size="lg" className="text-white border-white/30 hover:bg-white/10">
                Ver Planes Pre-Empaquetados
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. FILTROS Y GRILLA DE MÓDULOS                                  */}
      {/* ============================================================== */}
      <section className="py-12 bg-slate-50 border-b border-slate-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Filtro por Categoría */}
            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Categoría:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-navy text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todas ({SAAS_MODULE_CATALOG.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-navy text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Filtro por Tier */}
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 uppercase">Tier:</span>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold py-1.5 px-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <option value="all">Todos los Tiers</option>
                <option value="included">INCLUDED</option>
                <option value="addon">ADD-ON</option>
                <option value="enterprise">ENTERPRISE</option>
                <option value="coming_soon">COMING SOON</option>
              </select>
            </div>

          </div>

          {/* Grilla de Módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((mod) => (
              <div
                key={mod.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                      {mod.category}
                    </span>
                    {getTierBadge(mod.tier)}
                  </div>

                  <h3 className="text-base font-bold text-navy leading-snug">{mod.name}</h3>

                  <p className="text-xs text-slate-600 leading-relaxed">{mod.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  {mod.dependencies.length > 0 ? (
                    <div className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">Dependencias:</span>{' '}
                      {mod.dependencies.join(', ')}
                    </div>
                  ) : (
                    <div className="text-[11px] text-brand-green flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Core independiente
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      to={`/contacto?demo=true&modulo=${mod.id}`}
                      className="text-xs font-bold text-navy hover:text-brand-green flex items-center justify-between group"
                    >
                      <span>Consultar por este módulo</span>
                      <ChevronRight className="w-3.5 h-3.5 text-brand-green group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. BANNER CONSULTIVO FINAL                                      */}
      {/* ============================================================== */}
      <section className="py-16 bg-navy text-white text-left">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
            ¿Necesitás una configuración modular a medida?
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            Nuestros especialistas técnicos evalúan el volumen de tu organización y configuran un paquete optimizado para tus metas operativas.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link to="/contacto?demo=true">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 font-bold shadow-floating">
                Solicitar Cotización Modular <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/demo/nova">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                <Sparkles className="w-4 h-4 mr-2 text-brand-green" /> Ver Demo en Vivo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
