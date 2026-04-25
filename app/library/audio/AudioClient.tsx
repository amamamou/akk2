"use client";

import React, { startTransition, useEffect, useMemo, useState } from "react";
import { Plus, FileAudio, Edit, Trash, Eye, List } from "lucide-react";
import AudioVisual from "../components/AudioVisual";
import EditAudioModal from "../components/EditAudioModal";
import ViewAudioModal from "../components/ViewAudioModal";
// Grid view removed — list view only
import UploadModal from "../components/UploadModal";
import type { AudioItem } from "../components/AudioTile";
import { cn } from "@/utils/cn";
import AudioTriageBar from "../components/AudioTriageBar";
import AudioToolbar from "../components/AudioToolbar";

const initialLibrary: AudioItem[] = [
  { id: "a1", title: "Morning Flow", duration: "60m", durationMinutes: 60, category: "Yoga", usageCount: 24, spacesCount: 3, lastPlayed: "today", isScheduled: true, singer: "Lila Blue" },
  { id: "a2", title: "Deep Focus", duration: "120m", durationMinutes: 120, category: "Meditation", usageCount: 18, spacesCount: 2, lastPlayed: "2 days ago", isScheduled: true, singer: "Deep Focusors" },
  { id: "a3", title: "Lobby Ambience Loop", duration: "180m", durationMinutes: 180, category: "Lobby", usageCount: 5, spacesCount: 1, lastPlayed: undefined, isScheduled: false, singer: "Lobby Ensemble" },
  { id: "a4", title: "Upbeat Playlist", duration: "120m", durationMinutes: 120, category: "Retail", usageCount: 12, spacesCount: 2, lastPlayed: "yesterday", isScheduled: true, singer: "Upbeat Co." },
  { id: "a5", title: "Nature Walk", duration: "45m", durationMinutes: 45, category: "Meditation", usageCount: 3, spacesCount: 1, lastPlayed: "1 week ago", isScheduled: false, singer: "Nature Choir" },
  { id: "a6", title: "Evening Rest", duration: "90m", durationMinutes: 90, category: "Yoga", usageCount: 14, spacesCount: 2, lastPlayed: "3 days ago", isScheduled: true, singer: "Evening Strings" },
];

export default function LibraryAudioClient() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [audios, setAudios] = useState<AudioItem[]>(initialLibrary);

  type Playlist = { id: string; title?: string; trackIds?: string[]; tracks?: string[]; items?: string[] };
  // Start with an empty playlists array so server and client initial render match.
  // Populate from localStorage on mount to avoid hydration mismatches.
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Column visibility (like Strapi's list view): persisted in localStorage
  const [colsOpen, setColsOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<{ duration: boolean; added: boolean; modified: boolean; addedBy: boolean }>(
    { duration: true, added: false, modified: false, addedBy: false }
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aa_audio_columns");
      if (raw) {
        const parsed = JSON.parse(raw);
        startTransition(() => setVisibleCols((s) => ({ ...s, ...parsed })));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCol = (k: keyof typeof visibleCols) => {
    setVisibleCols((s) => {
      const next = { ...s, [k]: !s[k] };
      try {
        localStorage.setItem("aa_audio_columns", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aa_playlists");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) startTransition(() => setPlaylists(parsed as Playlist[]));
      }
    } catch {
      // ignore malformed data
    }

    const handler = (e: StorageEvent) => {
      if (e.key === "aa_playlists") {
        try {
          if (!e.newValue) {
            startTransition(() => setPlaylists([]));
            return;
          }
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) startTransition(() => setPlaylists(parsed as Playlist[]));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Selected item for list view (used to apply sidebar-like active styling)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // enhanced search: support tokens and fielded queries like `artist:Name`, `playlist:Name`, `title:Name`, `creator:Name`
  const filteredLibrary = useMemo(() => {
    const normalizedQuery = query.trim();
    const tokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

    // build a map from audio id -> playlist titles for quick matching
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

    return audios.filter((item: AudioItem) => {
      // playlist filter
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

      // For each token, support field:value syntax
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
          // unknown field — fallback to general match
          const haystack = `${item.title} ${item.category} ${item.duration} ${item.singer ?? ''} ${item.addedBy ?? ''} ${(audioToPlaylists[item.id] ?? []).join(' ')}`.toLowerCase();
          return haystack.includes(tok.toLowerCase());
        }

        // general token: check across multiple fields
        const hay = `${item.title} ${item.category} ${item.duration} ${item.singer ?? ''} ${item.addedBy ?? ''} ${(audioToPlaylists[item.id] ?? []).join(' ')}`.toLowerCase();
        return hay.includes(tok.toLowerCase());
      });
    });
  }, [query, activeCategory, playlists, audios]);

  const totalCount = audios.length;
  const filteredCount = filteredLibrary.length;

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const perPageOptions = [5, 10, 20, 50];

  // Minimal triage — highly usable essentials only
  const [sortBy, setSortBy] = useState<'added' | 'title' | 'duration'>('added');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'last7'>('all');
  // custom date selection
  const [customDate, setCustomDate] = useState<string | null>(null);
  // artist filter (compact searchable popover)
  const [singerFilter, setSingerFilter] = useState<string | null>(null);
  const [singerOpen, setSingerOpen] = useState(false);
  const [singerQuery, setSingerQuery] = useState('');
  // playlist filter (compact searchable popover)
  const [playlistFilter, setPlaylistFilter] = useState<string | null>(null);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playlistQuery, setPlaylistQuery] = useState('');
  // creator filter (compact searchable popover)
  const [creatorFilter, setCreatorFilter] = useState<string | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorQuery, setCreatorQuery] = useState('');
  // bottom composite filter removed per user request
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = customDate ? new Date(customDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthDays = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const startDay = first.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; date?: string }> = [];
    // fill leading blanks
    for (let i = 0; i < startDay; i++) cells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = new Date(year, month, d).toISOString().slice(0, 10);
      cells.push({ day: d, date: iso });
    }
    return cells;
  };

  const formatDateLabel = (iso: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  // hydrate minimal triage prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem('aa_audio_triage');
      if (raw) {
        const parsed = JSON.parse(raw);
        startTransition(() => {
          if (parsed.sortBy) setSortBy(parsed.sortBy);
          if (parsed.sortDir) setSortDir(parsed.sortDir);
          if (parsed.dateFilterType) setDateFilterType(parsed.dateFilterType);
          if (parsed.customDate) setCustomDate(parsed.customDate);
          if (parsed.singerFilter) setSingerFilter(parsed.singerFilter);
          if (parsed.playlistFilter) setPlaylistFilter(parsed.playlistFilter);
          if (parsed.creatorFilter) setCreatorFilter(parsed.creatorFilter);
        });
      }
    } catch {}
  }, []);

  // persist minimal triage prefs whenever settings change
  useEffect(() => {
    try {
      const cur: { sortBy: string; sortDir: string; dateFilterType: string; customDate: string | null; singerFilter?: string | null } = {
        sortBy,
        sortDir,
        dateFilterType,
        customDate,
      };
      if (singerFilter) cur.singerFilter = singerFilter;
      // include playlistFilter when present
      const curTyped: { sortBy: string; sortDir: string; dateFilterType: string; customDate: string | null; singerFilter?: string | null; playlistFilter?: string | null; creatorFilter?: string | null } = {
        ...cur,
      };
      if (playlistFilter) curTyped.playlistFilter = playlistFilter;
      if (creatorFilter) curTyped.creatorFilter = creatorFilter;
      localStorage.setItem('aa_audio_triage', JSON.stringify(curTyped));
    } catch {}
  }, [sortBy, sortDir, dateFilterType, customDate, singerFilter, playlistFilter, creatorFilter]);

  // cutoff timestamp used for date range checks — computed in effect to avoid calling Date.now during render
  const [cutoff, setCutoff] = useState<number | null>(null);
  useEffect(() => {
    startTransition(() => setCutoff(Date.now()));
  }, [dateFilterType]);

  // note: unplayed preset removed; customDate controlled separately

  useEffect(() => {
    // Reset to first page when filters or audios change
    startTransition(() => setPage(1));
  }, [query, activeCategory, audios]);

  // Reset to first page when singer filter changes
  useEffect(() => {
    startTransition(() => setPage(1));
  }, [singerFilter]);

  // Reset to first page when playlist filter changes
  useEffect(() => {
    startTransition(() => setPage(1));
  }, [playlistFilter]);

  // Reset to first page when creator filter changes
  useEffect(() => {
    startTransition(() => setPage(1));
  }, [creatorFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / perPage));


  const sortedLibrary = useMemo(() => {
    // apply date filtering (based on addedAt) then sorting
    const arr = filteredLibrary.slice().filter((t) => {
      // apply singer filter if active
      if (singerFilter) {
        if (!t.singer) return false;
        if (t.singer.toLowerCase() !== singerFilter.toLowerCase()) return false;
      }
      if (dateFilterType === 'all') return true;
      const raw = t.addedAt ?? null;
      if (!raw) return false;
      const ts = Date.parse(raw);
      if (Number.isNaN(ts)) return false;
      // only 'last7' is supported in the minimal triage
      if (dateFilterType === 'last7') return cutoff ? ts >= cutoff - 7 * 24 * 3600 * 1000 : true;
      return true;
    });

    // apply customDate if provided (include items added on or after the selected day)
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
  }, [filteredLibrary, sortBy, sortDir, dateFilterType, cutoff, customDate, singerFilter]);
  // compute unique singers for the singer filter popover
  const singerOptions = useMemo(() => {
    const s = Array.from(new Set(audios.map((a) => a.singer).filter(Boolean).map((x) => String(x))));
    s.sort((a, b) => a.localeCompare(b));
    return s;
  }, [audios]);

  const playlistOptions = useMemo(() => {
    const p = playlists.map((pl) => ({ id: String(pl.id), title: pl.title ?? `Playlist ${pl.id}` }));
    p.sort((a, b) => a.title.localeCompare(b.title));
    return p;
  }, [playlists]);

  const creatorOptions = useMemo(() => {
    const c = Array.from(new Set(audios.map((a) => a.addedBy).filter(Boolean).map((x) => String(x))));
    c.sort((a, b) => a.localeCompare(b));
    return c;
  }, [audios]);


  const paginatedLibrary = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedLibrary.slice(start, start + perPage);
  }, [sortedLibrary, page, perPage]);

  // singer is now stored on each audio item as `singer`.

  const handleAudioAction = (action: "play" | "edit" | "delete" | "addToPlaylist", audioId: string) => {
    // Basic UI actions: edit opens modal, delete removes from UI, others log for now
    if (action === "edit") {
      const item = audios.find((a) => a.id === audioId) ?? null;
      if (item) setEditing(item);
      return;
    }

    if (action === "delete") {
      setAudios((s) => s.filter((a) => a.id !== audioId));
      return;
    }

    console.log(`[v0] Audio action: ${action} on ${audioId}`);
  };

  // Edit modal state
  const [editing, setEditing] = useState<AudioItem | null>(null);
  const [viewing, setViewing] = useState<AudioItem | null>(null);

  const saveEdit = (v: { id: string; title: string; singer?: string }) => {
    setAudios((s) => s.map((a) => (a.id === v.id ? { ...a, title: v.title, singer: v.singer ?? a.singer } : a)));
    setEditing(null);
  };

  // deleteEdit removed — deletion handled directly via handleAudioAction

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-gray-200">
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">All Audio</h1>
            <p className="mt-1 text-sm text-gray-500">Browse and manage your complete audio library</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setColsOpen((s) => !s)}
                className="inline-flex items-center gap-2 rounded-md bg-white text-gray-700 px-3 py-2 text-sm font-medium border border-gray-200 hover:bg-gray-50"
              >
                <List size={16} />
                <span className="hidden sm:inline">Columns</span>
              </button>

              {colsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-50">
                  <div className="flex flex-col gap-2 text-sm text-gray-700">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={visibleCols.duration} onChange={() => toggleCol("duration")} />
                      <span>Duration</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={visibleCols.added} onChange={() => toggleCol("added")} />
                      <span>Added</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={visibleCols.modified} onChange={() => toggleCol("modified")} />
                      <span>Modified</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={visibleCols.addedBy} onChange={() => toggleCol("addedBy")} />
                      <span>Added by</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-4 py-2 text-sm font-medium hover:bg-[#E7E7E7]"
            >
              <Plus size={16} />
              <span>New audio</span>
            </button>
          </div>
        </div>

        {/* Compact triage bar (extracted) */}
        <AudioTriageBar
          sortBy={sortBy}
          sortDir={sortDir}
          sortOpen={sortOpen}
          setSortOpen={setSortOpen}
          setSortBy={setSortBy}
          setSortDir={setSortDir}

          singerFilter={singerFilter}
          singerOpen={singerOpen}
          singerQuery={singerQuery}
          singerOptions={singerOptions}
          setSingerFilter={setSingerFilter}
          setSingerOpen={setSingerOpen}
          setSingerQuery={setSingerQuery}

          datePickerOpen={datePickerOpen}
          customDate={customDate}
          dateFilterType={dateFilterType}
          calendarMonth={calendarMonth}
          setCalendarMonth={setCalendarMonth}
          setDatePickerOpen={setDatePickerOpen}
          setCustomDate={setCustomDate}
          setDateFilterType={setDateFilterType}
          monthDays={monthDays}
          formatDateLabel={formatDateLabel}

          playlistFilter={playlistFilter}
          playlistOpen={playlistOpen}
          playlistQuery={playlistQuery}
          playlistOptions={playlistOptions}
          setPlaylistFilter={setPlaylistFilter}
          setPlaylistOpen={setPlaylistOpen}
          setPlaylistQuery={setPlaylistQuery}
          setActiveCategory={setActiveCategory}

          creatorFilter={creatorFilter}
          creatorOpen={creatorOpen}
          creatorQuery={creatorQuery}
          creatorOptions={creatorOptions}
          setCreatorFilter={setCreatorFilter}
          setCreatorOpen={setCreatorOpen}
          setCreatorQuery={setCreatorQuery}
        />
  </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="px-6 py-6">
          {filteredLibrary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileAudio size={48} className="text-gray-300" />
              <h2 className="mt-6 text-lg font-semibold">No audio found</h2>
            </div>
          ) : (
            <div className="space-y-2">
                    {paginatedLibrary.map((t: AudioItem) => {
                    const isSelected = selectedId === t.id;
                    return (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
      
                        aria-pressed={isSelected}
                        onClick={() => setSelectedId((s) => (s === t.id ? null : t.id))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId((s) => (s === t.id ? null : t.id));
                          }
                        }}
                        className={cn(
                          "group grid grid-cols-[48px_1fr_96px] gap-4 items-center p-3 rounded-lg border border-gray-100 bg-white transition-all duration-150",
                          "transform hover:shadow-lg hover:-translate-y-0.5",
                          isSelected ? "bg-gray-50" : "hover:bg-gray-50",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-400"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center rounded-lg w-12 h-12 bg-transparent",
                          "group-hover:scale-105 transition-transform"
                        )}>
                          <AudioVisual size={36} color="#A473FF" />
                        </div>

                        <div className="min-w-0 relative">
                          <div className="text-sm font-medium text-gray-900 truncate">{t.title}</div>
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">{t.singer ?? "Unknown Artist"}</div>
                        </div>

                        <div className="flex items-center justify-end gap-4">
                          {visibleCols.duration && <div className="text-right text-sm text-gray-500">{t.duration}</div>}
                          {visibleCols.added && <div className="text-right text-sm text-gray-500">{t.addedAt ?? "-"}</div>}
                          {visibleCols.modified && <div className="text-right text-sm text-gray-500">{t.modifiedAt ?? "-"}</div>}
                          {visibleCols.addedBy && (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
                                {(t.addedBy ?? "U").toString().split(" ").map((s)=>s.charAt(0)).slice(0,2).join("")}
                              </div>
                              <div className="text-sm text-gray-600">{t.addedBy ?? "Unknown"}</div>
                            </div>
                          )}

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewing(t);
                              }}
                              title="View"
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAudioAction("edit", t.id);
                              }}
                              title="Edit"
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleAudioAction("delete", t.id); }} title="Delete" className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar (extracted) */}
      <AudioToolbar
        query={query}
        setQuery={setQuery}
        filteredCount={filteredCount}
        totalCount={totalCount}
        page={page}
        setPage={(n) => startTransition(() => setPage(n))}
        perPage={perPage}
        setPerPage={(n) => { setPerPage(n); }}
        perPageOptions={perPageOptions}
        totalPages={totalPages}
      />

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={(files) => console.log("[v0] Files uploaded:", files)} />
      {/* Edit modal */}
      {editing && (
        <EditAudioModal open={true} initial={{ id: editing.id, title: editing.title, singer: editing.singer }} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}
      {viewing && (
        <ViewAudioModal open={true} item={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

