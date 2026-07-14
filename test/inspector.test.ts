import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { z } from "zod";
import { inspect } from "../src/inspector.js";
import { toMarkdown, toJson } from "../src/report.js";
import type { ConnectedClient } from "../src/connection.js";

describe("inspect (integração in-memory)", () => {
  let server: McpServer;
  let client: Client;

  beforeAll(async () => {
    server = new McpServer({ name: "demo-server", version: "1.2.3" });
    server.registerTool(
      "saudar",
      { description: "Saúda o usuário", inputSchema: { nome: z.string() } },
      async ({ nome }) => ({ content: [{ type: "text", text: `Oi ${nome}` }] })
    );
    server.registerResource("config", "file:///config.json", { description: "config" }, async (uri) => ({
      contents: [{ uri: uri.href, text: "{}" }],
    }));
    server.registerPrompt("traduzir", { description: "traduz", args: [{ name: "texto", required: true }] }, async ({ texto }) => ({
      messages: [{ role: "user", content: { type: "text", text: texto as string } }],
    }));

    const [cTransport, sTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(sTransport);
    client = new Client({ name: "test", version: "1" });
    await client.connect(cTransport);
  });

  afterAll(async () => {
    await server.close();
  });

  function override(): (spec: any) => Promise<ConnectedClient> {
    return async () => ({ client, transportKind: "streamable-http", close: () => client.close() });
  }

  it("lista ferramentas, resources e prompts", async () => {
    const result = await inspect("https://demo.local/mcp", undefined, override());
    expect(result.identity.name).toBe("demo-server");
    expect(result.identity.version).toBe("1.2.3");
    expect(result.tools.map((t) => t.name)).toContain("saudar");
    expect(result.resources.some((r) => r.uri === "file:///config.json")).toBe(true);
    expect(result.prompts.map((p) => p.name)).toContain("traduzir");
    expect(result.capabilities.tools).toBeDefined();
  });

  it("gera relatório Markdown com as 15 etapas", async () => {
    const result = await inspect("https://demo.local/mcp", undefined, override());
    const md = toMarkdown(result);
    expect(md).toContain("Etapa 1 — Identificação");
    expect(md).toContain("Etapa 15 — Relatório Final");
    expect(md).toContain("Score Geral");
    const json = JSON.parse(toJson(result));
    expect(json.overallScore).toBeGreaterThanOrEqual(0);
  });
});
