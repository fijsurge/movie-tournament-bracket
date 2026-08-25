"use client";

import { useEffect, useState } from "react";
import { BracketTree } from "@/components/bracket/BracketTree";
import type { BracketStateRound } from "@/types/bracket";

const ZOOM_STORAGE_KEY = "bracket-zoom-level";
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

// Wraps BracketTree with an in-app zoom control (CSS `zoom`, not
// `transform: scale` — it actually shrinks/grows the scrollable footprint
// instead of just the visual size, so zooming out really does let more of
// a large bracket fit without fighting the tree's own overflow-x-auto).
// Shared by TVView and the voter-facing completed-bracket view so both get
// the same control instead of each reimplementing it.
export function ZoomableBracketTree({
  rounds,
  floatingControls = false,
}: {
  rounds: BracketStateRound[];
  // TV mode wants the zoom control to stay put while scrolling a tall
  // bracket (a fixed overlay, matching the sound-toggle button); the
  // voter's own page is short enough that an inline control above the
  // tree works fine and doesn't need to float.
  floatingControls?: boolean;
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  useEffect(() => {
    const stored = Number(localStorage.getItem(ZOOM_STORAGE_KEY));
    if (stored >= MIN_ZOOM && stored <= MAX_ZOOM) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZoomLevel(stored);
    }
  }, []);

  function adjustZoom(delta: number) {
    setZoomLevel((prev) => {
      const next = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)) * 100) / 100;
      localStorage.setItem(ZOOM_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div
        className={`flex items-center gap-1 rounded-full border border-gold/40 bg-surface px-1.5 py-1 text-sm text-cream ${
          floatingControls ? "fixed bottom-4 right-4 z-40 bg-ink/80 backdrop-blur" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => adjustZoom(-ZOOM_STEP)}
          disabled={zoomLevel <= MIN_ZOOM}
          aria-label="Zoom out"
          className="flex h-7 w-7 items-center justify-center rounded-full transition hover:text-gold active:scale-90 disabled:opacity-30"
        >
          −
        </button>
        <span className="w-10 text-center text-xs text-cream-dim">{Math.round(zoomLevel * 100)}%</span>
        <button
          type="button"
          onClick={() => adjustZoom(ZOOM_STEP)}
          disabled={zoomLevel >= MAX_ZOOM}
          aria-label="Zoom in"
          className="flex h-7 w-7 items-center justify-center rounded-full transition hover:text-gold active:scale-90 disabled:opacity-30"
        >
          +
        </button>
      </div>
      <div className="w-full" style={{ zoom: zoomLevel }}>
        <BracketTree rounds={rounds} />
      </div>
    </div>
  );
}
