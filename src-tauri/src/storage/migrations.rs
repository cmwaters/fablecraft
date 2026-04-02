pub const MIGRATIONS: &[&str] = &[r#"
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    created_at_ms INTEGER NOT NULL,
    updated_at_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS layers (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    layer_index INTEGER NOT NULL,
    color TEXT NOT NULL,
    is_base INTEGER NOT NULL CHECK (is_base IN (0, 1)),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    UNIQUE(document_id, layer_index)
);

CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    parent_id TEXT,
    order_index INTEGER NOT NULL,
    type TEXT NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES cards(id) ON DELETE CASCADE,
    UNIQUE(document_id, parent_id, order_index)
);

CREATE TABLE IF NOT EXISTS card_content (
    card_id TEXT NOT NULL,
    layer_id TEXT NOT NULL,
    content_json TEXT NOT NULL,
    PRIMARY KEY (card_id, layer_id),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (layer_id) REFERENCES layers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS revisions (
    id TEXT PRIMARY KEY,
    snapshot TEXT NOT NULL,
    created_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cards_document_parent_order
    ON cards (document_id, parent_id, order_index);

CREATE INDEX IF NOT EXISTS idx_layers_document_index
    ON layers (document_id, layer_index);
"#];

