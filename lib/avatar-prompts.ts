// Preset catalogs for AI avatar generation — kept as prompt fragments here
// (not baked into the avatar-service itself) so the actual wording is
// iterable without redeploying the Cloud Run service. Mirrors the shape
// of PRESET_AVATARS in lib/avatars.ts: a small fixed set, not open text.

export interface AvatarPreset {
  key: string;
  label: string;
  promptFragment: string;
}

export const AVATAR_THEMES: AvatarPreset[] = [
  { key: "movie-hero", label: "Movie poster hero", promptFragment: "cinematic movie poster portrait of a hero" },
  { key: "space", label: "Cosmic explorer", promptFragment: "a cosmic space explorer among stars and nebulae" },
  { key: "fantasy", label: "Fantasy adventurer", promptFragment: "a fantasy adventurer with magical aura" },
  { key: "arcade", label: "Retro arcade", promptFragment: "a retro 80s arcade game character" },
  { key: "noir", label: "Noir detective", promptFragment: "a noir film detective in shadow and light" },
];

export const AVATAR_PALETTES: AvatarPreset[] = [
  { key: "gold-ink", label: "Gold & ink", promptFragment: "rich gold and deep ink black color palette" },
  { key: "neon", label: "Neon nights", promptFragment: "vibrant neon pink and cyan color palette" },
  { key: "pastel", label: "Pastel dream", promptFragment: "soft pastel color palette" },
  { key: "mono", label: "Black & white", promptFragment: "high-contrast black and white, monochrome" },
  { key: "sunset", label: "Sunset warm", promptFragment: "warm sunset orange and red color palette" },
];

export const AVATAR_STYLES: AvatarPreset[] = [
  { key: "minimalist", label: "Minimalist", promptFragment: "minimalist flat illustration style" },
  { key: "painterly", label: "Painterly", promptFragment: "painterly digital art style" },
  { key: "pixel", label: "Pixel art", promptFragment: "16-bit pixel art style" },
  { key: "comic", label: "Comic book", promptFragment: "bold comic book illustration style" },
];

function findPreset(list: AvatarPreset[], key: string): AvatarPreset | undefined {
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

export interface AvatarPromptInput {
  themeKey: string;
  paletteKey: string;
  styleKey: string;
  detail?: string;
}

export function buildAvatarPrompt({ themeKey, paletteKey, styleKey, detail }: AvatarPromptInput): string {
  const theme = findPreset(AVATAR_THEMES, themeKey);
  const palette = findPreset(AVATAR_PALETTES, paletteKey);
  const style = findPreset(AVATAR_STYLES, styleKey);
  if (!theme || !palette || !style) {
    throw new Error("Invalid avatar preset selection");
  }

  const parts = [theme.promptFragment, palette.promptFragment, style.promptFragment];
  const trimmedDetail = detail?.trim();
  if (trimmedDetail) parts.push(trimmedDetail);
  parts.push("square avatar portrait, centered, high quality");

  return parts.join(", ");
}
