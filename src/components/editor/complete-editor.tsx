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

import { useCallback, useEffect, useState } from "react";

import { EditorToolbar } from "./editor-toolbar";

const lowlight = createLowlight(common);

interface CompleteEditorProps {
  content?: string;
  placeholder?: string;
  editable?: boolean;
  showToolbar?: boolean;
  onUpdate?: (content: string) => void;
  onSave?: (content: string) => void;
  className?: string;
  notePath?: string;
  noteTitle?: string;
}

export function CompleteEditor({
  content = "",
  placeholder = "Start typing... Use # for headings, **bold**, *italics*, ==highlights==",
  editable = true,
  showToolbar = true,
  onUpdate,
  onSave,
  className = "",
  notePath = "",
  noteTitle = "",
}: CompleteEditorProps) {
  const [isModified, setIsModified] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

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
    onCreate: ({ editor }) => {
      // Initialize counts when editor is first created
      const initialWordCount = editor.storage.characterCount?.words() ?? 0;
      const initialCharacterCount = editor.storage.characterCount?.characters() ?? 0;
      setWordCount(initialWordCount);
      setCharacterCount(initialCharacterCount);
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setIsModified(true);

      // Update word and character counts reactively
      const newWordCount = editor.storage.characterCount?.words() ?? 0;
      const newCharacterCount = editor.storage.characterCount?.characters() ?? 0;
      setWordCount(newWordCount);
      setCharacterCount(newCharacterCount);

      onUpdate?.(html);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl mx-auto focus:outline-none max-w-none",
        spellcheck: "true",
      },
    },
  });

  const handleSave = useCallback(() => {
    if (editor && onSave) {
      const content = editor.getHTML();
      onSave(content);
      setIsModified(false);
    }
  }, [editor, onSave]);

  // Handle content changes from props
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      // Update counts when content changes from props
      const newWordCount = editor.storage.characterCount?.words() ?? 0;
      const newCharacterCount = editor.storage.characterCount?.characters() ?? 0;
      setWordCount(newWordCount);
      setCharacterCount(newCharacterCount);
    }
  }, [content, editor]);

  // Handle editable changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + S for save
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
      }

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
  }, [editor, handleSave]);

  if (!editor) {
    return (
      <div className="text-muted flex h-64 items-center justify-center">Loading editor...</div>
    );
  }

  return (
    <div className={`complete-editor flex h-full flex-col ${className}`}>
      {/* Header with note info and save button */}
      <div className="border-border flex items-center justify-between border-b px-4 py-2">
        <div className="flex flex-col">
          {noteTitle && <h1 className="text-fg text-lg font-semibold">{noteTitle}</h1>}
          {notePath && <p className="text-muted text-xs">{notePath}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isModified && <span className="text-warning text-xs">Unsaved changes</span>}
          {onSave && (
            <button
              onClick={handleSave}
              disabled={!isModified}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                isModified
                  ? "bg-brand hover:bg-brand/90 text-white"
                  : "bg-surface text-muted cursor-not-allowed"
              }`}
            >
              Save {isModified && "(⌘S)"}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {showToolbar && <EditorToolbar editor={editor} />}

      {/* Editor content */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full p-6">
          <EditorContent
            editor={editor}
            className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl prose-headings:text-fg prose-p:text-fg prose-a:text-brand prose-strong:text-fg prose-em:text-fg prose-code:text-fg prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-blockquote:text-muted prose-blockquote:border-l-brand mx-auto max-w-none"
          />
        </div>
      </div>

      {/* Footer with stats */}
      <div className="border-border text-muted flex items-center justify-between border-t px-4 py-2 text-xs">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{characterCount} characters</span>
        </div>
        <div className="flex items-center gap-2">
          {editor.isActive("link") && (
            <button
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="text-brand hover:text-accent"
            >
              Remove link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
