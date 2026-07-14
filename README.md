# mcp-inspector

CLI que **inspeciona servidores MCP (Model Context Protocol) ao vivo** e gera um relatório técnico de **15 etapas** cobrindo identificação, ferramentas, resources, prompts, capabilities, compatibilidade, latência, performance, segurança, erros, boas práticas, qualidade de design e **Score Geral**.

Conecta-se a servidores via `stdio`, `sse` ou `streamable-http`, executa `initialize` + `* /list` e produz o relatório em Markdown ou JSON.

## Instalação

```bash
pnpm install
pnpm build
```

> **Nota (ambientes com política de supply-chain do pnpm):** na primeira vez pode ser necessário aprovar os scripts de build do `esbuild` com `pnpm approve-builds`.

## Uso

```bash
# Inspecionar por URL remota (streamable-http ou sse)
mcp-inspector https://meu-servidor.com/mcp

# Inspecionar por configuração local (stdio)
mcp-inspector ./mcp.json

# Configuração MCP com múltiplos servidores (escolher um)
mcp-inspector ./mcp.json --server meu-server

# Saída em JSON ou arquivo
mcp-inspector https://exemplo.com/mcp --format json
mcp-inspector ./mcp.json --output relatorio.md
```

### Formatos de entrada aceitos

| Tipo | Exemplo | Transporte inferido |
| --- | --- | --- |
| URL remota | `https://host/mcp` | `streamable-http` |
| URL SSE | `https://host/sse` | `sse` |
| Arquivo JSON (comando) | `{ "command": "node", "args": ["s.js"] }` | `stdio` |
| Arquivo JSON (url) | `{ "url": "https://host/mcp" }` | remoto |
| Configuração MCP | `{ "mcpServers": { "x": { "command": "..." } } }` | `stdio`/`remoto` |
| Diretório | contendo `mcp.json` / `.mcp.json` / `mcp.config.json` | conforme arquivo |

## Relatório (15 etapas)

1. Identificação · 2. Ferramentas · 3. Resources · 4. Prompts · 5. Capabilities
6. Compatibilidade · 7/8. Latência & Performance · 9. Segurança · 10. Erros & Warnings
11/12. Boas práticas & Qualidade · 13. Score · 14. Melhorias · 15. Relatório Final

## Scripts

| Script | Descrição |
| --- | --- |
| `pnpm dev` | Executa a CLI via `tsx` (sem build) |
| `pnpm build` | Compila para `dist/` |
| `pnpm test` | Roda os testes (vitest) |
| `pnpm coverage` | Testes com relatório de cobertura |
| `pnpm lint` | Type-check (`tsc --noEmit`) |

## Stack

TypeScript + Node, `commander` (CLI), `@modelcontextprotocol/sdk` (cliente MCP), `vitest` (testes).

## Licença

MIT
