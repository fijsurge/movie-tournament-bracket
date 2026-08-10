import Image from "next/image";

export function ChampionBanner({
  bracketName,
  championTitle,
  posterUrl,
}: {
  bracketName: string;
  championTitle: string;
  posterUrl: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="font-display text-2xl tracking-wide text-cream-dim uppercase">{bracketName}</p>
      <p className="text-4xl">🏆</p>
      {posterUrl && (
        <Image
          src={posterUrl}
          alt=""
          width={220}
          height={330}
          className="rounded-lg shadow-[0_0_60px_-10px_rgba(232,163,61,0.5)]"
        />
      )}
      <h1 className="font-display text-5xl tracking-wide text-gold uppercase drop-shadow-[0_0_30px_rgba(232,163,61,0.4)]">
        {championTitle}
      </h1>
      <p className="text-xl text-rose">Champion!</p>
    </div>
  );
}
