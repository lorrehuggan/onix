# Basic File Operations

This document describes the basic file operations implemented in Onix for handling markdown notes.

## Overview

The file operations system provides a foundation for reading, writing, creating, and managing markdown files in your knowledge base. All operations are local-first and privacy-focused, with no external dependencies.

## Architecture

```
Frontend (TypeScript)     Backend (Rust)
┌─────────────────────┐    ┌──────────────────────┐
│ FileApi             │    │ FileService          │
│ - readNote()        │───▶│ - read_note()        │
│ - writeNote()       │    │ - write_note()       │
│ - createNote()      │    │ - create_note()      │
│ - deleteNote()      │    │ - delete_note()      │
│ - listNotes()       │    │ - list_notes()       │
└─────────────────────┘    └──────────────────────┘
```

## Backend (Rust)

### Core Components

#### Error Handling (`src/errors/mod.rs`)

Defines application-specific error types:

- `FileNotFound` - File doesn't exist
- `Io` - General I/O errors
- `InvalidPath` - Invalid file path
- `PermissionDenied` - Insufficient permissions
- `FileAlreadyExists` - File already exists
- `InvalidMarkdown` - Malformed markdown
- `Unknown` - Catch-all for unexpected errors

#### Models (`src/models/note.rs`)

Data structures for representing notes:

```rust
pub struct Note {
    pub path: String,        // File path
    pub title: String,       // Extracted or generated title
    pub content: String,     // Raw markdown content
    pub size: u64,          // File size in bytes
    pub created_at: Option<String>,   // Creation timestamp
    pub modified_at: Option<String>,  // Last modified timestamp
}

pub struct NoteInfo {
    pub path: String,
    pub title: String,
    pub size: u64,
    pub modified_at: Option<String>,
    pub is_directory: boolean,
}
```

#### File Service (`src/services/file_service.rs`)

Core business logic for file operations:

- **`read_note(path)`** - Read markdown file and extract metadata
- **`write_note(path, content)`** - Write content to file, creating directories as needed
- **`create_note(request)`** - Create new note with template content
- **`delete_note(path)`** - Remove file from filesystem
- **`list_notes(directory)`** - Recursively list all markdown files
- **`file_exists(path)`** - Check if file exists
- **`get_file_info(path)`** - Get file metadata

#### Tauri Commands (`src/commands/files.rs`)

Frontend-facing API endpoints that wrap service methods.

### Key Features

1. **Markdown-Only Focus**: Only processes `.md` and `.markdown` files
2. **Directory Safety**: Automatically creates parent directories when writing files
3. **Title Extraction**: Automatically extracts title from first `# Heading` or uses filename
4. **Recursive Listing**: Finds all markdown files in directory tree
5. **Hidden File Filtering**: Skips files/directories starting with `.`
6. **Error Handling**: Comprehensive error types with descriptive messages

## Frontend (TypeScript)

### FileApi Class (`src/utils/fileApi.ts`)

Provides type-safe wrappers around Tauri commands:

```typescript
class FileApi {
  static async readNote(filePath: string): Promise<Note>;
  static async writeNote(filePath: string, content: string): Promise<void>;
  static async createNote(request: CreateNoteRequest): Promise<Note>;
  static async deleteNote(filePath: string): Promise<void>;
  static async listNotes(directoryPath: string): Promise<NoteInfo[]>;
  static async fileExists(filePath: string): Promise<boolean>;
  static async getFileInfo(filePath: string): Promise<NoteInfo>;
}
```

### Utility Functions (`fileUtils`)

Helper functions for common operations:

```typescript
const fileUtils = {
  getFileName(path: string): string
  getDirectory(path: string): string
  isMarkdownFile(path: string): boolean
  ensureMarkdownExtension(path: string): string
  titleToFileName(title: string): string
  formatFileSize(bytes: number): string
  formatTimestamp(timestamp?: string): string
}
```

### Type Definitions (`src/types/files.ts`)

TypeScript interfaces that match Rust structs:

- `Note` - Complete note data
- `NoteInfo` - Note metadata
- `CreateNoteRequest` - Note creation parameters
- `AppError` - Error information

## Usage Examples

### Reading a Note

```typescript
import { FileApi } from "../utils/fileApi";

try {
  const note = await FileApi.readNote("/path/to/note.md");
  console.log(`Title: ${note.title}`);
  console.log(`Content: ${note.content}`);
} catch (error) {
  console.error("Failed to read note:", error.message);
}
```

### Creating a New Note

```typescript
import { FileApi, fileUtils } from "../utils/fileApi";

const title = "My New Note";
const fileName = fileUtils.titleToFileName(title); // "my-new-note"
const filePath = `/vault/notes/${fileName}.md`;

try {
  const note = await FileApi.createNote({
    path: filePath,
    title: title,
    content: `# ${title}\n\nYour content here...`,
  });
  console.log("Note created:", note.path);
} catch (error) {
  console.error("Failed to create note:", error.message);
}
```

### Listing Notes in Directory

```typescript
import { FileApi, fileUtils } from "../utils/fileApi";

try {
  const notes = await FileApi.listNotes("/vault/notes");

  notes.forEach(note => {
    console.log(`${note.title} (${fileUtils.formatFileSize(note.size)})`);
  });
} catch (error) {
  console.error("Failed to list notes:", error.message);
}
```

### Updating a Note

```typescript
import { FileApi } from "../utils/fileApi";

try {
  // Read existing note
  const note = await FileApi.readNote("/path/to/note.md");

  // Modify content
  const updatedContent = note.content + "\n\n## New Section";

  // Save changes
  await FileApi.writeNote(note.path, updatedContent);
  console.log("Note updated successfully");
} catch (error) {
  console.error("Failed to update note:", error.message);
}
```

## Error Handling

All operations can throw `AppError` objects with structured error information:

```typescript
try {
  await FileApi.readNote("/nonexistent.md");
} catch (error) {
  if (error.type === "FileNotFound") {
    console.log("File does not exist");
  } else if (error.type === "PermissionDenied") {
    console.log("Access denied");
  } else {
    console.log("Unknown error:", error.message);
  }
}
```

## Testing

Run the test suite to verify file operations:

```bash
npm test src/__tests__/fileApi.test.ts
```

Tests cover:

- All CRUD operations
- Error scenarios
- Utility functions
- Edge cases and validation

## Security Considerations

1. **Path Validation**: All file paths are validated to prevent directory traversal
2. **Extension Checking**: Only `.md` and `.markdown` files are processed
3. **Permission Handling**: Proper error reporting for permission issues
4. **No External Access**: All operations are strictly local filesystem

## Performance Notes

1. **Async Operations**: All file operations are async to prevent UI blocking
2. **Recursive Directory Walking**: Uses `walkdir` crate for efficient traversal
3. **Memory Efficient**: Streams large files rather than loading entirely in memory
4. **Metadata Caching**: File metadata is extracted once per read operation

## Future Enhancements

The basic file operations provide a foundation for:

1. **File Watching** - Monitor for external changes
2. **Vault Management** - Multiple vault support
3. **Markdown Processing** - Frontmatter parsing and wiki links
4. **Search Indexing** - Full-text search capabilities
5. **Link Detection** - Extract and manage note relationships

## Dependencies

### Rust Dependencies

- `tauri` - Application framework
- `tokio` - Async runtime
- `walkdir` - Directory traversal
- `serde` - Serialization
- `thiserror` - Error handling
- `anyhow` - Error utilities

### TypeScript Dependencies

- `@tauri-apps/api` - Tauri frontend bindings

## File Structure

```
src-tauri/src/
├── commands/
│   └── files.rs         # Tauri command handlers
├── services/
│   └── file_service.rs  # Core file operations
├── models/
│   └── note.rs          # Data structures
├── errors/
│   └── mod.rs           # Error definitions
└── lib.rs               # Application setup

src/
├── utils/
│   └── fileApi.ts       # Frontend API wrapper
├── types/
│   └── files.ts         # TypeScript definitions
└── __tests__/
    └── fileApi.test.ts  # Test suite
```
