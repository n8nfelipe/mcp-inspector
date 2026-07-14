import type { InspectionResult, Tool, Resource, Prompt, Finding, CompatibilityRow, ScoreEntry } from "./types.js";

function section(title: string): string {
  return `\n## ${title}\n`;
}

function severityIcon(s: Finding["severity"]): string {
  return s === "critical" ? "❌" : s === "warning" ? "⚠️" : "ℹ️";
}

function table(headers: string[], rows: string[][]): string {
  const esc = (v: string) => v.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.map(esc).join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}`;
}

function describeTool(t: Tool): string {
  const props = (t.inputSchema && (t.inputSchema as any).properties) || {};
  const required = (t.inputSchema && (t.inputSchema as any).required) || [];
  const params = Object.keys(props);
  return [
    `### 🔧 ${t.name}`,
    t.description ? `\n${t.description}\n` : "\n_Sem descrição._\n",
    `**Parâmetros:** ${params.length ? params.join(", ") : "nenhum"}`,
    `**Obrigatórios:** ${required.length ? required.join(", ") : "nenhum"}`,
    `**Retorno:** resultado de tool MCP (content[])`,
  ].join("\n");
}

export function toMarkdown(r: InspectionResult): string {
  const parts: string[] = [];
  parts.push(`# 🔍 MCP Inspector — Relatório de Inspeção\n`);
  parts.push(`_Gerado em ${r.generatedAt}_\n`);

  parts.push(section("Etapa 1 — Identificação"));
  parts.push(
    table(
      ["Campo", "Valor"],
      [
        ["Nome", r.identity.name],
        ["Versão", r.identity.version],
        ["Autor", r.identity.author],
        ["Licença", r.identity.license],
        ["Framework", r.identity.framework],
        ["SDK", r.identity.sdk],
        ["Linguagem", r.identity.language],
        ["SO", r.identity.os],
        ["Transporte", r.identity.transport],
        ["JSON-RPC", r.identity.jsonRpc],
        ["Versão do protocolo", r.identity.protocolVersion],
      ]
    )
  );

  parts.push(section(`Etapa 2 — Ferramentas (${r.tools.length})`));
  parts.push(r.tools.length ? r.tools.map(describeTool).join("\n\n") : "Nenhuma ferramenta exposta.");

  parts.push(section(`Etapa 3 — Resources (${r.resources.length + r.resourceTemplates.length})`));
  const resRows = [...r.resources, ...r.resourceTemplates].map((res: Resource) => [
    res.uri,
    res.name ?? "-",
    res.description ?? "-",
    res.mimeType ?? "-",
  ]);
  parts.push(resRows.length ? table(["URI", "Nome", "Descrição", "Mime Type"], resRows) : "Nenhum resource exposto.");

  parts.push(section(`Etapa 4 — Prompts (${r.prompts.length})`));
  const promptRows = r.prompts.map((p: Prompt) => {
    const args = (p.arguments ?? []) as Array<{ name: string; required?: boolean }>;
    return [p.name, p.description ?? "-", args.map((a) => a.name + (a.required ? "*" : "")).join(", ") || "-"];
  });
  parts.push(promptRows.length ? table(["Nome", "Descrição", "Variáveis (*obrig.)"], promptRows) : "Nenhum prompt exposto.");

  parts.push(section("Etapa 5 — Capabilities"));
  const caps = r.capabilities as Record<string, unknown>;
  parts.push(
    table(
      ["Capability", "Suportado"],
      Object.keys(caps).length
        ? Object.entries(caps).map(([k, v]) => [k, v ? "✅" : "❌"])
        : [["(nenhuma detectada)", "-"]]
    )
  );

  parts.push(section("Etapa 6 — Compatibilidade"));
  parts.push(
    table(
      ["Cliente", "Status", "Motivo", "Adaptação?"],
      r.compatibility.map((c: CompatibilityRow) => [
        c.client,
        c.status,
        c.reason,
        c.needsAdaptation ? "Sim" : "Não",
      ])
    )
  );

  parts.push(section("Etapa 7/8 — Latência & Performance"));
  parts.push(
    "Não foi possível determinar métricas de latência/performance (a inspeção atual não executa carga nem mede tempo por ferramenta ao vivo). Recomenda-se executar com `--benchmark` em versão futura."
  );

  parts.push(section("Etapa 9 — Segurança"));
  if (r.findings.length) {
    parts.push(
      table(
        ["Severidade", "Título", "Detalhe", "Recomendação"],
        r.findings.map((f: Finding) => [
          `${severityIcon(f.severity)} ${f.severity}`,
          f.title,
          f.detail,
          f.recommendation ?? "-",
        ])
      )
    );
  } else {
    parts.push("✅ Nenhum problema de segurança óbvio detectado nos sinais observáveis.");
  }

  parts.push(section("Etapa 10 — Erros & Warnings"));
  parts.push(r.errors.length ? "**Erros:**\n- " + r.errors.join("\n- ") : "**Erros:** nenhum.");
  parts.push(r.warnings.length ? "**Warnings:**\n- " + r.warnings.join("\n- ") : "**Warnings:** nenhum.");

  parts.push(section("Etapa 11/12 — Boas práticas & Qualidade do Design"));
  parts.push(
    "- Documentação de ferramentas: " +
      (r.tools.length ? `${r.tools.filter((t) => t.description).length}/${r.tools.length} com descrição` : "n/a")
  );
  parts.push("- Modularização, testes e CI: Não foi possível determinar (análise de código-fonte não realizada nesta inspeção ao vivo).");

  parts.push(section("Etapa 13 — Score"));
  parts.push(
    table(
      ["Categoria", "Nota (0-10)", "Grau"],
      r.scores.map((s: ScoreEntry) => [s.category, String(s.value), s.grade])
    )
  );
  parts.push(`\n**Score Geral:** ${r.overallScore} ${r.overallGrade}\n`);

  parts.push(section("Etapa 14 — Melhorias"));
  const critical = r.findings.filter((f) => f.severity === "critical" || f.severity === "warning");
  if (critical.length) {
    parts.push(
      table(
        ["Prioridade", "Problema", "Impacto", "Solução recomendada"],
        critical.map((f) => [
          f.severity === "critical" ? "Alta" : "Média",
          f.title,
          f.severity,
          f.recommendation ?? "-",
        ])
      )
    );
  } else {
    parts.push("Nenhuma melhoria crítica identificada nos sinais observáveis.");
  }

  parts.push(section("Etapa 15 — Relatório Final"));
  parts.push(`**Resumo:** Inspeção de "${r.identity.name}" via ${r.identity.transport}.`);
  parts.push(`**Ferramentas:** ${r.tools.length} | **Resources:** ${r.resources.length + r.resourceTemplates.length} | **Prompts:** ${r.prompts.length}`);
  parts.push(`**Score Geral:** ${r.overallScore} ${r.overallGrade}`);
  parts.push(`**Conclusão:** ${conclusion(r)}`);

  return parts.join("\n");
}

function conclusion(r: InspectionResult): string {
  if (r.errors.length > 0) return "Servidor apresentou erros durante a listagem; revisar antes de uso em produção.";
  if (r.findings.some((f) => f.severity === "critical")) return "Riscos críticos de segurança detectados; correção obrigatória.";
  return "Servidor respondeu conforme o protocolo; adequação geral positiva para os sinais inspecionados.";
}

export function toJson(r: InspectionResult): string {
  return JSON.stringify(r, null, 2);
}
