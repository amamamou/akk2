/**
 * Canonical UUIDs and display labels from 010_french_enterprise_demo_seed.sql.
 * Frontend lookups use these when API rows omit joined names.
 */
import type { WorkspaceClientOption } from "@/lib/workspace-clients";

export type FrenchDemoEnterprise = {
  clientId: string;
  tenantId: string;
  slug: string;
  name: string;
};

/** Five enterprise workspaces (tenant 001 … 005). */
export const FRENCH_DEMO_ENTERPRISES: FrenchDemoEnterprise[] = [
  {
    clientId: "22222222-2222-4222-8222-222222220001",
    tenantId: "11111111-1111-4111-8111-111111110001",
    slug: "fr-demo-starbucks-sg",
    name: "Starbucks Boulevard Saint-Germain",
  },
  {
    clientId: "22222222-2222-4222-8222-222222220002",
    tenantId: "11111111-1111-4111-8111-111111110002",
    slug: "fr-demo-zara-rivoli",
    name: "Zara Rue de Rivoli",
  },
  {
    clientId: "22222222-2222-4222-8222-222222220003",
    tenantId: "11111111-1111-4111-8111-111111110003",
    slug: "fr-demo-monoprix-opera",
    name: "Monoprix Opéra",
  },
  {
    clientId: "22222222-2222-4222-8222-222222220004",
    tenantId: "11111111-1111-4111-8111-111111110004",
    slug: "fr-demo-galeries-lafayette",
    name: "Galeries Lafayette Haussmann",
  },
  {
    clientId: "22222222-2222-4222-8222-222222220005",
    tenantId: "11111111-1111-4111-8111-111111110005",
    slug: "fr-demo-sephora-ce",
    name: "Sephora Champs-Élysées",
  },
];

/** 25 seeded players: player UUID → location name + tenant UUID. */
export const FRENCH_DEMO_PLAYER_REGISTRY: Record<
  string,
  { name: string; tenantId: string }
> = {
  "44444444-4444-4444-8444-444444440101": {
    name: "Main Lounge",
    tenantId: "11111111-1111-4111-8111-111111110001",
  },
  "44444444-4444-4444-8444-444444440102": {
    name: "Order Counter",
    tenantId: "11111111-1111-4111-8111-111111110001",
  },
  "44444444-4444-4444-8444-444444440103": {
    name: "Outdoor Terrace",
    tenantId: "11111111-1111-4111-8111-111111110001",
  },
  "44444444-4444-4444-8444-444444440104": {
    name: "Restrooms Area",
    tenantId: "11111111-1111-4111-8111-111111110001",
  },
  "44444444-4444-4444-8444-444444440105": {
    name: "Back Office",
    tenantId: "11111111-1111-4111-8111-111111110001",
  },
  "44444444-4444-4444-8444-444444440201": {
    name: "Women Floor",
    tenantId: "11111111-1111-4111-8111-111111110002",
  },
  "44444444-4444-4444-8444-444444440202": {
    name: "Men Floor",
    tenantId: "11111111-1111-4111-8111-111111110002",
  },
  "44444444-4444-4444-8444-444444440203": {
    name: "Fitting Rooms",
    tenantId: "11111111-1111-4111-8111-111111110002",
  },
  "44444444-4444-4444-8444-444444440204": {
    name: "Cash Wrap",
    tenantId: "11111111-1111-4111-8111-111111110002",
  },
  "44444444-4444-4444-8444-444444440205": {
    name: "Stockroom",
    tenantId: "11111111-1111-4111-8111-111111110002",
  },
  "44444444-4444-4444-8444-444444440301": {
    name: "Entrance Grocery",
    tenantId: "11111111-1111-4111-8111-111111110003",
  },
  "44444444-4444-4444-8444-444444440302": {
    name: "Fresh Produce",
    tenantId: "11111111-1111-4111-8111-111111110003",
  },
  "44444444-4444-4444-8444-444444440303": {
    name: "Checkout Lanes",
    tenantId: "11111111-1111-4111-8111-111111110003",
  },
  "44444444-4444-4444-8444-444444440304": {
    name: "Wine & Spirits",
    tenantId: "11111111-1111-4111-8111-111111110003",
  },
  "44444444-4444-4444-8444-444444440305": {
    name: "Staff Break Room",
    tenantId: "11111111-1111-4111-8111-111111110003",
  },
  "44444444-4444-4444-8444-444444440401": {
    name: "Grand Hall",
    tenantId: "11111111-1111-4111-8111-111111110004",
  },
  "44444444-4444-4444-8444-444444440402": {
    name: "Luxury Brands",
    tenantId: "11111111-1111-4111-8111-111111110004",
  },
  "44444444-4444-4444-8444-444444440403": {
    name: "Restaurant Dome",
    tenantId: "11111111-1111-4111-8111-111111110004",
  },
  "44444444-4444-4444-8444-444444440404": {
    name: "Beauty Hall",
    tenantId: "11111111-1111-4111-8111-111111110004",
  },
  "44444444-4444-4444-8444-444444440405": {
    name: "VIP Lounge",
    tenantId: "11111111-1111-4111-8111-111111110004",
  },
  "44444444-4444-4444-8444-444444440501": {
    name: "Fragrance Atelier",
    tenantId: "11111111-1111-4111-8111-111111110005",
  },
  "44444444-4444-4444-8444-444444440502": {
    name: "Makeup Studio",
    tenantId: "11111111-1111-4111-8111-111111110005",
  },
  "44444444-4444-4444-8444-444444440503": {
    name: "Skincare Bar",
    tenantId: "11111111-1111-4111-8111-111111110005",
  },
  "44444444-4444-4444-8444-444444440504": {
    name: "Checkout",
    tenantId: "11111111-1111-4111-8111-111111110005",
  },
  "44444444-4444-4444-8444-444444440505": {
    name: "Back Office",
    tenantId: "11111111-1111-4111-8111-111111110005",
  },
};

export const FRENCH_DEMO_MEDIA_TITLES: Record<string, string> = {
  "33333333-3333-4333-8333-333333330101": "Acoustique Matin Paris",
  "33333333-3333-4333-8333-333333330102": "Latte Lounge — Version Douce",
  "33333333-3333-4333-8333-333333330103": "Terrasse Saint-Germain",
  "33333333-3333-4333-8333-333333330104": "Annonces Bienvenue FR",
  "33333333-3333-4333-8333-333333330201": "Energy Upbeat — Collection Été",
  "33333333-3333-4333-8333-333333330202": "Runway Pulse Paris",
  "33333333-3333-4333-8333-333333330203": "Minimal Chic Instrumental",
  "33333333-3333-4333-8333-333333330204": "Soldes — Message Promo",
  "33333333-3333-4333-8333-333333330301": "Courses du Matin — Pop Légère",
  "33333333-3333-4333-8333-333333330302": "Rayon Frais — Ambiance Douce",
  "33333333-3333-4333-8333-333333330303": "Opéra Store Loop",
  "33333333-3333-4333-8333-333333330304": "Annonce Horaires Magasin",
  "33333333-3333-4333-8333-333333330401": "Haussmann Luxury Lounge",
  "33333333-3333-4333-8333-333333330402": "Couture Walk — Piano Moderne",
  "33333333-3333-4333-8333-333333330403": "Parfumerie Élégance",
  "33333333-3333-4333-8333-333333330404": "Bienvenue Galeries — FR",
  "33333333-3333-4333-8333-333333330501": "Beauty Beat — Champs-Élysées",
  "33333333-3333-4333-8333-333333330502": "Glow Up Instrumental",
  "33333333-3333-4333-8333-333333330503": "Spa Zone Relax",
  "33333333-3333-4333-8333-333333330504": "Nouveautés Maquillage — FR",
};

export function frenchDemoEnterpriseWorkspaceClients(): WorkspaceClientOption[] {
  return FRENCH_DEMO_ENTERPRISES.map((e) => ({
    id: e.clientId,
    name: e.name,
    tenantId: e.tenantId,
  }));
}

/** Merge API clients with seeded enterprises (seed UUIDs win on tenant collision). */
export function mergeEnterpriseWorkspaceClients(
  apiClients: WorkspaceClientOption[]
): WorkspaceClientOption[] {
  const byTenant = new Map<string, WorkspaceClientOption>();
  for (const row of frenchDemoEnterpriseWorkspaceClients()) {
    byTenant.set(row.tenantId, row);
  }
  for (const row of apiClients) {
    if (!row.tenantId) continue;
    if (!byTenant.has(row.tenantId)) {
      byTenant.set(row.tenantId, row);
    }
  }
  return Array.from(byTenant.values());
}

export function frenchDemoPlayerName(playerId: string | null | undefined): string | undefined {
  if (!playerId) return undefined;
  return FRENCH_DEMO_PLAYER_REGISTRY[playerId]?.name;
}

export function frenchDemoTenantForPlayer(playerId: string | null | undefined): string | undefined {
  if (!playerId) return undefined;
  return FRENCH_DEMO_PLAYER_REGISTRY[playerId]?.tenantId;
}

export function frenchDemoTenantSlug(tenantId: string): string | undefined {
  return FRENCH_DEMO_ENTERPRISES.find((e) => e.tenantId === tenantId)?.slug;
}

export function frenchDemoMediaTitle(mediaId: string | null | undefined): string | undefined {
  if (!mediaId) return undefined;
  return FRENCH_DEMO_MEDIA_TITLES[mediaId];
}

export function frenchDemoEnterpriseByTenantId(
  tenantId: string | null | undefined
): FrenchDemoEnterprise | undefined {
  if (!tenantId) return undefined;
  return FRENCH_DEMO_ENTERPRISES.find((e) => e.tenantId === tenantId);
}

export function frenchDemoPlayerIdsForTenant(tenantId: string): Set<string> {
  const ids = new Set<string>();
  for (const [playerId, meta] of Object.entries(FRENCH_DEMO_PLAYER_REGISTRY)) {
    if (meta.tenantId === tenantId) ids.add(playerId);
  }
  return ids;
}