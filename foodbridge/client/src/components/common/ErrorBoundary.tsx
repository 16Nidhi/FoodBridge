import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
  info: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> | null {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console — developer can see stacktrace
    console.error('Captured error in ErrorBoundary:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:24,fontFamily:'Inter, sans-serif',color:'#111827'}}>
          <h2 style={{color:'#dc2626'}}>Something went wrong</h2>
          <p style={{color:'#374151'}}>An exception occurred while rendering the app. See the developer console for details.</p>
          <div style={{marginTop:12,background:'#F8FAFC',padding:12,borderRadius:8,border:'1px solid #E6EAF0'}}>
            <strong>Error:</strong>
            <pre style={{whiteSpace:'pre-wrap',marginTop:8,color:'#111827'}}>{this.state.error?.message}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
