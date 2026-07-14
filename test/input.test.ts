import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseInput } from "../src/input.js";

describe("parseInput", () => {
  it("detecta URL remota como streamable-http por padrão", () => {
    const spec = parseInput("https://exemplo.com/mcp");
    expect(spec.type).toBe("remote");
    expect(spec.transport).toBe("streamable-http");
  });

  it("detecta URL terminando em /sse como sse", () => {
    const spec = parseInput("https://exemplo.com/sse");
    expect(spec.transport).toBe("sse");
  });

  it("lança erro para caminho inexistente", () => {
    expect(() => parseInput("/caminho/que/nao/existe/xyz")).toThrow();
  });

  it("parseia config JSON com bloco de comando (stdio)", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-"));
    const file = join(dir, "mcp.json");
    writeFileSync(
      file,
      JSON.stringify({ command: "node", args: ["server.js"], env: { TOKEN: "x" } })
    );
    const spec = parseInput(file);
    expect(spec.type).toBe("stdio");
    expect(spec.command).toBe("node");
    expect((spec as any).args).toEqual(["server.js"]);
    rmSync(dir, { recursive: true, force: true });
  });

  it("parseia config com mcpServers e seleciona o primeiro", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-"));
    const file = join(dir, "mcp.json");
    writeFileSync(
      file,
      JSON.stringify({
        mcpServers: {
          a: { command: "node", args: ["a.js"] },
          b: { url: "https://b.com/mcp" },
        },
      })
    );
    const specA = parseInput(file);
    expect(specA.type).toBe("stdio");
    const specB = parseInput(file, "b");
    expect(specB.type).toBe("remote");
    rmSync(dir, { recursive: true, force: true });
  });

  it("lança erro se diretório não tiver config conhecida", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-"));
    expect(() => parseInput(dir)).toThrow();
    rmSync(dir, { recursive: true, force: true });
  });
});
