import { describe, it, expect } from "vitest";
import { analyzeSecurity, type SecurityInput } from "../src/analyzers/security.js";
import type { Tool, Resource } from "@modelcontextprotocol/sdk/types.js";

function base(overrides: Partial<SecurityInput> = {}): SecurityInput {
  return {
    identity: { name: "x", version: "1", author: "-", license: "-", framework: "-", sdk: "-", language: "-", os: "-", transport: "stdio", jsonRpc: "2.0", protocolVersion: "-" },
    tools: [],
    resources: [],
    resourceTemplates: [],
    prompts: [],
    capabilities: {},
    transportKind: "stdio",
    spec: { type: "stdio" },
    ...overrides,
  };
}

describe("analyzeSecurity", () => {
  it("detecta transporte não HTTPS como crítico", () => {
    const f = analyzeSecurity(base({ transportKind: "streamable-http", spec: { type: "remote", url: "http://x.com/mcp" } }));
    expect(f.some((x) => x.severity === "critical" && /HTTPS/.test(x.title))).toBe(true);
  });

  it("detecta ausência de autenticação em HTTPS remoto", () => {
    const f = analyzeSecurity(base({ transportKind: "streamable-http", spec: { type: "remote", url: "https://x.com/mcp", headers: {} } }));
    expect(f.some((x) => /autenticação/.test(x.title))).toBe(true);
  });

  it("detecta ferramentas perigosas", () => {
    const tools: Tool[] = [{ name: "run_command", inputSchema: { type: "object", properties: {} } }];
    const f = analyzeSecurity(base({ tools }));
    expect(f.some((x) => /execução de comando/.test(x.title))).toBe(true);
  });

  it("detecta resources file://", () => {
    const resources: Resource[] = [{ uri: "file:///etc/passwd", name: "secret" }];
    const f = analyzeSecurity(base({ resources }));
    expect(f.some((x) => /file:\/\//.test(x.title))).toBe(true);
  });

  it("detecta ferramentas sem descrição", () => {
    const tools: Tool[] = [{ name: "t1", inputSchema: { type: "object", properties: {} } }];
    const f = analyzeSecurity(base({ tools }));
    expect(f.some((x) => /descrição/.test(x.title))).toBe(true);
  });
});
