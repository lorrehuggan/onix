use crate::errors::AppError;
use crate::models::note::{CreateNoteRequest, Note, NoteInfo};
use std::fs;
use std::path::Path;
use tokio::fs as async_fs;
use walkdir::WalkDir;

pub struct FileService {
    // Future: Could store vault configuration, cache, etc.
}

impl FileService {
    pub fn new() -> Self {
        Self {}
    }

    /// Read a markdown file and return as Note
    pub async fn read_note(&self, file_path: String) -> Result<Note, AppError> {
        let path = Path::new(&file_path);

        if !path.exists() {
            return Err(AppError::FileNotFound(file_path));
        }

        if !path.is_file() {
            return Err(AppError::InvalidPath(format!(
                "{} is not a file",
                file_path
            )));
        }

        let content = async_fs::read_to_string(path).await?;
        let metadata = fs::metadata(path)?;
        let title = self.extract_title(&content, &file_path);

        let modified_at = metadata
            .modified()
            .ok()
            .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|duration| duration.as_secs().to_string());

        let created_at = metadata
            .created()
            .ok()
            .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|duration| duration.as_secs().to_string());

        Ok(Note {
            path: file_path,
            title,
            content,
            size: metadata.len(),
            created_at,
            modified_at,
        })
    }

    /// Write content to a file
    pub async fn write_note(&self, file_path: String, content: String) -> Result<(), AppError> {
        let path = Path::new(&file_path);

        // Validate file extension
        if !self.is_markdown_file(&file_path) {
            return Err(AppError::InvalidPath(format!(
                "File must have .md extension: {}",
                file_path
            )));
        }

        // Create parent directories if they don't exist
        if let Some(parent) = path.parent() {
            async_fs::create_dir_all(parent).await?;
        }

        async_fs::write(path, content).await?;
        Ok(())
    }

    /// Create a new note file
    pub async fn create_note(&self, request: CreateNoteRequest) -> Result<Note, AppError> {
        let path = Path::new(&request.path);

        if path.exists() {
            return Err(AppError::FileAlreadyExists(request.path));
        }

        // Ensure path has .md extension
        let file_path = if !self.is_markdown_file(&request.path) {
            format!("{}.md", request.path)
        } else {
            request.path
        };

        // Create content with title as first heading
        let content = match request.content {
            Some(content) => content,
            None => format!("# {}\n\n", request.title),
        };

        // Write the file
        self.write_note(file_path.clone(), content.clone()).await?;

        // Return the created note
        let content_len = content.len() as u64;
        Ok(Note {
            path: file_path,
            title: request.title,
            content,
            size: content_len,
            created_at: None,
            modified_at: None,
        })
    }

    /// Delete a note file
    pub async fn delete_note(&self, file_path: String) -> Result<(), AppError> {
        let path = Path::new(&file_path);

        if !path.exists() {
            return Err(AppError::FileNotFound(file_path));
        }

        if !path.is_file() {
            return Err(AppError::InvalidPath(format!(
                "{} is not a file",
                file_path
            )));
        }

        async_fs::remove_file(path).await?;
        Ok(())
    }

    /// List all notes in a directory (recursively)
    pub fn list_notes(&self, directory_path: String) -> Result<Vec<NoteInfo>, AppError> {
        let path = Path::new(&directory_path);

        if !path.exists() {
            return Err(AppError::FileNotFound(directory_path));
        }

        if !path.is_dir() {
            return Err(AppError::InvalidPath(format!(
                "{} is not a directory",
                directory_path
            )));
        }

        let mut notes = Vec::new();

        for entry in WalkDir::new(path)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let entry_path = entry.path();

            // Skip hidden files and directories
            if entry_path
                .file_name()
                .and_then(|name| name.to_str())
                .map(|name| name.starts_with('.'))
                .unwrap_or(false)
            {
                continue;
            }

            // Only include markdown files
            if entry_path.is_file() && self.is_markdown_file_path(entry_path) {
                if let Ok(metadata) = entry.metadata() {
                    let path_str = entry_path.to_string_lossy().to_string();
                    notes.push(NoteInfo::from_path(path_str, metadata));
                }
            }
        }

        // Sort by file name
        notes.sort_by(|a, b| a.title.cmp(&b.title));

        Ok(notes)
    }

    /// Check if file exists
    pub fn file_exists(&self, file_path: String) -> bool {
        Path::new(&file_path).exists()
    }

    /// Get file metadata
    pub async fn get_file_info(&self, file_path: String) -> Result<NoteInfo, AppError> {
        let path = Path::new(&file_path);

        if !path.exists() {
            return Err(AppError::FileNotFound(file_path));
        }

        let metadata = fs::metadata(path)?;
        Ok(NoteInfo::from_path(file_path, metadata))
    }

    /// Extract title from markdown content
    fn extract_title(&self, content: &str, file_path: &str) -> String {
        // Try to extract title from first # heading
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("# ") {
                return trimmed[2..].trim().to_string();
            }
        }

        // Fallback to filename without extension
        Path::new(file_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Untitled")
            .to_string()
    }

    /// Check if file path has markdown extension
    fn is_markdown_file(&self, file_path: &str) -> bool {
        Path::new(file_path)
            .extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| ext.eq_ignore_ascii_case("md") || ext.eq_ignore_ascii_case("markdown"))
            .unwrap_or(false)
    }

    /// Check if Path has markdown extension
    fn is_markdown_file_path(&self, path: &Path) -> bool {
        path.extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| ext.eq_ignore_ascii_case("md") || ext.eq_ignore_ascii_case("markdown"))
            .unwrap_or(false)
    }
}

impl Default for FileService {
    fn default() -> Self {
        Self::new()
    }
}
