import * as Cloudinary from "cloudinary";
import { z } from "zod";
import { UserPetitionRoleName } from "../../../../prisma/types";
import { config } from "../../cloudinary/config";
import { authedProcedure, t } from "../trpc";

export const petitionRouter = t.router({
  getOne: t.procedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const petition = await ctx.prisma.petition.findFirst({
        where: { slug: input.slug },
        select: {
          images: { select: { src: true, alt: true } },
          slug: true,
          title: true,
        },
      });
      if (!petition) return;
      // we return a smaller subset of the petition to unauthenticated users
      return {
        images: petition.images,
        slug: petition.slug,
        title: petition.title,
      };
    }),
  /** Is the authenticated user an admin of the petition with the given slug? */
  getOneForAdmin: authedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const petition = await ctx.prisma.petition.findFirst({
        where: {
          slug: input.slug,
          users: {
            some: {
              userId: ctx.session.user.id,
              role: { name: UserPetitionRoleName.ADMIN },
            },
          },
        },
        select: {
          images: { select: { src: true, alt: true } },
          slug: true,
          title: true,
        },
      });
      if (!petition) return;
      // we return a larger subset of the petition to authenticated users
      return {
        images: petition.images,
        slug: petition.slug,
        title: petition.title,
      };
    }),
  generateImageUploadSignature: t.procedure.query(() => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const configuration = config();
    const apiSecret = configuration.api_secret as string;
    const folder = "saplings/petition-images";

    const signature = Cloudinary.v2.utils.api_sign_request(
      { timestamp, folder },
      apiSecret
    );
    const apiKey = configuration.api_key as string;
    const cloudName = configuration.cloud_name as string;
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    return {
      signature,
      folder,
      apiKey,
      cloudName,
      timestamp,
      url,
    };
  }),
});
