import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { ConnectionSpec } from "./input.js";
import type { TransportKind } from "./types.js";

export interface ConnectedClient {
  client: Client;
  transportKind: TransportKind;
  close: () => Promise<void>;
}

const CLIENT_META = { name: "mcp-inspector", version: "0.1.0" } as const;

export async function connect(spec: ConnectionSpec): Promise<ConnectedClient> {
  const client = new Client(CLIENT_META, { capabilities: {} });

  if (spec.type === "stdio") {
    const transport = new StdioClientTransport({
      command: spec.command,
      args: spec.args,
      env: { ...process.env, ...spec.env } as Record<string, string>,
      cwd: spec.cwd,
      stderr: "pipe",
    });
    await client.connect(transport);
    return { client, transportKind: "stdio", close: () => client.close() };
  }

  const url = new URL(spec.url);
  if (spec.transport === "sse") {
    const transport = new SSEClientTransport(url, { requestInit: { headers: spec.headers } });
    await client.connect(transport);
    return { client, transportKind: "sse", close: () => client.close() };
  }

  try {
    const transport = new StreamableHTTPClientTransport(url, {
      requestInit: { headers: spec.headers },
    });
    await client.connect(transport);
    return { client, transportKind: "streamable-http", close: () => client.close() };
  } catch (err) {
    const transport = new SSEClientTransport(url, { requestInit: { headers: spec.headers } });
    await client.connect(transport);
    return { client, transportKind: "sse", close: () => client.close() };
  }
}
