"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { canProvisionPlayers } from "@/lib/rbac";
import { Plus } from "lucide-react";
import ViewToggle from "./ViewToggle";
import {
  workspaceSelectorOptions,
  type WorkspaceClientOption,
} from "@/lib/workspace-clients";

export default function PlayersHeader({
  view,
  onToggleView,
  onAdd,
  showWorkspaceSelector,
  workspaceClients,
  selectedWorkspaceClientId,
  onChangeWorkspaceClient,
}: {
  view: "list" | "grid";
  onToggleView: (v: "list" | "grid") => void;
  onAdd: () => void;
  showWorkspaceSelector?: boolean;
  workspaceClients?: WorkspaceClientOption[];
  selectedWorkspaceClientId?: string;
  onChangeWorkspaceClient?: (clientId: string) => void;
}) {
  const { user } = useAuth();
  const canAddPlayer = canProvisionPlayers(user?.role);

  const selectorOptions = useMemo(
    () => workspaceSelectorOptions(workspaceClients ?? []),
    [workspaceClients]
  );

  return (
    <div className="sticky top-0 z-10 bg-white border-gray-200">
      {showWorkspaceSelector && (
        <div className="px-4 sm:px-8 pt-4 pb-2 border-b border-gray-100 flex items-center gap-2">
          <label
            htmlFor="players-workspace-client"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500 shrink-0"
          >
            Select Client Workspace
          </label>
          <select
            id="players-workspace-client"
            value={selectedWorkspaceClientId || ""}
            onChange={(e) => onChangeWorkspaceClient?.(e.target.value)}
            className="flex-1 max-w-md text-sm px-3 py-1.5 rounded-md bg-violet-50 border border-violet-100 text-gray-900"
          >
            {selectorOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Players</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage connected audio devices by location
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={onToggleView} />
          {canAddPlayer && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-2 rounded-md bg-[#F3F4F6] text-gray-900 px-4 py-2 text-sm font-medium hover:bg-[#E7E7E7]"
            >
              <Plus size={16} />
              <span>Add player</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
