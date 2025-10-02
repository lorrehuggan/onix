use crate::errors::AppError;
use crate::models::note::{CreateNoteRequest, Note, NoteInfo};
use crate::services::file_service::FileService;
use tauri::State;

#[tauri::command]
pub async fn read_note(
    file_service: State<'_, FileService>,
    file_path: String,
) -> Result<Note, AppError> {
    file_service.read_note(file_path).await
}

#[tauri::command]
pub async fn write_note(
    file_service: State<'_, FileService>,
    file_path: String,
    content: String,
) -> Result<(), AppError> {
    file_service.write_note(file_path, content).await
}

#[tauri::command]
pub async fn create_note(
    file_service: State<'_, FileService>,
    request: CreateNoteRequest,
) -> Result<Note, AppError> {
    file_service.create_note(request).await
}

#[tauri::command]
pub async fn delete_note(
    file_service: State<'_, FileService>,
    file_path: String,
) -> Result<(), AppError> {
    file_service.delete_note(file_path).await
}

#[tauri::command]
pub fn list_notes(
    file_service: State<'_, FileService>,
    directory_path: String,
) -> Result<Vec<NoteInfo>, AppError> {
    file_service.list_notes(directory_path)
}

#[tauri::command]
pub fn file_exists(file_service: State<'_, FileService>, file_path: String) -> bool {
    file_service.file_exists(file_path)
}

#[tauri::command]
pub async fn get_file_info(
    file_service: State<'_, FileService>,
    file_path: String,
) -> Result<NoteInfo, AppError> {
    file_service.get_file_info(file_path).await
}
