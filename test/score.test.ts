import { describe, it, expect } from "vitest";
import { computeScores, type ScoreInput } from "../src/analyzers/score.js";
import type { Tool, Resource, Prompt } from "@modelcontextprotocol/sdk/types.js";

function base(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    identity: { name: "x", version: "1", author: "-", license: "-", framework: "-", sdk: "-", language: "-", os: "-", transport: "stdio", jsonRpc: "2.0", protocolVersion: "-" },
    tools: [],
    resources: [],
    resourceTemplates: [],
    prompts: [],
    capabilities: {},
    transportKind: "stdio",
    errors: [],
    warnings: [],
    ...overrides,
  };
}

describe("computeScores", () => {
  it("penaliza segurança com findings críticos", () => {
    const { entries } = computeScores(base(), [{ severity: "critical", title: "x", detail: "y" }], []);
    const sec = entries.find((e) => e.category === "Segurança")!;
    expect(sec.value).toBeLessThan(10);
  });

  it("calcula score geral dentro de 0-10", () => {
    const tools: Tool[] = [{ name: "t", description: "d", inputSchema: { type: "object", properties: {} } }];
    const { overall } = computeScores(base({ tools, capabilities: { tools: {}, resources: {}, prompts: {} } }), [], []);
    expect(overall).toBeGreaterThanOrEqual(0);
    expect(overall).toBeLessThanOrEqual(10);
  });

  it("compatibilidade alta quando todos compatíveis", () => {
    const comp = Array.from({ length: 20 }, (_, i) => ({ client: `c${i}`, status: "compatible" as const, reason: "", needsAdaptation: false }));
    const { entries } = computeScores(base(), [], comp);
    const cat = entries.find((e) => e.category === "Compatibilidade")!;
    expect(cat.value).toBe(10);
  });

  it("penaliza confiabilidade por erros", () => {
    const { entries } = computeScores(base({ errors: ["e1", "e2"] }), [], []);
    const rel = entries.find((e) => e.category === "Confiabilidade")!;
    expect(rel.value).toBeLessThanOrEqual(6);
  });
});
