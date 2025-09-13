/**
 * Advanced Scraping Service
 * Handles the new advanced scraping system with WebSocket support
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, Subject, catchError, map, of, takeUntil, tap, timer } from 'rxjs';
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
  providedIn: 'root',
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
    systemLoad: 0,
  });

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private metricsSubject = new BehaviorSubject<JobMetrics>({
    totalJobs: 0,
    runningJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageProgress: 0,
    totalTweetsCollected: 0,
    estimatedTimeRemaining: 0,
  });

  // Public observables
  public jobs$ = this.jobsSubject.asObservable();
  public progress$ = this.progressSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public metrics$ = this.metricsSubject.asObservable();

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {
    // Initialize with demo data immediately
    this.initializeDemoData();

    // Start progress simulation for running jobs
    this.startProgressSimulation();

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
        autoConnect: false, // Don't auto-connect
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
        this.snackBar
          .open(`Job ${data.jobId} completed successfully!`, 'View', {
            duration: 5000,
          })
          .onAction()
          .subscribe(() => {
            // Navigate to job details or results
          });
      });

      // Listen for job failures
      this.socket.on(
        'job-failed',
        (data: { jobId: string; error: string; progress: JobProgress }) => {
          this.handleJobFailed(data.jobId, data.error, data.progress);
          this.snackBar.open(`Job ${data.jobId} failed: ${data.error}`, 'Close', {
            duration: 7000,
            panelClass: ['error-snackbar'],
          });
        }
      );

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
      console.log(
        '⚠️ Offline mode enabled or real-time updates disabled - skipping backend connection'
      );
      this.connectionStatusSubject.next(false);
      this.websocketEnabled = false;
      return;
    }

    // First, try a simple HTTP request to check if backend is available
    this.http
      .get(`${this.API_BASE_URL}/health`, {
        observe: 'response',
        headers: { 'Content-Type': 'application/json' },
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
      .subscribe((response) => {
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
    console.log('🚀 AdvancedScrapingService.createJob called with:', formData);
    console.log('🔧 Environment check - offlineMode:', environment.features.offlineMode);
    console.log('🔧 WebSocket enabled:', this.websocketEnabled);
    
    // If offline mode is explicitly enabled, create demo job immediately
    if (environment.features.offlineMode) {
      console.log('⚠️ Using demo job mode (offline mode enabled)');
      return this.createDemoJob(formData);
    }

    // If offline mode is disabled, try real API call regardless of WebSocket status
    console.log('📡 Making real API call to:', `${this.API_BASE_URL}/job`);
    
    const request: CreateJobRequest = {
      type: formData.type,
      query: formData.query,
      targetCount: formData.targetCount,
      campaignId: formData.campaignId,
      priority: formData.priority,
      options: {
        includeReplies: formData.options?.includeReplies || false,
        includeRetweets: formData.options?.includeRetweets || true,
      },
    };

    console.log('📤 Sending request:', request);

    return this.http.post<CreateJobResponse>(`${this.API_BASE_URL}/job`, request).pipe(
      tap((response) => {
        console.log('✅ Job created:', response);
        this.snackBar
          .open(`Job created: ${response.jobId}`, 'Subscribe', {
            duration: 5000,
          })
          .onAction()
          .subscribe(() => {
            this.subscribeToJob(response.jobId);
          });

        // Refresh jobs list
        this.loadJobs();
      }),
      catchError((error) => {
        console.warn('💥 Backend not available for job creation, creating demo job:', error.message);
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
      websocketUrl: this.WEBSOCKET_URL,
    };

    // Add job to local state
    const newJob: ScrapingJob = {
      id: mockJobId,
      type: formData.type,
      query: formData.query,
      targetCount: formData.targetCount,
      campaignId: formData.campaignId,
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
        throughput: 0,
      },
      options: {
        includeReplies: formData.options?.includeReplies || false,
        includeRetweets: formData.options?.includeRetweets || true,
      },
    };

    // Update jobs list
    const currentJobs = this.jobsSubject.value;
    this.jobsSubject.next([newJob, ...currentJobs]);
    this.updateMetrics([newJob, ...currentJobs]);

    this.snackBar.open(`Demo job created: ${mockJobId}`, 'View Jobs', {
      duration: 5000,
      panelClass: ['info-snackbar'],
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
      const job = jobs.find((j) => j.id === jobId);

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
        errors: ['Job not found in offline mode'],
      } as JobProgress);
    }

    return this.http.get<JobProgress>(`${this.API_BASE_URL}/job/${jobId}`).pipe(
      catchError((error) => {
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
          errors: [error.message],
        } as JobProgress);
      })
    );
  }

  /**
   * Get list of jobs with offline mode support
   */
  public loadJobs(
    status?: 'running' | 'pending' | 'completed' | 'failed'
  ): Observable<JobListResponse> {
    // If offline mode or backend not available, return demo data immediately
    if (environment.features.offlineMode || !this.websocketEnabled) {
      return this.getDemoJobsResponse(status);
    }

    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<JobListResponse>(`${this.API_BASE_URL}/jobs`, { params }).pipe(
      tap((response) => {
        this.jobsSubject.next(response.jobs);
        this.updateMetrics(response.jobs);

        // Subscribe to all running jobs if WebSocket is available
        if (this.websocketEnabled && this.socket?.connected) {
          response.jobs
            .filter((job) => job.status === 'running')
            .forEach((job) => this.subscribeToJob(job.id));
        }
      }),
      catchError((error) => {
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
  private getDemoJobsResponse(
    status?: 'running' | 'pending' | 'completed' | 'failed'
  ): Observable<JobListResponse> {
    let demoJobs = this.getDemoJobs();

    // Filter by status if provided
    if (status) {
      demoJobs = demoJobs.filter((job) => job.status === status);
    }

    const demoResponse: JobListResponse = {
      jobs: demoJobs,
      totalCount: demoJobs.length,
      hasMore: false,
    };

    this.jobsSubject.next(demoResponse.jobs);
    this.updateMetrics(demoResponse.jobs);

    // Only show the demo notification once per session
    if (!this.demoNotificationShown) {
      this.demoNotificationShown = true;
      this.snackBar
        .open('Running in demo mode - backend not available', 'Enable Backend', {
          duration: 8000,
          panelClass: ['info-snackbar'],
        })
        .onAction()
        .subscribe(() => {
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
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    return [
      // Completed job - US Election Campaign monitoring
      {
        id: 'job-us-election-2024',
        type: 'hashtag',
        query: '#Election2024',
        targetCount: 5000,
        campaignId: 'campaign-politics-usa',
        priority: 'high',
        status: 'completed',
        createdAt: lastWeek,
        startedAt: new Date(lastWeek.getTime() + 5 * 60 * 1000),
        completedAt: yesterday,
        progress: {
          jobId: 'job-us-election-2024',
          current: 5000,
          total: 5000,
          percentage: 100,
          currentBatch: 50,
          totalBatches: 50,
          status: 'completed',
          tweetsCollected: 5000,
          estimatedTimeRemaining: 0,
          errors: [],
          throughput: 8.3,
        },
        options: {
          includeReplies: true,
          includeRetweets: true,
        },
      },
      // Running job - Cryptocurrency trend analysis
      {
        id: 'job-crypto-sentiment',
        type: 'search',
        query: 'Bitcoin OR Ethereum OR crypto sentiment analysis',
        targetCount: 3000,
        campaignId: 'campaign-fintech-trends',
        priority: 'high',
        status: 'running',
        createdAt: twoHoursAgo,
        startedAt: oneHourAgo,
        progress: {
          jobId: 'job-crypto-sentiment',
          current: 1847,
          total: 3000,
          percentage: 61.6,
          currentBatch: 19,
          totalBatches: 30,
          status: 'running',
          tweetsCollected: 1847,
          estimatedTimeRemaining: 22 * 60, // 22 minutes
          errors: ['Rate limit hit at 14:23 - resumed at 14:28', 'API timeout on batch 12'],
          throughput: 4.2,
        },
        options: {
          includeReplies: false,
          includeRetweets: true,
        },
      },
      // Running job - Brand monitoring for tech company
      {
        id: 'job-apple-brand-monitor',
        type: 'user',
        query: '@Apple',
        targetCount: 2000,
        campaignId: 'campaign-brand-monitoring',
        priority: 'medium',
        status: 'running',
        createdAt: oneHourAgo,
        startedAt: new Date(oneHourAgo.getTime() + 10 * 60 * 1000),
        progress: {
          jobId: 'job-apple-brand-monitor',
          current: 734,
          total: 2000,
          percentage: 36.7,
          currentBatch: 8,
          totalBatches: 20,
          status: 'running',
          tweetsCollected: 734,
          estimatedTimeRemaining: 45 * 60, // 45 minutes
          errors: [],
          throughput: 2.8,
        },
        options: {
          includeReplies: true,
          includeRetweets: false,
        },
      },
      // Pending job - Climate change research
      {
        id: 'job-climate-research',
        type: 'hashtag',
        query: '#ClimateChange',
        targetCount: 10000,
        campaignId: 'campaign-research-climate',
        priority: 'low',
        status: 'pending',
        createdAt: thirtyMinAgo,
        progress: {
          jobId: 'job-climate-research',
          current: 0,
          total: 10000,
          percentage: 0,
          currentBatch: 0,
          totalBatches: 100,
          status: 'pending',
          tweetsCollected: 0,
          estimatedTimeRemaining: 180 * 60, // 3 hours
          errors: [],
          throughput: 0,
        },
        options: {
          includeReplies: false,
          includeRetweets: true,
        },
      },
      // Failed job - Suspended account monitoring
      {
        id: 'job-viral-content-tracker',
        type: 'search',
        query: 'viral content trends 2024',
        targetCount: 1500,
        campaignId: 'campaign-viral-analysis',
        priority: 'medium',
        status: 'failed',
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        startedAt: new Date(now.getTime() - 3.5 * 60 * 60 * 1000),
        progress: {
          jobId: 'job-viral-content-tracker',
          current: 423,
          total: 1500,
          percentage: 28.2,
          currentBatch: 5,
          totalBatches: 15,
          status: 'failed',
          tweetsCollected: 423,
          estimatedTimeRemaining: 0,
          errors: [
            'API quota exceeded at 12:45 PM',
            'Target account @viral_tracker suspended',
            'Rate limiting: 429 Too Many Requests',
            'Network timeout after 30 seconds',
          ],
          throughput: 0,
        },
        options: {
          includeReplies: true,
          includeRetweets: true,
        },
      },
      // Completed job - Sports event analysis
      {
        id: 'job-superbowl-analysis',
        type: 'hashtag',
        query: '#SuperBowl2024',
        targetCount: 8000,
        campaignId: 'campaign-sports-events',
        priority: 'high',
        status: 'completed',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        startedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000),
        completedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        progress: {
          jobId: 'job-superbowl-analysis',
          current: 8000,
          total: 8000,
          percentage: 100,
          currentBatch: 80,
          totalBatches: 80,
          status: 'completed',
          tweetsCollected: 8000,
          estimatedTimeRemaining: 0,
          errors: ['Minor rate limit warning at batch 35'],
          throughput: 12.7,
        },
        options: {
          includeReplies: false,
          includeRetweets: true,
        },
      },
      // Pending high-priority job - Breaking news monitoring
      {
        id: 'job-breaking-news-monitor',
        type: 'search',
        query: 'breaking news OR urgent OR alert',
        targetCount: 500,
        campaignId: 'campaign-news-monitoring',
        priority: 'urgent',
        status: 'pending',
        createdAt: new Date(now.getTime() - 5 * 60 * 1000),
        progress: {
          jobId: 'job-breaking-news-monitor',
          current: 0,
          total: 500,
          percentage: 0,
          currentBatch: 0,
          totalBatches: 5,
          status: 'pending',
          tweetsCollected: 0,
          estimatedTimeRemaining: 15 * 60, // 15 minutes
          errors: [],
          throughput: 0,
        },
        options: {
          includeReplies: true,
          includeRetweets: false,
        },
      },
    ];
  }

  /**
   * Cancel a job
   */
  public cancelJob(jobId: string): Observable<boolean> {
    // If offline mode or backend not available, handle cancellation locally
    if (environment.features.offlineMode || !this.websocketEnabled) {
      const jobs = this.jobsSubject.value;
      const jobIndex = jobs.findIndex((j) => j.id === jobId);

      if (jobIndex >= 0) {
        const updatedJobs = [...jobs];
        updatedJobs[jobIndex] = {
          ...updatedJobs[jobIndex],
          status: 'cancelled' as any,
          progress: {
            ...updatedJobs[jobIndex].progress,
            status: 'failed',
          },
        };

        this.jobsSubject.next(updatedJobs);
        this.updateMetrics(updatedJobs);

        this.snackBar.open(`Demo job ${jobId} cancelled`, 'Close', { duration: 3000 });
        return of(true);
      } else {
        this.snackBar.open(`Job ${jobId} not found`, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        return of(false);
      }
    }

    return this.http
      .post<{ success: boolean }>(`${this.API_BASE_URL}/job/${jobId}/cancel`, {})
      .pipe(
        map((response) => response.success),
        tap((success) => {
          if (success) {
            this.snackBar.open(`Job ${jobId} cancelled`, 'Close', { duration: 3000 });
            this.loadJobs(); // Refresh jobs list
          }
        }),
        catchError((error) => {
          console.error(`Failed to cancel job ${jobId}:`, error);
          this.websocketEnabled = false;
          this.connectionStatusSubject.next(false);

          this.snackBar.open(
            `Failed to cancel job: ${error.error?.message || error.message}`,
            'Close',
            {
              duration: 5000,
              panelClass: ['error-snackbar'],
            }
          );
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
      const jobs = this.getDemoJobs();
      const demoStats: ScrapingStats = {
        totalJobs: jobs.length,
        runningJobs: jobs.filter((j) => j.status === 'running').length,
        completedJobs: jobs.filter((j) => j.status === 'completed').length,
        failedJobs: jobs.filter((j) => j.status === 'failed').length,
        totalTweetsCollected: jobs.reduce((sum, job) => sum + job.progress.tweetsCollected, 0),
        averageProcessingTime: 127.3, // minutes - more realistic for large datasets
        systemLoad: 0.642, // 64.2% system load - typical for active scraping
      };

      this.statsSubject.next(demoStats);
      return of(demoStats);
    }

    return this.http.get<ScrapingStats>(`${this.API_BASE_URL}/stats`).pipe(
      tap((stats) => this.statsSubject.next(stats)),
      catchError((error) => {
        console.warn('Backend not available for stats, using demo data:', error.message);
        this.websocketEnabled = false;
        this.connectionStatusSubject.next(false);

        // Return demo stats when backend is not available
        const jobs = this.getDemoJobs();
        const demoStats: ScrapingStats = {
          totalJobs: jobs.length,
          runningJobs: jobs.filter((j) => j.status === 'running').length,
          completedJobs: jobs.filter((j) => j.status === 'completed').length,
          failedJobs: jobs.filter((j) => j.status === 'failed').length,
          totalTweetsCollected: jobs.reduce((sum, job) => sum + job.progress.tweetsCollected, 0),
          averageProcessingTime: 127.3, // minutes - more realistic for large datasets
          systemLoad: 0.642, // 64.2% system load - typical for active scraping
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
    const job = jobs.find((j) => j.id === jobId);

    if (job) {
      return of(job);
    }

    // If not in cache, try to fetch from API
    return this.getJobProgress(jobId).pipe(
      map((progress) => {
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
            includeRetweets: true,
          },
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
    const updatedJobs = jobs.map((job) =>
      job.id === progress.jobId ? { ...job, progress, status: progress.status } : job
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
    const updatedJobs = jobs.map((job) =>
      job.id === jobId ? { ...job, status: 'cancelled' as any } : job
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
      runningJobs: jobs.filter((j) => j.status === 'running').length,
      completedJobs: jobs.filter((j) => j.status === 'completed').length,
      failedJobs: jobs.filter((j) => j.status === 'failed').length,
      averageProgress:
        jobs.length > 0
          ? jobs.reduce((sum, job) => sum + job.progress.percentage, 0) / jobs.length
          : 0,
      totalTweetsCollected: jobs.reduce((sum, job) => sum + job.progress.tweetsCollected, 0),
      estimatedTimeRemaining: jobs
        .filter((j) => j.status === 'running' && j.progress.estimatedTimeRemaining)
        .reduce((sum, job) => sum + (job.progress.estimatedTimeRemaining || 0), 0),
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
   * Start progress simulation for running jobs in demo mode
   */
  private startProgressSimulation(): void {
    // Only run simulation in offline mode
    if (!environment.features.offlineMode) {
      return;
    }

    // Update progress every 15 seconds for running jobs
    timer(5000, 15000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.websocketEnabled) {
          this.simulateJobProgress();
        }
      });
  }

  /**
   * Simulate realistic progress for running jobs
   */
  private simulateJobProgress(): void {
    const currentJobs = this.jobsSubject.value;
    let hasUpdates = false;

    const updatedJobs = currentJobs.map((job) => {
      if (job.status === 'running' && job.progress.percentage < 100) {
        // Calculate realistic progress increment based on job priority and type
        let progressIncrement = this.calculateProgressIncrement(job);

        // Add some randomness to make it more realistic
        progressIncrement *= 0.8 + Math.random() * 0.4; // ±20% variation

        const newCurrent = Math.min(
          job.progress.total,
          job.progress.current + Math.floor(progressIncrement)
        );

        const newPercentage = Math.min(100, (newCurrent / job.progress.total) * 100);
        const newBatch = Math.floor(newCurrent / (job.progress.total / job.progress.totalBatches));

        // Calculate new estimated time remaining
        const remainingItems = job.progress.total - newCurrent;
        const averageRate =
          newCurrent / ((Date.now() - new Date(job.startedAt || job.createdAt).getTime()) / 1000);
        const estimatedTimeRemaining =
          remainingItems > 0 ? Math.floor(remainingItems / Math.max(averageRate, 0.1)) : 0;

        // Occasionally add minor errors for realism
        const errors = [...job.progress.errors];
        if (Math.random() < 0.05) {
          // 5% chance per update
          const errorMessages = [
            'Rate limit warning - reducing speed',
            'Temporary network latency detected',
            'API response delay on batch processing',
            'Minor timeout on data validation',
          ];
          errors.push(
            `${
              errorMessages[Math.floor(Math.random() * errorMessages.length)]
            } (${new Date().toLocaleTimeString()})`
          );

          // Keep only last 5 errors
          if (errors.length > 5) {
            errors.splice(0, errors.length - 5);
          }
        }

        const updatedProgress: JobProgress = {
          ...job.progress,
          current: newCurrent,
          percentage: newPercentage,
          currentBatch: newBatch,
          tweetsCollected: newCurrent,
          estimatedTimeRemaining,
          errors,
          throughput: averageRate,
        };

        // Check if job completed
        if (newPercentage >= 100) {
          hasUpdates = true;
          return {
            ...job,
            status: 'completed' as const,
            completedAt: new Date(),
            progress: {
              ...updatedProgress,
              status: 'completed' as const,
              percentage: 100,
              current: job.progress.total,
              tweetsCollected: job.progress.total,
              estimatedTimeRemaining: 0,
            },
          };
        }

        hasUpdates = true;
        return {
          ...job,
          progress: updatedProgress,
        };
      }

      return job;
    });

    if (hasUpdates) {
      this.jobsSubject.next(updatedJobs);
      this.updateMetrics(updatedJobs);
    }
  }

  /**
   * Calculate realistic progress increment based on job characteristics
   */
  private calculateProgressIncrement(job: ScrapingJob): number {
    let baseRate = 25; // Base tweets per update cycle

    // Adjust by priority
    switch (job.priority) {
      case 'urgent':
        baseRate *= 2.5;
        break;
      case 'high':
        baseRate *= 1.8;
        break;
      case 'medium':
        baseRate *= 1.0;
        break;
      case 'low':
        baseRate *= 0.6;
        break;
    }

    // Adjust by job type
    switch (job.type) {
      case 'hashtag':
        baseRate *= 1.2; // Hashtags are typically faster
        break;
      case 'user':
        baseRate *= 0.8; // User timelines slower due to rate limits
        break;
      case 'search':
        baseRate *= 1.0; // Standard rate
        break;
    }

    // Adjust by target count (larger jobs may be slower per item)
    if (job.targetCount > 5000) {
      baseRate *= 0.9;
    } else if (job.targetCount < 1000) {
      baseRate *= 1.1;
    }

    // Slow down as job progresses (realistic behavior)
    const progressRatio = job.progress.percentage / 100;
    if (progressRatio > 0.8) {
      baseRate *= 0.7; // Significantly slower in final 20%
    } else if (progressRatio > 0.6) {
      baseRate *= 0.85; // Moderately slower after 60%
    }

    return Math.max(1, baseRate); // Ensure minimum progress
  }

  /**
   * Get system health information
   */
  public getSystemHealth(): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/health`).pipe(
      catchError(error => {
        console.error('Failed to get system health:', error);
        return of({
          status: 'unknown',
          uptime: 0,
          memoryUsage: {},
          activeJobs: 0,
          queueLength: 0
        });
      })
    );
  }

  /**
   * Get queue statistics
   */
  public getQueueStats(): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/queue/stats`).pipe(
      catchError(error => {
        console.error('Failed to get queue stats:', error);
        return of({
          totalJobs: 0,
          pendingJobs: 0,
          activeJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          averageProcessingTime: 0
        });
      })
    );
  }

  /**
   * Get current connection status
   */
  public isConnected(): boolean {
    return this.connectionStatusSubject.value;
  }
}
