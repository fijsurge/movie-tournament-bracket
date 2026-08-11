import Image from "next/image";
import { motion } from "motion/react";

export function ChampionBanner({
  bracketName,
  championTitle,
  posterUrl,
}: {
  bracketName: string;
  championTitle: string;
  posterUrl: string | null;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden p-8 text-center">
      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="font-display text-2xl tracking-wide text-cream-dim uppercase"
      >
        {bracketName}
      </motion.p>
      <motion.p
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 14 }}
        className="text-4xl"
      >
        🏆
      </motion.p>
      {posterUrl && (
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1.6 }}
            transition={{ delay: 0.5, duration: 1.1, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gold/30 blur-3xl"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 220, damping: 18 }}
          >
            <Image
              src={posterUrl}
              alt=""
              width={220}
              height={330}
              className="rounded-lg shadow-[0_0_60px_-10px_rgba(232,163,61,0.5)]"
            />
          </motion.div>
        </div>
      )}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="font-display text-5xl tracking-wide text-gold uppercase drop-shadow-[0_0_30px_rgba(232,163,61,0.4)]"
      >
        {championTitle}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="text-xl text-rose"
      >
        Champion!
      </motion.p>
    </div>
  );
}
