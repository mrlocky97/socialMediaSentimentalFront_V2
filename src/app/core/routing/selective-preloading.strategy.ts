import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  
  // Rutas que queremos precargar
  private routesToPreload = [
    'dashboard', // Dashboard es lo más probable después del login
  ];

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const shouldPreload = this.shouldPreload(route);
    
    if (shouldPreload) {
      console.log(`Preloading: ${route.path}`);
      
      // Precargar después de 2 segundos para dar prioridad al contenido inicial
      return timer(2000).pipe(
        mergeMap(() => load())
      );
    }
    
    return of(null);
  }

  private shouldPreload(route: Route): boolean {
    // Precargar solo si:
    // 1. La ruta está en nuestra lista
    // 2. La conexión es rápida (si está disponible)
    return this.routesToPreload.includes(route.path || '') && 
           this.isConnectionFast();
  }

  private isConnectionFast(): boolean {
    // Verificar calidad de conexión si está disponible
    const connection = (navigator as any).connection;
    if (connection) {
      // Solo precargar en conexiones 4g o wifi
      return connection.effectiveType === '4g' || 
             connection.effectiveType === 'wifi';
    }
    // Si no podemos detectar, asumir que es rápida
    return true;
  }
}
