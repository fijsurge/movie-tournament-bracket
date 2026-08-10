import { initialAvatarClass } from "@/lib/avatars";

const SIZE_CLASSES = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-14 w-14 text-xl",
} as const;

export function Avatar({
  name,
  avatar,
  size = "md",
  className = "",
}: {
  name: string;
  avatar?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const sizeClass = SIZE_CLASSES[size];

  if (avatar?.startsWith("data:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  if (avatar) {
    return (
      <span
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-surface-raised leading-none ${className}`}
      >
        {avatar}
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-semibold leading-none ${initialAvatarClass(name)} ${className}`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
