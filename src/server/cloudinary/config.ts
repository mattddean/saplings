import * as Cloudinary from "cloudinary";
import { env } from "../../env/server.mjs";

export const config = () =>
  Cloudinary.v2.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
