"use client";

import React, { useRef, useState, useId } from "react";
import { UploadCloud, Edit2, Trash, Camera, Loader2 } from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import {
  dispatchUserProfileUpdated,
  persistUserProfileToStorage,
} from "@/lib/user-profile-events";

type Country = {
  name: string;
  code?: string;
  emoji?: string;
};

interface MyDetailsTabProps {
  initial: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    country: string;
    timezone: string;
    bio: string;
    avatar?: string | null;
  };
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  country: string;
  timezone: string;
  bio: string;
  countries: Country[];
  avatar: string | null;
  setFirstName: (val: string) => void;
  setLastName: (val: string) => void;
  setEmail: (val: string) => void;
  setRole: (val: string) => void;
  setCountry: (val: string) => void;
  setTimezone: (val: string) => void;
  setBio: (val: string) => void;
  setAvatar: (val: string | null) => void;
  setDirty: (val: boolean) => void;
}

function isRemoteImageUrl(src: string | null | undefined): boolean {
  return (
    typeof src === "string" &&
    (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/"))
  );
}

export default function MyDetailsTab({
  initial,
  firstName,
  lastName,
  email,
  role,
  country,
  timezone,
  bio,
  countries,
  avatar,
  setFirstName,
  setLastName,
  setEmail,
  setRole,
  setCountry,
  setTimezone,
  setBio,
  setAvatar,
  setDirty,
}: MyDetailsTabProps) {
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const gradientId = useId();

  const initials = `${(firstName || "").trim().charAt(0)}${(lastName || "").trim().charAt(0)}`.toUpperCase();

  function notifyAvatarChange(url: string | null) {
    dispatchUserProfileUpdated({
      firstName,
      lastName,
      role,
      avatar: url,
    });
    persistUserProfileToStorage({
      firstName,
      lastName,
      email,
      avatar: url,
    });
  }

  async function uploadAndPersistPhoto(f: File) {
    const apiClient = getApiClient();
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const uploadRes = await apiClient.uploadImage(f);
      const publicUrl = uploadRes.url;
      if (!publicUrl) {
        throw new Error("Upload succeeded but no URL was returned");
      }

      await apiClient.updateUserProfile({ profilePhotoUrl: publicUrl });
      setAvatar(publicUrl);
      setDirty(false);
      notifyAvatarChange(publicUrl);
    } catch (err) {
      const ax = err as { response?: { data?: { detail?: { error?: string } | string } } };
      const detail = ax?.response?.data?.detail;
      const msg =
        typeof detail === "object" && detail && "error" in detail
          ? String(detail.error)
          : typeof detail === "string"
            ? detail
            : err instanceof Error
              ? err.message
              : "Failed to upload profile photo";
      setPhotoError(msg);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function validateAndSetFile(f: File | null) {
    setPhotoError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setPhotoError("Please select an image file.");
      return;
    }

    const MAX_BYTES = 2 * 1024 * 1024;
    if (f.size > MAX_BYTES) {
      setPhotoError("Image file is too large. Please use a file under 2MB.");
      return;
    }

    await uploadAndPersistPhoto(f);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    void validateAndSetFile(f);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    void validateAndSetFile(f);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function removePhoto() {
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const apiClient = getApiClient();
      await apiClient.updateUserProfile({ profilePhotoUrl: null });
      setAvatar(null);
      setDirty(false);
      notifyAvatarChange(null);
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Failed to remove profile photo"
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Personal information
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Update your photo and personal details.
        </p>

        <div className="space-y-6">
          <div className="py-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Profile photo
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden
              disabled={uploadingPhoto}
            />

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                isDragging ? "border border-gray-300 bg-gray-50" : "border border-gray-200 bg-white"
              }`}
              role="group"
              aria-label="Profile photo upload"
            >
              <div className="flex-shrink-0">
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  aria-label={avatar ? "Change profile photo" : "Upload profile photo"}
                  className={`relative group w-24 h-24 rounded-full focus:outline-none disabled:opacity-60 ${isDragging ? "ring-2 ring-gray-300" : ""}`}
                >
                  {/* SVG interrupted gradient ring */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden>
                    <defs>
                      <linearGradient id={`avatarGrad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A473FF" />
                        <stop offset="100%" stopColor="#7A42FF" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke={`url(#avatarGrad-${gradientId})`}
                      strokeWidth="6"
                      strokeDasharray="6 6"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>

                  {/* Inner white surface */}
                  <div className="relative bg-white rounded-full h-full w-full flex items-center justify-center overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)]">
                    {uploadingPhoto ? (
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    ) : avatar ? (
                      isRemoteImageUrl(avatar) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="Profile preview" className="h-full w-full object-cover" />
                      )
                    ) : (
                      <div
                        className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 text-lg font-semibold"
                        aria-hidden
                        title={initials || "Profile"}
                      >
                        {initials || ""}
                      </div>
                    )}
                  </div>

                  {/* camera overlay */}
                  <span className="pointer-events-none absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                    <span className="bg-white/90 p-2 rounded-full shadow">
                      <Camera size={16} className="text-gray-600" />
                    </span>
                  </span>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {!avatar ? (
                    <>
                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-200 disabled:opacity-50"
                        aria-label="Upload photo"
                      >
                        <UploadCloud size={14} className="text-gray-500" />
                        <span className="text-sm text-gray-700">Upload</span>
                      </button>
                      <span className="text-sm text-gray-500">Drag & drop or click to upload</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={uploadingPhoto}
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 text-sm text-gray-700 px-3 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Edit2 size={14} className="text-gray-500" />
                          <span>Replace</span>
                        </button>
                        <button
                          type="button"
                          disabled={uploadingPhoto}
                          onClick={() => void removePhoto()}
                          className="inline-flex items-center gap-2 text-sm text-gray-600 px-3 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Trash size={14} className="text-gray-400" />
                          <span>Remove</span>
                        </button>
                      </div>
                      <div className="text-sm text-gray-400">Stored on Cloudflare R2</div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-2">PNG, JPG, WebP, or GIF — max 2MB.</p>
                {photoError && <p className="mt-2 text-xs text-red-600">{photoError}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First name
              </label>
              <input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setDirty(true);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last name
              </label>
              <input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setDirty(true);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setDirty(true);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setDirty(true);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setDirty(true);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 bg-white"
              >
                {countries.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.emoji ? `${c.emoji} ` : ""}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  setDirty(true);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 bg-white"
              >
                <option value={initial.timezone}>{initial.timezone}</option>
                <option value="Central European Time (CET) UTC+01:00">
                  Central European Time (CET) UTC+01:00
                </option>
                <option value="Greenwich Mean Time (GMT) UTC+00:00">
                  Greenwich Mean Time (GMT) UTC+00:00
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setDirty(true);
              }}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              Brief description for your profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
