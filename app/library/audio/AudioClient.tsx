"use client";

import React, { startTransition, useEffect, useMemo, useState } from "react";
// icons are used in child components
import EditAudioModal from "../components/EditAudioModal";
import ViewAudioModal from "../components/ViewAudioModal";
// Grid view removed — list view only
import UploadModal from "../components/UploadModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { AudioItem } from "../components/AudioTile";
import AudioTriageBar from "../components/AudioTriageBar";
import AudioToolbar from "../components/AudioToolbar";
import AudioHeader from "./components/AudioHeader";
import AudioList from "./components/AudioList";
import { filterLibrary } from "@/lib/audioFilters";
import { sortAndFilterByDate, paginate } from "@/lib/audioSortPaginate";
import { getApiClient } from "@/lib/api-client";

export default function LibraryAudioClient() {
  const apiClient = getApiClient();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [audios, setAudios] = useState<AudioItem[]>([]);

  type Playlist = { id: string; title?: string; trackIds?: string[]; tracks?: string[]; items?: string[] };
  // Start with an empty playlists array so server and client initial render match.
  // Populate from localStorage on mount to avoid hydration mismatches.
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Column visibility (like Strapi's list view): persisted in localStorage
  const [colsOpen, setColsOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<{ duration: boolean; added: boolean; modified: boolean; addedBy: boolean; size: boolean }>(
    { duration: true, added: false, modified: false, addedBy: false, size: false }
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

    globalThis.addEventListener("storage", handler);
    return () => globalThis.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        const response = await apiClient.listMedia();
        const mapped = response.media.map((item) => ({
          id: item.id,
          title: item.title,
          duration: item.duration,
          durationMinutes: item.durationMinutes,
          category: item.category,
          usageCount: 0,
          spacesCount: 0,
          lastPlayed: undefined,
          isScheduled: false,
          singer: undefined,
          url: item.url,
          size: item.fileSize,
        }));
        startTransition(() => setAudios(mapped));
      } catch (err) {
        console.error("Failed to load media library", err);
        startTransition(() => setAudios([]));
      }
    };

    loadMedia();
  }, [apiClient]);

  // Selected item for list view (used to apply sidebar-like active styling)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // enhanced search: support tokens and fielded queries like `artist:Name`, `playlist:Name`, `title:Name`, `creator:Name`
  const filteredLibrary = useMemo(() => filterLibrary(audios, query, activeCategory, playlists), [audios, query, activeCategory, playlists]);

  const totalCount = audios.length;
  const filteredCount = filteredLibrary.length;

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const perPageOptions = [5, 10, 20, 50];

  // Minimal triage — highly usable essentials only
  const [sortBy, setSortBy] = useState<'added' | 'title' | 'duration'>('added');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'last7' | 'last30' | 'custom'>('all');
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


  const sortedLibrary = useMemo(() => sortAndFilterByDate(filteredLibrary, sortBy, sortDir, dateFilterType, cutoff, customDate, singerFilter), [filteredLibrary, sortBy, sortDir, dateFilterType, cutoff, customDate, singerFilter]);
  // compute unique singers for the singer filter popover
  const singerOptions = useMemo(() => {
    const s = Array.from(new Set(audios.map((a) => a.singer).filter(Boolean).map(String)));
    s.sort((a, b) => a.localeCompare(b));
    return s;
  }, [audios]);

  const playlistOptions = useMemo(() => {
    const p = playlists.map((pl) => ({ id: String(pl.id), title: pl.title ?? `Playlist ${pl.id}` }));
    p.sort((a, b) => a.title.localeCompare(b.title));
    return p;
  }, [playlists]);

  const creatorOptions = useMemo(() => {
    const c = Array.from(new Set(audios.map((a) => a.addedBy).filter(Boolean).map(String)));
    c.sort((a, b) => a.localeCompare(b));
    return c;
  }, [audios]);


  const paginatedLibrary = useMemo(() => paginate(sortedLibrary, page, perPage), [sortedLibrary, page, perPage]);

  // singer is now stored on each audio item as `singer`.

  const handleAudioAction = (action: "play" | "edit" | "delete" | "addToPlaylist", audioId: string) => {
    // Basic UI actions: edit opens modal, delete removes from UI, others log for now
    if (action === "edit") {
      const item = audios.find((a) => a.id === audioId) ?? null;
      if (item) setEditing(item);
      return;
    }

    if (action === "delete") {
      const item = audios.find((a) => a.id === audioId) ?? null;
      if (item) {
        setSelectedAudioForDelete(item);
        setDeleteOpen(true);
      }
      return;
    }

    console.log(`[v0] Audio action: ${action} on ${audioId}`);
  };

  // Edit modal state
  const [editing, setEditing] = useState<AudioItem | null>(null);
  const [viewing, setViewing] = useState<AudioItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAudioForDelete, setSelectedAudioForDelete] = useState<AudioItem | null>(null);

  const saveEdit = (v: { id: string; title: string; singer?: string }) => {
    setAudios((s) => s.map((a) => (a.id === v.id ? { ...a, title: v.title, singer: v.singer ?? a.singer } : a)));
    setEditing(null);
  };

  // deleteEdit removed — deletion handled directly via handleAudioAction

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <AudioHeader
        colsOpen={colsOpen}
        setColsOpen={setColsOpen}
        visibleCols={visibleCols}
        toggleCol={toggleCol}
        setUploadOpen={setUploadOpen}
      />

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

      <div className="flex-1 overflow-auto bg-white">
        <div className="px-6 py-6">
          <AudioList
            items={paginatedLibrary}
            selectedId={selectedId}
            setSelectedId={(id) => setSelectedId(id)}
            onView={(it) => setViewing(it)}
            onEdit={(id) => handleAudioAction("edit", id)}
            onDelete={(id) => handleAudioAction("delete", id)}
            visibleCols={visibleCols}
          />
        </div>
      </div>

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

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={async () => {
          const refreshed = await apiClient.listMedia();
          startTransition(() => {
            setAudios(
              refreshed.media.map((item) => ({
                id: item.id,
                title: item.title,
                duration: item.duration,
                durationMinutes: item.durationMinutes,
                category: item.category,
                usageCount: 0,
                spacesCount: 0,
                lastPlayed: undefined,
                isScheduled: false,
                singer: undefined,
                url: item.url,
                size: item.fileSize,
              })),
            );
          });
        }}
      />
      {/* Edit modal */}
      {editing && (
        <EditAudioModal open={true} initial={{ id: editing.id, title: editing.title, singer: editing.singer }} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}
      {viewing && (
        <ViewAudioModal open={true} item={viewing} onClose={() => setViewing(null)} />
      )}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Audio"
        description={`This will permanently delete "${selectedAudioForDelete?.title}". This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => { setDeleteOpen(false); }}
        onConfirm={async () => {
          try {
            if (selectedAudioForDelete?.id) {
              await apiClient.deleteMedia(selectedAudioForDelete.id);
              const refreshed = await apiClient.listMedia();
              startTransition(() => {
                setAudios(
                  refreshed.media.map((item) => ({
                    id: item.id,
                    title: item.title,
                    duration: item.duration,
                    durationMinutes: item.durationMinutes,
                    category: item.category,
                    usageCount: 0,
                    spacesCount: 0,
                    lastPlayed: undefined,
                    isScheduled: false,
                    singer: undefined,
                    url: item.url,
                    size: item.fileSize,
                  })),
                );
              });
            }
          } catch (err) {
            console.error("Failed to delete audio", err);
          }
          setDeleteOpen(false);
          setSelectedAudioForDelete(null);
        }}
      />
    </div>
  );
}

