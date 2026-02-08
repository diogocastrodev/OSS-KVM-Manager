import type { FastifyPluginAsync } from "fastify";
import { getAllOS } from "./os.controller";
import swaggerTags from "@/types/swaggerTags";
import {
  GetOSAvailableResponse,
  type GetOSAvailableResponseType,
} from "./os.schema";

const osRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Reply: GetOSAvailableResponseType;
  }>(
    "/",
    {
      schema: {
        tags: [swaggerTags.OS],
        response: {
          200: GetOSAvailableResponse,
        },
      },
    },
    getAllOS,
  );
};

export default osRoute;
