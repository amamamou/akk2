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
    <div className="sticky top-0 z-10 bg-[#F4F4F5]">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Players</h1>
            <p className="mt-1 text-sm text-gray-500">Manage connected audio devices by location</p>
          </div>

          <div className="flex gap-2 items-center flex-wrap justify-end">
            {showWorkspaceSelector && (
              <div className="relative">
                <select
                  id="players-workspace-client"
                  value={selectedWorkspaceClientId || ""}
                  onChange={(e) => onChangeWorkspaceClient?.(e.target.value)}
                  className="border border-violet-100 rounded-lg text-sm px-3 py-1.5 bg-violet-50 text-gray-900 outline-none focus:border-violet-200 appearance-none pr-8 max-w-md"
                >
                  {selectorOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <ViewToggle view={view} onChange={onToggleView} />
              {canAddPlayer && (
        <button
  type="button"
  onClick={onAdd}
  className="group inline-flex items-center gap-3 h-12 px-5 bg-white text-gray-900 font-medium text-sm rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:shadow-lg hover:translate-y-0.5 cursor-pointer"
>
  <span className="inline-flex items-center justify-center transition-colors">
    <Plus
      size={16}
      strokeWidth={1.9}
      className="text-zinc-500 group-hover:text-[#A473FF] transition-colors"
    />
  </span>

  <span>Add player</span>
</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}