import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "../ui/Button";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Something went wrong
          </h1>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            An unexpected error occurred while rendering this page. Our team has been notified.
          </p>

          {Boolean(import.meta.env?.DEV) && this.state.error && (
            <div className="mt-4 max-w-xl text-left bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono text-destructive">
              {this.state.error.toString()}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={this.handleReload}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            <Button
              onClick={this.handleHome}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Return to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
