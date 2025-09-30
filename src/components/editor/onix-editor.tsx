import { Blockquote } from "@tiptap/extension-blockquote";
import { Bold } from "@tiptap/extension-bold";
import { BulletList } from "@tiptap/extension-bullet-list";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Code } from "@tiptap/extension-code";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Document } from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { Heading } from "@tiptap/extension-heading";
import { Highlight } from "@tiptap/extension-highlight";
import { History } from "@tiptap/extension-history";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Italic } from "@tiptap/extension-italic";
import { Link } from "@tiptap/extension-link";
import { ListItem } from "@tiptap/extension-list-item";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Strike } from "@tiptap/extension-strike";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { Text } from "@tiptap/extension-text";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { EditorContent, Extension, useEditor } from "@tiptap/react";
import { common, createLowlight } from "lowlight";

import { useCallback, useEffect, useState } from "react";

const lowlight = createLowlight(common);

// Custom extension to ensure first element is always H1
const ForceFirstH1 = Extension.create({
  name: "forceFirstH1",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("forceFirstH1"),
        appendTransaction: (transactions, newState) => {
          // Only check if content actually changed
          if (!transactions.some(tr => tr.docChanged)) {
            return null;
          }

          const { doc } = newState;
          const firstNode = doc.firstChild;

          // If document is empty or first node is not an H1, create one
          if (!firstNode || firstNode.type.name !== "heading" || firstNode.attrs.level !== 1) {
            const tr = newState.tr;

            if (!firstNode) {
              // Empty document - insert H1
              const h1Node = newState.schema.nodes.heading.create(
                { level: 1 },
                newState.schema.text(""),
              );
              tr.insert(0, h1Node);
            } else if (firstNode.type.name === "heading" && firstNode.attrs.level !== 1) {
              // First node is a heading but not H1 - convert it
              tr.setNodeMarkup(0, undefined, { level: 1 });
            } else if (firstNode.type.name !== "heading") {
              // First node is not a heading - convert it to H1
              tr.setNodeMarkup(0, newState.schema.nodes.heading, { level: 1 });
            }

            return tr;
          }

          return null;
        },
      }),
    ];
  },
});

// Custom extension to show markdown syntax
const MarkdownSyntax = Extension.create({
  name: "markdownSyntax",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownSyntax"),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr) {
            const { doc } = tr.doc ? tr : tr.doc;
            if (!doc) return DecorationSet.empty;

            const decorations: Decoration[] = [];

            doc.descendants((node, pos) => {
              if (node.type.name === "heading") {
                const level = node.attrs.level;
                const hashes = "#".repeat(level);

                // Add decoration for the hash symbols
                decorations.push(
                  Decoration.inline(pos + 1, pos + 1, {
                    class: "markdown-hash",
                    "data-content": `${hashes} `,
                  }),
                );
              }

              if (node.type.name === "codeBlock") {
                // Add decoration for code block fences
                decorations.push(
                  Decoration.inline(pos + 1, pos + 1, {
                    class: "markdown-code-fence",
                    "data-content": `\`\`\`${node.attrs.language || ""}\n`,
                  }),
                );
              }

              if (node.type.name === "blockquote") {
                // Add decoration for blockquote
                decorations.push(
                  Decoration.inline(pos + 1, pos + 1, {
                    class: "markdown-blockquote",
                    "data-content": "> ",
                  }),
                );
              }

              return true;
            });

            return DecorationSet.create(doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

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
  placeholder = "Untitled",
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
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: "mb-3",
        },
      }),
      Text,
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
        HTMLAttributes: {
          class: "onix-heading",
        },
      }),
      ForceFirstH1,
      Bold.configure({
        HTMLAttributes: {
          class: "font-semibold",
        },
      }),
      Italic.configure({
        HTMLAttributes: {
          class: "italic",
        },
      }),
      Strike.configure({
        HTMLAttributes: {
          class: "line-through opacity-75",
        },
      }),
      Code.configure({
        HTMLAttributes: {
          class: "bg-surface px-1.5 py-0.5 rounded text-sm font-mono border border-border",
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: "border-l-4 border-brand pl-4 py-2 bg-surface/30 rounded-r my-4",
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-6 space-y-1",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-6 space-y-1",
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: "leading-relaxed",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list space-y-1",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "task-item flex items-start",
        },
      }),
      HardBreak,
      HorizontalRule.configure({
        HTMLAttributes: {
          class: "my-8 border-t border-border",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand underline hover:text-accent cursor-pointer",
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-warning/30 px-1 py-0.5 rounded",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class:
            "bg-surface border border-border rounded-lg p-4 text-sm font-mono overflow-x-auto my-4",
        },
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading" && node.attrs.level === 1) {
            return "Untitled";
          }
          return placeholder || "Start writing...";
        },
        emptyEditorClass: "is-empty",
        showOnlyWhenEditable: true,
      }),
      History.configure({
        depth: 100,
      }),
      MarkdownSyntax,
    ],
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
        if (event.key === " ") {
          const { state, dispatch } = view;
          const { selection } = state;
          const { $from } = selection;

          // Get current line text
          const lineStart = $from.start($from.depth);
          const lineText = state.doc.textBetween(lineStart, $from.pos);

          // Heading shortcuts - but prevent converting the first node away from H1
          const headingMatch = lineText.match(/^(#{1,6})$/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const isFirstNode = $from.start($from.depth) === 1;

            // If it's the first node and they're trying to make it not an H1, ignore
            if (isFirstNode && level !== 1) {
              return true; // Consume the event but don't change anything
            }

            const tr = state.tr;
            tr.delete(lineStart, $from.pos);
            tr.setBlockType(lineStart, lineStart, state.schema.nodes.heading, { level });
            dispatch(tr);
            return true;
          }

          // Blockquote shortcut
          if (lineText === ">") {
            const tr = state.tr;
            tr.delete(lineStart, $from.pos);
            const range = $from.blockRange();
            if (range) {
              tr.wrap(range, [{ type: state.schema.nodes.blockquote }]);
            }
            dispatch(tr);
            return true;
          }

          // Bullet list shortcut
          if (lineText === "-" || lineText === "*" || lineText === "+") {
            const tr = state.tr;
            tr.delete(lineStart, $from.pos);
            const range = $from.blockRange();
            if (range) {
              tr.wrap(range, [
                { type: state.schema.nodes.bulletList },
                { type: state.schema.nodes.listItem },
              ]);
            }
            dispatch(tr);
            return true;
          }

          // Task list shortcut
          if (lineText === "- [ ]" || lineText === "- [x]") {
            const checked = lineText === "- [x]";
            const tr = state.tr;
            tr.delete(lineStart, $from.pos);
            const range = $from.blockRange();
            if (range) {
              tr.wrap(range, [
                { type: state.schema.nodes.taskList },
                { type: state.schema.nodes.taskItem, attrs: { checked } },
              ]);
            }
            dispatch(tr);
            return true;
          }

          // Horizontal rule shortcut
          if (lineText === "---" || lineText === "***") {
            const tr = state.tr;
            tr.delete(lineStart, $from.pos);
            tr.replaceSelectionWith(state.schema.nodes.horizontalRule.create());
            dispatch(tr);
            return true;
          }

          // Code block shortcut
          if (lineText === "```") {
            const tr = state.tr;
            tr.delete(lineStart, $from.pos);
            tr.setBlockType(lineStart, lineStart, state.schema.nodes.codeBlock);
            dispatch(tr);
            return true;
          }
        }

        // Handle inline formatting while typing
        if (event.key === "*" || event.key === "_" || event.key === "=" || event.key === "`") {
          // Let the default behavior handle this for now
          return false;
        }

        return false;
      },
    },
  });

  // Convert HTML back to markdown (simplified)
  const htmlToMarkdown = useCallback((html: string): string => {
    // This is a simplified conversion - you might want to use a proper library
    return html
      .replace(
        /<h([1-6])>(.*?)<\/h[1-6]>/g,
        (_, level, text) => `${"#".repeat(parseInt(level))} ${text}\n`,
      )
      .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
      .replace(/<em>(.*?)<\/em>/g, "*$1*")
      .replace(/<code>(.*?)<\/code>/g, "`$1`")
      .replace(/<blockquote>(.*?)<\/blockquote>/g, "> $1")
      .replace(/<p>(.*?)<\/p>/g, "$1\n")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]*>/g, ""); // Strip remaining HTML tags
  }, []);

  const handleSave = useCallback(() => {
    if (editor && onSave) {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onSave(html, markdown);
      setIsModified(false);
    }
  }, [editor, onSave, htmlToMarkdown]);

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

  // Keyboard shortcuts
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
