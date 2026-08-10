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
      <p className="text-2xl text-neutral-400">{bracketName}</p>
      <p className="text-3xl">🏆</p>
      {posterUrl && (
        <Image src={posterUrl} alt="" width={220} height={330} className="rounded-lg shadow-2xl" />
      )}
      <h1 className="text-5xl font-bold text-emerald-300">{championTitle}</h1>
      <p className="text-xl text-neutral-400">Champion!</p>
    </div>
  );
}
