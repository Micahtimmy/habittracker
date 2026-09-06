import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('StreakKeeper UI Error Caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-red-800/80 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 mb-4 border border-red-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Something went wrong</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              An unexpected error occurred while rendering the page. Please reload the application.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
