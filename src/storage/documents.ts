import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import type { DocumentSummary, FablecraftError } from "../types/document";

const documentSummarySchema = z.object({
  documentId: z.string().min(1),
  layerCount: z.number().int().nonnegative(),
  name: z.string().min(1),
  openedAtMs: z.number().int().nonnegative(),
  path: z.string().min(1),
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
      message: maybeError.message ?? "Unknown error",
      details: maybeError.details ?? null,
    };
  }

  return {
    code: "unknown_error",
    message: error instanceof Error ? error.message : "Unknown error",
    details: null,
  };
}

async function invokeDocumentCommand(
  command: "create_document" | "open_document",
  path: string,
): Promise<DocumentSummary> {
  try {
    const payload = await invoke(command, { path });
    return documentSummarySchema.parse(payload);
  } catch (error) {
    throw normalizeError(error);
  }
}

export function createDocumentAtPath(path: string) {
  return invokeDocumentCommand("create_document", path);
}

export function openDocumentAtPath(path: string) {
  return invokeDocumentCommand("open_document", path);
}

