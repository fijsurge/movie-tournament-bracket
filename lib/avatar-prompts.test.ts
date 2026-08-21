import { describe, expect, it } from "vitest";
import { buildAvatarPrompt, isPromptSafe, AVATAR_THEMES, AVATAR_PALETTES, AVATAR_STYLES } from "./avatar-prompts";

describe("isPromptSafe", () => {
  it("passes an ordinary detail string", () => {
    expect(isPromptSafe("wearing a wizard hat and holding popcorn")).toBe(true);
  });

  it("passes an empty string", () => {
    expect(isPromptSafe("")).toBe(true);
  });

  it("catches a blocklisted word regardless of case", () => {
    expect(isPromptSafe("something NSFW here")).toBe(false);
  });

  it("does not false-positive on a substring of a blocked word", () => {
    // "gunner" contains "gun" as a substring but isn't the word "gun" itself
    expect(isPromptSafe("a gunner's mate uniform")).toBe(true);
  });
});

describe("buildAvatarPrompt", () => {
  const theme = AVATAR_THEMES[0].key;
  const palette = AVATAR_PALETTES[0].key;
  const style = AVATAR_STYLES[0].key;

  it("joins theme, palette, and style fragments", () => {
    const prompt = buildAvatarPrompt({ themeKey: theme, paletteKey: palette, styleKey: style });
    expect(prompt).toContain(AVATAR_THEMES[0].promptFragment);
    expect(prompt).toContain(AVATAR_PALETTES[0].promptFragment);
    expect(prompt).toContain(AVATAR_STYLES[0].promptFragment);
  });

  it("appends a trimmed optional detail", () => {
    const prompt = buildAvatarPrompt({ themeKey: theme, paletteKey: palette, styleKey: style, detail: "  a wizard hat  " });
    expect(prompt).toContain("a wizard hat");
  });

  it("omits the detail segment when not provided", () => {
    const withDetail = buildAvatarPrompt({ themeKey: theme, paletteKey: palette, styleKey: style, detail: "wizard hat" });
    const withoutDetail = buildAvatarPrompt({ themeKey: theme, paletteKey: palette, styleKey: style });
    expect(withDetail).not.toBe(withoutDetail);
    expect(withoutDetail).not.toContain("wizard hat");
  });

  it("throws on an invalid preset key", () => {
    expect(() => buildAvatarPrompt({ themeKey: "not-real", paletteKey: palette, styleKey: style })).toThrow();
  });

  it("defaults to a square headshot composition", () => {
    const prompt = buildAvatarPrompt({ themeKey: theme, paletteKey: palette, styleKey: style });
    expect(prompt).toContain("square portrait headshot");
  });

  it("switches to a poster composition when format is poster", () => {
    const prompt = buildAvatarPrompt({ themeKey: theme, paletteKey: palette, styleKey: style, format: "poster" });
    expect(prompt).toContain("vertical movie poster composition");
    expect(prompt).not.toContain("square portrait headshot");
  });

  it("includes a poster title fragment only in poster format", () => {
    const posterPrompt = buildAvatarPrompt({
      themeKey: theme,
      paletteKey: palette,
      styleKey: style,
      format: "poster",
      posterTitle: "THE LAST STAND",
    });
    expect(posterPrompt).toContain('bold poster title text reading "THE LAST STAND"');

    const headshotPrompt = buildAvatarPrompt({
      themeKey: theme,
      paletteKey: palette,
      styleKey: style,
      format: "headshot",
      posterTitle: "THE LAST STAND",
    });
    expect(headshotPrompt).not.toContain("THE LAST STAND");
  });

  it("falls back to a custom preset when the key isn't a builtin", () => {
    const customTheme = { key: "custom:abc123", label: "My theme", promptFragment: "a custom cosmic wizard scene" };
    const prompt = buildAvatarPrompt({
      themeKey: customTheme.key,
      paletteKey: palette,
      styleKey: style,
      customPresets: [customTheme],
    });
    expect(prompt).toContain(customTheme.promptFragment);
  });

  it("throws when a custom-prefixed key isn't found among the provided custom presets", () => {
    expect(() =>
      buildAvatarPrompt({ themeKey: "custom:missing", paletteKey: palette, styleKey: style, customPresets: [] }),
    ).toThrow();
  });
});
