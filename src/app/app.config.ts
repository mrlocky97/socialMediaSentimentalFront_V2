import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@ngneat/transloco';
import { authInterceptorFn } from './core/auth/interceptors/auth-functional.interceptor';
import { securityHeadersInterceptor } from './core/interceptors/security-headers.interceptor';
import { errorHandlingInterceptor } from './core/interceptors/error-handling.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    //  1) Detección de cambios con Zone.js
    provideZoneChangeDetection({ eventCoalescing: true }),

    // 2) Enrutamiento
    provideRouter(routes),

    // 3) HttpClient con interceptores funcionales (orden importa)
    provideHttpClient(
      withInterceptors([
        securityHeadersInterceptor,    // 1. Headers de seguridad
        errorHandlingInterceptor,      // 2. Manejo de errores
        authInterceptorFn              // 3. Autenticación
      ])
    ),

    // 4) Animaciones para Angular Material
    provideAnimations(),

    // 5) Proveedor de Transloco
    provideTransloco({
      config: {
        availableLangs: ['en', 'es', 'de', 'fr'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode()
      },
      loader: TranslocoHttpLoader
    })
  ]
};
