import fs from "node:fs";
import fsp from "node:fs/promises";
import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  DownloadOSParamsType,
  GetOSMetadataParamsType,
  GetOSMetadataReplyType,
} from "./os.schema";
import { ensureSha256InMeta, resolveImageByName } from "./os.helper";
import path from "node:path";

export const getOSMetadata = async (
  req: FastifyRequest<{
    Params: GetOSMetadataParamsType;
  }>,
  reply: FastifyReply<{
    Reply: GetOSMetadataReplyType;
  }>
) => {
  const { osName } = req.params;

  const { meta, metaPath, filePath } = await resolveImageByName(osName);
  const stat = await fsp.stat(filePath);
  const sha256 = await ensureSha256InMeta(metaPath, filePath);

  return reply.send({
    id: osName,
    type: meta.type,
    filename: meta.filename,
    bytes: stat.size,
    sha256,
  });
};

export const downloadOS = async (
  req: FastifyRequest<{
    Params: DownloadOSParamsType;
  }>,
  reply: FastifyReply
) => {
  const { osName } = req.params;

  const { meta, metaPath, filePath } = await resolveImageByName(osName);
  const stat = await fsp.stat(filePath);

  const sha256 = await ensureSha256InMeta(metaPath, filePath);
  reply.header("ETag", `"${sha256}"`);

  reply.header("Accept-Ranges", "bytes");
  reply.header("Content-Type", "application/octet-stream");
  reply.header(
    "Content-Disposition",
    `attachment; filename="${path.basename(meta.filename)}"`
  );

  // Minimal: no Range support (add if you want resume)
  reply.header("Content-Length", stat.size);
  return reply.send(fs.createReadStream(filePath));
};
