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
import { common, createLowlight } from "lowlight";

import { ForceFirstH1, MarkdownSyntax, SmartSelectAll } from "../extensions";

const lowlight = createLowlight(common);

interface EditorExtensionsConfig {
  placeholder?: string;
}

/**
 * Creates the complete set of TipTap extensions for the Onix editor.
 * Includes all standard extensions plus custom Onix-specific functionality.
 */
export function createEditorExtensions({
  placeholder = "Start writing...",
}: EditorExtensionsConfig = {}) {
  return [
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
        return placeholder;
      },
      emptyEditorClass: "is-empty",
      showOnlyWhenEditable: true,
    }),
    History.configure({
      depth: 100,
    }),
    MarkdownSyntax,
    SmartSelectAll,
  ];
}
