use std::collections::HashMap;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::State;
use uuid::Uuid;

use crate::app_state::AppState;
use crate::error::{AppError, AppErrorPayload, AppResult};
use crate::storage::{
    CardContentRecord, DocumentRepository, DocumentSnapshot, EditableDocumentSnapshot, LayerRecord,
};

const EMPTY_EDITOR_DOCUMENT: &str = r#"{"type":"doc","content":[{"type":"paragraph"}]}"#;
const MAX_MCP_ARGUMENT_BYTES: usize = 16 * 1024;
const MAX_MCP_PAYLOAD_BYTES: usize = 128 * 1024;
const TOOL_GET_DOCUMENT: &str = "fablecraft_get_document";
const TOOL_LIST_LAYERS: &str = "fablecraft_list_layers";
const TOOL_GET_CARD: &str = "fablecraft_get_card";
const TOOL_GET_SUBTREE: &str = "fablecraft_get_subtree";
const TOOL_SET_CARD_TEXT: &str = "fablecraft_set_card_text";
const TOOL_RENAME_LAYER: &str = "fablecraft_rename_layer";
const TOOL_CREATE_CHILD: &str = "fablecraft_create_child";
const TOOL_CREATE_SIBLING_AFTER: &str = "fablecraft_create_sibling_after";
const TOOL_WRAP_LEVEL_IN_PARENT: &str = "fablecraft_wrap_level_in_parent";
const TOOL_DELETE_CARD: &str = "fablecraft_delete_card";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct McpToolDefinition {
    pub description: String,
    pub input_example: String,
    pub is_mutation: bool,
    pub name: String,
    pub scope: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpToolRequest {
    pub arguments_json: Option<String>,
    pub card_id: Option<String>,
    pub layer_id: Option<String>,
    pub scope: String,
    pub tool_name: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct McpToolResponse {
    pub result_json: String,
    pub scope: String,
    pub snapshot: Option<DocumentSnapshot>,
    pub summary: String,
    pub tool_name: String,
}

#[derive(Debug, Deserialize)]
struct RenameLayerArgs {
    description: Option<String>,
    name: String,
}

#[derive(Debug, Deserialize)]
struct SetCardTextArgs {
    text: String,
}

#[tauri::command]
pub fn list_mcp_tools() -> Vec<McpToolDefinition> {
    vec![
        McpToolDefinition {
            description: "Read summary metadata for the open document.".to_string(),
            input_example: "{}".to_string(),
            is_mutation: false,
            name: TOOL_GET_DOCUMENT.to_string(),
            scope: "document".to_string(),
        },
        McpToolDefinition {
            description: "List the layers in the open document.".to_string(),
            input_example: "{}".to_string(),
            is_mutation: false,
            name: TOOL_LIST_LAYERS.to_string(),
            scope: "document".to_string(),
        },
        McpToolDefinition {
            description: "Read the selected card in the active layer.".to_string(),
            input_example: "{}".to_string(),
            is_mutation: false,
            name: TOOL_GET_CARD.to_string(),
            scope: "card".to_string(),
        },
        McpToolDefinition {
            description: "Read the selected card and its descendants in tree order.".to_string(),
            input_example: "{}".to_string(),
            is_mutation: false,
            name: TOOL_GET_SUBTREE.to_string(),
            scope: "subtree".to_string(),
        },
        McpToolDefinition {
            description: "Replace the selected card's content with plain text in the active layer."
                .to_string(),
            input_example: "{\n  \"text\": \"Rewrite this beat in plain text.\"\n}".to_string(),
            is_mutation: true,
            name: TOOL_SET_CARD_TEXT.to_string(),
            scope: "card".to_string(),
        },
        McpToolDefinition {
            description: "Rename the active layer and optionally update its description."
                .to_string(),
            input_example:
                "{\n  \"name\": \"Character\",\n  \"description\": \"Motivations and arcs\"\n}"
                    .to_string(),
            is_mutation: true,
            name: TOOL_RENAME_LAYER.to_string(),
            scope: "document".to_string(),
        },
        McpToolDefinition {
            description: "Create an empty child card beneath the selected card.".to_string(),
            input_example: "{}".to_string(),
            is_mutation: true,
            name: TOOL_CREATE_CHILD.to_string(),
            scope: "card".to_string(),
        },
        McpToolDefinition {
            description: "Create an empty sibling card immediately after the selected card."
                .to_string(),
            input_example: "{}".to_string(),
            is_mutation: true,
            name: TOOL_CREATE_SIBLING_AFTER.to_string(),
            scope: "card".to_string(),
        },
        McpToolDefinition {
            description:
                "Wrap the selected level in a new empty parent card, like Tab+Left in the app."
                    .to_string(),
            input_example: "{}".to_string(),
            is_mutation: true,
            name: TOOL_WRAP_LEVEL_IN_PARENT.to_string(),
            scope: "card".to_string(),
        },
        McpToolDefinition {
            description: "Delete the selected card and its subtree.".to_string(),
            input_example: "{}".to_string(),
            is_mutation: true,
            name: TOOL_DELETE_CARD.to_string(),
            scope: "card".to_string(),
        },
    ]
}

#[tauri::command]
pub fn invoke_mcp_tool(
    request: McpToolRequest,
    state: State<'_, AppState>,
) -> Result<McpToolResponse, AppErrorPayload> {
    let path = current_document_path(&state)?;
    invoke_mcp_tool_for_path(path, request)
}

pub fn invoke_mcp_tool_for_path(
    path: PathBuf,
    request: McpToolRequest,
) -> Result<McpToolResponse, AppErrorPayload> {
    invoke_mcp_tool_inner(path, request).map_err(AppErrorPayload::from)
}

fn invoke_mcp_tool_inner(path: PathBuf, request: McpToolRequest) -> AppResult<McpToolResponse> {
    if let Some(arguments_json) = &request.arguments_json {
        if arguments_json.len() > MAX_MCP_ARGUMENT_BYTES {
            return Err(AppError::invalid_input(
                "mcp_arguments_too_large",
                format!(
                    "MCP tool arguments must stay under {MAX_MCP_ARGUMENT_BYTES} bytes.",
                ),
            ));
        }
    }

    let snapshot = repository_result(DocumentRepository::load(path.clone()))?;

    let response = match normalize_tool_name(request.tool_name.as_str()) {
        TOOL_GET_DOCUMENT => read_document(snapshot, request),
        TOOL_LIST_LAYERS => list_layers(snapshot, request),
        TOOL_GET_CARD => read_card(snapshot, request),
        TOOL_GET_SUBTREE => read_subtree(snapshot, request),
        TOOL_SET_CARD_TEXT => mutate_card_text(path, snapshot, request),
        TOOL_RENAME_LAYER => mutate_layer(path, snapshot, request),
        TOOL_CREATE_CHILD => create_child(path, snapshot, request),
        TOOL_CREATE_SIBLING_AFTER => create_sibling_after(path, snapshot, request),
        TOOL_WRAP_LEVEL_IN_PARENT => wrap_level(path, snapshot, request),
        TOOL_DELETE_CARD => delete_card(path, snapshot, request),
        _ => Err(AppError::invalid_input(
            "mcp_tool_missing",
            format!("Unknown MCP tool \"{}\".", request.tool_name),
        )),
    }?;

    enforce_payload_limit(&response)?;

    Ok(response)
}

fn normalize_tool_name(tool_name: &str) -> &str {
    match tool_name {
        "fablecraft.get_document" => TOOL_GET_DOCUMENT,
        "fablecraft.list_layers" => TOOL_LIST_LAYERS,
        "fablecraft.get_card" => TOOL_GET_CARD,
        "fablecraft.get_subtree" => TOOL_GET_SUBTREE,
        "fablecraft.set_card_text" => TOOL_SET_CARD_TEXT,
        "fablecraft.rename_layer" => TOOL_RENAME_LAYER,
        "fablecraft.create_child" => TOOL_CREATE_CHILD,
        "fablecraft.create_sibling_after" => TOOL_CREATE_SIBLING_AFTER,
        "fablecraft.wrap_level_in_parent" => TOOL_WRAP_LEVEL_IN_PARENT,
        "fablecraft.delete_card" => TOOL_DELETE_CARD,
        _ => tool_name,
    }
}

fn read_document(snapshot: DocumentSnapshot, request: McpToolRequest) -> AppResult<McpToolResponse> {
    let root_card_id = snapshot
        .cards
        .iter()
        .find(|card| card.parent_id.is_none())
        .map(|card| card.id.clone())
        .ok_or_else(|| {
            AppError::storage(
                "missing_root_card",
                "The open document is missing its root card.",
                None,
            )
        })?;
    let payload = json!({
        "summary": snapshot.summary,
        "rootCardId": root_card_id,
        "cardCount": snapshot.cards.len(),
        "layerCount": snapshot.layers.len(),
    });

    Ok(McpToolResponse {
        result_json: serialize_result(&payload)?,
        scope: request.scope,
        snapshot: None,
        summary: "Loaded document metadata.".to_string(),
        tool_name: request.tool_name,
    })
}

fn list_layers(snapshot: DocumentSnapshot, request: McpToolRequest) -> AppResult<McpToolResponse> {
    let payload = json!({
        "layers": snapshot.layers,
    });

    Ok(McpToolResponse {
        result_json: serialize_result(&payload)?,
        scope: request.scope,
        snapshot: None,
        summary: format!("Loaded {} layer(s).", snapshot.layers.len()),
        tool_name: request.tool_name,
    })
}

fn read_card(snapshot: DocumentSnapshot, request: McpToolRequest) -> AppResult<McpToolResponse> {
    let card = card_for_request(&snapshot, request.card_id.as_deref())?;
    let layer = layer_for_request(&snapshot, request.layer_id.as_deref())?;
    let payload = card_payload(&snapshot, &card.id, &layer.id)?;

    Ok(McpToolResponse {
        result_json: serialize_result(&payload)?,
        scope: request.scope,
        snapshot: None,
        summary: format!("Loaded card {} in layer \"{}\".", card.id, layer.name),
        tool_name: request.tool_name,
    })
}

fn read_subtree(snapshot: DocumentSnapshot, request: McpToolRequest) -> AppResult<McpToolResponse> {
    let card = card_for_request(&snapshot, request.card_id.as_deref())?;
    let layer = layer_for_request(&snapshot, request.layer_id.as_deref())?;
    let ordered_cards = subtree_cards(&snapshot, &card.id);
    let entries = ordered_cards
        .iter()
        .map(|(card_id, depth)| {
            let payload = card_payload(&snapshot, card_id, &layer.id)?;

            Ok(json!({
                "card": payload["card"].clone(),
                "content": payload["content"].clone(),
                "depth": depth,
                "hasExplicitLayerContent": payload["hasExplicitLayerContent"].clone(),
                "plainText": payload["plainText"].clone(),
            }))
        })
        .collect::<AppResult<Vec<_>>>()?;
    let payload = json!({
        "cardCount": entries.len(),
        "entries": entries,
        "layer": layer,
        "rootCardId": card.id,
    });

    Ok(McpToolResponse {
        result_json: serialize_result(&payload)?,
        scope: request.scope,
        snapshot: None,
        summary: format!(
            "Loaded subtree rooted at {} with {} card(s).",
            card.id,
            ordered_cards.len()
        ),
        tool_name: request.tool_name,
    })
}

fn mutate_card_text(
    path: PathBuf,
    snapshot: DocumentSnapshot,
    request: McpToolRequest,
) -> AppResult<McpToolResponse> {
    let card = card_for_request(&snapshot, request.card_id.as_deref())?;
    let layer = layer_for_request(&snapshot, request.layer_id.as_deref())?;
    let card_id = card.id.clone();
    let layer_id = layer.id.clone();
    let layer_name = layer.name.clone();
    let args: SetCardTextArgs = parse_arguments(request.arguments_json.clone())?;
    let next_content_json = content_json_for_plain_text(&args.text)?;
    let existing_index = snapshot.contents.iter().position(|content| {
        content.card_id == card_id && content.layer_id == layer_id
    });
    let mut next_contents = snapshot.contents.clone();

    match existing_index {
        Some(index) => {
            next_contents[index] = CardContentRecord {
                card_id: card_id.clone(),
                content_json: next_content_json,
                layer_id: layer_id.clone(),
            };
        }
        None => next_contents.push(CardContentRecord {
            card_id: card_id.clone(),
            content_json: next_content_json,
            layer_id: layer_id.clone(),
        }),
    }

    let next_snapshot = DocumentSnapshot {
        cards: snapshot.cards.clone(),
        contents: next_contents,
        layers: snapshot.layers.clone(),
        revisions: snapshot.revisions.clone(),
        summary: snapshot.summary.clone(),
    };
    let persisted_snapshot = save_and_reload(path, next_snapshot)?;
    let result_json = serialize_result(&json!({
        "cardId": card_id,
        "layerId": layer_id,
        "status": "updated",
    }))?;

    Ok(McpToolResponse {
        result_json,
        scope: request.scope,
        snapshot: Some(persisted_snapshot),
        summary: format!("Updated card {} in layer \"{}\".", card_id, layer_name),
        tool_name: request.tool_name,
    })
}

fn mutate_layer(
    path: PathBuf,
    snapshot: DocumentSnapshot,
    request: McpToolRequest,
) -> AppResult<McpToolResponse> {
    let layer = layer_for_request(&snapshot, request.layer_id.as_deref())?;
    let layer_id = layer.id.clone();
    let args: RenameLayerArgs = parse_arguments(request.arguments_json.clone())?;
    let next_name = args.name.trim();

    if next_name.is_empty() {
        return Err(AppError::invalid_input(
            "layer_name_required",
            "Layer names cannot be empty.",
        ));
    }

    let next_description = args
        .description
        .map(|description| description.trim().to_string())
        .filter(|description| !description.is_empty());
    let next_layers = snapshot
        .layers
        .iter()
        .map(|current_layer| {
            if current_layer.id == layer_id {
                LayerRecord {
                    description: next_description.clone(),
                    name: next_name.to_string(),
                    ..current_layer.clone()
                }
            } else {
                current_layer.clone()
            }
        })
        .collect::<Vec<_>>();
    let next_snapshot = DocumentSnapshot {
        cards: snapshot.cards.clone(),
        contents: snapshot.contents.clone(),
        layers: next_layers,
        revisions: snapshot.revisions.clone(),
        summary: snapshot.summary.clone(),
    };
    let persisted_snapshot = save_and_reload(path, next_snapshot)?;
    let result_json = serialize_result(&json!({
        "description": next_description,
        "layerId": layer_id,
        "name": next_name,
        "status": "updated",
    }))?;

    Ok(McpToolResponse {
        result_json,
        scope: request.scope,
        snapshot: Some(persisted_snapshot),
        summary: format!("Updated layer \"{}\".", next_name),
        tool_name: request.tool_name,
    })
}

fn create_child(
    path: PathBuf,
    snapshot: DocumentSnapshot,
    request: McpToolRequest,
) -> AppResult<McpToolResponse> {
    let parent = card_for_request(&snapshot, request.card_id.as_deref())?;
    let parent_id = parent.id.clone();
    let next_card_id = Uuid::new_v4().to_string();
    let next_snapshot = create_child_snapshot(&snapshot, &parent_id, &next_card_id)?;
    let persisted_snapshot = save_and_reload(path, next_snapshot)?;
    let result_json = serialize_result(&json!({
        "cardId": next_card_id,
        "parentCardId": parent_id,
        "status": "created",
    }))?;

    Ok(McpToolResponse {
        result_json,
        scope: request.scope,
        snapshot: Some(persisted_snapshot),
        summary: format!("Created child card {}.", next_card_id),
        tool_name: request.tool_name,
    })
}

fn create_sibling_after(
    path: PathBuf,
    snapshot: DocumentSnapshot,
    request: McpToolRequest,
) -> AppResult<McpToolResponse> {
    let sibling = card_for_request(&snapshot, request.card_id.as_deref())?;
    let sibling_id = sibling.id.clone();
    let next_card_id = Uuid::new_v4().to_string();
    let next_snapshot = create_sibling_after_snapshot(&snapshot, &sibling_id, &next_card_id)?;
    let persisted_snapshot = save_and_reload(path, next_snapshot)?;
    let result_json = serialize_result(&json!({
        "cardId": next_card_id,
        "siblingCardId": sibling_id,
        "status": "created",
    }))?;

    Ok(McpToolResponse {
        result_json,
        scope: request.scope,
        snapshot: Some(persisted_snapshot),
        summary: format!("Created sibling card {}.", next_card_id),
        tool_name: request.tool_name,
    })
}

fn wrap_level(
    path: PathBuf,
    snapshot: DocumentSnapshot,
    request: McpToolRequest,
) -> AppResult<McpToolResponse> {
    let card = card_for_request(&snapshot, request.card_id.as_deref())?;
    let card_id = card.id.clone();
    let next_card_id = Uuid::new_v4().to_string();
    let next_snapshot = wrap_level_in_parent_snapshot(&snapshot, &card_id, &next_card_id)?;
    let persisted_snapshot = save_and_reload(path, next_snapshot)?;
    let result_json = serialize_result(&json!({
        "cardId": next_card_id,
        "wrappedCardId": card_id,
        "status": "created",
    }))?;

    Ok(McpToolResponse {
        result_json,
        scope: request.scope,
        snapshot: Some(persisted_snapshot),
        summary: format!("Wrapped the current level in parent card {}.", next_card_id),
        tool_name: request.tool_name,
    })
}

fn delete_card(
    path: PathBuf,
    snapshot: DocumentSnapshot,
    request: McpToolRequest,
) -> AppResult<McpToolResponse> {
    let card = card_for_request(&snapshot, request.card_id.as_deref())?;
    let card_id = card.id.clone();
    let next_snapshot = delete_card_subtree_snapshot(&snapshot, &card_id)?;
    let persisted_snapshot = save_and_reload(path, next_snapshot)?;
    let result_json = serialize_result(&json!({
        "cardId": card_id,
        "status": "deleted",
    }))?;

    Ok(McpToolResponse {
        result_json,
        scope: request.scope,
        snapshot: Some(persisted_snapshot),
        summary: format!("Deleted card {} and its subtree.", card_id),
        tool_name: request.tool_name,
    })
}

fn parse_arguments<T: for<'de> Deserialize<'de>>(arguments_json: Option<String>) -> AppResult<T> {
    let raw_arguments = arguments_json.unwrap_or_else(|| "{}".to_string());

    serde_json::from_str(&raw_arguments).map_err(|error| {
        AppError::invalid_input(
            "mcp_invalid_arguments",
            format!("The MCP arguments could not be parsed: {error}."),
        )
    })
}

fn save_and_reload(path: PathBuf, snapshot: DocumentSnapshot) -> AppResult<DocumentSnapshot> {
    repository_result(DocumentRepository::save(
        path.clone(),
        editable_snapshot(&snapshot),
    ))?;
    repository_result(DocumentRepository::load(path))
}

fn editable_snapshot(snapshot: &DocumentSnapshot) -> EditableDocumentSnapshot {
    EditableDocumentSnapshot {
        cards: snapshot.cards.clone(),
        contents: snapshot.contents.clone(),
        document_id: snapshot.summary.document_id.clone(),
        layers: snapshot.layers.clone(),
    }
}

fn base_layer_id(snapshot: &DocumentSnapshot) -> AppResult<String> {
    snapshot
        .layers
        .iter()
        .find(|layer| layer.is_base)
        .map(|layer| layer.id.clone())
        .ok_or_else(|| {
            AppError::storage(
                "missing_base_layer",
                "The document is missing its base layer.",
                None,
            )
        })
}

fn create_card_record(
    snapshot: &DocumentSnapshot,
    id: &str,
    parent_id: Option<String>,
    order_index: usize,
) -> crate::storage::CardRecord {
    crate::storage::CardRecord {
        document_id: snapshot.summary.document_id.clone(),
        id: id.to_string(),
        order_index,
        parent_id,
        card_type: "card".to_string(),
    }
}

fn create_child_snapshot(
    snapshot: &DocumentSnapshot,
    parent_id: &str,
    next_card_id: &str,
) -> AppResult<DocumentSnapshot> {
    let sibling_count = snapshot
        .cards
        .iter()
        .filter(|card| card.parent_id.as_deref() == Some(parent_id))
        .count();
    let mut next_cards = snapshot.cards.clone();
    next_cards.push(create_card_record(
        snapshot,
        next_card_id,
        Some(parent_id.to_string()),
        sibling_count,
    ));
    let mut next_contents = snapshot.contents.clone();
    next_contents.push(CardContentRecord {
        card_id: next_card_id.to_string(),
        content_json: EMPTY_EDITOR_DOCUMENT.to_string(),
        layer_id: base_layer_id(snapshot)?,
    });

    Ok(DocumentSnapshot {
        cards: sort_cards(next_cards),
        contents: sort_contents(next_contents),
        layers: snapshot.layers.clone(),
        revisions: snapshot.revisions.clone(),
        summary: snapshot.summary.clone(),
    })
}

fn create_sibling_after_snapshot(
    snapshot: &DocumentSnapshot,
    sibling_id: &str,
    next_card_id: &str,
) -> AppResult<DocumentSnapshot> {
    let sibling = snapshot
        .cards
        .iter()
        .find(|card| card.id == sibling_id)
        .ok_or_else(|| {
            AppError::not_found(
                "mcp_card_missing",
                format!("No card exists with id {}.", sibling_id),
            )
        })?;
    let parent_id = sibling.parent_id.clone();
    let mut sibling_group = snapshot
        .cards
        .iter()
        .filter(|card| card.parent_id == parent_id)
        .cloned()
        .collect::<Vec<_>>();
    sibling_group.sort_by(|left, right| {
        left.order_index
            .cmp(&right.order_index)
            .then(left.id.cmp(&right.id))
    });
    let insertion_index = sibling_group
        .iter()
        .position(|card| card.id == sibling_id)
        .ok_or_else(|| {
            AppError::not_found(
                "mcp_card_missing",
                format!("No card exists with id {}.", sibling_id),
            )
        })?
        + 1;
    sibling_group.insert(
        insertion_index,
        create_card_record(snapshot, next_card_id, parent_id.clone(), insertion_index),
    );

    for (index, card) in sibling_group.iter_mut().enumerate() {
        card.order_index = index;
    }

    let mut next_cards = snapshot
        .cards
        .iter()
        .filter(|card| card.parent_id != parent_id)
        .cloned()
        .collect::<Vec<_>>();
    next_cards.extend(sibling_group);

    let mut next_contents = snapshot.contents.clone();
    next_contents.push(CardContentRecord {
        card_id: next_card_id.to_string(),
        content_json: EMPTY_EDITOR_DOCUMENT.to_string(),
        layer_id: base_layer_id(snapshot)?,
    });

    Ok(DocumentSnapshot {
        cards: sort_cards(next_cards),
        contents: sort_contents(next_contents),
        layers: snapshot.layers.clone(),
        revisions: snapshot.revisions.clone(),
        summary: snapshot.summary.clone(),
    })
}

fn wrap_level_in_parent_snapshot(
    snapshot: &DocumentSnapshot,
    card_id: &str,
    next_parent_id: &str,
) -> AppResult<DocumentSnapshot> {
    let card = snapshot
        .cards
        .iter()
        .find(|candidate| candidate.id == card_id)
        .ok_or_else(|| {
            AppError::not_found(
                "mcp_card_missing",
                format!("No card exists with id {}.", card_id),
            )
        })?;
    let parent_id = card.parent_id.clone();
    let mut sibling_group = snapshot
        .cards
        .iter()
        .filter(|candidate| candidate.parent_id == parent_id)
        .cloned()
        .collect::<Vec<_>>();
    sibling_group.sort_by(|left, right| {
        left.order_index
            .cmp(&right.order_index)
            .then(left.id.cmp(&right.id))
    });
    let wrapped_ids = sibling_group
        .iter()
        .map(|candidate| candidate.id.clone())
        .collect::<Vec<_>>();
    let next_parent = create_card_record(snapshot, next_parent_id, parent_id.clone(), 0);
    let wrapped_children = sibling_group
        .into_iter()
        .enumerate()
        .map(|(index, mut candidate)| {
            candidate.order_index = index;
            candidate.parent_id = Some(next_parent_id.to_string());
            candidate
        })
        .collect::<Vec<_>>();
    let wrapped_id_set = wrapped_ids
        .iter()
        .cloned()
        .collect::<std::collections::HashSet<_>>();
    let mut next_cards = snapshot
        .cards
        .iter()
        .filter(|candidate| !wrapped_id_set.contains(&candidate.id))
        .cloned()
        .collect::<Vec<_>>();
    next_cards.push(next_parent);
    next_cards.extend(wrapped_children);

    let mut next_contents = snapshot.contents.clone();
    next_contents.push(CardContentRecord {
        card_id: next_parent_id.to_string(),
        content_json: EMPTY_EDITOR_DOCUMENT.to_string(),
        layer_id: base_layer_id(snapshot)?,
    });

    Ok(DocumentSnapshot {
        cards: sort_cards(next_cards),
        contents: sort_contents(next_contents),
        layers: snapshot.layers.clone(),
        revisions: snapshot.revisions.clone(),
        summary: snapshot.summary.clone(),
    })
}

fn delete_card_subtree_snapshot(
    snapshot: &DocumentSnapshot,
    card_id: &str,
) -> AppResult<DocumentSnapshot> {
    let root_cards = snapshot
        .cards
        .iter()
        .filter(|card| card.parent_id.is_none())
        .collect::<Vec<_>>();

    if root_cards.len() == 1 && root_cards[0].id == card_id {
        return Err(AppError::invalid_input(
            "last_root_card",
            "The last root card cannot be deleted.",
        ));
    }

    let removed_card = snapshot
        .cards
        .iter()
        .find(|card| card.id == card_id)
        .ok_or_else(|| {
            AppError::not_found(
                "mcp_card_missing",
                format!("No card exists with id {}.", card_id),
            )
        })?;
    let deleted_ids = collect_descendant_ids(&snapshot.cards, card_id);
    let mut next_cards = snapshot
        .cards
        .iter()
        .filter(|card| !deleted_ids.contains(&card.id))
        .cloned()
        .collect::<Vec<_>>();
    reindex_cards_for_parent(&mut next_cards, removed_card.parent_id.as_deref());
    let next_contents = snapshot
        .contents
        .iter()
        .filter(|content| !deleted_ids.contains(&content.card_id))
        .cloned()
        .collect::<Vec<_>>();

    Ok(DocumentSnapshot {
        cards: sort_cards(next_cards),
        contents: sort_contents(next_contents),
        layers: snapshot.layers.clone(),
        revisions: snapshot.revisions.clone(),
        summary: snapshot.summary.clone(),
    })
}

fn serialize_result(value: &Value) -> AppResult<String> {
    serde_json::to_string_pretty(value).map_err(|error| {
        AppError::storage(
            "mcp_result_serialization_failed",
            "Fablecraft could not serialize the MCP result.",
            Some(error.to_string()),
        )
    })
}

fn enforce_payload_limit(response: &McpToolResponse) -> AppResult<()> {
    let encoded = serde_json::to_vec(response).map_err(|error| {
        AppError::storage(
            "mcp_response_serialization_failed",
            "Fablecraft could not serialize the MCP response payload.",
            Some(error.to_string()),
        )
    })?;

    if encoded.len() > MAX_MCP_PAYLOAD_BYTES {
        return Err(AppError::invalid_input(
            "mcp_payload_too_large",
            format!(
                "The MCP response exceeded the {} byte payload limit.",
                MAX_MCP_PAYLOAD_BYTES
            ),
        ));
    }

    Ok(())
}

fn current_document_path(state: &State<'_, AppState>) -> Result<PathBuf, AppErrorPayload> {
    state
        .current_document
        .lock()
        .expect("app state mutex should not be poisoned")
        .as_ref()
        .map(|context| context.path.clone())
        .ok_or_else(|| {
            AppError::invalid_input(
                "no_document_open",
                "Open or create a document before using MCP tools.",
            )
            .into()
        })
}

fn repository_result<T>(result: Result<T, AppErrorPayload>) -> AppResult<T> {
    result.map_err(|payload| {
        AppError::storage("mcp_repository_error", payload.message, payload.details)
    })
}

fn sort_cards(mut cards: Vec<crate::storage::CardRecord>) -> Vec<crate::storage::CardRecord> {
    cards.sort_by(|left, right| {
        left.parent_id
            .cmp(&right.parent_id)
            .then(left.order_index.cmp(&right.order_index))
            .then(left.id.cmp(&right.id))
    });
    cards
}

fn sort_contents(mut contents: Vec<CardContentRecord>) -> Vec<CardContentRecord> {
    contents.sort_by(|left, right| {
        left.layer_id
            .cmp(&right.layer_id)
            .then(left.card_id.cmp(&right.card_id))
    });
    contents
}

fn reindex_cards_for_parent(
    cards: &mut [crate::storage::CardRecord],
    parent_id: Option<&str>,
) {
    let mut sibling_indexes = cards
        .iter()
        .enumerate()
        .filter(|(_, card)| card.parent_id.as_deref() == parent_id)
        .map(|(index, card)| (index, card.order_index, card.id.clone()))
        .collect::<Vec<_>>();
    sibling_indexes.sort_by(|left, right| left.1.cmp(&right.1).then(left.2.cmp(&right.2)));

    for (next_order, (index, _, _)) in sibling_indexes.into_iter().enumerate() {
        cards[index].order_index = next_order;
    }
}

fn collect_descendant_ids(
    cards: &[crate::storage::CardRecord],
    root_card_id: &str,
) -> std::collections::HashSet<String> {
    let mut descendant_ids = std::collections::HashSet::from([root_card_id.to_string()]);
    let mut queue = vec![root_card_id.to_string()];

    while let Some(current_card_id) = queue.pop() {
        for child in cards
            .iter()
            .filter(|card| card.parent_id.as_deref() == Some(current_card_id.as_str()))
        {
            if descendant_ids.insert(child.id.clone()) {
                queue.push(child.id.clone());
            }
        }
    }

    descendant_ids
}

fn card_for_request<'a>(snapshot: &'a DocumentSnapshot, card_id: Option<&str>) -> AppResult<&'a crate::storage::CardRecord> {
    let next_card_id = card_id.ok_or_else(|| {
        AppError::invalid_input(
            "mcp_card_required",
            "This MCP tool requires an active card.",
        )
    })?;

    snapshot
        .cards
        .iter()
        .find(|card| card.id == next_card_id)
        .ok_or_else(|| {
            AppError::not_found(
                "mcp_card_missing",
                format!("No card exists with id {}.", next_card_id),
            )
        })
}

fn layer_for_request<'a>(snapshot: &'a DocumentSnapshot, layer_id: Option<&str>) -> AppResult<&'a LayerRecord> {
    let next_layer_id = layer_id.ok_or_else(|| {
        AppError::invalid_input(
            "mcp_layer_required",
            "This MCP tool requires an active layer.",
        )
    })?;

    snapshot
        .layers
        .iter()
        .find(|layer| layer.id == next_layer_id)
        .ok_or_else(|| {
            AppError::not_found(
                "mcp_layer_missing",
                format!("No layer exists with id {}.", next_layer_id),
            )
        })
}

fn card_payload(snapshot: &DocumentSnapshot, card_id: &str, layer_id: &str) -> AppResult<Value> {
    let card = snapshot
        .cards
        .iter()
        .find(|candidate| candidate.id == card_id)
        .ok_or_else(|| {
            AppError::not_found(
                "mcp_card_missing",
                format!("No card exists with id {}.", card_id),
            )
        })?;
    let content_record = snapshot
        .contents
        .iter()
        .find(|content| content.card_id == card_id && content.layer_id == layer_id);
    let has_explicit_layer_content = content_record.is_some();
    let content_json = content_record
        .map(|content| content.content_json.as_str())
        .unwrap_or(EMPTY_EDITOR_DOCUMENT);
    let content_value = parse_content_json(content_json)?;

    Ok(json!({
        "card": card,
        "content": content_value,
        "hasExplicitLayerContent": has_explicit_layer_content,
        "plainText": collect_text(&content_value).trim().to_string(),
    }))
}

fn parse_content_json(content_json: &str) -> AppResult<Value> {
    serde_json::from_str(content_json).map_err(|error| {
        AppError::storage(
            "invalid_content_json",
            "Fablecraft could not parse a card's content JSON.",
            Some(error.to_string()),
        )
    })
}

fn subtree_cards(snapshot: &DocumentSnapshot, root_card_id: &str) -> Vec<(String, usize)> {
    let mut child_map: HashMap<Option<String>, Vec<&crate::storage::CardRecord>> = HashMap::new();

    for card in &snapshot.cards {
        child_map.entry(card.parent_id.clone()).or_default().push(card);
    }

    for cards in child_map.values_mut() {
        cards.sort_by(|left, right| {
            left.order_index
                .cmp(&right.order_index)
                .then(left.id.cmp(&right.id))
        });
    }

    let mut ordered_cards = Vec::new();
    let mut stack = vec![(root_card_id.to_string(), 0_usize)];

    while let Some((card_id, depth)) = stack.pop() {
        ordered_cards.push((card_id.clone(), depth));

        if let Some(children) = child_map.get(&Some(card_id.clone())) {
            for child in children.iter().rev() {
                stack.push((child.id.clone(), depth + 1));
            }
        }
    }

    ordered_cards
}

fn content_json_for_plain_text(text: &str) -> AppResult<String> {
    let normalized_text = text.replace("\r\n", "\n");

    if normalized_text.trim().is_empty() {
        return Ok(EMPTY_EDITOR_DOCUMENT.to_string());
    }

    let paragraphs = normalized_text
        .split("\n\n")
        .map(|paragraph| {
            let lines = paragraph
                .split('\n')
                .filter(|line| !line.is_empty())
                .collect::<Vec<_>>();
            let text_nodes = lines
                .iter()
                .enumerate()
                .map(|(index, line)| {
                    json!({
                        "text": if index + 1 < lines.len() {
                            format!("{line}\n")
                        } else {
                            (*line).to_string()
                        },
                        "type": "text",
                    })
                })
                .collect::<Vec<_>>();

            json!({
                "content": text_nodes,
                "type": "paragraph",
            })
        })
        .collect::<Vec<_>>();

    serde_json::to_string(&json!({
        "content": paragraphs,
        "type": "doc",
    }))
    .map_err(|error| {
        AppError::storage(
            "content_serialization_failed",
            "Fablecraft could not serialize the updated card content.",
            Some(error.to_string()),
        )
    })
}

fn collect_text(node: &Value) -> String {
    let node_type = node.get("type").and_then(Value::as_str).unwrap_or_default();

    match node_type {
        "doc" => node
            .get("content")
            .and_then(Value::as_array)
            .map(|children| {
                children
                    .iter()
                    .map(collect_text)
                    .collect::<Vec<_>>()
                    .join("\n\n")
            })
            .unwrap_or_default(),
        "hardBreak" => "\n".to_string(),
        "bulletList" | "orderedList" => node
            .get("content")
            .and_then(Value::as_array)
            .map(|children| children.iter().map(collect_text).collect::<Vec<_>>().join("\n"))
            .unwrap_or_default(),
        "listItem" => {
            let item_text = node
                .get("content")
                .and_then(Value::as_array)
                .map(|children| children.iter().map(collect_text).collect::<Vec<_>>().join("\n"))
                .unwrap_or_default();
            let lines = item_text
                .split('\n')
                .map(str::trim_end)
                .collect::<Vec<_>>();

            lines
                .iter()
                .enumerate()
                .filter_map(|(index, line)| {
                    if line.is_empty() && index + 1 == lines.len() {
                        None
                    } else if index == 0 {
                        Some(format!("- {}", line.trim_start()))
                    } else {
                        Some(format!("  {line}"))
                    }
                })
                .collect::<Vec<_>>()
                .join("\n")
        }
        _ => {
            let own_text = node
                .get("text")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let child_text = node
                .get("content")
                .and_then(Value::as_array)
                .map(|children| children.iter().map(collect_text).collect::<String>())
                .unwrap_or_default();

            format!("{own_text}{child_text}")
        }
    }
}

#[cfg(test)]
mod tests {
    use std::fs;

    use serde_json::json;
    use uuid::Uuid;

    use super::*;

    fn temp_document_path(label: &str) -> PathBuf {
        std::env::temp_dir().join(format!("fablecraft-mcp-{label}-{}.fable", Uuid::new_v4()))
    }

    fn request(tool_name: &str) -> McpToolRequest {
        McpToolRequest {
            arguments_json: None,
            card_id: None,
            layer_id: None,
            scope: "card".to_string(),
            tool_name: tool_name.to_string(),
        }
    }

    #[test]
    fn get_subtree_returns_cards_in_tree_order() {
        let path = temp_document_path("subtree");
        DocumentRepository::create(path.clone()).expect("document should create");
        let snapshot = DocumentRepository::load(path.clone()).expect("snapshot should load");
        let root_card = snapshot
            .cards
            .iter()
            .find(|card| card.parent_id.is_none())
            .expect("root card should exist")
            .clone();
        let base_layer = snapshot
            .layers
            .iter()
            .find(|layer| layer.is_base)
            .expect("base layer should exist")
            .clone();
        let child_a_id = Uuid::new_v4().to_string();
        let child_b_id = Uuid::new_v4().to_string();
        let grandchild_id = Uuid::new_v4().to_string();
        let next_snapshot = DocumentSnapshot {
            cards: vec![
                root_card.clone(),
                crate::storage::CardRecord {
                    document_id: snapshot.summary.document_id.clone(),
                    id: child_a_id.clone(),
                    order_index: 0,
                    parent_id: Some(root_card.id.clone()),
                    card_type: "card".to_string(),
                },
                crate::storage::CardRecord {
                    document_id: snapshot.summary.document_id.clone(),
                    id: child_b_id.clone(),
                    order_index: 1,
                    parent_id: Some(root_card.id.clone()),
                    card_type: "card".to_string(),
                },
                crate::storage::CardRecord {
                    document_id: snapshot.summary.document_id.clone(),
                    id: grandchild_id.clone(),
                    order_index: 0,
                    parent_id: Some(child_a_id.clone()),
                    card_type: "card".to_string(),
                },
            ],
            contents: vec![
                CardContentRecord {
                    card_id: root_card.id.clone(),
                    content_json: content_json_for_plain_text("Root").expect("content should serialize"),
                    layer_id: base_layer.id.clone(),
                },
                CardContentRecord {
                    card_id: child_a_id.clone(),
                    content_json: content_json_for_plain_text("Child A")
                        .expect("content should serialize"),
                    layer_id: base_layer.id.clone(),
                },
                CardContentRecord {
                    card_id: child_b_id.clone(),
                    content_json: content_json_for_plain_text("Child B")
                        .expect("content should serialize"),
                    layer_id: base_layer.id.clone(),
                },
                CardContentRecord {
                    card_id: grandchild_id.clone(),
                    content_json: content_json_for_plain_text("Grandchild")
                        .expect("content should serialize"),
                    layer_id: base_layer.id.clone(),
                },
            ],
            layers: snapshot.layers.clone(),
            revisions: snapshot.revisions.clone(),
            summary: snapshot.summary.clone(),
        };

        DocumentRepository::save(path.clone(), editable_snapshot(&next_snapshot))
            .expect("snapshot should save");

        let response = invoke_mcp_tool_inner(
            path.clone(),
            McpToolRequest {
                card_id: Some(root_card.id.clone()),
                layer_id: Some(base_layer.id.clone()),
                scope: "subtree".to_string(),
                ..request(TOOL_GET_SUBTREE)
            },
        )
        .expect("subtree tool should succeed");
        let payload: Value =
            serde_json::from_str(&response.result_json).expect("payload should be valid json");
        let card_ids = payload["entries"]
            .as_array()
            .expect("entries should be an array")
            .iter()
            .map(|entry| entry["card"]["id"].as_str().unwrap().to_string())
            .collect::<Vec<_>>();

        assert_eq!(card_ids, vec![root_card.id, child_a_id, grandchild_id, child_b_id]);

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn set_card_text_persists_a_revision_backed_snapshot() {
        let path = temp_document_path("set-card");
        DocumentRepository::create(path.clone()).expect("document should create");
        let snapshot = DocumentRepository::load(path.clone()).expect("snapshot should load");
        let root_card = snapshot
            .cards
            .iter()
            .find(|card| card.parent_id.is_none())
            .expect("root card should exist")
            .clone();
        let base_layer = snapshot
            .layers
            .iter()
            .find(|layer| layer.is_base)
            .expect("base layer should exist")
            .clone();

        let response = invoke_mcp_tool_inner(
            path.clone(),
            McpToolRequest {
                arguments_json: Some(json!({ "text": "Updated beat" }).to_string()),
                card_id: Some(root_card.id.clone()),
                layer_id: Some(base_layer.id.clone()),
                scope: "card".to_string(),
                tool_name: TOOL_SET_CARD_TEXT.to_string(),
            },
        )
        .expect("mutation tool should succeed");
        let persisted_snapshot = response.snapshot.expect("mutation should return a snapshot");
        let root_content = persisted_snapshot
            .contents
            .iter()
            .find(|content| content.card_id == root_card.id && content.layer_id == base_layer.id)
            .expect("root content should exist");

        assert!(root_content.content_json.contains("Updated beat"));
        assert_eq!(persisted_snapshot.revisions.len(), 1);

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn rename_layer_updates_the_persisted_layer_record() {
        let path = temp_document_path("rename-layer");
        DocumentRepository::create(path.clone()).expect("document should create");
        let snapshot = DocumentRepository::load(path.clone()).expect("snapshot should load");
        let base_layer = snapshot
            .layers
            .iter()
            .find(|layer| layer.is_base)
            .expect("base layer should exist")
            .clone();

        let response = invoke_mcp_tool_inner(
            path.clone(),
            McpToolRequest {
                arguments_json: Some(
                    json!({
                        "description": "Core draft",
                        "name": "Draft",
                    })
                    .to_string(),
                ),
                card_id: None,
                layer_id: Some(base_layer.id.clone()),
                scope: "document".to_string(),
                tool_name: TOOL_RENAME_LAYER.to_string(),
            },
        )
        .expect("layer tool should succeed");
        let persisted_snapshot = response.snapshot.expect("mutation should return a snapshot");
        let renamed_layer = persisted_snapshot
            .layers
            .iter()
            .find(|layer| layer.id == base_layer.id)
            .expect("renamed layer should exist");

        assert_eq!(renamed_layer.name, "Draft");
        assert_eq!(renamed_layer.description.as_deref(), Some("Core draft"));

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn create_child_persists_a_new_tree_card() {
        let path = temp_document_path("create-child");
        DocumentRepository::create(path.clone()).expect("document should create");
        let snapshot = DocumentRepository::load(path.clone()).expect("snapshot should load");
        let root_card = snapshot
            .cards
            .iter()
            .find(|card| card.parent_id.is_none())
            .expect("root card should exist")
            .clone();

        let response = invoke_mcp_tool_inner(
            path.clone(),
            McpToolRequest {
                arguments_json: Some("{}".to_string()),
                card_id: Some(root_card.id.clone()),
                layer_id: None,
                scope: "card".to_string(),
                tool_name: TOOL_CREATE_CHILD.to_string(),
            },
        )
        .expect("create child should succeed");
        let persisted_snapshot = response.snapshot.expect("mutation should return a snapshot");
        let child_count = persisted_snapshot
            .cards
            .iter()
            .filter(|card| card.parent_id.as_deref() == Some(root_card.id.as_str()))
            .count();

        assert_eq!(child_count, 1);

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn oversized_payloads_fail_with_a_structured_error() {
        let path = temp_document_path("payload-limit");
        DocumentRepository::create(path.clone()).expect("document should create");
        let snapshot = DocumentRepository::load(path.clone()).expect("snapshot should load");
        let root_card = snapshot
            .cards
            .iter()
            .find(|card| card.parent_id.is_none())
            .expect("root card should exist")
            .clone();
        let base_layer = snapshot
            .layers
            .iter()
            .find(|layer| layer.is_base)
            .expect("base layer should exist")
            .clone();
        let huge_text = "a".repeat(MAX_MCP_PAYLOAD_BYTES);
        let next_snapshot = DocumentSnapshot {
            contents: vec![CardContentRecord {
                card_id: root_card.id.clone(),
                content_json: content_json_for_plain_text(&huge_text)
                    .expect("content should serialize"),
                layer_id: base_layer.id.clone(),
            }],
            ..snapshot
        };

        DocumentRepository::save(path.clone(), editable_snapshot(&next_snapshot))
            .expect("snapshot should save");

        let error = invoke_mcp_tool_inner(
            path.clone(),
            McpToolRequest {
                card_id: Some(root_card.id),
                layer_id: Some(base_layer.id),
                scope: "card".to_string(),
                tool_name: TOOL_GET_CARD.to_string(),
                arguments_json: None,
            },
        )
        .expect_err("tool should reject oversized payloads");

        assert_eq!(error.to_payload().code, "mcp_payload_too_large");

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn unknown_tool_names_return_mcp_tool_missing() {
        let path = temp_document_path("unknown-tool");
        DocumentRepository::create(path.clone()).expect("document should create");

        let error = invoke_mcp_tool_inner(
            path.clone(),
            McpToolRequest {
                arguments_json: None,
                card_id: None,
                layer_id: None,
                scope: "document".to_string(),
                tool_name: "fablecraft_do_the_thing".to_string(),
            },
        )
        .expect_err("unknown tool should fail");

        assert_eq!(error.to_payload().code, "mcp_tool_missing");

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn legacy_dotted_tool_names_are_normalized_to_underscored_variants() {
        let path = temp_document_path("dotted-tool");
        DocumentRepository::create(path.clone()).expect("document should create");

        let response = invoke_mcp_tool_inner(
            path.clone(),
            McpToolRequest {
                arguments_json: None,
                card_id: None,
                layer_id: None,
                scope: "document".to_string(),
                tool_name: "fablecraft.get_document".to_string(),
            },
        )
        .expect("dotted alias should resolve to the underscore variant");

        assert_eq!(response.tool_name, "fablecraft.get_document");
        assert!(response.result_json.contains("documentId"));

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn mutation_tools_reject_arguments_with_mismatched_types() {
        let path = temp_document_path("schema-mismatch");
        DocumentRepository::create(path.clone()).expect("document should create");
        let snapshot = DocumentRepository::load(path.clone()).expect("snapshot should load");
        let root_card = snapshot
            .cards
            .iter()
            .find(|card| card.parent_id.is_none())
            .expect("root card should exist")
            .clone();
        let base_layer = snapshot
            .layers
            .iter()
            .find(|layer| layer.is_base)
            .expect("base layer should exist")
            .clone();

        let error = invoke_mcp_tool_inner(
            path.clone(),
            McpToolRequest {
                arguments_json: Some(json!({ "text": 123 }).to_string()),
                card_id: Some(root_card.id),
                layer_id: Some(base_layer.id),
                scope: "card".to_string(),
                tool_name: TOOL_SET_CARD_TEXT.to_string(),
            },
        )
        .expect_err("integer payload should fail string schema");

        assert_eq!(error.to_payload().code, "mcp_invalid_arguments");

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn mutation_tools_reject_unparseable_json_arguments() {
        let path = temp_document_path("bad-json");
        DocumentRepository::create(path.clone()).expect("document should create");
        let snapshot = DocumentRepository::load(path.clone()).expect("snapshot should load");
        let root_card = snapshot
            .cards
            .iter()
            .find(|card| card.parent_id.is_none())
            .expect("root card should exist")
            .clone();
        let base_layer = snapshot
            .layers
            .iter()
            .find(|layer| layer.is_base)
            .expect("base layer should exist")
            .clone();

        let error = invoke_mcp_tool_inner(
            path.clone(),
            McpToolRequest {
                arguments_json: Some("{not json".to_string()),
                card_id: Some(root_card.id),
                layer_id: Some(base_layer.id),
                scope: "card".to_string(),
                tool_name: TOOL_SET_CARD_TEXT.to_string(),
            },
        )
        .expect_err("unparseable json should fail");

        assert_eq!(error.to_payload().code, "mcp_invalid_arguments");

        fs::remove_file(path).expect("temp file should be removable");
    }

    #[test]
    fn oversized_arguments_are_rejected_before_tool_dispatch() {
        let path = temp_document_path("oversized-arguments");
        DocumentRepository::create(path.clone()).expect("document should create");

        let huge_arguments = format!(
            "{{\"text\":\"{}\"}}",
            "a".repeat(MAX_MCP_ARGUMENT_BYTES + 1),
        );

        let error = invoke_mcp_tool_inner(
            path.clone(),
            McpToolRequest {
                arguments_json: Some(huge_arguments),
                card_id: None,
                layer_id: None,
                scope: "card".to_string(),
                tool_name: TOOL_SET_CARD_TEXT.to_string(),
            },
        )
        .expect_err("oversized arguments should be rejected");

        assert_eq!(error.to_payload().code, "mcp_arguments_too_large");

        fs::remove_file(path).expect("temp file should be removable");
    }
}
