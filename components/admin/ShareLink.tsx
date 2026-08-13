"use client";

import { useState } from "react";
import { CopyIcon, ShareIcon, CheckCircleIcon } from "@/components/shared/Icons";

export function ShareLink({ url, label }: { url: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleShare() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url, title: label });
      } catch {
        // user dismissed the share sheet — nothing to do
      }
      return;
    }
    handleCopy();
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface p-2 shadow-[0_8px_20px_-14px_rgba(0,0,0,0.7)]">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-cream-dim">{label}</p>
        <p className="truncate text-sm text-gold">{url}</p>
      </div>
      <button
        type="button"
        onClick={handleShare}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-sm text-cream transition hover:border-gold active:scale-95"
      >
        <ShareIcon className="h-4 w-4" />
        Share
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-gold-dim active:scale-95"
      >
        {copied ? <CheckCircleIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
