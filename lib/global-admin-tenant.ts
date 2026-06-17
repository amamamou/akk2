/** Master admin tenant namespace (Cloudflare R2 + global template catalog). */
export const GLOBAL_ADMIN_TENANT_ID = "99999999-9999-9999-9999-999999999999";

export const ANALYTICS_ALL_CLIENTS_ID = "all";

type TenantKeyed = {
  tenantId?: string | null;
  tenant_id?: string | null;
};

export function resolveItemTenantId(item: TenantKeyed): string | undefined {
  const raw = item.tenantId ?? item.tenant_id;
  return raw == null || raw === "" ? undefined : String(raw);
}

/** Client-side catalog guard — mirrors backend Super Admin merge policy. */
export function isVisibleCatalogItem(
  item: TenantKeyed,
  workspaceTenantId: string,
  isSuperAdminUser: boolean
): boolean {
  const tid = resolveItemTenantId(item);
  if (!isSuperAdminUser) {
    return tid === workspaceTenantId;
  }
  return (
    tid === workspaceTenantId ||
    tid === GLOBAL_ADMIN_TENANT_ID ||
    tid === undefined
  );
}

export function filterSuperAdminCatalog<T extends TenantKeyed>(
  items: T[],
  workspaceTenantId: string,
  isSuperAdminUser: boolean
): T[] {
  return items.filter((item) =>
    isVisibleCatalogItem(item, workspaceTenantId, isSuperAdminUser)
  );
}

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return dedupeByKey(items, (item) => item.id);
}

export function dedupeByKey<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
