use crate::errors::AppError;
use crate::models::vault::{CreateVaultRequest, RecentVault, Vault, VaultInfo};
use serde_json;

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tokio::fs as async_fs;
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Debug)]
pub struct VaultService {
    current_vault: Arc<Mutex<Option<Vault>>>,
    recent_vaults: Arc<Mutex<Vec<RecentVault>>>,
    app_data_dir: PathBuf,
}

impl VaultService {
    pub fn new() -> Result<Self, AppError> {
        let app_data_dir = Self::get_app_data_dir()?;

        let service = Self {
            current_vault: Arc::new(Mutex::new(None)),
            recent_vaults: Arc::new(Mutex::new(Vec::new())),
            app_data_dir,
        };

        // Load recent vaults on initialization
        service.load_recent_vaults()?;

        Ok(service)
    }

    /// Create a new vault in the specified directory
    pub async fn create_vault(&self, request: CreateVaultRequest) -> Result<Vault, AppError> {
        let path = Path::new(&request.path);

        if !path.exists() {
            return Err(AppError::FileNotFound(request.path));
        }

        if !path.is_dir() {
            return Err(AppError::InvalidPath(format!(
                "{} is not a directory",
                request.path
            )));
        }

        // Generate unique ID for vault
        let vault_id = Uuid::new_v4().to_string();

        // Create vault instance
        let mut vault = Vault::new(vault_id, request.name, request.path.clone());

        if let Some(description) = request.description {
            vault.config.description = Some(description);
        }

        // Create .onix directory
        let onix_dir = vault.onix_dir();
        async_fs::create_dir_all(&onix_dir).await?;

        // Save vault configuration
        let config_path = vault.config_path();
        let config_json = serde_json::to_string_pretty(&vault)?;
        async_fs::write(config_path, config_json).await?;

        // Calculate vault statistics
        vault = self.calculate_vault_stats(vault).await?;

        // Set as current vault
        self.set_current_vault(vault.clone())?;

        // Add to recent vaults
        self.add_to_recent_vaults(vault.clone().into())?;

        Ok(vault)
    }

    /// Open an existing vault from a directory
    pub async fn open_vault(&self, vault_path: String) -> Result<Vault, AppError> {
        let path = Path::new(&vault_path);

        if !path.exists() {
            return Err(AppError::FileNotFound(vault_path));
        }

        if !path.is_dir() {
            return Err(AppError::InvalidPath(format!(
                "{} is not a directory",
                vault_path
            )));
        }

        let config_path = path.join(".onix").join("vault.json");

        let mut vault = if config_path.exists() {
            // Load existing vault configuration
            let config_content = async_fs::read_to_string(config_path).await?;
            let mut vault: Vault = serde_json::from_str(&config_content)
                .map_err(|e| AppError::InvalidMarkdown(format!("Invalid vault config: {}", e)))?;

            // Update last opened timestamp
            vault.last_opened = chrono::Utc::now().timestamp().to_string();
            vault
        } else {
            // Create new vault configuration for existing directory
            let vault_name = path
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("Unnamed Vault")
                .to_string();

            let vault_id = Uuid::new_v4().to_string();
            let vault = Vault::new(vault_id, vault_name, vault_path);

            // Create .onix directory and save config
            let onix_dir = vault.onix_dir();
            async_fs::create_dir_all(&onix_dir).await?;

            let config_path = vault.config_path();
            let config_json = serde_json::to_string_pretty(&vault)?;
            async_fs::write(config_path, config_json).await?;

            vault
        };

        // Calculate current statistics
        vault = self.calculate_vault_stats(vault).await?;

        // Update vault config with new stats and timestamp
        self.save_vault_config(&vault).await?;

        // Set as current vault
        self.set_current_vault(vault.clone())?;

        // Add to recent vaults
        self.add_to_recent_vaults(vault.clone().into())?;

        Ok(vault)
    }

    /// Get the currently opened vault
    pub fn get_current_vault(&self) -> Result<Option<Vault>, AppError> {
        let current = self
            .current_vault
            .lock()
            .map_err(|_| AppError::Unknown("Failed to acquire vault lock".to_string()))?;
        Ok(current.clone())
    }

    /// Get list of recent vaults
    pub fn get_recent_vaults(&self) -> Result<Vec<RecentVault>, AppError> {
        let recent = self
            .recent_vaults
            .lock()
            .map_err(|_| AppError::Unknown("Failed to acquire recent vaults lock".to_string()))?;
        Ok(recent.clone())
    }

    /// Get vault information for multiple vaults
    pub async fn get_vaults_info(&self) -> Result<Vec<VaultInfo>, AppError> {
        let recent_vaults = self.get_recent_vaults()?;
        let current_vault_id = self.get_current_vault()?.map(|v| v.id);

        let mut vault_infos = Vec::new();

        for recent_vault in recent_vaults {
            let path = Path::new(&recent_vault.path);

            // Skip if directory no longer exists
            if !path.exists() {
                continue;
            }

            let config_path = path.join(".onix").join("vault.json");

            if config_path.exists() {
                if let Ok(config_content) = async_fs::read_to_string(config_path).await {
                    if let Ok(vault) = serde_json::from_str::<Vault>(&config_content) {
                        let mut vault_info: VaultInfo = vault.into();
                        vault_info.is_current = current_vault_id.as_ref() == Some(&vault_info.id);
                        vault_infos.push(vault_info);
                    }
                }
            }
        }

        Ok(vault_infos)
    }

    /// Close current vault
    pub fn close_vault(&self) -> Result<(), AppError> {
        let mut current = self
            .current_vault
            .lock()
            .map_err(|_| AppError::Unknown("Failed to acquire vault lock".to_string()))?;
        *current = None;
        Ok(())
    }

    /// Check if a directory is a valid vault
    pub async fn is_vault(&self, directory_path: String) -> Result<bool, AppError> {
        let path = Path::new(&directory_path);

        if !path.exists() || !path.is_dir() {
            return Ok(false);
        }

        let config_path = path.join(".onix").join("vault.json");
        Ok(config_path.exists())
    }

    /// Calculate vault statistics (note count, total size)
    async fn calculate_vault_stats(&self, mut vault: Vault) -> Result<Vault, AppError> {
        let path = Path::new(&vault.path);
        let mut note_count = 0u32;
        let mut total_size = 0u64;

        for entry in WalkDir::new(path)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let entry_path = entry.path();

            // Skip hidden files and .onix directory
            if self.should_exclude_path(entry_path, &vault.config.settings.exclude_patterns) {
                continue;
            }

            if entry_path.is_file() {
                if let Some(extension) = entry_path.extension().and_then(|ext| ext.to_str()) {
                    if vault
                        .config
                        .settings
                        .file_extensions
                        .contains(&extension.to_lowercase())
                    {
                        note_count += 1;
                        if let Ok(metadata) = entry.metadata() {
                            total_size += metadata.len();
                        }
                    }
                }
            }
        }

        vault.note_count = note_count;
        vault.total_size = total_size;

        Ok(vault)
    }

    /// Save vault configuration to disk
    async fn save_vault_config(&self, vault: &Vault) -> Result<(), AppError> {
        let config_path = vault.config_path();
        let config_json = serde_json::to_string_pretty(vault)?;
        async_fs::write(config_path, config_json).await?;
        Ok(())
    }

    /// Set current vault
    fn set_current_vault(&self, vault: Vault) -> Result<(), AppError> {
        let mut current = self
            .current_vault
            .lock()
            .map_err(|_| AppError::Unknown("Failed to acquire vault lock".to_string()))?;
        *current = Some(vault);
        Ok(())
    }

    /// Add vault to recent vaults list
    fn add_to_recent_vaults(&self, recent_vault: RecentVault) -> Result<(), AppError> {
        let mut recent = self
            .recent_vaults
            .lock()
            .map_err(|_| AppError::Unknown("Failed to acquire recent vaults lock".to_string()))?;

        // Remove existing entry if it exists
        recent.retain(|v| v.id != recent_vault.id);

        // Add to front of list
        recent.insert(0, recent_vault);

        // Keep only last 10 recent vaults
        recent.truncate(10);

        // Save to disk
        self.save_recent_vaults(&recent)?;

        Ok(())
    }

    /// Load recent vaults from disk
    fn load_recent_vaults(&self) -> Result<(), AppError> {
        let recent_vaults_path = self.app_data_dir.join("recent_vaults.json");

        if !recent_vaults_path.exists() {
            return Ok(());
        }

        let content = fs::read_to_string(recent_vaults_path)?;
        let recent_vaults: Vec<RecentVault> = serde_json::from_str(&content)
            .map_err(|e| AppError::InvalidMarkdown(format!("Invalid recent vaults file: {}", e)))?;

        let mut recent = self
            .recent_vaults
            .lock()
            .map_err(|_| AppError::Unknown("Failed to acquire recent vaults lock".to_string()))?;
        *recent = recent_vaults;

        Ok(())
    }

    /// Save recent vaults to disk
    fn save_recent_vaults(&self, recent_vaults: &[RecentVault]) -> Result<(), AppError> {
        // Ensure app data directory exists
        fs::create_dir_all(&self.app_data_dir)?;

        let recent_vaults_path = self.app_data_dir.join("recent_vaults.json");
        let content = serde_json::to_string_pretty(recent_vaults)?;
        fs::write(recent_vaults_path, content)?;

        Ok(())
    }

    /// Get application data directory
    fn get_app_data_dir() -> Result<PathBuf, AppError> {
        let app_data = dirs::data_dir().ok_or_else(|| {
            AppError::Unknown("Could not determine app data directory".to_string())
        })?;

        Ok(app_data.join("onix"))
    }

    /// Check if path should be excluded based on patterns
    fn should_exclude_path(&self, path: &Path, exclude_patterns: &[String]) -> bool {
        let path_str = path.to_string_lossy();

        for pattern in exclude_patterns {
            if path_str.contains(pattern) {
                return true;
            }
        }

        // Always exclude hidden files/directories
        if let Some(file_name) = path.file_name().and_then(|name| name.to_str()) {
            if file_name.starts_with('.') {
                return true;
            }
        }

        false
    }
}

impl Default for VaultService {
    fn default() -> Self {
        Self::new().expect("Failed to initialize VaultService")
    }
}
