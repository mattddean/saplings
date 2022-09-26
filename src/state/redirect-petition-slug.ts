import { atomWithStorage } from "jotai/utils";

export const redirectSlugAtom = atomWithStorage<string | undefined>(
  "redirectSlug",
  undefined
);
