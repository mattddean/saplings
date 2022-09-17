import { createClient } from "@liveblocks/client";
import { middleware } from "@liveblocks/zustand";
import createZustandStore from "zustand";
import { env } from "../env/client.mjs";

const client = createClient({
  publicApiKey: env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,
});

export interface SignatureSpot {
  title?: string;
  description?: string;
}

export type Store = {
  signatureSpots: SignatureSpot[];
};

export const useDocStore = createZustandStore(
  middleware<Store>(
    (set) => ({
      signatureSpots: [],
      addSignatureSpot: (spot: SignatureSpot) =>
        set((state) => ({
          signatureSpots: state.signatureSpots.concat(spot),
        })),
    }),
    {
      client,
      presenceMapping: {
        signatureSpots: true,
      },
      storageMapping: {},
    }
  )
);
