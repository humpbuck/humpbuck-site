"use client";

import {
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

/** Fire `onTap` on click when the pointer did not move enough to count as a drag/swipe. */
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
      startRef.current = null;
      // Keep draggedRef until click — opening on click avoids mounting UI under an active touch.
    },
    onPointerCancel: () => {
      startRef.current = null;
      draggedRef.current = true;
    },
    onClick: (e: ReactMouseEvent) => {
      if (draggedRef.current) {
        draggedRef.current = false;
        return;
      }
      draggedRef.current = false;
      onTap();
    },
  };
}
