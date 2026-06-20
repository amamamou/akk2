"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import SettingsPageHeader from "./components/SettingsPageHeader";
import SettingsPageSkeleton from "./components/SettingsPageSkeleton";
import SettingsTabBar, { type SettingsTab } from "./components/SettingsTabBar";
import MyDetailsTab from "./components/MyDetailsTab";
import BillingTab from "./components/BillingTab";
import PlanTab from "./components/PlanTab";
import { getApiClient } from "@/lib/api-client";
import {
  dispatchUserProfileUpdated,
  persistUserProfileToStorage,
} from "@/lib/user-profile-events";
import { dashboardCardClass, dashboardContainerClass, dashboardPageClass } from "@/app/dashboard/dashboard-styles";
import { cn } from "@/utils/cn";

const USER_STORAGE_KEY = "akou.user";

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  country: string;
  timezone: string;
  avatar?: string | null;
};

const TABS: SettingsTab[] = [
  { key: "my-details", label: "My details" },
  { key: "plan", label: "Plan" },
  { key: "billing", label: "Billing" },
];

const defaultProfile: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  country: "United States",
  timezone: "Pacific Standard Time (PST) UTC-08:00",
  avatar: null,
};

export default function SettingsClient() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [initialProfile, setInitialProfile] = useState<UserProfile>(defaultProfile);
  const [profileReady, setProfileReady] = useState(false);

  const [firstName, setFirstName] = useState(defaultProfile.firstName);
  const [lastName, setLastName] = useState(defaultProfile.lastName);
  const [email, setEmail] = useState(defaultProfile.email);
  const [role, setRole] = useState(defaultProfile.role);
  const [country, setCountry] = useState(defaultProfile.country);
  const [timezone, setTimezone] = useState(defaultProfile.timezone);
  const [avatar, setAvatar] = useState<string | null>(defaultProfile.avatar ?? null);
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("my-details");

  const [countries, setCountries] = useState<
    Array<{ name: string; code?: string; emoji?: string }>
  >([
    { name: defaultProfile.country, code: "US", emoji: "🇺🇸" },
    { name: "United Kingdom", code: "GB", emoji: "🇬🇧" },
    { name: "France", code: "FR", emoji: "🇫🇷" },
  ]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setProfileReady(false);

    const applyProfile = (profileToUse: UserProfile) => {
      if (cancelled) return;
      setInitialProfile(profileToUse);
      setFirstName(profileToUse.firstName);
      setLastName(profileToUse.lastName);
      setEmail(profileToUse.email);
      setRole(profileToUse.role);
      setCountry(profileToUse.country);
      setTimezone(profileToUse.timezone);
      setAvatar(profileToUse.avatar ?? null);
      setDirty(false);
    };

    const finishLoading = () => {
      if (!cancelled) setProfileReady(true);
    };

    const loadFromStorage = (): UserProfile | null => {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem(USER_STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        const stored = parsed as Partial<UserProfile>;
        return {
          firstName: stored.firstName || "",
          lastName: stored.lastName || "",
          email: stored.email || "",
          role: stored.role || "",
          country: stored.country ?? defaultProfile.country,
          timezone: stored.timezone ?? defaultProfile.timezone,
          avatar: stored.avatar || null,
        };
      } catch {
        return null;
      }
    };

    if (authUser) {
      void (async () => {
        try {
          const res = await getApiClient().getUserProfile();
          if (cancelled) return;
          const u = res.user;
          const profileToUse: UserProfile = {
            firstName: u.firstName ?? authUser.name?.split(" ")[0] ?? "",
            lastName: u.lastName ?? authUser.name?.split(" ").slice(1).join(" ") ?? "",
            email: u.email || authUser.email || "",
            role: u.role || authUser.role || "",
            country: u.country ?? defaultProfile.country,
            timezone: u.timezone ?? defaultProfile.timezone,
            avatar: u.profilePhotoUrl ?? null,
          };
          applyProfile(profileToUse);
          dispatchUserProfileUpdated({
            firstName: profileToUse.firstName,
            lastName: profileToUse.lastName,
            role: profileToUse.role,
            avatar: profileToUse.avatar,
          });
        } catch {
          const fallback: UserProfile = {
            firstName: authUser.name?.split(" ")[0] || "",
            lastName: authUser.name?.split(" ").slice(1).join(" ") || "",
            email: authUser.email || "",
            role: authUser.role || "",
            country: defaultProfile.country,
            timezone: defaultProfile.timezone,
            avatar: loadFromStorage()?.avatar ?? null,
          };
          applyProfile(fallback);
        } finally {
          finishLoading();
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    let profileToUse: UserProfile = defaultProfile;

    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(USER_STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            const stored = parsed as Partial<UserProfile>;
            profileToUse = {
              firstName: stored.firstName || "",
              lastName: stored.lastName || "",
              email: stored.email || "",
              role: stored.role || "",
              country: stored.country ?? profileToUse.country,
              timezone: stored.timezone ?? profileToUse.timezone,
              avatar: stored.avatar || null,
            };
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    applyProfile(profileToUse);
    finishLoading();
  }, [authUser, authLoading]);

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

  if (authLoading || !profileReady) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className={dashboardPageClass}>
      <div className={dashboardContainerClass}>
        <SettingsPageHeader />

        <div className={cn(dashboardCardClass, "flex min-h-[calc(100vh-14rem)] flex-col overflow-hidden")}>
          <SettingsTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 p-6 sm:p-8">
            {activeTab === "my-details" ? (
              <MyDetailsTab
                initial={initialProfile}
                firstName={firstName}
                lastName={lastName}
                email={email}
                role={role}
                country={country}
                timezone={timezone}
                countries={countries}
                avatar={avatar}
                dirty={dirty}
                isSaving={isSaving}
                onCancel={() => {
                  setFirstName(initialProfile.firstName);
                  setLastName(initialProfile.lastName);
                  setEmail(initialProfile.email);
                  setRole(initialProfile.role);
                  setCountry(initialProfile.country);
                  setTimezone(initialProfile.timezone);
                  setAvatar(initialProfile.avatar ?? null);
                  setDirty(false);
                }}
                onSave={() => {
                  void (async () => {
                    setIsSaving(true);
                    const profile: UserProfile = {
                      firstName,
                      lastName,
                      email,
                      role,
                      country,
                      timezone,
                      avatar,
                    };

                    const isAvatarUrl =
                      typeof profile.avatar === "string" &&
                      (profile.avatar.startsWith("http") || profile.avatar.startsWith("/"));

                    try {
                      await getApiClient().updateUserProfile({
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        country: profile.country,
                        timezone: profile.timezone,
                        profilePhotoUrl: isAvatarUrl ? profile.avatar : profile.avatar ?? null,
                      });
                    } catch (err) {
                      console.error("Failed to save profile to server", err);
                    } finally {
                      setIsSaving(false);
                    }

                    persistUserProfileToStorage({
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      email: profile.email,
                      avatar: isAvatarUrl ? profile.avatar : null,
                    });

                    dispatchUserProfileUpdated({
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      role: profile.role,
                      avatar: isAvatarUrl ? profile.avatar : null,
                    });

                    setInitialProfile(profile);
                    setDirty(false);
                  })();
                }}
                setFirstName={setFirstName}
                setLastName={setLastName}
                setEmail={setEmail}
                setRole={setRole}
                setCountry={setCountry}
                setTimezone={setTimezone}
                setAvatar={setAvatar}
                setDirty={setDirty}
              />
            ) : activeTab === "plan" ? (
              <PlanTab onOpenBilling={() => setActiveTab("billing")} />
            ) : (
              <BillingTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
