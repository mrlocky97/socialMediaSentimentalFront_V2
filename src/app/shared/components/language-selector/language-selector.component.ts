import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { LanguageService } from '../../../core/services/language.service';
import { CommonModule } from '@angular/common';

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
  template: `
    <button mat-icon-button 
            [matMenuTriggerFor]="languageMenu"
            [matTooltip]="'language_selector.tooltip' | transloco"
            class="language-selector">
      <span class="current-language-flag">{{ getCurrentLanguageInfo()?.flag || '🌐' }}</span>
    </button>
    
    <mat-menu #languageMenu="matMenu" class="language-menu">
      @for (language of availableLanguages; track language.value) {
        <button mat-menu-item 
                (click)="changeLanguage(language.value)"
                [class.active]="currentLanguage() === language.value">
          <span class="language-flag">{{ language.flag }}</span>
          <span class="language-name">{{ language.label }}</span>
          @if (currentLanguage() === language.value) {
            <mat-icon class="check-icon">check</mat-icon>
          }
        </button>
      }
    </mat-menu>
  `,
  styles: [`
    .language-selector {
      min-width: 40px;
    }
    
    .current-language-flag {
      font-size: 1.2rem;
      line-height: 1;
    }
    
    .language-menu {
      margin-top: 8px;
    }
    
    .language-flag {
      margin-right: 12px;
      font-size: 1.1rem;
    }
    
    .language-name {
      flex: 1;
      text-align: left;
    }
    
    .check-icon {
      color: #4caf50;
      margin-left: 8px;
      transform: scale(0.8);
    }
    
    .mat-mdc-menu-item.active {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }
    
    .mat-mdc-menu-item {
      display: flex;
      align-items: center;
      min-width: 180px;
      padding: 8px 16px;
    }
  `]
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
}
