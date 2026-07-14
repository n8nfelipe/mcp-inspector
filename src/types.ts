import type { Tool, Resource, Prompt, ServerCapabilities, Implementation } from "@modelcontextprotocol/sdk/types.js";

export type { Tool, Resource, Prompt, ServerCapabilities, Implementation } from "@modelcontextprotocol/sdk/types.js";

export type TransportKind = "stdio" | "sse" | "streamable-http" | "websocket" | "unknown";

export type ScoreCategory =
  | "Funcionalidade"
  | "Performance"
  | "Segurança"
  | "Compatibilidade"
  | "Documentação"
  | "Facilidade de uso"
  | "Organização"
  | "Qualidade do código"
  | "Escalabilidade"
  | "Confiabilidade";

export type ScoreGrade = "★★★★★" | "★★★★" | "★★★" | "★★" | "★";

export interface ScoreEntry {
  category: ScoreCategory;
  value: number;
  grade: ScoreGrade;
}

export type Severity = "critical" | "warning" | "info";

export interface Finding {
  severity: Severity;
  title: string;
  detail: string;
  recommendation?: string;
}

export interface CompatibilityRow {
  client: string;
  status: "compatible" | "partial" | "unsupported";
  reason: string;
  needsAdaptation: boolean;
}

export interface Identity {
  name: string;
  version: string;
  author: string;
  license: string;
  framework: string;
  sdk: string;
  language: string;
  os: string;
  transport: TransportKind;
  jsonRpc: string;
  protocolVersion: string;
}

export interface InspectionInput {
  raw: string;
  kind: "url" | "config-path" | "config-object";
  transportHint?: TransportKind;
}

export interface InspectionResult {
  identity: Identity;
  tools: Tool[];
  resources: Resource[];
  resourceTemplates: Resource[];
  prompts: Prompt[];
  capabilities: ServerCapabilities;
  serverInfo?: Implementation;
  compatibility: CompatibilityRow[];
  findings: Finding[];
  scores: ScoreEntry[];
  overallScore: number;
  overallGrade: ScoreGrade;
  errors: string[];
  warnings: string[];
  generatedAt: string;
}
