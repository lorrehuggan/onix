import type { Editor } from "@tiptap/react";

import { useCallback, useEffect } from "react";

interface UseEditorShortcutsOptions {
  editor: Editor | null;
  onSave?: () => void;
}

/**
 * Custom hook that handles keyboard shortcuts for the editor.
 * Manages global shortcuts like Cmd+S for saving.
 */
export function useEditorShortcuts({ editor, onSave }: UseEditorShortcutsOptions) {
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Save shortcut
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, handleSave]);

  return { handleSave };
}
