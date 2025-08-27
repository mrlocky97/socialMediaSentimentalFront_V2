import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withPreloading } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { AuthEffects } from './core/store/effects/auth.effects';
import { authReducer } from './core/store/reducers/auth.reducer';
import { effects, reducers } from './core/store';

import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco } from '@ngneat/transloco';
import { environment } from '../enviroments/environment';
import { routes } from './app.routes';
import { provideApiBaseUrl } from './core/api/api.config';
import { authInterceptorFn } from './core/auth/interceptors/auth-functional.interceptor';
import { devBlockInterceptor } from './core/interceptors/dev-block.interceptor';
import { errorHandlingInterceptor } from './core/interceptors/error-handling.interceptor';
import { securityHeadersInterceptor } from './core/interceptors/security-headers.interceptor';
import { SelectivePreloadingStrategy } from './core/routing/selective-preloading.strategy';
import { TranslocoHttpLoader } from './transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    //  1) Detección de cambios con Zone.js
    provideZoneChangeDetection({ eventCoalescing: true }),

    // 2) Enrutamiento con preloading selectivo
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),

    // 3) HttpClient con interceptores funcionales (orden importa)
    provideHttpClient(
      withInterceptors([
        ...(isDevMode() || environment.features?.mockData ? [devBlockInterceptor] : []),
        securityHeadersInterceptor,    // 1. Headers de seguridad
        errorHandlingInterceptor,      // 2. Manejo de errores
        authInterceptorFn            // 3. Autenticación
      ])
    ),

  // Provide API base URL from environment (important so services use correct backend)
  provideApiBaseUrl(),

    // 4) Animaciones para Angular Material
    provideAnimations(),

    // 5) Proveedor de Transloco
    provideTransloco({
      config: {
        availableLangs: ['es', 'en', 'de', 'fr'],
        defaultLang: 'es',
        fallbackLang: 'es',
        reRenderOnLangChange: true,
        prodMode: !isDevMode()
      },
      loader: TranslocoHttpLoader
    }), provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ,
  // NgRx store and effects
  provideStore({ 
    auth: authReducer,
    ...reducers
  }),
  provideEffects([AuthEffects, ...effects])
  ]
};
