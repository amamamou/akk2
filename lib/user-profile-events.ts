export type UserProfileEventDetail = {
  firstName?: string;
  lastName?: string;
  role?: string;
  avatar?: string | null;
};

export function dispatchUserProfileUpdated(detail: UserProfileEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("akou:user-updated", { detail })
  );
}

export function persistUserProfileToStorage(profile: {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
}) {
  if (typeof window === "undefined") return;
  const storageProfile: Record<string, string> = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
  };
  const avatar = profile.avatar;
  if (
    typeof avatar === "string" &&
    (avatar.startsWith("http") || avatar.startsWith("/"))
  ) {
    storageProfile.avatar = avatar;
  }
  try {
    window.localStorage.setItem("akou.user", JSON.stringify(storageProfile));
  } catch {
    // non-fatal
  }
}
