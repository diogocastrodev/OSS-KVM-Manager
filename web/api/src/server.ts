import Fastify from "fastify";
import env from "@utils/env";
import apiRouter from "./router/router";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import authPlugin from "@/plugins/auth";
import fastifyCookie from "@fastify/cookie";

const fastify = Fastify({
  logger: true,
}).withTypeProvider<ZodTypeProvider>();
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

await fastify.register(authPlugin);
await fastify.register(fastifyCookie, {
  algorithm: "sha256",
  secret: env.COOKIE_SECRET,
  parseOptions: {},
});

env.NODE_ENV === "development" &&
  (await fastify.register(fastifySwagger, {
    openapi: {
      // Use openapi option for OpenAPI v3 specification
      info: {
        title: "Fastify API Documentation",
        description: "Testing the Fastify swagger API",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: "Development server",
        },
      ],
    },
  }));

// 2. Register @fastify/swagger-ui
env.NODE_ENV === "development" &&
  (await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs", // Access UI at http://localhost:3000/docs
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    // Optionally, expose the raw JSON/YAML spec
    // exposeRoute: true // This option is now part of @fastify/swagger-ui options
  }));

fastify.register(async (instance) => {
  instance.register(apiRouter, { prefix: "/api" });
});

fastify.setNotFoundHandler((req, reply) => {
  // reply.code(404).send({
  //   statusCode: 404,
  //   error: "Not Found",
  //   message: `Route ${req.method} ${req.url} not found`,
  // });
  reply.code(404).send();
});

fastify.setErrorHandler((err, req, reply) => {
  if ((err as any).code === "P2025") {
    return reply.code(404).send();
  }

  req.log.error(err);
  reply.code(500).send();
});

fastify.listen({ port: env.PORT }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`🚀 Server listening at ${address}`);
  env.NODE_ENV === "development" &&
    fastify.log.info(`📚 API docs available at ${address}/docs`);
  fastify.log.info(`🔧 Running in ${env.NODE_ENV}`);
});
