import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Weather AGI Error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-red-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Weather AGI Error
              </h1>
              
              <p className="text-gray-600 mb-6">
                Something went wrong with the Weather AGI system. Please try refreshing the page or contact support if the problem persists.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reload Application
                </button>
                
                {import.meta.env.DEV && (
                  <details className="text-left mt-8">
                    <summary className="text-sm font-medium text-gray-700 cursor-pointer mb-2">
                      Error Details (Development Mode)
                    </summary>
                    <div className="bg-gray-100 rounded p-4 text-xs font-mono text-gray-800 overflow-auto max-h-64">
                      <div className="mb-4">
                        <strong>Error:</strong> {this.state.error?.toString()}
                      </div>
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">
                          {this.state.errorInfo?.componentStack}
                        </pre>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary