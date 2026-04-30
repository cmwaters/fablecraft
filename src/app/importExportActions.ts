import {
  promptForExportPath,
  promptForMarkdownImportPath,
  promptForMarkdownImportTargetPath,
} from "./documentActions";
import { exportCurrentLevel, markdownToContentJson, type ExportFormat } from "../domain/document/importExport";
import { replaceCardContent } from "../domain/document/content";
import type { DocumentSnapshot } from "../domain/document/types";
import { createDocumentAtPath } from "../storage/documents";
import { loadCurrentDocumentSnapshot, saveCurrentDocumentSnapshot } from "../storage/documentSnapshots";
import { readTextFileAtPath, writeTextFileAtPath } from "../storage/textFiles";
import type { DocumentSummary } from "../types/document";

function editableSnapshot(snapshot: DocumentSnapshot) {
  return {
    cards: snapshot.cards,
    contents: snapshot.contents,
    documentId: snapshot.summary.documentId,
  };
}

function rootCardId(snapshot: DocumentSnapshot) {
  return snapshot.cards.find((card) => card.parentId === null)?.id ?? null;
}

export async function importMarkdownDocument(): Promise<DocumentSummary | null> {
  const sourcePath = await promptForMarkdownImportPath();

  if (!sourcePath) {
    return null;
  }

  const targetPath = await promptForMarkdownImportTargetPath(sourcePath);

  if (!targetPath) {
    return null;
  }

  const markdown = await readTextFileAtPath(sourcePath);
  const document = await createDocumentAtPath(targetPath);
  const snapshot = await loadCurrentDocumentSnapshot();
  const nextRootCardId = rootCardId(snapshot);

  if (!nextRootCardId) {
    throw new Error("Imported documents require a root card.");
  }

  const nextSnapshot = replaceCardContent(snapshot, {
    cardId: nextRootCardId,
    contentJson: markdownToContentJson(markdown),
  });

  await saveCurrentDocumentSnapshot(editableSnapshot(nextSnapshot));

  return document;
}

export async function exportCurrentLevelToFile(
  snapshot: DocumentSnapshot,
  activeCardId: string,
  documentName: string,
  format: ExportFormat,
) {
  const exportedLevel = exportCurrentLevel(snapshot, activeCardId, format);
  const targetPath = await promptForExportPath(documentName, format);

  if (!targetPath) {
    return null;
  }

  await writeTextFileAtPath(targetPath, exportedLevel.content);

  return {
    ...exportedLevel,
    path: targetPath,
  };
}
