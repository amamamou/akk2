# Frontend Role & Architecture Map — `v2` branch

> Scope: `frontend/` (Next.js App Router, branch `v2`). This is a file-by-file blueprint of how
> role segregation (`SUPER_ADMIN` vs `MANAGER`) is actually implemented in the active code —
> which components strip features from the DOM, switch layout matrices, or context-lock pages.
>
> Role source of truth: `useAuth()` → `user.role` (string from the JWT claim). Helpers live in
> `lib/rbac.ts`.

---

## 0. Role primitives — `lib/rbac.ts`

```ts
normalizeRole(role)      // String(role).trim().toUpperCase()
isSuperAdminRole(role)   // === "SUPER_ADMIN"
isManagerRole(role)      // === "MANAGER"
canProvisionPlayers(role)// === isSuperAdminRole (player creation is Super Admin only)
```

All role checks should funnel through these. Two components still inline their own check
(documented below) — noted as consistency follow-ups, not bugs.

---

## 1. Dashboard / Overview

| File | Role logic |
|------|------------|
| `app/dashboard/DashboardClient.tsx` | **No role branching.** Does not import `useAuth` or `rbac`. Identical render for both roles; isolation is purely tenant-scoped via the API client header. |
| `app/components/Sidebar.tsx` | Global nav. `isAdmin = /admin/i.test(user.role)` (line 26–27). **`SUPER_ADMIN` matches** (substring "admin"); **`MANAGER` does not**. |

**Sidebar gating reality:**
- The nav is **icon-only** (no text labels) — `LayoutDashboard`, `CalendarDays`, `Users`, `Speaker`, `ListMusic`, `Music`, `BarChart3`, `Settings`.
- Only the **`/clients`** link is role-gated: `{isAdmin && <SidebarButton href="/clients" .../>}` (lines 79–84). Hidden for `MANAGER`.
- All other routes (dashboard, schedule, players, library, analytics, settings) render for both roles. Page-level locks (below) do the real enforcement.

---

## 2. Schedule (multi-view toolbar + cell capture)

| File | Responsibility |
|------|----------------|
| `app/schedule/ScheduleClient.tsx` | Page controller: `viewMode` state, workspace selection, All-Clients aggregation, `pickerCell` tenant capture. |
| `app/schedule/components/ScheduleToolbar.tsx` | Segmented control + workspace dropdown. |
| `app/schedule/components/ScheduleAssignModal.tsx` | Tenant-scoped catalog (`listMedia` + `listPlaylists`). |
| `app/schedule/components/CalendarCell.tsx` | `+` quick-create trigger. |
| `lib/schedule-calendar.ts` | `ScheduleViewMode`, `buildWeekDays()`, `buildMonthGrid()`, `HOUR_SLOTS`. |
| `lib/schedule-all-clients.ts` | `loadAllClientScheduleSegments()`, `resolveAllClientsEnterpriseRows()`. |

**Multi-view state:** `ScheduleToolbar` renders a segmented control over
`ScheduleViewMode = "week" | "month" | "hour"` → labels **Week View / Month View / Hour View**,
bound to `viewMode` + `onChangeViewMode`. Active state via `viewMode === opt.mode`.
- Week → `renderWeekGrid` (dynamic dates from `buildWeekDays()`).
- Month → `renderMonthGrid` (7-column matrix from `buildMonthGrid()`).
- Hour → `renderHourGrid` (08:00–22:00 from `HOUR_SLOTS`).

**SUPER_ADMIN segregation:**
- Workspace dropdown built with `workspaceSelectorOptions(...)` which **prepends "All Clients"**
  (`ALL_CLIENTS_WORKSPACE_ID = "all-clients"`, `tenantId = "ALL_TENANTS"`).
- When `isAllClientsWorkspace`, `renderScheduleBody()` renders **one `<section>` per client**
  (violet header = `seg.clientName`) each with its own grid:
  `renderXGrid(seg.events, segRooms, seg.tenantId)`. Backed by
  `loadAllClientScheduleSegments()` looping every tenant.
- Single-client selection → `setWorkspaceTenantId(match.tenantId)` → one-tenant grid.

**MANAGER segregation:**
- No workspace selector (`showWorkspaceSelector={isSuperAdmin}`). Own tenant only.

**Cell capture (both roles):** `CalendarCell` `+` → `onQuickCreate` →
`openAssignPicker(roomId, day, time, calendarDate, tenantId)` →
`resolvePickerTenantId(roomId, segmentTenantId)` resolves
`segmentTenantId ?? workspaceTenantId ?? frenchDemoTenantForPlayer(roomId) ?? user.tenantId`.
Result stored on `pickerCell.tenantId` and passed to `ScheduleAssignModal` as `workspaceTenantId`.
The modal calls `api.setWorkspaceTenant(tenantId, slug)` then `listMedia()` + `listPlaylists()`
(guarded by `if (!open || !workspaceTenantId)`), so the picker shows real tenant catalog records.

---

## 3. Players (header button strip + RBAC lockdown)

| File | Role logic |
|------|------------|
| `app/players/components/PlayersHeader.tsx` | `canAddPlayer = canProvisionPlayers(user?.role)` → `{canAddPlayer && <button>Add player</button>}`. Button **absent from DOM** for `MANAGER`. Workspace selector only when `showWorkspaceSelector` (Super Admin). |
| `app/players/PlayersClient.tsx` | `isSuperAdmin = user.role === "SUPER_ADMIN"` (inline). Modal guard: `<AddPlayerModal isOpen={addPlayerModalOpen && canProvisionPlayers(user?.role)} />`. Handler guard: `handleAddPlayer` throws `"Operation restricted to Super Admins only"` if `!canProvisionPlayers || isManagerRole`. |
| `app/players/components/AddPlayerModal.tsx` | Provisioning form (only reachable by Super Admin). |

Triple-layer enforcement: DOM strip (header) → modal open guard → handler throw. Server-side 403
backs it (see backend doc).

---

## 4. Audios / Playlists inventory

| File | Behavior |
|------|----------|
| `app/library/components/UploadModal.tsx` | `loadPlaylistsFromApi()` → `listPlaylists()` on mount **and** on `open`. Maps rows → `{id, name}` into the "Choose playlist" selector; `setPlaylists([])` on error. Filename sanitizer (see gap list). |
| `app/library/audio/AudioClient.tsx` | `listMedia()` → `parseMediaTags(item.category)` builds grid + tag chips; `listPlaylists()` feeds playlist controls. |
| `app/library/LibraryClient.tsx` | API-backed landing. |
| `lib/playlist-mapper.ts` | `apiPlaylistToUi()` → UI playlist shape. |

**Role reality:** **No role gate in library/upload.** Both `SUPER_ADMIN` and `MANAGER` can open
`UploadModal` and upload. Isolation is **tenant-scoped only** via the `x-tenant-id` header. The
dynamic playlist dropdown is populated by the active session's tenant — there is no
role-conditional rendering here. (If managers must be read-only in the library, that control is
**not implemented** — tracked in the punch list.)

---

## 5. Analytics (dropdown lock + tenant isolation)

| File | Role logic |
|------|------------|
| `app/analytics/AnalyticsClient.tsx` | `isManager`/`isSuperAdmin` via `rbac`. `activeAnalyticsTenantId`: manager → `sessionTenantId`; super admin → selected `workspaceTenantId`. |
| `app/analytics/components/KpiGrid.tsx` | KPI tiles. |
| `app/analytics/components/ChartsPanel.tsx` | Donut + stacked bars. |
| `app/analytics/components/PlaybackTable.tsx` | Verification table. |
| `lib/analytics-metrics.ts` | Tier counting from `LIGHT/ENGAGED/MODERATE/DEEP`. |

**SUPER_ADMIN:**
- Workspace dropdown populated from `listClients()` →
  `mergeEnterpriseWorkspaceClients(toActiveWorkspaceClients(...))`, default = first French demo
  enterprise. **No "All Clients" option here** (maps `workspaceClients` directly, not
  `workspaceSelectorOptions`).
- Fetch is **gated**: `if (!tenantForFetch || (isSuperAdmin && !workspaceTenantId)) return;` —
  nothing loads until a workspace is picked.
- Switching client UUID → re-fires `getSystemHealth` / `getPlaybackLogs(200)` / `listPlayers`
  scoped to that one tenant; charts/tables repaint; `selectedPlayerId` resets to `"all"`.
- **Single-tenant at a time** — Analytics never unions multiple tenants.

**MANAGER (context lock):**
- `activeAnalyticsTenantId = sessionTenantId` (forced). Workspace effect is `if (!isSuperAdmin) return;`
  → no client selector ever rendered.
- `apiClient.setWorkspaceTenant(sessionTenantId, …)` before fetch; `clearWorkspaceTenant()` on cleanup.
- Defense-in-depth: `scopedLogs`/`scopedPlayers`/`playerOptions`/`filteredLogs` all re-filter to
  `frenchDemoPlayerIdsForTenant(tenantForFetch)`. KPI tiles, donut, bars, table, and the
  "All Players" dropdown are all restricted to the manager's own player-UUID set.

---

## 6. Settings (Role field)

| File | Reality |
|------|---------|
| `app/settings/SettingsClient.tsx` | Tab container. |
| `app/settings/components/MyDetailsTab.tsx` | Profile form. |

**⚠️ The "Role" field is a free-text editable `<input>`** (`MyDetailsTab.tsx` ~lines 392–404):

```tsx
<label>Role</label>
<input value={role} onChange={(e) => { setRole(e.target.value); setDirty(true); }} />
```

It is **not** `disabled`, **not** `readOnly`, and has **no role-conditional** gating. Any user
(including `MANAGER`) can type a new role value in the UI. This is a privilege-escalation surface
and is tracked as a critical item in the punch list.

---

## Role-conditional inventory (quick scan)

| Concern | File(s) | Mechanism | Roles affected |
|---------|---------|-----------|----------------|
| Clients nav link | `components/Sidebar.tsx` | `{isAdmin && …}` (`/admin/i` test) | hidden for MANAGER |
| Add Player button | `players/components/PlayersHeader.tsx` | `{canAddPlayer && …}` | hidden for MANAGER |
| Add Player modal/handler | `players/PlayersClient.tsx` | `isOpen` guard + handler throw | blocked for MANAGER |
| Analytics client dropdown | `analytics/AnalyticsClient.tsx` | `if (!isSuperAdmin) return;` | hidden for MANAGER |
| Analytics tenant lock | `analytics/AnalyticsClient.tsx` | `activeAnalyticsTenantId = sessionTenantId` | MANAGER locked |
| Schedule All-Clients | `schedule/ScheduleClient.tsx` + `ScheduleToolbar.tsx` | `workspaceSelectorOptions` | SUPER_ADMIN only |
| Settings Role field | `settings/components/MyDetailsTab.tsx` | **none (editable)** | ⚠️ unlocked for all |
| Library / Upload | `library/**` | **none (tenant-scoped only)** | both roles can upload |
