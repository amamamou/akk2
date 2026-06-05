"use client";

import React, { useEffect, useRef, useState } from "react";
import { Upload, X, Trash, Edit3, User, Play, Pause, Check } from "lucide-react";
// AudioVisual removed — use a neutral inline waveform glyph instead
import { cn } from "@/utils/cn";
import { getApiClient } from "@/lib/api-client";

type UploadFile = {
  id: string;
  name: string;
  size: number;
  status: "pending" | "uploading" | "success" | "error";
  progress?: number;
  error?: string;
  title?: string;
  artist?: string;
  titleTouched?: boolean;
  artistTouched?: boolean;
  playlistId?: string | null;
  tags?: string[];
  color?: string;
  previewUrl?: string | null;
  original?: File | null;
};

export default function UploadModal({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload?: (files: UploadFile[]) => void;
}) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const [headerDuration, setHeaderDuration] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState("");
  const SUGGESTED_TAGS = ["Event", "Seasonal", "Lobby", "Retail", "Yoga", "Meditation"];

  const loadPlaylistsFromApi = React.useCallback(async () => {
    try {
      const res = await getApiClient().listPlaylists();
      const mapped = (res.playlists ?? []).map((p) => ({
        id: String(p.id),
        name: String(p.title ?? "Untitled playlist"),
      }));
      setPlaylists(mapped);
    } catch (err) {
      console.error("Failed to load playlists from API", err);
      setPlaylists([]);
    }
  }, []);

  useEffect(() => {
    void loadPlaylistsFromApi();
  }, [loadPlaylistsFromApi]);

  useEffect(() => {
    if (!open) return;
    void loadPlaylistsFromApi();
  }, [open, loadPlaylistsFromApi]);

  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl) {
          try {
            URL.revokeObjectURL(f.previewUrl);
          } catch {}
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFiles = (incoming: File[]) => {
    const newFiles: UploadFile[] = incoming.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      status: "pending",
      title: f.name.replace(/\.[^.]+$/, ""),
      titleTouched: false,
      artist: "",
      artistTouched: false,
      playlistId: null,
      tags: [],
      previewUrl: URL.createObjectURL(f),
      original: f,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setSelectedId((s) => s ?? newFiles[0]?.id ?? null);
  };

  // MiniAudioPlayer removed — playback now handled inline per-file via InlineAudioButton

  // InlineAudioButton removed — playback controls now live only in the metadata (HeaderPlay)

  // (DurationOnly component removed; header now uses HeaderPlay)

  // Small header play control: very compact play/pause icon + duration
  const HeaderPlay: React.FC<{ id: string; src?: string | null }> = ({ id, src }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      const onLoaded = () => {
        try {
          setHeaderDuration(a.duration || 0);
        } catch {}
      };
      a.addEventListener('loadedmetadata', onLoaded);
      return () => a.removeEventListener('loadedmetadata', onLoaded);
    }, [src]);

    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      if (playingId === id) a.play().catch(() => {});
      else a.pause();
    }, [id, src]);

    const toggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPlayingId((pid) => (pid === id ? null : id));
    };

    return (
      <div className="flex items-center gap-2">
        <button onClick={toggle} onMouseDown={(e) => e.stopPropagation()} className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-gray-700 hover:bg-gray-50">
          {playingId === id ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <audio ref={audioRef} src={src ?? undefined} className="hidden" />
      </div>
    );
  };

  // focus title input when a file is selected
  useEffect(() => {
    if (!selectedId) return;
    // small timeout to ensure the input is mounted
    const t = window.setTimeout(() => {
      try {
        titleRef.current?.focus();
        titleRef.current?.select();
      } catch {}
    }, 50);
    return () => window.clearTimeout(t);
  }, [selectedId]);

  const uploadFiles = async () => {
    const apiClient = getApiClient();
    setIsUploading(true);

    try {
      const uploaded = [] as UploadFile[];

      for (const file of files) {
        const original = file.original;
        if (!original) continue;

        setFiles((prev) => prev.map((p) => (p.id === file.id ? { ...p, status: "uploading", progress: 0 } : p)));

        const extMatch = original.name.match(/\.[^.]+$/);
        const ext = extMatch ? extMatch[0] : ".mp3";
        const sanitizedStem =
          original.name.split(".").slice(0, -1).join(".").replace(/[^a-zA-Z0-9]/g, "_") ||
          "audio";
        const sanitizedTitle = (file.title?.trim() || sanitizedStem).replace(/[^a-zA-Z0-9]/g, "_");
        const sanitizedFileName = `${sanitizedStem}${ext}`;
        const uploadBlob =
          original.name === sanitizedFileName
            ? original
            : new File([original], sanitizedFileName, { type: original.type || "audio/mpeg" });

        const response = await apiClient.uploadMedia(
          uploadBlob,
          sanitizedTitle,
          Math.max(1, Math.round((file.size || 1) / (1024 * 1024))),
          "Audio",
          (progressPercent) => {
            setFiles((prev) => prev.map((p) => (p.id === file.id ? { ...p, progress: progressPercent } : p)));
          },
          file.tags ?? [],
        );

        const completed: UploadFile = {
          id: file.id,
          name: file.name,
          size: file.size,
          status: "success",
          progress: 100,
          title: response.media.title,
          artist: file.artist,
          titleTouched: file.titleTouched,
          artistTouched: file.artistTouched,
          playlistId: file.playlistId,
          color: file.color,
          previewUrl: file.previewUrl,
          original: file.original,
          error: file.error,
        };
        uploaded.push(completed);
        setFiles((prev) => prev.map((p) => (p.id === file.id ? completed : p)));
      }

      onUpload?.(uploaded.length > 0 ? uploaded : files);

      files.forEach((f) => {
        if (f.previewUrl) {
          try {
            URL.revokeObjectURL(f.previewUrl);
          } catch {}
        }
      });
      setFiles([]);
      onClose();
    } catch (err) {
      console.error("Upload failed", err);
      setFiles((prev) => prev.map((p) => (p.status === "uploading" ? { ...p, status: "error", error: "Upload failed" } : p)));
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("audio/") || f.type === "application/octet-stream"));
    }
  };

  const onPick = (e?: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e?.target?.files ? Array.from(e.target.files) : [];
    if (chosen.length) handleFiles(chosen);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  };


  const retryFile = (id: string) => {
    const fileToRetry = files.find((f) => f.id === id);
    if (!fileToRetry) return;
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "pending", error: undefined, progress: 0 } : f)));
    void uploadFiles();
  };

  if (!open) return null;

  const hasFiles = files.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-3xl mx-4 bg-white rounded-lg shadow-xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-normal text-gray-900">Upload Audio</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
            <X size={18} />
          </button>
        </div>

  <div className="p-3 space-y-3 overflow-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {/* always-available hidden file input so Add files works after files are present */}
          <input ref={inputRef} type="file" multiple accept="audio/*" onChange={onPick} className="hidden" />
            {files.length === 0 ? (
            <div
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDrop={onDrop}
              className={cn(
                "relative rounded-lg border-2 border-dashed transition-colors p-8",
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
              )}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-3 rounded-lg bg-gray-200">
                  <Upload size={24} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Drag and drop audio files here</p>
                  <p className="text-xs text-gray-500 mt-1">
                    or{' '}
                    <button onClick={() => inputRef.current?.click()} className="text-blue-600 hover:underline font-medium">
                      browse files
                    </button>
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-2">Supported: MP3, WAV, OGG, M4A. Max 100MB per file.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-normal text-gray-900">{files.length} {files.length === 1 ? 'file' : 'files'} selected</p>
                  <p className="text-xs text-gray-400">Select a file to edit Title, Artist, and choose a Playlist.</p>
                </div>
                <div>
                  <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-blue-600 hover:bg-blue-50 border border-blue-100">
                    <Upload size={16} /> Add files
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="col-span-1 overflow-y-auto h-80 rounded-md p-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-600">Files</div>
                    <div className="text-xs text-gray-400">{files.length}</div>
                  </div>
                  {files.map((file) => {
                    const isSelected = selectedId === file.id;
                    return (
                      <button
                        key={file.id}
                        onClick={() => setSelectedId(file.id)}
                        className={cn(
                          'w-full text-left p-1 rounded-md flex items-center gap-2',
                          isSelected ? 'bg-[#F3F4F6]' : 'hover:bg-white'
                        )}
                      >
                        {file.status === 'success' ? (
                          <div className="w-8 h-8 rounded-md flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center" aria-hidden>
                              <svg className="w-3.5 h-3.5 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className={cn("flex items-center justify-center rounded-md w-8 h-8", "transition-transform text-gray-600")} aria-hidden>
                            <svg className="w-5 h-5 " viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                              <path d="M3 15h2v-6H3v6zm4 0h2v-4H7v4zm4 0h2v-10h-2v10zm4 0h2v-7h-2v7zm4 0h2v-5h-2v5z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-normal truncate">{file.title || file.name}</p>
                              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)}MB • {file.status}{file.progress !== undefined ? ` • ${file.progress}%` : ""}</p>
                              {file.status === "uploading" && (
                                <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div className="h-full bg-[#A473FF] transition-all" style={{ width: `${file.progress ?? 0}%` }} />
                                </div>
                              )}
                        </div>
                        {/* play controls removed from file row; use metadata header for playback */}
                      </button>
                    );
                  })}
                </div>

                <div className="col-span-2 bg-white rounded-md p-3 md:pl-6 md:relative overflow-auto max-h-[calc(80vh-120px)]">
                  <div className="hidden md:block absolute left-0 top-4 bottom-4 w-px bg-gray-100" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-600">Metadata</div>
                    <div className="text-xs text-gray-400">Edit details</div>
                  </div>
                  {selectedId ? (
                    (() => {
                      const f = files.find((x) => x.id === selectedId);
                      if (!f) {
                        // selectedId is stale or the file was removed — clear selection and show fallback
                        setSelectedId(null);
                        return <div className="text-sm text-gray-500">Select a file on the left to edit metadata and preview it.</div>;
                      }

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <HeaderPlay id={f.id} src={f.previewUrl ?? undefined} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" title={f.title || f.name}>{f.title || f.name}</p>
                            </div>
                            <div className="text-xs text-gray-400 ml-3">
                              {headerDuration ? (() => {
                                const m = Math.floor(headerDuration / 60);
                                const s = Math.floor(headerDuration % 60).toString().padStart(2, '0');
                                return `${m}:${s}`;
                              })() : null}
                            </div>
                          </div>

                          {/* Minimal modern metadata UI */}
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex gap-2 items-center">
                              <div className="w-8 h-8 rounded-md flex items-center justify-center">
                                <Edit3 size={14} className="text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <input
                                  ref={titleRef}
                                  maxLength={100}
                                  value={f.title ?? ''}
                                  onChange={(e) => setFiles(prev => prev.map(p => p.id === f.id ? { ...p, title: e.target.value } : p))}
                                  onBlur={() => setFiles(prev => prev.map(p => p.id === f.id ? { ...p, titleTouched: true } : p))}
                                  placeholder="Track title"
                                  aria-label="Title"
                                  className="w-full p-1 bg-transparent border-b border-gray-100 focus:outline-none focus:border-blue-200 text-sm"
                                />
                                <div className="text-xs text-gray-400 mt-1 flex justify-end">
                                  <span className="text-[11px]">{(f.title ?? '').length}/100</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 items-center">
                              <div className="w-8 h-8 rounded-md flex items-center justify-center">
                                <User size={14} className="text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <input
                                  maxLength={60}
                                  value={f.artist ?? ''}
                                  onChange={(e) => setFiles(prev => prev.map(p => p.id === f.id ? { ...p, artist: e.target.value } : p))}
                                  onBlur={() => setFiles(prev => prev.map(p => p.id === f.id ? { ...p, artistTouched: true } : p))}
                                  placeholder="Artist"
                                  aria-label="Artist"
                                  className="w-full p-1 bg-transparent border-b border-gray-100 focus:outline-none focus:border-blue-200 text-sm"
                                />
                                <div className="text-xs text-gray-400 mt-1 flex justify-end">
                                  <span className="text-[11px]">{(f.artist ?? '').length}/60</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 items-start">
                              <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0">
                                <svg className="text-gray-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18"/><path d="M3 12h18"/><path d="M3 17h18"/></svg>
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap gap-1.5">
                                  {(f.tags ?? []).map((tag) => (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() =>
                                        setFiles((prev) =>
                                          prev.map((p) =>
                                            p.id === f.id
                                              ? { ...p, tags: (p.tags ?? []).filter((t) => t !== tag) }
                                              : p
                                          )
                                        )
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#F3EEFF] text-[#6B46FF] border border-violet-100"
                                    >
                                      {tag}
                                      <span aria-hidden>×</span>
                                    </button>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {SUGGESTED_TAGS.filter((t) => !(f.tags ?? []).includes(t)).map((tag) => (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() =>
                                        setFiles((prev) =>
                                          prev.map((p) =>
                                            p.id === f.id
                                              ? { ...p, tags: [...(p.tags ?? []), tag] }
                                              : p
                                          )
                                        )
                                      }
                                      className="px-2 py-0.5 text-xs rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                                    >
                                      + {tag}
                                    </button>
                                  ))}
                                </div>
                                <input
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && tagInput.trim()) {
                                      e.preventDefault();
                                      const next = tagInput.trim();
                                      setFiles((prev) =>
                                        prev.map((p) =>
                                          p.id === f.id && !(p.tags ?? []).includes(next)
                                            ? { ...p, tags: [...(p.tags ?? []), next] }
                                            : p
                                        )
                                      );
                                      setTagInput("");
                                    }
                                  }}
                                  placeholder="Add tag and press Enter"
                                  className="w-full p-1 bg-transparent border-b border-gray-100 focus:outline-none focus:border-blue-200 text-sm"
                                  aria-label="Tags"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 items-center">
                              <div className="w-8 h-8 rounded-md flex items-center justify-center">
                                <svg className="text-gray-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18"/><path d="M3 12h18"/><path d="M3 17h18"/></svg>
                              </div>
                              <div className="flex-1">
                                <select
                                  value={f.playlistId ?? ''}
                                  onChange={(e) => setFiles(prev => prev.map(p => p.id === f.id ? { ...p, playlistId: e.target.value || null } : p))}
                                  className="w-full p-1 bg-transparent border-b border-gray-100 focus:outline-none focus:border-blue-200 text-sm"
                                  aria-label="Playlist"
                                >
                                  <option value="">Choose playlist</option>
                                  {playlists.map(pl => (
                                    <option key={pl.id} value={pl.id}>{pl.name}</option>
                                  ))}
                                </select>
                                <></>
                              </div>
                            </div>
                          </div>


                          <div className="flex items-center justify-end gap-2">
                            {f.status === 'error' && (
                                  <button onClick={() => retryFile(f.id)} className="px-3 py-1 text-sm font-normal bg-gray-100 rounded">Retry</button>
                            )}

                            {f.status !== 'uploading' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const ok = window.confirm(`Remove "${f.title || f.name}"?`);
                                    if (ok) removeFile(f.id);
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-1 text-sm font-normal text-red-600 hover:bg-red-50 rounded"
                                  aria-label={`Remove ${f.title || f.name}`}
                                >
                                  <Trash size={14} /> Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-500">Select a file on the left to edit metadata and preview it.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (hasFiles) void uploadFiles();
            }}
            disabled={!hasFiles || isUploading}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center justify-center gap-2",
              hasFiles && !isUploading
                ? "bg-[#A473FF] text-white hover:bg-[#7A42FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            )}
          >
            {isUploading ? (
              "Uploading..."
            ) : hasFiles ? (
              <>
                <Check className="h-4 w-4 inline-block mr-1" />
                Confirm upload ({files.length})
              </>
            ) : (
              "Confirm upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

      
