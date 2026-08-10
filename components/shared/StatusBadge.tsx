import { ClapperIcon, StarIcon, TrophyIcon, CheckCircleIcon } from "./Icons";

type BracketStatus = "SETUP" | "NOMINATING" | "SEEDING" | "ACTIVE" | "COMPLETE";

const CONFIG: Record<BracketStatus, { label: string; icon: typeof ClapperIcon; className: string }> = {
  SETUP: { label: "Setting up", icon: ClapperIcon, className: "border-cream-dim/30 text-cream-dim" },
  NOMINATING: { label: "Nominating", icon: ClapperIcon, className: "border-rose/50 text-rose" },
  SEEDING: { label: "Seeding", icon: StarIcon, className: "border-gold/50 text-gold" },
  ACTIVE: { label: "In progress", icon: TrophyIcon, className: "border-gold bg-gold/10 text-gold" },
  COMPLETE: { label: "Complete", icon: CheckCircleIcon, className: "border-gold bg-gold text-ink" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = CONFIG[status as BracketStatus] ?? CONFIG.SETUP;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
