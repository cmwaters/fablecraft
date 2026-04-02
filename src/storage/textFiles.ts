import { invoke } from "@tauri-apps/api/core";
import type { FablecraftError } from "../types/document";

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

export async function readTextFileAtPath(path: string) {
  try {
    return String(await invoke("read_text_file", { path }));
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function writeTextFileAtPath(path: string, contents: string) {
  try {
    await invoke("write_text_file", { contents, path });
  } catch (error) {
    throw normalizeError(error);
  }
}
