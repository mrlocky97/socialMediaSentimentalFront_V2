import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import {
  of,
  timer
} from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  switchMap,
  tap
} from 'rxjs/operators';
import { PendingTweetService } from './services/pending-tweet-widget.service';

@Component({
  selector: 'app-pending-tweet-widget',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './pending-tweet-widget.component.html',
  styleUrls: ['./pending-tweet-widget.component.css']
})
export class PendingTweetWidgetComponent implements OnInit {
  private readonly pendingTweetService = inject(PendingTweetService);
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // REACTIVE STATE WITH SIGNALS
  // ================================

  pending = signal<number | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  lastUpdated = signal<Date | null>(null);
  connectionStatus = signal<'connected' | 'disconnected' | 'error'>('disconnected');
  refreshCount = signal<number>(0);

  // ================================
  // REACTIVE STREAMS
  // ================================

  // Stream for pending tweets data
  readonly pendingData$ = this.pendingTweetService.getPendingTweetsStream().pipe(
    distinctUntilChanged((prev, curr) =>
      prev?.count === curr?.count && prev?.lastUpdated === curr?.lastUpdated
    ),
    tap(data => {
      if (data) {
        this.pending.set(data.count);
        this.lastUpdated.set(data.lastUpdated);
        this.connectionStatus.set('connected');
        this.refreshCount.update(count => count + 1);
      }
    }),
    catchError(error => {
      console.error('Error in pending data stream:', error);
      this.connectionStatus.set('error');
      return of(null);
    })
  );

  // Stream for connection health monitoring
  readonly connectionHealth$ = timer(0, 60000).pipe( // Check every minute
    switchMap(() => this.pendingTweetService.getPendingTweetsStream()),
    map(data => data !== null),
    distinctUntilChanged(),
    tap(isHealthy => {
      this.connectionStatus.set(isHealthy ? 'connected' : 'error');
    })
  );

  // ================================
  // COMPUTED PROPERTIES
  // ================================

  statusMessage = computed(() => {
    const status = this.connectionStatus();
    const lastUpdate = this.lastUpdated();
    const count = this.pending();

    if (status === 'error') {
      return 'Connection error - Data may be outdated';
    }

    if (status === 'disconnected') {
      return 'Connecting...';
    }

    if (lastUpdate) {
      const timeDiff = Date.now() - lastUpdate.getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));

      if (minutesAgo === 0) {
        return 'Just updated';
      } else if (minutesAgo === 1) {
        return '1 minute ago';
      } else {
        return `${minutesAgo} minutes ago`;
      }
    }

    return 'No data available';
  });

  isStale = computed(() => {
    const lastUpdate = this.lastUpdated();
    if (!lastUpdate) return false;

    const timeDiff = Date.now() - lastUpdate.getTime();
    return timeDiff > 5 * 60 * 1000; // More than 5 minutes
  });

  pendingStatus = computed(() => {
    const count = this.pending();
    if (count === null) return 'unknown';
    if (count === 0) return 'none';
    if (count <= 10) return 'low';
    if (count <= 50) return 'medium';
    return 'high';
  });

  ngOnInit(): void {
    this.initializeReactiveStreams();
  }

  // ================================
  // PUBLIC METHODS
  // ================================

  /**
   * Manually refresh pending tweets data
   */
  refreshPendingTweets(): void {
    this.loading.set(true);
    this.pendingTweetService.forceRefresh();
  }

  /**
   * Toggle real-time updates on/off
   */
  toggleRealTimeUpdates(): void {
    const currentState = this.pendingTweetService.isRealTimeEnabled();
    this.pendingTweetService.toggleRealTimeUpdates(!currentState);
  }

  /**
   * Get the real-time status
   */
  isRealTimeEnabled(): boolean {
    return this.pendingTweetService.isRealTimeEnabled();
  }

  /**
   * Legacy method for backward compatibility
   */
  pendingTweets() {
    return this.refreshPendingTweets();
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private initializeReactiveStreams(): void {
    // Subscribe to pending data updates
    this.pendingData$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    // Subscribe to connection health monitoring
    this.connectionHealth$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    // Sync loading and error state with service signals
    // Note: In a real app, you might want to convert signals to observables
    // or use effect() to watch signal changes

    // Initial load
    this.pendingTweetService.loadPending();
  }
}
