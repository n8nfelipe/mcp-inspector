# 🔍 MCP Inspector — Relatório de Inspeção

_Gerado em 2026-07-14T05:13:57.709Z_


## Etapa 1 — Identificação

| Campo | Valor |
| --- | --- |
| Nome | smoke-server |
| Versão | 0.9.0 |
| Autor | Não foi possível determinar |
| Licença | Não foi possível determinar |
| Framework | capabilities: resources, tools |
| SDK | Não foi possível determinar |
| Linguagem | Não foi possível determinar |
| SO | Linux |
| Transporte | stdio |
| JSON-RPC | 2.0 |
| Versão do protocolo | Não foi possível determinar |

## Etapa 2 — Ferramentas (1)

### 🔧 echo

Devolve o texto recebido

**Parâmetros:** text
**Obrigatórios:** text
**Retorno:** resultado de tool MCP (content[])

## Etapa 3 — Resources (1)

| URI | Nome | Descrição | Mime Type |
| --- | --- | --- | --- |
| file:///status.txt | status | status file | - |

## Etapa 4 — Prompts (0)

Nenhum prompt exposto.

## Etapa 5 — Capabilities

| Capability | Suportado |
| --- | --- |
| resources | ✅ |
| tools | ✅ |

## Etapa 6 — Compatibilidade

| Cliente | Status | Motivo | Adaptação? |
| --- | --- | --- | --- |
| Claude Desktop | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| Claude Code | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| OpenAI Agents | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| ChatGPT | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| Codex | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| Cursor | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| VSCode | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| Windsurf | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| Continue.dev | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| Goose | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| OpenCode | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| Hermes Agent | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| LangChain | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| LlamaIndex | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| n8n | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| Flowise | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| AutoGen | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| CrewAI | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| Semantic Kernel | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |
| Open Interpreter | compatible | Transporte stdio amplamente suportado por clientes MCP. | Não |

## Etapa 7/8 — Latência & Performance

Não foi possível determinar métricas de latência/performance (a inspeção atual não executa carga nem mede tempo por ferramenta ao vivo). Recomenda-se executar com `--benchmark` em versão futura.

## Etapa 9 — Segurança

| Severidade | Título | Detalhe | Recomendação |
| --- | --- | --- | --- |
| ⚠️ warning | Resources com esquema file:// | 1 resource(s) expõem caminhos locais; risco de Path Traversal se a URI não for sanitizada. | Validar e normalizar URIs; restringir a diretórios permitidos. |

## Etapa 10 — Erros & Warnings

**Erros:** nenhum.
**Warnings:**
- Servidor não declara a capability 'prompts'.

## Etapa 11/12 — Boas práticas & Qualidade do Design

- Documentação de ferramentas: 1/1 com descrição
- Modularização, testes e CI: Não foi possível determinar (análise de código-fonte não realizada nesta inspeção ao vivo).

## Etapa 13 — Score

| Categoria | Nota (0-10) | Grau |
| --- | --- | --- |
| Funcionalidade | 8 | ★★★★ |
| Performance | 6 | ★★★ |
| Segurança | 8 | ★★★★ |
| Compatibilidade | 10 | ★★★★★ |
| Documentação | 8 | ★★★★ |
| Facilidade de uso | 10 | ★★★★★ |
| Organização | 6 | ★★★ |
| Qualidade do código | 6 | ★★★ |
| Escalabilidade | 5 | ★★ |
| Confiabilidade | 9 | ★★★★★ |

**Score Geral:** 7.6 ★★★★


## Etapa 14 — Melhorias

| Prioridade | Problema | Impacto | Solução recomendada |
| --- | --- | --- | --- |
| Média | Resources com esquema file:// | warning | Validar e normalizar URIs; restringir a diretórios permitidos. |

## Etapa 15 — Relatório Final

**Resumo:** Inspeção de "smoke-server" via stdio.
**Ferramentas:** 1 | **Resources:** 1 | **Prompts:** 0
**Score Geral:** 7.6 ★★★★
**Conclusão:** Servidor respondeu conforme o protocolo; adequação geral positiva para os sinais inspecionados.