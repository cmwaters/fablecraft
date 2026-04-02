use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{message}")]
    Conflict {
        code: &'static str,
        message: String,
        details: Option<String>,
    },
    #[error("{message}")]
    InvalidInput {
        code: &'static str,
        message: String,
        details: Option<String>,
    },
    #[error("{message}")]
    NotFound {
        code: &'static str,
        message: String,
        details: Option<String>,
    },
    #[error("{message}")]
    Storage {
        code: &'static str,
        message: String,
        details: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppErrorPayload {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

impl AppError {
    pub fn conflict(code: &'static str, message: impl Into<String>) -> Self {
        Self::Conflict {
            code,
            message: message.into(),
            details: None,
        }
    }

    pub fn invalid_input(code: &'static str, message: impl Into<String>) -> Self {
        Self::InvalidInput {
            code,
            message: message.into(),
            details: None,
        }
    }

    pub fn not_found(code: &'static str, message: impl Into<String>) -> Self {
        Self::NotFound {
            code,
            message: message.into(),
            details: None,
        }
    }

    pub fn storage(code: &'static str, message: impl Into<String>, details: Option<String>) -> Self {
        Self::Storage {
            code,
            message: message.into(),
            details,
        }
    }

    pub fn to_payload(&self) -> AppErrorPayload {
        match self {
            Self::Conflict {
                code,
                message,
                details,
            }
            | Self::InvalidInput {
                code,
                message,
                details,
            }
            | Self::NotFound {
                code,
                message,
                details,
            }
            | Self::Storage {
                code,
                message,
                details,
            } => AppErrorPayload {
                code: code.to_string(),
                message: message.clone(),
                details: details.clone(),
            },
        }
    }
}

impl From<AppError> for AppErrorPayload {
    fn from(value: AppError) -> Self {
        value.to_payload()
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(value: rusqlite::Error) -> Self {
        Self::storage(
            "sqlite_error",
            "SQLite rejected the operation.",
            Some(value.to_string()),
        )
    }
}

impl From<std::io::Error> for AppError {
    fn from(value: std::io::Error) -> Self {
        Self::storage(
            "io_error",
            "The filesystem operation failed.",
            Some(value.to_string()),
        )
    }
}

pub type AppResult<T> = Result<T, AppError>;

