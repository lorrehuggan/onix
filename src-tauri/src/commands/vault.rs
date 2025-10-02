use crate::errors::AppError;
use crate::models::vault::{CreateVaultRequest, RecentVault, Vault, VaultInfo};
use crate::services::vault_service::VaultService;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn create_vault(
    vault_service: State<'_, VaultService>,
    request: CreateVaultRequest,
) -> Result<Vault, AppError> {
    vault_service.create_vault(request).await
}

#[tauri::command]
pub async fn open_vault(
    vault_service: State<'_, VaultService>,
    vault_path: String,
) -> Result<Vault, AppError> {
    vault_service.open_vault(vault_path).await
}

#[tauri::command]
pub fn get_current_vault(
    vault_service: State<'_, VaultService>,
) -> Result<Option<Vault>, AppError> {
    vault_service.get_current_vault()
}

#[tauri::command]
pub fn get_recent_vaults(
    vault_service: State<'_, VaultService>,
) -> Result<Vec<RecentVault>, AppError> {
    vault_service.get_recent_vaults()
}

#[tauri::command]
pub async fn get_vaults_info(
    vault_service: State<'_, VaultService>,
) -> Result<Vec<VaultInfo>, AppError> {
    vault_service.get_vaults_info().await
}

#[tauri::command]
pub fn close_vault(vault_service: State<'_, VaultService>) -> Result<(), AppError> {
    vault_service.close_vault()
}

#[tauri::command]
pub async fn is_vault(
    vault_service: State<'_, VaultService>,
    directory_path: String,
) -> Result<bool, AppError> {
    vault_service.is_vault(directory_path).await
}

#[tauri::command]
pub async fn select_folder(app_handle: AppHandle) -> Result<Option<String>, AppError> {
    // Use the dialog plugin to open a folder picker
    let folder_path = app_handle
        .dialog()
        .file()
        .set_title("Select Vault Folder")
        .blocking_pick_folder();

    match folder_path {
        Some(path) => {
            // Convert the path to a string
            if let Some(path_str) = path.as_path() {
                Ok(Some(path_str.to_string_lossy().to_string()))
            } else {
                Ok(None)
            }
        }
        None => Ok(None), // User cancelled the dialog
    }
}

#[tauri::command]
pub async fn test_dialog_functionality(app_handle: AppHandle) -> Result<String, AppError> {
    // Test multiple dialog types

    // 1. Show a simple message dialog
    app_handle
        .dialog()
        .message("Dialog functionality is working!")
        .title("Test Dialog")
        .kind(tauri_plugin_dialog::MessageDialogKind::Info)
        .blocking_show();

    // 2. Show a confirmation dialog
    let confirmed = app_handle
        .dialog()
        .message("Do you want to test folder selection?")
        .title("Confirmation")
        .kind(tauri_plugin_dialog::MessageDialogKind::Info)
        .buttons(tauri_plugin_dialog::MessageDialogButtons::YesNo)
        .blocking_show();

    if confirmed {
        // 3. Test folder picker
        if let Some(folder_path) = select_folder(app_handle).await? {
            Ok(format!(
                "✅ All dialogs working! Selected folder: {}",
                folder_path
            ))
        } else {
            Ok("✅ Dialogs working! (No folder selected)".to_string())
        }
    } else {
        Ok("✅ Basic dialogs working! (Folder test skipped)".to_string())
    }
}
