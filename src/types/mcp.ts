import type { DocumentSnapshot } from "../domain/document/types";

export type McpToolScope = "card" | "document" | "subtree";

export interface McpToolDefinition {
  description: string;
  inputExample: string;
  isMutation: boolean;
  name: string;
  scope: McpToolScope;
}

export interface McpToolRequest {
  argumentsJson?: string | null;
  cardId?: string | null;
  scope: McpToolScope;
  toolName: string;
}

export interface McpToolResponse {
  resultJson: string;
  scope: string;
  snapshot?: DocumentSnapshot | null;
  summary: string;
  toolName: string;
}
