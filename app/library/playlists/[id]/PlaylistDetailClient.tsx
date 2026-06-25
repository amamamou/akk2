"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { AlertCircle, Check } from "lucide-react";
import type { Playlist } from "../../components/PlaylistModal";
import { getApiClient } from "@/lib/api-client";
import { formatApiError } from "@/lib/format-api-error";
import { queryKeys } from "@/lib/query-keys";
import {
  apiPlaylistToUi,
  isValidPlaylistId,
  normalizePlaylistTracks,
} from "@/lib/playlist-mapper";
import type { PlaylistTrackInfo } from "@/types/api";
import {
  dashboardContainerClass,
  dashboardPageClass,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import PlaylistDetailSkeleton from "./components/PlaylistDetailSkeleton";
import PlaylistDetailWorkspace from "./components/PlaylistDetailWorkspace";
import DeletePlaylistModal from "../components/DeletePlaylistModal";
import RemovePlaylistTrackModal from "../components/RemovePlaylistTrackModal";
import { usePlaylistDeleteModal } from "../hooks/usePlaylistDeleteModal";
import { useRemovePlaylistTrackModal } from "../hooks/useRemovePlaylistTrackModal";
import EditPlaylistModal, { type CoverKey } from "./components/EditPlaylistModal";
import AddTrackModal from "./components/AddTrackModal";
import PreviewPlayer from "./components/PreviewPlayer";
import type {
  PreviewPlayerState,
  TrackPreviewState,
} from "./components/playlist-detail-types";

function resolveCoverKey(color?: string | null): CoverKey {
  const valid: CoverKey[] = ["slate", "indigo", "blue", "purple", "emerald"];
  if (color && valid.includes(color as CoverKey)) return color as CoverKey;
  return "indigo";
}

function syncPlaylistState(
  res: { playlist: Parameters<typeof apiPlaylistToUi>[0] },
  setters: {
    setPlaylist: (p: Playlist | null) => void;
    setTracks: (t: PlaylistTrackInfo[]) => void;
  }
) {
  const ui = apiPlaylistToUi(res.playlist);
  setters.setPlaylist(ui);
  setters.setTracks(normalizePlaylistTracks(res.playlist.tracks));
  return ui;
}

export default function PlaylistDetailClient({
  playlistId: playlistIdProp,
}: {
  playlistId?: string;
}) {
  const apiClient = getApiClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const routeParams = useParams();
  const routeId =
    typeof routeParams?.id === "string"
      ? routeParams.id
      : Array.isArray(routeParams?.id)
        ? routeParams.id[0]
        : undefined;
  const playlistId = isValidPlaylistId(playlistIdProp)
    ? playlistIdProp
    : isValidPlaylistId(routeId)
      ? routeId
      : "";

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrackInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaved, setEditSaved] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerLoading, setMediaPickerLoading] = useState(false);
  const [initialMediaIdsOnOpen, setInitialMediaIdsOnOpen] = useState<Set<string>>(() => new Set());
  const [mediaOptions, setMediaOptions] = useState<
    { id: string; title: string; duration?: string }[]
  >([]);
  const [mediaUrlById, setMediaUrlById] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverColor, setCoverColor] = useState<CoverKey>("indigo");
  const [coverSelection, setCoverSelection] = useState<{ file: File | null; removed: boolean }>({
    file: null,
    removed: false,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [addingMediaId, setAddingMediaId] = useState<string | null>(null);
  const [trackQuery, setTrackQuery] = useState("");
  const titleRef = useRef<HTMLInputElement | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tickRafRef = useRef<number | null>(null);
  const activeTrackIdRef = useRef<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [playbackRevision, setPlaybackRevision] = useState(0);

  const setActiveTrack = useCallback((trackId: string | null) => {
    activeTrackIdRef.current = trackId;
    setActiveTrackId(trackId);
  }, []);

  const syncPlaybackState = useCallback(() => {
    setPlaybackRevision((n) => n + 1);
  }, []);

  /** Authoritative playback flag — always read from the audio element. */
  const isAudioPlaying = useCallback(() => {
    const audio = audioRef.current;
    return (
      activeTrackIdRef.current != null &&
      audio != null &&
      !audio.paused &&
      !audio.ended
    );
  }, []);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [errorTrackId, setErrorTrackId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.85);

  const DUPLICATE_TRACK_MESSAGE =
    "This audio track is already present inside this playlist.";

  const activePlaylistId = playlist?.id ?? playlistId;

  const {
    playlistToDelete,
    deleteOpen,
    deleteLoading,
    requestDelete,
    closeDeleteModal,
    confirmDelete,
  } = usePlaylistDeleteModal({
    apiClient,
    router,
    setError,
  });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!successToast) return;
    const timer = window.setTimeout(() => setSuccessToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [successToast]);

  useEffect(() => {
    if (!streamError) return;
    const timer = window.setTimeout(() => {
      setStreamError(null);
      setErrorTrackId(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [streamError]);

  const playlistQuery = useQuery({
    queryKey: queryKeys.playlist(playlistId ?? ""),
    queryFn: async () => {
      if (!isValidPlaylistId(playlistId)) {
        throw new Error("Invalid playlist link.");
      }
      return apiClient.getPlaylist(playlistId);
    },
    enabled: isValidPlaylistId(playlistId),
  });

  const invalidatePlaylistQueries = useCallback(async () => {
    if (!isValidPlaylistId(activePlaylistId)) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.playlist(activePlaylistId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.playlists() });
  }, [activePlaylistId, queryClient]);

  type UpdatePayload = {
    playlistId: string;
    title: string;
    description: string;
    coverColor: CoverKey;
    coverUrl?: string | null;
  };

  const updatePlaylistMutation = useMutation({
    mutationFn: (payload: UpdatePayload) =>
      apiClient.updatePlaylist(payload.playlistId, {
        title: payload.title,
        description: payload.description,
        coverColor: payload.coverColor,
        coverUrl: payload.coverUrl,
      }),
    onSuccess: () => void invalidatePlaylistQueries(),
  });

  const addPlaylistItemMutation = useMutation({
    mutationFn: (payload: { playlistId: string; mediaId: string }) =>
      apiClient.addPlaylistItem(payload.playlistId, { mediaId: payload.mediaId }),
    onSuccess: () => void invalidatePlaylistQueries(),
  });

  const removePlaylistItemMutation = useMutation({
    mutationFn: (payload: { playlistId: string; itemId: string }) =>
      apiClient.removePlaylistItem(payload.playlistId, payload.itemId),
    onSuccess: () => void invalidatePlaylistQueries(),
  });

  useEffect(() => {
    if (!playlistQuery.data) {
      if (playlistQuery.error) {
        setError(formatApiError(playlistQuery.error, "Failed to load playlist"));
        setPlaylist(null);
      }
      setLoading(playlistQuery.isPending);
      return;
    }
    const ui = syncPlaylistState(playlistQuery.data, { setPlaylist, setTracks });
    if (!ui) {
      setError("Playlist response is missing an id.");
      setPlaylist(null);
      setLoading(false);
      return;
    }
    setName(ui.title);
    setDescription(ui.description ?? "");
    setCoverColor(resolveCoverKey(ui.coverColor));
    setLoading(false);
    setError(null);
  }, [playlistQuery.data, playlistQuery.error, playlistQuery.isPending]);

  useEffect(() => {
    if (!editOpen) return;
    setEditSaved(false);
    const t = setTimeout(() => {
      titleRef.current?.focus();
      titleRef.current?.select?.();
    }, 50);
    return () => clearTimeout(t);
  }, [editOpen]);

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
      audio.removeEventListener("timeupdate", scheduleTimeUpdate);
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("play", syncPlaybackState);
      audio.removeEventListener("playing", syncPlaybackState);
      audio.removeEventListener("pause", syncPlaybackState);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      if (tickRafRef.current != null) {
        window.cancelAnimationFrame(tickRafRef.current);
      }
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

  const {
    trackToRemove,
    removeOpen,
    removeLoading,
    requestRemove,
    closeRemoveModal,
    confirmRemove,
  } = useRemovePlaylistTrackModal({
    activePlaylistId,
    playlistTitle: playlist?.title,
    activeTrackId,
    stopPreview,
    removePlaylistItemMutation,
    setPlaylist,
    setTracks,
    setError,
    setSuccessToast,
  });

  const hydrateMediaCatalog = useCallback(
    async (res: Awaited<ReturnType<typeof apiClient.listMedia>>) => {
      const urls: Record<string, string> = {};
      const options = (res.media ?? []).map((m) => {
        if (m.url) urls[m.id] = m.url;
        return {
          id: m.id,
          title: m.title || "Untitled",
          duration: m.duration,
        };
      });
      setMediaUrlById((prev) => ({ ...prev, ...urls }));
      setMediaOptions(options);
      return options;
    },
    []
  );

  const ensureMediaUrls = useCallback(async () => {
    if (Object.keys(mediaUrlById).length > 0) return mediaUrlById;
    const res = await apiClient.listMedia();
    const urls: Record<string, string> = {};
    for (const m of res.media ?? []) {
      if (m.url) urls[m.id] = m.url;
    }
    setMediaUrlById((prev) => ({ ...prev, ...urls }));
    return urls;
  }, [apiClient, mediaUrlById]);

  const openMediaPicker = async () => {
    audioRef.current?.pause();
    syncPlaybackState();
    setInitialMediaIdsOnOpen(new Set(tracks.map((t) => t.mediaId)));
    setMediaPickerOpen(true);
    setMediaPickerLoading(true);
    try {
      const res = await apiClient.listMedia();
      await hydrateMediaCatalog(res);
    } catch (err) {
      setError(formatApiError(err, "Could not load media library"));
      setMediaPickerOpen(false);
    } finally {
      setMediaPickerLoading(false);
    }
  };

  async function saveChanges() {
    if (!playlist || !isValidPlaylistId(activePlaylistId)) return;
    const trimmed = name.trim();
    const descTrim = description.trim();
    setSaving(true);
    setEditSaved(false);
    try {
      let coverUrl: string | null | undefined;
      if (coverSelection.file) {
        const upload = await apiClient.uploadImage(coverSelection.file);
        coverUrl = upload.url;
      } else if (coverSelection.removed) {
        coverUrl = null;
      }

      const res = await updatePlaylistMutation.mutateAsync({
        playlistId: activePlaylistId,
        title: trimmed || playlist.title,
        description: descTrim,
        coverColor,
        coverUrl,
      });
      syncPlaylistState(res, { setPlaylist, setTracks });
      setCoverSelection({ file: null, removed: false });
      setEditSaved(true);
      setSuccessToast("Playlist updated");
      setTimeout(() => setEditOpen(false), 600);
    } catch (err) {
      setError(formatApiError(err, "Failed to save playlist"));
    } finally {
      setSaving(false);
    }
  }

  async function addTrack(mediaId: string) {
    if (!isValidPlaylistId(activePlaylistId)) return;
    if (tracks.some((t) => t.mediaId === mediaId)) return;

    setAddingMediaId(mediaId);
    try {
      const res = await addPlaylistItemMutation.mutateAsync({
        playlistId: activePlaylistId,
        mediaId,
      });
      syncPlaylistState(res, { setPlaylist, setTracks });
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number } };
      if (ax.response?.status === 409) {
        setToast(DUPLICATE_TRACK_MESSAGE);
        return;
      }
      setError(formatApiError(err, "Failed to add track"));
    } finally {
      setAddingMediaId(null);
    }
  }

  const resolveTrackUrl = useCallback(
    async (track: PlaylistTrackInfo): Promise<string | null> => {
      let urls = mediaUrlById;
      if (!urls[track.mediaId]) {
        try {
          urls = await ensureMediaUrls();
        } catch (err) {
          setStreamError(formatApiError(err, "Could not load audio library"));
          setErrorTrackId(track.id);
          setActiveTrack(track.id);
          syncPlaybackState();
          return null;
        }
      }
      const url = urls[track.mediaId]?.trim();
      if (!url) {
        setStreamError("No audio URL available for this track");
        setErrorTrackId(track.id);
        setActiveTrack(track.id);
        syncPlaybackState();
        return null;
      }
      return url;
    },
    [ensureMediaUrls, mediaUrlById, setActiveTrack, syncPlaybackState]
  );

  const handlePreviewLaunch = useCallback(
    async (track: PlaylistTrackInfo) => {
      if (activeTrackIdRef.current === track.id) return;

      const url = await resolveTrackUrl(track);
      if (!url) return;

      const audio = audioRef.current;
      if (!audio) return;

      setStreamError(null);
      setErrorTrackId(null);

      audio.src = url;
      setActiveTrack(track.id);
      setCurrentTime(0);
      setDuration(0);

      try {
        await audio.play();
        syncPlaybackState();
      } catch {
        setStreamError("Playback blocked or stream unavailable");
        setErrorTrackId(track.id);
        setActiveTrack(track.id);
        syncPlaybackState();
      }
    },
    [resolveTrackUrl, setActiveTrack, syncPlaybackState]
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

  const getPreviewForTrack = useCallback(
    (trackId: string): TrackPreviewState | undefined => {
      const isPreviewing = activeTrackId === trackId || errorTrackId === trackId;
      if (!isPreviewing) return undefined;

      return {
        isPreviewing: true,
        isPlaying: activeTrackId === trackId && isAudioPlaying(),
        streamError: errorTrackId === trackId ? streamError : null,
      };
    },
    [activeTrackId, errorTrackId, isAudioPlaying, playbackRevision, streamError]
  );

  const previewPlayerState = useMemo((): PreviewPlayerState | null => {
    if (!activeTrackId) return null;
    const track = tracks.find((t) => t.id === activeTrackId);
    if (!track) return null;

    const dur = duration > 0 ? duration : 0;
    const progressPercent =
      dur > 0 ? Math.min(100, (currentTime / dur) * 100) : 0;

    return {
      trackTitle: track.title,
      isPlaying: isAudioPlaying(),
      currentTime,
      duration: dur,
      progressPercent,
      streamError: errorTrackId === activeTrackId ? streamError : null,
    };
  }, [
    activeTrackId,
    currentTime,
    duration,
    errorTrackId,
    isAudioPlaying,
    playbackRevision,
    streamError,
    tracks,
  ]);

  const existingMediaIds = useMemo(
    () => new Set(tracks.map((t) => t.mediaId)),
    [tracks]
  );

  const sessionAddedCount = useMemo(() => {
    if (!mediaPickerOpen) return 0;
    return tracks.filter((t) => !initialMediaIdsOnOpen.has(t.mediaId)).length;
  }, [tracks, initialMediaIdsOnOpen, mediaPickerOpen]);

  const hasChanges =
    playlist &&
    (name.trim() !== (playlist.title ?? "") ||
      description.trim() !== (playlist.description ?? "") ||
      coverColor !== resolveCoverKey(playlist.coverColor) ||
      coverSelection.file !== null ||
      coverSelection.removed);

  const openEdit = () => {
    if (!playlist) return;
    setName(playlist.title ?? "");
    setDescription(playlist.description ?? "");
    setCoverColor(resolveCoverKey(playlist.coverColor));
    setCoverSelection({ file: null, removed: false });
    setEditOpen(true);
  };

  if (loading) {
    return (
      <div className={dashboardPageClass}>
        <div className={cn(dashboardContainerClass, "py-8")}>
          <PlaylistDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className={dashboardPageClass}>
        <div className={cn(dashboardContainerClass, "py-12")}>
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error ?? "Playlist not found."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardPageClass}>
      {toast && (
        <div
          role="status"
          className={cn(
            "fixed right-6 z-50 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-lg dark:border-amber-900/40 dark:bg-amber-950/80 dark:text-amber-100",
            previewPlayerState ? "bottom-28" : "bottom-6"
          )}
        >
          {toast}
        </div>
      )}

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

      <div className={cn(dashboardContainerClass, "space-y-6", previewPlayerState && "pb-28")}>
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <PlaylistDetailWorkspace
          playlist={playlist}
          tracks={tracks}
          trackQuery={trackQuery}
          onTrackQueryChange={setTrackQuery}
          removingId={removeLoading ? trackToRemove?.id ?? null : null}
          getPreview={getPreviewForTrack}
          onPreviewPlay={(t) => void handlePreviewLaunch(t)}
          onRemove={requestRemove}
          onAddTracks={() => void openMediaPicker()}
          onEdit={openEdit}
          onDelete={() => requestDelete(playlist)}
          deleteLoading={deleteLoading}
        />
      </div>

      <EditPlaylistModal
        open={editOpen}
        name={name}
        description={description}
        coverColor={coverColor}
        existingCoverUrl={playlist.cover}
        saving={saving}
        saved={editSaved}
        hasChanges={!!hasChanges}
        titleRef={titleRef}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onCoverColorChange={setCoverColor}
        onCoverSelectionChange={setCoverSelection}
        onClose={() => {
          setEditOpen(false);
          setName(playlist.title ?? "");
          setDescription(playlist.description ?? "");
          setCoverColor(resolveCoverKey(playlist.coverColor));
          setCoverSelection({ file: null, removed: false });
        }}
        onSave={() => void saveChanges()}
      />

      <AddTrackModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        options={mediaOptions}
        mediaUrls={mediaUrlById}
        loading={mediaPickerLoading}
        existingMediaIds={existingMediaIds}
        initialMediaIds={initialMediaIdsOnOpen}
        onAdd={(id) => void addTrack(id)}
        addingId={addingMediaId}
        sessionAddedCount={sessionAddedCount}
      />

      <RemovePlaylistTrackModal
        open={removeOpen}
        track={trackToRemove}
        playlistTitle={playlist.title}
        onClose={closeRemoveModal}
        onConfirm={confirmRemove}
        isRemoving={removeLoading}
      />

      <DeletePlaylistModal
        open={deleteOpen}
        playlist={playlistToDelete}
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
