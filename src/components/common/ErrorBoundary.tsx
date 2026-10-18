import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render errors anywhere below it so a single bad page/component
 * doesn't white-screen the entire SOC dashboard (previously no boundary
 * existed anywhere — see docs/GAPS_AND_FLAWS.md §5.5).
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-ink-950 text-paper-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full border border-sev-critical/40 bg-ink-800 p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-sev-critical mx-auto mb-3" strokeWidth={1.75} />
            <h1 className="text-[15px] text-paper-100 mb-1">Something went wrong</h1>
            <p className="text-[13px] text-paper-400 mb-4">
              A component failed to render. This has been logged to the console.
            </p>
            <pre className="text-left text-[11px] text-paper-300 bg-ink-900 border border-line-700 p-3 mb-4 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-phos-400 hover:bg-phos-500 text-ink-950 text-[13px] font-medium transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
