import { Component } from 'react';

export default class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, pageName: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Extract the first recognisable page component name from the React component stack
    const stackLines = (errorInfo.componentStack || '').split('\n');
    const pageMatch = stackLines
      .map(l => l.trim())
      .find(l => l.match(/^at\s+\w*Page\b/));
    const pageName = pageMatch ? pageMatch.replace(/^at\s+/, '').split(' ')[0] : 'Unknown page';

    this.setState({ pageName });

    console.group(`%c[AdminErrorBoundary] Crash in ${pageName}`, 'color:#c0392b;font-weight:bold');
    console.error('Message :', error.message);
    console.error('JS stack :', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      const { error, pageName } = this.state;
      return (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ marginBottom: '8px' }}>Something went wrong</h2>
          {pageName && (
            <p style={{ color: '#999', fontSize: '13px', marginBottom: '8px' }}>
              Page: <strong>{pageName}</strong>
            </p>
          )}
          <p style={{ color: '#666', marginBottom: '24px', maxWidth: '480px' }}>
            {error?.message || 'An unexpected error occurred in the admin panel.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
