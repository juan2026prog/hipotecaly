// ==============================================================================
// HIPOTECALY: Sección 1 - Datos Personales
// Concentra exclusivamente información de la persona, contacto, laboral, ingresos,
// estado de verificación de identidad KYC y documentación personal reutilizable.
// ==============================================================================

import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  DollarSign,
  ShieldCheck,
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import {
  ClientPersonalData,
  PersonalDocumentItem,
  clientPortalService,
} from '../../lib/clientPortalService';
import { KycStartModal } from '../../components/identity/KycStartModal';

interface PersonalDataSectionProps {
  data: ClientPersonalData;
  onRefresh: () => void;
}

export const PersonalDataSection: React.FC<PersonalDataSectionProps> = ({
  data,
  onRefresh,
}) => {
  // Modal de edición de datos personales
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: data.firstName,
    lastName: data.lastName,
    idNumber: data.idNumber,
    phone: data.phone,
    address: data.address,
    city: data.city,
    department: data.department,
    occupation: data.occupation,
    incomeType: data.incomeType,
    monthlyIncome: data.monthlyIncome,
  });
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modal de subida de documento personal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PersonalDocumentItem | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Modal KYC
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSavePersonalData = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await clientPortalService.updatePersonalData(formData);
    setSaving(false);
    setEditModalOpen(false);
    showToast('Datos personales actualizados correctamente.');
    onRefresh();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedDoc) return;
    const file = e.target.files[0];
    setUploadingDoc(true);

    await clientPortalService.uploadPersonalDocument(selectedDoc.id, file.name);
    setUploadingDoc(false);
    setUploadModalOpen(false);
    showToast(`Documento "${selectedDoc.name}" cargado y enviado a revisión.`);
    onRefresh();
  };

  const getDocStatusBadge = (status: PersonalDocumentItem['status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Verificado
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
            En revisión
          </span>
        );
      case 'requires_update':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
            Requiere actualización
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast de Éxito */}
      {successToast && (
        <div className="p-4 bg-emerald-900 text-white rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-200">✕</button>
        </div>
      )}

      {/* Header de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#245f91]">
            Tu Perfil
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-0.5">
            Datos personales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Información de titularidad, datos de contacto, ingresos y documentación personal reutilizable.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFormData({
              firstName: data.firstName,
              lastName: data.lastName,
              idNumber: data.idNumber,
              phone: data.phone,
              address: data.address,
              city: data.city,
              department: data.department,
              occupation: data.occupation,
              incomeType: data.incomeType,
              monthlyIncome: data.monthlyIncome,
            });
            setEditModalOpen(true);
          }}
          className="self-start sm:self-auto text-xs font-bold flex items-center border-slate-300 hover:bg-slate-50"
        >
          <Edit2 className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
          Editar datos
        </Button>
      </div>

      {/* ============================================================ */}
      {/* 1. INFORMACIÓN PERSONAL Y CONTACTO                          */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tarjeta de Identidad y Contacto */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center">
              <User className="w-4 h-4 mr-2 text-[#102d49]" />
              Identidad y Contacto
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {data.idType}: {data.idNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Nombre y Apellido
              </span>
              <strong className="text-slate-900 text-sm font-bold block">
                {data.firstName} {data.lastName}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Cédula / Documento
              </span>
              <strong className="text-slate-900 text-sm font-bold font-mono block">
                {data.idNumber}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center">
                <Mail className="w-3 h-3 mr-1 text-slate-400" /> Correo Electrónico
              </span>
              <strong className="text-slate-900 font-semibold block truncate">
                {data.email}
              </strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center">
                <Phone className="w-3 h-3 mr-1 text-slate-400" /> Teléfono Celular
              </span>
              <strong className="text-slate-900 font-semibold block">
                {data.phone}
              </strong>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center">
                <MapPin className="w-3 h-3 mr-1 text-slate-400" /> Domicilio Declarado
              </span>
              <strong className="text-slate-900 font-semibold block">
                {data.address} · {data.city}, {data.department}
              </strong>
            </div>
          </div>
        </div>

        {/* Tarjeta de Verificación de Identidad (KYC) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-[#102d49]" />
                Identidad Digital
              </h3>
              {data.kycStatus === 'verified' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Verificado
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  Pendiente
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-serif font-bold text-slate-900">
                {data.kycStatus === 'verified'
                  ? 'Identidad Oficial Validada'
                  : 'Verificación Biométrica Requerida'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {data.kycStatus === 'verified'
                  ? 'Tu identidad y prueba de vida fueron cotejadas conforme a los estándares de seguridad de Uruguay.'
                  : 'Para formalizar solicitudes y firmar digitalmente, completá la validación facial desde tu teléfono.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            {data.kycStatus === 'verified' ? (
              <div className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/60">
                <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                <span>Biometría y documento activos</span>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => setKycModalOpen(true)}
                className="!bg-[#102d49] text-white font-bold text-xs !rounded-xl"
              >
                <Camera className="w-4 h-4 mr-2" /> Iniciar Verificación KYC
              </Button>
            )}
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 2. DATOS LABORALES E INGRESOS                                */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center">
            <Briefcase className="w-4 h-4 mr-2 text-[#102d49]" />
            Información Laboral e Ingresos
          </h3>
          <span className="text-xs text-slate-400">
            Reutilizable en tus solicitudes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Tipo de Actividad
            </span>
            <strong className="text-slate-900 text-sm font-bold capitalize block">
              {data.incomeType.replace('_', ' ')}
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Ocupación / Cargo
            </span>
            <strong className="text-slate-900 text-sm font-semibold block">
              {data.occupation}
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center">
              <DollarSign className="w-3 h-3 mr-1 text-slate-400" /> Ingreso Mensual Declarado
            </span>
            <strong className="text-slate-900 text-sm font-bold font-mono block">
              $ {data.monthlyIncome.toLocaleString('es-UY')} UYU
            </strong>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BLOQUE SECUNDARIO: DOCUMENTACIÓN PERSONAL REUTILIZABLE   */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-[#102d49]" />
              Documentación personal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Documentos de identidad y domicilio reutilizables entre todas tus solicitudes
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {data.personalDocuments.map((doc) => (
            <div
              key={doc.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#102d49] shrink-0" />
                  <span className="font-bold text-slate-900 text-xs">{doc.name}</span>
                </div>
                <p className="text-slate-500 text-[11px] pl-6 leading-relaxed">
                  {doc.description}
                </p>
                {doc.fileName && (
                  <span className="text-[10px] font-mono text-slate-400 pl-6 block">
                    Archivo: {doc.fileName} · Actualizado el {doc.updatedAt}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 pl-6 sm:pl-0 shrink-0">
                {getDocStatusBadge(doc.status)}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setUploadModalOpen(true);
                  }}
                  className="text-xs font-bold text-[#102d49] hover:bg-slate-50 !rounded-xl"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  {doc.fileName ? 'Reemplazar' : 'Subir'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: EDITAR DATOS PERSONALES                               */}
      {/* ============================================================ */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  Editar Datos Personales
                </h3>
                <p className="text-xs text-slate-500">
                  Actualizá tu información de contacto y actividad.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePersonalData} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nombre"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Apellido"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Cédula / Documento"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  required
                />
                <Input
                  label="Teléfono Celular"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Dirección / Domicilio"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ciudad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
                <Input
                  label="Departamento"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                />
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Información Laboral e Ingresos
                </span>

                <Input
                  label="Ocupación / Cargo / Profesión"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />

                <CurrencyInput
                  label="Ingreso Mensual Líquido (UYU)"
                  value={formData.monthlyIncome}
                  onChange={(val) => setFormData({ ...formData, monthlyIncome: val })}
                  currency="UYU"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  className="!bg-[#102d49] text-white font-bold"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SUBIR DOCUMENTO PERSONAL                              */}
      {/* ============================================================ */}
      {uploadModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Subir {selectedDoc.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Formatos permitidos: PDF, JPG, PNG (máx. 15MB).
                </p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-[#102d49] rounded-2xl p-6 text-center cursor-pointer transition block bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">
                  {uploadingDoc ? 'Cargando archivo...' : 'Seleccionar archivo o sacar foto'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Se almacena de forma segura bajo cifrado y RLS
                </span>
              </label>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadModalOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KYC START */}
      <KycStartModal
        isOpen={kycModalOpen}
        caseId="user-kyc-session"
        applicantName={`${data.firstName} ${data.lastName}`}
        onClose={() => setKycModalOpen(false)}
        onSessionCreated={() => {
          setKycModalOpen(false);
          showToast('Validación biométrica iniciada correctamente.');
          onRefresh();
        }}
      />
    </div>
  );
};
