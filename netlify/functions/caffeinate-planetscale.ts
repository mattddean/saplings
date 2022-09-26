import { Handler, schedule } from "@netlify/functions";
import { prisma } from "../../src/server/db/client";

/**
 * Serverless cron job that keeps free tier Planetscale database alive
 */
const handler: Handler = async () => {
  await prisma.caffeinateMessage.create({ data: { message: "Stay awake!" } });

  return { statusCode: 200 };
};

/** run once a day at 3am UTC */
module.exports.handler = schedule("20 3 * * *", handler);
