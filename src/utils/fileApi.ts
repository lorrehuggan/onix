import { invoke } from "@tauri-apps/api/core";

import type { AppError, CreateNoteRequest, Note, NoteInfo } from "../types/files";

/**
 * File operations API wrapper for Tauri commands
 * Provides type-safe interfaces to the Rust backend file operations
 */

export class FileApi {
  /**
   * Read a note file from disk
   */
  static async readNote(filePath: string): Promise<Note> {
    try {
      return await invoke<Note>("read_note", { filePath });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Write content to a note file
   */
  static async writeNote(filePath: string, content: string): Promise<void> {
    try {
      await invoke<void>("write_note", { filePath, content });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new note file
   */
  static async createNote(request: CreateNoteRequest): Promise<Note> {
    try {
      return await invoke<Note>("create_note", { request });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a note file
   */
  static async deleteNote(filePath: string): Promise<void> {
    try {
      await invoke<void>("delete_note", { filePath });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List all notes in a directory
   */
  static async listNotes(directoryPath: string): Promise<NoteInfo[]> {
    try {
      return await invoke<NoteInfo[]>("list_notes", { directoryPath });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if a file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      return await invoke<boolean>("file_exists", { filePath });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get file information/metadata
   */
  static async getFileInfo(filePath: string): Promise<NoteInfo> {
    try {
      return await invoke<NoteInfo>("get_file_info", { filePath });
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
 * Utility functions for common file operations
 */

export const fileUtils = {
  /**
   * Extract filename from path
   */
  getFileName(path: string): string {
    return path.split(/[\\/]/).pop() || "";
  },

  /**
   * Extract directory from path
   */
  getDirectory(path: string): string {
    const parts = path.split(/[\\/]/);
    parts.pop();
    return parts.join("/");
  },

  /**
   * Check if path is a markdown file
   */
  isMarkdownFile(path: string): boolean {
    const extension = path.split(".").pop()?.toLowerCase();
    return extension === "md" || extension === "markdown";
  },

  /**
   * Ensure path has .md extension
   */
  ensureMarkdownExtension(path: string): string {
    if (!this.isMarkdownFile(path)) {
      return `${path}.md`;
    }
    return path;
  },

  /**
   * Generate a safe filename from title
   */
  titleToFileName(title: string): string {
    return title
      .trim() // Remove leading/trailing spaces first
      .replace(/[^a-zA-Z0-9\s-_]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .toLowerCase();
  },

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes: number): string {
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
};
