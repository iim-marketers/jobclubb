import "server-only";

import sanitizeHtml from "sanitize-html";

import { toRichTextHtml } from "@/lib/rich-text";

// Must match the marks and nodes the editor allows (see components/rich-text-editor).
export function sanitizeRichText(html: string) {
  return sanitizeHtml(toRichTextHtml(html), {
    allowedTags: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "br", "strong", "em", "u", "ul", "ol", "li"],
    allowedAttributes: {},
  }).trim();
}
