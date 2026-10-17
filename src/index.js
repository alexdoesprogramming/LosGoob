import { createServer } from "node:http";
import { hostname } from "node:os";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));
const host = process.env.HOST || "127.0.0.1";
const portValue = Number.parseInt(process.env.PORT || "8080", 10);
const port = Number.isInteger(portValue) && portValue > 0 && portValue < 65536 ? portValue : 8080;

logging.set_level(logging.NONE);
Object.assign(wisp.options, {
  allow_udp_streams: false,
  dns_servers: ["1.1.1.3", "1.0.0.3"]
});

const server = createServer();
const app = Fastify({
  logger: false,
  serverFactory: (handler) => {
    server.on("request", (req, res) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      handler(req, res);
    });
    server.on("upgrade", (req, socket, head) => {
      if (req.url?.endsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
      } else {
        socket.end();
      }
    });
    return server;
  }
});

app.register(fastifyStatic, {
  root: publicPath,
  decorateReply: true
});
app.register(fastifyStatic, {
  root: scramjetPath,
  prefix: "/scram/",
  decorateReply: false
});
app.register(fastifyStatic, {
  root: libcurlPath,
  prefix: "/libcurl/",
  decorateReply: false
});
app.register(fastifyStatic, {
  root: baremuxPath,
  prefix: "/baremux/",
  decorateReply: false
});

app.get("/health", async () => ({
  status: "ok",
  app: "LosGoob",
  engine: "Scramjet",
  version: "1.0.0"
}));

app.setNotFoundHandler(async (_request, reply) => {
  return reply.code(404).type("text/html").sendFile("404.html");
});

const shutdown = async (signal) => {
  console.log("\n" + signal + " received — shutting down LosGoob...");
  try {
    await app.close();
  } finally {
    process.exit(0);
  }
};
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ port, host });
  console.log("");
  console.log("  ╭────────────────────────────────────╮");
  console.log("  │       LosGoob is online ✦          │");
  console.log("  ╰────────────────────────────────────╯");
  console.log(`  Local:   http://localhost:${port}`);
  console.log(`  Network: ${host === "127.0.0.1" ? "disabled (local-only by default)" : `http://${hostname()}:${port}`}`);
  console.log("  Stop with Ctrl+C.");
  console.log("");
} catch (error) {
  console.error("Could not start LosGoob:", error);
  process.exit(1);
}
