"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import dynamic from "next/dynamic";

const WholesaleBriefForm = dynamic(
  () =>
    import("@/components/site/WholesaleBriefForm").then((m) => m.WholesaleBriefForm),
  {
    ssr: false,
    loading: () => <WholesaleFormSkeleton />,
  },
);

class WholesaleFormErrorBoundary extends Component<
  { siteKey: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("WholesaleBriefForm failed", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="mt-6 rounded-2xl border border-line bg-paper/80 p-6 text-sm">
          <p className="text-red-600/90">
            The wholesale form could not load. Please refresh the page and try again.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ failed: false })}
            className="mt-4 rounded-full bg-ink px-6 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function WholesaleBriefFormShell({ siteKey }: { siteKey: string }) {
  return (
    <WholesaleFormErrorBoundary siteKey={siteKey}>
      <WholesaleBriefForm siteKey={siteKey} />
    </WholesaleFormErrorBoundary>
  );
}

function WholesaleFormSkeleton() {
  return (
    <div
      className="mt-6 min-h-[280px] animate-pulse rounded-2xl bg-ink/[0.04]"
      aria-hidden
    />
  );
}
