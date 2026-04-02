function ensureExtension(path: string, extension: string) {
  return path.toLocaleLowerCase().endsWith(extension) ? path : `${path}${extension}`;
}

export function ensureFableExtension(path: string) {
  return ensureExtension(path, ".fable");
}

export function ensureMarkdownExtension(path: string) {
  return ensureExtension(path, ".md");
}

export function ensureHtmlExtension(path: string) {
  return ensureExtension(path, ".html");
}

export function fileStem(path: string) {
  const fileName = path.split(/[\\/]/).pop() ?? path;
  return fileName.replace(/\.[^.]+$/, "");
}
