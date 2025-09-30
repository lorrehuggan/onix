import { CharacterCount } from "@tiptap/extension-character-count";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import { Focus } from "@tiptap/extension-focus";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";

import { useCallback, useEffect } from "react";

const lowlight = createLowlight(common);

interface MarkdownEditorProps {
  content?: string;
  placeholder?: string;
  editable?: boolean;
  onUpdate?: (content: string) => void;
  onSelectionUpdate?: (selection: unknown) => void;
  className?: string;
}

export function MarkdownEditor({
  content = "",
  placeholder = "Start writing your note...",
  editable = true,
  onUpdate,
  onSelectionUpdate,
  className = "",
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand underline cursor-pointer hover:text-accent",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "task-item",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "table-auto border-collapse border border-border",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b border-border",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-border bg-surface p-2 text-left font-semibold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-border p-2",
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-warning/30 text-fg",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "bg-surface border border-border rounded-lg p-4 text-sm font-mono overflow-x-auto",
        },
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-empty",
      }),
      Typography,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate?.(html);
    },
    onSelectionUpdate: ({ editor }) => {
      const selection = editor.view.state.selection;
      onSelectionUpdate?.(selection);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none",
        spellcheck: "true",
      },
    },
  });

  // Handle content changes from props
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Handle editable changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // Keyboard shortcuts for common knowledge base actions
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K for link
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        const url = window.prompt("Enter URL:");
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      }

      // Cmd/Ctrl + Shift + H for highlight
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "H") {
        event.preventDefault();
        editor.chain().focus().toggleHighlight().run();
      }

      // Cmd/Ctrl + Shift + T for task list
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "T") {
        event.preventDefault();
        editor.chain().focus().toggleTaskList().run();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor]);

  // Helper functions for external control
  const insertLink = useCallback(
    (url: string, text?: string) => {
      if (editor) {
        if (text) {
          editor.chain().focus().insertContent(`[${text}](${url})`).run();
        } else {
          editor.chain().focus().setLink({ href: url }).run();
        }
      }
    },
    [editor],
  );

  const insertImage = useCallback(
    (src: string, alt?: string) => {
      if (editor) {
        editor.chain().focus().setImage({ src, alt }).run();
      }
    },
    [editor],
  );

  const insertTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  }, [editor]);

  const getWordCount = useCallback(() => {
    return editor?.storage.characterCount.words() ?? 0;
  }, [editor]);

  const getCharacterCount = useCallback(() => {
    return editor?.storage.characterCount.characters() ?? 0;
  }, [editor]);

  // Expose editor instance and helpers
  // Editor methods are available for external use if needed
  const editorMethods = {
    editor,
    insertLink,
    insertImage,
    insertTable,
    getWordCount,
    getCharacterCount,
  };
  // Methods can be accessed via ref if needed in the future
  void editorMethods; // Acknowledge the variable to avoid unused warnings

  if (!editor) {
    return (
      <div className="text-muted flex h-64 items-center justify-center">Loading editor...</div>
    );
  }

  return (
    <div className={`markdown-editor ${className}`}>
      <EditorContent editor={editor} className="min-h-96 p-4 focus-within:outline-none" />

      {/* Optional character/word count display */}
      {editor.storage.characterCount && (
        <div className="border-border text-muted flex items-center justify-between border-t px-4 py-2 text-xs">
          <div>
            {editor.storage.characterCount.words()} words,{" "}
            {editor.storage.characterCount.characters()} characters
          </div>
        </div>
      )}
    </div>
  );
}

// Custom styles for the editor
export const editorStyles = `
  /* Task list styles */
  .task-list {
    list-style: none;
    padding: 0;
  }

  .task-item {
    display: flex;
    align-items: flex-start;
  }

  .task-item > label {
    flex: 0 0 auto;
    margin-right: 0.5rem;
    user-select: none;
  }

  .task-item > div {
    flex: 1 1 auto;
  }

  /* Focus styles */
  .has-focus {
    border-radius: 3px;
    box-shadow: 0 0 0 3px oklch(var(--color-ring) / 0.3);
  }

  /* Empty editor placeholder */
  .is-empty::before {
    color: oklch(var(--color-muted));
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  /* Code block syntax highlighting */
  .hljs-comment,
  .hljs-quote {
    color: oklch(var(--color-muted));
  }

  .hljs-variable,
  .hljs-template-variable,
  .hljs-attribute,
  .hljs-tag,
  .hljs-name,
  .hljs-regexp,
  .hljs-link,
  .hljs-selector-id,
  .hljs-selector-class {
    color: oklch(var(--color-danger));
  }

  .hljs-number,
  .hljs-meta,
  .hljs-built_in,
  .hljs-builtin-name,
  .hljs-literal,
  .hljs-type,
  .hljs-params {
    color: oklch(var(--color-warning));
  }

  .hljs-string,
  .hljs-symbol,
  .hljs-bullet {
    color: oklch(var(--color-success));
  }

  .hljs-title,
  .hljs-section {
    color: oklch(var(--color-accent));
  }

  .hljs-keyword,
  .hljs-selector-tag {
    color: oklch(var(--color-brand));
  }
`;
