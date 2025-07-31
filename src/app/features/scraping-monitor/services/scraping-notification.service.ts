import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ScrapingNotification {
  id: string;
  campaignId: string;
  type: 'progress' | 'completion' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  updates?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ScrapingNotificationService {
  private notificationSubject = new Subject<ScrapingNotification>();
  private notifications: ScrapingNotification[] = [];

  constructor() {
    this.setupMockNotifications();
  }

  getNotifications(): Observable<ScrapingNotification> {
    return this.notificationSubject.asObservable();
  }

  getAllNotifications(): ScrapingNotification[] {
    return this.notifications;
  }

  showSuccess(message: string): void {
    console.log('SUCCESS:', message);
    this.addNotification({
      id: this.generateId(),
      campaignId: 'system',
      type: 'info',
      message,
      timestamp: new Date()
    });
  }

  showError(message: string): void {
    console.error('ERROR:', message);
    this.addNotification({
      id: this.generateId(),
      campaignId: 'system',
      type: 'error',
      message,
      timestamp: new Date()
    });
  }

  showWarning(message: string): void {
    console.warn('WARNING:', message);
    this.addNotification({
      id: this.generateId(),
      campaignId: 'system',
      type: 'warning',
      message,
      timestamp: new Date()
    });
  }

  showInfo(message: string): void {
    console.info('INFO:', message);
    this.addNotification({
      id: this.generateId(),
      campaignId: 'system',
      type: 'info',
      message,
      timestamp: new Date()
    });
  }

  private addNotification(notification: ScrapingNotification): void {
    this.notifications.unshift(notification);
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    this.notificationSubject.next(notification);
  }

  private setupMockNotifications(): void {
    // Simulate real-time notifications for development
    const mockCampaigns = ['camp_001', 'camp_002', 'camp_003', 'camp_004'];
    
    setInterval(() => {
      const campaignId = mockCampaigns[Math.floor(Math.random() * mockCampaigns.length)];
      const notificationType = this.getRandomNotificationType();
      
      const notification: ScrapingNotification = {
        id: this.generateId(),
        campaignId,
        type: notificationType,
        message: this.generateMockMessage(campaignId, notificationType),
        timestamp: new Date(),
        updates: this.generateMockUpdates(notificationType)
      };

      this.addNotification(notification);
    }, 10000); // Every 10 seconds
  }

  private getRandomNotificationType(): ScrapingNotification['type'] {
    const types: ScrapingNotification['type'][] = ['progress', 'completion', 'error', 'warning', 'info'];
    const weights = [0.5, 0.1, 0.1, 0.2, 0.1]; // Higher chance for progress updates
    
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < types.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        return types[i];
      }
    }
    
    return 'progress';
  }

  private generateMockMessage(campaignId: string, type: ScrapingNotification['type']): string {
    const campaignNames = {
      'camp_001': 'Summer Campaign 2025',
      'camp_002': 'Brand Awareness Q3',
      'camp_003': 'Product Launch Monitor',
      'camp_004': 'Crisis Monitoring'
    };

    const campaignName = campaignNames[campaignId as keyof typeof campaignNames] || 'Unknown Campaign';

    switch (type) {
      case 'progress':
        const progress = Math.floor(Math.random() * 100);
        return `${campaignName}: ${progress}% complete, ${Math.floor(Math.random() * 500)} tweets collected`;
      
      case 'completion':
        return `${campaignName}: Collection completed successfully`;
      
      case 'error':
        const errors = ['API rate limit exceeded', 'Network timeout', 'Authentication failed', 'Parsing error'];
        const error = errors[Math.floor(Math.random() * errors.length)];
        return `${campaignName}: Error - ${error}`;
      
      case 'warning':
        const warnings = ['High error rate detected', 'Slow collection speed', 'Low tweet volume', 'API quota almost reached'];
        const warning = warnings[Math.floor(Math.random() * warnings.length)];
        return `${campaignName}: Warning - ${warning}`;
      
      case 'info':
        const infos = ['Collection started', 'Switched to backup API', 'Sentiment analysis enabled', 'Data export ready'];
        const info = infos[Math.floor(Math.random() * infos.length)];
        return `${campaignName}: ${info}`;
      
      default:
        return `${campaignName}: Status update`;
    }
  }

  private generateMockUpdates(type: ScrapingNotification['type']): any {
    switch (type) {
      case 'progress':
        return {
          progress: {
            percentage: Math.floor(Math.random() * 100),
            completed: Math.floor(Math.random() * 1000)
          },
          metrics: {
            tweetsCollected: Math.floor(Math.random() * 1000),
            apiCallsUsed: Math.floor(Math.random() * 2000)
          }
        };
      
      case 'completion':
        return {
          status: 'completed',
          progress: { percentage: 100 }
        };
      
      case 'error':
        return {
          status: 'error',
          metrics: {
            errorsEncountered: Math.floor(Math.random() * 20) + 5
          }
        };
      
      default:
        return {};
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Notification management
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      (notification as any).read = true;
    }
  }

  clearNotifications(): void {
    this.notifications = [];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !(n as any).read).length;
  }

  getCampaignNotifications(campaignId: string): ScrapingNotification[] {
    return this.notifications.filter(n => n.campaignId === campaignId);
  }

  getNotificationsByType(type: ScrapingNotification['type']): ScrapingNotification[] {
    return this.notifications.filter(n => n.type === type);
  }
}
