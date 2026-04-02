import { open, save } from "@tauri-apps/plugin-dialog";
import { createDocumentAtPath, openDocumentAtPath } from "../storage/documents";
import {
  ensureFableExtension,
  ensureHtmlExtension,
  ensureMarkdownExtension,
  fileStem,
} from "../storage/filePaths";

const DOCUMENT_FILTERS = [{ name: "Fablecraft documents", extensions: ["fable"] }];
const MARKDOWN_FILTERS = [{ name: "Markdown", extensions: ["md", "markdown"] }];

export async function promptForNewDocument() {
  const selectedPath = await save({
    title: "Create Fablecraft document",
    filters: DOCUMENT_FILTERS,
    defaultPath: "untitled.fable",
  });

  if (!selectedPath) {
    return null;
  }

  return createDocumentAtPath(ensureFableExtension(selectedPath));
}

export async function promptForOpenDocument() {
  const selectedPath = await open({
    title: "Open Fablecraft document",
    directory: false,
    multiple: false,
    filters: DOCUMENT_FILTERS,
  });

  if (!selectedPath || Array.isArray(selectedPath)) {
    return null;
  }

  return openDocumentAtPath(selectedPath);
}

export async function promptForMarkdownImportPath() {
  const selectedPath = await open({
    title: "Select Markdown file",
    directory: false,
    multiple: false,
    filters: MARKDOWN_FILTERS,
  });

  if (!selectedPath || Array.isArray(selectedPath)) {
    return null;
  }

  return selectedPath;
}

export async function promptForMarkdownImportTargetPath(sourcePath: string) {
  const selectedPath = await save({
    title: "Create imported Fablecraft document",
    filters: DOCUMENT_FILTERS,
    defaultPath: `${fileStem(sourcePath)}.fable`,
  });

  if (!selectedPath) {
    return null;
  }

  return ensureFableExtension(selectedPath);
}

export async function promptForExportPath(
  documentName: string,
  format: "html" | "markdown",
) {
  const extension = format === "markdown" ? ".md" : ".html";
  const selectedPath = await save({
    title: format === "markdown" ? "Export Markdown" : "Export HTML",
    filters: [
      {
        name: format === "markdown" ? "Markdown" : "HTML",
        extensions: [extension.slice(1)],
      },
    ],
    defaultPath: `${documentName}${extension}`,
  });

  if (!selectedPath) {
    return null;
  }

  return format === "markdown"
    ? ensureMarkdownExtension(selectedPath)
    : ensureHtmlExtension(selectedPath);
}
