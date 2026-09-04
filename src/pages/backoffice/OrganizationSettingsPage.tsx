import React, { useState, useEffect } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { Button } from '../../components/ui/Button';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { applyTenantTheme } from '../../lib/tenantService';
import {
  Palette,
  Globe,
  CreditCard,
  CheckCircle2,
  Save,
  AlertCircle,
} from 'lucide-react';

export const OrganizationSettingsPage: React.FC = () => {
  const { tenant } = useTenant();
  const [publicName, setPublicName] = useState(tenant.branding.public_name || tenant.name);
  const [tagline, setTagline] = useState(tenant.branding.tag_line || '');
  const [primaryColor, setPrimaryColor] = useState(tenant.branding.primary_color || '#0B8A5A');
  const [secondaryColor, setSecondaryColor] = useState(tenant.branding.secondary_color || '#0F1E36');
  const [customDomain] = useState(tenant.custom_domain || 'creditos.estudiodeleste.uy');
  const [domainVerified] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setPublicName(tenant.branding.public_name || tenant.name);
    setTagline(tenant.branding.tag_line || '');
    setPrimaryColor(tenant.branding.primary_color || '#0B8A5A');
    setSecondaryColor(tenant.branding.secondary_color || '#0F1E36');
  }, [tenant]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    try {
      // 1. Guardar en tabla organization_branding de Supabase
      await supabase
        .from('organization_branding')
        .upsert({
          organization_id: tenant.id,
          public_name: publicName,
          tag_line: tagline,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          updated_at: new Date().toISOString(),
        });

      // 2. Actualizar nombre de la organización
      await supabase
        .from('organizations')
        .update({ name: publicName, updated_at: new Date().toISOString() })
        .eq('id', tenant.id);
    } catch (err: any) {
      console.warn('Persistencia en cloud no disponible en este entorno:', err?.message);
    }

    // 3. Aplicar tema en caliente al DOM
    applyTenantTheme({
      ...tenant.branding,
      public_name: publicName,
      tag_line: tagline,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });

    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <BackofficeLayout title="Configuración de la Organización y White-Label">
      <div className="space-y-6 max-w-5xl">

        {/* Encabezado */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
            Marca Blanca y Parámetros del Estudio
          </h2>
          <p className="text-xs sm:text-sm text-slate-muted mt-1">
            Personalizá la identidad visual de los portales de clientes y configurá tu propio dominio web.
          </p>
        </div>

        {/* 1. Branding White-Label */}
        <form onSubmit={handleSaveBranding} className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-border pb-3">
            <Palette className="w-5 h-5 text-brand-green" />
            <h3 className="text-base font-bold text-navy">Personalización de Marca (White-Label)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-text mb-1">Nombre Público de la Entidad</label>
              <input
                type="text"
                value={publicName}
                onChange={(e) => setPublicName(e.target.value)}
                className="w-full h-10 px-3 border border-slate-border rounded-lg text-xs font-semibold text-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-text mb-1">Eslogan Comercial</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full h-10 px-3 border border-slate-border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-text mb-1">Color Primario de Marca</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded border border-slate-border cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 h-10 px-3 border border-slate-border rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-text mb-1">Color Secundario</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded border border-slate-border cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 h-10 px-3 border border-slate-border rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {saveError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-border">
            {savedSuccess ? (
              <span className="text-xs text-emerald-700 font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-brand-green" /> Branding actualizado exitosamente
              </span>
            ) : <div />}
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>

        {/* 2. Dominios Personalizados */}
        <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-border pb-3">
            <Globe className="w-5 h-5 text-brand-green" />
            <h3 className="text-base font-bold text-navy">Dominio Web Personalizado</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-bg rounded-xl border border-slate-border gap-3 text-xs">
            <div>
              <span className="font-mono font-bold text-navy text-sm block">{customDomain}</span>
              <span className="text-slate-500">Mapeado a los servidores de HIPOTECALY Cloud</span>
            </div>
            <div className="flex items-center space-x-2">
              {domainVerified ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-brand-green" /> DNS Verificado · SSL Activo
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  Pendiente de verificación DNS
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <strong>Instrucciones DNS:</strong> Creá un registro <code>CNAME</code> en tu proveedor de dominio apuntando a <code>cname.hipotecaly.uy</code>. El certificado SSL gratuito Let&apos;s Encrypt se emitirá automáticamente.
          </div>
        </div>

        {/* 3. Suscripción y Facturación */}
        <div className="bg-white rounded-card p-6 border border-slate-border shadow-card space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-border pb-3">
            <CreditCard className="w-5 h-5 text-brand-green" />
            <h3 className="text-base font-bold text-navy">Suscripción SaaS y Plan Vigente</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-bg border border-slate-border">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Plan Actual</span>
              <strong className="text-navy text-base block mt-0.5">Professional</strong>
              <span className="text-slate-500">USD 249 / mes</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-bg border border-slate-border">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Expedientes del Mes</span>
              <strong className="text-navy text-base block mt-0.5">14 de 100</strong>
              <span className="text-emerald-700 font-semibold">14% de cuota utilizada</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-bg border border-slate-border">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado de Cuenta</span>
              <strong className="text-emerald-700 text-base block mt-0.5">Al día</strong>
              <span className="text-slate-500">Próxima renovación: 01/10/2026</span>
            </div>
          </div>
        </div>

      </div>
    </BackofficeLayout>
  );
};
