import type { EditorView } from "@tiptap/pm/view";

/**
 * Handles markdown-style shortcuts during typing.
 * Converts markdown syntax like "# " to actual formatting.
 */
export function handleMarkdownShortcuts(view: EditorView, event: KeyboardEvent): boolean {
  if (event.key !== " ") return false;

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

  return false;
}
