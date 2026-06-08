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
  /** Parsed from category TAG: segments when present */
  tags?: string[];
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
  mediaId?: string | null;
  playlistId?: string | null;
  title: string;
  trackCount?: number | null;
  startsAt: string;
  endsAt: string;
  recurrence: string;
  loopPlayback?: boolean;
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
  mediaId?: string;
  playlistId?: string;
  startTime: string;
  endTime: string;
  recurrence?: string;
  loopPlayback?: boolean;
}

export interface ScheduleUpdate {
  playerId?: string;
  mediaId?: string;
  playlistId?: string;
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
  tenantId?: string;
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

export interface PlaybackLogEntry {
  id: string;
  playerId: string;
  playerName?: string | null;
  mediaId?: string | null;
  mediaTitle?: string | null;
  status: string;
  durationSeconds?: number | null;
  startedAt?: string | null;
  createdAt?: string | null;
}

export interface PlaybackLogsResponse {
  ok: boolean;
  tenantId: string;
  logs: PlaybackLogEntry[];
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

export interface InvoiceCreateInput {
  tenantId: string;
  invoiceNumber: string;
  amount: number;
  status?: 'PAID' | 'UNPAID';
  dueDate?: string | null;
  downloadUrl?: string | null;
}

export interface InvoiceDetailResponse {
  ok: boolean;
  invoice: InvoiceInfo;
}

export interface ClientBillingSummary {
  clientId: string;
  tenantId?: string | null;
  subscriptionTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | string;
  planName?: string | null;
  maxPlayers: number;
  maxStorageGb: number;
  totalInvoiced: number;
  outstandingBalance: number;
  paidTotal: number;
  invoiceCount: number;
  recentInvoices: InvoiceInfo[];
}

export interface ClientsBillingOverviewResponse {
  ok: boolean;
  summaries: ClientBillingSummary[];
}

export interface TenantSettingsData {
  brandingName?: string | null;
  brandingColor?: string | null;
  logoUrl?: string | null;
  planName?: string | null;
  subscriptionTier?: string | null;
  maxPlayers: number;
  maxStorageGb: number;
  usedPlayers: number;
  usedStorageGb: number;
}

export interface TenantSettingsResponse {
  ok: boolean;
  tenantId: string;
  settings: TenantSettingsData;
}

export interface PlaylistTrackInfo {
  id: string;
  mediaId: string;
  title: string;
  duration: number;
  position: number;
}

export interface PlaylistApiInfo {
  id: string;
  title: string;
  description?: string | null;
  trackCount: number;
  totalDurationSeconds: number;
  totalDuration: string;
  coverColor?: string | null;
  lastModified?: string | null;
  tracks?: PlaylistTrackInfo[];
}

export interface PlaylistsListResponse {
  ok: boolean;
  tenantId: string;
  playlists: PlaylistApiInfo[];
}

export interface PlaylistDetailResponse {
  ok: boolean;
  playlist: PlaylistApiInfo;
}

export interface PlaylistCreateInput {
  title: string;
  description?: string;
  coverColor?: string;
}

export interface PlaylistUpdateInput {
  title?: string;
  description?: string;
  coverColor?: string;
}

export interface PlaylistItemAddInput {
  mediaId: string;
  position?: number;
}

export interface ImageUploadResponse {
  ok: boolean;
  url: string;
  objectKey?: string;
}

export interface UserProfileApi {
  id: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  country?: string | null;
  timezone?: string | null;
  bio?: string | null;
  profilePhotoUrl?: string | null;
}

export interface UserProfileResponse {
  ok: boolean;
  user: UserProfileApi;
}

export interface UserProfileUpdateInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  timezone?: string;
  bio?: string;
  profilePhotoUrl?: string | null;
}
