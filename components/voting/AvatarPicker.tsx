"use client";

import { useRef, useState } from "react";
import { PRESET_AVATARS } from "@/lib/avatars";
import { AVATAR_THEMES, AVATAR_PALETTES, AVATAR_STYLES } from "@/lib/avatar-prompts";
import { Avatar } from "@/components/shared/Avatar";
import { Spinner } from "@/components/shared/Spinner";
import { UploadIcon } from "@/components/shared/Icons";

type ServiceStatus = "checking" | "ready" | "warming_up" | "not_configured";

const STATUS_COPY: Record<ServiceStatus, string> = {
  checking: "Checking the generator…",
  ready: "Ready",
  warming_up: "Warming up — first generation can take a minute",
  not_configured: "Avatar generation isn't set up yet",
};

const MAX_DIMENSION = 96;

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = URL.createObjectURL(file);
  });
}

export function AvatarPicker({
  name,
  displayName,
  initialValue = "",
}: {
  name: string;
  displayName: string;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [status, setStatus] = useState<ServiceStatus>("checking");
  const [theme, setTheme] = useState(AVATAR_THEMES[0].key);
  const [palette, setPalette] = useState(AVATAR_PALETTES[0].key);
  const [style, setStyle] = useState(AVATAR_STYLES[0].key);
  const [detail, setDetail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatePhase, setGeneratePhase] = useState<"waking" | "painting">("waking");
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeToDataUrl(file);
      setValue(dataUrl);
    } catch {
      // silently ignore — falls back to initial-letter avatar
    }
    e.target.value = "";
  }

  function openGenerator() {
    setGeneratorOpen(true);
    setGenerateError(null);
    // Fired the moment the panel opens, before the voter's even finished
    // picking presets — gives a sleeping Space a head start waking up.
    fetch("/api/avatar-service/status")
      .then((res) => res.json())
      .then((data: { status: ServiceStatus }) => setStatus(data.status))
      .catch(() => setStatus("warming_up"));
  }

  function handleGenerate() {
    setGenerateError(null);
    setGenerating(true);
    setGeneratePhase(status === "ready" ? "painting" : "waking");
    // Rough proxy for "probably done waking, now actually generating" —
    // there's no real progress signal from a single synchronous call, so
    // this just keeps the loading copy from being a static lie the whole
    // time it's waiting.
    const phaseTimer = setTimeout(() => setGeneratePhase("painting"), 8000);

    fetch("/api/avatar-service/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeKey: theme, paletteKey: palette, styleKey: style, detail }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { dataUrl?: string; error?: string };
        if (!res.ok || !data.dataUrl) {
          setGenerateError(data.error ?? "Couldn't generate an avatar right now");
          return;
        }
        setValue(data.dataUrl);
        setGeneratorOpen(false);
      })
      .catch(() => setGenerateError("Couldn't generate an avatar right now"))
      .finally(() => {
        clearTimeout(phaseTimer);
        setGenerating(false);
      });
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-3">
        <Avatar name={displayName || "?"} avatar={value || null} size="lg" />
        <div className="flex flex-wrap gap-1.5">
          {PRESET_AVATARS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setValue(emoji)}
              aria-pressed={value === emoji}
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-base transition active:scale-90 ${
                value === emoji ? "border-gold bg-gold/15" : "border-gold/20 hover:border-gold/50 active:border-gold/50"
              }`}
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 text-cream-dim transition hover:border-gold/50 active:scale-90 active:border-gold/50"
            aria-label="Upload photo"
          >
            <UploadIcon className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={openGenerator}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 text-cream-dim transition hover:border-gold/50 active:scale-90 active:border-gold/50"
            aria-label="Generate an avatar with AI"
          >
            ✨
          </button>
        </div>
      </div>

      {generatorOpen && (
        <div className="flex flex-col gap-3 rounded-lg border border-gold/20 bg-surface p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-cream-dim">{STATUS_COPY[status]}</p>
            <button
              type="button"
              onClick={() => setGeneratorOpen(false)}
              aria-label="Close"
              className="text-cream-dim transition hover:text-gold active:scale-90"
            >
              ✕
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm text-cream-dim">
            Theme
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="rounded border border-gold/25 bg-ink px-3 py-2 text-cream focus:border-gold focus:outline-none"
            >
              {AVATAR_THEMES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-cream-dim">
            Color palette
            <select
              value={palette}
              onChange={(e) => setPalette(e.target.value)}
              className="rounded border border-gold/25 bg-ink px-3 py-2 text-cream focus:border-gold focus:outline-none"
            >
              {AVATAR_PALETTES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-cream-dim">
            Style
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="rounded border border-gold/25 bg-ink px-3 py-2 text-cream focus:border-gold focus:outline-none"
            >
              {AVATAR_STYLES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-cream-dim">
            Add a detail (optional)
            <input
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              maxLength={200}
              placeholder="e.g. wearing a wizard hat"
              className="rounded border border-gold/25 bg-ink px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
            />
          </label>

          {generateError && <p className="text-sm text-error">{generateError}</p>}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || status === "not_configured"}
            className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-dim active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                {generatePhase === "waking" ? "Waking up the generator…" : "Painting your avatar…"}
              </span>
            ) : (
              "✨ Generate"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
