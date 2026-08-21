// Preset catalogs for AI avatar generation — kept as prompt fragments here
// (not baked into the avatar-service itself) so the actual wording is
// iterable without redeploying the Cloud Run service. Mirrors the shape
// of PRESET_AVATARS in lib/avatars.ts: a small fixed set, not open text.

export interface AvatarPreset {
  key: string;
  label: string;
  promptFragment: string;
  // Themes/styles show an emoji; palettes show a CSS gradient swatch
  // instead — each catalog only fills in the one it uses.
  emoji?: string;
  swatch?: string;
}

export const AVATAR_THEMES: AvatarPreset[] = [
  { key: "movie-hero", label: "Movie poster hero", emoji: "🦸", promptFragment: "cinematic movie poster portrait of a hero" },
  { key: "space", label: "Cosmic explorer", emoji: "🚀", promptFragment: "a cosmic space explorer among stars and nebulae" },
  { key: "fantasy", label: "Fantasy adventurer", emoji: "🧙", promptFragment: "a fantasy adventurer with magical aura" },
  { key: "arcade", label: "Retro arcade", emoji: "👾", promptFragment: "a retro 80s arcade game character" },
  { key: "noir", label: "Noir detective", emoji: "🕵️", promptFragment: "a noir film detective in shadow and light" },
];

export const AVATAR_PALETTES: AvatarPreset[] = [
  {
    key: "gold-ink",
    label: "Gold & ink",
    swatch: "linear-gradient(135deg, #e8a33d, #1b1420)",
    promptFragment: "rich gold and deep ink black color palette",
  },
  {
    key: "neon",
    label: "Neon nights",
    swatch: "linear-gradient(135deg, #ff2ec4, #22e0ff)",
    promptFragment: "vibrant neon pink and cyan color palette",
  },
  {
    key: "pastel",
    label: "Pastel dream",
    swatch: "linear-gradient(135deg, #ffc6d9, #c6e2ff)",
    promptFragment: "soft pastel color palette",
  },
  {
    key: "mono",
    label: "Black & white",
    swatch: "linear-gradient(135deg, #ffffff, #111111)",
    promptFragment: "high-contrast black and white, monochrome",
  },
  {
    key: "sunset",
    label: "Sunset warm",
    swatch: "linear-gradient(135deg, #ff7a3d, #b8202e)",
    promptFragment: "warm sunset orange and red color palette",
  },
];

export const AVATAR_STYLES: AvatarPreset[] = [
  { key: "minimalist", label: "Minimalist", emoji: "◆", promptFragment: "minimalist flat illustration style" },
  { key: "painterly", label: "Painterly", emoji: "🖌️", promptFragment: "painterly digital art style" },
  { key: "pixel", label: "Pixel art", emoji: "🕹️", promptFragment: "16-bit pixel art style" },
  { key: "comic", label: "Comic book", emoji: "💥", promptFragment: "bold comic book illustration style" },
];

// Custom presets (lib/avatar-prompts route, backed by CustomAvatarPreset)
// are referenced by a "custom:<id>" key so one string field still
// unambiguously picks "which preset" across both catalogs without the
// two id spaces ever colliding.
function findPreset(list: AvatarPreset[], key: string, customPresets: AvatarPreset[] = []): AvatarPreset | undefined {
  if (key.startsWith("custom:")) {
    return customPresets.find((p) => p.key === key);
  }
  return list.find((p) => p.key === key);
}

// A small blocklist, not a claim of robustness — a good-enough guard for
// a small trusted group, same spirit as this app's ADMIN_PASSWORD gate
// ("not real auth, just a deterrent," per .env.example). Matches whole
// words, case-insensitive, so it doesn't false-positive on substrings.
const BLOCKED_WORDS = ["nude", "naked", "nsfw", "porn", "sex", "gore", "blood", "violence", "weapon", "gun", "nazi"];

export function isPromptSafe(detail: string): boolean {
  const words = detail.toLowerCase().match(/[a-z]+/g) ?? [];
  return !words.some((w) => BLOCKED_WORDS.includes(w));
}

export type AvatarFormat = "headshot" | "poster";

export interface AvatarPromptInput {
  themeKey: string;
  paletteKey: string;
  styleKey: string;
  detail?: string;
  format?: AvatarFormat;
  posterTitle?: string;
  // Resolved custom presets to fall back to when a key isn't in the
  // builtin catalogs — kept out of this module's own concerns (no DB
  // access here), the caller (the generate route) fetches and passes
  // these in. Same list is checked for all three categories since a
  // "custom:<id>" key already unambiguously names one preset.
  customPresets?: AvatarPreset[];
}

export function buildAvatarPrompt({
  themeKey,
  paletteKey,
  styleKey,
  detail,
  format = "headshot",
  posterTitle,
  customPresets = [],
}: AvatarPromptInput): string {
  const theme = findPreset(AVATAR_THEMES, themeKey, customPresets);
  const palette = findPreset(AVATAR_PALETTES, paletteKey, customPresets);
  const style = findPreset(AVATAR_STYLES, styleKey, customPresets);
  if (!theme || !palette || !style) {
    throw new Error("Invalid avatar preset selection");
  }

  const parts = [theme.promptFragment, palette.promptFragment, style.promptFragment];
  const trimmedDetail = detail?.trim();
  if (trimmedDetail) parts.push(trimmedDetail);

  if (format === "poster") {
    const trimmedTitle = posterTitle?.trim();
    if (trimmedTitle) parts.push(`bold poster title text reading "${trimmedTitle}"`);
    parts.push("vertical movie poster composition, dramatic lighting, cinematic framing, high quality");
  } else {
    parts.push("square portrait headshot, centered, high quality");
  }

  return parts.join(", ");
}
