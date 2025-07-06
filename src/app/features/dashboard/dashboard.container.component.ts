import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PendingTweetWidgetComponent } from '../pending-tweet-widget/pending-tweet-widget.component';
import { MaterialModule } from '../../shared/material/material.module';

@Component({
  selector: 'app-dashboard.container',
  standalone: true,
  imports: [CommonModule, PendingTweetWidgetComponent, MaterialModule],
  templateUrl: './dashboard.container.component.html',
  styleUrl: './dashboard.container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush // Use OnPush change detection strategy for better performance
})
export class DashboardContainerComponent {
  showFiller = false;
  isDesktop = true; // Default to true for desktop view
}
