import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { Button } from '../../components/ui/Button';
import { createLender, getLendersList, importLenders, Lender } from '../../lib/lendersService';
import { Plus, Shield, ArrowRight, CheckCircle2, PauseCircle, AlertCircle, Upload, X } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';

export const LendersPage: React.FC = () => {
  const { tenant } = useTenant();
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ display_name: '', contact_name: '', contact_email: '', contact_phone: '', available_capital: '', notes: '' });

  const load = async () => {
    if (!tenant?.id) { setLoading(false); return; }
    setLoading(true);
    const res = await getLendersList({ organizationId: tenant.id });
    setLenders(res.lenders);
    setError(res.error);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [tenant?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id || !form.display_name.trim()) return;
    const res = await createLender({
      organization_id: tenant.id,
      display_name: form.display_name.trim(),
      contact_name: form.contact_name.trim(),
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim(),
      available_capital: form.available_capital ? Number(form.available_capital) : undefined,
      notes: form.notes.trim(),
      source: 'manual',
    });
    if (res.error) { setError(res.error); return; }
    setForm({ display_name: '', contact_name: '', contact_email: '', contact_phone: '', available_capital: '', notes: '' });
    setShowCreate(false);
    setNotice('Inversor guardado correctamente.');
    await load();
  };

  const handleCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant?.id) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Importación XLSX directa todavía no está habilitada. Exportá el Excel como CSV.');
      e.target.value = '';
      return;
    }
    const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
    const split = (line: string) => line.split(/[,;]/).map(v => v.trim().replace(/^"|"$/g, ''));
    const headers = split(lines[0] || '').map(h => h.toLowerCase());
    const rows = lines.slice(1).map(line => {
      const values = split(line);
      const get = (...names: string[]) => {
        const i = headers.findIndex(h => names.includes(h));
        return i >= 0 ? values[i] || '' : '';
      };
      return {
        display_name: get('nombre', 'name', 'display_name'),
        contact_name: get('contacto', 'contact_name'),
        contact_email: get('email', 'contact_email'),
        contact_phone: get('telefono', 'teléfono', 'phone', 'contact_phone'),
        available_capital: Number(get('capital', 'available_capital')) || undefined,
        notes: get('notas', 'notes'),
      };
    });
    const res = await importLenders(tenant.id, rows, 'csv');
    setNotice(res.created + ' inversor(es) importados.');
    setError(res.errors.length ? res.errors.slice(0, 3).join(' · ') : null);
    e.target.value = '';
    await load();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <PauseCircle className="w-3 h-3 mr-1" /> Pausado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            <AlertCircle className="w-3 h-3 mr-1" /> {status}
          </span>
        );
    }
  };

  return (
    <BackofficeLayout title="Red de Prestamistas e Inversores">
      <div className="space-y-6">
        
        {/* Header con botón de acción */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
              Prestamistas e Inversores Registrados
            </h2>
            <p className="text-xs sm:text-sm text-slate-muted mt-1">
              Cartera privada de inversores de la organización. Alta manual o importación CSV; los datos quedan aislados por organización.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <label className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-slate-border bg-white text-xs font-bold text-navy cursor-pointer hover:bg-slate-50">
              <Upload className="w-4 h-4 mr-1.5" /> Importar CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsv} />
            </label>
            <Button variant="primary" size="md" className="shadow-sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Agregar inversor
            </Button>
          </div>
        </div>

        {notice && <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">{notice}</div>}
        {error && <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs">{error}</div>}

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-card p-5 border border-slate-border shadow-card space-y-4">
            <div className="flex items-start justify-between">
              <div><h3 className="font-bold text-navy">Agregar inversor</h3><p className="text-xs text-slate-500">Alta real en la cartera privada de la organización.</p></div>
              <button type="button" onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input required className="h-11 px-3 border border-slate-border rounded-lg text-sm" placeholder="Nombre / denominación *" value={form.display_name} onChange={e => setForm({...form, display_name:e.target.value})} />
              <input className="h-11 px-3 border border-slate-border rounded-lg text-sm" placeholder="Persona de contacto" value={form.contact_name} onChange={e => setForm({...form, contact_name:e.target.value})} />
              <input type="email" className="h-11 px-3 border border-slate-border rounded-lg text-sm" placeholder="Email" value={form.contact_email} onChange={e => setForm({...form, contact_email:e.target.value})} />
              <input className="h-11 px-3 border border-slate-border rounded-lg text-sm" placeholder="Teléfono" value={form.contact_phone} onChange={e => setForm({...form, contact_phone:e.target.value})} />
              <input type="number" min="0" className="h-11 px-3 border border-slate-border rounded-lg text-sm" placeholder="Capital disponible USD" value={form.available_capital} onChange={e => setForm({...form, available_capital:e.target.value})} />
              <input className="h-11 px-3 border border-slate-border rounded-lg text-sm" placeholder="Notas internas" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} />
            </div>
            <div className="flex justify-end"><Button type="submit" variant="primary">Guardar inversor</Button></div>
          </form>
        )}

        {/* Banner Anti-Bypass */}
        <div className="p-4 rounded-xl bg-navy/5 border border-navy/10 flex items-start space-x-3 text-xs text-navy">
          <Shield className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
          <div>
            <strong>Flujo de contacto protegido:</strong> el inversor recibe oportunidades anonimizadas, marca interés no vinculante y la organización decide cuándo conectar a las partes.
          </div>
        </div>

        {/* Tabla Desktop y Cards Móviles */}
        {loading ? (
          <div className="bg-white rounded-card p-12 text-center text-slate-muted border border-slate-border">
            Cargando catálogo de prestamistas...
          </div>
        ) : (
          <div className="bg-white rounded-card shadow-card border border-slate-border overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-text">
                <thead className="bg-slate-bg border-b border-slate-border font-bold text-navy uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Prestamista / Entidad</th>
                    <th className="px-5 py-3.5">Tipo</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5">LTV Máx</th>
                    <th className="px-5 py-3.5">Rango de Préstamo</th>
                    <th className="px-5 py-3.5">Clearing</th>
                    <th className="px-5 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-border font-medium">
                  {lenders.map((lender) => (
                    <tr key={lender.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-navy text-sm">{lender.display_name}</div>
                        <div className="text-[11px] text-slate-400">{lender.legal_name || 'Inversor privado registrado'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="capitalize">{lender.lender_type.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(lender.status)}
                      </td>
                      <td className="px-5 py-4 font-bold text-navy">
                        {lender.rules ? `${Math.round(lender.rules.max_ltv * 100)}%` : '40%'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        USD {lender.rules?.min_loan.toLocaleString('es-UY') || '10.000'} - USD {lender.rules?.max_loan.toLocaleString('es-UY') || '200.000'}
                      </td>
                      <td className="px-5 py-4">
                        {lender.rules?.accepts_clearing ? (
                          <span className="text-emerald-700 font-semibold">Admite</span>
                        ) : (
                          <span className="text-slate-400">Solo limpio</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link to={`/app/prestamistas/${lender.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Ficha <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Versión Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-border">
              {lenders.map((lender) => (
                <div key={lender.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-navy text-sm">{lender.display_name}</h4>
                      <p className="text-[11px] text-slate-400">{lender.legal_name || 'Inversor privado'}</p>
                    </div>
                    {getStatusBadge(lender.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-bg p-2.5 rounded-lg">
                    <div>
                      <span className="text-slate-400 block text-[10px]">LTV Máximo</span>
                      <strong className="text-navy">{lender.rules ? `${Math.round(lender.rules.max_ltv * 100)}%` : '40%'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tope</span>
                      <strong className="text-navy">USD {lender.rules?.max_loan.toLocaleString('es-UY') || '200.000'}</strong>
                    </div>
                  </div>
                  <Link to={`/app/prestamistas/${lender.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Gestionar Ficha <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </BackofficeLayout>
  );
};
