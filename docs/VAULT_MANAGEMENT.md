# Vault Management System

This document describes the vault management system implemented in Onix for organizing and switching between different knowledge bases.

## Overview

The vault management system provides a foundation for managing multiple collections of markdown notes (called "vaults"). Each vault is a self-contained directory with its own configuration, settings, and notes. This enables users to organize their knowledge into separate, focused collections while maintaining the ability to switch between them seamlessly.

## Core Philosophy

### Local-First Storage

- All vault data stored locally on user's machine
- Vault configuration stored in `.onix/vault.json` within each vault
- Recent vaults list stored in user's app data directory
- No cloud dependencies or external services

### Privacy-First Design

- No telemetry or tracking of vault usage
- All vault operations are completely local
- Vault configurations contain no personally identifiable information
- Users maintain full control over their data

### Flexible Organization

- Support for unlimited number of vaults
- Each vault operates independently
- Easy switching between vaults
- Automatic vault discovery and validation

## Architecture

```
Frontend (TypeScript)          Backend (Rust)
┌─────────────────────┐       ┌──────────────────────┐
│ VaultApi            │       │ VaultService         │
│ - createVault()     │──────▶│ - create_vault()     │
│ - openVault()       │       │ - open_vault()       │
│ - getCurrentVault() │       │ - get_current_vault()│
│ - getRecentVaults() │       │ - get_recent_vaults()│
│ - closeVault()      │       │ - close_vault()      │
└─────────────────────┘       └──────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────────┐       ┌──────────────────────┐
│ UI Components       │       │ File System          │
│ - VaultPicker       │       │ - .onix/vault.json   │
│ - VaultInfo         │       │ - recent_vaults.json │
│ - VaultManagement   │       │ - Markdown files     │
└─────────────────────┘       └──────────────────────┘
```

## Backend Implementation (Rust)

### Core Components

#### Vault Models (`src/models/vault.rs`)

**Primary Data Structures:**

```rust
pub struct Vault {
    pub id: String,           // Unique identifier (UUID)
    pub name: String,         // User-friendly name
    pub path: String,         // File system path
    pub created_at: String,   // Creation timestamp
    pub last_opened: String,  // Last access timestamp
    pub note_count: u32,      // Number of markdown files
    pub total_size: u64,      // Total size in bytes
    pub config: VaultConfig,  // Vault configuration
}

pub struct VaultConfig {
    pub name: String,                           // Vault name
    pub description: Option<String>,            // Optional description
    pub settings: VaultSettings,                // Vault-specific settings
    pub metadata: HashMap<String, Value>,       // Custom metadata
}

pub struct VaultSettings {
    pub auto_save: bool,                        // Auto-save enabled
    pub default_note_location: String,          // Default folder for new notes
    pub file_extensions: Vec<String>,           // Supported file extensions
    pub exclude_patterns: Vec<String>,          // Files/folders to ignore
}
```

**Supporting Types:**

```rust
pub struct VaultInfo {
    pub id: String,
    pub name: String,
    pub path: String,
    pub note_count: u32,
    pub total_size: u64,
    pub last_opened: String,
    pub is_current: bool,     // Whether this is the currently active vault
}

pub struct CreateVaultRequest {
    pub path: String,         // Directory path for new vault
    pub name: String,         // Vault name
    pub description: Option<String>,  // Optional description
}

pub struct RecentVault {
    pub id: String,
    pub name: String,
    pub path: String,
    pub last_opened: String,
}
```

#### Vault Service (`src/services/vault_service.rs`)

**Core Functionality:**

- **`create_vault(request: CreateVaultRequest)`** - Create new vault with configuration
- **`open_vault(path: String)`** - Open existing vault or initialize new one
- **`get_current_vault()`** - Retrieve currently active vault
- **`get_recent_vaults()`** - Get list of recently accessed vaults
- **`get_vaults_info()`** - Get metadata for all recent vaults
- **`close_vault()`** - Close current vault
- **`is_vault(path: String)`** - Check if directory contains valid vault

**Key Features:**

1. **Vault Initialization**: Creates `.onix` directory and `vault.json` config file
2. **Statistics Calculation**: Automatically counts notes and calculates total size
3. **Recent Vaults Tracking**: Maintains ordered list of recently accessed vaults
4. **Configuration Persistence**: Saves vault settings to disk
5. **Path Validation**: Ensures vault directories exist and are accessible

#### Tauri Commands (`src/commands/vault.rs`)

**Frontend-facing API endpoints:**

```rust
#[tauri::command]
pub async fn create_vault(request: CreateVaultRequest) -> Result<Vault, AppError>

#[tauri::command]
pub async fn open_vault(vault_path: String) -> Result<Vault, AppError>

#[tauri::command]
pub fn get_current_vault() -> Result<Option<Vault>, AppError>

#[tauri::command]
pub fn get_recent_vaults() -> Result<Vec<RecentVault>, AppError>

#[tauri::command]
pub async fn get_vaults_info() -> Result<Vec<VaultInfo>, AppError>

#[tauri::command]
pub fn close_vault() -> Result<(), AppError>

#[tauri::command]
pub async fn is_vault(directory_path: String) -> Result<bool, AppError>

#[tauri::command]
pub async fn select_folder() -> Result<Option<String>, AppError>
```

## Frontend Implementation (TypeScript)

### Type Definitions (`src/types/vault.ts`)

TypeScript interfaces that mirror Rust data structures:

```typescript
interface Vault {
  id: string;
  name: string;
  path: string;
  created_at: string;
  last_opened: string;
  note_count: number;
  total_size: number;
  config: VaultConfig;
}

interface VaultConfig {
  name: string;
  description?: string;
  settings: VaultSettings;
  metadata: Record<string, any>;
}

interface VaultSettings {
  auto_save: boolean;
  default_note_location: string;
  file_extensions: string[];
  exclude_patterns: string[];
}
```

### API Wrapper (`src/utils/vaultApi.ts`)

**VaultApi Class Methods:**

```typescript
class VaultApi {
  static async createVault(request: CreateVaultRequest): Promise<Vault>;
  static async openVault(vaultPath: string): Promise<Vault>;
  static async getCurrentVault(): Promise<Vault | null>;
  static async getRecentVaults(): Promise<RecentVault[]>;
  static async getVaultsInfo(): Promise<VaultInfo[]>;
  static async closeVault(): Promise<void>;
  static async isVault(directoryPath: string): Promise<boolean>;
  static async selectFolder(): Promise<string | null>;
}
```

**Utility Functions:**

```typescript
const vaultUtils = {
  getVaultNameFromPath(path: string): string
  formatVaultPath(path: string): string
  formatSize(bytes: number): string
  formatTimestamp(timestamp?: string): string
  getRelativeTime(timestamp?: string): string
  isValidVaultName(name: string): boolean
  sanitizeVaultName(name: string): string
  generateVaultName(path: string): string
  getVaultSummary(vault: Vault): string
  sortVaultsByLastOpened<T>(vaults: T[]): T[]
  filterVaults<T>(vaults: T[], query: string): T[]
}
```

### UI Components

#### VaultPicker Component (`src/components/VaultPicker.tsx`)

**Features:**

- Modal interface for vault selection
- Recent vaults list with search functionality
- Quick actions for folder selection and vault creation
- Create new vault form with validation
- Vault statistics display (note count, size, last opened)

**Key Props:**

```typescript
interface VaultPickerProps {
  onVaultSelected: (vault: Vault) => void;
  onClose: () => void;
}
```

#### VaultInfo Component (`src/components/VaultInfo.tsx`)

**Features:**

- Current vault status display
- Vault metadata (name, path, statistics)
- Quick actions (refresh, switch vault, close vault)
- "No vault selected" state with call-to-action

**Key Props:**

```typescript
interface VaultInfoProps {
  onOpenVaultPicker: () => void;
  onRefresh?: () => void;
}
```

## File Structure

### Vault Directory Layout

```
my-vault/
├── .onix/
│   ├── vault.json          # Vault configuration
│   └── (future files)      # Index, cache, etc.
├── note1.md
├── note2.md
├── folder1/
│   ├── note3.md
│   └── note4.md
└── (other files and folders)
```

### Vault Configuration (`vault.json`)

```json
{
  "id": "vault-uuid-123",
  "name": "My Knowledge Base",
  "path": "/home/user/my-vault",
  "created_at": "1703088000",
  "last_opened": "1703174400",
  "note_count": 42,
  "total_size": 1048576,
  "config": {
    "name": "My Knowledge Base",
    "description": "Personal notes and research",
    "settings": {
      "auto_save": true,
      "default_note_location": "",
      "file_extensions": ["md", "markdown"],
      "exclude_patterns": [".git", ".onix", "node_modules", ".DS_Store"]
    },
    "metadata": {}
  }
}
```

### App Data Directory

```
~/.local/share/onix/          # Linux
~/Library/Application Support/onix/  # macOS
%APPDATA%/onix/               # Windows
├── recent_vaults.json        # Recent vaults list
└── (future app data)
```

### Recent Vaults (`recent_vaults.json`)

```json
[
  {
    "id": "vault-uuid-123",
    "name": "Work Notes",
    "path": "/home/user/work-vault",
    "last_opened": "1703174400"
  },
  {
    "id": "vault-uuid-456",
    "name": "Personal",
    "path": "/home/user/personal-vault",
    "last_opened": "1703088000"
  }
]
```

## Usage Examples

### Creating a New Vault

```typescript
import { VaultApi } from "../utils/vaultApi";

async function createNewVault() {
  try {
    const vault = await VaultApi.createVault({
      path: "/home/user/my-new-vault",
      name: "My New Vault",
      description: "A collection of my thoughts and notes",
    });

    console.log("Vault created:", vault.name);
    console.log("Location:", vault.path);
  } catch (error) {
    console.error("Failed to create vault:", error.message);
  }
}
```

### Opening an Existing Vault

```typescript
async function openVault() {
  try {
    const vault = await VaultApi.openVault("/home/user/existing-vault");
    console.log("Opened vault:", vault.name);
    console.log("Notes found:", vault.note_count);
  } catch (error) {
    console.error("Failed to open vault:", error.message);
  }
}
```

### Getting Current Vault Information

```typescript
async function getCurrentVaultInfo() {
  try {
    const vault = await VaultApi.getCurrentVault();

    if (vault) {
      console.log("Current vault:", vault.name);
      console.log("Location:", vault.path);
      console.log("Notes:", vault.note_count);
      console.log("Size:", vaultUtils.formatSize(vault.total_size));
    } else {
      console.log("No vault currently open");
    }
  } catch (error) {
    console.error("Failed to get current vault:", error.message);
  }
}
```

### Listing Recent Vaults

```typescript
async function listRecentVaults() {
  try {
    const vaults = await VaultApi.getVaultsInfo();

    console.log("Recent vaults:");
    vaults.forEach(vault => {
      console.log(`- ${vault.name} (${vault.note_count} notes)`);
      console.log(`  ${vault.path}`);
      console.log(`  Last opened: ${vaultUtils.getRelativeTime(vault.last_opened)}`);

      if (vault.is_current) {
        console.log("  ← Currently active");
      }
    });
  } catch (error) {
    console.error("Failed to list vaults:", error.message);
  }
}
```

### Using the VaultPicker Component

```tsx
import { VaultPicker } from "../components/VaultPicker";

function MyApp() {
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  const [currentVault, setCurrentVault] = useState<Vault | null>(null);

  const handleVaultSelected = (vault: Vault) => {
    setCurrentVault(vault);
    setShowVaultPicker(false);
  };

  return (
    <div>
      <button onClick={() => setShowVaultPicker(true)}>Select Vault</button>

      {currentVault && <div>Current vault: {currentVault.name}</div>}

      {showVaultPicker && (
        <VaultPicker
          onVaultSelected={handleVaultSelected}
          onClose={() => setShowVaultPicker(false)}
        />
      )}
    </div>
  );
}
```

## Error Handling

### Common Error Types

- **`FileNotFound`** - Vault directory doesn't exist
- **`InvalidPath`** - Path is not a directory or is invalid
- **`FileAlreadyExists`** - Vault already exists at specified path
- **`PermissionDenied`** - Insufficient permissions to access directory
- **`InvalidMarkdown`** - Corrupted vault configuration file

### Error Handling Patterns

```typescript
try {
  const vault = await VaultApi.openVault(vaultPath);
  // Success handling
} catch (error) {
  switch (error.type) {
    case "FileNotFound":
      console.error("Vault directory not found");
      break;
    case "PermissionDenied":
      console.error("Permission denied accessing vault");
      break;
    case "InvalidMarkdown":
      console.error("Vault configuration is corrupted");
      break;
    default:
      console.error("Unknown error:", error.message);
  }
}
```

## Testing

### Test Coverage

The vault management system includes comprehensive tests:

**VaultApi Tests:**

- All CRUD operations (create, read, update, delete)
- Error scenarios and edge cases
- API response validation
- Error handling verification

**VaultUtils Tests:**

- Path manipulation functions
- Validation functions
- Formatting utilities
- Sorting and filtering functions

### Running Tests

```bash
# Run vault-specific tests
npm test -- vaultApi.test.ts

# Run all tests
npm test
```

### Test Structure

```typescript
describe("VaultApi", () => {
  describe("createVault", () => {
    it("should create a vault successfully", async () => {
      // Test implementation
    });

    it("should handle errors when creating vault", async () => {
      // Error handling test
    });
  });

  // More test suites...
});
```

## Performance Considerations

### Optimization Strategies

1. **Async Operations**: All vault operations are asynchronous to prevent UI blocking
2. **Metadata Caching**: Vault statistics are cached to avoid repeated filesystem scans
3. **Lazy Loading**: Vault contents are loaded only when needed
4. **Efficient File Scanning**: Uses `walkdir` crate for optimized directory traversal
5. **Recent Vaults Limit**: Maintains only the 10 most recently accessed vaults

### Memory Usage

- **Vault metadata**: ~1KB per vault in memory
- **Configuration files**: ~5-10KB per vault on disk
- **Recent vaults list**: <1KB total

## Security Considerations

### Data Protection

1. **Local Storage Only**: All vault data remains on user's machine
2. **No Network Access**: Vault operations don't require internet connectivity
3. **File Permissions**: Respects OS-level file permissions
4. **Path Validation**: Prevents directory traversal attacks
5. **Configuration Validation**: Validates vault configs before loading

### Privacy Features

1. **No Telemetry**: No usage data collected or transmitted
2. **No Account Required**: Operates completely offline
3. **Portable Format**: Vault configs use standard JSON format
4. **User Control**: Users can manually edit or delete vault configurations

## Future Enhancements

The vault management system provides a foundation for:

1. **Vault Templates** - Predefined vault structures for different use cases
2. **Vault Import/Export** - Backup and restore vault configurations
3. **Vault Encryption** - Optional encryption for sensitive vaults
4. **Vault Synchronization** - Sync vault configs across devices
5. **Advanced Statistics** - Detailed analytics on vault usage
6. **Vault Themes** - Custom styling per vault
7. **Vault Plugins** - Extensible vault functionality

## Dependencies

### Rust Dependencies

- `uuid` - Unique identifier generation
- `chrono` - Date/time handling
- `dirs` - Cross-platform app data directories
- `walkdir` - Efficient directory traversal
- `serde_json` - JSON serialization/deserialization
- `tokio` - Async runtime

### TypeScript Dependencies

- `@tauri-apps/api` - Tauri frontend bindings

### File Structure Summary

```
src-tauri/src/
├── models/
│   └── vault.rs            # Data structures
├── services/
│   └── vault_service.rs    # Business logic
├── commands/
│   └── vault.rs            # Tauri commands
└── lib.rs                  # App integration

src/
├── types/
│   └── vault.ts            # TypeScript types
├── utils/
│   └── vaultApi.ts         # API wrapper
├── components/
│   ├── VaultPicker.tsx     # Vault selection UI
│   ├── VaultInfo.tsx       # Current vault display
│   └── VaultManagementExample.tsx  # Demo component
└── __tests__/
    └── vaultApi.test.ts    # Test suite
```

The vault management system is now complete and ready for the next phase of development. It provides a solid foundation for organizing and managing multiple knowledge bases while maintaining the privacy-first, local-first principles of the application.
