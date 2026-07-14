import type { ServerCapabilities, Tool, Resource, Prompt } from "@modelcontextprotocol/sdk/types.js";
import type { Finding, TransportKind, Identity } from "../types.js";

export interface SecurityInput {
  identity: Identity;
  tools: Tool[];
  resources: Resource[];
  resourceTemplates: Resource[];
  prompts: Prompt[];
  capabilities: ServerCapabilities;
  transportKind: TransportKind;
  spec: { type: "remote" | "stdio"; url?: string; headers?: Record<string, string> };
}

const DANGEROUS_PATTERNS = /(eval|exec|shell|sh|bash|cmd|run_command|spawn|system|subprocess)/i;

export function analyzeSecurity(input: SecurityInput): Finding[] {
  const findings: Finding[] = [];
  const { transportKind, spec, tools, resources } = input;

  if (transportKind !== "stdio" && spec.url) {
    const isHttps = spec.url.startsWith("https://");
    if (!isHttps) {
      findings.push({
        severity: "critical",
        title: "Transporte em texto plano (não HTTPS)",
        detail: `O endpoint remoto usa ${spec.url.split(":")[0]}:// sem TLS. Dados e tokens trafegam sem criptografia.`,
        recommendation: "Expor o servidor apenas via HTTPS com certificado válido.",
      });
    } else if (!spec.headers || Object.keys(spec.headers).length === 0) {
      findings.push({
        severity: "warning",
        title: "Sem autenticação detectada no transporte remoto",
        detail: "Conexão HTTPS sem headers de autorização informados; o servidor pode aceitar requisições anônimas.",
        recommendation: "Exigir token Bearer/Cookie e validar origem (CORS) no servidor.",
      });
    }
  }

  const dangerous = tools.filter((t) => DANGEROUS_PATTERNS.test(t.name));
  if (dangerous.length > 0) {
    findings.push({
      severity: "warning",
      title: "Ferramentas com potencial execução de comando",
      detail: `Detectadas ${dangerous.length} ferramenta(s) com nomes sugestivos de execução: ${dangerous
        .map((t) => t.name)
        .join(", ")}.`,
      recommendation: "Isolar em sandbox, validar entradas e evitar concatenação de shell.",
    });
  }

  const fileResources = resources.filter((r) => r.uri.startsWith("file://"));
  if (fileResources.length > 0) {
    findings.push({
      severity: "warning",
      title: "Resources com esquema file://",
      detail: `${fileResources.length} resource(s) expõem caminhos locais; risco de Path Traversal se a URI não for sanitizada.`,
      recommendation: "Validar e normalizar URIs; restringir a diretórios permitidos.",
    });
  }

  const noDesc = tools.filter((t) => !t.description);
  if (noDesc.length > 0) {
    findings.push({
      severity: "info",
      title: "Ferramentas sem descrição",
      detail: `${noDesc.length} de ${tools.length} ferramenta(s) não possuem descrição.`,
      recommendation: "Adicionar descrições claras para melhor descoberta e usabilidade.",
    });
  }

  if (input.capabilities.logging) {
    findings.push({
      severity: "info",
      title: "Logging habilitado",
      detail: "O servidor expõe capacidade de logging; garanta que não registre secrets.",
      recommendation: "Redactar tokens/chaves em logs.",
    });
  }

  return findings;
}
