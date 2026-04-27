"use client";

import { useEffect } from "react";

export function ClearQueryParam({ param }: { param: string }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(param)) return;
    url.searchParams.delete(param);
    const next = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }, [param]);

  return null;
}

