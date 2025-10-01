/**
 * Utility functions for converting between HTML and Markdown formats.
 * Provides simplified conversion logic for the Onix editor.
 */

/**
 * Converts HTML content to Markdown format.
 * This is a simplified conversion - for production use, consider a proper library like turndown.
 */
export function htmlToMarkdown(html: string): string {
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
}

/**
 * Sanitizes content for safe HTML rendering.
 * Basic sanitization - extend as needed for security requirements.
 */
export function sanitizeContent(content: string): string {
  return content
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Extracts plain text from HTML content.
 * Useful for generating previews or search content.
 */
export function extractPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Counts words in a given text string.
 * Used for word count functionality.
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
}

/**
 * Truncates text to a specified length, adding ellipsis if needed.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength - 3)}...`;
}
