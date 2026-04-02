import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import type { FablecraftError } from "../types/document";

const integrationStatusSchema = z.object({
  binaryExists: z.boolean(),
  binaryPath: z.string().nullable().optional(),
  configPath: z.string().min(1),
  enabled: z.boolean(),
});

const localIntegrationStatusesSchema = z.object({
  claudeDesktop: integrationStatusSchema,
  codex: integrationStatusSchema,
});

export type LocalIntegrationStatus = z.infer<typeof integrationStatusSchema>;
export type LocalIntegrationStatuses = z.infer<typeof localIntegrationStatusesSchema>;

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

export async function loadLocalIntegrationStatuses() {
  try {
    return localIntegrationStatusesSchema.parse(
      await invoke("load_local_integration_statuses"),
    );
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function enableClaudeDesktopIntegration() {
  try {
    return integrationStatusSchema.parse(
      await invoke("enable_claude_desktop_integration"),
    );
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function enableCodexIntegration() {
  try {
    return integrationStatusSchema.parse(await invoke("enable_codex_integration"));
  } catch (error) {
    throw normalizeError(error);
  }
}
