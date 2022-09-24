import * as Cloudinary from "cloudinary";
import { z } from "zod";
import { config } from "../../cloudinary/config";
import { t } from "../trpc";

export const petitionRouter = t.router({
  getOne: t.procedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.petition.findFirst({
        where: { slug: input.slug },
        include: { images: { select: { src: true, alt: true } } },
      });
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
