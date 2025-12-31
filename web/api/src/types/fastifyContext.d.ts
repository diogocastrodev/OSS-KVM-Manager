import "fastify";

declare module "fastify" {
  interface FastifyContextConfig {
    csrf: boolean;
  }
}
