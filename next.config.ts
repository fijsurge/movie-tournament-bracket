import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org" }],
    // A given movie's poster/avatar never changes at its URL, so there's no
    // reason to let the optimizer's cache expire and re-fetch/re-transform
    // from origin every 60s (the default) — every one of those re-transforms
    // counts against Vercel's Fast Origin Transfer quota for no benefit.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
};

export default nextConfig;
