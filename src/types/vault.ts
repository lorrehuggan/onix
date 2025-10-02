// Types for vault operations that match the Rust backend models

export interface Vault {
  id: string;
  name: string;
  path: string;
  created_at: string;
  last_opened: string;
  note_count: number;
  total_size: number;
  config: VaultConfig;
}

export interface VaultConfig {
  name: string;
  description?: string;
  settings: VaultSettings;
  metadata: Record<string, unknown>;
}

export interface VaultSettings {
  auto_save: boolean;
  default_note_location: string;
  file_extensions: string[];
  exclude_patterns: string[];
}

export interface VaultInfo {
  id: string;
  name: string;
  path: string;
  note_count: number;
  total_size: number;
  last_opened: string;
  is_current: boolean;
}

export interface CreateVaultRequest {
  path: string;
  name: string;
  description?: string;
}

export interface RecentVault {
  id: string;
  name: string;
  path: string;
  last_opened: string;
}

// Utility types for vault operations
export interface VaultStats {
  note_count: number;
  total_size: number;
  last_modified?: string;
  file_types: Record<string, number>;
}

export interface VaultValidation {
  is_valid: boolean;
  is_empty: boolean;
  has_notes: boolean;
  has_config: boolean;
  issues: string[];
}

// Result types for vault operations
export type VaultOperationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        type: string;
        message: string;
      };
    };
