import { invoke } from "@tauri-apps/api/core";

import type { CreateNoteRequest, Note, NoteInfo } from "../types/files";
import { FileApi, fileUtils } from "../utils/fileApi";

// Mock the Tauri invoke function before any imports
jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn(),
}));

const mockInvoke = invoke as jest.MockedFunction<typeof invoke>;

describe("FileApi", () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  describe("readNote", () => {
    it("should read a note successfully", async () => {
      const mockNote: Note = {
        path: "/test/note.md",
        title: "Test Note",
        content: "# Test Note\n\nThis is a test note.",
        size: 100,
        created_at: "1234567890",
        modified_at: "1234567890",
      };

      mockInvoke.mockResolvedValue(mockNote);

      const result = await FileApi.readNote("/test/note.md");

      expect(mockInvoke).toHaveBeenCalledWith("read_note", {
        filePath: "/test/note.md",
      });
      expect(result).toEqual(mockNote);
    });

    it("should handle errors when reading note", async () => {
      const mockError = {
        type: "FileNotFound",
        message: "File not found: /test/nonexistent.md",
      };

      mockInvoke.mockRejectedValue(mockError);

      await expect(FileApi.readNote("/test/nonexistent.md")).rejects.toEqual(mockError);
    });
  });

  describe("writeNote", () => {
    it("should write a note successfully", async () => {
      mockInvoke.mockResolvedValue(undefined);

      await FileApi.writeNote("/test/note.md", "# Updated Content");

      expect(mockInvoke).toHaveBeenCalledWith("write_note", {
        filePath: "/test/note.md",
        content: "# Updated Content",
      });
    });

    it("should handle errors when writing note", async () => {
      const mockError = {
        type: "PermissionDenied",
        message: "Permission denied: /readonly/note.md",
      };

      mockInvoke.mockRejectedValue(mockError);

      await expect(FileApi.writeNote("/readonly/note.md", "content")).rejects.toEqual(mockError);
    });
  });

  describe("createNote", () => {
    it("should create a note successfully", async () => {
      const mockRequest: CreateNoteRequest = {
        path: "/test/new-note.md",
        title: "New Note",
        content: "# New Note\n\nContent here.",
      };

      const mockNote: Note = {
        path: "/test/new-note.md",
        title: "New Note",
        content: "# New Note\n\nContent here.",
        size: 25,
        created_at: "1234567890",
        modified_at: "1234567890",
      };

      mockInvoke.mockResolvedValue(mockNote);

      const result = await FileApi.createNote(mockRequest);

      expect(mockInvoke).toHaveBeenCalledWith("create_note", {
        request: mockRequest,
      });
      expect(result).toEqual(mockNote);
    });

    it("should handle errors when creating note", async () => {
      const mockError = {
        type: "FileAlreadyExists",
        message: "File already exists: /test/existing.md",
      };

      mockInvoke.mockRejectedValue(mockError);

      const request: CreateNoteRequest = {
        path: "/test/existing.md",
        title: "Existing Note",
      };

      await expect(FileApi.createNote(request)).rejects.toEqual(mockError);
    });
  });

  describe("deleteNote", () => {
    it("should delete a note successfully", async () => {
      mockInvoke.mockResolvedValue(undefined);

      await FileApi.deleteNote("/test/note.md");

      expect(mockInvoke).toHaveBeenCalledWith("delete_note", {
        filePath: "/test/note.md",
      });
    });

    it("should handle errors when deleting note", async () => {
      const mockError = {
        type: "FileNotFound",
        message: "File not found: /test/nonexistent.md",
      };

      mockInvoke.mockRejectedValue(mockError);

      await expect(FileApi.deleteNote("/test/nonexistent.md")).rejects.toEqual(mockError);
    });
  });

  describe("listNotes", () => {
    it("should list notes successfully", async () => {
      const mockNotes: NoteInfo[] = [
        {
          path: "/test/note1.md",
          title: "Note 1",
          size: 100,
          modified_at: "1234567890",
          is_directory: false,
        },
        {
          path: "/test/note2.md",
          title: "Note 2",
          size: 200,
          modified_at: "1234567891",
          is_directory: false,
        },
      ];

      mockInvoke.mockResolvedValue(mockNotes);

      const result = await FileApi.listNotes("/test");

      expect(mockInvoke).toHaveBeenCalledWith("list_notes", {
        directoryPath: "/test",
      });
      expect(result).toEqual(mockNotes);
    });

    it("should handle errors when listing notes", async () => {
      const mockError = {
        type: "InvalidPath",
        message: "/nonexistent is not a directory",
      };

      mockInvoke.mockRejectedValue(mockError);

      await expect(FileApi.listNotes("/nonexistent")).rejects.toEqual(mockError);
    });
  });

  describe("fileExists", () => {
    it("should check if file exists", async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await FileApi.fileExists("/test/note.md");

      expect(mockInvoke).toHaveBeenCalledWith("file_exists", {
        filePath: "/test/note.md",
      });
      expect(result).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      mockInvoke.mockResolvedValue(false);

      const result = await FileApi.fileExists("/test/nonexistent.md");

      expect(result).toBe(false);
    });
  });

  describe("getFileInfo", () => {
    it("should get file info successfully", async () => {
      const mockInfo: NoteInfo = {
        path: "/test/note.md",
        title: "Test Note",
        size: 100,
        modified_at: "1234567890",
        is_directory: false,
      };

      mockInvoke.mockResolvedValue(mockInfo);

      const result = await FileApi.getFileInfo("/test/note.md");

      expect(mockInvoke).toHaveBeenCalledWith("get_file_info", {
        filePath: "/test/note.md",
      });
      expect(result).toEqual(mockInfo);
    });
  });
});

describe("fileUtils", () => {
  describe("getFileName", () => {
    it("should extract filename from path", () => {
      expect(fileUtils.getFileName("/path/to/file.md")).toBe("file.md");
      expect(fileUtils.getFileName("file.md")).toBe("file.md");
      expect(fileUtils.getFileName("/path/to/")).toBe("");
    });
  });

  describe("getDirectory", () => {
    it("should extract directory from path", () => {
      expect(fileUtils.getDirectory("/path/to/file.md")).toBe("/path/to");
      expect(fileUtils.getDirectory("file.md")).toBe("");
    });
  });

  describe("isMarkdownFile", () => {
    it("should identify markdown files", () => {
      expect(fileUtils.isMarkdownFile("file.md")).toBe(true);
      expect(fileUtils.isMarkdownFile("file.markdown")).toBe(true);
      expect(fileUtils.isMarkdownFile("file.MD")).toBe(true);
      expect(fileUtils.isMarkdownFile("file.txt")).toBe(false);
      expect(fileUtils.isMarkdownFile("file")).toBe(false);
    });
  });

  describe("ensureMarkdownExtension", () => {
    it("should add .md extension if missing", () => {
      expect(fileUtils.ensureMarkdownExtension("file")).toBe("file.md");
      expect(fileUtils.ensureMarkdownExtension("file.txt")).toBe("file.txt.md");
      expect(fileUtils.ensureMarkdownExtension("file.md")).toBe("file.md");
    });
  });

  describe("titleToFileName", () => {
    it("should convert title to safe filename", () => {
      expect(fileUtils.titleToFileName("My Great Note")).toBe("my-great-note");
      expect(fileUtils.titleToFileName("Note with (special) chars!")).toBe(
        "note-with-special-chars",
      );
      expect(fileUtils.titleToFileName("  Multiple   Spaces  ")).toBe("multiple-spaces");
    });
  });

  describe("formatFileSize", () => {
    it("should format file sizes correctly", () => {
      expect(fileUtils.formatFileSize(0)).toBe("0 Bytes");
      expect(fileUtils.formatFileSize(512)).toBe("512 Bytes");
      expect(fileUtils.formatFileSize(1024)).toBe("1 KB");
      expect(fileUtils.formatFileSize(1536)).toBe("1.5 KB");
      expect(fileUtils.formatFileSize(1048576)).toBe("1 MB");
    });
  });

  describe("formatTimestamp", () => {
    it("should format timestamps correctly", () => {
      const mockDate = new Date("2024-01-01T12:00:00Z");
      const timestamp = Math.floor(mockDate.getTime() / 1000).toString();

      // Mock toLocaleDateString and toLocaleTimeString
      jest.spyOn(Date.prototype, "toLocaleDateString").mockReturnValue("1/1/2024");
      jest.spyOn(Date.prototype, "toLocaleTimeString").mockReturnValue("12:00:00 PM");

      expect(fileUtils.formatTimestamp(timestamp)).toBe("1/1/2024 12:00:00 PM");
      expect(fileUtils.formatTimestamp(undefined)).toBe("Unknown");
      expect(fileUtils.formatTimestamp("")).toBe("Unknown");
    });
  });
});
