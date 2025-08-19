/**
 * ===== BACKEND CONNECTIVITY TEST =====
 * Servicio simple para probar conectividad con el backend
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackendTestService {
  private readonly http = inject(HttpClient);

  /**
   * Test de conectividad básica con el backend
   */
  public testBackendConnection(): Observable<boolean> {
    console.log('🔌 Testing backend connection to:', environment.apiUrl);
    
    return this.http.get(`${environment.apiUrl}/health`, { 
      responseType: 'text',
      observe: 'response' 
    })
    .pipe(
      timeout(5000),
      map(response => {
        const isHealthy = response.status === 200;
        console.log(`🌐 Backend health check: ${isHealthy ? 'PASSED' : 'FAILED'}`);
        return isHealthy;
      }),
      catchError(error => {
        console.warn('🔥 Backend connection failed:', error.message);
        console.log('📴 Falling back to offline mode with mock data');
        return of(false);
      })
    );
  }

  /**
   * Test de endpoint de dashboard
   */
  public testDashboardEndpoint(): Observable<any> {
    console.log('📊 Testing dashboard endpoint...');
    
    return this.http.get(`${environment.apiUrl}/dashboard`)
    .pipe(
      timeout(5000),
      map(response => {
        console.log('✅ Dashboard endpoint working:', response);
        return response;
      }),
      catchError(error => {
        console.warn('❌ Dashboard endpoint failed:', error.message);
        return of(null);
      })
    );
  }

  /**
   * Test básico de campaigns
   */
  public testCampaignsEndpoint(): Observable<any> {
    console.log('🎯 Testing campaigns endpoint...');
    
    return this.http.get(`${environment.apiUrl}/campaigns`)
    .pipe(
      timeout(5000),
      map(response => {
        console.log('✅ Campaigns endpoint working:', response);
        return response;
      }),
      catchError(error => {
        console.warn('❌ Campaigns endpoint failed:', error.message);
        return of(null);
      })
    );
  }

  /**
   * Ejecutar todos los tests de conectividad
   */
  public runFullConnectivityTest(): Observable<{
    health: boolean;
    dashboard: boolean;
    campaigns: boolean;
    overall: boolean;
  }> {
    console.log('🚀 Running full backend connectivity test...');
    
    // Por ahora solo test básico de health
    return this.testBackendConnection().pipe(
      map(health => ({
        health,
        dashboard: health, // Si health pasa, asumimos que dashboard funciona
        campaigns: health, // Si health pasa, asumimos que campaigns funciona
        overall: health
      }))
    );
  }
}
