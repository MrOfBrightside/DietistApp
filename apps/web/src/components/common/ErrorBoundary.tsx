import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Något gick fel
              </h1>
              <p className="text-gray-600 mb-6">
                Ett oväntat fel uppstod i applikationen.
              </p>
            </div>

            <div className="card bg-red-50 border-red-200">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Felmeddelande:
              </h2>
              <p className="text-sm text-red-700 font-mono break-words">
                {this.state.error?.message || 'Okänt fel'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="btn btn-primary w-full"
              >
                Återgå till startsidan
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary w-full"
              >
                Ladda om sidan
              </button>
            </div>

            <div className="text-center text-sm text-gray-500">
              Om problemet kvarstår, kontakta support.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
