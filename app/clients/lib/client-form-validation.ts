export const SUBSCRIPTION_TIERS = ["STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export type ClientFormState = {
  name: string;
  businessType: string;
  subscriptionTier: SubscriptionTier;
  maxPlayers: string;
  maxStorageGb: string;
  contactPerson: string;
  email: string;
  phone: string;
};

export type ClientFormFieldKey = keyof ClientFormState;

export const initialClientFormState: ClientFormState = {
  name: "",
  businessType: "",
  subscriptionTier: "STARTER",
  maxPlayers: "5",
  maxStorageGb: "2",
  contactPerson: "",
  email: "",
  phone: "",
};

export const tierLocks: Record<
  Exclude<SubscriptionTier, "ENTERPRISE">,
  { maxPlayers: number; maxStorageGb: number }
> = {
  STARTER: { maxPlayers: 5, maxStorageGb: 2 },
  PROFESSIONAL: { maxPlayers: 20, maxStorageGb: 20 },
};

export const PLAN_OPTIONS: {
  tier: SubscriptionTier;
  label: string;
  description: string;
  highlight: string;
}[] = [
  {
    tier: "STARTER",
    label: "Starter",
    description: "For small teams piloting audio across a few spaces.",
    highlight: "5 players · 2 GB storage",
  },
  {
    tier: "PROFESSIONAL",
    label: "Growth",
    description: "For growing operations with more players and media.",
    highlight: "20 players · 20 GB storage",
  },
  {
    tier: "ENTERPRISE",
    label: "Enterprise",
    description: "Custom limits and scale for large deployments.",
    highlight: "Custom limits",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_PATTERN = /^[\d\s+\-().]+$/;

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed.length > 0 && EMAIL_PATTERN.test(trimmed);
}

export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  if (!PHONE_CHARS_PATTERN.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function validateClientField(
  key: ClientFormFieldKey,
  form: ClientFormState
): string | null {
  switch (key) {
    case "name":
      return form.name.trim() ? null : "Client name is required.";
    case "businessType":
      return form.businessType.trim() ? null : "Business type is required.";
    case "contactPerson":
      return form.contactPerson.trim() ? null : "Contact name is required.";
    case "email":
      if (!form.email.trim()) return "Email is required.";
      if (!isValidEmail(form.email)) return "Enter a valid email address.";
      return null;
    case "phone":
      if (!form.phone.trim()) return "Phone number is required.";
      if (!isValidPhone(form.phone)) return "Enter a valid phone number (7–15 digits).";
      return null;
    case "maxPlayers": {
      if (form.subscriptionTier !== "ENTERPRISE") return null;
      const n = Number(form.maxPlayers);
      if (!Number.isFinite(n) || n < 1) return "Enter a positive player limit.";
      return null;
    }
    case "maxStorageGb": {
      if (form.subscriptionTier !== "ENTERPRISE") return null;
      const n = Number(form.maxStorageGb);
      if (!Number.isFinite(n) || n < 1) return "Enter a positive storage quota.";
      return null;
    }
    default:
      return null;
  }
}

export function validateClientForm(
  form: ClientFormState
): Partial<Record<ClientFormFieldKey, string>> {
  const keys: ClientFormFieldKey[] = [
    "name",
    "businessType",
    "contactPerson",
    "email",
    "phone",
    "maxPlayers",
    "maxStorageGb",
  ];
  const errors: Partial<Record<ClientFormFieldKey, string>> = {};
  for (const key of keys) {
    const err = validateClientField(key, form);
    if (err) errors[key] = err;
  }
  return errors;
}

export function isClientFormValid(form: ClientFormState): boolean {
  return Object.keys(validateClientForm(form)).length === 0;
}

export function clientFormToPayload(form: ClientFormState) {
  const tier = form.subscriptionTier;
  const tierLock = tier === "ENTERPRISE" ? null : tierLocks[tier];
  return {
    name: form.name.trim(),
    businessType: form.businessType.trim(),
    subscriptionTier: tier,
    contactPerson: form.contactPerson.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    maxPlayers: tierLock ? tierLock.maxPlayers : Number(form.maxPlayers),
    maxStorageGb: tierLock ? tierLock.maxStorageGb : Number(form.maxStorageGb),
  };
}

export function clientToFormState(client: {
  name: string;
  businessType?: string;
  subscriptionTier: SubscriptionTier | string;
  maxPlayers: number;
  maxStorageGb: number;
  contactPerson?: string;
  email?: string;
  phone?: string;
}): ClientFormState {
  const tier = (client.subscriptionTier || "STARTER") as SubscriptionTier;
  return {
    name: client.name || "",
    businessType: client.businessType || "",
    subscriptionTier: tier,
    maxPlayers: String(client.maxPlayers ?? tierLocks.STARTER.maxPlayers),
    maxStorageGb: String(client.maxStorageGb ?? tierLocks.STARTER.maxStorageGb),
    contactPerson: client.contactPerson || "",
    email: client.email || "",
    phone: client.phone || "",
  };
}
