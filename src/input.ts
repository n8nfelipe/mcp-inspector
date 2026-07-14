import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import type { TransportKind } from "./types.js";

export type ConnectionSpec =
  | {
      type: "remote";
      url: string;
      headers: Record<string, string>;
      transport: Extract<TransportKind, "sse" | "streamable-http">;
    }
  | {
      type: "stdio";
      command: string;
      args: string[];
      env: Record<string, string>;
      cwd: string;
    };

const KNOWN_CONFIG_NAMES = ["mcp.config.json", ".mcp.json", "mcp.json", "mcp.config.yaml", "mcp.config.yml"];

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function classifyRemoteTransport(url: string): Extract<TransportKind, "sse" | "streamable-http"> {
  return /\/sse(\?|$)/i.test(url) ? "sse" : "streamable-http";
}

function inferRemote(raw: string): ConnectionSpec {
  const url = raw.trim();
  return {
    type: "remote",
    url,
    headers: {},
    transport: classifyRemoteTransport(url),
  };
}

function extractServerBlock(node: unknown, name?: string): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  if (obj.command || obj.url) return obj;
  const servers = obj.mcpServers;
  if (servers && typeof servers === "object") {
    const map = servers as Record<string, unknown>;
    const key = name && map[name] ? name : Object.keys(map)[0];
    if (key && map[key]) return map[key] as Record<string, unknown>;
  }
  return null;
}

export function parseInput(raw: string, serverName?: string): ConnectionSpec {
  if (isUrl(raw)) return inferRemote(raw);

  const base = resolve(process.cwd(), raw);
  if (!existsSync(base)) {
    throw new Error(`Caminho ou URL inválido: "${raw}" não existe como arquivo/diretório e não é uma URL.`);
  }

  if (statSync(base).isDirectory()) {
    const found = KNOWN_CONFIG_NAMES.map((n) => resolve(base, n)).find((p) => existsSync(p));
    if (!found) {
      throw new Error(
        `Diretório "${raw}" não contém configuração MCP conhecida (${KNOWN_CONFIG_NAMES.join(", ")}).`
      );
    }
    return buildFromConfig(found, serverName);
  }

  if (base.endsWith(".json")) return buildFromConfig(base, serverName);

  throw new Error(`Arquivo "${raw}" não suportado. Use JSON de configuração MCP ou uma URL.`);
}

function buildFromConfig(path: string, serverName?: string): ConnectionSpec {
  const content = readFileSync(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Falha ao parsear JSON em "${path}".`);
  }
  const block = extractServerBlock(parsed, serverName);
  if (!block) {
    throw new Error(`Nenhum bloco de servidor MCP encontrado em "${path}".`);
  }

  if (typeof block.url === "string") {
    return {
      type: "remote",
      url: block.url,
      headers: (block.headers as Record<string, string>) ?? {},
      transport: classifyRemoteTransport(block.url),
    };
  }

  if (typeof block.command === "string") {
    const env = { ...((block.env as Record<string, string>) ?? {}) };
    return {
      type: "stdio",
      command: block.command,
      args: Array.isArray(block.args) ? (block.args as string[]) : [],
      env,
      cwd: resolve(path, ".."),
    };
  }

  throw new Error(`Bloco de servidor em "${path}" precisa de "command" (stdio) ou "url" (remoto).`);
}
