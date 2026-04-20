"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileAudio, Check, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

type UploadFile = {
  id: string;
  name: string;
  size: number;
  status: "pending" | "uploading" | "success" | "error";
  progress?: number;
  error?: string;
  category?: string;
};

export default function UploadModal({
  open,
  onClose,
  onUpload,
  showCategory = true,
}: {
  open: boolean;
  onClose: () => void;
  onUpload?: (files: UploadFile[]) => void;
  showCategory?: boolean;
}) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Yoga");

  const categories = ["Yoga", "Meditation", "Lobby", "Retail"];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (file) => file.type.startsWith("audio/") || file.type === "application/octet-stream"
      );
      addFiles(droppedFiles);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (filesToAdd: File[]) => {
    const newFiles: UploadFile[] = filesToAdd.map((file) => ({
      id: Math.random().toString(36),
      name: file.name,
      size: file.size,
      status: "pending",
      category: showCategory ? selectedCategory : undefined,
    }));
    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload
    simulateUpload(newFiles);
  };

  const simulateUpload = (filesToUpload: UploadFile[]) => {
    filesToUpload.forEach((file) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "uploading", progress: 0 } : f))
      );

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, status: "success", progress: 100 } : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, progress: Math.min(progress, 99) } : f
            )
          );
        }
      }, 200);
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = () => {
    onUpload?.(files.filter((f) => f.status === "success"));
    setFiles([]);
    onClose();
  };

  if (!open) return null;

  const hasSuccessful = files.some((f) => f.status === "success");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Upload Audio</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Selection */}
          {showCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium border transition-colors",
                      selectedCategory === cat
                        ? "bg-[#F3F4F6] text-gray-900 border-gray-200"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Drop Zone */}
          {files.length === 0 ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "relative rounded-lg border-2 border-dashed transition-colors p-8",
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="audio/*"
                onChange={handleChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-3 rounded-lg bg-gray-200">
                  <Upload size={24} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Drag and drop your audio files here
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    or{" "}
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      browse your files
                    </button>
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Supported formats: MP3, WAV, OGG, M4A (max 100MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900">
                {files.length} {files.length === 1 ? "file" : "files"} selected
              </p>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-shrink-0">
                      {file.status === "success" ? (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Check size={16} className="text-green-600" />
                        </div>
                      ) : file.status === "error" ? (
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle size={16} className="text-red-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <FileAudio size={16} className="text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {(file.size / 1024 / 1024).toFixed(1)}MB
                        </span>
                      </div>
                      {file.status === "uploading" && (
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${file.progress || 0}%` }}
                          />
                        </div>
                      )}
                      {file.error && (
                        <p className="text-xs text-red-600">{file.error}</p>
                      )}
                    </div>

                    {file.status !== "uploading" && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!files.every((f) => f.status === "success" || f.status === "uploading") && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                >
                  Add more files
                </button>
              )}
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
            onClick={handleUpload}
            disabled={!hasSuccessful}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              hasSuccessful
                ? "bg-[#F3F4F6] text-gray-900 hover:bg-[#E7E7E7]"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            )}
          >
            {hasSuccessful ? `Upload ${files.filter(f => f.status === "success").length} file${files.filter(f => f.status === "success").length === 1 ? "" : "s"}` : "Uploading..."}
          </button>
        </div>
      </div>
    </div>
  );
}
