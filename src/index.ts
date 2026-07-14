#!/usr/bin/env node
import { Command } from "commander";
import { inspect } from "./inspector.js";
import { toMarkdown, toJson } from "./report.js";

const program = new Command();

program
  .name("mcp-inspector")
  .description("Inspeciona servidores MCP ao vivo e gera um relatório técnico de 15 etapas.")
  .argument("<target>", "URL do servidor MCP ou caminho de configuração local (JSON/diretório)")
  .option("-s, --server <name>", "Nome do servidor dentro de uma configuração MCP com múltiplos servidores")
  .option("-f, --format <format>", "Formato de saída: md | json", "md")
  .option("-o, --output <file>", "Escrever relatório em arquivo em vez de stdout")
  .action(async (target: string, opts: { server?: string; format: string; output?: string }) => {
    try {
      const result = await inspect(target, opts.server);
      const output = opts.format === "json" ? toJson(result) : toMarkdown(result);
      if (opts.output) {
        const { writeFileSync } = await import("node:fs");
        writeFileSync(opts.output, output, "utf8");
        console.error(`Relatório escrito em ${opts.output}`);
      } else {
        console.log(output);
      }
    } catch (err) {
      console.error(`Erro na inspeção: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
