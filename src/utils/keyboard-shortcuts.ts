import { useEffect } from "react";

import { useLayoutStore } from "../stores/layout-store";

export interface KeyboardShortcut {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

const isMac = typeof window !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export function useKeyboardShortcuts() {
  const {
    toggleSidebar,
    toggleRightPanel,
    toggleBottomPanel,
    splitEditor,
    removeEditorTab,
    editorLayout,
  } = useLayoutStore();

  useEffect(() => {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: "b",
        ctrlOrCmd: true,
        action: toggleSidebar,
        description: "Toggle left sidebar",
      },
      {
        key: "]",
        ctrlOrCmd: true,
        action: toggleRightPanel,
        description: "Toggle right panel",
      },
      {
        key: "`",
        ctrlOrCmd: true,
        action: toggleBottomPanel,
        description: "Toggle bottom panel",
      },
      {
        key: "\\",
        ctrlOrCmd: true,
        action: () => splitEditor(editorLayout.id, "vertical"),
        description: "Split editor vertically",
      },
      {
        key: "w",
        ctrlOrCmd: true,
        action: () => {
          // Close current active tab
          const activeTab = editorLayout.activeTab;
          if (activeTab && activeTab !== "welcome") {
            removeEditorTab(activeTab);
          }
        },
        description: "Close current tab",
      },
    ];

    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;

      for (const shortcut of shortcuts) {
        const modifierMatch = shortcut.ctrlOrCmd ? (isMac ? metaKey : ctrlKey) : true;

        const shiftMatch = shortcut.shift ? shiftKey : !shiftKey;
        const altMatch = shortcut.alt ? altKey : !altKey;

        if (
          key.toLowerCase() === shortcut.key.toLowerCase() &&
          modifierMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    toggleSidebar,
    toggleRightPanel,
    toggleBottomPanel,
    splitEditor,
    removeEditorTab,
    editorLayout,
  ]);

  const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];

    if (shortcut.ctrlOrCmd) {
      parts.push(isMac ? "⌘" : "Ctrl");
    }
    if (shortcut.shift) {
      parts.push("⇧");
    }
    if (shortcut.alt) {
      parts.push(isMac ? "⌥" : "Alt");
    }

    parts.push(shortcut.key.toUpperCase());

    return parts.join(" + ");
  };

  return { getShortcutDisplay };
}
