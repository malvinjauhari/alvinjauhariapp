import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md w-full flex flex-col items-center text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Something went wrong</h2>
            <p className="text-muted mb-8 text-center max-w-sm">
              We've encountered an unexpected error. Please try refreshing the page.
            </p>
            
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors font-medium shadow-lg shadow-primary/25"
            >
              <RefreshCw size={18} />
              Refresh Page
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 p-4 bg-red-500/10 rounded-xl text-left w-full overflow-auto">
                <p className="text-red-500 font-mono text-sm whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
