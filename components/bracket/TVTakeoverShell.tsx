"use client";

import { AnimatePresence, motion } from "motion/react";

// Shared full-screen chrome for TV "big moment" takeovers (pick reveal,
// round transition) — sits above the TV page's z-50 wrapper and completely
// obscures whatever phase content is rendering underneath while active.
export function TVTakeoverShell({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 overflow-hidden bg-ink p-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1.8 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="pointer-events-none absolute h-[480px] w-[480px] rounded-full bg-gold/25 blur-3xl"
            aria-hidden="true"
          />
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
