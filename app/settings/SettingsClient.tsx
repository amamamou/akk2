/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import SettingsHeader, { type SettingsTab } from "./components/SettingsHeader";
import MyDetailsTab from "./components/MyDetailsTab";
import BillingTab from "./components/BillingTab";
import PlanTab from "./components/PlanTab";

const USER_STORAGE_KEY = "akou.user";

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  country: string;
  timezone: string;
  bio: string;
  avatar?: string | null;
};

const TABS: SettingsTab[] = [
  { key: "my-details", label: "My details" },
  { key: "plan", label: "Plan" },
  { key: "billing", label: "Billing" },
  { key: "integrations", label: "Integrations" },
];

const defaultProfile: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  country: "United States",
  timezone: "Pacific Standard Time (PST) UTC-08:00",
  bio: "",
  avatar: null,
};

export default function SettingsClient() {
  const { user: authUser } = useAuth();
  const [initialProfile, setInitialProfile] = useState<UserProfile>(defaultProfile);

  const [firstName, setFirstName] = useState(defaultProfile.firstName);
  const [lastName, setLastName] = useState(defaultProfile.lastName);
  const [email, setEmail] = useState(defaultProfile.email);
  const [role, setRole] = useState(defaultProfile.role);
  const [country, setCountry] = useState(defaultProfile.country);
  const [timezone, setTimezone] = useState(defaultProfile.timezone);
  const [bio, setBio] = useState(defaultProfile.bio);
  const [avatar, setAvatar] = useState<string | null>(defaultProfile.avatar ?? null);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("my-details");

  const [countries, setCountries] = useState<
    Array<{ name: string; code?: string; emoji?: string }>
  >([
    { name: defaultProfile.country, code: "US", emoji: "🇺🇸" },
    { name: "United Kingdom", code: "GB", emoji: "🇬🇧" },
    { name: "France", code: "FR", emoji: "🇫🇷" },
  ]);

  // Load user profile: prefer authenticated user, fall back to localStorage, then defaults
  useEffect(() => {
    let profileToUse: UserProfile = defaultProfile;

    // Priority 1: Use authenticated user data from auth context
    if (authUser) {
      profileToUse = {
        firstName: authUser.name?.split(" ")[0] || "",
        lastName: authUser.name?.split(" ").slice(1).join(" ") || "",
        email: authUser.email || "",
        role: authUser.role || "",
        country: profileToUse.country,
        timezone: profileToUse.timezone,
        bio: profileToUse.bio,
        avatar: null,
      };
    } else if (typeof window !== 'undefined') {
      // Priority 2: Fall back to localStorage
      try {
        const raw = window.localStorage.getItem(USER_STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const stored = parsed as Partial<UserProfile>;
            profileToUse = {
              firstName: stored.firstName || '',
              lastName: stored.lastName || '',
              email: stored.email || '',
              role: stored.role || '',
              country: stored.country ?? profileToUse.country,
              timezone: stored.timezone ?? profileToUse.timezone,
              bio: stored.bio || '',
              avatar: stored.avatar || null,
            };
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    setInitialProfile(profileToUse);
    setFirstName(profileToUse.firstName);
    setLastName(profileToUse.lastName);
    setEmail(profileToUse.email);
    setRole(profileToUse.role);
    setCountry(profileToUse.country);
    setTimezone(profileToUse.timezone);
    setBio(profileToUse.bio);
    setAvatar(profileToUse.avatar ?? null);
    setDirty(false);
  }, [authUser]);

  useEffect(() => {
    let mounted = true;
    const codeToEmoji = (cc?: string) => {
      if (!cc) return "";
      const chars = cc
        .toUpperCase()
        .split("")
        .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
      return String.fromCodePoint(...chars);
    };

    fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted || !Array.isArray(data)) return;
        type RestCountry = { name?: { common?: string } | string; cca2?: string };
        const listPre: Array<{ name: string; code?: string }> = (
          data as RestCountry[]
        ).map((c) => {
          const rawName =
            c?.name && typeof c.name === "object"
              ? c.name.common
              : ((c?.name as string) ?? "");
          return { name: String(rawName), code: c?.cca2 };
        });

        const list = listPre
          .filter((x) => x.name && x.name.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((x) => ({
            name: x.name as string,
            code: x.code,
            emoji: codeToEmoji(x.code),
          }));

        setCountries(list);
      })
      .catch(() => {
        // ignore
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="">
        <SettingsHeader
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key)}
          dirty={dirty}
          onCancel={() => {
            setFirstName(initialProfile.firstName);
            setLastName(initialProfile.lastName);
            setEmail(initialProfile.email);
            setRole(initialProfile.role);
            setCountry(initialProfile.country);
            setTimezone(initialProfile.timezone);
            setBio(initialProfile.bio);
            setAvatar(initialProfile.avatar ?? null);
            setDirty(false);
          }}
          onSave={() => {
            // Keep full in-memory profile for the running app/UI
            const profile: UserProfile = {
              firstName,
              lastName,
              email,
              role,
              country,
              timezone,
              bio,
              avatar,
            };

            // Only persist a minimal, safe subset to localStorage to avoid
            // filling the storage with large base64 image data.
            const storageProfile: Partial<UserProfile> = {
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
            };

            // Include avatar only when it looks like a remote URL (not a data: URI)
            const isAvatarUrl = typeof profile.avatar === "string" && (profile.avatar.startsWith("http") || profile.avatar.startsWith("/"));
            if (isAvatarUrl) storageProfile.avatar = profile.avatar;

            if (typeof window !== "undefined") {
              try {
                // Wrap the single setItem call so quota errors don't break the save flow
                try {
                  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storageProfile));
                } catch (err) {
                  // QuotaExceededError or other storage problems are non-fatal here.
                  // We log a warning and let the app continue with the in-memory profile.
                  console.warn("Failed to write user metadata to localStorage", err);
                }

                // Notify other parts of the app about the updated user. Only include
                // the avatar in the event when it's a safe URL (not a potentially huge data URI).
                window.dispatchEvent(
                  new CustomEvent("akou:user-updated", {
                    detail: {
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      role: profile.role,
                      avatar: isAvatarUrl ? profile.avatar : null,
                    },
                  }),
                );
              } catch (err) {
                // Something unexpected happened while saving/dispatching. Don't crash the app.
                console.error("Failed to persist user update", err);
              }
            }

            // Keep the full profile in memory (this includes data URIs temporarily)
            setInitialProfile(profile);
            setDirty(false);
          }}
        />

        <div className="px-8 py-8">
          {activeTab === "my-details" ? (
            <MyDetailsTab
              initial={initialProfile}
              firstName={firstName}
              lastName={lastName}
              email={email}
              role={role}
              country={country}
              timezone={timezone}
              bio={bio}
              countries={countries}
              avatar={avatar}
              setFirstName={setFirstName}
              setLastName={setLastName}
              setEmail={setEmail}
              setRole={setRole}
              setCountry={setCountry}
              setTimezone={setTimezone}
              setBio={setBio}
              setAvatar={setAvatar}
              setDirty={setDirty}
            />
          ) : activeTab === "plan" ? (
            <PlanTab />
          ) : activeTab === "billing" ? (
            <BillingTab />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Integrations</p>
              <p className="mt-2">
                Third-party integrations are not configured for this environment yet.
                Use the Plan and Billing tabs for subscription and invoice details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
