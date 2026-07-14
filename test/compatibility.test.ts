import { describe, it, expect } from "vitest";
import { buildCompatibility } from "../src/analyzers/compatibility.js";
import type { ServerCapabilities } from "@modelcontextprotocol/sdk/types.js";

describe("buildCompatibility", () => {
  const caps: ServerCapabilities = { tools: {} };

  it("stdio é compatível com todos os clientes", () => {
    const rows = buildCompatibility(caps, {} as any, "stdio");
    expect(rows.length).toBe(20);
    expect(rows.every((r) => r.status === "compatible")).toBe(true);
  });

  it("remoto (streamable-http) marca clientes desktop como parcial", () => {
    const rows = buildCompatibility(caps, {} as any, "streamable-http");
    const claude = rows.find((r) => r.client === "Claude Desktop")!;
    expect(claude.status).toBe("partial");
    expect(claude.needsAdaptation).toBe(true);
  });
});
