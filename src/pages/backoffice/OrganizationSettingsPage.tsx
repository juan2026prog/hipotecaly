import React, { useState } from 'react';
import { BackofficeLayout } from '../../components/backoffice/BackofficeLayout';
import { useTenant } from '../../contexts/TenantContext';
import { Building2, Save, MapPin, Phone, Mail, User, FileText, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const OrganizationSettingsPage: React.FC = () => {
  const { tenant } = useTenant();

  const [saved, setSaved] = useState(false);
  const [org, setOrg] = useState({
    // Identificación
    commercialName: tenant.branding?.public_name || tenant.name || '',
    legalName: tenant.name || '',
    taxId: '',           // RUT/CUIT
    taxCountry: 'UY',
    // Contacto
    phone: '',
    email: '',
    website: '',
    // Domicilio
    address: '',
    city: '',
    department: 'Montevideo',
    postalCode: '',
    // Representante legal
    legalRepName: '',
    legalRepRole: 'Director',
    legalRepEmail: '',
    // Datos notariales
    notaryName: '',
    notaryRegistration: '',
    // Operacional
    timezone: 'America/Montevideo',
    currency: 'USD',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <BackofficeLayout>
      <div className="space-y-8 text-left max-w-4xl mx-auto">

        {/* Header */}
        <div>
          <span className="text-[10px] font-bold text-[#f4b43b] bg-[#102d49] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
            ADMINISTRACIÓN
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102d49] tracking-tight">
            Organización
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Datos institucionales y operativos de {org.commercialName || tenant.name}. Esta información se utiliza en documentación legal y comunicaciones oficiales.
          </p>
        </div>

        {/* Aviso de separación conceptual */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-3 text-xs">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-blue-800">Configuración de Organización vs. White Label</p>
            <p className="text-blue-700">
              Esta sección gestiona los datos <strong>internos institucionales</strong> de tu organización (razón social, RUT, representante legal). 
              Para modificar colores, logos, dominio y políticas visibles al solicitante, usá <strong>White Label &amp; Marca</strong>.
            </p>
          </div>
        </div>

        {/* ------------------------------------------------- */}
        {/* 1. IDENTIFICACIÓN INSTITUCIONAL                   */}
        {/* ------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-navy" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">Identificación Institucional</h2>
              <p className="text-[11px] text-slate-500">Datos registrales y fiscales de tu organización.</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Comercial</label>
              <input
                type="text"
                value={org.commercialName}
                onChange={(e) => setOrg({ ...org, commercialName: e.target.value })}
                placeholder="Ej: Nova Crédito"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-semibold text-navy focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
              <p className="text-[10px] text-slate-400 mt-1">Nombre con el que opera tu organización ante los clientes.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Razón Social</label>
              <input
                type="text"
                value={org.legalName}
                onChange={(e) => setOrg({ ...org, legalName: e.target.value })}
                placeholder="Ej: Nova Finanzas S.R.L."
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">RUT / CUIT</label>
              <input
                type="text"
                value={org.taxId}
                onChange={(e) => setOrg({ ...org, taxId: e.target.value })}
                placeholder="Ej: 21 234567 0001 5"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-mono text-navy focus:border-navy"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">País de constitución</label>
              <select
                value={org.taxCountry}
                onChange={(e) => setOrg({ ...org, taxCountry: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy bg-white focus:border-navy"
              >
                <option value="UY">Uruguay</option>
                <option value="AR">Argentina</option>
                <option value="CL">Chile</option>
                <option value="US">Estados Unidos</option>
              </select>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------- */}
        {/* 2. CONTACTO                                       */}
        {/* ------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-navy" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">Contacto Institucional</h2>
              <p className="text-[11px] text-slate-500">Canales de contacto de la organización.</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                <Phone className="w-3 h-3 inline mr-1" />Teléfono institucional
              </label>
              <input
                type="tel"
                value={org.phone}
                onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                placeholder="Ej: +598 99 123 456"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy focus:border-navy"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                <Mail className="w-3 h-3 inline mr-1" />Email institucional
              </label>
              <input
                type="email"
                value={org.email}
                onChange={(e) => setOrg({ ...org, email: e.target.value })}
                placeholder="Ej: info@novacredito.uy"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy focus:border-navy"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Sitio web</label>
              <input
                type="url"
                value={org.website}
                onChange={(e) => setOrg({ ...org, website: e.target.value })}
                placeholder="Ej: https://novacredito.uy"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy focus:border-navy"
              />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------- */}
        {/* 3. DOMICILIO                                      */}
        {/* ------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-navy" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">Domicilio Registrado</h2>
              <p className="text-[11px] text-slate-500">Domicilio legal de la organización para documentación oficial.</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Calle y número</label>
              <input
                type="text"
                value={org.address}
                onChange={(e) => setOrg({ ...org, address: e.target.value })}
                placeholder="Ej: Av. 18 de Julio 1234, Apto 502"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy focus:border-navy"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ciudad</label>
              <input
                type="text"
                value={org.city}
                onChange={(e) => setOrg({ ...org, city: e.target.value })}
                placeholder="Ej: Montevideo"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy focus:border-navy"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Departamento</label>
              <select
                value={org.department}
                onChange={(e) => setOrg({ ...org, department: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy bg-white focus:border-navy"
              >
                {['Montevideo', 'Canelones', 'Maldonado', 'Colonia', 'Salto', 'Paysandú', 'Rivera', 'Tacuarembó', 'Rocha'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Código Postal</label>
              <input
                type="text"
                value={org.postalCode}
                onChange={(e) => setOrg({ ...org, postalCode: e.target.value })}
                placeholder="Ej: 11600"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-mono text-navy focus:border-navy"
              />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------- */}
        {/* 4. REPRESENTANTE LEGAL                            */}
        {/* ------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center">
              <User className="w-4 h-4 text-navy" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">Representante Legal</h2>
              <p className="text-[11px] text-slate-500">Persona autorizada para firmar documentos oficiales de la organización.</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre completo</label>
              <input
                type="text"
                value={org.legalRepName}
                onChange={(e) => setOrg({ ...org, legalRepName: e.target.value })}
                placeholder="Ej: Dr. Ignacio Notario"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy focus:border-navy"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Cargo</label>
              <select
                value={org.legalRepRole}
                onChange={(e) => setOrg({ ...org, legalRepRole: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy bg-white focus:border-navy"
              >
                {['Director', 'Gerente General', 'Presidente', 'Apoderado', 'Socio Administrador'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                value={org.legalRepEmail}
                onChange={(e) => setOrg({ ...org, legalRepEmail: e.target.value })}
                placeholder="Email del representante"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy focus:border-navy"
              />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------- */}
        {/* 5. DATOS NOTARIALES                               */}
        {/* ------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-navy" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-navy">Datos Notariales</h2>
              <p className="text-[11px] text-slate-500">Escribano responsable y datos para documentos con firma notarial.</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Escribano</label>
              <input
                type="text"
                value={org.notaryName}
                onChange={(e) => setOrg({ ...org, notaryName: e.target.value })}
                placeholder="Esc. María González"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy focus:border-navy"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">N° Matrícula Escribano</label>
              <input
                type="text"
                value={org.notaryRegistration}
                onChange={(e) => setOrg({ ...org, notaryRegistration: e.target.value })}
                placeholder="Ej: 12.345"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-mono text-navy focus:border-navy"
              />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------- */}
        {/* 6. CONFIGURACIÓN OPERACIONAL                      */}
        {/* ------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-navy">Configuración Operacional</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Zona horaria y moneda base de operaciones.</p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Zona Horaria</label>
              <select
                value={org.timezone}
                onChange={(e) => setOrg({ ...org, timezone: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy bg-white focus:border-navy"
              >
                <option value="America/Montevideo">America/Montevideo (UY −3h)</option>
                <option value="America/Buenos_Aires">America/Buenos_Aires (AR −3h)</option>
                <option value="America/Santiago">America/Santiago (CL)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Moneda base</label>
              <select
                value={org.currency}
                onChange={(e) => setOrg({ ...org, currency: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-navy bg-white focus:border-navy"
              >
                <option value="USD">USD — Dólar Americano</option>
                <option value="UYU">UYU — Peso Uruguayo</option>
                <option value="UI">UI — Unidades Indexadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------- */}
        {/* PLAN & FACTURACIÓN (informativo, solo lectura)    */}
        {/* ------------------------------------------------- */}
        <div className="bg-navy text-white rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold">Plan & Facturación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-300 block">Plan actual</span>
              <span className="font-bold text-[#f4b43b] text-base">Professional</span>
            </div>
            <div>
              <span className="text-slate-300 block">Instancia</span>
              <span className="font-bold font-mono">{tenant.slug}</span>
            </div>
            <div>
              <span className="text-slate-300 block">Infraestructura</span>
              <span className="font-bold">HIPOTECALY Cloud</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-2 border-t border-white/10">
            Para cambios de plan, facturación o cancelación, contactar a HIPOTECALY en <span className="text-brand-green font-bold">soporte@hipotecaly.uy</span>.
          </p>
        </div>

        {/* Botón Guardar */}
        <div className="flex items-center justify-between pb-8">
          <p className="text-xs text-slate-400">Los cambios se aplicarán inmediatamente a la configuración institucional de {org.commercialName || tenant.name}.</p>
          <Button
            onClick={handleSave}
            className="bg-[#102d49] text-white hover:bg-[#102d49]/90 px-6 min-h-[44px]"
          >
            {saved ? (
              <><CheckCircle2 className="w-4 h-4 mr-2 text-brand-green" /> Guardado</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Guardar cambios</>
            )}
          </Button>
        </div>

      </div>
    </BackofficeLayout>
  );
};
