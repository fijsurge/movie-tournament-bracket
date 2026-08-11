"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Invisible poller that refreshes the current route whenever the bracket's
// phase changes underneath a voter who's just sitting on the page — without
// this, a phase advance (admin closes nominations, a round closes, etc.)
// only shows up after the voter manually navigates away and back.
export function PhaseWatcher({ slug, status }: { slug: string; status: string }) {
  const router = useRouter();
  const { data } = useSWR<{ bracket: { status: string } }>(`/api/brackets/${slug}/state`, fetcher, {
    refreshInterval: 5000,
  });

  useEffect(() => {
    if (data && data.bracket.status !== status) {
      router.refresh();
    }
  }, [data, status, router]);

  return null;
}
