import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Observable, BehaviorSubject } from 'rxjs';

export interface LanguageOption {
  value: string;
  label: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private transloco = inject(TranslocoService);
  
  // Signal para el idioma actual
  private readonly _currentLanguage = signal<string>('es');
  
  // Subject para notificar cambios de idioma
  private readonly _languageChanged = new BehaviorSubject<string>('es');
  
  // Opciones de idioma disponibles
  readonly availableLanguages: LanguageOption[] = [
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' }
  ];

  // Computed properties
  readonly currentLanguage = this._currentLanguage.asReadonly();
  readonly languageChanged$: Observable<string> = this._languageChanged.asObservable();

  constructor() {
    // Inicializar con el idioma guardado o detectar del navegador
    this.initializeLanguage();
  }

  /**
   * Inicializar idioma al cargar la aplicación
   */
  private initializeLanguage(): void {
    // 1. Intentar obtener del localStorage
    const savedLanguage = localStorage.getItem('app-language');
    
    // 2. Si no hay guardado, detectar del navegador
    const browserLanguage = this.getBrowserLanguage();
    
    // 3. Usar el idioma guardado, del navegador o fallback a 'es'
    const initialLanguage = savedLanguage || browserLanguage || 'es';
    
    // 4. Aplicar el idioma
    this.setLanguage(initialLanguage, false); // false = no guardar otra vez
  }

  /**
   * Detectar idioma del navegador
   */
  private getBrowserLanguage(): string {
    const browserLang = navigator.language.slice(0, 2);
    const supportedLanguage = this.availableLanguages.find(lang => lang.value === browserLang);
    return supportedLanguage?.value || 'es';
  }

  /**
   * Cambiar el idioma de la aplicación
   */
  setLanguage(language: string, saveToStorage: boolean = true): void {
    // Validar que el idioma esté disponible
    if (!this.isLanguageAvailable(language)) {
      console.warn(`Language '${language}' is not available. Using 'es' instead.`);
      language = 'es';
    }

    // Actualizar Transloco
    this.transloco.setActiveLang(language);
    
    // Actualizar señales y subjects
    this._currentLanguage.set(language);
    this._languageChanged.next(language);
    
    // Guardar en localStorage si es necesario
    if (saveToStorage) {
      localStorage.setItem('app-language', language);
    }

    // Actualizar atributo html lang para accesibilidad
    document.documentElement.lang = language;
    
    console.log(`Language changed to: ${language}`);
  }

  /**
   * Obtener el idioma actual
   */
  getCurrentLanguage(): string {
    return this._currentLanguage();
  }

  /**
   * Obtener información completa del idioma actual
   */
  getCurrentLanguageInfo(): LanguageOption | undefined {
    const currentLang = this.getCurrentLanguage();
    return this.availableLanguages.find(lang => lang.value === currentLang);
  }

  /**
   * Verificar si un idioma está disponible
   */
  isLanguageAvailable(language: string): boolean {
    return this.availableLanguages.some(lang => lang.value === language);
  }

  /**
   * Obtener el label de un idioma
   */
  getLanguageLabel(languageCode: string): string {
    const language = this.availableLanguages.find(lang => lang.value === languageCode);
    return language?.label || languageCode;
  }

  /**
   * Obtener la bandera de un idioma
   */
  getLanguageFlag(languageCode: string): string {
    const language = this.availableLanguages.find(lang => lang.value === languageCode);
    return language?.flag || '🌐';
  }

  /**
   * Cambiar al siguiente idioma disponible (útil para botones de cambio rápido)
   */
  switchToNextLanguage(): void {
    const currentIndex = this.availableLanguages.findIndex(lang => lang.value === this.getCurrentLanguage());
    const nextIndex = (currentIndex + 1) % this.availableLanguages.length;
    const nextLanguage = this.availableLanguages[nextIndex];
    
    this.setLanguage(nextLanguage.value);
  }

  /**
   * Resetear al idioma por defecto
   */
  resetToDefault(): void {
    this.setLanguage('es');
  }

  /**
   * Precargar traducciones de un idioma
   */
  preloadLanguage(language: string): Observable<any> {
    return this.transloco.load(language);
  }

  /**
   * Obtener traducciones de forma reactiva
   */
  translate(key: string, params?: any): Observable<string> {
    return this.transloco.selectTranslate(key, params);
  }

  /**
   * Obtener traducción instantánea
   */
  translateInstant(key: string, params?: any): string {
    return this.transloco.translate(key, params);
  }

  /**
   * Verificar si las traducciones están cargadas para un idioma
   */
  isLanguageLoaded(language: string): boolean {
    try {
      // Intentar obtener una traducción simple para verificar si está cargado
      const testTranslation = this.transloco.translate('test', {}, language);
      return testTranslation !== 'test'; // Si retorna la misma key, probablemente no está cargado
    } catch {
      return false;
    }
  }
}
