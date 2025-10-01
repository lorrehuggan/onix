import { TextSelection } from "@tiptap/pm/state";
import { Extension } from "@tiptap/react";

/**
 * Extension that provides smart "Select All" behavior.
 * When Cmd+A is pressed, it intelligently selects content:
 * - If the first node is an H1 with content and there's more content after it,
 *   it selects everything after the H1
 * - Otherwise, it selects all content including the H1
 */
export const SmartSelectAll = Extension.create({
  name: "smartSelectAll",

  addKeyboardShortcuts() {
    return {
      "Mod-a": () => {
        const { editor } = this;
        const { state, dispatch } = editor.view;
        const { doc, tr } = state;

        // Check if first node is H1 and has content
        const firstNode = doc.firstChild;
        const isFirstNodeH1 = firstNode?.type.name === "heading" && firstNode.attrs.level === 1;
        const firstNodeHasContent = firstNode && firstNode.textContent.trim().length > 0;

        // If first node is H1 with content and there are more nodes after it
        if (isFirstNodeH1 && firstNodeHasContent && doc.childCount > 1) {
          // Calculate position after the first H1 node
          const startPos = firstNode.nodeSize;
          const endPos = doc.content.size;

          // Select from after the H1 to the end of the document
          if (startPos < endPos) {
            const selection = TextSelection.create(doc, startPos, endPos);
            dispatch(tr.setSelection(selection));
            return true;
          }
        }

        // Default behavior: select all content
        const selection = TextSelection.create(doc, 0, doc.content.size);
        dispatch(tr.setSelection(selection));
        return true;
      },
    };
  },
});
