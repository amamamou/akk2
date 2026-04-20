"use client";

import React, { useRef, useState } from "react";
import NextImage from "next/image";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function validateAndSetFile(f: File | null) {
    setPhotoError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setPhotoError("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setAvatar(result);
        setDirty(true);
      }
    };
    reader.onerror = () => {
      setPhotoError("Failed to read image.");
    };
    reader.readAsDataURL(f);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    void validateAndSetFile(f);
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

  function removePhoto() {
    setAvatar(null);
    setDirty(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`flex items-center gap-6 p-4 rounded-lg border text-sm transition-colors ${
                isDragging
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 bg-gray-50/70"
              }`}
            >
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-200 overflow-hidden">
                {avatar ? (
                  <NextImage
                    src={avatar}
                    alt="Profile preview"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-xs">64x64</span>
                )}
              </div>

              <div className="flex-1">
                <p className="text-gray-700">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-900 font-medium hover:underline"
                  >
                    Click to upload
                  </button>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 800x400px.
                </p>
                {photoError && (
                  <p className="mt-1 text-xs text-red-500">{photoError}</p>
                )}
              </div>

              {avatar && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  Remove
                </button>
              )}
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
