import type { FastifyPluginAsync } from "fastify";
import { downloadOS, getOSMetadata } from "./os.controller";
import {
  downloadOSParamsSchema,
  getOSMetadataParamsSchema,
  getOSMetadataReplySchema,
  type DownloadOSParamsType,
  type GetOSMetadataParamsType,
  type GetOSMetadataReplyType,
} from "./os.schema";
import swaggerTags from "@/types/swaggerTags";

const agentOsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: GetOSMetadataParamsType;
    Reply: GetOSMetadataReplyType;
  }>(
    "/:osName",
    {
      schema: {
        params: getOSMetadataParamsSchema,
        tags: [swaggerTags.AGENT.IMAGES],
        response: {
          200: getOSMetadataReplySchema,
        },
      },
    },
    getOSMetadata
  );

  fastify.post<{
    Params: DownloadOSParamsType;
  }>(
    "/:osName",
    {
      schema: {
        tags: [swaggerTags.AGENT.IMAGES],
        params: downloadOSParamsSchema,
      },
    },
    downloadOS
  );
};

export default agentOsRoute;
