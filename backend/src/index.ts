import fastify from "fastify";
import { BaseError, InternalError } from "./errors";
import multipart from "@fastify/multipart";
import auth from "./auth";
import routes from "./http/routes";
import fastifyMultipart from "@fastify/multipart";
import addGlobalErrorHandler from "./utils/errorHandler";

const httpServer = fastify()

addGlobalErrorHandler(httpServer);

await httpServer.register(fastifyMultipart, {
    limits: {
        fileSize: 15_000_000,
        files: 1,
    },
});

await httpServer.register(auth);
await httpServer.register(routes);

const port = Number(process.env.PORT ?? 3000);

await httpServer.listen({ port });

console.log(`Listening on http://localhost:${port}`);
