"use client";

import React, { useState } from "react";
import { Music, Plus, X, Check } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Playlist } from "./PlaylistModal";

export default function AddToPlaylistModal({
  open,
  onClose,
  audioTitle,
  playlists = [],
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  audioTitle?: string;
  playlists?: Playlist[];
  onAdd?: (playlistId: string) => void;
}) {
  const [creatingNew, setCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());

  const handleAdd = () => {
    selectedPlaylists.forEach((id) => onAdd?.(id));
    setSelectedPlaylists(new Set());
    onClose();
  };

  if (!open) return null;

  const isSelected = (playlistId: string) => selectedPlaylists.has(playlistId);

  const handleToggle = (playlistId: string) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylists(newSelected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add to Playlist</h2>
            {audioTitle && (
              <p className="text-xs text-gray-500 mt-1 truncate">{audioTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {/* Create New Playlist */}
          {!creatingNew ? (
            <button
              onClick={() => setCreatingNew(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
            >
              <Plus size={18} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Create new playlist</p>
                <p className="text-xs text-gray-500">Add to a new playlist</p>
              </div>
            </button>
          ) : (
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-2">
              <input
                autoFocus
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Would create new playlist here
                    setCreatingNew(false);
                    setNewPlaylistName("");
                  }}
                  disabled={!newPlaylistName.trim()}
                  className={cn(
                    "px-3 py-2 rounded-md text-xs font-medium transition-colors flex-1",
                    newPlaylistName.trim()
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  )}
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setCreatingNew(false);
                    setNewPlaylistName("");
                  }}
                  className="px-3 py-2 rounded-md text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing Playlists */}
          {playlists.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
                Your Playlists
              </p>
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleToggle(playlist.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                    isSelected(playlist.id)
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0",
                      isSelected(playlist.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    )}
                  >
                    {isSelected(playlist.id) && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {playlist.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {playlists.length === 0 && !creatingNew && (
            <div className="text-center py-8">
              <Music size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No playlists yet</p>
              <p className="text-xs text-gray-400 mt-1">Create a playlist to get started</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedPlaylists.size === 0}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              selectedPlaylists.size > 0
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            )}
          >
            Add to {selectedPlaylists.size > 0 ? `${selectedPlaylists.size} playlist${selectedPlaylists.size === 1 ? "" : "s"}` : "playlists"}
          </button>
        </div>
      </div>
    </div>
  );
}
