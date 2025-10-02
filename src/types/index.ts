// Export all type definitions
export * from "./files";
export * from "./vault";

// Re-export common types that might be used across the app
export type { Note, NoteInfo, CreateNoteRequest, AppError } from "./files";
export type { Vault, VaultInfo, CreateVaultRequest, RecentVault } from "./vault";
