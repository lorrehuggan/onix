import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Extension } from "@tiptap/react";

/**
 * Extension that ensures the first node in the document is always an H1 heading.
 * This maintains document structure consistency by automatically converting
 * non-H1 first nodes to H1 headings.
 */
export const ForceFirstH1 = Extension.create({
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

          // Check if document is completely empty or only contains empty nodes
          const isEmpty =
            !firstNode ||
            (doc.childCount === 1 && firstNode.isTextblock && firstNode.content.size === 0);

          // If document is empty or first node is not an H1, fix it
          if (isEmpty || firstNode?.type.name !== "heading" || firstNode?.attrs.level !== 1) {
            const tr = newState.tr;

            if (isEmpty) {
              // Document is empty or has only empty content - replace with H1
              tr.replaceWith(
                0,
                doc.content.size,
                newState.schema.nodes.heading.create({ level: 1 }, newState.schema.text("")),
              );
            } else if (
              firstNode &&
              firstNode.type.name === "heading" &&
              firstNode.attrs.level !== 1
            ) {
              // First node is a heading but not H1 - convert it
              tr.setNodeMarkup(0, undefined, { level: 1 });
            } else if (firstNode && firstNode.type.name !== "heading") {
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
