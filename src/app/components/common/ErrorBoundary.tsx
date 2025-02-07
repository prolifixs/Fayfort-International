'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    this.logError(error, errorInfo);
    
    // Attempt recovery
    this.attemptRecovery(error);
  }

  private logError(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error caught by boundary:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  private attemptRecovery(error: Error) {
    // Clear local storage if it's a storage error
    if (error.message.includes('localStorage')) {
      localStorage.clear();
    }

    // Reset app state if it's a state-related error
    if (error.message.includes('state')) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="mt-2 text-sm text-red-600">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 