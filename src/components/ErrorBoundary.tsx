import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Ha ocurrido un error inesperado en la aplicación.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FINDI ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendly = 'Algo ha fallado al cargar tus datos. Por favor, recarga la página.';
      if (this.state.message.includes('Missing or insufficient permissions')) {
        friendly = 'No tienes permisos para acceder a este recurso. Comprueba tu sesión e inténtalo de nuevo.';
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-black p-6">
          <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/10 dark:border-[#333336] p-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EF4444]/15 text-[#EF4444]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              Se ha producido un problema
            </h1>
            <p className="mt-2 text-sm text-[#6e6e73] dark:text-[#86868b]">{friendly}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-[#022C22] hover:bg-[#059669] hover:text-white active:scale-[0.97]"
            >
              <RotateCcw className="w-4 h-4" />
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
