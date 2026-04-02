import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import { snapshotSchema } from "./documentSnapshots";
import type { FablecraftError } from "../types/document";
import type { McpToolDefinition, McpToolRequest, McpToolResponse } from "../types/mcp";

const toolDefinitionSchema = z.object({
  description: z.string().min(1),
  inputExample: z.string(),
  isMutation: z.boolean(),
  name: z.string().min(1),
  scope: z.enum(["card", "document", "subtree"]),
});

const toolResponseSchema = z.object({
  resultJson: z.string(),
  scope: z.string().min(1),
  snapshot: snapshotSchema.nullable().optional(),
  summary: z.string().min(1),
  toolName: z.string().min(1),
});

function normalizeError(error: unknown): FablecraftError {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error
  ) {
    const maybeError = error as Partial<FablecraftError>;

    return {
      code: maybeError.code ?? "unknown_error",
      details: maybeError.details ?? null,
      message: maybeError.message ?? "Unknown error",
    };
  }

  return {
    code: "unknown_error",
    details: null,
    message: error instanceof Error ? error.message : "Unknown error",
  };
}

export async function listMcpTools(): Promise<McpToolDefinition[]> {
  try {
    return z.array(toolDefinitionSchema).parse(await invoke("list_mcp_tools"));
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function invokeMcpTool(
  request: McpToolRequest,
): Promise<McpToolResponse> {
  try {
    return toolResponseSchema.parse(await invoke("invoke_mcp_tool", { request }));
  } catch (error) {
    throw normalizeError(error);
  }
}
