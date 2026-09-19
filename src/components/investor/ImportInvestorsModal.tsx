import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import {
  parseFileContent,
  mapRawRowsToInvestors,
  ParsedInvestorRow,
} from '../../lib/investorImportService';
import { createLenderWithRules, Lender } from '../../lib/lendersService';
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ImportInvestorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  existingLenders: Lender[];
  onSuccess: (newCount: number) => void;
}

export const ImportInvestorsModal: React.FC<ImportInvestorsModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  existingLenders,
  onSuccess,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'summary'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedInvestorRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);

  const [importResults, setImportResults] = useState<{
    successful: number;
    failed: number;
    errors: string[];
  }>({ successful: 0, failed: 0, errors: [] });

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const rawJson = parseFileContent(buffer, file.name);
        if (rawJson.length === 0) {
          alert('El archivo no contiene filas o está vacío.');
          return;
        }

        const mapped = mapRawRowsToInvestors(rawJson, existingLenders);
        setParsedRows(mapped.allRows);
        setValidCount(mapped.validRows.length);
        setErrorCount(mapped.errorRows.length);
        setDuplicateCount(mapped.duplicateRows.length);
        setStep('preview');
      } catch (err: unknown) {
        alert(
          'Error al procesar el archivo: ' +
            (err instanceof Error ? err.message : 'Formato inválido')
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = async () => {
    setStep('importing');
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    const rowsToImport = parsedRows.filter((r) => {
      if (r._status === 'valid') return true;
      if (r._status === 'possible_duplicate' && includeDuplicates) return true;
      return false;
    });

    for (const item of rowsToImport) {
      try {
        const res = await createLenderWithRules({
          organizationId,
          name: item.nombre,
          displayName: item.nombre,
          lenderType: item.tipo || 'Persona',
          contactName: item.contacto || undefined,
          contactEmail: item.email || undefined,
          contactPhone: item.telefono || undefined,
          availableCapital: item.capital_disponible,
          currency: item.moneda || 'USD',
          status: 'active',
          notes: item.notas ? `Importado de archivo ${fileName}. Notas: ${item.notas}` : `Importado de ${fileName}`,
          source: 'import',
          rules: {
            min_loan: item.monto_min || 10000,
            max_loan: item.monto_max || 200000,
            min_rate: item.tasa_min || 11.0,
            max_ltv: item.ltv_max || 0.40,
            min_term_months: item.plazo_min || 12,
            max_term_months: item.plazo_max || 60,
            accepted_property_types: item.tipos_inmueble || ['Apartamento', 'Casa', 'Local Comercial', 'Campo'],
            accepted_departments: item.departamentos || ['Montevideo', 'Canelones', 'Maldonado'],
            accepted_modalities: item.modalidades || ['solo_intereses', 'capital_e_intereses'],
          },
        });

        if (res.error || !res.lender) {
          failed++;
          errors.push(`${item.nombre}: ${res.error || 'Error desconocido'}`);
        } else {
          successful++;
        }
      } catch (err: unknown) {
        failed++;
        errors.push(`${item.nombre}: ${err instanceof Error ? err.message : 'Error'}`);
      }
    }

    setImportResults({ successful, failed, errors });
    setStep('summary');
    onSuccess(successful);
  };

  const handleReset = () => {
    setStep('upload');
    setFileName('');
    setParsedRows([]);
    setValidCount(0);
    setErrorCount(0);
    setDuplicateCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn text-left">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Importar Cartera de Inversores</h2>
              <p className="text-xs text-slate-300">
                Soporte nativo para archivos CSV y planillas de cálculo Excel (.XLSX)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido según Step */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-8 text-center transition-colors bg-slate-50 flex flex-col items-center justify-center">
                <Upload className="w-12 h-12 text-slate-400 mb-3" />
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Seleccioná tu archivo CSV o Excel (.xlsx)
                </h3>
                <p className="text-xs text-slate-500 max-w-md mb-4">
                  El sistema mapea automáticamente columnas como: Nombre, Tipo, Email, Teléfono,
                  Capital Disponible, Montos Mín/Máx, LTV, Plazos y Notas.
                </p>
                <label className="cursor-pointer">
                  <span className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm inline-flex items-center">
                    <Upload className="w-4 h-4 mr-2" /> Examinar archivo
                  </span>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">
                  Encabezados sugeridos para auto-detección:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-600">
                  <div>• nombre / razon_social</div>
                  <div>• tipo / persona_empresa</div>
                  <div>• email / correo</div>
                  <div>• telefono / celular</div>
                  <div>• capital / capital_disponible</div>
                  <div>• monto_min / monto_max</div>
                  <div>• ltv_max / max_ltv</div>
                  <div>• plazo_min / plazo_max</div>
                  <div>• departamentos / zonas</div>
                  <div>• tipos_inmueble</div>
                  <div>• modalidades</div>
                  <div>• notas / observaciones</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION */}
          {step === 'preview' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block">Archivo cargado</span>
                  <strong className="text-sm font-bold text-slate-900">{fileName}</strong>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                    ✓ {validCount} válidos
                  </span>
                  {duplicateCount > 0 && (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold">
                      ⚠ {duplicateCount} posibles duplicados
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg font-bold">
                      ✕ {errorCount} con errores
                    </span>
                  )}
                </div>
              </div>

              {duplicateCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900 space-y-2">
                  <div className="flex items-center space-x-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Se detectaron registros con email/teléfono coincidentes</span>
                  </div>
                  <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDuplicates}
                      onChange={(e) => setIncludeDuplicates(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      Importar también los posibles duplicados (crear nuevos registros independientes)
                    </span>
                  </label>
                </div>
              )}

              {/* Tabla de Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Estado</th>
                      <th className="p-2.5">Nombre</th>
                      <th className="p-2.5">Tipo</th>
                      <th className="p-2.5">Contacto</th>
                      <th className="p-2.5">Capital</th>
                      <th className="p-2.5">LTV / Montos</th>
                      <th className="p-2.5">Detalles / Diagnóstico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parsedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={
                          r._status === 'error'
                            ? 'bg-rose-50/60'
                            : r._status === 'possible_duplicate'
                            ? 'bg-amber-50/50'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="p-2.5">
                          {r._status === 'valid' && (
                            <span className="text-emerald-700 font-bold flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Válido
                            </span>
                          )}
                          {r._status === 'possible_duplicate' && (
                            <span className="text-amber-700 font-bold flex items-center">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Duplicado
                            </span>
                          )}
                          {r._status === 'error' && (
                            <span className="text-rose-700 font-bold flex items-center">
                              <AlertCircle className="w-3.5 h-3.5 mr-1" /> Error
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{r.nombre}</td>
                        <td className="p-2.5">{r.tipo || 'Persona'}</td>
                        <td className="p-2.5">
                          <div>{r.email || '—'}</div>
                          <div className="text-[10px] text-slate-400">{r.telefono}</div>
                        </td>
                        <td className="p-2.5 font-mono">
                          {r.capital_disponible
                            ? `USD ${r.capital_disponible.toLocaleString('es-UY')}`
                            : 'No informado'}
                        </td>
                        <td className="p-2.5">
                          <div>LTV: {r.ltv_max ? `${Math.round(r.ltv_max * 100)}%` : '40%'}</div>
                          <div className="text-[10px] text-slate-400">
                            {r.monto_min && r.monto_max
                              ? `USD ${r.monto_min.toLocaleString()} - ${r.monto_max.toLocaleString()}`
                              : 'Rango estándar'}
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-500">
                          {r._errors && r._errors.length > 0 ? (
                            <span className="text-rose-700 font-semibold">{r._errors.join(', ')}</span>
                          ) : r._duplicateReason ? (
                            <span className="text-amber-700">{r._duplicateReason}</span>
                          ) : (
                            <span>Listo para persistir</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: IMPORTING SPINNER */}
          {step === 'importing' && (
            <div className="p-12 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">
                Guardando cartera en Supabase...
              </h3>
              <p className="text-xs text-slate-500">
                Creando registros canónicos en <code className="font-mono">lenders</code> y{' '}
                <code className="font-mono">lender_rules</code>
              </p>
            </div>
          )}

          {/* STEP 4: SUMMARY */}
          {step === 'summary' && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Importación Finalizada con Éxito
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Se persistieron <strong>{importResults.successful}</strong> nuevos inversores con sus
                  criterios de inversión en la base de datos de tu organización.
                </p>
              </div>

              {importResults.failed > 0 && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-left text-xs text-rose-800 space-y-1">
                  <div className="font-bold">Fallaron {importResults.failed} registros:</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {importResults.errors.slice(0, 5).map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleReset} className="text-xs">
                ← Cambiar archivo
              </Button>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleExecuteImport}
                  disabled={validCount === 0 && (!includeDuplicates || duplicateCount === 0)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirmar e Importar ({validCount + (includeDuplicates ? duplicateCount : 0)}){' '}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </>
          )}

          {step === 'upload' && (
            <div className="w-full text-right">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          )}

          {step === 'summary' && (
            <div className="w-full text-right">
              <Button
                variant="primary"
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Cerrar y Ver Listado
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
