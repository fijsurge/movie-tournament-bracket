import { z } from "zod";

export const categoryInputSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Category key must be lowercase letters, numbers, and hyphens only"),
  label: z.string().trim().min(1).max(60),
  isTiebreaker: z.boolean(),
});

const idNamePair = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
});

export const createBracketSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    categories: z.array(categoryInputSchema).min(1).max(8),
    nominationMode: z.enum(["OPEN", "DRAFT"]),
    nominationCapPerVoter: z.number().int().min(1).max(10).optional(),
    poolTargetSize: z.number().int().min(2).max(64).optional(),
    filterPersonIds: z.array(idNamePair).max(5).optional(),
    filterCompanyIds: z.array(idNamePair).max(5).optional(),
    filterKeywordIds: z.array(idNamePair).max(5).optional(),
    filterCollectionIds: z.array(idNamePair).max(5).optional(),
    filterGenreIds: z.array(z.number().int().positive()).max(18).optional(),
    filterYearMin: z.number().int().min(1888).max(2100).optional(),
    filterYearMax: z.number().int().min(1888).max(2100).optional(),
  })
  .superRefine((data, ctx) => {
    const tiebreakers = data.categories.filter((c) => c.isTiebreaker).length;
    if (tiebreakers !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Exactly one category must be marked as the tiebreaker",
        path: ["categories"],
      });
    }
    const keys = new Set(data.categories.map((c) => c.key));
    if (keys.size !== data.categories.length) {
      ctx.addIssue({ code: "custom", message: "Category keys must be unique", path: ["categories"] });
    }
    if (data.nominationMode === "OPEN" && !data.nominationCapPerVoter) {
      ctx.addIssue({
        code: "custom",
        message: "Open nomination mode needs a per-voter cap",
        path: ["nominationCapPerVoter"],
      });
    }
    if (data.nominationMode === "DRAFT" && !data.poolTargetSize) {
      ctx.addIssue({
        code: "custom",
        message: "Draft mode needs a target pool size",
        path: ["poolTargetSize"],
      });
    }
    if (
      data.filterYearMin &&
      data.filterYearMax &&
      data.filterYearMin > data.filterYearMax
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Year range minimum must be before the maximum",
        path: ["filterYearMin"],
      });
    }
  });

export const identifyVoterSchema = z.object({
  bracketId: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  avatar: z.string().max(200_000).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export const inviteVotersSchema = z.object({
  bracketId: z.string().min(1),
  voters: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        email: z.string().trim().email(),
      }),
    )
    .min(1)
    .max(30),
});

export const submitNominationSchema = z.object({
  bracketId: z.string().min(1),
  tmdbId: z.number().int().positive(),
  title: z.string().trim().min(1),
  posterUrl: z.string().url().nullable(),
});

const scoreValue = z.number().int().min(1).max(5);

export const submitSeedVoteSchema = z.object({
  bracketId: z.string().min(1),
  movieId: z.string().min(1),
  score: scoreValue,
});

export const submitVoteSchema = z.object({
  matchupId: z.string().min(1),
  scoresMovieA: z.record(z.string(), scoreValue),
  scoresMovieB: z.record(z.string(), scoreValue),
});
