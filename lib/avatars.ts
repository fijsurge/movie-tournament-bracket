export const PRESET_AVATARS = [
  "🎬",
  "🍿",
  "🎥",
  "⭐",
  "🏆",
  "🍕",
  "🐙",
  "🦁",
  "🚀",
  "🎭",
  "🐶",
  "👑",
] as const;

const INITIAL_PALETTE = [
  "bg-velvet text-cream",
  "bg-rose/30 text-rose",
  "bg-gold/25 text-gold",
  "bg-gold-dim/35 text-gold-dim",
  "bg-surface-raised text-gold border border-gold/30",
] as const;

export function initialAvatarClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return INITIAL_PALETTE[hash % INITIAL_PALETTE.length];
}
