"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import PlaylistCard from "../components/PlaylistCard";
import PlaylistModal from "../components/PlaylistModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Playlist } from "../components/PlaylistModal";
import { getApiClient } from "@/lib/api-client";
import { apiPlaylistToUi, isValidPlaylistId } from "@/lib/playlist-mapper";
import { dashboardContainerClass, dashboardPageClass } from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";
import PlaylistsHero from "./components/PlaylistsHero";
import PlaylistsToolbar, {
  PlaylistsResultsSummary,
  PlaylistsSearch,
  type PlaylistFilterKey,
  type PlaylistSortKey,
} from "./components/PlaylistsToolbar";
import { PlaylistGridSkeleton } from "./components/PlaylistCardSkeleton";
import PlaylistsEmptyState from "./components/PlaylistsEmptyState";
import PlaylistsPagination from "./components/PlaylistsPagination";

const PLAYLISTS_STORAGE_KEY = "aa_playlists";

function sortPlaylists(
  items: Playlist[],
  sort: PlaylistSortKey,
  loadOrder: Map<string, number>
): Playlist[] {
  const sorted = [...items];

  switch (sort) {
    case "updated-desc":
      sorted.sort(
        (a, b) =>
          new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      break;
    case "created-desc":
      sorted.sort(
        (a, b) => (loadOrder.get(a.id) ?? 0) - (loadOrder.get(b.id) ?? 0)
      );
      break;
    case "name-asc":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "tracks-desc":
      sorted.sort((a, b) => b.trackCount - a.trackCount);
      break;
    case "tracks-asc":
      sorted.sort((a, b) => a.trackCount - b.trackCount);
      break;
  }

  return sorted;
}

export default function LibraryPlaylistsClient() {
  const apiClient = getApiClient();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadOrder, setLoadOrder] = useState<Map<string, number>>(new Map());
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPlaylistForDelete, setSelectedPlaylistForDelete] = useState<Playlist | null>(
    null
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PlaylistSortKey>("updated-desc");
  const [filter, setFilter] = useState<PlaylistFilterKey>("all");

  const persistCache = useCallback((items: Playlist[]) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(
        new CustomEvent("aa:playlists-updated", { detail: { count: items.length } })
      );
    } catch {
      /* ignore */
    }
  }, []);

  const loadPlaylists = useCallback(async (options?: { refresh?: boolean }) => {
    const isRefresh = options?.refresh === true;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await apiClient.listPlaylists();
      const mapped = (res.playlists ?? [])
        .map((p) => apiPlaylistToUi(p))
        .filter((p): p is Playlist => p !== null);
      const order = new Map<string, number>();
      mapped.forEach((p, i) => order.set(p.id, i));
      setLoadOrder(order);
      setPlaylists(mapped);
      persistCache(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlists");
      try {
        const raw = window.localStorage.getItem(PLAYLISTS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Playlist[];
          if (Array.isArray(parsed)) {
            const cached = parsed.filter((p) => isValidPlaylistId(p?.id));
            const order = new Map<string, number>();
            cached.forEach((p, i) => order.set(p.id, i));
            setLoadOrder(order);
            setPlaylists(cached);
          }
        }
      } catch {
        /* ignore */
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [apiClient, persistCache]);

  const handleRefresh = useCallback(() => {
    void loadPlaylists({ refresh: true });
  }, [loadPlaylists]);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  const filteredPlaylists = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = playlists;

    if (q) {
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      );
    }

    if (filter === "has-tracks") {
      items = items.filter((p) => p.trackCount > 0);
    } else if (filter === "empty") {
      items = items.filter((p) => p.trackCount === 0);
    }

    return sortPlaylists(items, sort, loadOrder);
  }, [playlists, query, filter, sort, loadOrder]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const perPageOptions = [5, 10, 20, 50];
  const filteredCount = filteredPlaylists.length;
  const totalCount = playlists.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / perPage));
  const hasActiveFilters = filter !== "all" || query.trim().length > 0;

  useEffect(() => {
    setPage(1);
  }, [query, sort, filter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedPlaylists = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredPlaylists.slice(start, start + perPage);
  }, [filteredPlaylists, page, perPage]);

  const navigateToPlaylist = (playlist: Playlist) => {
    const id = playlist.id;
    if (!isValidPlaylistId(id)) {
      setError("This playlist cannot be opened (missing id). Refresh and try again.");
      return;
    }
    router.push(`/library/playlists/${id}`);
  };

  const clearFilters = () => {
    setQuery("");
    setFilter("all");
  };

  const showEmptyNoPlaylists = !loading && totalCount === 0;
  const showEmptyNoResults =
    !loading && totalCount > 0 && filteredCount === 0;

  return (
    <div className={dashboardPageClass}>
      <div className={dashboardContainerClass}>
        <PlaylistsHero
          onCreateClick={() => setPlaylistModalOpen(true)}
          searchSlot={<PlaylistsSearch query={query} setQuery={setQuery} />}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!showEmptyNoPlaylists && (
          <PlaylistsToolbar
            query={query}
            setQuery={setQuery}
            sort={sort}
            setSort={setSort}
            filter={filter}
            setFilter={setFilter}
            onClearFilters={clearFilters}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}

        {!loading && !showEmptyNoPlaylists && (
          <PlaylistsResultsSummary
            page={page}
            perPage={perPage}
            filteredCount={filteredCount}
            totalCount={totalCount}
            displayedCount={paginatedPlaylists.length}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {loading ? (
          <PlaylistGridSkeleton count={perPage} />
        ) : showEmptyNoPlaylists ? (
          <PlaylistsEmptyState
            variant="no-playlists"
            onCreateClick={() => setPlaylistModalOpen(true)}
          />
        ) : showEmptyNoResults ? (
          <PlaylistsEmptyState
            variant="no-results"
            onCreateClick={() => setPlaylistModalOpen(true)}
            onClearFilters={clearFilters}
          />
        ) : (
          <div
            className={cn(
              "grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
              refreshing && "pointer-events-none opacity-60 transition-opacity"
            )}
          >
            {paginatedPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={() => navigateToPlaylist(playlist)}
                onEdit={async (id, newTitle) => {
                  if (!newTitle?.trim()) return;
                  try {
                    await apiClient.updatePlaylist(id, { title: newTitle.trim() });
                    await loadPlaylists({ refresh: true });
                  } catch {
                    setPlaylists((prev) =>
                      prev.map((pl) =>
                        pl.id === id ? { ...pl, title: newTitle.trim() } : pl
                      )
                    );
                  }
                }}
                onDelete={(id) => {
                  const p = playlists.find((pl) => pl.id === id) || null;
                  setSelectedPlaylistForDelete(p);
                  setDeleteOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {!showEmptyNoPlaylists && (
          <PlaylistsPagination
            page={page}
            setPage={setPage}
            perPage={perPage}
            setPerPage={setPerPage}
            perPageOptions={perPageOptions}
            totalPages={totalPages}
            disabled={loading || refreshing}
            showTopBorder={false}
          />
        )}
      </div>

      <PlaylistModal
        open={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
        playlists={playlists}
        onCreatePlaylist={async (playlist) => {
          try {
            const res = await apiClient.createPlaylist({
              title: playlist.title,
              description: playlist.description,
              coverColor: playlist.coverColor,
            });
            const created = apiPlaylistToUi(res.playlist);
            if (!created || !isValidPlaylistId(created.id)) {
              setError(
                "Playlist was created but the server did not return an id. Refresh the list."
              );
              await loadPlaylists();
              return;
            }
            setPlaylists((prev) => {
              const next = [created, ...prev];
              persistCache(next);
              return next;
            });
            setLoadOrder((prev) => {
              const next = new Map(prev);
              next.set(created.id, -1);
              return next;
            });
            setPlaylistModalOpen(false);
            router.push(`/library/playlists/${created.id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create playlist");
          }
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete playlist"
        description={`This will permanently delete "${selectedPlaylistForDelete?.title}". This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => {
          setDeleteOpen(false);
          setSelectedPlaylistForDelete(null);
        }}
        onConfirm={async () => {
          const id = selectedPlaylistForDelete?.id;
          if (!id) return;
          try {
            await apiClient.deletePlaylist(id);
            await loadPlaylists();
          } catch {
            setPlaylists((prev) => prev.filter((p) => p.id !== id));
            persistCache(playlists.filter((p) => p.id !== id));
          }
          setSelectedPlaylistForDelete(null);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
