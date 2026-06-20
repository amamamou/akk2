const SINGER_OVERRIDES_KEY = "aa_audio_singer_overrides";

export function loadSingerOverrides(): Record<string, string> {
  try {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(SINGER_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function persistSingerOverride(id: string, singer: string): Record<string, string> {
  try {
    const current = loadSingerOverrides();
    const next = { ...current, [id]: singer.trim() };
    window.localStorage.setItem(SINGER_OVERRIDES_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadSingerOverrides();
  }
}
