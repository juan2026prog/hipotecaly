import React, { useState, useEffect } from 'react';
import { NotaryLayout } from '../../components/notary/NotaryLayout';
import { notaryService, DEMO_NOTARY_PROFILE } from '../../lib/notaryService';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import {
  UserCheck,
  Stamp,
  Building2,
  FileSignature,
  CheckCircle2,
  Save,
  Lock,
  Info,
} from 'lucide-react';
import { NotaryProfile } from '../../lib/types';

export const NotaryProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();

  const [profile, setProfile] = useState<NotaryProfile>(DEMO_NOTARY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Form State
  const [phone, setPhone] = useState(profile.phone || '');
  const [professionalAddress, setProfessionalAddress] = useState(profile.professional_address || '');
  const [professionalCity, setProfessionalCity] = useState(profile.professional_city || '');
  const [electronicDomicile, setElectronicDomicile] = useState(profile.electronic_domicile || '');
  const [university, setUniversity] = useState(profile.university || '');

  useEffect(() => {
    const load = async () => {
      try {
        const p = await notaryService.getNotaryProfile(user?.id || 'u-test-notary');
        if (p) {
          setProfile(p);
          setPhone(p.phone || '');
          setProfessionalAddress(p.professional_address || '');
          setProfessionalCity(p.professional_city || '');
          setElectronicDomicile(p.electronic_domicile || '');
          setUniversity(p.university || '');
        }
      } catch {
        // Fallback
      }
    };
    load();
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await notaryService.saveNotaryProfile(
        user?.id || 'u-test-notary',
        tenant.id,
        {
          phone,
          professional_address: professionalAddress,
          professional_city: professionalCity,
          electronic_domicile: electronicDomicile,
          university,
        }
      );
      if (data) {
        setProfile(data);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 3500);
      }
    } catch {
      // Fallback
    } finally {
      setSaving(false);
    }
  };

  return (
    <NotaryLayout title="Mi Perfil Profesional y Firma Digital">
      {savedToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-teal-500/50 flex items-center space-x-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>Datos operativos del perfil actualizados correctamente</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-black text-xl shrink-0">
            MP
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white">{profile.full_name}</h2>
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Habilitada
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Escribana Pública · N.º Caja Notarial: <span className="font-mono text-teal-300 font-bold">{profile.notarial_fund_affiliate_number}</span>
            </p>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>{profile.notary_office?.name || 'Estudio Fernández & Asociados'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-center">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Firma Avanzada</span>
            <span className="text-xs font-mono font-bold text-teal-300 flex items-center justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Vigente hasta Mayo 2028
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. DATOS PERSONALES */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>Datos Personales</span>
              </h3>
              <span className="text-[10px] text-slate-400">Identidad del usuario</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre</label>
                  <input
                    type="text"
                    disabled
                    value={profile.first_name || 'María'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Apellidos</label>
                  <input
                    type="text"
                    disabled
                    value={profile.last_name || 'Pérez Morales'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cédula de Identidad</label>
                  <input
                    type="text"
                    disabled
                    value={profile.document_number || '3.892.415-8'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-mono font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    disabled
                    value={profile.email || 'escribano@hipotecaly.uy'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teléfono Móvil de Contacto</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="099 876 543"
                />
              </div>
            </div>
          </div>

          {/* 2. DATOS PROFESIONALES Y CAJA NOTARIAL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Stamp className="w-4 h-4 text-teal-600" />
                <span>Datos Profesionales & Matrícula</span>
              </h3>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Fuente DOCFLOW
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    N.º de afiliado a Caja Notarial
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={profile.notarial_fund_affiliate_number || '48.291'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold cursor-not-allowed"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Verificado con Caja Notarial</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Universidad</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Domicilio Profesional</label>
                <input
                  type="text"
                  value={professionalAddress}
                  onChange={(e) => setProfessionalAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
                  placeholder="Rincón 487 Piso 3 Esc. 302"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ciudad / Departamento</label>
                  <input
                    type="text"
                    value={professionalCity}
                    onChange={(e) => setProfessionalCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
                    placeholder="Montevideo"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Domicilio Electrónico</label>
                  <input
                    type="text"
                    value={electronicDomicile}
                    onChange={(e) => setElectronicDomicile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
                    placeholder="maria.perez@notarios.org.uy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. ESTUDIO NOTARIAL & CARGO */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>Estudio Notarial</span>
              </h3>
              <span className="text-[10px] text-slate-400">Pertenencia institucional</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Nombre Comercial:</span>
                <span className="font-bold text-slate-900">{profile.notary_office?.name || 'Estudio Fernández & Asociados'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Razón Social:</span>
                <span className="text-slate-700">{profile.notary_office?.legal_name || 'Fernández & Pérez Notarios S.R.L.'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">RUT:</span>
                <span className="font-mono text-slate-700">{profile.notary_office?.tax_id || '21.849.201.0019'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">Cargo / Función:</span>
                <span className="font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  Escribana Responsable
                </span>
              </div>
            </div>
          </div>

          {/* 4. FIRMA DIGITAL AVANZADA & SEGURIDAD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileSignature className="w-4 h-4 text-teal-600" />
                <span>Firma Digital Avanzada</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Ley N° 18.600
              </span>
            </div>

            <div className="p-4 rounded-xl bg-teal-950/5 border border-teal-500/30 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Estado Operativo:</span>
                <span className="font-bold text-emerald-700 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activa y Configurada
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Proveedor Acreditado:</span>
                <span className="font-bold text-slate-800">{profile.certificate_provider || 'Abitab / Firma Gub'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Identificador de Certificado:</span>
                <span className="font-mono text-slate-700">{profile.digital_certificate_identifier || 'UY-CA-ABITAB-48291-MP'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-semibold">Vencimiento:</span>
                <span className="font-mono font-bold text-slate-900">18 de Mayo de 2028</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start space-x-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Seguridad Estricta:</strong> HIPOTECALY no almacena tu clave privada ni PIN. Toda firma se valida directamente mediante el proveedor de certificación notarial acreditado.
              </span>
            </div>
          </div>
        </div>

        {/* Botón Guardar Cambios */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2"
          >
            <Save className="w-4 h-4 text-teal-400" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios del Perfil'}</span>
          </button>
        </div>
      </form>
    </NotaryLayout>
  );
};
