use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;
use serde_json::{Map as JsonMap, Value as JsonValue};

use crate::error::{AppError, AppErrorPayload, AppResult};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalIntegrationStatus {
    pub binary_exists: bool,
    pub binary_path: Option<String>,
    pub config_path: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalIntegrationStatuses {
    pub claude_desktop: LocalIntegrationStatus,
    pub codex: LocalIntegrationStatus,
}

#[tauri::command]
pub fn load_local_integration_statuses() -> Result<LocalIntegrationStatuses, AppErrorPayload> {
    integration_statuses().map_err(AppErrorPayload::from)
}

#[tauri::command]
pub fn enable_claude_desktop_integration() -> Result<LocalIntegrationStatus, AppErrorPayload> {
    let binary_path = resolve_mcp_binary_path()?;
    let config_path = claude_desktop_config_path()?;
    let existing_contents = read_optional_text_file(&config_path)?;
    let next_contents = update_claude_config_contents(existing_contents.as_deref(), &binary_path)?;

    write_text_file(&config_path, &next_contents)?;

    integration_statuses()
        .map(|statuses| statuses.claude_desktop)
        .map_err(AppErrorPayload::from)
}

#[tauri::command]
pub fn enable_codex_integration() -> Result<LocalIntegrationStatus, AppErrorPayload> {
    let binary_path = resolve_mcp_binary_path()?;
    let config_path = codex_config_path()?;
    let existing_contents = read_optional_text_file(&config_path)?;
    let next_contents = update_codex_config_contents(existing_contents.as_deref(), &binary_path)?;

    write_text_file(&config_path, &next_contents)?;

    integration_statuses()
        .map(|statuses| statuses.codex)
        .map_err(AppErrorPayload::from)
}

fn integration_statuses() -> AppResult<LocalIntegrationStatuses> {
    let claude_config_path = claude_desktop_config_path()?;
    let codex_config_path = codex_config_path()?;
    let resolved_binary_path = resolve_existing_mcp_binary_path();

    let claude_contents = read_optional_text_file(&claude_config_path)?;
    let codex_contents = read_optional_text_file(&codex_config_path)?;

    Ok(LocalIntegrationStatuses {
        claude_desktop: LocalIntegrationStatus {
            binary_exists: resolved_binary_path.is_some(),
            binary_path: resolved_binary_path
                .as_ref()
                .map(|path| path.display().to_string()),
            config_path: claude_config_path.display().to_string(),
            enabled: claude_entry_present(claude_contents.as_deref())?,
        },
        codex: LocalIntegrationStatus {
            binary_exists: resolved_binary_path.is_some(),
            binary_path: resolved_binary_path.map(|path| path.display().to_string()),
            config_path: codex_config_path.display().to_string(),
            enabled: codex_entry_present(codex_contents.as_deref())?,
        },
    })
}

fn resolve_mcp_binary_path() -> AppResult<PathBuf> {
    resolve_existing_mcp_binary_path().ok_or_else(|| {
        AppError::not_found(
            "mcp_binary_missing",
            "Fablecraft could not find the local MCP binary. Build it first or install a bundle that includes it.",
        )
    })
}

fn resolve_existing_mcp_binary_path() -> Option<PathBuf> {
    mcp_binary_candidates().into_iter().find(|path| path.exists())
}

fn mcp_binary_candidates() -> Vec<PathBuf> {
    let binary_name = mcp_binary_name();
    let mut candidates = Vec::new();

    if let Ok(current_exe) = env::current_exe() {
        if let Some(parent) = current_exe.parent() {
            for ancestor in parent.ancestors().take(4) {
                candidates.extend(binary_candidates_from_directory(ancestor, binary_name));
            }

            if let Some(grandparent) = parent.parent() {
                candidates.push(grandparent.join("Resources").join(binary_name));
                candidates.push(grandparent.join("MacOS").join(binary_name));
            }
        }
    }

    if let Ok(current_dir) = env::current_dir() {
        for ancestor in current_dir.ancestors().take(4) {
            candidates.extend(binary_candidates_from_directory(ancestor, binary_name));
        }
    }

    dedupe_paths(candidates)
}

fn binary_candidates_from_directory(directory: &Path, binary_name: &str) -> Vec<PathBuf> {
    vec![
        directory.join(binary_name),
        directory.join("release").join(binary_name),
        directory.join("debug").join(binary_name),
        directory.join("target").join("release").join(binary_name),
        directory.join("target").join("debug").join(binary_name),
        directory
            .join("src-tauri")
            .join("target")
            .join("release")
            .join(binary_name),
        directory
            .join("src-tauri")
            .join("target")
            .join("debug")
            .join(binary_name),
    ]
}

fn dedupe_paths(paths: Vec<PathBuf>) -> Vec<PathBuf> {
    let mut unique = Vec::new();

    for path in paths {
        if unique.iter().any(|existing| existing == &path) {
            continue;
        }

        unique.push(path);
    }

    unique
}

#[cfg(target_os = "windows")]
fn mcp_binary_name() -> &'static str {
    "fablecraft-mcp.exe"
}

#[cfg(not(target_os = "windows"))]
fn mcp_binary_name() -> &'static str {
    "fablecraft-mcp"
}

fn home_directory() -> AppResult<PathBuf> {
    env::var_os("HOME")
        .map(PathBuf::from)
        .ok_or_else(|| AppError::not_found("home_directory_missing", "Fablecraft could not find the current home directory."))
}

fn claude_desktop_config_path() -> AppResult<PathBuf> {
    Ok(home_directory()?
        .join("Library")
        .join("Application Support")
        .join("Claude")
        .join("claude_desktop_config.json"))
}

fn codex_config_path() -> AppResult<PathBuf> {
    Ok(home_directory()?.join(".codex").join("config.toml"))
}

fn read_optional_text_file(path: &Path) -> AppResult<Option<String>> {
    match fs::read_to_string(path) {
        Ok(contents) => Ok(Some(contents)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(AppError::from(error)),
    }
}

fn write_text_file(path: &Path, contents: &str) -> AppResult<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(path, contents)?;
    Ok(())
}

fn claude_entry_present(contents: Option<&str>) -> AppResult<bool> {
    let Some(contents) = contents else {
        return Ok(false);
    };

    let parsed = parse_claude_config(contents)?;
    Ok(parsed
        .get("mcpServers")
        .and_then(JsonValue::as_object)
        .and_then(|servers| servers.get("fablecraft"))
        .and_then(JsonValue::as_object)
        .and_then(|server| server.get("command"))
        .and_then(JsonValue::as_str)
        .map(|command| command.contains("fablecraft-mcp"))
        .unwrap_or(false))
}

fn codex_entry_present(contents: Option<&str>) -> AppResult<bool> {
    let Some(contents) = contents else {
        return Ok(false);
    };

    Ok(extract_toml_section(contents, "[mcp_servers.fablecraft]")
        .map(|section| section.contains("fablecraft-mcp"))
        .unwrap_or(false))
}

fn update_claude_config_contents(contents: Option<&str>, binary_path: &Path) -> AppResult<String> {
    let mut parsed = match contents {
        Some(contents) if !contents.trim().is_empty() => parse_claude_config(contents)?,
        _ => JsonValue::Object(JsonMap::new()),
    };

    let root = parsed
        .as_object_mut()
        .ok_or_else(|| AppError::invalid_input("claude_config_invalid", "Claude Desktop config must be a JSON object."))?;

    let mcp_servers = root
        .entry("mcpServers".to_string())
        .or_insert_with(|| JsonValue::Object(JsonMap::new()))
        .as_object_mut()
        .ok_or_else(|| AppError::invalid_input("claude_config_invalid", "Claude Desktop mcpServers must be an object."))?;

    mcp_servers.insert(
        "fablecraft".to_string(),
        serde_json::json!({
            "command": binary_path.display().to_string(),
            "args": [],
            "env": {},
        }),
    );

    serde_json::to_string_pretty(&parsed).map_err(|error| {
        AppError::storage(
            "claude_config_serialize_failed",
            "Fablecraft could not serialize the Claude Desktop config.",
            Some(error.to_string()),
        )
    })
}

fn update_codex_config_contents(contents: Option<&str>, binary_path: &Path) -> AppResult<String> {
    let section = format!(
        "[mcp_servers.fablecraft]\ncommand = \"{}\"\nargs = []\n",
        escape_toml_string(&binary_path.display().to_string())
    );

    Ok(match contents {
        Some(contents) if !contents.trim().is_empty() => {
            replace_or_append_toml_section(contents, "[mcp_servers.fablecraft]", &section)
        }
        _ => section,
    })
}

fn parse_claude_config(contents: &str) -> AppResult<JsonValue> {
    serde_json::from_str(contents).map_err(|error| {
        AppError::invalid_input(
            "claude_config_parse_failed",
            format!("Claude Desktop config could not be parsed: {error}"),
        )
    })
}

fn extract_toml_section(contents: &str, header: &str) -> Option<String> {
    let mut lines = contents.lines().peekable();
    let mut collected: Vec<String> = Vec::new();
    let mut in_section = false;

    while let Some(line) = lines.next() {
        let trimmed = line.trim();

        if !in_section {
            if trimmed == header {
                in_section = true;
                collected.push(line.to_string());
            }

            continue;
        }

        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            break;
        }

        collected.push(line.to_string());
    }

    if collected.is_empty() {
        None
    } else {
        Some(collected.join("\n"))
    }
}

fn replace_or_append_toml_section(contents: &str, header: &str, replacement: &str) -> String {
    let mut lines = contents.lines().peekable();
    let mut output: Vec<String> = Vec::new();
    let mut replaced = false;

    while let Some(line) = lines.next() {
        let trimmed = line.trim();

        if !replaced && trimmed == header {
            replaced = true;
            output.push(replacement.trim_end().to_string());

            while let Some(next_line) = lines.peek() {
                let next_trimmed = next_line.trim();

                if next_trimmed.starts_with('[') && next_trimmed.ends_with(']') {
                    break;
                }

                lines.next();
            }

            continue;
        }

        output.push(line.to_string());
    }

    if !replaced {
        if !output.is_empty() && !output.last().is_some_and(|line| line.trim().is_empty()) {
            output.push(String::new());
        }

        output.push(replacement.trim_end().to_string());
    }

    let mut normalized = output.join("\n");

    if !normalized.ends_with('\n') {
        normalized.push('\n');
    }

    normalized
}

fn escape_toml_string(value: &str) -> String {
    value.replace('\\', "\\\\").replace('"', "\\\"")
}

#[cfg(test)]
mod tests {
    use super::{
        binary_candidates_from_directory, claude_entry_present, codex_entry_present,
        update_claude_config_contents, update_codex_config_contents,
    };
    use std::path::Path;

    #[test]
    fn adds_fablecraft_to_claude_config_without_removing_preferences() {
        let contents = r#"{
  "preferences": {
    "sidebarMode": "chat"
  }
}"#;

        let updated = update_claude_config_contents(
            Some(contents),
            Path::new("/Applications/Fablecraft.app/Contents/MacOS/fablecraft-mcp"),
        )
        .expect("config should serialize");

        assert!(updated.contains("\"preferences\""));
        assert!(updated.contains("\"mcpServers\""));
        assert!(updated.contains("\"fablecraft\""));
        assert!(
            claude_entry_present(Some(&updated)).expect("status should parse"),
            "Claude config should report Fablecraft as enabled"
        );
    }

    #[test]
    fn adds_fablecraft_to_codex_config_without_removing_existing_servers() {
        let contents = r#"
[mcp_servers.linear]
url = "https://mcp.linear.app/mcp"
"#;

        let updated = update_codex_config_contents(
            Some(contents),
            Path::new("/Applications/Fablecraft.app/Contents/MacOS/fablecraft-mcp"),
        )
        .expect("config should serialize");

        assert!(updated.contains("[mcp_servers.linear]"));
        assert!(updated.contains("[mcp_servers.fablecraft]"));
        assert!(updated.contains("command = \"/Applications/Fablecraft.app/Contents/MacOS/fablecraft-mcp\""));
        assert!(
            codex_entry_present(Some(&updated)).expect("status should parse"),
            "Codex config should report Fablecraft as enabled"
        );
    }

    #[test]
    fn includes_release_binary_when_searching_from_repo_root() {
        let candidates = binary_candidates_from_directory(Path::new("/Users/callum/Developer/fablecraft"), "fablecraft-mcp");

        assert!(candidates.contains(
            &Path::new("/Users/callum/Developer/fablecraft/src-tauri/target/release/fablecraft-mcp")
                .to_path_buf()
        ));
    }

    #[test]
    fn includes_release_binary_when_searching_from_src_tauri_directory() {
        let candidates = binary_candidates_from_directory(
            Path::new("/Users/callum/Developer/fablecraft/src-tauri"),
            "fablecraft-mcp",
        );

        assert!(candidates.contains(
            &Path::new("/Users/callum/Developer/fablecraft/src-tauri/target/release/fablecraft-mcp")
                .to_path_buf()
        ));
    }
}
