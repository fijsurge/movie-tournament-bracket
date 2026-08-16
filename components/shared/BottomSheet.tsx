"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

// The shared full-screen-backdrop + slide-up-sheet shell — first built for
// MovieInfoSheet, reused here for movie search. Controlled by `open` rather
// than by presence of data, so callers that don't have a natural "nullable
// selection" (like a search sheet) don't need to invent one.
//
// Portaled to document.body rather than rendered inline: Framer Motion
// animates via CSS transform, and a transformed ancestor becomes the
// containing block for `position: fixed` descendants — so a sheet nested
// inside another sheet (nomination search's poster-tap preview, opened from
// inside the search sheet) would render clipped to the outer sheet's box
// instead of covering the screen. Portaling makes nesting safe everywhere,
// not just for that one case.
export function BottomSheet({
  open,
  onClose,
  onExitComplete,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onExitComplete?: () => void;
  children: ReactNode;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/70"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
