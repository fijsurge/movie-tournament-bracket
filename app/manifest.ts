import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Movie Madness Bracket",
    short_name: "Movie Madness",
    description: "Settle movie debates NCAA-bracket style.",
    start_url: "/",
    display: "standalone",
    background_color: "#1b1420",
    theme_color: "#1b1420",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
