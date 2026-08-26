import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { BackgroundConstellation } from '../branding';
import {
  deriveErrorBoundaryState,
  shouldErrorBoundaryReset,
} from './error-boundary.core';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

/**
 * Global Application Error Boundary.
 *
 * Catches uncaught runtime errors in the component tree and displays a
 * calm, restrained, accessible fallback experience using WX-000 design tokens.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return deriveErrorBoundaryState(error);
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    // In development or error telemetry, report error safely
    if (typeof console !== 'undefined' && console.error) {
      console.error('[Nebula ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && shouldErrorBoundaryReset(prevProps.resetKeys, this.props.resetKeys)) {
      this.handleReset();
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
    });
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render(): ReactNode {
    const { hasError, error, errorId } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (typeof fallback === 'function') {
      return fallback(error || new Error('Unknown runtime error'), this.handleReset);
    }

    if (fallback) {
      return fallback;
    }


    const isDev =
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center justify-center p-6 selection:bg-primary/20 selection:text-foreground"
      >
        <BackgroundConstellation phase="ERROR" opacity={0.06} className="fixed inset-0 z-0" />

        <div className="relative z-10 w-full max-w-lg mx-auto p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col items-center text-center space-y-6">
          {/* Status Indicator Icon */}
          <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
            <AlertCircle className="w-6 h-6" strokeWidth={1.75} aria-hidden="true" />
          </div>

          {/* Heading & Narrative */}
          <div className="space-y-2">
            <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-foreground">
              Something unexpected occurred.
            </h1>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-md">
              Nebula encountered an unexpected interface state. Your session data and
              infrastructure observations remain protected.
            </p>
          </div>

          {/* Error Reference Code */}
          <div className="px-3 py-1.5 rounded-md bg-muted/60 border border-border font-mono text-xs text-muted-foreground">
            <span>Reference ID: </span>
            <span className="font-semibold text-foreground">{errorId || 'ERR_CLIENT_RUNTIME'}</span>
          </div>

          {/* Dev details only when in dev environment */}
          {isDev && error && (
            <div className="w-full text-left p-3 rounded-lg bg-destructive/5 border border-destructive/15 font-mono text-[11px] text-destructive/90 overflow-x-auto max-h-32">
              <p className="font-semibold mb-1">{error.name}: {error.message}</p>
              <p className="opacity-70 whitespace-pre-wrap">{error.stack}</p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-ring cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs font-medium transition-colors focus-ring cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Return Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

