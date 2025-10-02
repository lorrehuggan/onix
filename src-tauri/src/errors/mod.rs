use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Serialize, Deserialize)]
pub enum AppError {
    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("Invalid file path: {0}")]
    InvalidPath(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("File already exists: {0}")]
    FileAlreadyExists(String),

    #[error("Invalid markdown format: {0}")]
    InvalidMarkdown(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::NotFound => AppError::FileNotFound(err.to_string()),
            std::io::ErrorKind::PermissionDenied => AppError::PermissionDenied(err.to_string()),
            std::io::ErrorKind::AlreadyExists => AppError::FileAlreadyExists(err.to_string()),
            _ => AppError::Io(err.to_string()),
        }
    }
}

// Implement for serde_json errors
impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::InvalidMarkdown(format!("JSON serialization error: {}", err))
    }
}

// Implement for anyhow errors
impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Unknown(err.to_string())
    }
}
