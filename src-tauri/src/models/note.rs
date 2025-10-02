use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub path: String,
    pub title: String,
    pub content: String,
    pub size: u64,
    pub created_at: Option<String>,
    pub modified_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteInfo {
    pub path: String,
    pub title: String,
    pub size: u64,
    pub modified_at: Option<String>,
    pub is_directory: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNoteRequest {
    pub path: String,
    pub title: String,
    pub content: Option<String>,
}

impl Note {
    #[allow(dead_code)]
    pub fn new(path: String, title: String, content: String) -> Self {
        Self {
            path,
            title,
            content,
            size: 0,
            created_at: None,
            modified_at: None,
        }
    }

    #[allow(dead_code)]
    pub fn file_name(&self) -> Option<String> {
        std::path::Path::new(&self.path)
            .file_name()
            .and_then(|name| name.to_str())
            .map(|s| s.to_string())
    }

    #[allow(dead_code)]
    pub fn extension(&self) -> Option<String> {
        std::path::Path::new(&self.path)
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|s| s.to_string())
    }

    #[allow(dead_code)]
    pub fn is_markdown(&self) -> bool {
        matches!(self.extension().as_deref(), Some("md") | Some("markdown"))
    }
}

impl NoteInfo {
    pub fn from_path(path: String, metadata: std::fs::Metadata) -> Self {
        let title = std::path::Path::new(&path)
            .file_stem()
            .and_then(|stem| stem.to_str())
            .unwrap_or("Untitled")
            .to_string();

        let modified_at = metadata
            .modified()
            .ok()
            .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|duration| duration.as_secs().to_string());

        Self {
            path,
            title,
            size: metadata.len(),
            modified_at,
            is_directory: metadata.is_dir(),
        }
    }
}
