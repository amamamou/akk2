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
} from '@/types/api';

// Token storage keys
const TOKEN_KEY = process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY || 'akou_access_token';
const TENANT_ID_KEY = process.env.NEXT_PUBLIC_TENANT_ID_KEY || 'akou_tenant_id';
const TENANT_SLUG_KEY = process.env.NEXT_PUBLIC_TENANT_SLUG_KEY || 'akou_tenant_slug';
const USER_EMAIL_KEY = process.env.NEXT_PUBLIC_USER_EMAIL_KEY || 'akou_user_email';

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
        const tenantId = this.getTenantId();

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
    this.tokenSet = { token, tenantId, tenantSlug, userEmail };

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TENANT_ID_KEY, tenantId);
      localStorage.setItem(TENANT_SLUG_KEY, tenantSlug);
      localStorage.setItem(USER_EMAIL_KEY, userEmail);
    }
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    if (this.tokenSet?.token) {
      return this.tokenSet.token;
    }

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        const tenantId = localStorage.getItem(TENANT_ID_KEY);
        const tenantSlug = localStorage.getItem(TENANT_SLUG_KEY);
        const userEmail = localStorage.getItem(USER_EMAIL_KEY);
        if (tenantId && tenantSlug && userEmail) {
          this.tokenSet = { token, tenantId, tenantSlug, userEmail };
        }
        return token;
      }
    }

    return null;
  }

  /**
   * Get current tenant ID
   */
  getTenantId(): string | null {
    return this.tokenSet?.tenantId || (typeof window !== 'undefined' ? localStorage.getItem(TENANT_ID_KEY) : null) || null;
  }

  /**
   * Get current tenant slug
   */
  getTenantSlug(): string | null {
    return this.tokenSet?.tenantSlug || (typeof window !== 'undefined' ? localStorage.getItem(TENANT_SLUG_KEY) : null) || null;
  }

  /**
   * Get current user email
   */
  getUserEmail(): string | null {
    return this.tokenSet?.userEmail || (typeof window !== 'undefined' ? localStorage.getItem(USER_EMAIL_KEY) : null) || null;
  }

  /**
   * Clear all stored tokens
   */
  clearTokens() {
    this.tokenSet = null;

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TENANT_ID_KEY);
      localStorage.removeItem(TENANT_SLUG_KEY);
      localStorage.removeItem(USER_EMAIL_KEY);
    }
  }

  /**
   * Load token from storage on app init
   */
  private loadTokenFromStorage() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      const tenantId = localStorage.getItem(TENANT_ID_KEY);
      const tenantSlug = localStorage.getItem(TENANT_SLUG_KEY);
      const userEmail = localStorage.getItem(USER_EMAIL_KEY);

      if (token && tenantId && tenantSlug && userEmail) {
        this.tokenSet = { token, tenantId, tenantSlug, userEmail };
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
    const response = await this.instance.get('/clients');
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
  async createClient(data: any): Promise<any> {
    const response = await this.instance.post('/clients', data);
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
   async getSystemHealth(): Promise<any> {
     const response = await this.instance.get('/analytics/system-health');
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

