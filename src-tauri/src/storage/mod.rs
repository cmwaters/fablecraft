use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::{AppError, AppErrorPayload, AppResult};

mod migrations;

const DEFAULT_CARD_TYPE: &str = "card";
const EMPTY_EDITOR_DOCUMENT: &str = r#"{"type":"doc","content":[{"type":"paragraph"}]}"#;
const REVISION_PREVIEW_LIMIT: i64 = 20;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentSummary {
    pub document_id: String,
    pub file_modified_at_ms: u64,
    pub name: String,
    pub opened_at_ms: u64,
    pub path: String,
    pub updated_at_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentClock {
    pub document_id: String,
    pub file_modified_at_ms: u64,
    pub updated_at_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardRecord {
    pub document_id: String,
    pub id: String,
    pub order_index: usize,
    pub parent_id: Option<String>,
    #[serde(rename = "type")]
    pub card_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CardContentRecord {
    pub card_id: String,
    pub content_json: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RevisionRecord {
    pub created_at_ms: u64,
    pub id: String,
    pub snapshot: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentSnapshot {
    pub cards: Vec<CardRecord>,
    pub contents: Vec<CardContentRecord>,
    pub revisions: Vec<RevisionRecord>,
    pub summary: DocumentSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditableDocumentSnapshot {
    pub cards: Vec<CardRecord>,
    pub contents: Vec<CardContentRecord>,
    pub document_id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDocumentResult {
    pub revision_id: String,
    pub saved_at_ms: u64,
}

pub struct DocumentRepository;

impl DocumentRepository {
    pub fn create(path: PathBuf) -> Result<DocumentSummary, AppErrorPayload> {
        Self::create_inner(path).map_err(AppErrorPayload::from)
    }

    pub fn open(path: PathBuf) -> Result<DocumentSummary, AppErrorPayload> {
        Self::open_inner(path).map_err(AppErrorPayload::from)
    }

    pub fn load(path: PathBuf) -> Result<DocumentSnapshot, AppErrorPayload> {
        Self::load_inner(path).map_err(AppErrorPayload::from)
    }

    pub fn clock(path: PathBuf) -> Result<DocumentClock, AppErrorPayload> {
        Self::clock_inner(path).map_err(AppErrorPayload::from)
    }

    pub fn save(
        path: PathBuf,
        snapshot: EditableDocumentSnapshot,
    ) -> Result<SaveDocumentResult, AppErrorPayload> {
        Self::save_inner(path, snapshot).map_err(AppErrorPayload::from)
    }

    fn create_inner(path: PathBuf) -> AppResult<DocumentSummary> {
        validate_fable_path(&path)?;

        if path.exists() {
            return Err(AppError::conflict(
                "document_exists",
                format!(
                    "A Fablecraft document already exists at {}.",
                    path.display()
                ),
            ));
        }

        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let mut connection = open_connection(&path)?;
        run_migrations(&mut connection)?;
        seed_document(&mut connection)?;
        summarize_document(&connection, &path)
    }

    fn open_inner(path: PathBuf) -> AppResult<DocumentSummary> {
        validate_fable_path(&path)?;

        if !path.exists() {
            return Err(AppError::not_found(
                "document_missing",
                format!("No Fablecraft document exists at {}.", path.display()),
            ));
        }

        let mut connection = open_connection(&path)?;
        run_migrations(&mut connection)?;
        summarize_document(&connection, &path)
    }

    fn load_inner(path: PathBuf) -> AppResult<DocumentSnapshot> {
        validate_fable_path(&path)?;

        if !path.exists() {
            return Err(AppError::not_found(
                "document_missing",
                format!("No Fablecraft document exists at {}.", path.display()),
            ));
        }

        let mut connection = open_connection(&path)?;
        run_migrations(&mut connection)?;
        build_document_snapshot(&connection, &path)
    }

    fn clock_inner(path: PathBuf) -> AppResult<DocumentClock> {
        validate_fable_path(&path)?;

        if !path.exists() {
            return Err(AppError::not_found(
                "document_missing",
                format!("No Fablecraft document exists at {}.", path.display()),
            ));
        }

        let mut connection = open_connection(&path)?;
        run_migrations(&mut connection)?;
        build_document_clock(&connection, &path)
    }

    fn save_inner(
        path: PathBuf,
        snapshot: EditableDocumentSnapshot,
    ) -> AppResult<SaveDocumentResult> {
        validate_fable_path(&path)?;

        if !path.exists() {
            return Err(AppError::not_found(
                "document_missing",
                format!("No Fablecraft document exists at {}.", path.display()),
            ));
        }

        let mut connection = open_connection(&path)?;
        run_migrations(&mut connection)?;

        let existing_document_id = document_id(&connection)?;
        validate_snapshot(&snapshot, &existing_document_id)?;

        let saved_at_ms = now_ms()?;
        let revision_id = Uuid::new_v4().to_string();
        let revision_snapshot = serde_json::to_string(&snapshot).map_err(|error| {
            AppError::storage(
                "snapshot_serialization_failed",
                "Failed to serialize the document revision snapshot.",
                Some(error.to_string()),
            )
        })?;

        let transaction = connection.unchecked_transaction()?;

        transaction.execute("DELETE FROM card_content", [])?;
        transaction.execute("DELETE FROM cards", [])?;

        for card in sorted_cards(&snapshot.cards) {
            transaction.execute(
                "INSERT INTO cards (id, document_id, parent_id, order_index, type)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    card.id,
                    card.document_id,
                    card.parent_id,
                    card.order_index as i64,
                    card.card_type
                ],
            )?;
        }

        for content in sorted_contents(&snapshot.contents) {
            transaction.execute(
                "INSERT INTO card_content (card_id, content_json) VALUES (?1, ?2)",
                params![content.card_id, content.content_json],
            )?;
        }

        transaction.execute(
            "UPDATE documents SET updated_at_ms = ?1 WHERE id = ?2",
            params![saved_at_ms as i64, existing_document_id],
        )?;
        transaction.execute(
            "INSERT INTO revisions (id, snapshot, created_at_ms) VALUES (?1, ?2, ?3)",
            params![revision_id.clone(), revision_snapshot, saved_at_ms as i64],
        )?;

        transaction.commit()?;

        Ok(SaveDocumentResult {
            revision_id,
            saved_at_ms,
        })
    }
}

fn open_connection(path: &Path) -> AppResult<Connection> {
    let connection = Connection::open(path)?;

    connection.pragma_update(None, "foreign_keys", "ON")?;
    // Keep the database truly single-file. WAL would introduce -wal and -shm sidecars.
    connection.pragma_update(None, "journal_mode", "DELETE")?;
    connection.pragma_update(None, "busy_timeout", 5_000)?;

    Ok(connection)
}

fn run_migrations(connection: &mut Connection) -> AppResult<()> {
    let current_version: i64 =
        connection.pragma_query_value(None, "user_version", |row| row.get(0))?;

    for (index, migration) in migrations::MIGRATIONS.iter().enumerate() {
        let target_version = (index + 1) as i64;

        if target_version <= current_version {
            continue;
        }

        let transaction = connection.unchecked_transaction()?;
        transaction.execute_batch(migration)?;
        transaction.execute_batch(&format!("PRAGMA user_version = {target_version};"))?;
        transaction.commit()?;
    }

    Ok(())
}

fn seed_document(connection: &mut Connection) -> AppResult<()> {
    let existing_document_id: Option<String> = connection
        .query_row("SELECT id FROM documents LIMIT 1", [], |row| row.get(0))
        .optional()?;

    if existing_document_id.is_some() {
        return Ok(());
    }

    let timestamp = now_ms()?;
    let document_id = Uuid::new_v4().to_string();
    let root_card_id = Uuid::new_v4().to_string();

    let transaction = connection.unchecked_transaction()?;

    transaction.execute(
        "INSERT INTO documents (id, created_at_ms, updated_at_ms) VALUES (?1, ?2, ?3)",
        params![document_id, timestamp as i64, timestamp as i64],
    )?;

    transaction.execute(
        "INSERT INTO cards (id, document_id, parent_id, order_index, type)
         VALUES (?1, ?2, NULL, ?3, ?4)",
        params![root_card_id, document_id, 0_i64, DEFAULT_CARD_TYPE],
    )?;

    transaction.execute(
        "INSERT INTO card_content (card_id, content_json) VALUES (?1, ?2)",
        params![root_card_id, EMPTY_EDITOR_DOCUMENT],
    )?;

    transaction.commit()?;

    Ok(())
}

fn build_document_snapshot(connection: &Connection, path: &Path) -> AppResult<DocumentSnapshot> {
    let summary = summarize_document(connection, path)?;
    let cards = load_cards(connection, &summary.document_id)?;
    let contents = load_contents(connection)?;
    let revisions = load_revisions(connection)?;

    Ok(DocumentSnapshot {
        cards,
        contents,
        revisions,
        summary,
    })
}

fn build_document_clock(connection: &Connection, path: &Path) -> AppResult<DocumentClock> {
    let existing_document_id = document_id(connection)?;
    let updated_at_ms: i64 = connection.query_row(
        "SELECT updated_at_ms
         FROM documents
         WHERE id = ?1",
        [existing_document_id.clone()],
        |row| row.get(0),
    )?;

    Ok(DocumentClock {
        document_id: existing_document_id,
        file_modified_at_ms: file_modified_at_ms(path)?,
        updated_at_ms: updated_at_ms as u64,
    })
}

fn file_modified_at_ms(path: &Path) -> AppResult<u64> {
    Ok(fs::metadata(path)?
        .modified()?
        .duration_since(UNIX_EPOCH)
        .map_err(|error| {
            AppError::storage(
                "document_clock_failed",
                "Fablecraft could not read the document modification time.",
                Some(error.to_string()),
            )
        })?
        .as_millis() as u64)
}

fn summarize_document(connection: &Connection, path: &Path) -> AppResult<DocumentSummary> {
    let existing_document_id = document_id(connection)?;
    let updated_at_ms: i64 = connection.query_row(
        "SELECT updated_at_ms
         FROM documents
         WHERE id = ?1",
        [existing_document_id.clone()],
        |row| row.get(0),
    )?;

    Ok(DocumentSummary {
        document_id: existing_document_id,
        file_modified_at_ms: file_modified_at_ms(path)?,
        name: path
            .file_stem()
            .and_then(|value| value.to_str())
            .filter(|value| !value.is_empty())
            .unwrap_or("Untitled")
            .to_string(),
        opened_at_ms: now_ms()?,
        path: path.to_string_lossy().to_string(),
        updated_at_ms: updated_at_ms as u64,
    })
}

fn document_id(connection: &Connection) -> AppResult<String> {
    connection
        .query_row("SELECT id FROM documents LIMIT 1", [], |row| row.get(0))
        .optional()?
        .ok_or_else(|| {
            AppError::storage(
                "document_uninitialized",
                "The .fable file is missing its document record.",
                None,
            )
        })
}

fn load_cards(connection: &Connection, document_id: &str) -> AppResult<Vec<CardRecord>> {
    let mut statement = connection.prepare(
        "SELECT id, document_id, parent_id, order_index, type
         FROM cards
         WHERE document_id = ?1
         ORDER BY COALESCE(parent_id, ''), order_index ASC, id ASC",
    )?;
    let rows = statement.query_map([document_id], |row| {
        Ok(CardRecord {
            document_id: row.get(1)?,
            id: row.get(0)?,
            order_index: row.get::<_, i64>(3)? as usize,
            parent_id: row.get(2)?,
            card_type: row.get(4)?,
        })
    })?;

    rows.collect::<Result<Vec<_>, _>>().map_err(AppError::from)
}

fn load_contents(connection: &Connection) -> AppResult<Vec<CardContentRecord>> {
    let mut statement = connection.prepare(
        "SELECT card_id, content_json
         FROM card_content
         ORDER BY card_id ASC",
    )?;
    let rows = statement.query_map([], |row| {
        Ok(CardContentRecord {
            card_id: row.get(0)?,
            content_json: row.get(1)?,
        })
    })?;

    rows.collect::<Result<Vec<_>, _>>().map_err(AppError::from)
}

fn load_revisions(connection: &Connection) -> AppResult<Vec<RevisionRecord>> {
    let mut statement = connection.prepare(
        "SELECT id, snapshot, created_at_ms
         FROM revisions
         ORDER BY created_at_ms DESC, id DESC
         LIMIT ?1",
    )?;
    let rows = statement.query_map([REVISION_PREVIEW_LIMIT], |row| {
        Ok(RevisionRecord {
            created_at_ms: row.get::<_, i64>(2)? as u64,
            id: row.get(0)?,
            snapshot: row.get(1)?,
        })
    })?;

    rows.collect::<Result<Vec<_>, _>>().map_err(AppError::from)
}

fn validate_snapshot(snapshot: &EditableDocumentSnapshot, document_id: &str) -> AppResult<()> {
    if snapshot.document_id != document_id {
        return Err(AppError::invalid_input(
            "document_mismatch",
            "The snapshot does not match the currently opened document.",
        ));
    }

    validate_cards(&snapshot.cards, document_id)?;
    validate_contents(&snapshot.cards, &snapshot.contents)?;

    Ok(())
}

fn validate_cards(cards: &[CardRecord], document_id: &str) -> AppResult<()> {
    if cards.is_empty() {
        return Err(AppError::invalid_input(
            "cards_missing",
            "A Fablecraft document must contain at least one card.",
        ));
    }

    let mut seen_ids = HashSet::new();
    let mut root_ids = Vec::new();

    for card in cards {
        if card.document_id != document_id {
            return Err(AppError::invalid_input(
                "card_document_mismatch",
                "Every card must belong to the active document.",
            ));
        }

        if card.card_type != DEFAULT_CARD_TYPE {
            return Err(AppError::invalid_input(
                "invalid_card_type",
                "The MVP only supports the default card type.",
            ));
        }

        if !seen_ids.insert(card.id.clone()) {
            return Err(AppError::invalid_input(
                "duplicate_card_id",
                "Card identifiers must be unique within a document.",
            ));
        }

        if card.parent_id.as_deref() == Some(card.id.as_str()) {
            return Err(AppError::invalid_input(
                "self_referential_card",
                "A card cannot be its own parent.",
            ));
        }

        if card.parent_id.is_none() {
            root_ids.push(card.id.clone());
        }
    }

    if root_ids.is_empty() {
        return Err(AppError::invalid_input(
            "root_card_missing",
            "A Fablecraft document must contain at least one root-depth card.",
        ));
    }

    let card_ids: HashSet<&String> = cards.iter().map(|card| &card.id).collect();
    let mut sibling_groups: HashMap<Option<String>, Vec<&CardRecord>> = HashMap::new();
    let mut child_map: HashMap<String, Vec<String>> = HashMap::new();

    for card in cards {
        if let Some(parent_id) = &card.parent_id {
            if !card_ids.contains(parent_id) {
                return Err(AppError::invalid_input(
                    "missing_parent_card",
                    "Every parent reference must resolve to an existing card.",
                ));
            }

            child_map
                .entry(parent_id.clone())
                .or_default()
                .push(card.id.clone());
        }

        sibling_groups
            .entry(card.parent_id.clone())
            .or_default()
            .push(card);
    }

    for group in sibling_groups.values_mut() {
        group.sort_by(|left, right| {
            left.order_index
                .cmp(&right.order_index)
                .then(left.id.cmp(&right.id))
        });

        for (expected_index, card) in group.iter().enumerate() {
            if card.order_index != expected_index {
                return Err(AppError::invalid_input(
                    "invalid_sibling_order",
                    "Sibling order indexes must be contiguous.",
                ));
            }
        }
    }

    let mut visited = HashSet::new();
    let mut stack = root_ids;

    while let Some(card_id) = stack.pop() {
        if !visited.insert(card_id.clone()) {
            continue;
        }

        if let Some(children) = child_map.get(&card_id) {
            for child_id in children {
                stack.push(child_id.clone());
            }
        }
    }

    if visited.len() != cards.len() {
        return Err(AppError::invalid_input(
            "disconnected_tree",
            "All cards must belong to the root-depth forest.",
        ));
    }

    Ok(())
}

fn validate_contents(cards: &[CardRecord], contents: &[CardContentRecord]) -> AppResult<()> {
    let card_ids: HashSet<&String> = cards.iter().map(|card| &card.id).collect();
    let mut seen_cards = HashSet::new();

    for content in contents {
        if !card_ids.contains(&content.card_id) {
            return Err(AppError::invalid_input(
                "missing_content_card",
                "Every content record must reference an existing card.",
            ));
        }

        if !seen_cards.insert(content.card_id.clone()) {
            return Err(AppError::invalid_input(
                "duplicate_content_record",
                "Each card can only have one content record.",
            ));
        }
    }

    for card in cards {
        if !seen_cards.contains(&card.id) {
            return Err(AppError::invalid_input(
                "missing_card_content",
                "Every card must retain a content record.",
            ));
        }
    }

    Ok(())
}

fn sorted_cards(cards: &[CardRecord]) -> Vec<CardRecord> {
    let mut grouped_cards: HashMap<Option<String>, Vec<CardRecord>> = HashMap::new();

    for card in cards {
        grouped_cards
            .entry(card.parent_id.clone())
            .or_default()
            .push(card.clone());
    }

    for siblings in grouped_cards.values_mut() {
        siblings.sort_by(|left, right| {
            left.order_index
                .cmp(&right.order_index)
                .then(left.id.cmp(&right.id))
        });
    }

    let mut sorted = Vec::with_capacity(cards.len());
    let mut stack = grouped_cards.remove(&None).unwrap_or_default();
    stack.reverse();

    while let Some(card) = stack.pop() {
        if let Some(mut children) = grouped_cards.remove(&Some(card.id.clone())) {
            children.reverse();
            stack.extend(children);
        }

        sorted.push(card);
    }

    sorted
}

fn sorted_contents(contents: &[CardContentRecord]) -> Vec<CardContentRecord> {
    let mut sorted = contents.to_vec();
    sorted.sort_by(|left, right| left.card_id.cmp(&right.card_id));
    sorted
}

fn validate_fable_path(path: &Path) -> AppResult<()> {
    let extension = path.extension().and_then(|value| value.to_str());

    if extension != Some("fable") {
        return Err(AppError::invalid_input(
            "invalid_document_extension",
            "Fablecraft documents must use the .fable extension.",
        ));
    }

    Ok(())
}

fn now_ms() -> AppResult<u64> {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| {
            AppError::storage(
                "clock_error",
                "The system clock moved backwards.",
                Some(error.to_string()),
            )
        })?;

    Ok(duration.as_millis() as u64)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_document_path(label: &str) -> PathBuf {
        std::env::temp_dir().join(format!("fablecraft-{label}-{}.fable", Uuid::new_v4()))
    }

    #[test]
    fn create_initializes_schema_and_root_card() {
        let path = temp_document_path("create");

        let summary = DocumentRepository::create(path.clone()).expect("document should create");

        assert_eq!(summary.name, path.file_stem().unwrap().to_string_lossy());

        let connection = Connection::open(&path).expect("sqlite file should exist");
        let card_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM cards", [], |row| row.get(0))
            .expect("card query should succeed");
        let content_count: i64 = connection
            .query_row("SELECT COUNT(*) FROM card_content", [], |row| row.get(0))
            .expect("content query should succeed");
        let layer_table_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'layers'",
                [],
                |row| row.get(0),
            )
            .expect("schema query should succeed");

        assert_eq!(card_count, 1);
        assert_eq!(content_count, 1);
        assert_eq!(layer_table_count, 0);

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn open_returns_existing_document_summary() {
        let path = temp_document_path("open");
        let created = DocumentRepository::create(path.clone()).expect("document should create");

        let opened = DocumentRepository::open(path.clone()).expect("document should open");

        assert_eq!(opened.document_id, created.document_id);

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn save_round_trips_snapshot_and_creates_revision() {
        let path = temp_document_path("save");
        DocumentRepository::create(path.clone()).expect("document should create");

        let snapshot = DocumentRepository::load(path.clone()).expect("snapshot should load");
        let root_card = snapshot
            .cards
            .iter()
            .find(|card| card.parent_id.is_none())
            .expect("root card should exist")
            .clone();
        let child_card_id = Uuid::new_v4().to_string();

        let result = DocumentRepository::save(
            path.clone(),
            EditableDocumentSnapshot {
                cards: vec![
                    root_card.clone(),
                    CardRecord {
                        document_id: snapshot.summary.document_id.clone(),
                        id: child_card_id.clone(),
                        order_index: 0,
                        parent_id: Some(root_card.id.clone()),
                        card_type: DEFAULT_CARD_TYPE.to_string(),
                    },
                ],
                contents: vec![
                    snapshot.contents.first().expect("base content should exist").clone(),
                    CardContentRecord {
                        card_id: child_card_id,
                        content_json: EMPTY_EDITOR_DOCUMENT.to_string(),
                    },
                ],
                document_id: snapshot.summary.document_id.clone(),
            },
        )
        .expect("snapshot should save");

        let reopened = DocumentRepository::load(path.clone()).expect("snapshot should reload");

        assert_eq!(reopened.cards.len(), 2);
        assert_eq!(reopened.contents.len(), 2);
        assert_eq!(reopened.revisions.len(), 1);
        assert_eq!(reopened.revisions[0].id, result.revision_id);

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn save_allows_multiple_root_depth_cards() {
        let path = temp_document_path("multiple-roots");
        DocumentRepository::create(path.clone()).expect("document should create");

        let snapshot = DocumentRepository::load(path.clone()).expect("snapshot should load");
        let root_card = snapshot
            .cards
            .iter()
            .find(|card| card.parent_id.is_none())
            .expect("root card should exist")
            .clone();
        let second_root_id = Uuid::new_v4().to_string();

        DocumentRepository::save(
            path.clone(),
            EditableDocumentSnapshot {
                cards: vec![
                    root_card.clone(),
                    CardRecord {
                        document_id: snapshot.summary.document_id.clone(),
                        id: second_root_id.clone(),
                        order_index: 1,
                        parent_id: None,
                        card_type: DEFAULT_CARD_TYPE.to_string(),
                    },
                ],
                contents: vec![
                    snapshot.contents.first().expect("base content should exist").clone(),
                    CardContentRecord {
                        card_id: second_root_id,
                        content_json: EMPTY_EDITOR_DOCUMENT.to_string(),
                    },
                ],
                document_id: snapshot.summary.document_id.clone(),
            },
        )
        .expect("snapshot with multiple root-depth cards should save");

        let reopened = DocumentRepository::load(path.clone()).expect("snapshot should reload");
        let roots = reopened
            .cards
            .iter()
            .filter(|card| card.parent_id.is_none())
            .collect::<Vec<_>>();

        assert_eq!(roots.len(), 2);
        assert_eq!(roots[0].order_index, 0);
        assert_eq!(roots[1].order_index, 1);

        fs::remove_file(path).expect("temp file should be removable");
    }
}
