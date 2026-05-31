import type { WorkspaceClientOption } from "@/lib/workspace-clients";

/** Premium demo client workspace display names (replaces Test01-style labels). */
export const DEMO_ENTERPRISE_WORKSPACE_NAMES = [
  "Starbucks Paris",
  "Zara Flagship",
  "Monoprix Studio",
] as const;

const DUMMY_CLIENT_NAME =
  /^(test\d*|test\s*\d*|demo\s*client\s*\d*|untitled\s*client?|client\s*\d+)$/i;

export function isDummyWorkspaceName(name: string): boolean {
  return DUMMY_CLIENT_NAME.test(name.trim());
}

/**
 * Map active workspace clients to enterprise demo labels (stable order by id).
 */
export function applyDemoEnterpriseLabels(
  clients: WorkspaceClientOption[]
): WorkspaceClientOption[] {
  const sorted = [...clients].sort((a, b) => a.id.localeCompare(b.id));
  return sorted.map((client, index) => ({
    ...client,
    name:
      index < DEMO_ENTERPRISE_WORKSPACE_NAMES.length
        ? DEMO_ENTERPRISE_WORKSPACE_NAMES[index]
        : isDummyWorkspaceName(client.name)
          ? DEMO_ENTERPRISE_WORKSPACE_NAMES[0]
          : client.name,
  }));
}

export const ALL_CLIENTS_WORKSPACE_ID = "__all_clients__";
