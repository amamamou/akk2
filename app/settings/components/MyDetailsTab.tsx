"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import { Check, Loader2, RotateCcw, UploadCloud, Edit2, Trash, Camera } from "lucide-react";
import { getApiClient } from "@/lib/api-client";
import { isSuperAdminRole } from "@/lib/rbac";
import { useAuth } from "@/app/context/AuthContext";
import {
  dispatchUserProfileUpdated,
  persistUserProfileToStorage,
} from "@/lib/user-profile-events";
import {
  dashboardAccentShadow,
  dashboardPanelSubtitle,
  dashboardPanelTitle,
  dashboardSectionLabel,
} from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

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
    avatar?: string | null;
  };
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  country: string;
  timezone: string;
  countries: Country[];
  avatar: string | null;
  dirty: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
  setFirstName: (val: string) => void;
  setLastName: (val: string) => void;
  setEmail: (val: string) => void;
  setRole: (val: string) => void;
  setCountry: (val: string) => void;
  setTimezone: (val: string) => void;
  setAvatar: (val: string | null) => void;
  setDirty: (val: boolean) => void;
}

const INPUT_CLASS =
  "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#A473FF]/40 focus:outline-none focus:ring-2 focus:ring-[#A473FF]/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="text-sm font-medium text-gray-900 dark:text-zinc-100">{label}</label>
      {hint ? <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">{hint}</p> : null}
    </div>
  );
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
  countries,
  avatar,
  dirty,
  isSaving,
  onCancel,
  onSave,
  setFirstName,
  setLastName,
  setEmail,
  setRole,
  setCountry,
  setTimezone,
  setAvatar,
  setDirty,
}: MyDetailsTabProps) {
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAvatarError(false);
  }, [avatar]);

  const gradientId = useId();
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Your profile";
  const initials = `${(firstName || "").trim().charAt(0)}${(lastName || "").trim().charAt(0)}`.toUpperCase();

  const { user } = useAuth();
  const isProtectedSuperAdmin =
    isSuperAdminRole(role) || isSuperAdminRole(user?.role);
  const canEditRole = isSuperAdminRole(user?.role) && !isProtectedSuperAdmin;

  function notifyAvatarChange(url: string | null) {
    dispatchUserProfileUpdated({ firstName, lastName, role, avatar: url });
    persistUserProfileToStorage({ firstName, lastName, email, avatar: url });
  }

  async function uploadAndPersistPhoto(f: File) {
    const apiClient = getApiClient();
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const uploadRes = await apiClient.uploadImage(f);
      const publicUrl = uploadRes.url;
      if (!publicUrl) throw new Error("Upload succeeded but no URL was returned");
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
    if (f.size > 2 * 1024 * 1024) {
      setPhotoError("Image file is too large. Please use a file under 2MB.");
      return;
    }
    await uploadAndPersistPhoto(f);
  }

  async function removePhoto() {
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      await getApiClient().updateUserProfile({ profilePhotoUrl: null });
      setAvatar(null);
      setDirty(false);
      notifyAvatarChange(null);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Failed to remove profile photo");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className={dashboardPanelTitle}>Personal information</h2>
        <p className={cn(dashboardPanelSubtitle, "mt-1")}>
          Your profile is visible across the platform and in activity logs.
        </p>
      </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => {
            void validateAndSetFile(e.target.files?.[0] ?? null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="hidden"
          disabled={uploadingPhoto}
        />

        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            void validateAndSetFile(e.dataTransfer.files?.[0] ?? null);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          className={cn(
            "mb-8 flex flex-col gap-5 sm:flex-row sm:items-center",
            isDragging && "rounded-xl ring-2 ring-[#A473FF]/20"
          )}
        >
          <button
            type="button"
            disabled={uploadingPhoto}
            onClick={() => fileInputRef.current?.click()}
            aria-label={avatar ? "Change profile photo" : "Upload profile photo"}
            className="group relative mx-auto h-[88px] w-[88px] shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A473FF]/40 disabled:opacity-60 sm:mx-0"
          >
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
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
                strokeWidth="5"
                strokeDasharray="5 5"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white dark:bg-zinc-900">
              {uploadingPhoto ? (
                <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
              ) : avatar && !avatarError && isRemoteImageUrl(avatar) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-semibold text-gray-700 dark:text-zinc-200">
                  {initials || "?"}
                </span>
              )}
            </div>
            <span className="pointer-events-none absolute inset-0 flex items-end justify-end p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="rounded-full bg-white p-1.5 shadow-md dark:bg-zinc-800">
                <Camera size={14} className="text-gray-600 dark:text-zinc-300" />
              </span>
            </span>
          </button>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-lg font-semibold tracking-tight text-gray-950 dark:text-zinc-50">
              {displayName}
            </p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">{email || "No email"}</p>
            {role ? (
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                {role}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {!avatar ? (
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <UploadCloud size={14} className="text-gray-400" />
                  Upload photo
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <Edit2 size={14} className="text-gray-400" />
                    Replace
                  </button>
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => void removePhoto()}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Trash size={14} className="text-gray-400" />
                    Remove
                  </button>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400 dark:text-zinc-500">
              PNG, JPG, WebP, or GIF · max 2MB · saved immediately on upload
            </p>
            {photoError ? (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{photoError}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className={cn(dashboardSectionLabel, "mb-4")}>Identity</p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <FieldLabel label="First name" hint="Shown in greetings and activity." />
                <input
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setDirty(true);
                  }}
                  autoComplete="given-name"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <FieldLabel label="Last name" />
                <input
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setDirty(true);
                  }}
                  autoComplete="family-name"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <FieldLabel label="Email" hint="Used to sign in and receive notifications." />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setDirty(true);
                  }}
                  autoComplete="email"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <FieldLabel
                  label="Role"
                  hint={
                    isProtectedSuperAdmin
                      ? "Super Admin role is fixed."
                      : canEditRole
                        ? "Controls permissions in this workspace."
                        : "Managed by your Super Admin."
                  }
                />
                <input
                  value={role}
                  readOnly={!canEditRole}
                  disabled={!canEditRole}
                  onChange={(e) => {
                    if (!canEditRole) return;
                    setRole(e.target.value);
                    setDirty(true);
                  }}
                  className={cn(
                    INPUT_CLASS,
                    !canEditRole &&
                      "cursor-not-allowed bg-gray-50 text-gray-500 dark:bg-zinc-900/80 dark:text-zinc-500"
                  )}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 dark:border-zinc-800">
            <p className={cn(dashboardSectionLabel, "mb-4")}>Regional</p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <FieldLabel label="Country" hint="Used for localized defaults." />
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setDirty(true);
                  }}
                  className={cn(INPUT_CLASS, "appearance-none")}
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
                <FieldLabel label="Timezone" hint="Applies to schedules and timestamps." />
                <select
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    setDirty(true);
                  }}
                  className={cn(INPUT_CLASS, "appearance-none")}
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
          </div>
        </div>

        <footer className="mt-8 flex flex-col-reverse items-stretch justify-end gap-2 border-t border-gray-100 pt-6 sm:flex-row sm:items-center dark:border-zinc-800">
          {dirty ? (
            <p className="mr-auto text-xs text-amber-700 dark:text-amber-400 sm:mb-0">
              You have unsaved changes
            </p>
          ) : (
            <p className="mr-auto hidden text-xs text-gray-400 sm:block">
              Changes to your profile are saved when you click Save changes.
            </p>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={!dirty || isSaving}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <RotateCcw size={14} />
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || isSaving}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
              dashboardAccentShadow
            )}
            style={{
              background: "linear-gradient(135deg, #18181B 0%, #202538 38%, #A473FF 100%)",
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check size={15} />
                Save changes
              </>
            )}
          </button>
        </footer>
    </div>
  );
}
