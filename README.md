# Akoustic Arts — Operator UI (Frontend)

Production-ready **Next.js 16** web application for the Akoustic Arts multi-tenant audio broadcasting platform. Operators use this interface to manage players, media libraries, broadcast schedules, playlists, analytics, client billing, and tenant settings.

**Production branch:** `v2`

---

## Table of contents

- [Core features](#core-features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Authentication architecture](#authentication-architecture)
- [API integration](#api-integration)
- [Production build](#production-build)
- [Deployment](#deployment)
- [Scripts reference](#scripts-reference)

---

## Core features

### Operations

- **Dashboard** — Live player status, operational metrics, schedule snapshots, activity timeline, and venue insights with TanStack Query polling.
- **Players** — List, create, update, and delete players; SUPER_ADMIN multi-tenant workspace switching; mock MAC support for beta devices (`00:00:00:*` prefix).
- **Schedule** — Drag-and-drop calendar for assigning audio and playlists to player rooms; month/hour view modes.
- **Media library** — Audio upload to Cloudflare R2 (via backend), metadata editing, artist tags, playlist assignment.
- **Playlists** — CRUD, cover image upload, track management, detail workspace with preview player.

### Administration

- **Clients** (SUPER_ADMIN) — Enterprise client management, billing overview, invoice issuance via `POST /v1/invoices/`.
- **Analytics** — Duration-based engagement tiers (Total = sum of Bounce <3s, Started 3–10s, Light 10–20s, Moderate 20–30s, Deep >30s) from live `PlaybackLog` API data.
- **Settings** — Profile (first/last name, photo), tenant plan, billing tab.

### Platform capabilities

- **Silent token rotation** — Proactive `POST /auth/refresh` before API calls; single-flight refresh; structural JWT validation; session recovery without hard reload.
- **TanStack Query** — Server-state caching, invalidation, and refetch orchestration across dashboard, library, schedule, and clients.
- **Real-time player status** — Dashboard polling (30s interval); backend Pusher events available for future client subscription.
- **Role-based access** — `SUPER_ADMIN` vs `MANAGER` routing and UI gates via `lib/rbac.ts`.
- **Edge route guard** — `proxy.ts` enforces cookie-based JWT checks on navigation.

---

## Tech stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | [Next.js](https://nextjs.org) (App Router) | 16.2.2 |
| UI library | [React](https://react.dev) | 19.2.4 |
| Styling | [Tailwind CSS](https://tailwindcss.com) | v4 |
| HTTP client | [Axios](https://axios-http.com) | ^1.16.0 |
| Server state | [TanStack React Query](https://tanstack.com/query) | ^5.101.0 |
| Charts | [Recharts](https://recharts.org) | ^3.8.1 |
| Drag and drop | [react-dnd](https://react-dnd.github.io/react-dnd/) | ^16.0.1 |
| Animation | [framer-motion](https://www.framer.com/motion/) | ^12.40.0 |
| Icons | [lucide-react](https://lucide.dev) | ^1.7.0 |
| Language | TypeScript | ^5 |

---

## Project structure

```
frontend/
├── app/                    # Next.js App Router pages and feature UI
│   ├── layout.tsx          # Root layout (AuthProvider, QueryProvider, LayoutShell)
│   ├── proxy.ts            # Edge authentication guard
│   ├── context/            # AuthContext, ThemeContext
│   ├── dashboard/          # Operational dashboard
│   ├── players/            # Player management
│   ├── schedule/           # Broadcast scheduling
│   ├── library/            # Audio + playlists
│   ├── analytics/          # Playback analytics
│   ├── clients/            # SUPER_ADMIN client management
│   ├── settings/           # Profile, plan, billing
│   ├── login/ signup/      # Authentication flows
│   └── admin/              # Legacy admin section
├── lib/
│   ├── api-client.ts       # Axios singleton + all API methods + auth interceptors
│   ├── auth-session.ts     # Token storage, JWT validation, session helpers
│   ├── query-fetchers.ts   # TanStack Query data layer
│   ├── query-keys.ts       # Query key factory
│   ├── analytics-metrics.ts
│   └── rbac.ts             # Role-based access helpers
├── types/api.ts            # TypeScript types aligned with backend Pydantic schemas
├── components/ui/          # Shared UI primitives
├── next.config.ts
├── package.json
└── tailwind.config.cjs
```

---

## Prerequisites

- **Node.js** 20 or later (recommended for Next.js 16)
- **npm** 9+ (or compatible package manager)
- A running **Akoustic Arts backend** instance (see `../backend/README.md`)
- Valid operator credentials provisioned in Supabase (`auth.users` + `public.User`)

---

## Local development

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

Create `.env.local` in the `frontend/` directory:

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/v1
NEXT_PUBLIC_API_TIMEOUT=30000
EOF
```

See [Environment variables](#environment-variables) for the full list of optional storage key overrides.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root path redirects to `/login`.

### 4. Start the backend (separate terminal)

The frontend calls the API directly (no Next.js proxy). Ensure the backend is running on port 8000 with CORS allowing `http://localhost:3000`.

```bash
cd ../backend
source .venv/bin/activate   # if using a virtual environment
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Environment variables

All frontend configuration uses the `NEXT_PUBLIC_` prefix so values are available in the browser bundle. **Never commit `.env.local`** — it is listed in `.gitignore`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | — | Backend API base URL including `/v1` suffix (e.g. `https://your-api.onrender.com/v1`) |
| `NEXT_PUBLIC_API_TIMEOUT` | No | `30000` | Axios request timeout in milliseconds |
| `NEXT_PUBLIC_ACCESS_TOKEN_KEY` | No | `akou_access_token` | localStorage key for the app JWT |
| `NEXT_PUBLIC_REFRESH_TOKEN_KEY` | No | `akou_refresh_token` | localStorage key for the GoTrue refresh token |
| `NEXT_PUBLIC_TENANT_ID_KEY` | No | `akou_tenant_id` | localStorage key for tenant UUID |
| `NEXT_PUBLIC_TENANT_SLUG_KEY` | No | `akou_tenant_slug` | localStorage key for tenant slug |
| `NEXT_PUBLIC_USER_EMAIL_KEY` | No | `akou_user_email` | localStorage key for user email |
| `NEXT_PUBLIC_AUTH_META_KEY` | No | `akou_auth_meta` | localStorage key for session expiry metadata JSON |

### Production example

```env
NEXT_PUBLIC_API_BASE_URL=https://ak-backend-0c5x.onrender.com/v1
NEXT_PUBLIC_API_TIMEOUT=30000
```

---

## Authentication architecture

The frontend uses a **dual-token model**:

1. **App JWT** (`akou_access_token`) — Short-lived token issued by the FastAPI backend after GoTrue password verification. Sent as `Authorization: Bearer <token>` on every API request.
2. **GoTrue refresh token** (`akou_refresh_token`) — Long-lived token used exclusively for `POST /auth/refresh` rotation.

### Key modules

| File | Responsibility |
|------|----------------|
| `lib/auth-session.ts` | Storage keys, JWT expiry parsing, structural token validation (`isStructurallyValidAccessToken`) |
| `lib/api-client.ts` | `ensureAccessToken()`, `refreshAccessTokenSingleFlight()`, request/response interceptors |
| `app/context/AuthContext.tsx` | React session state, `/auth/me` hydration, `akou:unauthorized` event handling |
| `app/proxy.ts` | Edge guard — redirects unauthenticated users using cookie mirror of JWT |

### Silent refresh flow

```
API request (non-auth route)
  → reconcileTokenFromStorage()
  → ensureAccessToken()
      → valid token? attach Authorization header
      → expired/corrupt + refresh token? POST /auth/refresh (single-flight)
      → refresh fails? handleUnauthorized() → redirect /login
```

Corrupted access tokens with a valid refresh token trigger a wire refresh **before** eviction — the session is not cleared until the refresh network call fails.

---

## API integration

All HTTP traffic flows through the **singleton** `getApiClient()` in `lib/api-client.ts`.

### Request headers (authenticated routes)

```
Authorization: Bearer <app_jwt>
x-tenant-id: <tenant_uuid>
```

SUPER_ADMIN users can override the tenant scope in memory via `apiClient.setWorkspaceTenant(tenantId)` without changing stored login credentials.

### Primary API surface

| Domain | Methods |
|--------|---------|
| Auth | `login`, `logout`, `register`, `requestPasswordReset` |
| Players | `listPlayers`, `getPlayer`, `createPlayer`, `updatePlayer`, `deletePlayer` |
| Media | `listMedia`, `uploadMedia`, `updateMedia`, `deleteMedia` |
| Playlists | `listPlaylists`, `getPlaylist`, `createPlaylist`, `updatePlaylist`, `deletePlaylist`, `addPlaylistItem`, `removePlaylistItem` |
| Schedules | `listSchedules`, `createSchedule`, `updateSchedule`, `deleteSchedule` |
| Clients | `listClients`, `createClient`, `updateClient`, `deleteClient`, `getClientsBillingOverview` |
| Analytics | `getSystemHealth`, `getAnalyticsTimeline`, `getPlaybackLogs` |
| Profile | `getUserProfile`, `updateUserProfile` |
| Invoices | `listInvoices`, `createInvoice` |

Type definitions live in `types/api.ts` and mirror backend Pydantic schemas.

Data-fetching pages use `lib/query-fetchers.ts` as the TanStack Query integration layer.

### Analytics engagement tiers

Playback sessions are classified by **listened duration** (`PlaybackLog.duration`), not by opaque labels:

| Tier | Duration | Status code |
|------|----------|-------------|
| **Total** | Sum of all five tiers below | — |
| Bounce | < 3s | `BOUNCE` |
| Started | 3s ≤ d < 10s | `STARTED` (legacy `ENGAGED`) |
| Light | 10s ≤ d < 20s | `LIGHT` |
| Moderate | 20s ≤ d ≤ 30s | `MODERATE` |
| Deep | > 30s | `DEEP` |

Implementation: `lib/analytics-metrics.ts` (frontend) and `app/lib/engagement.py` (backend). Each analytics KPI card shows the duration window and `% of total`.

---

## Production build

Verify the application compiles cleanly before deploying:

```bash
npm run build
```

A successful build exits with code `0` and emits static and server routes under `.next/`.

Run the production server locally to smoke-test:

```bash
npm run start
```

---

## Deployment

### Branch strategy

| Environment | Git branch | Notes |
|-------------|------------|-------|
| **Production** | `v2` | Active production track |
| Mirror (GitHub) | `v2-ref-gitlab` | Reference branch for cross-remote sync |

### Render / Node hosting

| Setting | Value |
|---------|-------|
| **Build command** | `npm ci && npm run build` |
| **Start command** | `npm run start` |
| **Node version** | 20.x recommended |

Set `NEXT_PUBLIC_API_BASE_URL` to your live backend URL (must include `/v1`).

### CORS requirement

The backend must include your frontend origin in `FRONTEND_URL` / `FRONTEND_URLS`. The browser calls the API directly — there is no Next.js API route proxy.

### Health checks after deploy

1. Navigate to `/login` and authenticate with a provisioned account.
2. Confirm dashboard loads player data (network tab shows `GET /v1/players` with `200`).
3. Corrupt `akou_access_token` in DevTools → soft-navigate → confirm `POST /auth/refresh` fires and session recovers.

---

## Scripts reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server on port 3000 |
| `npm run build` | Production build (TypeScript + static generation) |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

---

## License

Proprietary — Akoustic Arts / Scorton Labs. All rights reserved.
