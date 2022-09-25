import { atomWithStorage } from "jotai/utils";

export const unauthenticatedPetitionTitleAtom = atomWithStorage<
  string | undefined
>("unauthenticatedPetitionSlug", undefined);
