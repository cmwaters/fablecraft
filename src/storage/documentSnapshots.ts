import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import type { DocumentSnapshot, EditableDocumentSnapshot, SaveDocumentResult } from "../domain/document/types";
import type { DocumentClock, FablecraftError } from "../types/document";

export const cardSchema = z.object({
  documentId: z.string().min(1),
  id: z.string().min(1),
  orderIndex: z.number().int().min(0),
  parentId: z.string().nullable(),
  type: z.literal("card"),
});

export const contentSchema = z.object({
  cardId: z.string().min(1),
  contentJson: z.string().min(1),
});

export const revisionSchema = z.object({
  createdAtMs: z.number().int().nonnegative(),
  id: z.string().min(1),
  snapshot: z.string().min(1),
});

export const documentSummarySchema = z.object({
  documentId: z.string().min(1),
  fileModifiedAtMs: z.number().int().nonnegative().optional(),
  name: z.string().min(1),
  openedAtMs: z.number().int().nonnegative(),
  path: z.string().min(1),
  updatedAtMs: z.number().int().nonnegative().optional(),
});

const documentClockSchema = z.object({
  documentId: z.string().min(1),
  fileModifiedAtMs: z.number().int().nonnegative(),
  updatedAtMs: z.number().int().nonnegative(),
});

export const snapshotSchema = z.object({
  cards: z.array(cardSchema),
  contents: z.array(contentSchema),
  revisions: z.array(revisionSchema),
  summary: documentSummarySchema,
});

const editableSnapshotSchema = z.object({
  cards: z.array(cardSchema),
  contents: z.array(contentSchema),
  documentId: z.string().min(1),
});

const saveResultSchema = z.object({
  revisionId: z.string().min(1),
  savedAtMs: z.number().int().nonnegative(),
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

export async function loadCurrentDocumentSnapshot(): Promise<DocumentSnapshot> {
  try {
    return snapshotSchema.parse(await invoke("load_current_document"));
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function loadCurrentDocumentClock(): Promise<DocumentClock> {
  try {
    return documentClockSchema.parse(await invoke("load_current_document_clock"));
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function saveCurrentDocumentSnapshot(
  snapshot: EditableDocumentSnapshot,
): Promise<SaveDocumentResult> {
  try {
    return saveResultSchema.parse(
      await invoke("save_current_document", {
        snapshot: editableSnapshotSchema.parse(snapshot),
      }),
    );
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function saveDocumentSnapshotAtPath(
  path: string,
  snapshot: EditableDocumentSnapshot,
): Promise<SaveDocumentResult> {
  try {
    return saveResultSchema.parse(
      await invoke("save_document", {
        path,
        snapshot: editableSnapshotSchema.parse(snapshot),
      }),
    );
  } catch (error) {
    throw normalizeError(error);
  }
}
