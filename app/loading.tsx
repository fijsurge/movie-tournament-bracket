import Image from "next/image";
import splashLogo from "@/images/splash-logo.png";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6">
      <Image
        src={splashLogo}
        alt="Movie Madness Bracket"
        width={220}
        priority
        className="animate-pulse drop-shadow-[0_0_40px_rgba(232,163,61,0.35)]"
      />
      <p className="font-display text-sm tracking-[0.3em] text-gold uppercase">Loading…</p>
    </div>
  );
}
