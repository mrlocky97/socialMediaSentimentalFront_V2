/**
 * Componente de ejemplo mostrando todos los patterns de RxJS
 * Implementa las mejores prácticas para reactive programming
 */
import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { 
  Observable, 
  Subject,
  BehaviorSubject,
  combineLatest,
  merge,
  timer,
  fromEvent,
  of
} from 'rxjs';
import {
  map,
  filter,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  startWith,
  shareReplay,
  catchError,
  tap,
  scan,
  withLatestFrom,
  throttleTime,
  take
} from 'rxjs/operators';

import { RxjsBaseService } from '../../core/services/rxjs-base.service';

@Component({
  selector: 'app-rxjs-demo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <div class="rxjs-demo-container">
      <h1>🚀 RxJS Implementation Demo</h1>
      
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-section">
          <mat-progress-spinner diameter="40"></mat-progress-spinner>
          <p>Loading data...</p>
        </div>
      }

      <!-- Search Section -->
      <mat-card class="search-section">
        <mat-card-header>
          <mat-card-title>🔍 Real-time Search (Debounced)</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Search campaigns...</mat-label>
            <input matInput [formControl]="searchControl" placeholder="Type to search...">
          </mat-form-field>
          
          @if (searchResults$ | async; as results) {
            <div class="search-results">
              <p>Found {{ results.length }} results:</p>
              @for (result of results; track result.id) {
                <mat-chip>{{ result.name }}</mat-chip>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Form Validation Section -->
      <mat-card class="validation-section">
        <mat-card-header>
          <mat-card-title>✅ Async Validation</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Campaign Name</mat-label>
            <input matInput [formControl]="nameControl" placeholder="Enter unique name...">
            @if (nameControl.pending) {
              <mat-progress-spinner matSuffix diameter="20"></mat-progress-spinner>
            }
            @if (nameControl.invalid && nameControl.touched) {
              <mat-error>Name is already taken</mat-error>
            }
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Real-time Data Section -->
      <mat-card class="realtime-section">
        <mat-card-header>
          <mat-card-title>📊 Real-time Updates</mat-card-title>
          <button mat-button (click)="toggleRealTime()">
            {{ isRealTimeActive() ? 'Stop' : 'Start' }} Updates
          </button>
        </mat-card-header>
        <mat-card-content>
          @if (realtimeData$ | async; as data) {
            <div class="data-display">
              <p><strong>Campaigns:</strong> {{ data.campaigns?.length || 0 }}</p>
              <p><strong>Users:</strong> {{ data.users?.length || 0 }}</p>
              <p><strong>Last Updated:</strong> {{ data.lastUpdated | date:'medium' }}</p>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Event Stream Section -->
      <mat-card class="events-section">
        <mat-card-header>
          <mat-card-title>📡 Event Stream</mat-card-title>
          <button mat-button (click)="triggerEvent()">Trigger Event</button>
        </mat-card-header>
        <mat-card-content>
          <div class="events-list">
            @for (event of events(); track $index) {
              <div class="event-item">
                <span class="event-time">{{ event.timestamp | date:'HH:mm:ss' }}</span>
                <span class="event-message">{{ event.message }}</span>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Combined Streams Section -->
      <mat-card class="combined-section">
        <mat-card-header>
          <mat-card-title>🔄 Combined Streams</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (combinedData$ | async; as combined) {
            <div class="combined-display">
              <p><strong>Search Term:</strong> {{ combined.searchTerm }}</p>
              <p><strong>Form Valid:</strong> {{ combined.formValid ? '✅' : '❌' }}</p>
              <p><strong>Loading:</strong> {{ combined.loading ? '🔄' : '✅' }}</p>
              <p><strong>Events Count:</strong> {{ combined.eventsCount }}</p>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Mouse Position Section -->
      <mat-card class="mouse-section">
        <mat-card-header>
          <mat-card-title>🖱️ Mouse Tracking (Throttled)</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (mousePosition$ | async; as position) {
            <div class="mouse-display">
              <p>X: {{ position.x }}, Y: {{ position.y }}</p>
              <div class="mouse-dot" 
                   [style.left.px]="position.x" 
                   [style.top.px]="position.y">
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Counter Section -->
      <mat-card class="counter-section">
        <mat-card-header>
          <mat-card-title>🔢 Counter with Scan</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="counter-controls">
            <button mat-button (click)="increment()">+1</button>
            <button mat-button (click)="decrement()">-1</button>
            <button mat-button (click)="reset()">Reset</button>
          </div>
          <div class="counter-display">
            Count: {{ counter$ | async }}
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .rxjs-demo-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .loading-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
    }

    .full-width {
      width: 100%;
    }

    .search-results {
      margin-top: 16px;
    }

    .search-results mat-chip {
      margin: 4px;
    }

    .data-display, .combined-display {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
    }

    .events-list {
      max-height: 200px;
      overflow-y: auto;
      background: #f9f9f9;
      padding: 8px;
      border-radius: 4px;
    }

    .event-item {
      display: flex;
      gap: 12px;
      padding: 4px 0;
      border-bottom: 1px solid #eee;
    }

    .event-time {
      font-family: monospace;
      color: #666;
      min-width: 80px;
    }

    .event-message {
      flex: 1;
    }

    .mouse-section {
      position: relative;
      min-height: 200px;
    }

    .mouse-display {
      position: relative;
      height: 150px;
      background: #f0f0f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .mouse-dot {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #ff4444;
      border-radius: 50%;
      pointer-events: none;
      transform: translate(-50%, -50%);
    }

    .counter-controls {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .counter-display {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 8px;
    }

    @media (max-width: 768px) {
      .rxjs-demo-container {
        grid-template-columns: 1fr;
        padding: 16px;
      }
    }
  `]
})
export class RxjsDemoComponent implements OnInit {
  // ================================
  // DEPENDENCY INJECTION
  // ================================
  private readonly rxjsService = inject(RxjsBaseService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // FORM CONTROLS
  // ================================
  readonly searchControl = new FormControl('');
  readonly nameControl = new FormControl('', [Validators.required]);

  // ================================
  // SIGNALS FOR LOCAL STATE
  // ================================
  private readonly eventsSignal = signal<Array<{message: string, timestamp: Date}>>([]);
  private readonly realtimeActiveSignal = signal(false);

  // Computed signals
  readonly events = this.eventsSignal.asReadonly();
  readonly isRealTimeActive = this.realtimeActiveSignal.asReadonly();
  readonly isLoading = this.rxjsService.isLoading;

  // ================================
  // SUBJECTS FOR EVENT STREAMS
  // ================================
  private readonly counterSubject = new Subject<number>();
  private readonly realtimeToggleSubject = new BehaviorSubject<boolean>(false);

  // ================================
  // OBSERVABLES SETUP
  // ================================

  // 1. Search with debounce
  readonly searchResults$ = this.searchControl.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
    filter(term => (term?.length || 0) >= 2),
    switchMap(term => this.rxjsService.getData<any[]>(`search?q=${term}`).pipe(
      catchError(() => of([]))
    )),
    shareReplay(1)
  );

  // 2. Real-time data updates
  readonly realtimeData$ = this.realtimeToggleSubject.pipe(
    switchMap(active => 
      active 
        ? this.rxjsService.startRealTimeUpdates('dashboard-data', 2000)
        : of(null)
    )
  );

  // 3. Mouse position tracking (throttled)
  readonly mousePosition$ = fromEvent<MouseEvent>(document, 'mousemove').pipe(
    throttleTime(50),
    map(event => ({ x: event.clientX, y: event.clientY })),
    takeUntilDestroyed(this.destroyRef)
  );

  // 4. Counter with scan operator
  readonly counter$ = this.counterSubject.pipe(
    scan((acc, value) => acc + value, 0),
    startWith(0)
  );

  // 5. Combined streams example
  readonly combinedData$ = combineLatest([
    this.searchControl.valueChanges.pipe(startWith('')),
    this.nameControl.statusChanges.pipe(startWith('INVALID')),
    this.rxjsService.loading$,
    this.rxjsService.event$.pipe(
      scan((count) => count + 1, 0),
      startWith(0)
    )
  ]).pipe(
    map(([searchTerm, formStatus, loading, eventsCount]) => ({
      searchTerm: searchTerm || '',
      formValid: formStatus === 'VALID',
      loading,
      eventsCount
    }))
  );

  ngOnInit(): void {
    this.setupAsyncValidation();
    this.setupEventListening();
  }

  // ================================
  // ASYNC VALIDATION SETUP
  // ================================
  private setupAsyncValidation(): void {
    this.nameControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter((value): value is string => !!value && value.length >= 3),
      switchMap(value => 
        this.rxjsService.validateAsync(value, 'validate-campaign-name')
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(isValid => {
      if (!isValid) {
        this.nameControl.setErrors({ 'nameTaken': true });
      }
    });
  }

  // ================================
  // EVENT LISTENING SETUP
  // ================================
  private setupEventListening(): void {
    // Escuchar eventos del servicio
    this.rxjsService.event$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      this.addEvent(`Service Event: ${event}`);
    });

    // Escuchar cambios de estado
    this.rxjsService.state$.pipe(
      map(state => state.loading),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(loading => {
      this.addEvent(`Loading state changed: ${loading}`);
    });
  }

  // ================================
  // PUBLIC METHODS
  // ================================

  triggerEvent(): void {
    this.addEvent('Manual event triggered');
    // También notificar al servicio
    this.rxjsService.reset();
  }

  toggleRealTime(): void {
    const newState = !this.realtimeActiveSignal();
    this.realtimeActiveSignal.set(newState);
    this.realtimeToggleSubject.next(newState);
    this.addEvent(`Real-time updates ${newState ? 'started' : 'stopped'}`);
  }

  increment(): void {
    this.counterSubject.next(1);
    this.addEvent('Counter incremented');
  }

  decrement(): void {
    this.counterSubject.next(-1);
    this.addEvent('Counter decremented');
  }

  reset(): void {
    this.counterSubject.next(-this.getCurrentCounterValue());
    this.addEvent('Counter reset');
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private addEvent(message: string): void {
    const currentEvents = this.eventsSignal();
    const newEvent = {
      message,
      timestamp: new Date()
    };
    
    // Mantener solo los últimos 10 eventos
    const updatedEvents = [newEvent, ...currentEvents].slice(0, 10);
    this.eventsSignal.set(updatedEvents);
  }

  private getCurrentCounterValue(): number {
    // Este es un hack para obtener el valor actual del counter
    // En un caso real, podrías usar un BehaviorSubject
    let currentValue = 0;
    this.counter$.pipe(take(1)).subscribe(value => currentValue = value as number);
    return currentValue;
  }
}
