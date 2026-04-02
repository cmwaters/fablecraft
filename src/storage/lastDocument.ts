const LAST_DOCUMENT_STORAGE_KEY = "fablecraft:last-document-path";
const RECENT_DOCUMENT_STORAGE_KEY = "fablecraft:recent-document-paths";
const MAX_RECENT_DOCUMENTS = 5;

function parseRecentDocumentPaths(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  } catch {
    return [];
  }
}

export function readRecentDocumentPaths() {
  const storedRecentPaths = parseRecentDocumentPaths(
    window.localStorage.getItem(RECENT_DOCUMENT_STORAGE_KEY),
  );

  if (storedRecentPaths.length > 0) {
    return storedRecentPaths.slice(0, MAX_RECENT_DOCUMENTS);
  }

  const legacyPath = window.localStorage.getItem(LAST_DOCUMENT_STORAGE_KEY);

  return legacyPath ? [legacyPath] : [];
}

export function readLastDocumentPath() {
  return readRecentDocumentPaths()[0] ?? null;
}

export function rememberLastDocumentPath(path: string) {
  const nextRecentPaths = [
    path,
    ...readRecentDocumentPaths().filter((entry) => entry !== path),
  ].slice(0, MAX_RECENT_DOCUMENTS);

  window.localStorage.setItem(RECENT_DOCUMENT_STORAGE_KEY, JSON.stringify(nextRecentPaths));
  window.localStorage.setItem(LAST_DOCUMENT_STORAGE_KEY, path);

  return nextRecentPaths;
}

export function forgetRecentDocumentPath(path: string) {
  const nextRecentPaths = readRecentDocumentPaths().filter((entry) => entry !== path);

  if (nextRecentPaths.length > 0) {
    window.localStorage.setItem(RECENT_DOCUMENT_STORAGE_KEY, JSON.stringify(nextRecentPaths));
    window.localStorage.setItem(LAST_DOCUMENT_STORAGE_KEY, nextRecentPaths[0]!);
  } else {
    window.localStorage.removeItem(RECENT_DOCUMENT_STORAGE_KEY);
    window.localStorage.removeItem(LAST_DOCUMENT_STORAGE_KEY);
  }

  return nextRecentPaths;
}

export function clearLastDocumentPath() {
  window.localStorage.removeItem(RECENT_DOCUMENT_STORAGE_KEY);
  window.localStorage.removeItem(LAST_DOCUMENT_STORAGE_KEY);
}
