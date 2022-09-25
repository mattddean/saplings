import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import * as Cloudinary from "cloudinary";
import ShortUniqueId from "short-unique-id";
import { z } from "zod";
import { UserPetitionRoleName } from "../../../../prisma/types";
import { config } from "../../cloudinary/config";
import { buildSlug } from "../../lib/slug-utils";
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
      if (!petition) return { petition: undefined };
      // we return a smaller subset of the petition to unauthenticated users
      return {
        petition: {
          images: petition.images,
          slug: petition.slug,
          title: petition.title,
        },
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
      if (!petition)
        return {
          petition: undefined,
        };
      // we return a larger subset of the petition to authenticated users
      return {
        petition: {
          images: petition.images,
          slug: petition.slug,
          title: petition.title,
        },
      };
    }),
  createPetitionAndUser: authedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // the ideal slug has no random letters tacked on at the end
      const idealSlug = buildSlug(input.title);

      const userEmail = ctx.session.user.email;
      if (!userEmail) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Missing email",
        });
      }

      // we should really only ever reach 2 tries given that we're tacking on random letters at the end,
      // but we don't want to overwork our database if something is weird
      const MAX_TRIES = 30;
      let slug = idealSlug;
      let newPetition;
      for (let i = 0; i < MAX_TRIES; i++) {
        try {
          const petition = await ctx.prisma.petition.create({
            data: {
              slug,
              title: input.title,
              users: {
                create: {
                  user: {
                    // the user must already exist because this endpoint requires an authenticated user
                    connect: { email: userEmail },
                  },
                  role: {
                    // "connect or create" on the admin role avoids a seeding step, but maybe should be removed in the future
                    connectOrCreate: {
                      where: { name: UserPetitionRoleName.ADMIN },
                      create: { name: UserPetitionRoleName.ADMIN },
                    },
                  },
                },
              },
            },
          });
          // successful creation, so break out of the loop
          newPetition = petition;
          break;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
              // tack on some random letters at the end to try to produce a unique slug
              const uidFn = new ShortUniqueId({ length: 5 });
              const uid = uidFn().toLowerCase();
              slug = `${idealSlug}-${uid}`;
              continue;
            }
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal server error",
          });
        }
      }
      if (!newPetition) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to generate unique identifier",
        });
      }

      return { petition: { slug: newPetition.slug } };
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
