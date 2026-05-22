"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

/** Fire `onTap` only when the pointer did not move enough to count as a drag/swipe. */
export function useTapWithoutDrag(onTap: () => void) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);

  return {
    onPointerDown: (e: ReactPointerEvent) => {
      startRef.current = { x: e.clientX, y: e.clientY };
      draggedRef.current = false;
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
        draggedRef.current = true;
      }
    },
    onPointerUp: () => {
      if (!draggedRef.current) onTap();
      startRef.current = null;
      draggedRef.current = false;
    },
    onPointerCancel: () => {
      startRef.current = null;
      draggedRef.current = false;
    },
  };
}
