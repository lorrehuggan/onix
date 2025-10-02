// Types for file operations that match the Rust backend models

export interface Note {
  path: string;
  title: string;
  content: string;
  size: number;
  created_at?: string;
  modified_at?: string;
}

export interface NoteInfo {
  path: string;
  title: string;
  size: number;
  modified_at?: string;
  is_directory: boolean;
}

export interface CreateNoteRequest {
  path: string;
  title: string;
  content?: string;
}

// Error types that match Rust AppError enum
export type AppErrorType =
  | "FileNotFound"
  | "Io"
  | "InvalidPath"
  | "PermissionDenied"
  | "FileAlreadyExists"
  | "InvalidMarkdown"
  | "Unknown";

export interface AppError {
  type: AppErrorType;
  message: string;
}

// File operation result types
export type FileOperationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: AppError;
    };

// Utility types for common operations
export interface FileStats {
  exists: boolean;
  size?: number;
  modified_at?: string;
  is_directory?: boolean;
}

export interface DirectoryListing {
  files: NoteInfo[];
  total_count: number;
  markdown_count: number;
}
