import { EditorContent, useEditor } from "@tiptap/react";

import { useCallback, useEffect, useState } from "react";

import { createEditorExtensions } from "../config/extensions";
import { useEditorShortcuts } from "../hooks";
import { handleMarkdownShortcuts, htmlToMarkdown } from "../utils";

interface OnixEditorProps {
  content?: string;
  placeholder?: string;
  onUpdate?: (content: string, markdown: string) => void;
  onSave?: (content: string, markdown: string) => void;
  className?: string;
  notePath?: string;
  noteTitle?: string;
}

export function OnixEditor({
  content = "",
  placeholder = "Start writing...",
  onUpdate,
  onSave,
  className = "",
  notePath = "",
  noteTitle = "",
}: OnixEditorProps) {
  const [isModified, setIsModified] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  const editor = useEditor({
    extensions: createEditorExtensions({ placeholder }),
    content: content || "<h1></h1>",
    onCreate: ({ editor }) => {
      // Initialize counts when editor is first created
      const initialWordCount = editor.storage.characterCount?.words() ?? 0;
      const initialCharacterCount = editor.storage.characterCount?.characters() ?? 0;
      setWordCount(initialWordCount);
      setCharacterCount(initialCharacterCount);

      // Focus the first H1 if it's empty
      setTimeout(() => {
        const firstNode = editor.state.doc.firstChild;
        if (
          firstNode &&
          firstNode.type.name === "heading" &&
          firstNode.attrs.level === 1 &&
          firstNode.textContent === ""
        ) {
          editor.commands.focus("start");
        }
      }, 0);
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      setIsModified(true);

      // Update word and character counts reactively
      const newWordCount = editor.storage.characterCount?.words() ?? 0;
      const newCharacterCount = editor.storage.characterCount?.characters() ?? 0;
      setWordCount(newWordCount);
      setCharacterCount(newCharacterCount);

      onUpdate?.(html, markdown);
    },
    parseOptions: {
      preserveWhitespace: "full",
    },
    editorProps: {
      attributes: {
        class: "onix-editor-content focus:outline-none",
        spellcheck: "true",
      },
      handleKeyDown: (view, event) => {
        // Handle markdown shortcuts
        const handled = handleMarkdownShortcuts(view, event);
        if (handled) return true;

        // Handle inline formatting while typing
        if (event.key === "*" || event.key === "_" || event.key === "=" || event.key === "`") {
          // Let the default behavior handle this for now
          return false;
        }

        return false;
      },
    },
  });

  const handleSave = useCallback(() => {
    if (editor && onSave) {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onSave(html, markdown);
      setIsModified(false);
    }
  }, [editor, onSave]);

  // Use the keyboard shortcuts hook
  useEditorShortcuts({
    editor,
    onSave: handleSave,
  });

  // Handle content changes from props
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "<h1></h1>");
      // Update counts when content changes from props
      const newWordCount = editor.storage.characterCount?.words() ?? 0;
      const newCharacterCount = editor.storage.characterCount?.characters() ?? 0;
      setWordCount(newWordCount);
      setCharacterCount(newCharacterCount);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="text-muted flex h-64 items-center justify-center">Loading editor...</div>
    );
  }

  return (
    <div className={`onix-editor flex h-full flex-col ${className}`}>
      {/* Minimal header */}
      <div className="border-border/50 flex items-center justify-between border-b px-6 py-3">
        <div className="flex flex-col">
          {noteTitle && <p className="text-fg/90 text-lg font-medium">{noteTitle}</p>}
          {notePath && <p className="text-muted/80 text-xs">{notePath}</p>}
        </div>
        <div className="flex items-center gap-3">
          {isModified && <span className="text-warning/80 text-xs">●</span>}
          {onSave && (
            <button
              onClick={handleSave}
              disabled={!isModified}
              className={`text-xs transition-colors ${
                isModified ? "text-fg/70 hover:text-fg" : "text-muted/50 cursor-default"
              }`}
            >
              {isModified ? "⌘S to save" : "Saved"}
            </button>
          )}
        </div>
      </div>

      {/* Editor content - full width like Onix */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <EditorContent editor={editor} className="onix-content onix-editor min-h-full" />
        </div>
      </div>

      {/* Minimal status bar */}
      <div className="border-border/50 text-muted/60 flex items-center justify-between border-t px-6 py-2 text-xs">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{characterCount} chars</span>
        </div>
        <div className="text-muted/40">
          Use markdown syntax: # headings, **bold**, *italic*, ==highlight==
        </div>
      </div>
    </div>
  );
}
