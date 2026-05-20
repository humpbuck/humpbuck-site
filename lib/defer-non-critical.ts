/** Run after first paint / idle so checkout INP and LCP are not competing with analytics. */
export function runWhenIdle(fn: () => void, timeoutMs = 1500): void {
  if (typeof window === "undefined") return;
  const win = window as Window & {
    requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
  };
  if (typeof win.requestIdleCallback === "function") {
    win.requestIdleCallback(() => fn(), { timeout: timeoutMs });
  } else {
    window.setTimeout(fn, Math.min(timeoutMs, 500));
  }
}
