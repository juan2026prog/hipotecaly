import React, { useState } from 'react';
import {
  X,
  Briefcase,
  CheckCircle2,
  FileCheck,
  Printer,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { GeneratedDocument } from '../../lib/docflow/types';
import { DocumentService } from '../../lib/docflow/documentService';
import { Button } from '../ui/Button';

interface NotaryPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  appData?: any;
  onGeneratedPack: (docs: GeneratedDocument[]) => void;
}

export const NotaryPackModal: React.FC<NotaryPackModalProps> = ({
  isOpen,
  onClose,
  caseId,
  appData,
  onGeneratedPack,
}) => {
  const [generating, setGenerating] = useState(false);
  const [packDocs, setPackDocs] = useState<GeneratedDocument[]>([]);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePack = async () => {
    setGenerating(true);
    try {
      const results = await DocumentService.generateNotaryPack(caseId, undefined, appData);
      setPackDocs(results);
      setCompleted(true);
      onGeneratedPack(results);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A3A60]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy">Paquete para Escribano Actuante</h3>
              <p className="text-xs text-slate-500">
                Compilación automática del legajo completo para la formalización de la hipoteca.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-navy rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {!completed ? (
            <div className="space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">
                DocFlow compilará y generará automáticamente con hashes SHA-256 los siguientes 4 documentos esenciales para el escribano:
              </p>

              <div className="space-y-2.5">
                {[
                  { title: 'Ficha Integral del Solicitante', desc: 'Datos personales, CI, estado civil e ingresos verificados.' },
                  { title: 'Ficha Técnica del Inmueble en Garantía', desc: 'Padrón, departamento, superficie y tasación.' },
                  { title: 'Instrucciones y Minuta para Escribano', desc: 'Términos del mutuo hipotecario, partes, monto y tasa.' },
                  { title: 'Checklist Documental y Registral', desc: 'Control de certificados registrales, catastro y tributos.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-navy text-xs">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-2 text-[11px] text-blue-900">
                <ShieldCheck className="w-4 h-4 text-[#0A3A60] shrink-0" />
                <span>Todos los documentos quedan versionados inmutablemente con snapshot de datos.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-xs text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">¡Paquete Notarial Generado con Éxito!</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Se han generado {packDocs.length} documentos listos para su entrega y revisión notarial.
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {packDocs.map((doc: GeneratedDocument) => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <FileCheck className="w-4 h-4 text-brand-green" />
                      <span className="font-bold text-navy">{doc.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {doc.file_hash?.slice(0, 16)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cerrar
          </Button>

          {!completed ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleGeneratePack}
              disabled={generating}
              className="text-xs font-bold bg-[#0A3A60] hover:bg-navy text-white shadow-xs"
            >
              {generating ? (
                'Compilando Legajo Notarial...'
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generar Paquete Notarial Completo
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Imprimir Legajo
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onClose}
                className="text-xs font-bold bg-brand-green text-white"
              >
                Listo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
