/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import SettingsHeader, { type SettingsTab } from "./components/SettingsHeader";
import MyDetailsTab from "./components/MyDetailsTab";

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
  { key: "profile", label: "Profile" },
  { key: "password", label: "Password" },
  { key: "team", label: "Team" },
  { key: "plan", label: "Plan" },
  { key: "billing", label: "Billing" },
  { key: "email", label: "Email" },
  { key: "notifications", label: "Notifications" },
  { key: "integrations", label: "Integrations" },
];

const defaultProfile: UserProfile = {
  firstName: "Angela",
  lastName: "Lee",
  email: "angela@untitledui.com",
  role: "Account Manager",
  country: "United States",
  timezone: "Pacific Standard Time (PST) UTC-08:00",
  bio: "I'm an Account Manager based in Paris, and manage our shop in EU/UK",
  avatar: null,
};

export default function SettingsClient() {
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

  // Load any previously saved user profile from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) return;

      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      const stored = parsed as Partial<UserProfile>;
      const next: UserProfile = {
        firstName: stored.firstName ?? defaultProfile.firstName,
        lastName: stored.lastName ?? defaultProfile.lastName,
        email: stored.email ?? defaultProfile.email,
        role: stored.role ?? defaultProfile.role,
        country: stored.country ?? defaultProfile.country,
        timezone: stored.timezone ?? defaultProfile.timezone,
        bio: stored.bio ?? defaultProfile.bio,
        avatar: stored.avatar ?? defaultProfile.avatar ?? null,
      };

      setInitialProfile(next);
      setFirstName(next.firstName);
      setLastName(next.lastName);
      setEmail(next.email);
      setRole(next.role);
      setCountry(next.country);
      setTimezone(next.timezone);
      setBio(next.bio);
      setAvatar(next.avatar ?? null);
      setDirty(false);
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  }, []);

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

            try {
              if (typeof window !== "undefined") {
                window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
                window.dispatchEvent(
                  new CustomEvent("akou:user-updated", {
                    detail: {
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      role: profile.role,
                      avatar: profile.avatar ?? null,
                    },
                  }),
                );
              }
            } catch (err) {
              console.error("Failed to save user profile", err);
            }

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
          ) : (
            <div className="text-sm text-gray-500">
              This feature is coming soon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
