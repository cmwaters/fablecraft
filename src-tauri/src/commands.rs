use std::path::PathBuf;
use std::{fs, path::Path};

use tauri::State;

use crate::app_state::{AppState, OpenDocumentContext};
use crate::error::{AppError, AppErrorPayload};
use crate::storage::{
    DocumentClock, DocumentRepository, DocumentSnapshot, DocumentSummary,
    EditableDocumentSnapshot, SaveDocumentResult,
};

#[tauri::command]
pub fn create_document(
    path: String,
    state: State<'_, AppState>,
) -> Result<DocumentSummary, AppErrorPayload> {
    let summary = DocumentRepository::create(PathBuf::from(&path))?;
    update_app_state(&state, &summary);
    Ok(summary)
}

#[tauri::command]
pub fn open_document(
    path: String,
    state: State<'_, AppState>,
) -> Result<DocumentSummary, AppErrorPayload> {
    let summary = DocumentRepository::open(PathBuf::from(&path))?;
    update_app_state(&state, &summary);
    Ok(summary)
}

#[tauri::command]
pub fn load_current_document(
    state: State<'_, AppState>,
) -> Result<DocumentSnapshot, AppErrorPayload> {
    let path = current_document_path(&state)?;
    DocumentRepository::load(path)
}

#[tauri::command]
pub fn load_current_document_clock(
    state: State<'_, AppState>,
) -> Result<DocumentClock, AppErrorPayload> {
    let path = current_document_path(&state)?;
    DocumentRepository::clock(path)
}

#[tauri::command]
pub fn save_current_document(
    snapshot: EditableDocumentSnapshot,
    state: State<'_, AppState>,
) -> Result<SaveDocumentResult, AppErrorPayload> {
    let path = current_document_path(&state)?;
    DocumentRepository::save(path, snapshot)
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, AppErrorPayload> {
    let file_path = PathBuf::from(&path);

    if !file_path.exists() {
        return Err(AppError::not_found(
            "file_missing",
            format!("No file exists at {}.", file_path.display()),
        )
        .into());
    }

    fs::read_to_string(file_path)
        .map_err(AppError::from)
        .map_err(AppErrorPayload::from)
}

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> Result<(), AppErrorPayload> {
    let file_path = PathBuf::from(&path);

    if let Some(parent) = Path::new(&file_path).parent() {
        fs::create_dir_all(parent)
            .map_err(AppError::from)
            .map_err(AppErrorPayload::from)?;
    }

    fs::write(file_path, contents)
        .map_err(AppError::from)
        .map_err(AppErrorPayload::from)?;
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
                "Open or create a document before loading or saving it.",
            )
            .into()
        })
}

fn update_app_state(state: &State<'_, AppState>, summary: &DocumentSummary) {
    let mut guard = state
        .current_document
        .lock()
        .expect("app state mutex should not be poisoned");

    *guard = Some(OpenDocumentContext {
        document_id: summary.document_id.clone(),
        path: PathBuf::from(summary.path.clone()),
    });
}
