import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import env from "@utils/env";
import apiRouter from "./router/router";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import authPlugin from "@/plugins/auth";
import fastifyCookie from "@fastify/cookie";
import fastifyCSRF from "@fastify/csrf-protection";
import { initJwks, getJwks } from "./plugins/jose";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
/* -------------------------------------------------------------------------- */
/*                                   Fastify                                  */
/* -------------------------------------------------------------------------- */
const fastify = Fastify({
  logger: true,
})
  /* -------------------------------------------------------------------------- */
  /*                                     Zod                                    */
  /* -------------------------------------------------------------------------- */
  .withTypeProvider<ZodTypeProvider>();
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);
env.JWT_MODE === "keys" && (await initJwks());
/* -------------------------------------------------------------------------- */
/*                                   Plugins                                  */
/* -------------------------------------------------------------------------- */
await fastify.register(cors, {
  origin: ["http://localhost:3000"], // your Next dev server
  credentials: true, // required for cookies
});
await fastify.register(fastifyCookie, {
  algorithm: "sha256",
  secret: env.COOKIE_SECRET,
  parseOptions: {},
});
await fastify.register(fastifyCSRF, {
  cookieOpts: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 60 * 60, // 1 hour
  },
});
await fastify.register(authPlugin);
await fastify.register(websocket, {
  options: { perMessageDeflate: false },
});
/* -------------------------------------------------------------------------- */
/*                               Swagger / Docs                               */
/* -------------------------------------------------------------------------- */
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
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  }));

// 2. Register @fastify/swagger-ui
env.NODE_ENV === "development" &&
  (await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs", // Access UI at http://localhost:3000/docs
    uiConfig: {
      docExpansion: "none",
      defaultModelExpandDepth: -1,
      deepLinking: false,
    },
    // Optionally, expose the raw JSON/YAML spec
    // exposeRoute: true // This option is now part of @fastify/swagger-ui options
  }));
/* -------------------------------------------------------------------------- */
/*                               CSRF Protection                              */
/* -------------------------------------------------------------------------- */
const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

fastify.addHook(
  "preValidation",
  (req: FastifyRequest, reply: FastifyReply, done) => {
    if (env.IGNORE_CSRF) return done();
    // route-level opt-out
    if (req.routeOptions?.config?.csrf === false) return done();

    if (safeMethods.has(req.method)) return done();

    // Bearer clients: skip CSRF
    if (req.headers.authorization?.startsWith("Bearer ")) return done();

    // Only enforce CSRF for cookie-auth requests (pick your condition)
    // If you use access cookie:
    if (!req.cookies?.access_token) return done();

    // Or if you consider refresh cookie as "web":
    // if (!req.cookies?.refresh_token) return done();

    fastify.csrfProtection(req, reply, done);
  },
);

/* -------------------------------------------------------------------------- */
/*                                  API Route                                 */
/* -------------------------------------------------------------------------- */
fastify.register(async (instance) => {
  instance.register(apiRouter, { prefix: "/api" });
});
/* -------------------------------------------------------------------------- */
/*                               JWT Public Key                               */
/* -------------------------------------------------------------------------- */
env.JWT_MODE === "keys" &&
  fastify.get("/.well-known/jwks.json", async (req, reply) => {
    const jwks = getJwks();
    return reply.send(jwks);
  });
/* -------------------------------------------------------------------------- */
/*                               Invalid Routes                               */
/* -------------------------------------------------------------------------- */
// 404 - Not Found Handler
fastify.setNotFoundHandler((req, reply) => {
  reply.code(404).send();
});
// Error Handler
fastify.setErrorHandler((err, req, reply) => {
  if ((err as any).code === "P2025") {
    return reply.code(404).send();
  }
  // Zod validation error
  if ((err as any).code === "FST_ERR_VALIDATION") {
    const issues = (err as any).validation ?? [];
    return reply.code(400).send({
      message: "Validation error",
      context: (err as any).validationContext, // "body" | "params" | "querystring" ...
      issues: issues.map((i: any) => ({
        path: i.instancePath, // like "/serverId"
        message: i.message,
      })),
    });
  }
  // CSRF errors
  if ((err as any).code === "FST_CSRF_MISSING_SECRET") {
    return reply.code(400).send({ message: "CSRF token missing" });
  }
  // CSRF errors
  if ((err as any).code === "FST_CSRF_INVALID_TOKEN") {
    return reply.code(403).send({ message: "Invalid CSRF token" });
  }
  // Log error
  req.log.error(err);
  reply.code(500).send();
});
/* -------------------------------------------------------------------------- */
/*                                  Listener                                  */
/* -------------------------------------------------------------------------- */
fastify.listen({ port: env.PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`🚀 Server listening at ${address}`);
  env.NODE_ENV === "development" &&
    fastify.log.info(`📚 API docs available at ${address}/docs`);
  fastify.log.info(`🔧 Running in ${env.NODE_ENV}`);
  fastify.log.info(`\t 🚨 JWT using ${env.JWT_MODE} mode`);
  fastify.log.info(
    `\t 🚨 Currently ${env.IGNORE_CSRF ? "ignoring" : "enforcing"} CSRF`,
  );
  fastify.log.info(
    `\t 🚨 Currently ${env.IGNORE_AGENT ? "ignoring" : "enforcing"} Agent connection`,
  );
});
