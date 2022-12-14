import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import * as Cloudinary from "cloudinary";
import * as HelloSignSDK from "hellosign-sdk";
import { loremIpsum } from "lorem-ipsum";
import ShortUniqueId from "short-unique-id";
import { z } from "zod";
import { UserPetitionRoleName } from "../../../../prisma/types";
import { env as clientEnv } from "../../../env/client.mjs";
import { env } from "../../../env/server.mjs";
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
          images: {
            select: { cloudinarySecureUrl: true, alt: true },
            // the image with the highest position is the main image
            orderBy: { position: "desc" },
          },
          slug: true,
          title: true,
          body: true,
        },
      });
      if (!petition) return { petition: undefined };
      // we return a smaller subset of the petition to unauthenticated users
      return {
        petition: {
          images: petition.images.map((image) => ({
            url: image.cloudinarySecureUrl,
            alt: image.alt,
          })),
          slug: petition.slug,
          title: petition.title,
          body: petition.body,
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
          images: {
            select: { cloudinarySecureUrl: true, alt: true },
            orderBy: { position: "desc" },
          },
          slug: true,
          title: true,
          body: true,
        },
      });
      if (!petition)
        return {
          petition: undefined,
        };
      // TODO: return a larger subset of the petition to authenticated users
      return {
        petition: {
          images: petition.images.map((image) => ({
            url: image.cloudinarySecureUrl,
            alt: image.alt,
          })),
          slug: petition.slug,
          title: petition.title,
          body: petition.body,
        },
      };
    }),
  getAllOfMine: authedProcedure.query(async ({ ctx }) => {
    const petitions = await ctx.prisma.petition.findMany({
      // petitions where we are an admin
      where: {
        users: {
          some: {
            user: { id: ctx.session.user.id },
            role: { name: UserPetitionRoleName.ADMIN },
          },
        },
      },
      select: {
        body: true,
        slug: true,
        title: true,
        images: {
          select: {
            cloudinarySecureUrl: true,
            alt: true,
          },
        },
      },
    });
    return petitions.map((petition) => ({
      petition: {
        images: petition.images.map((image) => ({
          url: image.cloudinarySecureUrl,
          alt: image.alt,
        })),
        slug: petition.slug,
        title: petition.title,
        body: petition.body,
      },
    }));
  }),
  createPetitionAndUser: authedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // the ideal slug has no random letters tacked on at the end
      const idealSlug = buildSlug(input.title);

      // we should really only ever reach 2 tries given that we're tacking on random letters at the end,
      // but we don't want to overwork our database if something is weird
      const MAX_TRIES = 30;
      let slug = idealSlug;
      let newPetition;
      // TODO: remove this seed data once users can edit the petition body
      const body = loremIpsum({ count: 3, units: "paragraphs" });
      for (let i = 0; i < MAX_TRIES; i++) {
        try {
          const petition = await ctx.prisma.petition.create({
            data: {
              slug,
              title: input.title,
              body,
              users: {
                create: {
                  user: {
                    // the user must already exist because this endpoint requires an authenticated user
                    connect: { id: ctx.session.user.id },
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
  /** Link a cloudinary image to a petition */
  linkImage: authedProcedure
    .input(
      z.object({
        cloudinarySecureUrl: z.string(),
        cloudinaryUrl: z.string(),
        cloudinaryAssetId: z.string(),
        slug: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: verify that user is admin of this slug
      await ctx.prisma.$transaction(async (tx) => {
        // figure out what the next position is
        const existingImages = await tx.petitionImage.findMany({
          select: { position: true },
          where: { petition: { slug: input.slug } },
          orderBy: { position: "asc" },
        });
        let lastPosition = existingImages[existingImages.length - 1]?.position;
        if (!lastPosition) lastPosition = 0;

        // create image connected to this petition with position one higher than the last
        await tx.petitionImage.create({
          data: {
            cloudinarySecureUrl: input.cloudinarySecureUrl,
            cloudinaryUrl: input.cloudinaryUrl,
            cloudinaryAssetId: input.cloudinaryAssetId,
            petition: { connect: { slug: input.slug } },
            position: lastPosition + 1,
          },
        });
      });
    }),
  /**
   * Dynamically generate a signature request for the user based on our standard Hellosign template for Sapling Agreer documents,
   * then use that signature request to generate an iframe URL that the user can use to sign the document without leaving our site.
   */
  createEmbeddedSignUrl: authedProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const signatureRequestClient = new HelloSignSDK.SignatureRequestApi();
      signatureRequestClient.username = env.HELLOSIGN_API_KEY;

      const userEmail = ctx.session.user.email;
      const userName = ctx.session.user.name;
      if (!userEmail || !userName) {
        // we never expect to get here
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to find user",
        });
      }

      const data: HelloSignSDK.SignatureRequestCreateEmbeddedWithTemplateRequest =
        {
          clientId: clientEnv.NEXT_PUBLIC_HELLOSIGN_CLIENT_ID,
          templateIds: [env.HELLOSIGN_TEMPLATE_ID],
          signers: [
            { emailAddress: userEmail, name: userName, role: "Agreer" },
          ],
          // TODO: maybe include the saplings's title and body content so that the content of the Sapling is frozen in time when the user signs it.
          // If the content of the Sapling changes in the future, the user may no longer agree to it.
          customFields: [
            {
              name: "sapling_url",
              // TODO: maybe extract the base url to an environment variable
              value: `https://saplings.netlify.app/s/${input.slug}`,
            },
          ],
          testMode: true,
        };
      // TODO: error handling?
      const result =
        await signatureRequestClient.signatureRequestCreateEmbeddedWithTemplate(
          data
        );
      const signatureId =
        result.body.signatureRequest?.signatures?.[0]?.signatureId;
      if (!signatureId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create signature request",
        });
      }

      // TODO: store signature id in our db

      const embeddedClient = new HelloSignSDK.EmbeddedApi();
      embeddedClient.username = env.HELLOSIGN_API_KEY;

      const signUrlResult = await embeddedClient.embeddedSignUrl(signatureId);
      const signUrl = signUrlResult.body.embedded?.signUrl;
      if (!signUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create sign url",
        });
      }

      return { iframeSignUrl: signUrl };
    }),
});
