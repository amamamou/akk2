"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AlertCircle, Check } from "lucide-react";
import EditAudioModal from "../components/EditAudioModal";
import type { AudioItem } from "../components/AudioTile";
import { getApiClient } from "@/lib/api-client";
import { fetchMedia } from "@/lib/query-fetchers";
import { queryKeys } from "@/lib/query-keys";
import { parseMediaArtist, parseMediaTags } from "@/lib/media-tags";
import {
  loadSingerOverrides,
} from "@/lib/audio-singer-overrides";
import type { MediaInfo } from "@/types/api";
import {
  dashboardContainerClass,
  dashboardPageClass,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import PlaylistsPagination from "../playlists/components/PlaylistsPagination";
import PreviewPlayer from "../playlists/[id]/components/PreviewPlayer";
import type { PreviewPlayerState } from "../playlists/[id]/components/playlist-detail-types";
import AudioHero from "./components/AudioHero";
import AudioToolbar, {
  AudioResultsSummary,
  AudioSearch,
  type AudioCategoryFilter,
} from "./components/AudioToolbar";
import AudioListRow, { type AudioRowPreviewState } from "./components/AudioListRow";
import AudioListPanel from "./components/AudioListPanel";
import AudioEmptyState from "./components/AudioEmptyState";
import AudioPageSkeleton from "./components/AudioPageSkeleton";
import DeleteAudioModal from "./components/DeleteAudioModal";
import { useAudioDeleteModal } from "./hooks/useAudioDeleteModal";
import {
  getCategoryOptions,
  matchesSizeFilter,
  resolveArtistLabel,
  searchAudioItems,
  sortAudioItems,
  type AudioSizeFilterKey,
  type AudioSortKey,
} from "./lib/audio-library-utils";

function mapMediaToAudioItem(
  item: MediaInfo,
  singerOverrides: Record<string, string> = {}
): AudioItem {
  const { baseCategory, tags } = parseMediaTags(item.category);
  const singer =
    singerOverrides[item.id]?.trim() ||
    item.singer?.trim() ||
    item.artist?.trim() ||
    parseMediaArtist(item.category);

  const addedAt =
    item.addedAt ??
    item.createdAt ??
    item.created_at ??
    undefined;
  const modifiedAt =
    item.modifiedAt ??
    item.updatedAt ??
    item.updated_at ??
    addedAt;

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
    singer,
    url: item.url,
    size: item.fileSize,
    addedAt,
    modifiedAt,
  };
}

export default function LibraryAudioClient() {
  const apiClient = getApiClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AudioCategoryFilter>("all");
  const [sizeFilter, setSizeFilter] = useState<AudioSizeFilterKey>("all");
  const [sort, setSort] = useState<AudioSortKey>("updated-desc");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const perPageOptions = [5, 10, 20, 50];

  const [singerOverrides] = useState<Record<string, string>>(() => loadSingerOverrides());

  const mediaQuery = useQuery({
    queryKey: queryKeys.media(),
    queryFn: () => fetchMedia(),
  });

  const audios = useMemo(
    () => (mediaQuery.data ?? []).map((item) => mapMediaToAudioItem(item, singerOverrides)),
    [mediaQuery.data, singerOverrides]
  );

  const loadOrder = useMemo(() => {
    const order = new Map<string, number>();
    (mediaQuery.data ?? []).forEach((item, index) => {
      order.set(item.id, index);
    });
    return order;
  }, [mediaQuery.data]);

  const loading = mediaQuery.isPending && !mediaQuery.data;

  const updateMediaMutation = useMutation({
    mutationFn: ({
      id,
      title,
      artist,
    }: {
      id: string;
      title: string;
      artist?: string;
    }) => apiClient.updateMedia(id, { title, artist }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.media() });
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.media() });
      await mediaQuery.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh audio");
    } finally {
      setRefreshing(false);
    }
  }, [mediaQuery, queryClient]);

  const categoryOptions = useMemo(() => getCategoryOptions(audios), [audios]);

  const filteredAudios = useMemo(() => {
    let items = searchAudioItems(audios, query);
    if (category !== "all") {
      items = items.filter((a) => a.category === category);
    }
    items = items.filter((a) => matchesSizeFilter(a.size, sizeFilter));
    return sortAudioItems(items, sort, loadOrder);
  }, [audios, query, category, sizeFilter, sort, loadOrder]);

  const totalCount = audios.length;
  const filteredCount = filteredAudios.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / perPage));
  const hasActiveFilters =
    query.trim().length > 0 || category !== "all" || sizeFilter !== "all";

  useEffect(() => {
    setPage(1);
  }, [query, category, sizeFilter, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedAudios = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredAudios.slice(start, start + perPage);
  }, [filteredAudios, page, perPage]);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setSizeFilter("all");
  };

  const goToUpload = useCallback(() => {
    router.push("/library/audio/upload");
  }, [router]);

  const showEmptyNoAudio = !loading && totalCount === 0;
  const showEmptyNoResults = !loading && totalCount > 0 && filteredCount === 0;

  // --- Playback (Playlist Detail pattern) ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tickRafRef = useRef<number | null>(null);
  const activeTrackIdRef = useRef<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [playbackRevision, setPlaybackRevision] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [errorTrackId, setErrorTrackId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.85);

  const setActiveTrack = useCallback((trackId: string | null) => {
    activeTrackIdRef.current = trackId;
    setActiveTrackId(trackId);
  }, []);

  const syncPlaybackState = useCallback(() => {
    setPlaybackRevision((n) => n + 1);
  }, []);

  const isAudioPlaying = useCallback(() => {
    const audio = audioRef.current;
    return (
      activeTrackIdRef.current != null &&
      audio != null &&
      !audio.paused &&
      !audio.ended
    );
  }, []);

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
        syncPlaybackState();
      });
    };

    const syncDuration = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const onEnded = () => {
      setActiveTrack(null);
      setCurrentTime(0);
      audio.currentTime = 0;
      syncPlaybackState();
    };

    const onError = () => {
      setStreamError("Unable to load or play this audio stream");
      setErrorTrackId(activeTrackIdRef.current);
      syncPlaybackState();
    };

    audio.addEventListener("timeupdate", scheduleTimeUpdate);
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("play", syncPlaybackState);
    audio.addEventListener("playing", syncPlaybackState);
    audio.addEventListener("pause", syncPlaybackState);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      if (tickRafRef.current != null) {
        window.cancelAnimationFrame(tickRafRef.current);
      }
      audio.removeEventListener("timeupdate", scheduleTimeUpdate);
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("play", syncPlaybackState);
      audio.removeEventListener("playing", syncPlaybackState);
      audio.removeEventListener("pause", syncPlaybackState);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [setActiveTrack, syncPlaybackState]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  const stopPreview = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setActiveTrack(null);
    setCurrentTime(0);
    setDuration(0);
    setStreamError(null);
    setErrorTrackId(null);
    syncPlaybackState();
  }, [setActiveTrack, syncPlaybackState]);

  const handlePreviewLaunch = useCallback(
    async (item: AudioItem) => {
      if (activeTrackIdRef.current === item.id) return;

      const url = item.url?.trim();
      if (!url) {
        setStreamError("No audio URL available for this file");
        setErrorTrackId(item.id);
        setActiveTrack(item.id);
        syncPlaybackState();
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      setStreamError(null);
      setErrorTrackId(null);
      audio.src = url;
      setActiveTrack(item.id);
      setCurrentTime(0);
      setDuration(0);

      try {
        await audio.play();
        syncPlaybackState();
      } catch {
        setStreamError("Playback blocked or stream unavailable");
        setErrorTrackId(item.id);
        setActiveTrack(item.id);
        syncPlaybackState();
      }
    },
    [setActiveTrack, syncPlaybackState]
  );

  const handlePreviewPlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || activeTrackIdRef.current == null) return;
    if (isAudioPlaying()) {
      audio.pause();
    } else {
      void audio.play().catch(() => {
        setStreamError("Playback blocked or stream unavailable");
      });
    }
    syncPlaybackState();
  }, [isAudioPlaying, syncPlaybackState]);

  const handlePreviewSeek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio || activeTrackIdRef.current == null) return;
      audio.currentTime = Math.max(0, Math.min(time, duration || audio.duration || 0));
      setCurrentTime(audio.currentTime);
      syncPlaybackState();
    },
    [duration, syncPlaybackState]
  );

  const handleVolumeChange = useCallback((next: number) => {
    setVolume(next);
  }, []);

  const getPreviewForRow = useCallback(
    (id: string): AudioRowPreviewState | undefined => {
      const isPreviewing = activeTrackId === id || errorTrackId === id;
      if (!isPreviewing) return undefined;
      return {
        isPreviewing: true,
        isPlaying: activeTrackId === id && isAudioPlaying(),
        streamError: errorTrackId === id ? streamError : null,
      };
    },
    [activeTrackId, errorTrackId, isAudioPlaying, playbackRevision, streamError]
  );

  const previewPlayerState = useMemo((): PreviewPlayerState | null => {
    if (!activeTrackId) return null;
    const item = audios.find((a) => a.id === activeTrackId);
    if (!item) return null;

    const dur = duration > 0 ? duration : 0;
    const progressPercent =
      dur > 0 ? Math.min(100, (currentTime / dur) * 100) : 0;

    return {
      trackTitle: item.title,
      trackArtist: resolveArtistLabel(item.singer),
      isPlaying: isAudioPlaying(),
      currentTime,
      duration: dur,
      progressPercent,
      streamError: errorTrackId === activeTrackId ? streamError : null,
    };
  }, [
    activeTrackId,
    audios,
    currentTime,
    duration,
    errorTrackId,
    isAudioPlaying,
    playbackRevision,
    streamError,
  ]);

  // --- Edit / delete ---
  const [editing, setEditing] = useState<AudioItem | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const playlistsQuery = useQuery({
    queryKey: queryKeys.playlists(),
    queryFn: async () => {
      const response = await apiClient.listPlaylists();
      return response.playlists;
    },
    enabled: editing !== null,
  });

  const playlistMembership = useMemo(() => {
    const byMediaId = new Map<string, { playlistId: string; itemId: string }>();
    for (const playlist of playlistsQuery.data ?? []) {
      for (const track of playlist.tracks ?? []) {
        byMediaId.set(track.mediaId, { playlistId: playlist.id, itemId: track.id });
      }
    }
    return byMediaId;
  }, [playlistsQuery.data]);

  const playlistOptions = useMemo(
    () =>
      (playlistsQuery.data ?? []).map((playlist) => ({
        id: playlist.id,
        name: playlist.title,
      })),
    [playlistsQuery.data]
  );

  const {
    audioToDelete,
    deleteOpen,
    deleteLoading,
    requestDelete,
    closeDeleteModal,
    confirmDelete,
  } = useAudioDeleteModal({
    apiClient,
    queryClient,
    activeTrackId,
    stopPreview,
    setError,
    setSuccessToast,
  });

  useEffect(() => {
    if (!successToast) return;
    const timer = window.setTimeout(() => setSuccessToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [successToast]);

  const saveEdit = async (v: {
    id: string;
    title: string;
    singer?: string;
    playlistId?: string | null;
  }) => {
    try {
      const previous = playlistMembership.get(v.id);
      const nextPlaylistId = v.playlistId ?? null;
      const previousPlaylistId = previous?.playlistId ?? null;

      await updateMediaMutation.mutateAsync({
        id: v.id,
        title: v.title.trim(),
        artist: v.singer?.trim() ?? "",
      });

      if (nextPlaylistId !== previousPlaylistId) {
        if (previous?.playlistId && previous.itemId) {
          await apiClient.removePlaylistItem(previous.playlistId, previous.itemId);
        }
        if (nextPlaylistId) {
          await apiClient.addPlaylistItem(nextPlaylistId, { mediaId: v.id });
        }
        await queryClient.invalidateQueries({ queryKey: queryKeys.playlists() });
        if (previousPlaylistId) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.playlist(previousPlaylistId) });
        }
        if (nextPlaylistId) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.playlist(nextPlaylistId) });
        }
      }

      setSuccessToast("Audio updated");
      setEditing(null);
    } catch {
      setError("Could not save changes. Please try again.");
      throw new Error("Failed to save audio");
    }
  };

  return (
    <div className={dashboardPageClass}>
      {successToast && (
        <div
          role="status"
          className={cn(
            "fixed right-6 z-50 flex max-w-sm items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg dark:border-emerald-900/40 dark:bg-emerald-950/80 dark:text-emerald-100",
            previewPlayerState ? "bottom-28" : "bottom-6"
          )}
        >
          <Check size={16} strokeWidth={2.5} />
          {successToast}
        </div>
      )}

      <div className={cn(dashboardContainerClass, previewPlayerState && "pb-28")}>
        {loading ? (
          <AudioPageSkeleton perPage={perPage} />
        ) : (
          <>
            <AudioHero
              onUploadClick={goToUpload}
              searchSlot={<AudioSearch query={query} setQuery={setQuery} />}
            />

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!showEmptyNoAudio && (
              <AudioToolbar
                category={category}
                setCategory={setCategory}
                categoryOptions={categoryOptions}
                sizeFilter={sizeFilter}
                setSizeFilter={setSizeFilter}
                sort={sort}
                setSort={setSort}
                onClearFilters={clearFilters}
                onRefresh={() => void handleRefresh()}
                refreshing={refreshing}
                hasActiveFilters={hasActiveFilters}
              />
            )}

            {!showEmptyNoAudio && (
              <AudioResultsSummary
                page={page}
                perPage={perPage}
                filteredCount={filteredCount}
                totalCount={totalCount}
                displayedCount={paginatedAudios.length}
                hasActiveFilters={hasActiveFilters}
              />
            )}

            {showEmptyNoAudio ? (
              <AudioEmptyState
                variant="no-audio"
                onUploadClick={goToUpload}
              />
            ) : showEmptyNoResults ? (
              <AudioEmptyState
                variant="no-results"
                onUploadClick={goToUpload}
                onClearFilters={clearFilters}
              />
            ) : (
              <AudioListPanel refreshing={refreshing}>
                <div className="hidden border-b border-gray-100 px-5 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:border-zinc-800 sm:grid sm:grid-cols-[36px_1fr_64px_72px_72px] sm:gap-4 sm:px-6">
                  <span />
                  <span>Title</span>
                  <span className="text-right">Duration</span>
                  <span className="text-right">Size</span>
                  <span />
                </div>
                <div className="relative">
                  {paginatedAudios.map((item) => (
                    <AudioListRow
                      key={item.id}
                      item={item}
                      preview={getPreviewForRow(item.id)}
                      onPreview={() => void handlePreviewLaunch(item)}
                      onEdit={() => setEditing(item)}
                      onDelete={() => requestDelete(item)}
                      deleting={deleteLoading && audioToDelete?.id === item.id}
                    />
                  ))}
                </div>
              </AudioListPanel>
            )}

            {!showEmptyNoAudio && (
              <PlaylistsPagination
                page={page}
                setPage={setPage}
                perPage={perPage}
                setPerPage={setPerPage}
                perPageOptions={perPageOptions}
                totalPages={totalPages}
                disabled={refreshing}
                showTopBorder={false}
                ariaLabel="Audio pagination"
              />
            )}
          </>
        )}
      </div>


      {editing && (
        <EditAudioModal
          open
          initial={{
            id: editing.id,
            title: editing.title,
            singer: editing.singer,
            playlistId: playlistMembership.get(editing.id)?.playlistId ?? null,
          }}
          playlists={playlistOptions}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}

      <DeleteAudioModal
        open={deleteOpen}
        audio={audioToDelete}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        isDeleting={deleteLoading}
      />

      {previewPlayerState && (
        <PreviewPlayer
          state={previewPlayerState}
          volume={volume}
          onPlayPause={handlePreviewPlayPause}
          onSeek={handlePreviewSeek}
          onVolumeChange={handleVolumeChange}
        />
      )}

      <audio ref={audioRef} preload="metadata" className="sr-only" aria-hidden />
    </div>
  );
}
