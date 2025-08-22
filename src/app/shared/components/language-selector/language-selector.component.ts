import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslocoModule
  ],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.css'],
})
export class LanguageSelectorComponent {
  private languageService = inject(LanguageService);
  
  readonly currentLanguage = this.languageService.currentLanguage;
  readonly availableLanguages = this.languageService.availableLanguages;

  changeLanguage(language: string): void {
    this.languageService.setLanguage(language);
  }
  
  getCurrentLanguageInfo() {
    return this.languageService.getCurrentLanguageInfo();
  }

  // Método para manejar errores de carga de imágenes de banderas
  onImageError(event: Event, fallbackFlag: string): void {
    const imgElement = event.target as HTMLImageElement;
    // Crear un elemento span con el emoji como fallback
    const span = document.createElement('span');
    span.textContent = fallbackFlag;
    span.className = 'flag-emoji-fallback';
    span.style.fontSize = '1.2rem';
    span.style.lineHeight = '1';
    
    // Reemplazar la imagen con el emoji
    if (imgElement.parentNode) {
      imgElement.parentNode.replaceChild(span, imgElement);
    }
  }
}
