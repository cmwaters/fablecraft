import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(repoRoot, "src/site/tutorial.fable");
const outputPath = path.join(repoRoot, "src/site/tutorialSnapshot.ts");

function query(sql) {
  const output = execFileSync("sqlite3", ["-json", sourcePath, sql], {
    encoding: "utf8",
  }).trim();
  return output ? JSON.parse(output) : [];
}

const documents = query("select id, created_at_ms, updated_at_ms from documents order by created_at_ms limit 2;");
if (documents.length !== 1) {
  throw new Error(`Expected exactly one document in ${sourcePath}, found ${documents.length}.`);
}

const document = documents[0];
const layers = query(
  "select id, document_id, name, description, layer_index, color, is_base from layers order by layer_index;",
).map((layer) => ({
  color: layer.color,
  description: layer.description,
  documentId: layer.document_id,
  id: layer.id,
  isBase: Boolean(layer.is_base),
  layerIndex: layer.layer_index,
  name: layer.name,
}));

const cards = query(
  "select id, document_id, parent_id, order_index, type from cards order by coalesce(parent_id, ''), order_index;",
).map((card) => ({
  documentId: card.document_id,
  id: card.id,
  orderIndex: card.order_index,
  parentId: card.parent_id,
  type: card.type,
}));

const contents = query(
  "select card_id, layer_id, content_json from card_content order by card_id, layer_id;",
).map((content) => ({
  cardId: content.card_id,
  contentJson: content.content_json,
  layerId: content.layer_id,
}));

const snapshot = {
  summary: {
    documentId: document.id,
    layerCount: layers.length,
    name: "tutorial",
    openedAtMs: document.updated_at_ms,
    path: "/demo/tutorial.fable",
  },
  layers,
  cards,
  contents,
  revisions: [],
};

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `import type { DocumentSnapshot } from "../domain/document/types";\n\n` +
    `// Generated from src/site/tutorial.fable by npm run tutorial:sync.\n` +
    `// Edit the .fable file, then rerun the sync command.\n` +
    `export const WEBSITE_TUTORIAL_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)} satisfies DocumentSnapshot;\n`,
);

console.log(`Synced ${path.relative(repoRoot, sourcePath)} -> ${path.relative(repoRoot, outputPath)}`);
