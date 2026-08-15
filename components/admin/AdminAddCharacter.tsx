"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CharacterNominationEntry, type CharacterNominationPayload } from "@/components/nominate/CharacterNominationEntry";
import { adminAddCharacterNominee } from "@/app/admin/brackets/[slug]/actions";

export function AdminAddCharacter({
  bracketId,
  excludePersonIds,
  characterName,
}: {
  bracketId: string;
  excludePersonIds: number[];
  characterName?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(payload: CharacterNominationPayload) {
    setError(null);
    startTransition(async () => {
      const result = await adminAddCharacterNominee(bracketId, payload);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <CharacterNominationEntry
        bracketId={bracketId}
        onSubmit={handleSubmit}
        disabled={pending}
        excludePersonIds={excludePersonIds}
        triggerLabel={characterName ? `+ Add an actor for ${characterName}` : "+ Add an actor to the pool"}
      />
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
