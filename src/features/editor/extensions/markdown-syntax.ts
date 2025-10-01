import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension } from "@tiptap/react";

/**
 * Extension that adds visual markdown syntax decorations to the editor.
 * Shows hash symbols for headings, code fences, and blockquote markers
 * to provide visual feedback for markdown structure.
 */
export const MarkdownSyntax = Extension.create({
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
