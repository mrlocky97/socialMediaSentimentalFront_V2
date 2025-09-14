import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { EnhancedScrapingProgressComponent } from './enhanced-scraping-progress.component';
import { ScrapingService } from '../../../core/services/scraping.service';

describe('EnhancedScrapingProgressComponent', () => {
  let component: EnhancedScrapingProgressComponent;
  let fixture: ComponentFixture<EnhancedScrapingProgressComponent>;
  let mockScrapingService: jasmine.SpyObj<ScrapingService>;

  const mockProgress = {
    hashtags: { completed: 2, total: 3, inProgress: false, chunkProgress: { current: 2, total: 3, isChunked: true } },
    search: { completed: 1, total: 2, inProgress: true, chunkProgress: { current: 1, total: 2, isChunked: true } },
    users: { completed: 0, total: 1, inProgress: false },
    metrics: { totalScraped: 150, saved: 148, errors: 2, retryAttempts: 1 },
    status: 'running' as const,
    progress: 65,
    estimatedTimeRemaining: 120,
    currentMessage: 'Procesando keywords - chunk 1 de 2',
    isLargeRequest: true,
    backgroundMode: false
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ScrapingService', [
      'enableBackgroundMode',
      'disableBackgroundMode', 
      'cancelScraping',
      'getFormattedETA'
    ], {
      scrapingProgress$: of(mockProgress)
    });

    await TestBed.configureTestingModule({
      imports: [
        EnhancedScrapingProgressComponent,
        NoopAnimationsModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: ScrapingService, useValue: spy }
      ]
    }).compileComponents();

    mockScrapingService = TestBed.inject(ScrapingService) as jasmine.SpyObj<ScrapingService>;
    mockScrapingService.getFormattedETA.and.returnValue('2m 0s restantes');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnhancedScrapingProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display progress information', () => {
    expect(component.progress).toEqual(mockProgress);
    expect(fixture.nativeElement.textContent).toContain('Ejecutándose');
    expect(fixture.nativeElement.textContent).toContain('65%');
    expect(fixture.nativeElement.textContent).toContain('Procesando keywords');
  });

  it('should show chunk information when chunked', () => {
    const chunkInfo = fixture.nativeElement.querySelector('.chunk-info');
    expect(chunkInfo).toBeTruthy();
    expect(chunkInfo.textContent).toContain('Chunk 2 de 3');
  });

  it('should display metrics correctly', () => {
    expect(fixture.nativeElement.textContent).toContain('150'); // totalScraped
    expect(fixture.nativeElement.textContent).toContain('148'); // saved
    expect(fixture.nativeElement.textContent).toContain('2'); // errors
    expect(fixture.nativeElement.textContent).toContain('1'); // retryAttempts
  });

  it('should show large request chip', () => {
    const chip = fixture.nativeElement.querySelector('.large-request-chip');
    expect(chip).toBeTruthy();
    expect(chip.textContent).toContain('Solicitud Grande');
  });

  it('should call enableBackgroundMode when button clicked', () => {
    const backgroundButton = fixture.nativeElement.querySelector('button[matTooltip="Continuar en background"]');
    expect(backgroundButton).toBeTruthy();
    
    backgroundButton.click();
    expect(mockScrapingService.enableBackgroundMode).toHaveBeenCalled();
  });

  it('should call cancelScraping when cancel button clicked', () => {
    const cancelButton = fixture.nativeElement.querySelector('button[matTooltip="Cancelar scraping"]');
    expect(cancelButton).toBeTruthy();
    
    cancelButton.click();
    expect(mockScrapingService.cancelScraping).toHaveBeenCalled();
  });

  it('should calculate section progress correctly', () => {
    const hashtagsProgress = component.getSectionProgress(mockProgress.hashtags);
    expect(hashtagsProgress).toBe(66.67); // 2/3 * 100 = 66.67%
    
    const searchProgress = component.getSectionProgress(mockProgress.search);
    expect(searchProgress).toBe(50); // 1/2 * 100 = 50%
  });

  it('should return correct status icon and class', () => {
    expect(component.getStatusIcon()).toBe('play_circle');
    expect(component.getStatusIconClass()).toBe('status-running');
    expect(component.getStatusText()).toBe('Ejecutándose');
  });

  it('should display ETA formatted correctly', () => {
    expect(component.getFormattedETA()).toBe('2m 0s restantes');
    expect(mockScrapingService.getFormattedETA).toHaveBeenCalled();
  });
});