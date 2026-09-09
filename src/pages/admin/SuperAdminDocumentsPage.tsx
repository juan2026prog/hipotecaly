import React, { useState, useEffect } from 'react';
import { SuperAdminLayout } from '../../components/admin/SuperAdminLayout';
import {
  Plus,
  Search,
  Layers,
  Edit,
  ShieldCheck,
  Sliders,
  Archive,
} from 'lucide-react';
import { DocumentTemplate } from '../../lib/docflow/types';
import { DocumentService } from '../../lib/docflow/documentService';
import { TemplateEditorModal } from '../../components/docflow/TemplateEditorModal';
import { Button } from '../../components/ui/Button';
import { getAllRegisteredTenants } from '../../lib/tenantService';

export const SuperAdminDocumentsPage: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tenants, setTenants] = useState<any[]>([]);

  // Modales
  const [selectedTpl, setSelectedTpl] = useState<DocumentTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Modal de disponibilidad por tenant
  const [availabilityTpl, setAvailabilityTpl] = useState<DocumentTemplate | null>(null);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [isAllTenants, setIsAllTenants] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tplList, tenantList] = await Promise.all([
        DocumentService.getGlobalTemplates(),
        Promise.resolve(getAllRegisteredTenants()),
      ]);
      setTemplates(tplList);
      setTenants(tenantList);
    } catch (err) {
      console.error('Error loading global templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAvailability = (tpl: DocumentTemplate) => {
    setAvailabilityTpl(tpl);
    if (!tpl.available_tenant_ids || tpl.available_tenant_ids.length === 0) {
      setIsAllTenants(true);
      setSelectedTenantIds([]);
    } else {
      setIsAllTenants(false);
      setSelectedTenantIds(tpl.available_tenant_ids);
    }
  };

  const handleSaveAvailability = async () => {
    if (!availabilityTpl) return;
    setSavingAvailability(true);
    try {
      const newAvailability = isAllTenants ? null : selectedTenantIds;
      await DocumentService.setGlobalAvailability(availabilityTpl.id, newAvailability);
      await loadData();
      setAvailabilityTpl(null);
    } catch (err) {
      console.error('Error updating availability:', err);
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (confirm('¿Confirmas que deseas archivar esta plantilla global? No estará visible para nuevos expedientes.')) {
      await DocumentService.archiveTemplate(id);
      await loadData();
    }
  };

  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'todos' || tpl.category === categoryFilter;
    const matchesStatus = statusFilter === 'todos' || tpl.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeCount = templates.filter((t) => t.status === 'active').length;
  const draftCount = templates.filter((t) => t.status === 'draft').length;

  return (
    <SuperAdminLayout activeSection="documentos">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#152E4D] pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
                Biblioteca Maestra HIPOTECALY
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-mono">DocFlow Engine Multi-Tenant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5">
              Plantillas Documentales Globales
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Catálogo central de contratos, formularios y minutas notariales oficiales disponibles como base para todas las organizaciones White Label.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setSelectedTpl(null);
                setShowEditor(true);
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Nueva Plantilla Global
            </Button>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#09182C] border border-[#152E4D] p-4 rounded-2xl">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Total Maestras</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{templates.length}</span>
            <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Catálogo oficial activo</span>
          </div>

          <div className="bg-[#09182C] border border-[#152E4D] p-4 rounded-2xl">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Publicadas (Activas)</span>
            <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">{activeCount}</span>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">Disponibles a tenants</span>
          </div>

          <div className="bg-[#09182C] border border-[#152E4D] p-4 rounded-2xl">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">En Borrador</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{draftCount}</span>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">En revisión interna</span>
          </div>

          <div className="bg-[#09182C] border border-[#152E4D] p-4 rounded-2xl">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">Seguridad Jurídica</span>
            <span className="text-base font-bold text-teal-300 mt-1 block flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-teal-400" /> Ley 18.600
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">SHA-256 inmutable</span>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-[#09182C] border border-[#152E4D] p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar plantilla global por título, cláusula o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#071322] border border-[#1E3E66] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Categorías */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#071322] border border-[#1E3E66] text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todas las Categorías</option>
              <option value="solicitud">Solicitud & Identidad</option>
              <option value="legal">Legal & Garantías</option>
              <option value="notarial">Notarial / Escrituras</option>
              <option value="financiero">Financiero / Tasas</option>
              <option value="tasacion">Tasaciones</option>
              <option value="comunicacion">Comunicaciones</option>
            </select>

            {/* Estado */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#071322] border border-[#1E3E66] text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos los Estados</option>
              <option value="active">Activas</option>
              <option value="draft">Borradores</option>
            </select>
          </div>
        </div>

        {/* Grilla de Plantillas Globales */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-[#09182C] rounded-2xl border border-[#152E4D]">
            Cargando catálogo maestro de documentos globales...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[#09182C] rounded-2xl border border-dashed border-[#1E3E66]">
            <Layers className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No se encontraron plantillas globales</h4>
            <p className="text-xs text-slate-400">Ajusta los filtros de búsqueda o crea una nueva plantilla oficial.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((tpl) => {
              const isAvailableToAll = !tpl.available_tenant_ids || tpl.available_tenant_ids.length === 0;

              return (
                <div
                  key={tpl.id}
                  className="bg-[#09182C] border border-[#152E4D] hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all group"
                >
                  <div className="space-y-2.5">
                    {/* Header Card */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                        {tpl.category}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          tpl.status === 'active'
                            ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        v{tpl.version} · {tpl.status === 'active' ? 'Publicada' : 'Borrador'}
                      </span>
                    </div>

                    {/* Título y Descripción */}
                    <h3 className="font-bold text-white text-base leading-snug group-hover:text-emerald-300 transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {tpl.description || 'Plantilla oficial de la plataforma HIPOTECALY.'}
                    </p>

                    {/* Info Técnica */}
                    <div className="pt-2 border-t border-[#152E4D] text-[11px] font-mono text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Campos requeridos:</span>
                        <strong className="text-slate-200">{tpl.required_fields?.length || 0}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Firma Ley 18.600:</span>
                        <strong className={tpl.requires_signature ? 'text-emerald-400' : 'text-slate-500'}>
                          {tpl.requires_signature ? 'Requerida' : 'No requerida'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Disponibilidad:</span>
                        <span className="text-[10px] font-semibold text-teal-300">
                          {isAvailableToAll ? 'Todos los Tenants' : `${tpl.available_tenant_ids?.length} tenants`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="pt-3 border-t border-[#152E4D] flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTpl(tpl);
                          setShowEditor(true);
                        }}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2.5 py-1"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAvailability(tpl)}
                        className="text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 px-2.5 py-1"
                        title="Configurar visibilidad por tenant"
                      >
                        <Sliders className="w-3.5 h-3.5 mr-1 text-slate-400" /> Tenants
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleArchive(tpl.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                      title="Archivar plantilla global"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Disponibilidad por Tenant */}
        {availabilityTpl && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-[#09182C] border border-[#1E3E66] rounded-2xl w-full max-w-lg p-6 space-y-5 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#152E4D] pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                    Control de Visibilidad Global
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {availabilityTpl.name}
                  </h3>
                </div>
                <button
                  onClick={() => setAvailabilityTpl(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 bg-[#071322] border border-[#1E3E66] rounded-xl space-y-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-slate-200 font-semibold">
                    <input
                      type="checkbox"
                      checked={isAllTenants}
                      onChange={(e) => {
                        setIsAllTenants(e.target.checked);
                        if (e.target.checked) setSelectedTenantIds([]);
                      }}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/30"
                    />
                    <span>Habilitar para TODOS los White Label (Público Global)</span>
                  </label>
                  <p className="text-[11px] text-slate-400 pl-6">
                    Cualquier tenant actual o futuro podrá ver esta plantilla en su sección "Plantillas HIPOTECALY" y derivar versiones propias.
                  </p>
                </div>

                {!isAllTenants && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">
                      Seleccionar Tenants Autorizados ({selectedTenantIds.length})
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-[#071322] border border-[#1E3E66] rounded-xl">
                      {tenants.map((t) => {
                        const isChecked = selectedTenantIds.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTenantIds([...selectedTenantIds, t.id]);
                                  } else {
                                    setSelectedTenantIds(selectedTenantIds.filter((id) => id !== t.id));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-emerald-500"
                              />
                              <span className="text-white font-medium">{t.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{t.slug}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#152E4D]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAvailabilityTpl(null)}
                  className="text-xs text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAvailability}
                  disabled={savingAvailability}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {savingAvailability ? 'Guardando...' : 'Guardar Disponibilidad'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Editor Modal de Plantilla en Modo Global */}
        <TemplateEditorModal
          isOpen={showEditor}
          templateToEdit={selectedTpl}
          tenantName="HIPOTECALY GLOBAL"
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            loadData();
          }}
        />
      </div>
    </SuperAdminLayout>
  );
};
