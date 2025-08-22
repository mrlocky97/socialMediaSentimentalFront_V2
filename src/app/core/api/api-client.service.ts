/**
 * Central API Client - OpenAPI Style
 * Unified HTTP client for all backend communication
 */
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface ApiRequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  observe?: 'body';
  responseType?: 'json';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasNext?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiClient {
  private http = inject(HttpClient);
  private baseUrl = inject(API_BASE_URL, { optional: true }) || 'http://localhost:3001/api/v1';

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, options);
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, options);
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, options);
  }

  /**
   * Generic PATCH request
   */
  patch<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, options);
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, options);
  }

  // Specialized methods for common patterns

  /**
   * GET with pagination support
   */
  getPaginated<T>(
    endpoint: string, 
    page: number = 1, 
    pageSize: number = 20,
    additionalParams?: { [key: string]: string }
  ): Observable<ApiResponse<T[]>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (additionalParams) {
      Object.keys(additionalParams).forEach(key => {
        params = params.set(key, additionalParams[key]);
      });
    }

    return this.get<T[]>(endpoint, { params });
  }

  /**
   * GET by ID
   */
  getById<T>(endpoint: string, id: string): Observable<ApiResponse<T>> {
    return this.get<T>(`${endpoint}/${id}`);
  }

  /**
   * POST for creation
   */
  create<T>(endpoint: string, data: Partial<T>): Observable<ApiResponse<T>> {
    return this.post<T>(endpoint, data);
  }

  /**
   * PUT for full update
   */
  update<T>(endpoint: string, id: string, data: Partial<T>): Observable<ApiResponse<T>> {
    return this.put<T>(`${endpoint}/${id}`, data);
  }

  /**
   * PATCH for partial update
   */
  updatePartial<T>(endpoint: string, id: string, data: Partial<T>): Observable<ApiResponse<T>> {
    return this.patch<T>(`${endpoint}/${id}`, data);
  }

  /**
   * DELETE by ID
   */
  deleteById<T>(endpoint: string, id: string): Observable<ApiResponse<void>> {
    return this.delete<void>(`${endpoint}/${id}`);
  }

  /**
   * Build query parameters from object
   */
  buildParams(params: { [key: string]: any }): HttpParams {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => httpParams = httpParams.append(key, v.toString()));
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });
    
    return httpParams;
  }

  /**
   * Upload file with FormData
   */
  uploadFile<T>(endpoint: string, file: File, additionalData?: { [key: string]: any }): Observable<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.post<T>(endpoint, formData);
  }
}
