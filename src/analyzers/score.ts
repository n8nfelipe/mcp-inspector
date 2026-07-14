import type { ScoreEntry, ScoreCategory, ScoreGrade, Finding, CompatibilityRow, TransportKind, ServerCapabilities, Tool, Resource, Prompt, Identity } from "../types.js";

export interface ScoreInput {
  identity: Identity;
  tools: Tool[];
  resources: Resource[];
  resourceTemplates: Resource[];
  prompts: Prompt[];
  capabilities: ServerCapabilities;
  transportKind: TransportKind;
  errors: string[];
  warnings: string[];
}

function clamp(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v * 10) / 10));
}

function gradeFor(value: number): ScoreGrade {
  if (value >= 9) return "★★★★★";
  if (value >= 7.5) return "★★★★";
  if (value >= 6) return "★★★";
  if (value >= 4) return "★★";
  return "★";
}

function scoreSecurity(findings: Finding[]): number {
  let s = 10;
  for (const f of findings) {
    if (f.severity === "critical") s -= 4;
    else if (f.severity === "warning") s -= 2;
    else s -= 0.5;
  }
  return clamp(s);
}

function scoreCompatibility(rows: CompatibilityRow[]): number {
  if (rows.length === 0) return 5;
  const weights = { compatible: 1, partial: 0.5, unsupported: 0 };
  const total = rows.reduce((acc, r) => acc + weights[r.status], 0);
  return clamp((total / rows.length) * 10);
}

function scoreFunctionality(input: ScoreInput): number {
  if (input.errors.length > 0) return clamp(5 - input.errors.length);
  const features = (input.tools.length > 0 ? 3 : 0) + (input.resources.length > 0 || input.resourceTemplates.length > 0 ? 2 : 0) + (input.prompts.length > 0 ? 2 : 0);
  return clamp(features + (input.capabilities ? 3 : 0));
}

function scoreDocumentation(input: ScoreInput): number {
  let s = 0;
  if (input.identity.name !== "Não foi possível determinar") s += 2;
  if (input.identity.version !== "Não foi possível determinar") s += 1;
  const described = input.tools.filter((t) => t.description).length;
  const toolScore = input.tools.length ? (described / input.tools.length) * 5 : 0;
  return clamp(s + toolScore);
}

function scorePerformance(input: ScoreInput): number {
  let s = input.transportKind === "stdio" ? 6 : 8;
  if (input.capabilities.logging) s += 1;
  if (input.capabilities.completions) s += 1;
  return clamp(s);
}

function scoreReliability(input: ScoreInput): number {
  let s = 10;
  s -= input.errors.length * 2;
  s -= input.warnings.length;
  return clamp(s);
}

function scoreScalability(input: ScoreInput): number {
  if (input.transportKind === "stdio") return 5;
  return input.capabilities ? 8 : 6;
}

function scoreUsability(input: ScoreInput): number {
  const described = input.tools.filter((t) => t.description).length;
  const ratio = input.tools.length ? described / input.tools.length : 0;
  return clamp(ratio * 10);
}

export function computeScores(
  input: ScoreInput,
  findings: Finding[],
  compatibility: CompatibilityRow[]
): { entries: ScoreEntry[]; overall: number; grade: ScoreGrade } {
  const values: Record<ScoreCategory, number> = {
    Funcionalidade: scoreFunctionality(input),
    Performance: scorePerformance(input),
    Segurança: scoreSecurity(findings),
    Compatibilidade: scoreCompatibility(compatibility),
    Documentação: scoreDocumentation(input),
    "Facilidade de uso": scoreUsability(input),
    Organização: 6,
    "Qualidade do código": 6,
    Escalabilidade: scoreScalability(input),
    Confiabilidade: scoreReliability(input),
  };

  const entries: ScoreEntry[] = (Object.keys(values) as ScoreCategory[]).map((category) => ({
    category,
    value: values[category],
    grade: gradeFor(values[category]),
  }));

  const overall = clamp(entries.reduce((acc, e) => acc + e.value, 0) / entries.length);
  return { entries, overall, grade: gradeFor(overall) };
}
