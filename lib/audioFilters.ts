import type { AudioItem } from "./../app/library/components/AudioTile";

type Playlist = { id: string; title?: string; trackIds?: string[]; tracks?: string[]; items?: string[] };

export function buildAudioToPlaylists(playlists: Playlist[]) {
  const audioToPlaylists: Record<string, string[]> = {};
  for (const pl of playlists) {
    const maybeIds = pl.trackIds ?? pl.tracks ?? pl.items ?? [];
    if (Array.isArray(maybeIds)) {
      for (const id of maybeIds) {
        const key = String(id);
        audioToPlaylists[key] = audioToPlaylists[key] ?? [];
        audioToPlaylists[key].push(pl.title ?? `Playlist ${pl.id}`);
      }
    }
  }
  return audioToPlaylists;
}

export function filterLibrary(audios: AudioItem[], query: string, activeCategory: string, playlists: Playlist[]) {
  const normalizedQuery = query.trim();
  const tokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];
  const audioToPlaylists = buildAudioToPlaylists(playlists);

  return audios.filter((item) => {
    if (activeCategory !== "All" && activeCategory.startsWith("pl:")) {
      const pid = activeCategory.replace("pl:", "");
      const pl = playlists.find((p) => String(p.id) === pid);
      if (pl) {
        const maybeIds = pl.trackIds ?? pl.tracks ?? pl.items ?? [];
        let ids: string[] = [];
        if (Array.isArray(maybeIds) && maybeIds.every((x) => typeof x === "string")) {
          ids = maybeIds as string[];
        }
        if (ids.length > 0) return ids.includes(item.id);
        if (pl.title && item.category !== pl.title) return false;
      }
    } else if (activeCategory !== "All" && item.category !== activeCategory) {
      return false;
    }

    if (tokens.length === 0) return true;

    return tokens.every((tok) => {
      const colon = tok.indexOf(":");
      if (colon > 0) {
        const key = tok.slice(0, colon).toLowerCase();
        const val = tok.slice(colon + 1).toLowerCase();
        if (key === 'artist' || key === 'singer' || key === 'a') {
          return (item.singer ?? '').toLowerCase().includes(val);
        }
        if (key === 'title' || key === 't') {
          return (item.title ?? '').toLowerCase().includes(val);
        }
        if (key === 'playlist' || key === 'pl' || key === 'p') {
          const pls = audioToPlaylists[item.id] ?? [];
          return pls.some((pt) => pt.toLowerCase().includes(val));
        }
        if (key === 'creator' || key === 'addedby' || key === 'creator' || key === 'c') {
          return (String(item.addedBy ?? '')).toLowerCase().includes(val);
        }
        const haystack = `${item.title} ${item.category} ${item.duration} ${item.singer ?? ''} ${item.addedBy ?? ''} ${(audioToPlaylists[item.id] ?? []).join(' ')}`.toLowerCase();
        return haystack.includes(tok.toLowerCase());
      }

      const hay = `${item.title} ${item.category} ${item.duration} ${item.singer ?? ''} ${item.addedBy ?? ''} ${(audioToPlaylists[item.id] ?? []).join(' ')}`.toLowerCase();
      return hay.includes(tok.toLowerCase());
    });
  });
}
