import type { ServerCapabilities } from "@modelcontextprotocol/sdk/types.js";
import type { CompatibilityRow, TransportKind } from "../types.js";
import type { ConnectionSpec } from "../input.js";

const CLIENTS = [
  "Claude Desktop",
  "Claude Code",
  "OpenAI Agents",
  "ChatGPT",
  "Codex",
  "Cursor",
  "VSCode",
  "Windsurf",
  "Continue.dev",
  "Goose",
  "OpenCode",
  "Hermes Agent",
  "LangChain",
  "LlamaIndex",
  "n8n",
  "Flowise",
  "AutoGen",
  "CrewAI",
  "Semantic Kernel",
  "Open Interpreter",
];

function remoteSupport(transport: TransportKind): "compatible" | "partial" | "unsupported" {
  if (transport === "stdio") return "compatible";
  if (transport === "sse" || transport === "streamable-http") return "partial";
  return "unsupported";
}

export function buildCompatibility(
  _caps: ServerCapabilities,
  _spec: ConnectionSpec,
  transport: TransportKind
): CompatibilityRow[] {
  const remote = remoteSupport(transport);

  return CLIENTS.map((client) => {
    if (transport === "stdio") {
      return {
        client,
        status: "compatible" as const,
        reason: "Transporte stdio amplamente suportado por clientes MCP.",
        needsAdaptation: false,
      };
    }

    const desktopLike = ["Claude Desktop", "ChatGPT", "Flowise"];
    if (desktopLike.includes(client) && remote === "partial") {
      return {
        client,
        status: "partial" as const,
        reason: "Remoto HTTP/SSE exige proxy ou ponte para clientes desktop que suportam apenas stdio nativamente.",
        needsAdaptation: true,
      };
    }

    return {
      client,
      status: remote,
      reason:
        remote === "unsupported"
          ? "Transporte não reconhecido; compatibilidade incerta."
          : "Suporta transporte remoto (HTTP/SSE) via configuração de servidor remoto.",
      needsAdaptation: remote === "partial",
    };
  });
}
