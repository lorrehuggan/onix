mod commands;
mod errors;
mod models;
mod services;

use commands::{files, vault};
use services::{file_service::FileService, vault_service::VaultService};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(FileService::new())
        .manage(VaultService::new().expect("Failed to initialize VaultService"))
        .invoke_handler(tauri::generate_handler![
            files::read_note,
            files::write_note,
            files::create_note,
            files::delete_note,
            files::list_notes,
            files::file_exists,
            files::get_file_info,
            vault::create_vault,
            vault::open_vault,
            vault::get_current_vault,
            vault::get_recent_vaults,
            vault::get_vaults_info,
            vault::close_vault,
            vault::is_vault,
            vault::select_folder,
            vault::test_dialog_functionality
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
