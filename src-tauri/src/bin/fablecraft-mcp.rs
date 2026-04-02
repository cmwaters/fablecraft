use std::io::{self, BufRead, Write};
use std::path::PathBuf;

use fablecraft_lib::mcp::{invoke_mcp_tool_for_path, McpToolRequest};
use serde_json::{json, Map, Value};

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

fn main() {
    let stdin = io::stdin();
    let mut stdout = io::stdout();

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(line) => line,
            Err(error) => {
                let _ = writeln!(io::stderr(), "Failed to read MCP input: {error}");
                break;
            }
        };

        if line.trim().is_empty() {
            continue;
        }

        let input: Value = match serde_json::from_str(&line) {
            Ok(value) => value,
            Err(error) => {
                let response = jsonrpc_error(
                    Value::Null,
                    -32700,
                    format!("Invalid JSON-RPC payload: {error}"),
                );
                let _ = writeln!(stdout, "{response}");
                let _ = stdout.flush();
                continue;
            }
        };

        let responses = handle_message(input);

        if responses.is_null() {
            continue;
        }

        let _ = writeln!(stdout, "{responses}");
        let _ = stdout.flush();
    }
}

fn handle_message(input: Value) -> Value {
    if let Some(messages) = input.as_array() {
        let responses = messages
            .iter()
            .filter_map(|message| handle_request(message.clone()))
            .collect::<Vec<_>>();

        return if responses.is_empty() {
            Value::Null
        } else {
            Value::Array(responses)
        };
    }

    handle_request(input).unwrap_or(Value::Null)
}

fn handle_request(input: Value) -> Option<Value> {
    let id = input.get("id").cloned().unwrap_or(Value::Null);
    let method = input.get("method").and_then(Value::as_str)?;
    let params = input.get("params").cloned().unwrap_or_else(|| json!({}));

    match method {
        "notifications/initialized" => None,
        "initialize" => Some(jsonrpc_result(
            id,
            json!({
                "capabilities": {
                    "tools": {
                        "listChanged": false
                    }
                },
                "protocolVersion": params
                    .get("protocolVersion")
                    .cloned()
                    .unwrap_or_else(|| Value::String("2024-11-05".to_string())),
                "serverInfo": {
                    "name": "fablecraft-mcp",
                    "version": env!("CARGO_PKG_VERSION")
                }
            }),
        )),
        "ping" => Some(jsonrpc_result(id, json!({}))),
        "tools/list" => Some(jsonrpc_result(id, json!({ "tools": tool_definitions() }))),
        "tools/call" => Some(handle_tool_call(id, params)),
        _ => Some(jsonrpc_error(
            id,
            -32601,
            format!("Method \"{method}\" is not supported by fablecraft-mcp."),
        )),
    }
}

fn handle_tool_call(id: Value, params: Value) -> Value {
    let Some(name) = params.get("name").and_then(Value::as_str) else {
        return jsonrpc_error(id, -32602, "Tool calls require a tool name.".to_string());
    };
    let Some(arguments) = params.get("arguments").and_then(Value::as_object) else {
        return jsonrpc_error(id, -32602, "Tool calls require an arguments object.".to_string());
    };

    let mut arguments = arguments.clone();
    let document_path = match extract_required_string(&mut arguments, "documentPath") {
        Ok(path) => PathBuf::from(path),
        Err(error) => return jsonrpc_error(id, -32602, error),
    };
    let (scope, card_id, layer_id) = match scoped_request_fields(name, &mut arguments) {
        Ok(values) => values,
        Err(error) => return jsonrpc_error(id, -32602, error),
    };

    let request = McpToolRequest {
        arguments_json: Some(Value::Object(arguments).to_string()),
        card_id,
        layer_id,
        scope: scope.to_string(),
        tool_name: name.to_string(),
    };

    match invoke_mcp_tool_for_path(document_path, request) {
        Ok(response) => {
            let structured_content = serde_json::from_str::<Value>(&response.result_json)
                .unwrap_or_else(|_| json!({ "raw": response.result_json }));

            jsonrpc_result(
                id,
                json!({
                    "content": [
                        {
                            "type": "text",
                            "text": format!("{}\n\n{}", response.summary, response.result_json)
                        }
                    ],
                    "structuredContent": structured_content
                }),
            )
        }
        Err(error) => jsonrpc_result(
            id,
            json!({
                "content": [
                    {
                        "type": "text",
                        "text": error.message
                    }
                ],
                "isError": true,
                "structuredContent": {
                    "code": error.code,
                    "details": error.details,
                    "message": error.message
                }
            }),
        ),
    }
}

fn scoped_request_fields(
    name: &str,
    arguments: &mut Map<String, Value>,
) -> Result<(&'static str, Option<String>, Option<String>), String> {
    match name {
        TOOL_GET_DOCUMENT | TOOL_LIST_LAYERS => Ok(("document", None, None)),
        TOOL_RENAME_LAYER => Ok((
            "document",
            None,
            Some(extract_required_string(arguments, "layerId")?),
        )),
        TOOL_GET_CARD | TOOL_SET_CARD_TEXT => Ok((
            "card",
            Some(extract_required_string(arguments, "cardId")?),
            Some(extract_required_string(arguments, "layerId")?),
        )),
        TOOL_GET_SUBTREE => Ok((
            "subtree",
            Some(extract_required_string(arguments, "cardId")?),
            Some(extract_required_string(arguments, "layerId")?),
        )),
        TOOL_CREATE_CHILD => Ok((
            "card",
            Some(extract_required_string(arguments, "parentCardId")?),
            None,
        )),
        TOOL_CREATE_SIBLING_AFTER => Ok((
            "card",
            Some(extract_required_string(arguments, "siblingCardId")?),
            None,
        )),
        TOOL_WRAP_LEVEL_IN_PARENT | TOOL_DELETE_CARD => Ok((
            "card",
            Some(extract_required_string(arguments, "cardId")?),
            None,
        )),
        _ => Err(format!("Tool \"{name}\" is not registered.")),
    }
}

fn extract_required_string(
    arguments: &mut Map<String, Value>,
    key: &str,
) -> Result<String, String> {
    arguments
        .remove(key)
        .and_then(|value| value.as_str().map(ToString::to_string))
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| format!("Tool arguments must include a non-empty \"{key}\" string."))
}

fn tool_definitions() -> Vec<Value> {
    vec![
        tool(
            TOOL_GET_DOCUMENT,
            "Read document metadata and discover the root card id for a .fable document.",
            object_schema(
                &[("documentPath", path_schema("Absolute path to a .fable document."))],
                &["documentPath"],
            ),
        ),
        tool(
            TOOL_LIST_LAYERS,
            "List the layers in a .fable document so you can choose a layer id.",
            object_schema(
                &[("documentPath", path_schema("Absolute path to a .fable document."))],
                &["documentPath"],
            ),
        ),
        tool(
            TOOL_GET_CARD,
            "Read one card in a specific layer. Use this after discovering card and layer ids.",
            object_schema(
                &[
                    ("documentPath", path_schema("Absolute path to a .fable document.")),
                    ("layerId", string_schema("Layer id to read from.")),
                    ("cardId", string_schema("Card id to read.")),
                ],
                &["documentPath", "layerId", "cardId"],
            ),
        ),
        tool(
            TOOL_GET_SUBTREE,
            "Read a card and all descendants in tree order for one layer.",
            object_schema(
                &[
                    ("documentPath", path_schema("Absolute path to a .fable document.")),
                    ("layerId", string_schema("Layer id to read from.")),
                    ("cardId", string_schema("Root card id for the subtree.")),
                ],
                &["documentPath", "layerId", "cardId"],
            ),
        ),
        tool(
            TOOL_SET_CARD_TEXT,
            "Replace the selected card's content with plain text in one layer.",
            object_schema(
                &[
                    ("documentPath", path_schema("Absolute path to a .fable document.")),
                    ("layerId", string_schema("Layer id to write into.")),
                    ("cardId", string_schema("Card id to update.")),
                    ("text", string_schema("Plain text content for the card.")),
                ],
                &["documentPath", "layerId", "cardId", "text"],
            ),
        ),
        tool(
            TOOL_RENAME_LAYER,
            "Rename a layer and optionally update its description.",
            object_schema(
                &[
                    ("documentPath", path_schema("Absolute path to a .fable document.")),
                    ("layerId", string_schema("Layer id to rename.")),
                    ("name", string_schema("New layer name.")),
                    (
                        "description",
                        json!({
                            "type": "string",
                            "description": "Optional layer description."
                        }),
                    ),
                ],
                &["documentPath", "layerId", "name"],
            ),
        ),
        tool(
            TOOL_CREATE_CHILD,
            "Create an empty child card beneath the given parent card.",
            object_schema(
                &[
                    ("documentPath", path_schema("Absolute path to a .fable document.")),
                    ("parentCardId", string_schema("Parent card id.")),
                ],
                &["documentPath", "parentCardId"],
            ),
        ),
        tool(
            TOOL_CREATE_SIBLING_AFTER,
            "Create an empty sibling card immediately after the given sibling.",
            object_schema(
                &[
                    ("documentPath", path_schema("Absolute path to a .fable document.")),
                    ("siblingCardId", string_schema("Existing sibling card id.")),
                ],
                &["documentPath", "siblingCardId"],
            ),
        ),
        tool(
            TOOL_WRAP_LEVEL_IN_PARENT,
            "Create a new parent above the current sibling level, matching the app's wrap-level behavior.",
            object_schema(
                &[
                    ("documentPath", path_schema("Absolute path to a .fable document.")),
                    ("cardId", string_schema("Any card in the level to wrap.")),
                ],
                &["documentPath", "cardId"],
            ),
        ),
        tool(
            TOOL_DELETE_CARD,
            "Delete the card and its subtree. This cannot delete the last root card.",
            object_schema(
                &[
                    ("documentPath", path_schema("Absolute path to a .fable document.")),
                    ("cardId", string_schema("Card id to delete.")),
                ],
                &["documentPath", "cardId"],
            ),
        ),
    ]
}

fn tool(name: &str, description: &str, input_schema: Value) -> Value {
    json!({
        "name": name,
        "description": description,
        "inputSchema": input_schema
    })
}

fn object_schema(properties: &[(&str, Value)], required: &[&str]) -> Value {
    let mut props = Map::new();

    for (name, schema) in properties {
        props.insert((*name).to_string(), schema.clone());
    }

    json!({
        "type": "object",
        "properties": props,
        "required": required
    })
}

fn string_schema(description: &str) -> Value {
    json!({
        "type": "string",
        "description": description
    })
}

fn path_schema(description: &str) -> Value {
    json!({
        "type": "string",
        "description": description,
        "pattern": ".*\\.fable$"
    })
}

fn jsonrpc_result(id: Value, result: Value) -> Value {
    json!({
        "jsonrpc": "2.0",
        "id": id,
        "result": result
    })
}

fn jsonrpc_error(id: Value, code: i64, message: String) -> Value {
    json!({
        "jsonrpc": "2.0",
        "id": id,
        "error": {
            "code": code,
            "message": message
        }
    })
}

#[cfg(test)]
mod tests {
    use std::fs;

    use serde_json::Value;
    use uuid::Uuid;

    use super::*;
    use fablecraft_lib::mcp::invoke_mcp_tool_for_path;

    fn temp_document_path(label: &str) -> PathBuf {
        std::env::temp_dir().join(format!("fablecraft-stdio-{label}-{}.fable", Uuid::new_v4()))
    }

    #[test]
    fn tools_list_exposes_document_path_schemas() {
        let response = handle_request(json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list",
            "params": {}
        }))
        .expect("tools/list should respond");

        let tools = response["result"]["tools"]
            .as_array()
            .expect("tools should be an array");

        assert!(tools
            .iter()
            .any(|tool| tool["name"] == TOOL_GET_DOCUMENT));
        assert!(tools.iter().all(|tool| {
            tool["name"]
                .as_str()
                .map(|name| {
                    name.chars()
                        .all(|character| character.is_ascii_alphanumeric() || character == '_' || character == '-')
                })
                .unwrap_or(false)
        }));
        assert_eq!(
            tools[0]["inputSchema"]["properties"]["documentPath"]["pattern"],
            ".*\\.fable$"
        );
    }

    #[test]
    fn tools_call_returns_structured_content() {
        let path = temp_document_path("call");
        let summary = invoke_mcp_tool_for_path(
            path.clone(),
            McpToolRequest {
                arguments_json: None,
                card_id: None,
                layer_id: None,
                scope: "document".to_string(),
                tool_name: TOOL_GET_DOCUMENT.to_string(),
            },
        );

        assert!(summary.is_err());

        fablecraft_lib::storage::DocumentRepository::create(path.clone())
            .expect("document should create");
        let response = handle_request(json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": TOOL_GET_DOCUMENT,
                "arguments": {
                    "documentPath": path.to_string_lossy().to_string()
                }
            }
        }))
        .expect("tools/call should respond");
        let structured = response["result"]["structuredContent"]
            .as_object()
            .expect("structured content should be an object");

        assert_eq!(structured["cardCount"], Value::from(1));
        assert!(response["result"]["content"][0]["text"]
            .as_str()
            .unwrap()
            .contains("Loaded document metadata."));

        fs::remove_file(path).expect("temp file should be removable");
    }
}
