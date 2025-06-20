import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco, TRANSLOCO_LOADER, TRANSLOCO_CONFIG } from '@ngneat/transloco';
import { AuthInterceptor } from './core/auth/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    //  1) Detección de cambios con Zone.js
    provideZoneChangeDetection({ eventCoalescing: true }),

    // 2) Enrutamiento
    provideRouter(routes),

    // 3) HttpClient con interceptores inyectados automáticamente
    provideHttpClient(withInterceptorsFromDi()),

    // 4) Proveedor de Transloco
    provideTransloco({
      config: {
        availableLangs: ['en', 'es', 'de', 'fr'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode()
      },
      loader: TranslocoHttpLoader
    }),

    // 5) Registro explícito del interceptor (multi-provider)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
