/**
 * API Client for Akoustic Arts Backend
 * Handles authentication, request/response interceptors, and all API endpoints
 */

import axios, { AxiosInstance, AxiosError, AxiosProgressEvent, InternalAxiosRequestConfig } from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  PlayersListResponse,
  PlayerResponse,
  PlayerCreate,
  PlayerUpdate,
  MediaListResponse,
  MediaResponse,
  ScheduleListResponse,
  ScheduleResponse,
  ScheduleCreate,
  ScheduleUpdate,
  AuthUser,
  ClientCreateInput,
  ClientResponse,
  SystemHealthMetrics,
  AnalyticsTimelineResponse,
  InvoicesListResponse,
  InvoiceCreateInput,
  InvoiceDetailResponse,
  ClientsBillingOverviewResponse,
  TenantSettingsResponse,
  PlaylistsListResponse,
  PlaylistDetailResponse,
  PlaylistCreateInput,
  PlaylistUpdateInput,
  PlaylistItemAddInput,
  ImageUploadResponse,
  UserProfileResponse,
  UserProfileUpdateInput,
} from '@/types/api';
import {
  AUTH_META_KEY,
  AUTH_TOKEN_KEY,
  AUTH_TENANT_ID_KEY,
  AUTH_TENANT_SLUG_KEY,
  AUTH_USER_EMAIL_KEY,
  buildCookieString,
  getSessionExpiryMs,
  isSessionExpired,
  readBrowserCookie,
  removeCookieString,
} from '@/lib/auth-session';

type AuthMeta = {
  expiresAt: number;
  issuedAt: number;
};

export interface TokenSet {
  token: string;
  tenantId: string;
  tenantSlug: string;
  userEmail: string;
}

/**
 * API Client class encapsulating axios instance and all API operations
 */
export class ApiClient {
  private instance: AxiosInstance;
  private tokenSet: TokenSet | null = null;
  private tokenExpiresAt: number | null = null;
  /** In-memory tenant override for SUPER_ADMIN workspace switching (not persisted). */
  private workspaceTenant: { tenantId: string; tenantSlug?: string } | null = null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || '') {
    this.instance = axios.create({
      baseURL,
      timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: add auth token and tenant header
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        const tenantId = this.getEffectiveTenantId();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (tenantId) {
          config.headers['x-tenant-id'] = tenantId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle errors
    // On 401, clear tokens and emit a global event so the Auth layer can
    // respond (logout, clear UI state, redirect). Avoid hard redirect here
    // so the app can perform a proper logout flow.
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearTokens();
          if (typeof window !== 'undefined') {
            try {
              window.dispatchEvent(new CustomEvent('akou:unauthorized'));
            } catch (e) {
              // fallback to direct navigation
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from storage on initialization
    this.loadTokenFromStorage();
  }

  // ============ Token Management ============

  /**
   * Set auth tokens after login
   */
  setTokens(token: string, tenantId: string, tenantSlug: string, userEmail: string) {
    const now = Date.now();
    const expiresAt = getSessionExpiryMs(token, now);
    this.tokenSet = { token, tenantId, tenantSlug, userEmail };
    this.tokenExpiresAt = expiresAt;

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_TENANT_ID_KEY, tenantId);
      localStorage.setItem(AUTH_TENANT_SLUG_KEY, tenantSlug);
      localStorage.setItem(AUTH_USER_EMAIL_KEY, userEmail);
      localStorage.setItem(AUTH_META_KEY, JSON.stringify({ expiresAt, issuedAt: now } satisfies AuthMeta));

      try {
        const secure = window.location.protocol === 'https:';
        document.cookie = buildCookieString(AUTH_TOKEN_KEY, token, expiresAt, secure);
      } catch {
        // ignore cookie write errors; localStorage remains the fallback
      }
    }
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    if (this.tokenSet?.token && !isSessionExpired(this.tokenExpiresAt)) {
      return this.tokenSet.token;
    }

    if (this.tokenSet?.token && isSessionExpired(this.tokenExpiresAt)) {
      this.clearTokens();
      return null;
    }

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        const metaRaw = localStorage.getItem(AUTH_META_KEY);
        let expiresAt: number | null = null;

        if (metaRaw) {
          try {
            const meta = JSON.parse(metaRaw) as Partial<AuthMeta>;
            expiresAt = typeof meta.expiresAt === 'number' ? meta.expiresAt : null;
          } catch {
            expiresAt = null;
          }
        }

        if (!expiresAt) {
          expiresAt = getSessionExpiryMs(token);
          localStorage.setItem(AUTH_META_KEY, JSON.stringify({ expiresAt, issuedAt: Date.now() } satisfies AuthMeta));
        }

        if (isSessionExpired(expiresAt)) {
          this.clearTokens();
          return null;
        }

        const tenantId = localStorage.getItem(AUTH_TENANT_ID_KEY);
        const tenantSlug = localStorage.getItem(AUTH_TENANT_SLUG_KEY);
        const userEmail = localStorage.getItem(AUTH_USER_EMAIL_KEY);
        if (tenantId && tenantSlug && userEmail) {
          this.tokenSet = { token, tenantId, tenantSlug, userEmail };
          this.tokenExpiresAt = expiresAt;
        }
        return token;
      }

      const cookieToken = readBrowserCookie(AUTH_TOKEN_KEY);
      if (cookieToken) {
        const expiresAt = getSessionExpiryMs(cookieToken);
        if (isSessionExpired(expiresAt)) {
          this.clearTokens();
          return null;
        }

        const tenantId = localStorage.getItem(AUTH_TENANT_ID_KEY) || '';
        const tenantSlug = localStorage.getItem(AUTH_TENANT_SLUG_KEY) || '';
        const userEmail = localStorage.getItem(AUTH_USER_EMAIL_KEY) || '';
        this.tokenSet = { token: cookieToken, tenantId, tenantSlug, userEmail };
        this.tokenExpiresAt = expiresAt;
        return cookieToken;
      }
    }

    return null;
  }

  /**
   * Get current tenant ID
   */
  getTenantId(): string | null {
    return this.tokenSet?.tenantId || (typeof window !== 'undefined' ? localStorage.getItem(AUTH_TENANT_ID_KEY) : null) || null;
  }

  /**
   * Tenant ID used on API requests (workspace override when set).
   */
  getEffectiveTenantId(): string | null {
    return this.workspaceTenant?.tenantId || this.getTenantId();
  }

  /**
   * SUPER_ADMIN: scope subsequent requests to a client workspace without changing login session storage.
   */
  setWorkspaceTenant(tenantId: string, tenantSlug?: string) {
    const id = (tenantId || '').trim();
    if (!id) return;
    this.workspaceTenant = { tenantId: id, tenantSlug: tenantSlug?.trim() || undefined };
  }

  clearWorkspaceTenant() {
    this.workspaceTenant = null;
  }

  /**
   * Get current tenant slug
   */
  getTenantSlug(): string | null {
    return this.tokenSet?.tenantSlug || (typeof window !== 'undefined' ? localStorage.getItem(AUTH_TENANT_SLUG_KEY) : null) || null;
  }

  /**
   * Get current user email
   */
  getUserEmail(): string | null {
    return this.tokenSet?.userEmail || (typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_EMAIL_KEY) : null) || null;
  }

  /**
   * Clear all stored tokens
   */
  clearTokens() {
    this.tokenSet = null;
    this.tokenExpiresAt = null;

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_TENANT_ID_KEY);
      localStorage.removeItem(AUTH_TENANT_SLUG_KEY);
      localStorage.removeItem(AUTH_USER_EMAIL_KEY);
      localStorage.removeItem(AUTH_META_KEY);

      try {
        document.cookie = removeCookieString(AUTH_TOKEN_KEY);
      } catch {
        // ignore cookie removal errors
      }
    }
  }

  /**
   * Load token from storage on app init
   */
  private loadTokenFromStorage() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const tenantId = localStorage.getItem(AUTH_TENANT_ID_KEY);
      const tenantSlug = localStorage.getItem(AUTH_TENANT_SLUG_KEY);
      const userEmail = localStorage.getItem(AUTH_USER_EMAIL_KEY);

      if (token && tenantId && tenantSlug && userEmail) {
        const metaRaw = localStorage.getItem(AUTH_META_KEY);
        let expiresAt = metaRaw ? (() => {
          try {
            const meta = JSON.parse(metaRaw) as Partial<AuthMeta>;
            return typeof meta.expiresAt === 'number' ? meta.expiresAt : null;
          } catch {
            return null;
          }
        })() : null;

        if (!expiresAt) {
          expiresAt = getSessionExpiryMs(token);
          localStorage.setItem(AUTH_META_KEY, JSON.stringify({ expiresAt, issuedAt: Date.now() } satisfies AuthMeta));
        }

        if (!isSessionExpired(expiresAt)) {
          this.tokenSet = { token, tenantId, tenantSlug, userEmail };
          this.tokenExpiresAt = expiresAt;
        } else {
          this.clearTokens();
        }
        return;
      }

      const cookieToken = readBrowserCookie(AUTH_TOKEN_KEY);
      if (cookieToken) {
        const expiresAt = getSessionExpiryMs(cookieToken);
        if (!isSessionExpired(expiresAt)) {
          this.tokenSet = { token: cookieToken, tenantId: tenantId || '', tenantSlug: tenantSlug || '', userEmail: userEmail || '' };
          this.tokenExpiresAt = expiresAt;
        }
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ============ Auth Endpoints ============

  /**
   * POST /auth/login - Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.instance.post<LoginResponse>('/auth/login', credentials);
    const { token, user, tenant } = response.data;

    // Store tokens
    this.setTokens(token, tenant.id, tenant.slug, user.email);

    return response.data;
  }

  /**
   * Logout - just clear tokens
   */
  logout() {
    this.clearTokens();
  }

  // ============ Player Endpoints ============

  /**
   * GET /players - List all players for tenant
   */
  async listPlayers(): Promise<PlayersListResponse> {
    const response = await this.instance.get<PlayersListResponse>('/players');
    return response.data;
  }

  /** Alias for listPlayers (admin/grid refresh flows). */
  async getPlayers(): Promise<PlayersListResponse> {
    return this.listPlayers();
  }

  /**
   * GET /players/{id} - Get player by ID
   */
  async getPlayer(playerId: string): Promise<PlayerResponse> {
    const response = await this.instance.get<PlayerResponse>(`/players/${playerId}`);
    return response.data;
  }

   /**
    * POST /players - Create a new player
    * Supports extended fields: locationName, ipAddress, deviceId
    */
   async createPlayer(data: PlayerCreate | any): Promise<PlayerResponse> {
     // The FastAPI backend `PlayerCreate` expects camelCase keys (name, macAddress).
     // Send the exact shape the server's Pydantic model expects to avoid 422 errors.
     const payload: any = {
       name: (data as any).name ?? (data as any).playerName ?? undefined,
       macAddress: (data as any).macAddress ?? (data as any).mac_address ?? '',
     };

     // Add optional extended fields if provided
     if ((data as any).locationName || (data as any).location_name) {
       payload.locationName = (data as any).locationName || (data as any).location_name;
     }
     if ((data as any).ipAddress || (data as any).ip_address) {
       payload.ipAddress = (data as any).ipAddress || (data as any).ip_address;
     }
     if ((data as any).deviceId || (data as any).device_id) {
       payload.deviceId = (data as any).deviceId || (data as any).device_id;
     }
     // Tenant scoping uses x-tenant-id (setWorkspaceTenant); optional body fields for tracing.
     if ((data as any).tenantId || (data as any).tenant_id) {
       payload.tenantId = (data as any).tenantId || (data as any).tenant_id;
     }
     if ((data as any).clientId || (data as any).client_id) {
       payload.clientId = (data as any).clientId || (data as any).client_id;
     }

     const response = await this.instance.post<PlayerResponse>('/players', payload);
     return response.data;
   }

  /**
   * PUT /players/{id} - Update player
   */
  async updatePlayer(playerId: string, data: PlayerUpdate): Promise<PlayerResponse> {
    const response = await this.instance.put<PlayerResponse>(`/players/${playerId}`, data);
    return response.data;
  }

  /**
   * DELETE /players/{id} - Delete player
   */
  async deletePlayer(playerId: string): Promise<{ ok: boolean; message: string }> {
    const response = await this.instance.delete(`/players/${playerId}`);
    return response.data;
  }

  /**
   * POST /players/heartbeat - Player heartbeat (usually called by device)
   */
  async playerHeartbeat(data: {
    mac_address: string;
    status: string;
    observed_at?: string;
  }) {
    const response = await this.instance.post('/players/heartbeat', data);
    return response.data;
  }

  // ============ Media Endpoints ============

  /**
   * GET /media - List all media for tenant
   */
  async listMedia(): Promise<MediaListResponse> {
    const response = await this.instance.get<MediaListResponse>('/media');
    return response.data;
  }

  /** Alias used by schedule assign modal and library flows. */
  async listAudios(): Promise<MediaListResponse> {
    return this.listMedia();
  }

  /**
   * GET /media/{id} - Get media by ID
   */
  async getMedia(mediaId: string): Promise<MediaResponse> {
    const response = await this.instance.get<MediaResponse>(`/media/${mediaId}`);
    return response.data;
  }

  /**
   * POST /media/upload - Upload media file
   * Multipart form data for audio file
   */
  async uploadMedia(
    file: File,
    title: string,
    duration: number,
    category: string = 'Audio',
    onUploadProgress?: (progressPercent: number, event: AxiosProgressEvent) => void,
  ): Promise<MediaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('duration', duration.toString());
    formData.append('category', category);

    // Use multipart content type
    const response = await this.instance.post<MediaResponse>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress
        ? (event) => {
            if (!event.total) return;
            onUploadProgress(Math.round((event.loaded / event.total) * 100), event);
          }
        : undefined,
    });

    return response.data;
  }

  /**
   * DELETE /media/{id} - Delete media
   */
  async deleteMedia(mediaId: string): Promise<{ ok: boolean; message: string }> {
    const response = await this.instance.delete(`/media/${mediaId}`);
    return response.data;
  }

  // ============ Assets (images) ============

  /**
   * POST /assets/upload-image - Upload image to R2 (profile photos, branding)
   */
  async uploadImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.instance.post<ImageUploadResponse>(
      '/assets/upload-image',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  }

  // ============ User Profile ============

  async getUserProfile(): Promise<UserProfileResponse> {
    const response = await this.instance.get<UserProfileResponse>('/users/profile');
    return response.data;
  }

  async updateUserProfile(data: UserProfileUpdateInput): Promise<UserProfileResponse> {
    const response = await this.instance.put<UserProfileResponse>('/users/profile', {
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      country: data.country,
      timezone: data.timezone,
      bio: data.bio,
      profilePhotoUrl: data.profilePhotoUrl,
    });
    return response.data;
  }

  // ============ Schedule Endpoints ============

  /**
   * GET /schedules - List all schedules for tenant
   */
  async listSchedules(): Promise<ScheduleListResponse> {
    const response = await this.instance.get<ScheduleListResponse>('/schedules');
    return response.data;
  }

  /**
   * GET /schedules/{id} - Get schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<ScheduleResponse> {
    const response = await this.instance.get<ScheduleResponse>(`/schedules/${scheduleId}`);
    return response.data;
  }

  /**
   * POST /schedules - Create schedule
   */
  async createSchedule(data: ScheduleCreate): Promise<ScheduleResponse> {
    // Ensure timestamps are ISO strings
    const payload = {
      ...data,
      startTime: typeof data.startTime === 'string' ? data.startTime : (data.startTime as any).toISOString?.() || String(data.startTime),
      endTime: typeof data.endTime === 'string' ? data.endTime : (data.endTime as any).toISOString?.() || String(data.endTime),
    };

    const response = await this.instance.post<ScheduleResponse>('/schedules', payload);
    return response.data;
  }

  /**
   * PUT /schedules/{id} - Update schedule
   */
  async updateSchedule(scheduleId: string, data: ScheduleUpdate): Promise<ScheduleResponse> {
    const payload = {
      ...data,
      startTime: data.startTime
        ? (typeof data.startTime === 'string' ? data.startTime : (data.startTime as any).toISOString?.() || String(data.startTime))
        : undefined,
      endTime: data.endTime
        ? (typeof data.endTime === 'string' ? data.endTime : (data.endTime as any).toISOString?.() || String(data.endTime))
        : undefined,
    };

    const response = await this.instance.put<ScheduleResponse>(`/schedules/${scheduleId}`, payload);
    return response.data;
  }

  /**
   * DELETE /schedules/{id} - Delete schedule
   */
  async deleteSchedule(scheduleId: string): Promise<{ ok: boolean; message: string }> {
    const response = await this.instance.delete(`/schedules/${scheduleId}`);
    return response.data;
  }

  // ============ Clients Endpoints ============

  /**
   * GET /clients - List all clients (SUPER_ADMIN only, but fetches own client for others)
   */
  async listClients(): Promise<any> {
    const response = await this.instance.get('/clients/');
    return response.data;
  }

  /**
   * GET /clients/{id} - Get client details
   */
  async getClient(clientId: string): Promise<any> {
    const response = await this.instance.get(`/clients/${clientId}`);
    return response.data;
  }

  /**
   * POST /clients - Create client (SUPER_ADMIN only)
   */
  async createClient(data: ClientCreateInput): Promise<ClientResponse> {
    const normalizedTier = data.subscriptionTier;
    const tierDefaults = normalizedTier === 'STARTER'
      ? { maxPlayers: 5, maxStorageGb: 2 }
      : normalizedTier === 'PROFESSIONAL'
        ? { maxPlayers: 20, maxStorageGb: 20 }
        : {
            maxPlayers: Math.max(1, Number(data.maxPlayers || 1)),
            maxStorageGb: Math.max(1, Number(data.maxStorageGb || 1)),
          };

    const response = await this.instance.post<ClientResponse>('/clients/', {
      name: data.name,
      business_type: data.businessType,
      contact_person: data.contactPerson,
      email: data.email,
      phone: data.phone,
      subscription_tier: normalizedTier,
      max_players: tierDefaults.maxPlayers,
      max_storage_gb: tierDefaults.maxStorageGb,
    });
    return response.data;
  }

  /**
   * PUT /clients/{id} - Update client
   */
  async updateClient(clientId: string, data: any): Promise<any> {
    const response = await this.instance.put(`/clients/${clientId}`, data);
    return response.data;
  }

   // ============ Analytics Endpoints ============

   /**
    * GET /analytics/system-health - Get system health metrics
    */
   async getSystemHealth(): Promise<SystemHealthMetrics> {
     const response = await this.instance.get<SystemHealthMetrics>('/analytics/system-health');
     return response.data;
   }

   /**
    * GET /analytics/timeline - Get 24h playback timeline
    */
   async getAnalyticsTimeline(): Promise<AnalyticsTimelineResponse> {
     const response = await this.instance.get<AnalyticsTimelineResponse>('/analytics/timeline');
     return response.data;
   }

   /**
    * GET /dashboard/stats - Get dashboard statistics
    */
   async getDashboardStats(): Promise<any> {
      const response = await this.instance.get('/dashboard/stats');
     return response.data;
   }

   /**
    * GET /dashboard/activity - Get activity logs with pagination
    */
   async getDashboardActivity(page: number = 1, limit: number = 20): Promise<any> {
      const response = await this.instance.get(`/dashboard/activity?page=${page}&limit=${limit}`);
     return response.data;
   }

   // ============ Activity Log Endpoints ============

   /**
    * GET /activity-logs - List recent activity (legacy endpoint)
    */
   async listActivityLogs(limit: number = 10): Promise<any> {
      const response = await this.instance.get(`/activity-logs?limit=${limit}`);
     return response.data;
   }


  // ============ Invoice Endpoints ============

  /**
   * GET /invoices/ - List invoices for the active tenant
   */
  async listInvoices(): Promise<InvoicesListResponse> {
    const response = await this.instance.get<InvoicesListResponse>('/invoices/');
    return response.data;
  }

  /**
   * POST /invoices/ - Register manual invoice (SUPER_ADMIN)
   */
  async createInvoice(data: InvoiceCreateInput): Promise<InvoiceDetailResponse> {
    const response = await this.instance.post<InvoiceDetailResponse>('/invoices/', {
      tenant_id: data.tenantId,
      invoice_number: data.invoiceNumber,
      amount: data.amount,
      status: data.status ?? 'UNPAID',
      due_date: data.dueDate ?? null,
      download_url: data.downloadUrl ?? null,
    });
    return response.data;
  }

  // ============ Clients Billing (Super Admin) ============

  async getClientsBillingOverview(): Promise<ClientsBillingOverviewResponse> {
    const response = await this.instance.get<ClientsBillingOverviewResponse>(
      '/clients/billing-overview'
    );
    return response.data;
  }

  // ============ Tenant Settings ============

  async getTenantSettings(): Promise<TenantSettingsResponse> {
    const response = await this.instance.get<TenantSettingsResponse>('/settings/tenant');
    return response.data;
  }

  // ============ Playlists ============

  async listPlaylists(): Promise<PlaylistsListResponse> {
    const response = await this.instance.get<PlaylistsListResponse>('/playlists');
    return response.data;
  }

  async getPlaylist(playlistId: string): Promise<PlaylistDetailResponse> {
    const response = await this.instance.get<PlaylistDetailResponse>(
      `/playlists/${playlistId}`
    );
    return response.data;
  }

  async createPlaylist(data: PlaylistCreateInput): Promise<PlaylistDetailResponse> {
    const response = await this.instance.post<PlaylistDetailResponse>('/playlists', {
      title: data.title,
      description: data.description,
      cover_color: data.coverColor,
    });
    return response.data;
  }

  async updatePlaylist(
    playlistId: string,
    data: PlaylistUpdateInput
  ): Promise<PlaylistDetailResponse> {
    const response = await this.instance.put<PlaylistDetailResponse>(
      `/playlists/${playlistId}`,
      {
        title: data.title,
        description: data.description,
        cover_color: data.coverColor,
      }
    );
    return response.data;
  }

  async deletePlaylist(playlistId: string): Promise<{ ok: boolean; message?: string }> {
    const response = await this.instance.delete(`/playlists/${playlistId}`);
    return response.data;
  }

  async addPlaylistItem(
    playlistId: string,
    data: PlaylistItemAddInput
  ): Promise<PlaylistDetailResponse> {
    const response = await this.instance.post<PlaylistDetailResponse>(
      `/playlists/${playlistId}/items`,
      { mediaId: data.mediaId, position: data.position }
    );
    return response.data;
  }

  async removePlaylistItem(
    playlistId: string,
    itemId: string
  ): Promise<PlaylistDetailResponse> {
    const response = await this.instance.delete<PlaylistDetailResponse>(
      `/playlists/${playlistId}/items/${itemId}`
    );
    return response.data;
  }

  // ============ Utility Methods ============

  /**
   * Get axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

// Singleton instance
let apiClientInstance: ApiClient | null = null;

/**
 * Get or create API client singleton
 */
export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL);
  }
  return apiClientInstance;
}

/**
 * Reset API client (useful for testing)
 */
export function resetApiClient() {
  apiClientInstance = null;
}

export default getApiClient;

