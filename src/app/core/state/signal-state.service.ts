/**
 * Modern State Management with Angular Signals
 * Alternative to NgRx for Angular 19+ applications
 * Uses signals, computed values, and reactive patterns
 */
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, BehaviorSubject } from 'rxjs';

// ===============================
// BASE STATE INTERFACES
// ===============================

export interface BaseState {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface AuthState extends BaseState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  startDate: Date;
  endDate: Date;
  budget: number;
  clicks: number;
  impressions: number;
}

export interface CampaignState extends BaseState {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  filters: {
    status?: string;
    search?: string;
    dateRange?: { start: Date; end: Date };
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface UIState extends BaseState {
  sidenavOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  modals: {
    [key: string]: boolean;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  read: boolean;
}

// ===============================
// AUTH STATE SERVICE
// ===============================

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  // Private signals for state management
  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastUpdated = signal<Date | null>(null);

  // Public readonly computed signals
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();

  // Computed derived state
  readonly isAuthenticated = computed(() => 
    this._user() !== null && this._token() !== null
  );

  readonly userDisplayName = computed(() => 
    this._user()?.name || this._user()?.email || 'Anonymous'
  );

  readonly isAdmin = computed(() => 
    this._user()?.role === 'admin'
  );

  // State as a single computed object
  readonly state = computed((): AuthState => ({
    user: this._user(),
    token: this._token(),
    isAuthenticated: this.isAuthenticated(),
    loading: this._loading(),
    error: this._error(),
    lastUpdated: this._lastUpdated()
  }));

  constructor() {
    // Auto-save to localStorage when user or token changes
    effect(() => {
      const user = this._user();
      const token = this._token();
      
      if (user && token) {
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    });

    // Load initial state from localStorage
    this.loadFromStorage();
  }

  // Actions (methods that update state)
  login(user: User, token: string): void {
    this._loading.set(true);
    this._error.set(null);
    
    // Simulate async operation
    setTimeout(() => {
      this._user.set(user);
      this._token.set(token);
      this._loading.set(false);
      this._lastUpdated.set(new Date());
    }, 500);
  }

  logout(): void {
    this._user.set(null);
    this._token.set(null);
    this._error.set(null);
    this._lastUpdated.set(new Date());
  }

  updateUser(updates: Partial<User>): void {
    const currentUser = this._user();
    if (currentUser) {
      this._user.set({ ...currentUser, ...updates });
      this._lastUpdated.set(new Date());
    }
  }

  setError(error: string): void {
    this._error.set(error);
    this._loading.set(false);
  }

  clearError(): void {
    this._error.set(null);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  private loadFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedToken = localStorage.getItem('auth_token');
      
      if (storedUser && storedToken) {
        this._user.set(JSON.parse(storedUser));
        this._token.set(storedToken);
        this._lastUpdated.set(new Date());
      }
    } catch (error) {
      console.error('Error loading auth state from storage:', error);
      this.clearError();
    }
  }
}

// ===============================
// CAMPAIGN STATE SERVICE
// ===============================

@Injectable({
  providedIn: 'root'
})
export class CampaignStateService {
  // Private signals
  private readonly _campaigns = signal<Campaign[]>([]);
  private readonly _selectedCampaign = signal<Campaign | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filters = signal({
    status: undefined as string | undefined,
    search: undefined as string | undefined,
    dateRange: undefined as { start: Date; end: Date } | undefined
  });
  private readonly _pagination = signal({
    page: 1,
    pageSize: 10,
    total: 0
  });

  // Public readonly signals
  readonly campaigns = this._campaigns.asReadonly();
  readonly selectedCampaign = this._selectedCampaign.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // Computed derived state
  readonly filteredCampaigns = computed(() => {
    const campaigns = this._campaigns();
    const filters = this._filters();
    
    return campaigns.filter(campaign => {
      // Status filter
      if (filters.status && campaign.status !== filters.status) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return campaign.name.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  });

  readonly activeCampaigns = computed(() => 
    this._campaigns().filter(c => c.status === 'active')
  );

  readonly totalBudget = computed(() => 
    this._campaigns().reduce((sum, c) => sum + c.budget, 0)
  );

  readonly campaignStats = computed(() => ({
    total: this._campaigns().length,
    active: this.activeCampaigns().length,
    budget: this.totalBudget(),
    filtered: this.filteredCampaigns().length
  }));

  // Complete state
  readonly state = computed((): CampaignState => ({
    campaigns: this._campaigns(),
    selectedCampaign: this._selectedCampaign(),
    loading: this._loading(),
    error: this._error(),
    lastUpdated: new Date(),
    filters: this._filters(),
    pagination: this._pagination()
  }));

  // Actions
  setCampaigns(campaigns: Campaign[]): void {
    this._campaigns.set(campaigns);
    this._pagination.update(p => ({ ...p, total: campaigns.length }));
  }

  addCampaign(campaign: Campaign): void {
    this._campaigns.update(campaigns => [...campaigns, campaign]);
  }

  updateCampaign(id: string, updates: Partial<Campaign>): void {
    this._campaigns.update(campaigns =>
      campaigns.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }

  deleteCampaign(id: string): void {
    this._campaigns.update(campaigns => 
      campaigns.filter(c => c.id !== id)
    );
    
    // Clear selection if deleted campaign was selected
    if (this._selectedCampaign()?.id === id) {
      this._selectedCampaign.set(null);
    }
  }

  selectCampaign(campaign: Campaign | null): void {
    this._selectedCampaign.set(campaign);
  }

  setFilters(filters: Partial<{
    status?: string;
    search?: string;
    dateRange?: { start: Date; end: Date };
  }>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }

  clearFilters(): void {
    this._filters.set({
      status: undefined,
      search: undefined,
      dateRange: undefined
    });
  }

  setPagination(pagination: Partial<{
    page: number;
    pageSize: number;
    total: number;
  }>): void {
    this._pagination.update(current => ({ ...current, ...pagination }));
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string): void {
    this._error.set(error);
    this._loading.set(false);
  }

  clearError(): void {
    this._error.set(null);
  }
}

// ===============================
// UI STATE SERVICE
// ===============================

@Injectable({
  providedIn: 'root'
})
export class UIStateService {
  // Private signals
  private readonly _sidenavOpen = signal<boolean>(true);
  private readonly _theme = signal<'light' | 'dark'>('light');
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _modals = signal<Record<string, boolean>>({});
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly sidenavOpen = this._sidenavOpen.asReadonly();
  readonly theme = this._theme.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly modals = this._modals.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed derived state
  readonly unreadNotifications = computed(() => 
    this._notifications().filter(n => !n.read).length
  );

  readonly isDarkTheme = computed(() => 
    this._theme() === 'dark'
  );

  readonly state = computed((): UIState => ({
    sidenavOpen: this._sidenavOpen(),
    theme: this._theme(),
    notifications: this._notifications(),
    modals: this._modals(),
    loading: this._loading(),
    error: this._error(),
    lastUpdated: new Date()
  }));

  constructor() {
    // Auto-save theme preference
    effect(() => {
      const theme = this._theme();
      localStorage.setItem('ui_theme', theme);
      document.body.classList.toggle('dark-theme', theme === 'dark');
    });

    // Load initial theme
    const savedTheme = localStorage.getItem('ui_theme') as 'light' | 'dark';
    if (savedTheme) {
      this._theme.set(savedTheme);
    }
  }

  // Actions
  toggleSidenav(): void {
    this._sidenavOpen.update(open => !open);
  }

  setSidenavOpen(open: boolean): void {
    this._sidenavOpen.set(open);
  }

  toggleTheme(): void {
    this._theme.update(theme => theme === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: 'light' | 'dark'): void {
    this._theme.set(theme);
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false
    };
    
    this._notifications.update(notifications => 
      [newNotification, ...notifications].slice(0, 50) // Keep only 50 latest
    );
  }

  markNotificationAsRead(id: string): void {
    this._notifications.update(notifications =>
      notifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  removeNotification(id: string): void {
    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }

  clearAllNotifications(): void {
    this._notifications.set([]);
  }

  openModal(modalId: string): void {
    this._modals.update(modals => ({ ...modals, [modalId]: true }));
  }

  closeModal(modalId: string): void {
    this._modals.update(modals => ({ ...modals, [modalId]: false }));
  }

  isModalOpen(modalId: string): boolean {
    return this._modals()[modalId] || false;
  }
}

// ===============================
// GLOBAL STATE SERVICE (FACADE)
// ===============================

@Injectable({
  providedIn: 'root'
})
export class StateService {
  constructor(
    public readonly auth: AuthStateService,
    public readonly campaigns: CampaignStateService,
    public readonly ui: UIStateService
  ) {}

  // Global computed state
  readonly globalState = computed(() => ({
    auth: this.auth.state(),
    campaigns: this.campaigns.state(),
    ui: this.ui.state(),
    timestamp: new Date()
  }));

  // Global actions
  reset(): void {
    this.auth.logout();
    this.campaigns.setCampaigns([]);
    this.campaigns.clearFilters();
    this.ui.clearAllNotifications();
  }

  // Development helpers
  logState(): void {
    console.group('🔍 Global State Debug');
    console.log('Auth:', this.auth.state());
    console.log('Campaigns:', this.campaigns.state());
    console.log('UI:', this.ui.state());
    console.groupEnd();
  }
}
