import { Component } from 'react';

export default class StorefrontErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.group('%c[StorefrontErrorBoundary] Crash', 'color:#c0392b;font-weight:bold');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component stack:', info.componentStack);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          textAlign: 'center',
          fontFamily: 'inherit'
        }}>
          <p style={{ fontSize: '12px', letterSpacing: '0.12em', color: '#888', marginBottom: '12px', textTransform: 'uppercase' }}>
            Something went wrong
          </p>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
            This page could not be loaded
          </h2>
          <p style={{ color: '#666', marginBottom: '24px', maxWidth: '420px', fontSize: '14px', lineHeight: 1.6 }}>
            {error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px',
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              letterSpacing: '0.05em'
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
