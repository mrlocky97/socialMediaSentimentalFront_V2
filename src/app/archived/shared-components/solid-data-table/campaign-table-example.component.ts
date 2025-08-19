/**
 * Example usage of the SOLID Data Table Component
 * Demonstrates how to use the generic table with campaign data
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolidDataTableComponent } from './solid-data-table.component';
import { 
  TableColumn,
  TableConfig,
  TableAction,
  SortEvent,
  SelectionEvent
} from './table-services';
import { Campaign } from '../../../core/state/app.state';

@Component({
  selector: 'app-campaign-table-example',
  standalone: true,
  imports: [
    CommonModule,
    SolidDataTableComponent
  ],
  template: `
    <div class="example-container">
      <h2>Campaign Management Table</h2>
      
      <app-solid-data-table
        [data]="campaigns"
        [columns]="columns"
        [config]="tableConfig"
        [actions]="actions"
        (rowClick)="onRowClick($event)"
        (actionClick)="onActionClick($event)"
        (sortChange)="onSortChange($event)"
        (selectionChange)="onSelectionChange($event)">
        
        <!-- Custom cell template example -->
        <ng-template #cellTemplate let-element let-column="column" let-value="value">
          @if (column.key === 'status') {
            <span [class]="'status-' + value" class="status-badge">
              {{ value | titlecase }}
            </span>
          } @else if (column.key === 'startDate') {
            {{ value | date:'MMM dd, yyyy' }}
          } @else {
            {{ value }}
          }
        </ng-template>
      </app-solid-data-table>
      
      <!-- Selection info -->
      @if (selectedCampaigns.length > 0) {
        <div class="selection-info">
          <h3>Selected Campaigns ({{ selectedCampaigns.length }})</h3>
          <ul>
            @for (campaign of selectedCampaigns; track campaign.id) {
              <li>{{ campaign.name }} - {{ campaign.status }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: [`
    .example-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .selection-info {
      margin-top: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }
    
    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .status-active {
      background-color: #e8f5e8;
      color: #2e7d32;
    }
    
    .status-inactive {
      background-color: #fff3e0;
      color: #f57c00;
    }
    
    .status-completed {
      background-color: #e3f2fd;
      color: #1976d2;
    }
  `]
})
export class CampaignTableExampleComponent implements OnInit {
  campaigns: Campaign[] = [];
  selectedCampaigns: Campaign[] = [];

  // Table configuration
  columns: TableColumn<Campaign>[] = [
    { key: 'name', label: 'Campaign Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'startDate', label: 'Start Date', sortable: true },
    { key: 'endDate', label: 'End Date', sortable: true },
    { key: 'maxTweets', label: 'Max Tweets', sortable: true, align: 'right' }
  ];

  tableConfig: TableConfig = {
    showSearch: true,
    showPagination: true,
    showSelection: true,
    multiSelection: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50]
  };

  actions: TableAction<Campaign>[] = [
    {
      icon: 'edit',
      label: 'Edit',
      color: 'primary',
      visible: (campaign) => campaign.status !== 'completed'
    },
    {
      icon: 'play_arrow',
      label: 'Start',
      color: 'primary',
      visible: (campaign) => campaign.status === 'inactive',
      disabled: (campaign) => new Date(campaign.startDate) > new Date()
    },
    {
      icon: 'stop',
      label: 'Stop',
      color: 'warn',
      visible: (campaign) => campaign.status === 'active'
    },
    {
      icon: 'delete',
      label: 'Delete',
      color: 'warn',
      visible: (campaign) => campaign.status !== 'active'
    }
  ];

  ngOnInit(): void {
    this.loadSampleData();
  }

  // Event handlers
  onRowClick(campaign: Campaign): void {
    console.log('Row clicked:', campaign);
    // Navigate to campaign detail or show modal
  }

  onActionClick(event: { action: TableAction<Campaign>, item: Campaign }): void {
    console.log('Action clicked:', event.action.label, 'on', event.item.name);
    
    switch (event.action.label) {
      case 'Edit':
        this.editCampaign(event.item);
        break;
      case 'Start':
        this.startCampaign(event.item);
        break;
      case 'Stop':
        this.stopCampaign(event.item);
        break;
      case 'Delete':
        this.deleteCampaign(event.item);
        break;
    }
  }

  onSortChange(sortEvent: SortEvent): void {
    console.log('Sort changed:', sortEvent);
    // Implement server-side sorting if needed
  }

  onSelectionChange(selectionEvent: SelectionEvent<Campaign>): void {
    this.selectedCampaigns = selectionEvent.selected;
    console.log('Selection changed:', selectionEvent);
  }

  // Action implementations
  private editCampaign(campaign: Campaign): void {
    console.log('Editing campaign:', campaign.name);
    // Implement edit logic
  }

  private startCampaign(campaign: Campaign): void {
    console.log('Starting campaign:', campaign.name);
    // Implement start logic
    campaign.status = 'active';
  }

  private stopCampaign(campaign: Campaign): void {
    console.log('Stopping campaign:', campaign.name);
    // Implement stop logic
    campaign.status = 'inactive';
  }

  private deleteCampaign(campaign: Campaign): void {
    console.log('Deleting campaign:', campaign.name);
    // Implement delete logic
    this.campaigns = this.campaigns.filter(c => c.id !== campaign.id);
  }

  // Sample data
  private loadSampleData(): void {
    this.campaigns = [
      {
        id: '1',
        name: 'Summer Campaign 2025',
        description: 'Marketing campaign for summer products',
        type: 'hashtag',
        status: 'active',
        hashtags: ['#summer', '#products'],
        keywords: ['summer', 'vacation'],
        mentions: [],
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-08-31'),
        maxTweets: 1000,
        sentimentAnalysis: true,
        organizationId: 'org1',
        createdBy: 'user_001',
        createdAt: new Date('2025-05-01'),
        updatedAt: new Date('2025-05-15')
      },
      {
        id: '2',
        name: 'Brand Awareness Q3',
        description: 'Increase brand awareness in Q3',
        type: 'keyword',
        status: 'inactive',
        hashtags: [],
        keywords: ['brand', 'awareness'],
        mentions: ['@ourcompany'],
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-09-30'),
        maxTweets: 500,
        sentimentAnalysis: true,
        organizationId: 'org1',
        createdBy: 'user_002',
        createdAt: new Date('2025-06-01'),
        updatedAt: new Date('2025-06-10')
      },
      {
        id: '3',
        name: 'Product Launch Monitor',
        description: 'Monitor sentiment for new product launch',
        type: 'user',
        status: 'completed',
        hashtags: ['#newproduct'],
        keywords: ['launch', 'product'],
        mentions: [],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
        maxTweets: 2000,
        sentimentAnalysis: true,
        organizationId: 'org1',
        createdBy: 'user_003',
        createdAt: new Date('2024-12-15'),
        updatedAt: new Date('2025-01-05')
      }
    ];
  }
}
