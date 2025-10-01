import { EditorContent, useEditor } from "@tiptap/react";

import { useCallback, useState } from "react";

import { createEditorExtensions } from "../config/extensions";
import { useEditorShortcuts } from "../hooks";
import { htmlToMarkdown } from "../utils";

interface MinimalEditorProps {
  onSave?: (content: string) => void;
  initialContent?: string;
  placeholder?: string;
}

/**
 * A minimal version of the Onix editor for simple use cases.
 * Demonstrates how to use the abstracted editor modules.
 */
export function MinimalEditor({
  onSave,
  initialContent = "<h1></h1>",
  placeholder = "Start writing...",
}: MinimalEditorProps) {
  const [content, setContent] = useState("");

  const editor = useEditor({
    extensions: createEditorExtensions({ placeholder }),
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
  });

  const handleSave = useCallback(() => {
    if (editor && onSave) {
      const html = editor.getHTML();
      onSave(html);
    }
  }, [editor, onSave]);

  // Use the keyboard shortcuts hook
  useEditorShortcuts({
    editor,
    onSave: handleSave,
  });

  if (!editor) {
    return <div>Loading...</div>;
  }

  return (
    <div className="minimal-editor rounded-lg border border-gray-200">
      <div className="border-b border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
        Minimal Editor Example - {content ? htmlToMarkdown(content).split("\n")[0] : "Untitled"}
      </div>
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
      {onSave && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-right">
          <button
            onClick={handleSave}
            className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
          >
            Save (⌘S)
          </button>
        </div>
      )}
    </div>
  );
}
