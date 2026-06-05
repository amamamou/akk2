/** Multi-value tags stored in Media.category via TAG: prefix segments. */

const TAG_REGEX = /TAG:([^,]+)/g;

export function parseMediaTags(category: string): { baseCategory: string; tags: string[] } {
  const raw = (category || "").trim();
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(TAG_REGEX.source, "g");
  while ((match = re.exec(raw)) !== null) {
    const tag = match[1]?.trim();
    if (tag) tags.push(tag);
  }
  const baseCategory =
    raw.replace(/,?\s*TAG:[^,]+/g, "").replace(/,+/g, ",").replace(/^,|,$/g, "").trim() ||
    "Audio";
  return { baseCategory, tags: [...new Set(tags)] };
}

export function serializeMediaCategory(baseCategory: string, tags: string[]): string {
  const base =
    (baseCategory || "Audio")
      .replace(/,?\s*TAG:[^,]+/g, "")
      .replace(/,+/g, ",")
      .replace(/^,|,$/g, "")
      .trim() || "Audio";
  const unique = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
  if (unique.length === 0) return base;
  return `${base},${unique.map((t) => `TAG:${t}`).join(",")}`;
}

export function categoryMatchesTag(category: string, tagQuery: string): boolean {
  const q = tagQuery.trim().toLowerCase();
  if (!q) return true;
  const { tags, baseCategory } = parseMediaTags(category);
  const hay = `${baseCategory} ${tags.join(" ")}`.toLowerCase();
  return hay.includes(q) || tags.some((t) => t.toLowerCase().includes(q));
}
