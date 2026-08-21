"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { PRESET_AVATARS } from "@/lib/avatars";
import { AVATAR_THEMES, AVATAR_PALETTES, AVATAR_STYLES, type AvatarPreset, type AvatarFormat } from "@/lib/avatar-prompts";
import { Avatar } from "@/components/shared/Avatar";
import { Spinner } from "@/components/shared/Spinner";
import { UploadIcon } from "@/components/shared/Icons";

type PresetCategory = "THEME" | "PALETTE" | "STYLE";

interface CustomPresetRow {
  id: string;
  category: PresetCategory;
  label: string;
  promptFragment: string;
  emoji: string | null;
  swatch: string | null;
}

function toAvatarPreset(row: CustomPresetRow): AvatarPreset {
  return {
    key: `custom:${row.id}`,
    label: row.label,
    promptFragment: row.promptFragment,
    emoji: row.emoji ?? "✨",
    swatch: row.swatch ?? undefined,
  };
}

type ServiceStatus = "checking" | "ready" | "warming_up" | "not_configured";

const STATUS_COPY: Record<ServiceStatus, string> = {
  checking: "Checking the generator…",
  ready: "Ready to generate",
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

// Tappable chip grid shared by the theme/palette/style pickers below —
// an emoji or color swatch per option instead of a plain <select>, closer
// to the emoji-preset picker already used elsewhere in the app than to a
// form field.
function PresetChips({
  options,
  value,
  onChange,
  onDelete,
}: {
  options: AvatarPreset[];
  value: string;
  onChange: (key: string) => void;
  onDelete?: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.key;
        const isCustom = opt.key.startsWith("custom:");
        return (
          <span
            key={opt.key}
            className={`flex items-center gap-1 rounded-full border pl-3 pr-1.5 py-1 text-sm transition ${
              selected
                ? "border-gold bg-gold/15 text-gold"
                : "border-gold/20 text-cream hover:border-gold/50"
            }`}
          >
            <button
              type="button"
              onClick={() => onChange(opt.key)}
              aria-pressed={selected}
              className="flex items-center gap-1.5 active:scale-95"
            >
              {opt.swatch ? (
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-cream/20"
                  style={{ background: opt.swatch }}
                  aria-hidden="true"
                />
              ) : (
                <span aria-hidden="true">{opt.emoji}</span>
              )}
              {opt.label}
            </button>
            {isCustom && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(opt.key)}
                aria-label={`Delete ${opt.label}`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-cream-dim transition hover:text-error active:scale-90"
              >
                ✕
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

function AddCustomPresetChip({
  category,
  isLinked,
  onAdded,
}: {
  category: PresetCategory;
  isLinked: boolean;
  onAdded: (preset: CustomPresetRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [color1, setColor1] = useState("#e8a33d");
  const [color2, setColor2] = useState("#1b1420");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full border border-dashed border-gold/30 px-3 py-1.5 text-sm text-cream-dim transition hover:border-gold/60 hover:text-cream active:scale-95"
      >
        + Custom
      </button>
    );
  }

  if (!isLinked) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-gold/20 px-3 py-1.5 text-xs text-cream-dim">
        Add your email above to save custom presets
        <button type="button" onClick={() => setOpen(false)} className="text-cream-dim hover:text-gold">
          ✕
        </button>
      </div>
    );
  }

  function handleSave() {
    setError(null);
    const trimmedLabel = label.trim();
    const trimmedDescription = description.trim();
    if (!trimmedLabel || !trimmedDescription) {
      setError("Give it a name and a short description");
      return;
    }
    setSaving(true);
    fetch("/api/avatar-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        label: trimmedLabel,
        promptFragment: trimmedDescription,
        swatch: category === "PALETTE" ? `linear-gradient(135deg, ${color1}, ${color2})` : undefined,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { preset?: CustomPresetRow; error?: string };
        if (!res.ok || !data.preset) {
          setError(data.error ?? "Couldn't save that preset");
          return;
        }
        onAdded(data.preset);
        setOpen(false);
        setLabel("");
        setDescription("");
      })
      .catch(() => setError("Couldn't save that preset"))
      .finally(() => setSaving(false));
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-gold/20 bg-ink p-2.5">
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={30}
          placeholder="Name (e.g. Cyberpunk)"
          className="w-1/3 rounded border border-gold/25 bg-surface px-2 py-1.5 text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={150}
          placeholder="Describe it for the AI"
          className="flex-1 rounded border border-gold/25 bg-surface px-2 py-1.5 text-sm text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
        />
      </div>
      {category === "PALETTE" && (
        <div className="flex items-center gap-2 text-xs text-cream-dim">
          Colors
          <input
            type="color"
            value={color1}
            onChange={(e) => setColor1(e.target.value)}
            className="h-6 w-8 rounded border border-gold/25 bg-surface"
          />
          <input
            type="color"
            value={color2}
            onChange={(e) => setColor2(e.target.value)}
            className="h-6 w-8 rounded border border-gold/25 bg-surface"
          />
        </div>
      )}
      {error && <p className="text-xs text-error">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-gold px-3 py-1 text-xs font-medium text-ink transition hover:bg-gold-dim active:scale-95 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-gold/20 px-3 py-1 text-xs text-cream-dim transition hover:border-gold/50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AvatarPicker({
  name,
  displayName,
  initialValue = "",
  isLinked = true,
}: {
  name: string;
  displayName: string;
  initialValue?: string;
  isLinked?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [customPresets, setCustomPresets] = useState<CustomPresetRow[]>([]);

  useEffect(() => {
    fetch("/api/avatar-presets")
      .then((res) => res.json())
      .then((data: { presets?: CustomPresetRow[] }) => setCustomPresets(data.presets ?? []))
      .catch(() => {});
  }, []);

  function deleteCustomPreset(key: string) {
    const id = key.replace("custom:", "");
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
    fetch(`/api/avatar-presets/${id}`, { method: "DELETE" }).catch(() => {});
  }
  // Tracks the shape of whatever's currently in `value` — only generated
  // images can be poster-shaped, so this resets to "headshot" (circular)
  // for emoji picks and photo uploads, which are always meant to read as
  // round. Picker-local UI state only; the DB still just stores the data:
  // URI, unchanged — every other avatar display in the app keeps cropping
  // it into the usual circle via object-cover.
  const [previewFormat, setPreviewFormat] = useState<AvatarFormat>("headshot");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [status, setStatus] = useState<ServiceStatus>("checking");
  const [format, setFormat] = useState<AvatarFormat>("headshot");
  const [theme, setTheme] = useState(AVATAR_THEMES[0].key);
  const [palette, setPalette] = useState(AVATAR_PALETTES[0].key);
  const [style, setStyle] = useState(AVATAR_STYLES[0].key);
  const [detail, setDetail] = useState("");
  const [posterTitle, setPosterTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatePhase, setGeneratePhase] = useState<"waking" | "painting">("waking");
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeToDataUrl(file);
      setValue(dataUrl);
      setPreviewFormat("headshot");
    } catch {
      // silently ignore — falls back to initial-letter avatar
    }
    e.target.value = "";
  }

  function openGenerator() {
    setGeneratorOpen((open) => !open);
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
      body: JSON.stringify({
        themeKey: theme,
        paletteKey: palette,
        styleKey: style,
        detail,
        format,
        posterTitle: format === "poster" ? posterTitle : undefined,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { dataUrl?: string; error?: string };
        if (!res.ok || !data.dataUrl) {
          setGenerateError(data.error ?? "Couldn't generate an avatar right now");
          return;
        }
        setValue(data.dataUrl);
        setPreviewFormat(format);
        setGeneratorOpen(false);
      })
      .catch(() => setGenerateError("Couldn't generate an avatar right now"))
      .finally(() => {
        clearTimeout(phaseTimer);
        setGenerating(false);
      });
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={value} />

      {/* The avatar itself is the focal point — generating pulses it gently
          instead of hiding it behind a separate loading indicator. */}
      <div className="flex flex-col items-center gap-3">
        <motion.div
          animate={generating ? { opacity: [1, 0.55, 1], scale: [1, 0.97, 1] } : { opacity: 1, scale: 1 }}
          transition={generating ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : {}}
          className={`transition-shadow ${previewFormat === "poster" ? "rounded-2xl" : "rounded-full"} ${
            generating ? "ring-2 ring-gold/50" : "ring-2 ring-transparent"
          }`}
        >
          {previewFormat === "poster" && value.startsWith("data:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-56 w-40 shrink-0 rounded-2xl object-cover" />
          ) : (
            <Avatar name={displayName || "?"} avatar={value || null} size="xl" />
          )}
        </motion.div>

        <button
          type="button"
          onClick={openGenerator}
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-gold-dim active:scale-95"
        >
          ✨ Generate with AI
        </button>
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

          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-cream-dim">Format</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "headshot", label: "Headshot", emoji: "🖼️" },
                  { key: "poster", label: "Movie poster", emoji: "🎬" },
                ] as const
              ).map((opt) => {
                const selected = format === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFormat(opt.key)}
                    aria-pressed={selected}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition active:scale-95 ${
                      selected
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-gold/20 text-cream hover:border-gold/50 active:border-gold/50"
                    }`}
                  >
                    <span aria-hidden="true">{opt.emoji}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-cream-dim">Theme</p>
            <div className="flex flex-wrap items-center gap-2">
              <PresetChips
                options={[...AVATAR_THEMES, ...customPresets.filter((p) => p.category === "THEME").map(toAvatarPreset)]}
                value={theme}
                onChange={setTheme}
                onDelete={deleteCustomPreset}
              />
              <AddCustomPresetChip
                category="THEME"
                isLinked={isLinked}
                onAdded={(p) => setCustomPresets((prev) => [...prev, p])}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-cream-dim">Color palette</p>
            <div className="flex flex-wrap items-center gap-2">
              <PresetChips
                options={[...AVATAR_PALETTES, ...customPresets.filter((p) => p.category === "PALETTE").map(toAvatarPreset)]}
                value={palette}
                onChange={setPalette}
                onDelete={deleteCustomPreset}
              />
              <AddCustomPresetChip
                category="PALETTE"
                isLinked={isLinked}
                onAdded={(p) => setCustomPresets((prev) => [...prev, p])}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-cream-dim">Style</p>
            <div className="flex flex-wrap items-center gap-2">
              <PresetChips
                options={[...AVATAR_STYLES, ...customPresets.filter((p) => p.category === "STYLE").map(toAvatarPreset)]}
                value={style}
                onChange={setStyle}
                onDelete={deleteCustomPreset}
              />
              <AddCustomPresetChip
                category="STYLE"
                isLinked={isLinked}
                onAdded={(p) => setCustomPresets((prev) => [...prev, p])}
              />
            </div>
          </div>

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

          {format === "poster" && (
            <label className="flex flex-col gap-1 text-sm text-cream-dim">
              Poster title (optional, experimental)
              <input
                value={posterTitle}
                onChange={(e) => setPosterTitle(e.target.value)}
                maxLength={40}
                placeholder="e.g. THE LAST STAND"
                className="rounded border border-gold/25 bg-ink px-3 py-2 text-cream placeholder:text-cream-dim/50 focus:border-gold focus:outline-none"
              />
              <span className="text-xs text-cream-dim/70">
                Small AI models often render text as gibberish — worth a try, no guarantees.
              </span>
            </label>
          )}

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

      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-cream-dim">Or pick one instead</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_AVATARS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setValue(emoji);
                setPreviewFormat("headshot");
              }}
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
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      </div>
    </div>
  );
}
