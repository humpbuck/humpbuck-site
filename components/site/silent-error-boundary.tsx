"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Label included in error logs to identify which boundary tripped. */
  name?: string;
  /** Rendered after an error; defaults to `null` (silent). */
  fallback?: ReactNode;
};

type State = { hasError: boolean };

/**
 * Silent error boundary for non-critical server-rendered output (e.g. JSON-LD).
 * Logs the error and renders `fallback` (default nothing) so a failure in
 * invisible SEO/markup never takes down the surrounding page.
 */
export class SilentErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(
      `[SilentErrorBoundary${this.props.name ? `:${this.props.name}` : ""}] swallowed render error`,
      error,
      info?.componentStack ?? "",
    );
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
