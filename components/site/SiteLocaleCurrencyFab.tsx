"use client";

import { useState } from "react";
import { CurrencySwitcherFab } from "@/components/site/CurrencySwitcherFab";
import { LocaleSwitcherFab } from "@/components/site/LocaleSwitcherFab";

/** Fixed bottom-left locale + display-currency controls (only one popover open at a time). */
export function SiteLocaleCurrencyFab() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <div
      className="fixed bottom-6 left-6 z-40 flex items-end gap-1.5 md:bottom-8 md:left-8"
    >
      <LocaleSwitcherFab
        fabCoordination={{
          menuId: "locale",
          openMenu,
          onOpenMenuChange: setOpenMenu,
        }}
      />
      <CurrencySwitcherFab
        fabCoordination={{
          menuId: "currency",
          openMenu,
          onOpenMenuChange: setOpenMenu,
        }}
      />
    </div>
  );
}
