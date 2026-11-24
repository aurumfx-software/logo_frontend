import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 40,
            maxWidth: 600,
            margin: '40px auto',
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
            border: '1px solid #F1F5F9',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
            Something went wrong loading this page
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
            An unexpected error occurred while rendering this section. You can retry or refresh the page.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 24px',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
            }}
          >
            🔄 Refresh & Retry
          </button>
          {this.state.error && (
            <details
              style={{
                marginTop: 24,
                textAlign: 'left',
                background: '#F8FAFC',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                fontSize: 12,
                color: '#EF4444',
                overflowX: 'auto',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#64748B' }}>
                Error details
              </summary>
              <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
