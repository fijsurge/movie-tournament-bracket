"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowLeftIcon } from "@/components/shared/Icons";

const COMMIT_THRESHOLD_PX = 100;
const HINT_DELAY_MS = 4000;

interface SwipeMovie {
  title: string;
  posterUrl: string | null;
}

// A Tinder-style fast lean for the head-to-head matchup, sitting above the
// detailed per-category scorer (not replacing it) — see swipeToScores in
// lib/swipe-vote.ts for what a completed swipe actually fills in.
export function SwipeMatchupCard({
  movieA,
  movieB,
  onSwipe,
}: {
  movieA: SwipeMovie;
  movieB: SwipeMovie;
  onSwipe: (winner: "A" | "B") => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<"A" | "B" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const startXRef = useRef(0);

  // Nudges someone who seems stuck — cleared the moment they actually touch
  // the card, since they've clearly found it by then.
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (exiting) return;
    setShowHint(false);
    setDragging(true);
    startXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragX(e.clientX - startXRef.current);
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dragX) > COMMIT_THRESHOLD_PX) {
      // Swiping the card toward a side favors the movie under the finger:
      // dragging right (positive dx) favors B (shown on the right), left
      // favors A (shown on the left) — matches the poster layout below.
      const winner = dragX > 0 ? "B" : "A";
      setExiting(winner);
      setTimeout(() => onSwipe(winner), 200);
    } else {
      setDragX(0);
    }
  }

  const rotation = dragX / 20;
  const leanA = dragX < -20 ? Math.min(1, -dragX / 90) : 0;
  const leanB = dragX > 20 ? Math.min(1, dragX / 90) : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-56 w-full items-center justify-center overflow-hidden">
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative flex w-full max-w-xs cursor-grab touch-none items-center justify-center gap-4 rounded-xl bg-surface p-4 shadow-[0_16px_36px_-16px_rgba(0,0,0,0.75)] active:cursor-grabbing"
          style={{
            transform: exiting
              ? `translateX(${exiting === "B" ? 600 : -600}px) rotate(${exiting === "B" ? 30 : -30}deg)`
              : `translateX(${dragX}px) rotate(${rotation}deg)`,
            opacity: exiting ? 0 : 1,
            transition: dragging ? "none" : "transform 0.35s cubic-bezier(.2,.8,.2,1), opacity 0.2s",
          }}
        >
          <span
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-rose bg-ink/90 px-4 py-2 text-center font-display text-lg tracking-wide text-rose uppercase"
            style={{ opacity: leanA }}
          >
            {movieA.title}
          </span>
          <span
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-gold bg-ink/90 px-4 py-2 text-center font-display text-lg tracking-wide text-gold uppercase"
            style={{ opacity: leanB }}
          >
            {movieB.title}
          </span>
          <div className="flex flex-col items-center gap-1">
            {movieA.posterUrl && (
              <Image src={movieA.posterUrl} alt="" width={72} height={108} className="rounded-md" draggable={false} />
            )}
            <span className="max-w-[80px] truncate text-xs text-cream-dim">{movieA.title}</span>
          </div>
          <span className="font-display text-rose">vs</span>
          <div className="flex flex-col items-center gap-1">
            {movieB.posterUrl && (
              <Image src={movieB.posterUrl} alt="" width={72} height={108} className="rounded-md" draggable={false} />
            )}
            <span className="max-w-[80px] truncate text-xs text-cream-dim">{movieB.title}</span>
          </div>
        </div>

        {showHint && !exiting && (
          <>
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1 flex -translate-y-1/2 items-center gap-1 rounded-full border border-gold bg-ink/90 py-1.5 pr-3 pl-2 text-gold"
              animate={{ x: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            >
              <ArrowLeftIcon className="h-5 w-5 shrink-0" />
              <span className="font-display text-xs tracking-wide uppercase">Swipe</span>
            </motion.div>
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-1 rounded-full border border-gold bg-ink/90 py-1.5 pr-2 pl-3 text-gold"
              animate={{ x: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            >
              <span className="font-display text-xs tracking-wide uppercase">Swipe</span>
              <ArrowLeftIcon className="h-5 w-5 shrink-0 rotate-180" />
            </motion.div>
          </>
        )}
      </div>
      {showHint && !exiting && (
        <div className="flex flex-col items-center gap-0.5">
          <motion.div
            aria-hidden="true"
            className="text-gold"
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
          >
            <ArrowLeftIcon className="h-5 w-5 -rotate-90" />
          </motion.div>
          <span className="font-display text-xs tracking-wide text-gold uppercase">or rank manually</span>
        </div>
      )}
    </div>
  );
}
