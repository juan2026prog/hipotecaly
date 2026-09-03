import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logueo seguro sin filtrar secretos ni datos sensibles
    console.error('Unhandled application error captured by ErrorBoundary:', error.message, errorInfo.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-border shadow-floating text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-navy">Ocurrió un error inesperado</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                El sistema detectó un inconveniente temporal en la interfaz. Tus datos y solicitudes registradas en la base de datos se encuentran completamente seguros.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" size="md" className="flex-1 justify-center" onClick={this.handleReload}>
                <RefreshCw className="w-4 h-4 mr-2" /> Recargar página
              </Button>
              <Button variant="primary" size="md" className="flex-1 justify-center" onClick={this.handleGoHome}>
                <Home className="w-4 h-4 mr-2" /> Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
