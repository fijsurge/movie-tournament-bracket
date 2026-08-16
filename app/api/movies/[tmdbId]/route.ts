import { NextResponse } from "next/server";
import { getMovieDetails } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId } = await params;
  const id = Number(tmdbId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid movie id" }, { status: 400 });
  }

  const details = await getMovieDetails(id);
  if (!details) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }
  return NextResponse.json(details);
}
