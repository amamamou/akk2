/**
 * API Response Types
 * Aligned with backend Pydantic schemas from /ak/fastapi-backend/app/schemas/
 */

// ============ Player Types ============
export interface PlayerInfo {
  id: string;
  roomId: string;
  roomName: string;
  playerName: string;
  status: 'online' | 'offline' | 'idle';
  playlist: Track[];
  playlistIndex: number;
  nowPlaying: Track | null;
  nextEvent: unknown | null;
  isPlaying: boolean;
  playingProgress: number;
  macAddress: string;
  lastSeen?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface Track {
  id: string;
  title: string;
  duration: number;
}

export interface PlayersListResponse {
  ok: boolean;
  tenantId: string;
  players: PlayerInfo[];
}

export interface PlayerResponse {
  ok: boolean;
  player: PlayerInfo;
}

export interface PlayerCreate {
  name: string;
  macAddress: string;
}

  /**
   * Extended PlayerCreate with new SaaS fields
   */
  export interface PlayerCreateExtended extends PlayerCreate {
    locationName?: string;
    ipAddress?: string;
    deviceId?: string;
  }

export interface PlayerUpdate {
  name?: string;
  status?: 'online' | 'offline' | 'idle';
  metadata?: Record<string, unknown>;
}

// ============ Media Types ============
export interface MediaInfo {
  id: string;
  title: string;
  duration: string;
  durationMinutes: number;
  category: string;
  fileSize?: number;
  url: string;
}

export interface MediaListResponse {
  ok: boolean;
  tenantId: string;
  media: MediaInfo[];
}

export interface MediaResponse {
  ok: boolean;
  media: MediaInfo;
}

export interface MediaCreate {
  title: string;
  category?: string;
  duration: number;
  fileSize?: number;
  s3_url?: string;
  url?: string;
}

// ============ Schedule Types ============
export interface ScheduleEntry {
  id: string;
  playerId: string;
  playerName: string;
  mediaId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  recurrence: string;
}

export interface ScheduleListResponse {
  ok: boolean;
  tenantId: string;
  schedules: ScheduleEntry[];
}

export interface ScheduleResponse {
  ok: boolean;
  schedule: ScheduleEntry;
}

export interface ScheduleCreate {
  playerId: string;
  mediaId: string;
  startTime: string;
  endTime: string;
  recurrence?: string;
}

export interface ScheduleUpdate {
  playerId?: string;
  mediaId?: string;
  startTime?: string;
  endTime?: string;
  recurrence?: string;
}

// ============ Auth Types ============
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  ok: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
  tenant: {
    id: string;
    slug: string;
    name?: string;
  };
}

export interface AuthToken {
  sub: string;
  email: string;
  tenant_id: string;
  tenant_slug: string;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  tenantSlug: string;
  role?: string;
}

// ============ API Error Types ============
export interface ApiError {
  error: string;
  code: string;
  detail?: string;
}

export interface ApiErrorResponse {
  status: number;
  data: ApiError;
}

// ============ Client Types ============
export interface ClientInfo {
  id: string;
  name: string;
  businessType?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL';
  subscriptionTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  maxPlayers: number;
  maxStorageGb: number;
  createdAt?: string;
}

export interface ClientCreateInput {
  name: string;
  businessType?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  subscriptionTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  maxPlayers?: number;
  maxStorageGb?: number;
}

export interface ClientsListResponse {
  ok: boolean;
  clients: ClientInfo[];
  total?: number;
}

export interface ClientResponse {
  ok: boolean;
  client: ClientInfo;
}

// ============ Activity Log Types ============
export interface ActivityLogEntry {
  id: string;
  userId?: string;
  clientId?: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLogsListResponse {
  ok: boolean;
  activityLogs: ActivityLogEntry[];
  total?: number;
}

// ============ System Health Types ============
export interface SystemHealthMetrics {
  ok: boolean;
  heartbeatSuccessRate: number;
  totalPlayers: number;
  onlinePlayers: number;
  offlinePlayers: number;
  activeSchedules: number;
  failedSchedules: number;
  totalPlaybackLogs: number;
  successfulPlaybacks: number;
  failedPlaybacks: number;
}

export interface AnalyticsTimelineEntry {
  hour: string;
  total: number;
  successful: number;
  failed: number;
}

export interface AnalyticsTimelineResponse {
  ok: boolean;
  tenantId: string;
  timeline: AnalyticsTimelineEntry[];
}

export interface InvoiceInfo {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  amount: number;
  status: 'PAID' | 'UNPAID';
  dueDate?: string | null;
  downloadUrl?: string | null;
  createdAt?: string | null;
}

export interface InvoicesListResponse {
  ok: boolean;
  tenantId: string;
  invoices: InvoiceInfo[];
}

