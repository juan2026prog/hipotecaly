// ==============================================================================
// HIPOTECALY: Panel de Configuración de WhatsApp Directo de la Organización
// Control Nivel 2, validación de formato internacional, bloqueo si Nivel 1 está OFF y Preview en vivo
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { useTenant } from '../../contexts/TenantContext';
import {
  getTenantWhatsAppStatus,
  saveTenantWhatsAppSettings,
  normalizeWhatsappNumber,
  isValidWhatsappNumber,
  OrganizationWhatsAppSettings,
} from '../../lib/whatsappService';
import { WhatsAppFloatingButton } from '../../components/whatsapp/WhatsAppFloatingButton';
import { Button } from '../../components/ui/Button';
import {
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  Save,
  Lock,
  Phone,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';

export const WhatsAppSettingsPage: React.FC = () => {
  const { tenant } = useTenant();
  const orgName = tenant.branding?.public_name || tenant.name || 'tu organización';

  const [platformEnabled, setPlatformEnabled] = useState(true);
  const [settings, setSettings] = useState<OrganizationWhatsAppSettings>({
    tenantId: tenant.id,
    enabled: true,
    phoneNumber: '59899123456',
    buttonText: '¿Necesitás ayuda?',
    defaultMessage: `Hola, estoy visitando el sitio de ${orgName} y quisiera hacer una consulta.`,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar estado
  useEffect(() => {
    async function load() {
      if (!tenant.id) return;
      setLoading(true);
      const status = await getTenantWhatsAppStatus(tenant.id, orgName);
      setPlatformEnabled(status.platformEnabled);
      setSettings(status.organizationSettings);
      setLoading(false);
    }
    load();
  }, [tenant.id, orgName]);

  const handlePhoneChange = (val: string) => {
    // Normalizar automáticamente al escribir para mantener dígitos limpios
    const clean = normalizeWhatsappNumber(val);
    setSettings({ ...settings, phoneNumber: clean });
    if (errorMessage) setErrorMessage(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // Si está intentando activar pero el número no es válido
    if (settings.enabled && settings.phoneNumber) {
      if (!isValidWhatsappNumber(settings.phoneNumber)) {
        setErrorMessage(
          'Por favor ingresá un número de WhatsApp internacional válido (ej. 59899123456, sin +, espacios ni guiones).'
        );
        return;
      }
    }

    setSaving(true);
    try {
      const res = await saveTenantWhatsAppSettings(tenant.id, settings);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      } else {
        setErrorMessage(res.error || 'Error al guardar la configuración.');
      }
    } catch {
      setErrorMessage('Ocurrió un error inesperado al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const isPhoneValid = isValidWhatsappNumber(settings.phoneNumber);

  return (
    <BackofficeLayout>
      <div className="space-y-8 text-left max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
              CANAL DE CONTACTO
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
              WhatsApp Directo
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Configurá el botón flotante oficial de WhatsApp para los visitantes de las páginas públicas de {orgName}.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center space-x-1.5 ${
                platformEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${platformEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{platformEnabled ? 'Módulo Disponible' : 'Deshabilitado por Plataforma'}</span>
            </span>
          </div>
        </div>

        {/* ALERTA: MÓDULO BLOQUEADO POR SUPER ADMIN (ESTADO A) */}
        {!platformEnabled && (
          <div className="p-5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3.5 text-amber-900 shadow-sm animate-fadeIn">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-sm text-amber-900">
                WhatsApp Directo no está habilitado para tu organización
              </h3>
              <p className="text-amber-800 leading-relaxed">
                Este módulo se encuentra desactivado administrativamente por la plataforma HIPOTECALY.
                El botón flotante no se mostrará en tu sitio público y la edición de parámetros está bloqueada.
                Tu configuración previa permanece guardada intacta.
              </p>
              <p className="text-[11px] text-amber-700 font-semibold pt-1">
                Para solicitar la activación de WhatsApp Directo, comunicate con el administrador de la plataforma.
              </p>
            </div>
          </div>
        )}

        {/* TOASTS DE ÉXITO O ERROR */}
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>¡Configuración de WhatsApp guardada exitosamente y sincronizada en tiempo real con tu sitio web!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TARJETA PRINCIPAL DE CONFIGURACIÓN */}
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${
          !platformEnabled ? 'opacity-70 pointer-events-none select-none bg-slate-50/50' : ''
        }`}>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#102d49]">Parámetros de WhatsApp</h2>
                <p className="text-[11px] text-slate-500">Enlace directo oficial sin chats ficticios ni bots.</p>
              </div>
            </div>

            {!platformEnabled && (
              <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Bloqueado</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            
            {/* 1. SWITCH MOSTRAR WHATSAPP */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-[#102d49] block">
                  Mostrar WhatsApp en mi sitio
                </label>
                <p className="text-[11px] text-slate-500">
                  Activa o desactiva la visualización del botón flotante en tus páginas públicas (Home, Simulador, etc.).
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  disabled={!platformEnabled || loading}
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {settings.enabled ? 'Activado' : 'Desactivado'}
                </span>
              </label>
            </div>

            {/* 2. NÚMERO DE WHATSAPP */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Número de WhatsApp</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Formato internacional normalizado</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  disabled={!platformEnabled || loading}
                  value={settings.phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="59899123456"
                  className={`w-full h-11 px-3.5 rounded-xl border text-sm font-mono font-bold text-[#102d49] transition-all ${
                    settings.phoneNumber && !isPhoneValid
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
                      : 'border-slate-300 focus:border-[#102d49] focus:ring-2 focus:ring-[#102d49]/10'
                  }`}
                />
                {settings.phoneNumber && (
                  <div className="absolute right-3 top-3 text-[11px] font-bold">
                    {isPhoneValid ? (
                      <span className="text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Válido</span>
                      </span>
                    ) : (
                      <span className="text-rose-500">Formato incompleto</span>
                    )}
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 flex items-start space-x-2 text-[11px] text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p>
                    <strong>Regla de formato:</strong> Ingresá el código de país seguido del número (sin signos +, sin espacios ni guiones).
                  </p>
                  <p className="text-blue-700">
                    Ejemplo para Uruguay: <span className="font-mono font-bold">59899123456</span> (Código 598 + celular 099 123 456).
                  </p>
                </div>
              </div>
            </div>

            {/* 3. TEXTO DEL BOTÓN */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Texto del Botón Flotante
              </label>
              <input
                type="text"
                maxLength={60}
                disabled={!platformEnabled || loading}
                value={settings.buttonText}
                onChange={(e) => setSettings({ ...settings, buttonText: e.target.value })}
                placeholder="¿Necesitás ayuda?"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-[#102d49] focus:border-[#102d49] focus:ring-2 focus:ring-[#102d49]/10"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Ejemplos comunes: "¿Necesitás ayuda?", "Hablar por WhatsApp", "Consultas directas"</span>
                <span>{settings.buttonText.length}/60</span>
              </div>
            </div>

            {/* 4. MENSAJE PRECARGADO */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Mensaje Inicial Precargado
              </label>
              <textarea
                rows={3}
                disabled={!platformEnabled || loading}
                value={settings.defaultMessage}
                onChange={(e) => setSettings({ ...settings, defaultMessage: e.target.value })}
                placeholder="Hola, estoy visitando su sitio web y quisiera hacer una consulta."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#102d49] focus:ring-2 focus:ring-[#102d49]/10"
              />
              <p className="text-[10px] text-slate-400">
                Este texto aparecerá pre-escrito en el WhatsApp del cliente cuando haga clic en el botón. El usuario siempre confirma y envía el mensaje de forma voluntaria.
              </p>
            </div>

            {/* 5. VISTA PREVIA INTERACTIVA */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Vista Previa del Botón Flotante</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {settings.enabled && platformEnabled && isPhoneValid ? '🟢 Visible en sitio público' : '🔴 Oculto en sitio público'}
                </span>
              </div>

              <div className="p-6 bg-slate-800/80 rounded-xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-left text-xs">
                  <p className="font-bold text-slate-200">Previsualización de cómo se ve en tu sitio web:</p>
                  <p className="text-[11px] text-slate-400">
                    Ubicado en la esquina inferior derecha mientras los clientes navegan tu Home y Simulador.
                  </p>
                </div>

                <div className="shrink-0">
                  <WhatsAppFloatingButton
                    tenantId={tenant.id}
                    previewMode={true}
                    overrideConfig={{
                      enabled: settings.enabled,
                      phoneNumber: settings.phoneNumber,
                      buttonText: settings.buttonText,
                      defaultMessage: settings.defaultMessage,
                      platformEnabled: platformEnabled,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* FOOTER & BOTÓN GUARDAR */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                Los cambios se aplican de forma inmediata al sitio público de {orgName}.
              </p>

              <Button
                type="submit"
                disabled={!platformEnabled || saving}
                className="bg-[#102d49] hover:bg-[#173a5e] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center space-x-2 min-h-[44px]"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1" />
                    <span>Guardado</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    <span>{saving ? 'Guardando...' : 'Guardar cambios'}</span>
                  </>
                )}
              </Button>
            </div>

          </form>
        </div>

        {/* ACCESO RÁPIDO A PROBAR EN PORTAL PÚBLICO */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-600">Probar botón en el portal público de tu organización:</span>
          </div>
          <a
            href={`/demo/${tenant.slug}`}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[#102d49] hover:text-brand-green flex items-center space-x-1"
          >
            <span>Abrir sitio público (/demo/{tenant.slug})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </BackofficeLayout>
  );
};
