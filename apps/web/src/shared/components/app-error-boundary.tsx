/* eslint-disable react-refresh/only-export-components */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  readonly children: ReactNode;
}

interface AppErrorBoundaryState {
  readonly error: Error | null;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public override state: AppErrorBoundaryState = {
    error: null,
  };

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      error,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled frontend error.', error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <ErrorFallbackView
          error={this.state.error}
          onReload={this.handleReload}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }

  private readonly handleReload = (): void => {
    window.location.reload();
  };

  private readonly handleRetry = (): void => {
    this.setState({
      error: null,
    });
  };
}

interface ErrorFallbackViewProps {
  readonly error: Error;
  readonly onReload: () => void;
  readonly onRetry: () => void;
}

function ErrorFallbackView({
  error,
  onReload,
  onRetry,
}: ErrorFallbackViewProps) {
  return (
    <main className="error-boundary-shell">
      <section className="error-boundary-card">
        <p className="eyebrow">Application Error</p>
        <h1>Something broke in the frontend.</h1>
        <p className="error-boundary-copy">
          The page hit an unexpected runtime error. You can retry the current
          view or reload the page from a clean state.
        </p>
        <code className="error-boundary-message">{error.message}</code>
        <div className="error-boundary-actions">
          <button className="primary-button" onClick={onRetry} type="button">
            Try again
          </button>
          <button className="secondary-button" onClick={onReload} type="button">
            Reload page
          </button>
        </div>
      </section>
    </main>
  );
}
