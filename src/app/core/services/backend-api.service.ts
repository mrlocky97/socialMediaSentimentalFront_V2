/**
 * ===== BACKEND API SERVICE =====
 * Servicio centralizado para todas las comunicaciones con el backend
 * Incluye manejo de errores, retry logic y fallback a mock data
 */

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, retry, tap, timeout } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';
import { ApiResponse, Campaign, DashboardData, Tweet } from './data-manager.service';

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {
  private readonly http = inject(HttpClient);
  
  // Estado de conectividad
  private readonly connectionStatus = new BehaviorSubject<boolean>(true);
  public readonly isOnline$ = this.connectionStatus.asObservable();
  
  // Headers base para las requests
  private readonly baseHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  // URLs de endpoints
  private readonly endpoints = {
    dashboard: `${environment.apiUrl}/dashboard`,
    campaigns: `${environment.apiUrl}/api/${environment.apiVersion}/campaigns`,
    tweets: `${environment.apiUrl}/tweets`,
    analytics: `${environment.apiUrl}/analytics`,
    scraping: `${environment.apiUrl}/scraping`,
    users: `${environment.apiUrl}/users`,
  };

  constructor() {
    // Verificar conectividad al inicializar
    this.checkBackendHealth();
  }

  // ===== DASHBOARD ENDPOINTS =====

  /**
   * Obtener datos completos del dashboard
   */
  public getDashboardData(): Observable<DashboardData> {
    return this.makeRequest<DashboardData>('GET', this.endpoints.dashboard)
      .pipe(
        tap(() => this.setOnlineStatus(true))
      );
  }

  /**
   * Obtener métricas del dashboard
   */
  public getDashboardMetrics(): Observable<any> {
    return this.makeRequest<any>('GET', `${this.endpoints.dashboard}/metrics`);
  }

  // ===== CAMPAIGNS ENDPOINTS =====

  /**
   * Obtener todas las campañas
   */
  public getCampaigns(): Observable<Campaign[]> {
    return this.makeRequest<Campaign[]>('GET', this.endpoints.campaigns);
  }

  /**
   * Obtener campaña específica
   */
  public getCampaign(campaignId: string): Observable<Campaign> {
    return this.makeRequest<Campaign>('GET', `${this.endpoints.campaigns}/${campaignId}`);
  }

  /**
   * Crear nueva campaña
   */
  public createCampaign(campaign: Partial<Campaign>): Observable<Campaign> {
    return this.makeRequest<Campaign>('POST', this.endpoints.campaigns, campaign);
  }

  /**
   * Actualizar campaña
   */
  public updateCampaign(campaignId: string, updates: Partial<Campaign>): Observable<Campaign> {
    return this.makeRequest<Campaign>('PUT', `${this.endpoints.campaigns}/${campaignId}`, updates);
  }

  /**
   * Eliminar campaña
   */
  public deleteCampaign(campaignId: string): Observable<void> {
    return this.makeRequest<void>('DELETE', `${this.endpoints.campaigns}/${campaignId}`);
  }

  /**
   * Controlar estado de campaña
   */
  public toggleCampaign(campaignId: string, action: 'start' | 'stop' | 'pause' | 'resume'): Observable<Campaign> {
    return this.makeRequest<Campaign>('POST', `${this.endpoints.campaigns}/${campaignId}/${action}`);
  }

  // ===== TWEETS ENDPOINTS =====

  /**
   * Obtener tweets de una campaña
   */
  public getCampaignTweets(campaignId: string, params?: {
    limit?: number;
    offset?: number;
    sentiment?: 'positive' | 'negative' | 'neutral';
    dateFrom?: string;
    dateTo?: string;
  }): Observable<Tweet[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `${this.endpoints.campaigns}/${campaignId}/tweets?${queryParams.toString()}`;
    return this.makeRequest<Tweet[]>('GET', url);
  }

  /**
   * Obtener tweets pendientes de procesamiento
   */
  public getPendingTweets(): Observable<{ count: number; tweets: Tweet[] }> {
    return this.makeRequest<{ count: number; tweets: Tweet[] }>('GET', `${this.endpoints.tweets}/pending`);
  }

  /**
   * Procesar tweets pendientes
   */
  public processPendingTweets(tweetIds?: string[]): Observable<{ processed: number; success: boolean }> {
    return this.makeRequest<{ processed: number; success: boolean }>(
      'POST', 
      `${this.endpoints.tweets}/process`,
      tweetIds ? { tweetIds } : {}
    );
  }

  // ===== ANALYTICS ENDPOINTS =====

  /**
   * Obtener analytics de campaña
   */
  public getCampaignAnalytics(campaignId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Observable<any> {
    return this.makeRequest<any>('GET', `${this.endpoints.analytics}/campaigns/${campaignId}?timeframe=${timeframe}`);
  }

  /**
   * Obtener trends globales
   */
  public getGlobalTrends(): Observable<any> {
    return this.makeRequest<any>('GET', `${this.endpoints.analytics}/trends`);
  }

  // ===== SCRAPING ENDPOINTS =====

  /**
   * Obtener estado del scraping
   */
  public getScrapingStatus(): Observable<any> {
    return this.makeRequest<any>('GET', `${this.endpoints.scraping}/status`);
  }

  /**
   * Controlar scraping
   */
  public controlScraping(campaignId: string, action: 'start' | 'stop' | 'pause' | 'resume'): Observable<any> {
    return this.makeRequest<any>('POST', `${this.endpoints.scraping}/${action}/${campaignId}`);
  }

  // ===== UTILITY METHODS =====

  /**
   * Verificar salud del backend
   */
  public checkBackendHealth(): Observable<boolean> {
    return this.http.get(`${environment.apiUrl}/health`, { 
      headers: this.baseHeaders,
      responseType: 'json'
    })
    .pipe(
      timeout(5000), // 5 segundos timeout
      map(() => true),
      tap(() => this.setOnlineStatus(true)),
      catchError(() => {
        this.setOnlineStatus(false);
        return of(false);
      })
    );
  }

  /**
   * Obtener estado de conectividad
   */
  public isOnline(): boolean {
    return this.connectionStatus.value;
  }

  // ===== PRIVATE METHODS =====

  /**
   * Método genérico para hacer requests HTTP
   */
  private makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: any,
    options?: { headers?: HttpHeaders; timeout?: number }
  ): Observable<T> {
    const requestOptions = {
      headers: options?.headers || this.baseHeaders,
      body: method === 'GET' ? undefined : body
    };

    let httpRequest: Observable<ApiResponse<T>>;

    switch (method) {
      case 'GET':
        httpRequest = this.http.get<ApiResponse<T>>(url, requestOptions);
        break;
      case 'POST':
        httpRequest = this.http.post<ApiResponse<T>>(url, body, requestOptions);
        break;
      case 'PUT':
        httpRequest = this.http.put<ApiResponse<T>>(url, body, requestOptions);
        break;
      case 'DELETE':
        httpRequest = this.http.delete<ApiResponse<T>>(url, requestOptions);
        break;
    }

    return httpRequest.pipe(
      timeout(options?.timeout || 10000), // 10 segundos timeout por defecto
      retry({
        count: 2,
        delay: 1000,
        resetOnSuccess: true
      }),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || `Error en ${method} ${url}`);
        }
        return response.data;
      }),
      catchError(error => {
        this.handleError(error, `${method} ${url}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Manejar errores HTTP
   */
  private handleError(error: HttpErrorResponse | Error, context: string): void {
    console.error(`🔥 Backend API Error [${context}]:`, error);
    
    if (error instanceof HttpErrorResponse) {
      // Error HTTP específico
      if (error.status === 0 || error.status >= 500) {
        // Error de conectividad o servidor
        this.setOnlineStatus(false);
        console.warn('🔴 Backend offline detected');
      } else if (error.status === 401) {
        // Error de autenticación
        console.warn('🔒 Authentication error');
      } else if (error.status >= 400 && error.status < 500) {
        // Error del cliente
        console.warn('⚠️ Client error:', error.error?.message || error.message);
      }
    } else {
      // Error de timeout u otro
      this.setOnlineStatus(false);
      console.warn('⏰ Timeout or network error');
    }
  }

  /**
   * Actualizar estado de conectividad
   */
  private setOnlineStatus(online: boolean): void {
    if (this.connectionStatus.value !== online) {
      this.connectionStatus.next(online);
      console.log(`🌐 Backend status: ${online ? 'ONLINE' : 'OFFLINE'}`);
    }
  }
}
