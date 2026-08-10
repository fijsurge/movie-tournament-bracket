"use client";

import { useState, useSyncExternalStore } from "react";

function noopSubscribe() {
  return () => {};
}

export function FirstTimeTip({ id, children }: { id: string; children: React.ReactNode }) {
  const storageKey = `tip-dismissed-${id}`;
  const storedDismissed = useSyncExternalStore(
    noopSubscribe,
    () => localStorage.getItem(storageKey) === "1",
    () => true, // SSR / pre-hydration snapshot: default hidden to avoid a flash
  );
  const [dismissedOverride, setDismissedOverride] = useState(false);
  const dismissed = storedDismissed || dismissedOverride;

  if (dismissed) return null;

  return (
    <div className="flex items-start justify-between gap-3 rounded border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950">
      <div>{children}</div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(storageKey, "1");
          setDismissedOverride(true);
        }}
        aria-label="Dismiss tip"
        className="shrink-0 text-blue-700 hover:text-blue-900 dark:text-blue-300"
      >
        ✕
      </button>
    </div>
  );
}
