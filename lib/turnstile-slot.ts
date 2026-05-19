"use client";

import { useEffect, useState } from "react";

/** Which storefront form owns the shared Turnstile SDK mount window. */
export type TurnstileSlot = "contact" | "wholesale";

const COOLDOWN_MS = 2500;

let holder: TurnstileSlot | null = null;
let cooldownUntil = 0;

function cooldownRemainingMs(): number {
  return Math.max(0, cooldownUntil - Date.now());
}

function tryAcquire(slot: TurnstileSlot): boolean {
  if (cooldownRemainingMs() > 0) return false;
  if (holder === null || holder === slot) {
    holder = slot;
    return true;
  }
  return false;
}

function release(slot: TurnstileSlot) {
  if (holder !== slot) return;
  holder = null;
  cooldownUntil = Date.now() + COOLDOWN_MS;
}

/**
 * Only one Turnstile widget should mount at a time (e.g. email modal on /wholesale).
 * After release, the other slot waits a short cooldown before mounting.
 */
export function useTurnstileSlot(slot: TurnstileSlot, enabled: boolean) {
  const [slotReady, setSlotReady] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    if (!enabled) {
      release(slot);
      setSlotReady(false);
      setCooldownSec(0);
      return;
    }

    const tick = () => {
      const waitMs = cooldownRemainingMs();
      if (waitMs > 0) {
        setCooldownSec(Math.ceil(waitMs / 1000));
        setSlotReady(false);
        return;
      }
      setCooldownSec(0);
      setSlotReady(tryAcquire(slot));
    };

    tick();
    const timer = window.setInterval(tick, 200);
    return () => {
      window.clearInterval(timer);
      release(slot);
    };
  }, [enabled, slot]);

  return { slotReady, cooldownSec };
}
