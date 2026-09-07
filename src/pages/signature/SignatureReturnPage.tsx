import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Home } from 'lucide-react';
import { Button } from '../../components/ui/Button';


export const SignatureReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const mockProcessId = searchParams.get('mock_process_id') || searchParams.get('firma_gub_session');
  const caseId = searchParams.get('caseId');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulación de sincronización final
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card max-w-md w-full p-8 border border-slate-border shadow-floating text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider block">
            Firma Digital Registrada
          </span>
          <h1 className="text-2xl font-extrabold text-navy">
            {loading ? 'Confirmando proceso de firma...' : 'Proceso de Firma Completado'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tu documento ha sido firmado electrónicamente con sello de tiempo e integridad criptográfica SHA-256.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span>Identificador:</span>
            <span className="font-mono font-bold text-navy">{mockProcessId || 'PROCESO-001'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Validez Legal:</span>
            <span className="font-bold text-emerald-700">Ley N° 18.600</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Estado:</span>
            <span className="font-bold text-navy">Documento Incorporado al Expediente</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Link to={caseId ? `/app/solicitudes/${caseId}` : '/mi-cuenta'}>
            <Button variant="primary" size="lg" fullWidth className="text-xs font-bold bg-brand-green text-white">
              Volver al Expediente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          <Link to="/">
            <Button variant="outline" size="md" fullWidth className="text-xs text-slate-600">
              <Home className="w-3.5 h-3.5 mr-1.5" /> Ir al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
