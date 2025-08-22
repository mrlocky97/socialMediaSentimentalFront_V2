/**
 * API Configuration - Centralized endpoint configuration
 * Uses InjectionToken for dependency injection
 */
import { InjectionToken } from '@angular/core';
import { environment } from '../../../enviroments/environment';

// API Base URL Token
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

// Provide API Base URL
export function provideApiBaseUrl() {
  return {
    provide: API_BASE_URL,
    useValue: environment.apiUrl
  };
}

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    refresh: '/api/v1/auth/refresh',
    logout: '/api/v1/auth/logout',
    forgotPassword: '/api/v1/auth/forgot-password',
    resetPassword: '/api/v1/auth/reset-password',
    profile: '/api/v1/auth/profile'
  },

  // Campaign endpoints
  campaigns: {
    base: '/api/v1/campaigns',
    list: '/api/v1/campaigns',
    create: '/api/v1/campaigns',
    update: (id: string) => `/api/v1/campaigns/${id}`,
    delete: (id: string) => `/api/v1/campaigns/${id}`,
    byId: (id: string) => `/api/v1/campaigns/${id}`,
    start: (id: string) => `/api/v1/campaigns/${id}/start`,
    stop: (id: string) => `/api/v1/campaigns/${id}/stop`,
    stats: (id: string) => `/api/v1/campaigns/${id}/stats`,
    metrics: (id: string) => `/api/v1/campaigns/${id}/metrics`,
    duplicate: (id: string) => `/api/v1/campaigns/${id}/duplicate`,
    bulkStatus: '/api/v1/campaigns/bulk/status'
  },

  // User endpoints
  users: {
    base: '/api/v1/users',
    profile: '/api/v1/users/profile',
    update: (id: string) => `/api/v1/users/${id}`,
    preferences: '/api/v1/users/preferences'
  },

  // Analytics endpoints
  analytics: {
    dashboard: '/api/v1/analytics/dashboard',
    sentiment: '/api/v1/analytics/sentiment',
    reports: '/api/v1/analytics/reports',
    export: '/api/v1/analytics/export'
  },

  // Settings endpoints
  settings: {
    base: '/api/v1/settings',
    notifications: '/api/v1/settings/notifications',
    integrations: '/api/v1/settings/integrations'
  }
} as const;

// Helper function to build full URLs
export function buildApiUrl(baseUrl: string, endpoint: string): string {
  return `${baseUrl}${endpoint}`;
}

// Type-safe endpoint builder
export class ApiUrlBuilder {
  constructor(private baseUrl: string) {}

  // Auth URLs
  auth = {
    login: () => this.buildUrl(API_ENDPOINTS.auth.login),
    register: () => this.buildUrl(API_ENDPOINTS.auth.register),
    refresh: () => this.buildUrl(API_ENDPOINTS.auth.refresh),
    logout: () => this.buildUrl(API_ENDPOINTS.auth.logout),
    forgotPassword: () => this.buildUrl(API_ENDPOINTS.auth.forgotPassword),
    resetPassword: () => this.buildUrl(API_ENDPOINTS.auth.resetPassword),
    profile: () => this.buildUrl(API_ENDPOINTS.auth.profile)
  };

  // Campaign URLs
  campaigns = {
    list: () => this.buildUrl(API_ENDPOINTS.campaigns.list),
    create: () => this.buildUrl(API_ENDPOINTS.campaigns.create),
    update: (id: string) => this.buildUrl(API_ENDPOINTS.campaigns.update(id)),
    delete: (id: string) => this.buildUrl(API_ENDPOINTS.campaigns.delete(id)),
    byId: (id: string) => this.buildUrl(API_ENDPOINTS.campaigns.byId(id)),
    start: (id: string) => this.buildUrl(API_ENDPOINTS.campaigns.start(id)),
    stop: (id: string) => this.buildUrl(API_ENDPOINTS.campaigns.stop(id)),
    stats: (id: string) => this.buildUrl(API_ENDPOINTS.campaigns.stats(id)),
    metrics: (id: string) => this.buildUrl(API_ENDPOINTS.campaigns.metrics(id)),
    duplicate: (id: string) => this.buildUrl(API_ENDPOINTS.campaigns.duplicate(id)),
    bulkStatus: () => this.buildUrl(API_ENDPOINTS.campaigns.bulkStatus)
  };

  // Analytics URLs
  analytics = {
    dashboard: () => this.buildUrl(API_ENDPOINTS.analytics.dashboard),
    sentiment: () => this.buildUrl(API_ENDPOINTS.analytics.sentiment),
    reports: () => this.buildUrl(API_ENDPOINTS.analytics.reports),
    export: () => this.buildUrl(API_ENDPOINTS.analytics.export)
  };

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }
}

// Factory function to create URL builder
export function createApiUrlBuilder(baseUrl: string): ApiUrlBuilder {
  return new ApiUrlBuilder(baseUrl);
}
