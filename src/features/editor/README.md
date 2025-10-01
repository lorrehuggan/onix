# Onix Editor Feature

A modular, extensible rich text editor built on TipTap for the Onix note-taking application.

## Overview

The Onix Editor has been refactored from a monolithic 556-line component into a well-organized, modular structure that promotes maintainability and reusability.

## Directory Structure

```
src/features/editor/
├── components/
│   ├── minimal-editor.tsx   # Example minimal editor component
│   └── index.ts             # Components exports
├── config/
│   └── extensions.ts        # TipTap extensions configuration
├── extensions/
│   ├── force-first-h1.ts    # Ensures first node is always H1
│   ├── markdown-syntax.ts   # Visual markdown syntax decorations
│   ├── smart-select-all.ts  # Smart select-all behavior
│   └── index.ts             # Extensions exports
├── hooks/
│   ├── use-editor-shortcuts.ts # Keyboard shortcuts management
│   └── index.ts             # Hooks exports
├── screens/
│   └── index.tsx            # Main OnixEditor screen component
├── utils/
│   ├── markdown.ts          # HTML/Markdown conversion utilities
│   ├── markdown-shortcuts.ts # Live markdown shortcuts handler
│   └── index.ts             # Utils exports
├── index.ts                 # Main feature exports
└── README.md                # This file
```

## Key Features

### Custom Extensions

#### ForceFirstH1

Ensures the document always starts with an H1 heading, maintaining consistent document structure.

#### MarkdownSyntax

Provides visual markdown syntax decorations (hash symbols, code fences, blockquote markers) for better editing experience.

#### SmartSelectAll

Implements Obsidian-like smart select behavior:

- If first node is H1 with content and there's more content below: selects only content after H1
- Otherwise: selects all content (standard behavior)

### Configuration

The `createEditorExtensions()` function provides a centralized configuration for all TipTap extensions with customizable options.

### Utilities

- **Markdown Conversion**: HTML ↔ Markdown conversion utilities
- **Markdown Shortcuts**: Live conversion of markdown syntax (e.g., `# ` → heading)
- **Text Processing**: Word count, character count, text extraction utilities

### Hooks

- **useEditorShortcuts**: Manages global keyboard shortcuts like Cmd+S for saving

## Usage

### Basic Editor Setup

```tsx
import { OnixEditor } from "@/features/editor";

// Or import directly from screens
// import { OnixEditor } from "@/features/editor/screens";

function MyComponent() {
  return (
    <OnixEditor
      content="<h1>My Document</h1>"
      placeholder="Start writing..."
      onUpdate={(html, markdown) => console.log({ html, markdown })}
      onSave={(html, markdown) => saveDocument(html, markdown)}
    />
  );
}
```

### Using Extensions Separately

```tsx
import { ForceFirstH1, createEditorExtensions } from "@/features/editor";

const extensions = createEditorExtensions({
  placeholder: "Custom placeholder",
});

// Or use individual extensions
const customExtensions = [
  ForceFirstH1,
  // ... other extensions
];
```

### Using Utilities

```tsx
import { countWords, htmlToMarkdown } from "@/features/editor";

const markdown = htmlToMarkdown("<h1>Title</h1><p>Content</p>");
const wordCount = countWords("Hello world");
```

## Markdown Shortcuts

The editor supports live markdown shortcuts:

- `# ` → H1 heading
- `## ` → H2 heading (up to H6)
- `> ` → Blockquote
- `- `, `* `, `+ ` → Bullet list
- `- [ ] ` → Unchecked task
- `- [x] ` → Checked task
- `---`, `***` → Horizontal rule
- ```→ Code block

  ```

## Keyboard Shortcuts

- `Cmd/Ctrl + S` → Save document
- `Cmd/Ctrl + A` → Smart select all

## Props

### OnixEditorProps

```tsx
interface OnixEditorProps {
  content?: string; // Initial HTML content
  placeholder?: string; // Placeholder text
  onUpdate?: (content: string, markdown: string) => void; // Content change handler
  onSave?: (content: string, markdown: string) => void; // Save handler
  className?: string; // Additional CSS classes
  notePath?: string; // Display path for the note
  noteTitle?: string; // Display title for the note
}
```

## Extension API

### Creating Custom Extensions

```tsx
import { Extension } from "@tiptap/react";

const MyCustomExtension = Extension.create({
  name: "myExtension",

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => {
        // Custom shortcut logic
        return true;
      },
    };
  },
});
```

## Performance Considerations

- Extensions are lazy-loaded and only initialized when needed
- Markdown conversion is memoized using useCallback
- Word/character counts are updated reactively only when content changes
- DOM updates are batched for better performance

## Architecture Benefits

1. **Modularity**: Each feature is self-contained and testable
2. **Reusability**: Extensions and utilities can be used in other editors
3. **Maintainability**: Clear separation of concerns with screens/components/utils structure
4. **Extensibility**: Easy to add new extensions or modify existing ones
5. **Type Safety**: Full TypeScript support throughout
6. **Screen-level Organization**: Main editor lives in `/screens` reflecting its role as a full interface

## Future Improvements

- [ ] Add proper markdown parser (e.g., turndown) for better HTML → Markdown conversion
- [ ] Implement plugin system for third-party extensions
- [ ] Add more markdown shortcuts (tables, footnotes, etc.)
- [ ] Performance optimizations for large documents
- [ ] Accessibility improvements
