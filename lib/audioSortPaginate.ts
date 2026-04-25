import type { AudioItem } from "./../app/library/components/AudioTile";

export function sortAndFilterByDate(items: AudioItem[], sortBy: 'added' | 'title' | 'duration', sortDir: 'asc' | 'desc', dateFilterType: 'all' | 'last7' | 'last30' | 'custom', cutoff: number | null, customDate: string | null, singerFilter?: string | null) {
  const arr = items.slice().filter((t) => {
    if (singerFilter) {
      if (!t.singer) return false;
      if (t.singer.toLowerCase() !== singerFilter.toLowerCase()) return false;
    }
    if (dateFilterType === 'all') return true;
    const raw = t.addedAt ?? null;
    if (!raw) return false;
    const ts = Date.parse(raw);
    if (Number.isNaN(ts)) return false;
    if (dateFilterType === 'last7') return cutoff ? ts >= cutoff - 7 * 24 * 3600 * 1000 : true;
    if (dateFilterType === 'last30') return cutoff ? ts >= cutoff - 30 * 24 * 3600 * 1000 : true;
    return true;
  });

  let filteredByDate = arr;
  if (customDate) {
    const dayStart = Date.parse(customDate + 'T00:00:00');
    const dayEnd = Date.parse(customDate + 'T23:59:59');
    filteredByDate = arr.filter((t) => {
      const raw = t.addedAt ?? null;
      if (!raw) return false;
      const ts = Date.parse(raw);
      if (Number.isNaN(ts)) return false;
      return ts >= dayStart && ts <= dayEnd;
    });
  }

  const cmp = (a: AudioItem, b: AudioItem) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'added': {
        const aa = a.addedAt ? Date.parse(a.addedAt) : 0;
        const bb = b.addedAt ? Date.parse(b.addedAt) : 0;
        return (aa - bb) * dir;
      }
      case 'duration':
        return ((a.durationMinutes ?? 0) - (b.durationMinutes ?? 0)) * dir;
      case 'title':
        return a.title.localeCompare(b.title) * dir;
      default:
        return 0;
    }
  };

  filteredByDate.sort(cmp);
  return filteredByDate;
}

export function paginate(items: AudioItem[], page: number, perPage: number) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}
