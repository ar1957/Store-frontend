import * as React from "react"

/**
 * Product/item names can carry manual formatting two ways:
 *  - Raw HTML (e.g. "<br>", "<b>", styled <span>s) for full control, at the
 *    cost of showing literal tags anywhere we can't render HTML (e.g.
 *    Medusa's core admin dashboard).
 *  - A "|" marker for a plain, safe line break — no HTML injection surface,
 *    and degrades to a readable inline separator anywhere we can't render it.
 */

// Strip accessibility widget attributes that interfere with styling
function cleanHtml(html: string): string {
  return html.replace(/\s*data-asw-[a-z0-9-]+="[^"]*"/g, "")
}

function isHtml(str: string): boolean {
  return str.includes("<") || str.includes("&lt;")
}

function decodeIfEncoded(str: string): string {
  if (str.includes("&lt;")) {
    return str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }
  return str
}

// dangerouslySetInnerHTML props for a name containing raw HTML, or null if it doesn't.
export function getRichTitleHtmlProps(
  text?: string | null
): { dangerouslySetInnerHTML: { __html: string } } | null {
  if (!text || !isHtml(text)) return null
  return { dangerouslySetInnerHTML: { __html: cleanHtml(decodeIfEncoded(text)) } }
}

// React children for a name with no raw HTML — splits "|" into real <br/> line breaks.
export function getRichTitleChildren(text?: string | null): React.ReactNode {
  if (!text) return text
  if (!text.includes("|")) return text
  return text.split("|").map((part, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {part.trim()}
    </React.Fragment>
  ))
}

// Plain-text version for contexts that can't render markup at all (SEO title/meta, alt text, etc.)
export function getPlainTitle(text?: string | null): string {
  if (!text) return ""
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\|/g, " - ")
    .replace(/\s+/g, " ")
    .trim()
}
