import { t } from "../trpc";
import { authRouter } from "./auth";
import { exampleRouter } from "./example";
import { petitionRouter } from "./petition";

export const appRouter = t.router({
  example: exampleRouter,
  auth: authRouter,
  petition: petitionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
