"use client";

import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { RowPlaybackState } from "./components/AudioListItem";
import { filterLibrary } from "@/lib/audioFilters";
import { sortAndFilterByDate, paginate } from "@/lib/audioSortPaginate";
import { getApiClient } from "@/lib/api-client";
import { fetchMedia } from "@/lib/query-fetchers";
import { queryKeys } from "@/lib/query-keys";
import { parseMediaTags } from "@/lib/media-tags";
import type { MediaInfo } from "@/types/api";

function mapMediaToAudioItem(item: MediaInfo): AudioItem {
  const { baseCategory, tags } = parseMediaTags(item.category);
  return {
    id: item.id,
    title: item.title,
    duration: item.duration,
    durationMinutes: item.durationMinutes,
    category: baseCategory,
    tags: item.tags ?? tags,
    usageCount: 0,
    spacesCount: 0,
    lastPlayed: undefined,
    isScheduled: false,
    singer: undefined,
    url: item.url,
    size: item.fileSize,
  };
}

export default function LibraryAudioClient() {
  const apiClient = getApiClient();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
    const loadPlaylists = async () => {
      try {
        const res = await apiClient.listPlaylists();
        const mapped = (res.playlists ?? []).map((p) => ({
          id: String(p.id),
          title: String(p.title ?? "Untitled"),
          trackIds: p.tracks?.map((t) => t.mediaId) ?? [],
        }));
        startTransition(() => setPlaylists(mapped));
      } catch {
        startTransition(() => setPlaylists([]));
      }
    };
    void loadPlaylists();
  }, [apiClient]);

  const mediaQuery = useQuery({
    queryKey: queryKeys.media(),
    queryFn: () => fetchMedia(),
  });

  const updateMediaMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      apiClient.updateMedia(id, { title }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.media() });
    },
  });

  useEffect(() => {
    if (mediaQuery.data) {
      startTransition(() =>
        setAudios(mediaQuery.data.map(mapMediaToAudioItem))
      );
    }
    setLoading(mediaQuery.isPending);
  }, [mediaQuery.data, mediaQuery.isPending]);

  // Selected item for list view (used to apply sidebar-like active styling)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Global HTML5 player — one active stream at a time with native timeupdate tracking
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tickRafRef = useRef<number | null>(null);
  const activeTrackIdRef = useRef<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [errorTrackId, setErrorTrackId] = useState<string | null>(null);

  useEffect(() => {
    activeTrackIdRef.current = activeTrackId;
  }, [activeTrackId]);

  useEffect(() => {
    if (!streamError) return;
    const timer = window.setTimeout(() => {
      setStreamError(null);
      setErrorTrackId(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [streamError]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const scheduleTimeUpdate = () => {
      if (tickRafRef.current != null) return;
      tickRafRef.current = window.requestAnimationFrame(() => {
        tickRafRef.current = null;
        setCurrentTime(audio.currentTime);
      });
    };

    const syncDuration = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setActiveTrackId(null);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    const onError = () => {
      setStreamError("Unable to load or play this audio stream");
      setErrorTrackId(activeTrackIdRef.current);
      setIsPlaying(false);
      setActiveTrackId(null);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", scheduleTimeUpdate);
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      if (tickRafRef.current != null) {
        window.cancelAnimationFrame(tickRafRef.current);
      }
      audio.removeEventListener("timeupdate", scheduleTimeUpdate);
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const handlePlayToggle = useCallback(async (item: AudioItem) => {
    const url = item.url?.trim();
    if (!url) {
      setStreamError("No audio URL available for this track");
      setErrorTrackId(item.id);
      setActiveTrackId(item.id);
      setIsPlaying(false);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (activeTrackId === item.id && isPlaying) {
      audio.pause();
      return;
    }

    setStreamError(null);
    setErrorTrackId(null);

    if (activeTrackId !== item.id) {
      audio.src = url;
      setActiveTrackId(item.id);
      setCurrentTime(0);
      setDuration(0);
    }

    try {
      await audio.play();
    } catch {
      setStreamError("Playback blocked or stream unavailable");
      setErrorTrackId(item.id);
      setActiveTrackId(item.id);
      setIsPlaying(false);
    }
  }, [activeTrackId, isPlaying]);

  const getPlaybackForRow = useCallback(
    (id: string): RowPlaybackState => {
      const isActive = activeTrackId === id || errorTrackId === id;
      const progressPercent =
        isActive && duration > 0
          ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
          : 0;
      return {
        isActive,
        isPlaying: isActive && isPlaying,
        currentTime: isActive ? currentTime : 0,
        duration: isActive ? duration : 0,
        progressPercent,
        streamError: errorTrackId === id ? streamError : null,
      };
    },
    [activeTrackId, errorTrackId, isPlaying, currentTime, duration, streamError]
  );

  // enhanced search: support tokens and fielded queries like `artist:Name`, `playlist:Name`, `title:Name`, `creator:Name`
  const filteredLibrary = useMemo(() => filterLibrary(audios, query, activeCategory, playlists), [audios, query, activeCategory, playlists]);

  const totalCount = audios.length;
  const filteredCount = filteredLibrary.length;

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const perPageOptions = [5, 10, 20, 50];

  // Minimal triage — highly usable essentials only
  const [sortBy, setSortBy] = useState<'added' | 'title' | 'duration'>('title');
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
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);

  const saveEdit = async (v: { id: string; title: string; singer?: string }) => {
    try {
      const res = await updateMediaMutation.mutateAsync({
        id: v.id,
        title: v.title.trim(),
      });
      setAudios((s) =>
        s.map((a) =>
          a.id === v.id
            ? {
                ...a,
                title: res.media.title,
                singer: v.singer ?? a.singer,
              }
            : a
        )
      );
      setSaveNotice("Audio updated successfully.");
      setEditing(null);
    } catch (err) {
      console.error("Failed to update audio", err);
      setSaveNotice("Could not save changes. Please try again.");
    }
  };

  // deleteEdit removed — deletion handled directly via handleAudioAction

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#121214]">
      {saveNotice && (
        <div className="fixed right-6 bottom-6 z-50 max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-md">
          {saveNotice}
        </div>
      )}
      <AudioHeader
        colsOpen={colsOpen}
        setColsOpen={setColsOpen}
        visibleCols={visibleCols}
        toggleCol={toggleCol}
        setUploadOpen={setUploadOpen}
      />

      <div className="px-6 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#121214]">
        <AudioToolbar
          mode="search"
          query={query}
          setQuery={setQuery}
          filteredCount={filteredCount}
          totalCount={totalCount}
          page={page}
          setPage={(n) => startTransition(() => setPage(n))}
          perPage={perPage}
          setPerPage={setPerPage}
          perPageOptions={perPageOptions}
          totalPages={totalPages}
          placeholder="Search by title, tag:Lobby, playlist, artist…"
        />
      </div>

      <AudioTriageBar
        activeCategory={activeCategory}
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

      <div className="px-6 py-6">
        <div className="bg-white dark:bg-zinc-900/60 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col min-h-[calc(100vh-220px)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
              <AudioList
                items={paginatedLibrary}
                selectedId={selectedId}
                setSelectedId={(id) => setSelectedId(id)}
                onView={(it) => setViewing(it)}
                onEdit={(id) => handleAudioAction("edit", id)}
                onDelete={(id) => handleAudioAction("delete", id)}
                visibleCols={visibleCols}
                loading={loading}
                playbackById={getPlaybackForRow}
                onPlayToggle={handlePlayToggle}
              />
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-zinc-900/60 border-t border-gray-100 dark:border-zinc-800 z-10">
            <AudioToolbar
              mode="pagination"
              query={query}
              setQuery={setQuery}
              filteredCount={filteredCount}
              totalCount={totalCount}
              page={page}
              setPage={(n) => startTransition(() => setPage(n))}
              perPage={perPage}
              setPerPage={(n) => {
                setPerPage(n);
              }}
              perPageOptions={perPageOptions}
              totalPages={totalPages}
            />
          </div>
        </div>
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={async () => {
          const refreshed = await apiClient.listMedia();
          startTransition(() => {
            setAudios(refreshed.media.map(mapMediaToAudioItem));
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
                setAudios(refreshed.media.map(mapMediaToAudioItem));
              });
            }
          } catch (err) {
            console.error("Failed to delete audio", err);
          }
          setDeleteOpen(false);
          setSelectedAudioForDelete(null);
        }}
      />
      <audio ref={audioRef} preload="metadata" className="sr-only" aria-hidden />
    </div>
  );
}
