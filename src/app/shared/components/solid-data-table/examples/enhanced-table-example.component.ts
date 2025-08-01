import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolidDataTableComponent } from '../solid-data-table.component';
import { TableColumn, TableConfig, TableAction } from '../table-services';

interface Campaign {
  id: number;
  name: string;
  status: 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate: Date;
  budget: number;
  clicks: number;
  impressions: number;
}

@Component({
  selector: 'app-campaign-table-example',
  standalone: true,
  imports: [CommonModule, SolidDataTableComponent],
  template: `
    <div class="example-container">
      <h2>🚀 Enhanced SOLID Data Table with RxJS</h2>
      <p>This example demonstrates all the reactive features implemented:</p>
      
      <!-- Features List -->
      <div class="features-list">
        <h3>✨ Reactive Features:</h3>
        <ul>
          <li>🔍 <strong>Debounced Search</strong> - No API spam (300ms delay)</li>
          <li>🔄 <strong>Real-time Auto-refresh</strong> - Updates every 30 seconds</li>
          <li>📊 <strong>Smart Statistics</strong> - Live item counts and selection info</li>
          <li>💾 <strong>Selection Management</strong> - Reactive multi-select with export</li>
          <li>⚡ <strong>Performance</strong> - Optimized with shareReplay and distinctUntilChanged</li>
          <li>🛡️ <strong>Error Handling</strong> - Automatic retry with user feedback</li>
          <li>📱 <strong>Responsive Design</strong> - Works on all screen sizes</li>
        </ul>
      </div>

      <!-- Controls -->
      <div class="controls">
        <button (click)="addRandomCampaign()" 
                class="add-btn">
          ➕ Add Random Campaign
        </button>
        
        <button (click)="toggleAutoRefresh()" 
                [class.active]="config().autoRefresh"
                class="toggle-btn">
          {{ config().autoRefresh ? '⏸️ Disable' : '▶️ Enable' }} Auto-refresh
        </button>
        
        <button (click)="simulateError()" 
                class="error-btn">
          ⚠️ Simulate Error
        </button>
        
        <button (click)="clearError()" 
                class="clear-btn">
          ✅ Clear Error
        </button>
      </div>

      <!-- Enhanced Data Table -->
      <app-solid-data-table
        [data]="campaigns()"
        [columns]="columns"
        [config]="config()"
        [actions]="actions"
        [loading]="loading()"
        [error]="error()"
        (rowClick)="onRowClick($event)"
        (actionClick)="onActionClick($event)"
        (selectionChange)="onSelectionChange($event)"
        (sortChange)="onSortChange($event)"
        (filterChange)="onFilterChange($event)"
        (stateChange)="onStateChange($event)">
      </app-solid-data-table>

      <!-- Event Log -->
      <div class="event-log">
        <h3>📋 Event Log (Last 5 events):</h3>
        <div class="log-entries">
          @for (event of eventLog(); track event.timestamp) {
            <div class="log-entry" [class]="event.type">
              <span class="timestamp">{{ event.timestamp | date:'HH:mm:ss' }}</span>
              <span class="type">{{ event.type.toUpperCase() }}</span>
              <span class="message">{{ event.message }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .example-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .features-list {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
    }

    .features-list h3 {
      margin-top: 0;
      color: #fff;
    }

    .features-list ul {
      list-style: none;
      padding: 0;
    }

    .features-list li {
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }

    .controls {
      display: flex;
      gap: 12px;
      margin: 20px 0;
      flex-wrap: wrap;
    }

    .controls button {
      padding: 12px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .add-btn {
      background: #4caf50;
      color: white;
    }

    .toggle-btn {
      background: #2196f3;
      color: white;
    }

    .toggle-btn.active {
      background: #ff9800;
    }

    .error-btn {
      background: #f44336;
      color: white;
    }

    .clear-btn {
      background: #9e9e9e;
      color: white;
    }

    .controls button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .event-log {
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .log-entries {
      max-height: 200px;
      overflow-y: auto;
    }

    .log-entry {
      display: flex;
      gap: 12px;
      padding: 8px 12px;
      margin: 4px 0;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }

    .log-entry.info {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
    }

    .log-entry.success {
      background: #e8f5e8;
      border-left: 4px solid #4caf50;
    }

    .log-entry.warning {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
    }

    .log-entry.error {
      background: #ffebee;
      border-left: 4px solid #f44336;
    }

    .timestamp {
      color: #666;
      min-width: 60px;
    }

    .type {
      font-weight: bold;
      min-width: 80px;
    }

    .message {
      flex: 1;
    }

    h2 {
      background: linear-gradient(45deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 2em;
      text-align: center;
      margin-bottom: 10px;
    }
  `]
})
export class CampaignTableExampleComponent {
  // Reactive state with signals
  campaigns = signal<Campaign[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  config = signal<TableConfig>({
    showSearch: true,
    showPagination: true,
    showSelection: true,
    multiSelection: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
    autoRefresh: true,
    refreshInterval: 30000
  });

  eventLog = signal<Array<{
    timestamp: Date;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
  }>>([]);

  // Table configuration
  columns: TableColumn<Campaign>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      width: '80px',
      align: 'center'
    },
    {
      key: 'name',
      label: 'Campaign Name',
      sortable: true,
      formatter: (value: string) => value.toUpperCase()
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      formatter: (value: string) => {
        const statusMap = {
          'active': '🟢 Active',
          'paused': '🟡 Paused',
          'completed': '🔴 Completed'
        };
        return statusMap[value as keyof typeof statusMap] || value;
      }
    },
    {
      key: 'startDate',
      label: 'Start Date',
      sortable: true,
      formatter: (value: Date) => new Date(value).toLocaleDateString()
    },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      align: 'right',
      formatter: (value: number) => `$${value.toLocaleString()}`
    },
    {
      key: 'clicks',
      label: 'Clicks',
      sortable: true,
      align: 'center'
    },
    {
      key: 'impressions',
      label: 'Impressions',
      sortable: true,
      align: 'center',
      formatter: (value: number) => value.toLocaleString()
    }
  ];

  actions: TableAction<Campaign>[] = [
    {
      icon: 'edit',
      label: 'Edit Campaign',
      color: 'primary'
    },
    {
      icon: 'pause',
      label: 'Pause Campaign',
      color: 'accent',
      visible: (campaign: Campaign) => campaign.status === 'active'
    },
    {
      icon: 'play_arrow',
      label: 'Resume Campaign',
      color: 'primary',
      visible: (campaign: Campaign) => campaign.status === 'paused'
    },
    {
      icon: 'delete',
      label: 'Delete Campaign',
      color: 'warn',
      confirm: true,
      disabled: (campaign: Campaign) => campaign.status === 'active'
    }
  ];

  constructor() {
    // Initialize with sample data
    this.generateSampleData();
    this.logEvent('info', 'Table initialized with sample data');
  }

  // Event handlers
  onRowClick(campaign: Campaign): void {
    this.logEvent('info', `Row clicked: ${campaign.name}`);
  }

  onActionClick(event: { action: TableAction<Campaign>, item: Campaign }): void {
    const { action, item } = event;
    this.logEvent('success', `Action "${action.label}" executed on: ${item.name}`);
    
    // Simulate action execution
    if (action.icon === 'delete') {
      this.campaigns.update(campaigns => 
        campaigns.filter(c => c.id !== item.id)
      );
    } else if (action.icon === 'pause') {
      this.campaigns.update(campaigns =>
        campaigns.map(c => c.id === item.id ? { ...c, status: 'paused' as const } : c)
      );
    } else if (action.icon === 'play_arrow') {
      this.campaigns.update(campaigns =>
        campaigns.map(c => c.id === item.id ? { ...c, status: 'active' as const } : c)
      );
    }
  }

  onSelectionChange(event: any): void {
    this.logEvent('info', `Selection changed: ${event.selected.length} items selected`);
  }

  onSortChange(event: any): void {
    this.logEvent('info', `Sort changed: ${event.active} ${event.direction}`);
  }

  onFilterChange(event: any): void {
    this.logEvent('info', `Filter applied: ${event.column} = "${event.value}"`);
  }

  onStateChange(event: any): void {
    this.logEvent('info', `Table state updated: ${event.filteredData?.length || 0} filtered items`);
  }

  // Control methods
  addRandomCampaign(): void {
    const newCampaign: Campaign = {
      id: Math.max(...this.campaigns().map(c => c.id), 0) + 1,
      name: `Campaign ${Date.now()}`,
      status: ['active', 'paused', 'completed'][Math.floor(Math.random() * 3)] as any,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budget: Math.floor(Math.random() * 50000) + 1000,
      clicks: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 100000)
    };

    this.campaigns.update(campaigns => [...campaigns, newCampaign]);
    this.logEvent('success', `Added new campaign: ${newCampaign.name}`);
  }

  toggleAutoRefresh(): void {
    this.config.update(config => ({
      ...config,
      autoRefresh: !config.autoRefresh
    }));
    
    const status = this.config().autoRefresh ? 'enabled' : 'disabled';
    this.logEvent('info', `Auto-refresh ${status}`);
  }

  simulateError(): void {
    this.error.set('Simulated network error - API temporarily unavailable');
    this.logEvent('error', 'Error simulated: API temporarily unavailable');
  }

  clearError(): void {
    this.error.set(null);
    this.logEvent('success', 'Error cleared');
  }

  private generateSampleData(): void {
    const sampleCampaigns: Campaign[] = [
      {
        id: 1,
        name: 'Summer Sale 2024',
        status: 'active',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        budget: 25000,
        clicks: 1250,
        impressions: 45000
      },
      {
        id: 2,
        name: 'Back to School',
        status: 'paused',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-09-15'),
        budget: 15000,
        clicks: 890,
        impressions: 32000
      },
      {
        id: 3,
        name: 'Holiday Special',
        status: 'completed',
        startDate: new Date('2023-11-01'),
        endDate: new Date('2023-12-31'),
        budget: 50000,
        clicks: 3200,
        impressions: 125000
      },
      {
        id: 4,
        name: 'New Product Launch',
        status: 'active',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-10-15'),
        budget: 35000,
        clicks: 2100,
        impressions: 78000
      },
      {
        id: 5,
        name: 'Brand Awareness',
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        budget: 100000,
        clicks: 8750,
        impressions: 350000
      }
    ];

    this.campaigns.set(sampleCampaigns);
  }

  private logEvent(type: 'info' | 'success' | 'warning' | 'error', message: string): void {
    this.eventLog.update(log => {
      const newEvent = {
        timestamp: new Date(),
        type,
        message
      };
      
      // Keep only last 5 events
      const newLog = [newEvent, ...log].slice(0, 5);
      return newLog;
    });
  }
}
