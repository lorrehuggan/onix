import { invoke } from "@tauri-apps/api/core";

import type { CreateVaultRequest, RecentVault, Vault, VaultInfo } from "../types/vault";
import { VaultApi, vaultUtils } from "../utils/vaultApi";

// Mock the Tauri invoke function
jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn(),
}));

const mockInvoke = invoke as jest.MockedFunction<typeof invoke>;

describe("VaultApi", () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  describe("createVault", () => {
    it("should create a vault successfully", async () => {
      const mockRequest: CreateVaultRequest = {
        path: "/test/vault",
        name: "Test Vault",
        description: "A test vault",
      };

      const mockVault: Vault = {
        id: "vault-123",
        name: "Test Vault",
        path: "/test/vault",
        created_at: "1234567890",
        last_opened: "1234567890",
        note_count: 0,
        total_size: 0,
        config: {
          name: "Test Vault",
          description: "A test vault",
          settings: {
            auto_save: true,
            default_note_location: "",
            file_extensions: ["md", "markdown"],
            exclude_patterns: [".git", ".onix", "node_modules", ".DS_Store"],
          },
          metadata: {},
        },
      };

      mockInvoke.mockResolvedValue(mockVault);

      const result = await VaultApi.createVault(mockRequest);

      expect(mockInvoke).toHaveBeenCalledWith("create_vault", { request: mockRequest });
      expect(result).toEqual(mockVault);
    });

    it("should handle errors when creating vault", async () => {
      const mockError = {
        type: "FileAlreadyExists",
        message: "Vault already exists at /test/vault",
      };

      mockInvoke.mockRejectedValue(mockError);

      const request: CreateVaultRequest = {
        path: "/test/vault",
        name: "Test Vault",
      };

      await expect(VaultApi.createVault(request)).rejects.toEqual(mockError);
    });
  });

  describe("openVault", () => {
    it("should open a vault successfully", async () => {
      const mockVault: Vault = {
        id: "vault-456",
        name: "Existing Vault",
        path: "/test/existing",
        created_at: "1234567890",
        last_opened: "1234567891",
        note_count: 5,
        total_size: 1024,
        config: {
          name: "Existing Vault",
          description: undefined,
          settings: {
            auto_save: true,
            default_note_location: "",
            file_extensions: ["md"],
            exclude_patterns: [".git"],
          },
          metadata: {},
        },
      };

      mockInvoke.mockResolvedValue(mockVault);

      const result = await VaultApi.openVault("/test/existing");

      expect(mockInvoke).toHaveBeenCalledWith("open_vault", { vaultPath: "/test/existing" });
      expect(result).toEqual(mockVault);
    });

    it("should handle errors when opening vault", async () => {
      const mockError = {
        type: "FileNotFound",
        message: "Directory not found: /test/nonexistent",
      };

      mockInvoke.mockRejectedValue(mockError);

      await expect(VaultApi.openVault("/test/nonexistent")).rejects.toEqual(mockError);
    });
  });

  describe("getCurrentVault", () => {
    it("should get current vault successfully", async () => {
      const mockVault: Vault = {
        id: "vault-current",
        name: "Current Vault",
        path: "/test/current",
        created_at: "1234567890",
        last_opened: "1234567892",
        note_count: 10,
        total_size: 2048,
        config: {
          name: "Current Vault",
          description: "The currently active vault",
          settings: {
            auto_save: false,
            default_note_location: "notes",
            file_extensions: ["md", "markdown"],
            exclude_patterns: [".git", ".onix"],
          },
          metadata: { theme: "dark" },
        },
      };

      mockInvoke.mockResolvedValue(mockVault);

      const result = await VaultApi.getCurrentVault();

      expect(mockInvoke).toHaveBeenCalledWith("get_current_vault");
      expect(result).toEqual(mockVault);
    });

    it("should return null when no current vault", async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await VaultApi.getCurrentVault();

      expect(result).toBeNull();
    });
  });

  describe("getRecentVaults", () => {
    it("should get recent vaults successfully", async () => {
      const mockRecentVaults: RecentVault[] = [
        {
          id: "vault-1",
          name: "Recent Vault 1",
          path: "/test/recent1",
          last_opened: "1234567893",
        },
        {
          id: "vault-2",
          name: "Recent Vault 2",
          path: "/test/recent2",
          last_opened: "1234567892",
        },
      ];

      mockInvoke.mockResolvedValue(mockRecentVaults);

      const result = await VaultApi.getRecentVaults();

      expect(mockInvoke).toHaveBeenCalledWith("get_recent_vaults");
      expect(result).toEqual(mockRecentVaults);
    });

    it("should return empty array when no recent vaults", async () => {
      mockInvoke.mockResolvedValue([]);

      const result = await VaultApi.getRecentVaults();

      expect(result).toEqual([]);
    });
  });

  describe("getVaultsInfo", () => {
    it("should get vaults info successfully", async () => {
      const mockVaultsInfo: VaultInfo[] = [
        {
          id: "vault-info-1",
          name: "Info Vault 1",
          path: "/test/info1",
          note_count: 3,
          total_size: 512,
          last_opened: "1234567890",
          is_current: true,
        },
        {
          id: "vault-info-2",
          name: "Info Vault 2",
          path: "/test/info2",
          note_count: 7,
          total_size: 1536,
          last_opened: "1234567889",
          is_current: false,
        },
      ];

      mockInvoke.mockResolvedValue(mockVaultsInfo);

      const result = await VaultApi.getVaultsInfo();

      expect(mockInvoke).toHaveBeenCalledWith("get_vaults_info");
      expect(result).toEqual(mockVaultsInfo);
    });
  });

  describe("closeVault", () => {
    it("should close vault successfully", async () => {
      mockInvoke.mockResolvedValue(undefined);

      await VaultApi.closeVault();

      expect(mockInvoke).toHaveBeenCalledWith("close_vault");
    });

    it("should handle errors when closing vault", async () => {
      const mockError = {
        type: "Unknown",
        message: "Failed to close vault",
      };

      mockInvoke.mockRejectedValue(mockError);

      await expect(VaultApi.closeVault()).rejects.toEqual(mockError);
    });
  });

  describe("isVault", () => {
    it("should check if directory is a vault", async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await VaultApi.isVault("/test/valid-vault");

      expect(mockInvoke).toHaveBeenCalledWith("is_vault", { directoryPath: "/test/valid-vault" });
      expect(result).toBe(true);
    });

    it("should return false for non-vault directory", async () => {
      mockInvoke.mockResolvedValue(false);

      const result = await VaultApi.isVault("/test/regular-folder");

      expect(result).toBe(false);
    });
  });

  describe("selectFolder", () => {
    it("should select folder successfully", async () => {
      mockInvoke.mockResolvedValue("/selected/folder");

      const result = await VaultApi.selectFolder();

      expect(mockInvoke).toHaveBeenCalledWith("select_folder");
      expect(result).toBe("/selected/folder");
    });

    it("should return null when no folder selected", async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await VaultApi.selectFolder();

      expect(result).toBeNull();
    });
  });
});

describe("vaultUtils", () => {
  describe("getVaultNameFromPath", () => {
    it("should extract vault name from path", () => {
      expect(vaultUtils.getVaultNameFromPath("/home/user/Documents/MyVault")).toBe("MyVault");
      expect(vaultUtils.getVaultNameFromPath("C:\\Users\\User\\Documents\\MyVault")).toBe(
        "MyVault",
      );
      expect(vaultUtils.getVaultNameFromPath("MyVault")).toBe("MyVault");
      expect(vaultUtils.getVaultNameFromPath("/path/to/")).toBe("Unnamed Vault");
    });
  });

  describe("formatVaultPath", () => {
    it("should format vault path for display", () => {
      expect(vaultUtils.formatVaultPath("/home/user/Documents/Vault")).toBe("~/Documents/Vault");
      expect(vaultUtils.formatVaultPath("/other/path/Vault")).toBe("/other/path/Vault");
    });
  });

  describe("formatSize", () => {
    it("should format file sizes correctly", () => {
      expect(vaultUtils.formatSize(0)).toBe("0 Bytes");
      expect(vaultUtils.formatSize(512)).toBe("512 Bytes");
      expect(vaultUtils.formatSize(1024)).toBe("1 KB");
      expect(vaultUtils.formatSize(1536)).toBe("1.5 KB");
      expect(vaultUtils.formatSize(1048576)).toBe("1 MB");
      expect(vaultUtils.formatSize(1073741824)).toBe("1 GB");
    });
  });

  describe("formatTimestamp", () => {
    it("should format timestamps correctly", () => {
      const mockDate = new Date("2024-01-01T12:00:00Z");
      const timestamp = Math.floor(mockDate.getTime() / 1000).toString();

      jest.spyOn(Date.prototype, "toLocaleDateString").mockReturnValue("1/1/2024");
      jest.spyOn(Date.prototype, "toLocaleTimeString").mockReturnValue("12:00:00 PM");

      expect(vaultUtils.formatTimestamp(timestamp)).toBe("1/1/2024 12:00:00 PM");
      expect(vaultUtils.formatTimestamp(undefined)).toBe("Unknown");
      expect(vaultUtils.formatTimestamp("")).toBe("Unknown");
    });
  });

  describe("getRelativeTime", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return relative time strings", () => {
      const now = Math.floor(Date.now() / 1000);

      // Just now
      expect(vaultUtils.getRelativeTime((now - 30).toString())).toBe("Just now");

      // Minutes ago
      expect(vaultUtils.getRelativeTime((now - 300).toString())).toBe("5 minutes ago");

      // Hours ago
      expect(vaultUtils.getRelativeTime((now - 7200).toString())).toBe("2 hours ago");

      // Days ago
      expect(vaultUtils.getRelativeTime((now - 86400 * 3).toString())).toBe("3 days ago");

      // Months ago
      expect(vaultUtils.getRelativeTime((now - 86400 * 60).toString())).toBe("2 months ago");

      // Years ago
      expect(vaultUtils.getRelativeTime((now - 86400 * 400).toString())).toBe("1 years ago");

      expect(vaultUtils.getRelativeTime(undefined)).toBe("Unknown");
    });
  });

  describe("isValidVaultName", () => {
    it("should validate vault names", () => {
      expect(vaultUtils.isValidVaultName("Valid Name")).toBe(true);
      expect(vaultUtils.isValidVaultName("Valid-Name_123")).toBe(true);
      expect(vaultUtils.isValidVaultName("")).toBe(false);
      expect(vaultUtils.isValidVaultName("   ")).toBe(false);
      expect(vaultUtils.isValidVaultName("Invalid<Name>")).toBe(false);
      expect(vaultUtils.isValidVaultName("Invalid/Name")).toBe(false);
      expect(vaultUtils.isValidVaultName("Invalid\\Name")).toBe(false);
      expect(vaultUtils.isValidVaultName("Invalid:Name")).toBe(false);
      expect(vaultUtils.isValidVaultName("Invalid|Name")).toBe(false);
      expect(vaultUtils.isValidVaultName("Invalid?Name")).toBe(false);
      expect(vaultUtils.isValidVaultName("Invalid*Name")).toBe(false);
      expect(vaultUtils.isValidVaultName('Invalid"Name')).toBe(false);
      expect(vaultUtils.isValidVaultName("a".repeat(101))).toBe(false);
    });
  });

  describe("sanitizeVaultName", () => {
    it("should sanitize vault names", () => {
      expect(vaultUtils.sanitizeVaultName("  Valid Name  ")).toBe("Valid Name");
      expect(vaultUtils.sanitizeVaultName("Invalid<>Name")).toBe("InvalidName");
      expect(vaultUtils.sanitizeVaultName("Invalid/\\Name")).toBe("InvalidName");
      expect(vaultUtils.sanitizeVaultName("Multiple   Spaces")).toBe("Multiple Spaces");
      expect(vaultUtils.sanitizeVaultName("a".repeat(150))).toBe("a".repeat(100));
    });
  });

  describe("generateVaultName", () => {
    it("should generate vault names from paths", () => {
      expect(vaultUtils.generateVaultName("/home/user/MyVault")).toBe("MyVault");
      expect(vaultUtils.generateVaultName("/home/user/My<>Vault")).toBe("MyVault");
      expect(vaultUtils.generateVaultName("/empty/path/")).toBe("Unnamed Vault");
    });
  });

  describe("isValidPath", () => {
    it("should validate paths", () => {
      expect(vaultUtils.isValidPath("/valid/path")).toBe(true);
      expect(vaultUtils.isValidPath("C:\\valid\\path")).toBe(true);
      expect(vaultUtils.isValidPath("relative/path")).toBe(true);
      expect(vaultUtils.isValidPath("")).toBe(false);
      expect(vaultUtils.isValidPath("   ")).toBe(false);
      expect(vaultUtils.isValidPath("path\0with\0nulls")).toBe(false);
    });
  });

  describe("getVaultSummary", () => {
    it("should generate vault summaries", () => {
      const vault: Vault = {
        id: "test",
        name: "Test",
        path: "/test",
        created_at: "123",
        last_opened: "123",
        note_count: 5,
        total_size: 1024,
        config: {
          name: "Test",
          settings: {
            auto_save: true,
            default_note_location: "",
            file_extensions: ["md"],
            exclude_patterns: [],
          },
          metadata: {},
        },
      };

      expect(vaultUtils.getVaultSummary(vault)).toBe("5 notes • 1 KB");

      vault.note_count = 1;
      expect(vaultUtils.getVaultSummary(vault)).toBe("1 note • 1 KB");
    });
  });

  describe("sortVaultsByLastOpened", () => {
    it("should sort vaults by last opened time", () => {
      const vaults = [{ last_opened: "1000" }, { last_opened: "3000" }, { last_opened: "2000" }];

      const sorted = vaultUtils.sortVaultsByLastOpened(vaults);

      expect(sorted.map(v => v.last_opened)).toEqual(["3000", "2000", "1000"]);
    });

    it("should handle invalid timestamps", () => {
      const vaults = [{ last_opened: "invalid" }, { last_opened: "2000" }, { last_opened: "" }];

      const sorted = vaultUtils.sortVaultsByLastOpened(vaults);

      expect(sorted[0].last_opened).toBe("2000");
    });
  });

  describe("filterVaults", () => {
    const vaults = [
      { name: "My Vault", path: "/home/user/vault1" },
      { name: "Work Notes", path: "/work/notes" },
      { name: "Personal", path: "/home/user/personal" },
    ];

    it("should filter vaults by name", () => {
      const filtered = vaultUtils.filterVaults(vaults, "vault");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("My Vault");
    });

    it("should filter vaults by path", () => {
      const filtered = vaultUtils.filterVaults(vaults, "work");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Work Notes");
    });

    it("should return all vaults for empty query", () => {
      const filtered = vaultUtils.filterVaults(vaults, "");
      expect(filtered).toHaveLength(3);
    });

    it("should be case insensitive", () => {
      const filtered = vaultUtils.filterVaults(vaults, "PERSONAL");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Personal");
    });
  });
});
