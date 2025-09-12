/**
 * Advanced Scraping Service
 * Handles the new advanced scraping system with WebSocket support
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, Subject, catchError, map, of, takeUntil, tap } from 'rxjs';
import socketIo from 'socket.io-client';
import { environment } from '../../../enviroments/environment';
import {
  CreateJobRequest,
  CreateJobResponse,
  JobFormData,
  JobListResponse,
  JobMetrics,
  JobProgress,
  ScrapingJob,
  ScrapingStats
} from '../interfaces/advanced-scraping.interface';

@Injectable({
  providedIn: 'root'
})
export class AdvancedScrapingService implements OnDestroy {
  private readonly API_BASE_URL = environment.production 
    ? 'https://your-backend-domain.com/api/v1/scraping/advanced'
    : `${environment.apiUrl}/api/${environment.apiVersion}/scraping/advanced`;
  private readonly WEBSOCKET_URL = environment.production 
    ? 'https://your-backend-domain.com'
    : environment.apiUrl;
  
  private socket: any | null = null;
  private websocketEnabled = false;
  private destroy$ = new Subject<void>();
  private demoNotificationShown = false;
  
  // State management
  private jobsSubject = new BehaviorSubject<ScrapingJob[]>([]);
  private progressSubject = new BehaviorSubject<Map<string, JobProgress>>(new Map());
  private statsSubject = new BehaviorSubject<ScrapingStats>({
    totalJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    totalTweetsCollected: 0,
    averageProcessingTime: 0,
    systemLoad: 0
  });
  
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private metricsSubject = new BehaviorSubject<JobMetrics>({
    totalJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageProgress: 0,
    totalTweetsCollected: 0,
    estimatedTimeRemaining: 0
  });

  // Public observables
  public jobs$ = this.jobsSubject.asObservable();
  public progress$ = this.progressSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public metrics$ = this.metricsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    // Initialize with demo data immediately
    this.initializeDemoData();
    
    // Check if we should try backend connection based on environment
    if (!environment.features.offlineMode && environment.features.realTimeUpdates) {
      // Try to initialize WebSocket after a delay to allow app to load
      setTimeout(() => {
        this.tryEnableWebSocket();
      }, 2000);
    } else {
      console.log('🔄 Running in offline mode by configuration');
      this.connectionStatusSubject.next(false);
      this.websocketEnabled = false;
    }
  }

  /**
   * Initialize demo data immediately for offline usage
   */
  private initializeDemoData(): void {
    const demoJobs = this.getDemoJobs();
    this.jobsSubject.next(demoJobs);
    this.updateMetrics(demoJobs);
    
    // Set initial connection status to false
    this.connectionStatusSubject.next(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnectWebSocket();
  }

  /**
   * Initialize WebSocket connection with error handling
   */
  private initializeWebSocket(): void {
    // Check if WebSocket should be enabled (only if backend is available)
    if (!this.websocketEnabled) {
      console.log('🔄 WebSocket disabled - running in offline mode');
      this.connectionStatusSubject.next(false);
      return;
    }

    try {
      this.socket = socketIo(this.WEBSOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000, // Reduced timeout
        forceNew: true,
        autoConnect: false // Don't auto-connect
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to scraping WebSocket');
        this.connectionStatusSubject.next(true);
        this.websocketEnabled = true;
        this.snackBar.open('Connected to real-time scraping monitor', 'Close', { duration: 3000 });
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from scraping WebSocket');
        this.connectionStatusSubject.next(false);
        this.snackBar.open('Disconnected from real-time monitor', 'Close', { duration: 3000 });
      });

      this.socket.on('connect_error', (error: any) => {
        console.warn('⚠️ WebSocket connection failed - running in offline mode:', error.message);
        this.connectionStatusSubject.next(false);
        this.websocketEnabled = false;
        // Don't show error snackbar on initial connection failure
      });

      // Listen for job progress updates
      this.socket.on('job-progress', (data: JobProgress) => {
        this.updateJobProgress(data);
      });

      // Listen for job completion
      this.socket.on('job-completed', (data: { jobId: string; finalStats: JobProgress }) => {
        this.handleJobCompleted(data.jobId, data.finalStats);
        this.snackBar.open(`Job ${data.jobId} completed successfully!`, 'View', { 
          duration: 5000 
        }).onAction().subscribe(() => {
          // Navigate to job details or results
        });
      });

      // Listen for job failures
      this.socket.on('job-failed', (data: { jobId: string; error: string; progress: JobProgress }) => {
        this.handleJobFailed(data.jobId, data.error, data.progress);
        this.snackBar.open(`Job ${data.jobId} failed: ${data.error}`, 'Close', { 
          duration: 7000,
          panelClass: ['error-snackbar']
        });
      });

      // Listen for job cancellations
      this.socket.on('job-cancelled', (data: { jobId: string }) => {
        this.handleJobCancelled(data.jobId);
        this.snackBar.open(`Job ${data.jobId} was cancelled`, 'Close', { duration: 3000 });
      });

      // Listen for system stats
      this.socket.on('system-stats', (data: ScrapingStats) => {
        this.statsSubject.next(data);
      });

      // Try to connect with timeout
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, 1000);

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.connectionStatusSubject.next(false);
      this.websocketEnabled = false;
    }
  }

  /**
   * Disconnect WebSocket
   */
  private disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatusSubject.next(false);
  }

  /**
   * Try to enable WebSocket connection (check if backend is available)
   */
  public tryEnableWebSocket(): void {
    // Skip if offline mode is enabled
    if (environment.features.offlineMode || !environment.features.realTimeUpdates) {
      console.log('⚠️ Offline mode enabled or real-time updates disabled - skipping backend connection');
      this.connectionStatusSubject.next(false);
      this.websocketEnabled = false;
      return;
    }

    // First, try a simple HTTP request to check if backend is available
    this.http.get(`${this.API_BASE_URL}/health`, { 
      observe: 'response',
      headers: { 'Content-Type': 'application/json' }
    })
      .pipe(
        catchError((error) => {
          console.warn('Backend connection failed:', error.message);
          this.websocketEnabled = false;
          this.connectionStatusSubject.next(false);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        if (response && response.status === 200) {
          console.log('✅ Backend available - enabling WebSocket and loading real data');
          this.websocketEnabled = true;
          this.initializeWebSocket();
          // Load real jobs from backend
          this.loadJobs().subscribe();
        } else {
          console.log('⚠️ Backend not available - continuing in offline mode');
          this.websocketEnabled = false;
          this.connectionStatusSubject.next(false);
          // Keep demo data that was loaded in constructor
        }
      });
  }

  /**
   * Manually enable/disable WebSocket
   */
  public setWebSocketEnabled(enabled: boolean): void {
    if (enabled && !this.websocketEnabled) {
      this.tryEnableWebSocket();
    } else if (!enabled && this.websocketEnabled) {
      this.websocketEnabled = false;
      this.disconnectWebSocket();
    }
  }

  /**
   * Subscribe to a specific job's progress
   */
  public subscribeToJob(jobId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe-to-job', { jobId });
      console.log(`📡 Subscribed to job: ${jobId}`);
    }
  }

  /**
   * Unsubscribe from a specific job's progress
   */
  public unsubscribeFromJob(jobId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe-from-job', { jobId });
      console.log(`🔇 Unsubscribed from job: ${jobId}`);
    }
  }

  /**
   * Create a new scraping job
   */
  public createJob(formData: JobFormData): Observable<CreateJobResponse> {
    // If offline mode or backend not available, create demo job immediately
    if (environment.features.offlineMode || !this.websocketEnabled) {
      return this.createDemoJob(formData);
    }

    const request: CreateJobRequest = {
      type: formData.type,
      query: formData.query,
      targetCount: formData.targetCount,
      campaignId: formData.campaignId || '',
      priority: formData.priority,
      options: {
        includeReplies: formData.includeReplies,
        includeRetweets: formData.includeRetweets
      }
    };

    return this.http.post<CreateJobResponse>(`${this.API_BASE_URL}/job`, request).pipe(
      tap(response => {
        console.log('✅ Job created:', response);
        this.snackBar.open(`Job created: ${response.jobId}`, 'Subscribe', { 
          duration: 5000 
        }).onAction().subscribe(() => {
          this.subscribeToJob(response.jobId);
        });
        
        // Refresh jobs list
        this.loadJobs();
      }),
      catchError(error => {
        console.warn('Backend not available for job creation, creating demo job:', error.message);
        return this.createDemoJob(formData);
      })
    );
  }

  /**
   * Create a demo job for offline mode
   */
  private createDemoJob(formData: JobFormData): Observable<CreateJobResponse> {
    // Generate a mock job ID
    const mockJobId = `demo-job-${Date.now()}`;
    
    // Create mock response
    const mockResponse: CreateJobResponse = {
      jobId: mockJobId,
      estimatedTime: Math.floor(Math.random() * 60) + 10, // 10-70 minutes
      websocketUrl: this.WEBSOCKET_URL
    };
    
    // Add job to local state
    const newJob: ScrapingJob = {
      id: mockJobId,
      type: formData.type,
      query: formData.query,
      targetCount: formData.targetCount,
      campaignId: formData.campaignId || '',
      priority: formData.priority,
      status: 'pending',
      createdAt: new Date(),
      progress: {
        jobId: mockJobId,
        current: 0,
        total: formData.targetCount,
        percentage: 0,
        currentBatch: 0,
        totalBatches: Math.ceil(formData.targetCount / 100),
        status: 'pending',
        tweetsCollected: 0,
        estimatedTimeRemaining: mockResponse.estimatedTime * 60,
        errors: [],
        throughput: 0
      },
      options: {
        includeReplies: formData.includeReplies,
        includeRetweets: formData.includeRetweets
      }
    };
    
    // Update jobs list
    const currentJobs = this.jobsSubject.value;
    this.jobsSubject.next([newJob, ...currentJobs]);
    this.updateMetrics([newJob, ...currentJobs]);
    
    this.snackBar.open(`Demo job created: ${mockJobId}`, 'View Jobs', { 
      duration: 5000,
      panelClass: ['info-snackbar']
    });
    
    return of(mockResponse);
  }

  /**
   * Get job progress
   */
  public getJobProgress(jobId: string): Observable<JobProgress> {
    // If offline mode or backend not available, return demo progress
    if (environment.features.offlineMode || !this.websocketEnabled) {
      const jobs = this.jobsSubject.value;
      const job = jobs.find(j => j.id === jobId);
      
      if (job) {
        return of(job.progress);
      }
      
      // Return default progress for unknown jobs in offline mode
      return of({
        jobId,
        current: 0,
        total: 0,
        percentage: 0,
        currentBatch: 0,
        totalBatches: 0,
        status: 'failed',
        tweetsCollected: 0,
        errors: ['Job not found in offline mode']
      } as JobProgress);
    }

    return this.http.get<JobProgress>(`${this.API_BASE_URL}/job/${jobId}`).pipe(
      catchError(error => {
        console.error(`Failed to get progress for job ${jobId}:`, error);
        this.websocketEnabled = false;
        this.connectionStatusSubject.next(false);
        
        return of({
          jobId,
          current: 0,
          total: 0,
          percentage: 0,
          currentBatch: 0,
          totalBatches: 0,
          status: 'failed',
          tweetsCollected: 0,
          errors: [error.message]
        } as JobProgress);
      })
    );
  }

  /**
   * Get list of jobs with offline mode support
   */
  public loadJobs(status?: 'running' | 'pending' | 'completed' | 'failed'): Observable<JobListResponse> {
    // If offline mode or backend not available, return demo data immediately
    if (environment.features.offlineMode || !this.websocketEnabled) {
      return this.getDemoJobsResponse(status);
    }

    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<JobListResponse>(`${this.API_BASE_URL}/jobs`, { params }).pipe(
      tap(response => {
        this.jobsSubject.next(response.jobs);
        this.updateMetrics(response.jobs);
        
        // Subscribe to all running jobs if WebSocket is available
        if (this.websocketEnabled && this.socket?.connected) {
          response.jobs
            .filter(job => job.status === 'running')
            .forEach(job => this.subscribeToJob(job.id));
        }
      }),
      catchError(error => {
        console.warn('Backend not available, using demo data:', error.message);
        this.websocketEnabled = false;
        this.connectionStatusSubject.next(false);
        
        return this.getDemoJobsResponse(status);
      })
    );
  }

  /**
   * Get demo jobs response for offline mode
   */
  private getDemoJobsResponse(status?: 'running' | 'pending' | 'completed' | 'failed'): Observable<JobListResponse> {
    let demoJobs = this.getDemoJobs();
    
    // Filter by status if provided
    if (status) {
      demoJobs = demoJobs.filter(job => job.status === status);
    }
    
    const demoResponse: JobListResponse = {
      jobs: demoJobs,
      totalCount: demoJobs.length,
      hasMore: false
    };
    
    this.jobsSubject.next(demoResponse.jobs);
    this.updateMetrics(demoResponse.jobs);
    
    // Only show the demo notification once per session
    if (!this.demoNotificationShown) {
      this.demoNotificationShown = true;
      this.snackBar.open('Running in demo mode - backend not available', 'Enable Backend', { 
        duration: 8000,
        panelClass: ['info-snackbar']
      }).onAction().subscribe(() => {
        this.tryEnableWebSocket();
      });
    }
    
    return of(demoResponse);
  }

  /**
   * Get demo jobs for offline mode
   */
  private getDemoJobs(): ScrapingJob[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 'demo-job-1',
        type: 'hashtag',
        query: '#Angular',
        targetCount: 1000,
        campaignId: 'demo-campaign-1',
        priority: 'medium',
        status: 'completed',
        createdAt: yesterday,
        completedAt: now,
        progress: {
          jobId: 'demo-job-1',
          current: 1000,
          total: 1000,
          percentage: 100,
          currentBatch: 10,
          totalBatches: 10,
          status: 'completed',
          tweetsCollected: 1000,
          estimatedTimeRemaining: 0,
          errors: [],
          throughput: 5.2
        },
        options: {
          includeReplies: false,
          includeRetweets: true
        }
      },
      {
        id: 'demo-job-2',
        type: 'user',
        query: '@angular',
        targetCount: 500,
        campaignId: 'demo-campaign-2',
        priority: 'high',
        status: 'running',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        startedAt: new Date(now.getTime() - 90 * 60 * 1000), // 90 minutes ago
        progress: {
          jobId: 'demo-job-2',
          current: 275,
          total: 500,
          percentage: 55,
          currentBatch: 6,
          totalBatches: 10,
          status: 'running',
          tweetsCollected: 275,
          estimatedTimeRemaining: 15 * 60, // 15 minutes
          errors: [],
          throughput: 2.5
        },
        options: {
          includeReplies: true,
          includeRetweets: false
        }
      },
      {
        id: 'demo-job-3',
        type: 'search',
        query: 'machine learning',
        targetCount: 2000,
        campaignId: 'demo-campaign-3',
        priority: 'low',
        status: 'pending',
        createdAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
        progress: {
          jobId: 'demo-job-3',
          current: 0,
          total: 2000,
          percentage: 0,
          currentBatch: 0,
          totalBatches: 20,
          status: 'pending',
          tweetsCollected: 0,
          estimatedTimeRemaining: 60 * 60, // 1 hour
          errors: [],
          throughput: 0
        },
        options: {
          includeReplies: false,
          includeRetweets: true
        }
      }
    ];
  }

  /**
   * Cancel a job
   */
  public cancelJob(jobId: string): Observable<boolean> {
    // If offline mode or backend not available, handle cancellation locally
    if (environment.features.offlineMode || !this.websocketEnabled) {
      const jobs = this.jobsSubject.value;
      const jobIndex = jobs.findIndex(j => j.id === jobId);
      
      if (jobIndex >= 0) {
        const updatedJobs = [...jobs];
        updatedJobs[jobIndex] = { 
          ...updatedJobs[jobIndex], 
          status: 'cancelled' as any,
          progress: {
            ...updatedJobs[jobIndex].progress,
            status: 'failed'
          }
        };
        
        this.jobsSubject.next(updatedJobs);
        this.updateMetrics(updatedJobs);
        
        this.snackBar.open(`Demo job ${jobId} cancelled`, 'Close', { duration: 3000 });
        return of(true);
      } else {
        this.snackBar.open(`Job ${jobId} not found`, 'Close', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return of(false);
      }
    }

    return this.http.post<{ success: boolean }>(`${this.API_BASE_URL}/job/${jobId}/cancel`, {}).pipe(
      map(response => response.success),
      tap(success => {
        if (success) {
          this.snackBar.open(`Job ${jobId} cancelled`, 'Close', { duration: 3000 });
          this.loadJobs(); // Refresh jobs list
        }
      }),
      catchError(error => {
        console.error(`Failed to cancel job ${jobId}:`, error);
        this.websocketEnabled = false;
        this.connectionStatusSubject.next(false);
        
        this.snackBar.open(`Failed to cancel job: ${error.error?.message || error.message}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return of(false);
      })
    );
  }

  /**
   * Get system statistics
   */
  public getSystemStats(): Observable<ScrapingStats> {
    // If offline mode or backend not available, return demo stats immediately
    if (environment.features.offlineMode || !this.websocketEnabled) {
      const demoStats: ScrapingStats = {
        totalJobs: 3,
        runningJobs: 1,
        completedJobs: 1,
        failedJobs: 1,
        totalTweetsCollected: 1250,
        averageProcessingTime: 45.5,
        systemLoad: 35.2
      };
      
      this.statsSubject.next(demoStats);
      return of(demoStats);
    }

    return this.http.get<ScrapingStats>(`${this.API_BASE_URL}/stats`).pipe(
      tap(stats => this.statsSubject.next(stats)),
      catchError(error => {
        console.warn('Backend not available for stats, using demo data:', error.message);
        this.websocketEnabled = false;
        this.connectionStatusSubject.next(false);
        
        // Return demo stats when backend is not available
        const demoStats: ScrapingStats = {
          totalJobs: 3,
          runningJobs: 1,
          completedJobs: 1,
          failedJobs: 1,
          totalTweetsCollected: 1250,
          averageProcessingTime: 45.5,
          systemLoad: 35.2
        };
        
        this.statsSubject.next(demoStats);
        return of(demoStats);
      })
    );
  }

  /**
   * Get job by ID
   */
  public getJob(jobId: string): Observable<ScrapingJob | null> {
    const jobs = this.jobsSubject.value;
    const job = jobs.find(j => j.id === jobId);
    
    if (job) {
      return of(job);
    }

    // If not in cache, try to fetch from API
    return this.getJobProgress(jobId).pipe(
      map(progress => {
        // Create a basic job object from progress data
        // In a real scenario, you'd have a dedicated endpoint for this
        return {
          id: jobId,
          type: 'search' as const,
          query: 'Unknown',
          targetCount: progress.total,
          campaignId: '',
          priority: 'medium' as const,
          status: progress.status,
          progress,
          createdAt: new Date(),
          options: {
            includeReplies: false,
            includeRetweets: true
          }
        } as ScrapingJob;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Update job progress from WebSocket
   */
  private updateJobProgress(progress: JobProgress): void {
    const currentProgress = this.progressSubject.value;
    currentProgress.set(progress.jobId, progress);
    this.progressSubject.next(new Map(currentProgress));

    // Update the job in the jobs list
    const jobs = this.jobsSubject.value;
    const updatedJobs = jobs.map(job => 
      job.id === progress.jobId 
        ? { ...job, progress, status: progress.status }
        : job
    );
    this.jobsSubject.next(updatedJobs);
    this.updateMetrics(updatedJobs);
  }

  /**
   * Handle job completion
   */
  private handleJobCompleted(jobId: string, finalStats: JobProgress): void {
    this.updateJobProgress(finalStats);
    this.unsubscribeFromJob(jobId);
  }

  /**
   * Handle job failure
   */
  private handleJobFailed(jobId: string, error: string, progress: JobProgress): void {
    this.updateJobProgress(progress);
    this.unsubscribeFromJob(jobId);
  }

  /**
   * Handle job cancellation
   */
  private handleJobCancelled(jobId: string): void {
    const jobs = this.jobsSubject.value;
    const updatedJobs = jobs.map(job => 
      job.id === jobId 
        ? { ...job, status: 'cancelled' as any }
        : job
    );
    this.jobsSubject.next(updatedJobs);
    this.updateMetrics(updatedJobs);
    this.unsubscribeFromJob(jobId);
  }

  /**
   * Update metrics based on current jobs
   */
  private updateMetrics(jobs: ScrapingJob[]): void {
    const metrics: JobMetrics = {
      totalJobs: jobs.length,
      runningJobs: jobs.filter(j => j.status === 'running').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      averageProgress: jobs.length > 0 
        ? jobs.reduce((sum, job) => sum + job.progress.percentage, 0) / jobs.length 
        : 0,
      totalTweetsCollected: jobs.reduce((sum, job) => sum + job.progress.tweetsCollected, 0),
      estimatedTimeRemaining: jobs
        .filter(j => j.status === 'running' && j.progress.estimatedTimeRemaining)
        .reduce((sum, job) => sum + (job.progress.estimatedTimeRemaining || 0), 0)
    };

    this.metricsSubject.next(metrics);
  }

  /**
   * Reconnect WebSocket if disconnected
   */
  public reconnectWebSocket(): void {
    if (!this.socket || !this.socket.connected) {
      this.disconnectWebSocket();
      this.initializeWebSocket();
    }
  }

  /**
   * Get current connection status
   */
  public isConnected(): boolean {
    return this.connectionStatusSubject.value;
  }
}
