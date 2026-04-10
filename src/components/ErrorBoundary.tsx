import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Mock for Crash Reporting Tool (e.g. Sentry / Datadog)
    console.error("🔥 CRASH REPORTED: App Crash Caught by Boundary:", error, errorInfo);
    // TODO: Init valid telemetry token 
    // Sentry.captureException(error, { extra: errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
          >
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong.</h1>
            <p className="text-gray-600 mb-6 text-sm">
              We've encountered an unexpected error. Our system monitors have been notified!
              {this.state.error?.message && (
                <span className="block mt-4 font-mono text-xs text-red-500 bg-red-50 p-2 rounded max-h-32 overflow-y-auto">
                  {this.state.error.message}
                </span>
              )}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="flex items-center justify-center w-full gap-2 bg-primary hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              <RefreshCw size={18} />
              Reload Page
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
