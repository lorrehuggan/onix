import { invoke } from "@tauri-apps/api/core";

import type { AppError, CreateVaultRequest, RecentVault, Vault, VaultInfo } from "../types";

/**
 * Vault operations API wrapper for Tauri commands
 * Provides type-safe interfaces to the Rust backend vault operations
 */

export class VaultApi {
  /**
   * Create a new vault in the specified directory
   */
  static async createVault(request: CreateVaultRequest): Promise<Vault> {
    try {
      return await invoke<Vault>("create_vault", { request });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Open an existing vault from a directory
   */
  static async openVault(vaultPath: string): Promise<Vault> {
    try {
      return await invoke<Vault>("open_vault", { vaultPath });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get the currently opened vault
   */
  static async getCurrentVault(): Promise<Vault | null> {
    try {
      return await invoke<Vault | null>("get_current_vault");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get list of recent vaults
   */
  static async getRecentVaults(): Promise<RecentVault[]> {
    try {
      return await invoke<RecentVault[]>("get_recent_vaults");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get vault information for all recent vaults
   */
  static async getVaultsInfo(): Promise<VaultInfo[]> {
    try {
      return await invoke<VaultInfo[]>("get_vaults_info");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Close the currently opened vault
   */
  static async closeVault(): Promise<void> {
    try {
      await invoke<void>("close_vault");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if a directory is a valid vault
   */
  static async isVault(directoryPath: string): Promise<boolean> {
    try {
      return await invoke<boolean>("is_vault", { directoryPath });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Open folder selection dialog
   */
  static async selectFolder(): Promise<string | null> {
    try {
      return await invoke<string | null>("select_folder");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Test dialog functionality (for development/testing)
   */
  static async testDialogFunctionality(): Promise<string> {
    try {
      return await invoke<string>("test_dialog_functionality");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle and normalize errors from Tauri commands
   */
  private static handleError(error: unknown): AppError {
    if (typeof error === "string") {
      return {
        type: "Unknown",
        message: error,
      };
    }

    if (typeof error === "object" && error !== null) {
      const errorObj = error as Record<string, unknown>;
      if (errorObj.type && errorObj.message) {
        return errorObj as unknown as AppError;
      }

      if (errorObj.message) {
        return {
          type: "Unknown",
          message: String(errorObj.message),
        };
      }
    }

    return {
      type: "Unknown",
      message: "An unknown error occurred",
    };
  }
}

/**
 * Utility functions for vault operations
 */

export const vaultUtils = {
  /**
   * Extract vault name from path
   */
  getVaultNameFromPath(path: string): string {
    return path.split(/[\\/]/).pop() || "Unnamed Vault";
  },

  /**
   * Format vault path for display
   */
  formatVaultPath(path: string): string {
    // Replace home directory with ~
    const homeDir = "~";
    if (path.startsWith("/home/")) {
      const parts = path.split("/");
      if (parts.length > 2) {
        return `${homeDir}/${parts.slice(3).join("/")}`;
      }
    }
    return path;
  },

  /**
   * Format file size in human readable format
   */
  formatSize(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  },

  /**
   * Format timestamp to readable date
   */
  formatTimestamp(timestamp?: string): string {
    if (!timestamp) return "Unknown";

    const date = new Date(parseInt(timestamp) * 1000);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  },

  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  getRelativeTime(timestamp?: string): string {
    if (!timestamp) return "Unknown";

    const date = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  },

  /**
   * Validate vault name
   */
  isValidVaultName(name: string): boolean {
    if (!name || name.trim().length === 0) return false;
    if (name.length > 100) return false;
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(name);
  },

  /**
   * Sanitize vault name for safe usage
   */
  sanitizeVaultName(name: string): string {
    return name
      .trim()
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 100);
  },

  /**
   * Generate default vault name from path
   */
  generateVaultName(path: string): string {
    const baseName = this.getVaultNameFromPath(path);
    return this.sanitizeVaultName(baseName) || "My Vault";
  },

  /**
   * Check if path looks like a valid directory
   */
  isValidPath(path: string): boolean {
    if (!path || path.trim().length === 0) return false;
    // Basic path validation - more thorough validation happens on backend
    return path.length > 0 && !path.includes("\0");
  },

  /**
   * Get vault statistics summary
   */
  getVaultSummary(vault: { note_count: number; total_size: number }): string {
    const noteText = vault.note_count === 1 ? "note" : "notes";
    const sizeText = this.formatSize(vault.total_size);
    return `${vault.note_count} ${noteText} • ${sizeText}`;
  },

  /**
   * Sort vaults by last opened (most recent first)
   */
  sortVaultsByLastOpened<T extends { last_opened: string }>(vaults: T[]): T[] {
    return [...vaults].sort((a, b) => {
      const timeA = parseInt(a.last_opened) || 0;
      const timeB = parseInt(b.last_opened) || 0;
      return timeB - timeA;
    });
  },

  /**
   * Filter vaults by search query
   */
  filterVaults<T extends { name: string; path: string }>(vaults: T[], query: string): T[] {
    if (!query.trim()) return vaults;

    const lowerQuery = query.toLowerCase();
    return vaults.filter(
      vault =>
        vault.name.toLowerCase().includes(lowerQuery) ||
        vault.path.toLowerCase().includes(lowerQuery),
    );
  },
};
