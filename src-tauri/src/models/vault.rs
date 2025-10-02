use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vault {
    pub id: String,
    pub name: String,
    pub path: String,
    pub created_at: String,
    pub last_opened: String,
    pub note_count: u32,
    pub total_size: u64,
    pub config: VaultConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultConfig {
    pub name: String,
    pub description: Option<String>,
    pub settings: VaultSettings,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultSettings {
    pub auto_save: bool,
    pub default_note_location: String,
    pub file_extensions: Vec<String>,
    pub exclude_patterns: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultInfo {
    pub id: String,
    pub name: String,
    pub path: String,
    pub note_count: u32,
    pub total_size: u64,
    pub last_opened: String,
    pub is_current: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateVaultRequest {
    pub path: String,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentVault {
    pub id: String,
    pub name: String,
    pub path: String,
    pub last_opened: String,
}

impl Default for VaultSettings {
    fn default() -> Self {
        Self {
            auto_save: true,
            default_note_location: "".to_string(),
            file_extensions: vec!["md".to_string(), "markdown".to_string()],
            exclude_patterns: vec![
                ".git".to_string(),
                ".onix".to_string(),
                "node_modules".to_string(),
                ".DS_Store".to_string(),
            ],
        }
    }
}

impl Default for VaultConfig {
    fn default() -> Self {
        Self {
            name: "My Vault".to_string(),
            description: None,
            settings: VaultSettings::default(),
            metadata: HashMap::new(),
        }
    }
}

impl Vault {
    pub fn new(id: String, name: String, path: String) -> Self {
        let now = chrono::Utc::now().timestamp().to_string();

        Self {
            id,
            name: name.clone(),
            path,
            created_at: now.clone(),
            last_opened: now,
            note_count: 0,
            total_size: 0,
            config: VaultConfig {
                name,
                ..Default::default()
            },
        }
    }

    pub fn config_path(&self) -> PathBuf {
        PathBuf::from(&self.path).join(".onix").join("vault.json")
    }

    pub fn onix_dir(&self) -> PathBuf {
        PathBuf::from(&self.path).join(".onix")
    }
}

impl From<Vault> for VaultInfo {
    fn from(vault: Vault) -> Self {
        Self {
            id: vault.id,
            name: vault.name,
            path: vault.path,
            note_count: vault.note_count,
            total_size: vault.total_size,
            last_opened: vault.last_opened,
            is_current: false, // Set by the service
        }
    }
}

impl From<Vault> for RecentVault {
    fn from(vault: Vault) -> Self {
        Self {
            id: vault.id,
            name: vault.name,
            path: vault.path,
            last_opened: vault.last_opened,
        }
    }
}
