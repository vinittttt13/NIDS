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
        <div className="min-h-screen bg-[#080c14] text-[#f1f5f9] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-white mb-1">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-4">
              A component failed to render. This has been logged to the console.
            </p>
            <pre className="text-left text-[11px] text-red-300/80 bg-black/30 rounded-lg p-3 mb-4 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
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
