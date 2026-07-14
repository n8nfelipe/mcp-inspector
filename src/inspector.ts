import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Tool, Resource, Prompt, ServerCapabilities, Implementation } from "@modelcontextprotocol/sdk/types.js";
import { connect, type ConnectedClient } from "./connection.js";
import { parseInput, type ConnectionSpec } from "./input.js";
import type { Identity, InspectionResult, TransportKind } from "./types.js";
import { buildCompatibility } from "./analyzers/compatibility.js";
import { analyzeSecurity } from "./analyzers/security.js";
import { computeScores } from "./analyzers/score.js";

interface Collected {
  identity: Identity;
  tools: Tool[];
  resources: Resource[];
  resourceTemplates: Resource[];
  prompts: Prompt[];
  capabilities: ServerCapabilities;
  serverInfo?: Implementation;
  transportKind: TransportKind;
  errors: string[];
  warnings: string[];
}

async function listWithPagination<T>(
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string }>
): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | undefined;
  do {
    const { items, nextCursor } = await fetchPage(cursor);
    out.push(...items);
    cursor = nextCursor;
  } while (cursor);
  return out;
}

async function gather(client: Client, transportKind: TransportKind): Promise<Collected> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const capabilities = (client.getServerCapabilities() ?? {}) as ServerCapabilities;
  const serverInfo = client.getServerVersion();
  const protocolVersion = safeProtocolVersion(client);

  const identity: Identity = {
    name: serverInfo?.name ?? "Não foi possível determinar",
    version: serverInfo?.version ?? "Não foi possível determinar",
    author: "Não foi possível determinar",
    license: "Não foi possível determinar",
    framework: detectFramework(capabilities),
    sdk: "Não foi possível determinar",
    language: "Não foi possível determinar",
    os: detectOs(),
    transport: transportKind,
    jsonRpc: "2.0",
    protocolVersion,
  };

  let tools: Tool[] = [];
  let resources: Resource[] = [];
  let resourceTemplates: Resource[] = [];
  let prompts: Prompt[] = [];

  if (capabilities.tools) {
    try {
      tools = await listWithPagination<{ name: string } & Tool>((cursor) =>
        client
          .listTools(cursor ? { cursor } : undefined)
          .then((r) => ({ items: r.tools as Tool[], nextCursor: r.nextCursor }))
      );
    } catch (e) {
      errors.push(`tools/list falhou: ${(e as Error).message}`);
    }
  } else {
    warnings.push("Servidor não declara a capability 'tools'.");
  }

  if (capabilities.resources) {
    try {
      resources = await listWithPagination<Resource>((cursor) =>
        client
          .listResources(cursor ? { cursor } : undefined)
          .then((r) => ({ items: r.resources, nextCursor: r.nextCursor }))
      );
    } catch (e) {
      errors.push(`resources/list falhou: ${(e as Error).message}`);
    }
  } else {
    warnings.push("Servidor não declara a capability 'resources'.");
  }

  if (capabilities.resources) {
    try {
      resourceTemplates = await listWithPagination<Resource>((cursor) =>
        client
          .listResourceTemplates(cursor ? { cursor } : undefined)
          .then((r) => ({ items: r.resourceTemplates as unknown as Resource[], nextCursor: r.nextCursor }))
      );
    } catch (e) {
      warnings.push(`resources/templates/list indisponível: ${(e as Error).message}`);
    }
  }

  if (capabilities.prompts) {
    try {
      prompts = await listWithPagination<Prompt>((cursor) =>
        client
          .listPrompts(cursor ? { cursor } : undefined)
          .then((r) => ({ items: r.prompts, nextCursor: r.nextCursor }))
      );
    } catch (e) {
      errors.push(`prompts/list falhou: ${(e as Error).message}`);
    }
  } else {
    warnings.push("Servidor não declara a capability 'prompts'.");
  }

  return { identity, tools, resources, resourceTemplates, prompts, capabilities, serverInfo, transportKind, errors, warnings };
}

function safeProtocolVersion(client: Client): string {
  try {
    const fn = (client as unknown as { getProtocolVersion?: () => string }).getProtocolVersion;
    return fn ? fn.call(client) : "Não foi possível determinar";
  } catch {
    return "Não foi possível determinar";
  }
}

function detectFramework(caps: ServerCapabilities): string {
  const keys = Object.keys(caps ?? {});
  if (keys.length === 0) return "Não foi possível determinar";
  return `capabilities: ${keys.join(", ")}`;
}

function detectOs(): string {
  switch (process.platform) {
    case "win32":
      return "Windows";
    case "darwin":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return "Não foi possível determinar";
  }
}

export async function inspect(
  rawTarget: string,
  serverName?: string,
  connectOverride?: (spec: ConnectionSpec) => Promise<ConnectedClient>
): Promise<InspectionResult> {
  let spec: ConnectionSpec;
  try {
    spec = parseInput(rawTarget, serverName);
  } catch (e) {
    throw e;
  }

  let conn: ConnectedClient | null = null;
  try {
    conn = connectOverride ? await connectOverride(spec) : await connect(spec);
    const collected = await gather(conn.client, conn.transportKind);

    const compatibility = buildCompatibility(collected.capabilities, spec, collected.transportKind);
    const findings = analyzeSecurity({
      identity: collected.identity,
      tools: collected.tools,
      resources: collected.resources,
      resourceTemplates: collected.resourceTemplates,
      prompts: collected.prompts,
      capabilities: collected.capabilities,
      transportKind: collected.transportKind,
      spec: spec.type === "remote" ? { type: "remote", url: spec.url, headers: spec.headers } : { type: "stdio" },
    });
    const scores = computeScores(collected, findings, compatibility);

    return {
      identity: collected.identity,
      tools: collected.tools,
      resources: collected.resources,
      resourceTemplates: collected.resourceTemplates,
      prompts: collected.prompts,
      capabilities: collected.capabilities,
      serverInfo: collected.serverInfo,
      compatibility,
      findings,
      scores: scores.entries,
      overallScore: scores.overall,
      overallGrade: scores.grade,
      errors: collected.errors,
      warnings: collected.warnings,
      generatedAt: new Date().toISOString(),
    };
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch {
        /* ignore */
      }
    }
  }
}
