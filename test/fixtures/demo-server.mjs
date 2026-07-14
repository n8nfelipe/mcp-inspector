import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "smoke-server", version: "0.9.0" });
server.registerTool(
  "echo",
  { description: "Devolve o texto recebido", inputSchema: { text: z.string() } },
  async ({ text }) => ({ content: [{ type: "text", text: String(text) }] })
);
server.registerResource("status", "file:///status.txt", { description: "status file" }, async (uri) => ({
  contents: [{ uri: uri.href, text: "ok" }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
