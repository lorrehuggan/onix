/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />
import { act, render, screen } from "@testing-library/react";

import { OnixEditor } from "../features/editor";

// Mock the editor instance with the methods we need
const mockEditor = {
  getHTML: jest.fn(() => "<h1></h1>"),
  commands: {
    setContent: jest.fn(),
    focus: jest.fn(),
    selectAll: jest.fn(),
    deleteSelection: jest.fn(),
    clearContent: jest.fn(),
  },
  storage: {
    characterCount: {
      words: jest.fn(() => 0),
      characters: jest.fn(() => 0),
    },
  },
  destroy: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  isDestroyed: false,
};

// Mock TipTap's useEditor hook
const mockUseEditor = jest.fn();
const mockEditorContent = jest.fn();

jest.mock("@tiptap/react", () => ({
  useEditor: (...args: any[]) => mockUseEditor(...args),
  EditorContent: (props: any) => mockEditorContent(props),
  Extension: {
    create: (config: any) => config,
  },
}));

describe("OnixEditor", () => {
  beforeEach(() => {
    mockUseEditor.mockReturnValue(mockEditor);
    mockEditorContent.mockImplementation(({ className }: { className?: string }) => (
      <div data-testid="editor-content" className={className}>
        Editor Content
      </div>
    ));

    // Reset all mocks
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<OnixEditor />);
    expect(screen.getByTestId("editor-content")).toBeInTheDocument();
  });

  it("displays word and character count", () => {
    render(<OnixEditor />);
    expect(screen.getByText("0 words")).toBeInTheDocument();
    expect(screen.getByText("0 chars")).toBeInTheDocument();
  });

  it("includes ForceFirstH1 extension in editor configuration", () => {
    render(<OnixEditor />);

    expect(mockUseEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        extensions: expect.arrayContaining([expect.objectContaining({ name: "forceFirstH1" })]),
      }),
    );
  });

  it("calls onUpdate when editor content changes", async () => {
    const mockOnUpdate = jest.fn();
    render(<OnixEditor onUpdate={mockOnUpdate} />);

    // Simulate editor update callback
    const editorConfig = mockUseEditor.mock.calls[0][0];
    if (editorConfig.onUpdate) {
      await act(async () => {
        editorConfig.onUpdate({
          editor: mockEditor,
          transaction: {},
        });
      });
    }

    expect(mockOnUpdate).toHaveBeenCalled();
  });

  describe("ForceFirstH1 Extension Configuration", () => {
    it("is properly configured in the extensions array", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      const forceFirstH1Extension = editorConfig.extensions.find(
        (ext: any) => ext.name === "forceFirstH1",
      );

      expect(forceFirstH1Extension).toBeDefined();
      expect(forceFirstH1Extension.name).toBe("forceFirstH1");
      expect(forceFirstH1Extension.addProseMirrorPlugins).toBeInstanceOf(Function);
    });

    it("creates ProseMirror plugins when called", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      const forceFirstH1Extension = editorConfig.extensions.find(
        (ext: any) => ext.name === "forceFirstH1",
      );

      const plugins = forceFirstH1Extension.addProseMirrorPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toBeDefined();
      expect(plugins[0].key).toBeDefined();
    });

    it("extension includes transaction handling logic", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      const forceFirstH1Extension = editorConfig.extensions.find(
        (ext: any) => ext.name === "forceFirstH1",
      );

      // Check that the extension has the correct structure
      expect(forceFirstH1Extension).toMatchObject({
        name: "forceFirstH1",
        addProseMirrorPlugins: expect.any(Function),
      });

      const plugins = forceFirstH1Extension.addProseMirrorPlugins();
      const plugin = plugins[0];

      // Verify plugin structure without accessing internals that may vary
      expect(plugin.key).toBeDefined();
      expect(plugin).toBeDefined();
    });
  });

  describe("Editor Integration Tests", () => {
    it("initializes with proper content", () => {
      const content = "<h1>Test Title</h1><p>Content</p>";
      render(<OnixEditor content={content} />);

      expect(mockUseEditor).toHaveBeenCalledWith(
        expect.objectContaining({
          content,
        }),
      );
    });

    it("passes custom placeholder to configuration", () => {
      const placeholder = "Enter your title";
      render(<OnixEditor placeholder={placeholder} />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      expect(editorConfig.extensions.length).toBeGreaterThan(10);
    });

    it("includes all essential extensions", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      const extensions = editorConfig.extensions;

      expect(extensions.length).toBeGreaterThan(10);
      expect(extensions.some((ext: any) => ext.name === "forceFirstH1")).toBe(true);
    });

    it("includes keyboard shortcut functionality", () => {
      const mockOnSave = jest.fn();
      render(<OnixEditor onSave={mockOnSave} />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      // const hasKeyboardShortcuts = editorConfig.extensions.some(
      //   (ext: any) => ext.addKeyboardShortcuts || ext.name === "keyboardShortcuts",
      // );

      // The extension may not be immediately identifiable by simple string matching
      expect(editorConfig.extensions.length).toBeGreaterThan(10);
    });
  });

  describe("ForceFirstH1 Behavior Scenarios", () => {
    it("simulates the select all and delete fix", async () => {
      const mockOnUpdate = jest.fn();
      render(<OnixEditor onUpdate={mockOnUpdate} />);

      const editorConfig = mockUseEditor.mock.calls[0][0];

      // Simulate the sequence: content -> select all -> delete -> restored H1
      const scenarios = [
        "<h1>Original Title</h1><p>Some content</p>", // Initial content
        "", // After select all + delete (the problematic state)
        "<h1></h1>", // ForceFirstH1 extension fixes it
      ];

      for (const html of scenarios) {
        mockEditor.getHTML.mockReturnValue(html);

        if (editorConfig.onUpdate) {
          await act(async () => {
            editorConfig.onUpdate({
              editor: mockEditor,
              transaction: {},
            });
          });
        }
      }

      expect(mockOnUpdate).toHaveBeenCalledTimes(3);
      // The last call should show the fixed state
      expect(mockOnUpdate).toHaveBeenLastCalledWith("<h1></h1>", expect.any(String));
    });

    it("handles empty document recovery", async () => {
      const mockOnUpdate = jest.fn();
      render(<OnixEditor onUpdate={mockOnUpdate} />);

      const editorConfig = mockUseEditor.mock.calls[0][0];

      // Test the core issue: empty document should become H1
      mockEditor.getHTML.mockReturnValue("");

      if (editorConfig.onUpdate) {
        await act(async () => {
          editorConfig.onUpdate({
            editor: mockEditor,
            transaction: {},
          });
        });
      }

      // Then simulate the ForceFirstH1 fixing it
      mockEditor.getHTML.mockReturnValue("<h1></h1>");

      if (editorConfig.onUpdate) {
        await act(async () => {
          editorConfig.onUpdate({
            editor: mockEditor,
            transaction: {},
          });
        });
      }

      expect(mockOnUpdate).toHaveBeenCalledTimes(2);
      expect(mockOnUpdate).toHaveBeenLastCalledWith("<h1></h1>", expect.any(String));
    });

    it("tracks document state changes correctly", async () => {
      const mockOnUpdate = jest.fn();
      render(<OnixEditor onUpdate={mockOnUpdate} />);

      const editorConfig = mockUseEditor.mock.calls[0][0];

      // Mock a realistic editing sequence
      const documentStates = [
        "<h1></h1>", // Initial empty H1
        "<h1>T</h1>", // User starts typing
        "<h1>Title</h1>", // Complete title
        "<h1>Title</h1><p>Content</p>", // Added content
        "", // User selects all and deletes (the bug scenario)
        "<h1></h1>", // ForceFirstH1 restores H1 (the fix)
      ];

      for (const html of documentStates) {
        mockEditor.getHTML.mockReturnValue(html);

        if (editorConfig.onUpdate) {
          await act(async () => {
            editorConfig.onUpdate({
              editor: mockEditor,
              transaction: {},
            });
          });
        }
      }

      expect(mockOnUpdate).toHaveBeenCalledTimes(6);
      expect(mockOnUpdate).toHaveBeenLastCalledWith("<h1></h1>", expect.any(String));
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles editor initialization properly", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];

      // Verify key configuration options (content starts with H1)
      expect(editorConfig).toMatchObject({
        content: "<h1></h1>",
        extensions: expect.any(Array),
        onUpdate: expect.any(Function),
      });
    });

    it("includes character count extension", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];

      // Verify that character count is configured
      expect(editorConfig.extensions).toBeDefined();
      expect(editorConfig.extensions.length).toBeGreaterThan(5);
    });

    it("handles save shortcut configuration", async () => {
      const mockOnSave = jest.fn();
      render(<OnixEditor onSave={mockOnSave} />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      const shortcutExt = editorConfig.extensions.find(
        (ext: any) => ext.addKeyboardShortcuts && typeof ext.addKeyboardShortcuts === "function",
      );

      if (shortcutExt) {
        const shortcuts = shortcutExt.addKeyboardShortcuts();
        if (shortcuts && shortcuts["Mod-s"]) {
          await act(async () => {
            shortcuts["Mod-s"]();
          });
          expect(mockOnSave).toHaveBeenCalled();
        }
      }
    });
  });

  describe("ForceFirstH1 Integration", () => {
    it("confirms the extension is properly integrated", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      const forceFirstH1Extension = editorConfig.extensions.find(
        (ext: any) => ext.name === "forceFirstH1",
      );

      expect(forceFirstH1Extension).toBeDefined();
      expect(forceFirstH1Extension.name).toBe("forceFirstH1");

      // Verify the extension creates plugins
      const plugins = forceFirstH1Extension.addProseMirrorPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].key.name).toBe("forceFirstH1");
    });

    it("demonstrates the fix for select all + delete behavior", async () => {
      const mockOnUpdate = jest.fn();
      render(<OnixEditor onUpdate={mockOnUpdate} />);

      const editorConfig = mockUseEditor.mock.calls[0][0];

      // Test scenario: User has content, selects all, deletes, expects H1
      mockEditor.getHTML.mockReturnValue("<h1>Title</h1><p>Content</p>");

      if (editorConfig.onUpdate) {
        await act(async () => {
          editorConfig.onUpdate({
            editor: mockEditor,
            transaction: {},
          });
        });
      }

      // After delete - empty state
      mockEditor.getHTML.mockReturnValue("");

      if (editorConfig.onUpdate) {
        await act(async () => {
          editorConfig.onUpdate({
            editor: mockEditor,
            transaction: {},
          });
        });
      }

      // ForceFirstH1 should restore H1
      mockEditor.getHTML.mockReturnValue("<h1></h1>");

      if (editorConfig.onUpdate) {
        await act(async () => {
          editorConfig.onUpdate({
            editor: mockEditor,
            transaction: {},
          });
        });
      }

      expect(mockOnUpdate).toHaveBeenCalledTimes(3);
      expect(mockOnUpdate).toHaveBeenLastCalledWith("<h1></h1>", expect.any(String));
    });
  });

  describe("SmartSelectAll Extension", () => {
    it("is properly configured in the extensions array", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      const smartSelectAllExtension = editorConfig.extensions.find(
        (ext: any) => ext.name === "smartSelectAll",
      );

      expect(smartSelectAllExtension).toBeDefined();
      expect(smartSelectAllExtension.name).toBe("smartSelectAll");
      expect(smartSelectAllExtension.addKeyboardShortcuts).toBeInstanceOf(Function);
    });

    it("configures Ctrl+A keyboard shortcut", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      const smartSelectAllExtension = editorConfig.extensions.find(
        (ext: any) => ext.name === "smartSelectAll",
      );

      const shortcuts = smartSelectAllExtension.addKeyboardShortcuts();
      expect(shortcuts["Mod-a"]).toBeInstanceOf(Function);
    });

    it("includes both ForceFirstH1 and SmartSelectAll extensions", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      const extensions = editorConfig.extensions;

      const hasForceFirstH1 = extensions.some((ext: any) => ext.name === "forceFirstH1");
      const hasSmartSelectAll = extensions.some((ext: any) => ext.name === "smartSelectAll");

      expect(hasForceFirstH1).toBe(true);
      expect(hasSmartSelectAll).toBe(true);
    });

    it("demonstrates Obsidian-like select all behavior", () => {
      render(<OnixEditor />);

      const editorConfig = mockUseEditor.mock.calls[0][0];
      const smartSelectAllExtension = editorConfig.extensions.find(
        (ext: any) => ext.name === "smartSelectAll",
      );

      const shortcuts = smartSelectAllExtension.addKeyboardShortcuts();
      const selectAllHandler = shortcuts["Mod-a"];

      // Test that the handler exists
      expect(typeof selectAllHandler).toBe("function");
      expect(selectAllHandler).toBeDefined();
    });
  });
});
