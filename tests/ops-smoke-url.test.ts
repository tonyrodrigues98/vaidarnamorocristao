import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { runSmoke, SMOKE_ROUTES } from "../scripts/ops/smoke-url.mjs";

const servers: Server[] = [];

async function startServer(handler: Parameters<typeof createServer>[0]) {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("test server did not bind");
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
  );
});

describe("operational URL smoke", () => {
  it("checks every production contract without logging the publishable key", async () => {
    const publicKey = "public-key-must-not-be-logged";
    const baseUrl = await startServer((request, response) => {
      if (request.url === "/v2") {
        response.writeHead(200, { "content-type": "text/html" }).end("tombstone");
        return;
      }
      if (request.url === "/rota-inexistente") {
        response.writeHead(404, { "content-type": "text/html" }).end("not found");
        return;
      }
      if (request.url === "/manifest.webmanifest") {
        response.writeHead(200, { "content-type": "application/manifest+json" }).end("{}");
        return;
      }
      if (request.url === "/sw.js") {
        response.writeHead(200, { "content-type": "text/javascript" }).end("// sw");
        return;
      }
      if (request.url === "/api/public/runtime-config") {
        response.writeHead(200, { "content-type": "application/json" }).end(
          JSON.stringify({
            supabaseUrl: "https://project.supabase.co",
            publishableKey: publicKey,
          }),
        );
        return;
      }
      response.writeHead(200, { "content-type": "text/html" }).end("ok");
    });
    const messages: string[] = [];

    const results = await runSmoke(baseUrl, {
      logger: { log: (message: string) => messages.push(message) },
    });

    expect(results).toHaveLength(SMOKE_ROUTES.length);
    expect(messages.join("\n")).not.toContain(publicKey);
  });

  it("fails on an unexpected status", async () => {
    const baseUrl = await startServer((_request, response) => {
      response.writeHead(503, { "content-type": "text/html" }).end("unavailable");
    });

    await expect(runSmoke(baseUrl, { logger: { log: () => undefined } })).rejects.toThrow(
      "unexpected status 503",
    );
  });

  it("rejects redirects to another origin", async () => {
    const baseUrl = await startServer((_request, response) => {
      response.writeHead(302, { location: "https://example.com/inicio" }).end();
    });

    await expect(
      runSmoke(baseUrl, {
        logger: { log: () => undefined },
        routes: [{ path: "/v2", statuses: [302], kind: "tombstone" }],
      }),
    ).rejects.toThrow("redirect escaped the monitored origin");
  });

  it("rejects the removed V2 visual runtime marker", async () => {
    const baseUrl = await startServer((_request, response) => {
      response
        .writeHead(200, { "content-type": "text/html" })
        .end('<main data-vdn-v2="true">rejected runtime</main>');
    });

    await expect(
      runSmoke(baseUrl, {
        logger: { log: () => undefined },
        routes: [{ path: "/v2", statuses: [200], kind: "tombstone" }],
      }),
    ).rejects.toThrow("V2 visual runtime marker was rendered");
  });

  it("requires HTTPS outside loopback", async () => {
    await expect(runSmoke("http://example.com", { routes: [] })).rejects.toThrow(
      "HTTPS is required",
    );
  });
});
