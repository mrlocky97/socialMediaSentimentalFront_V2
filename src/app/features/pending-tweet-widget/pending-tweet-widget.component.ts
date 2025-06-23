import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { PendingTweetService } from './services/pending-tweet-widget.service';
import { TranslocoRootModule } from '../../transloco-loader';
import { TranslocoModule } from '@ngneat/transloco';
import { MaterialModule } from '../../shared/material/material.module';

@Component({
  selector: 'app-pending-tweet-widget',
  standalone: true,
  imports: [
    CommonModule, 
    TranslocoRootModule,
    TranslocoModule,
    MaterialModule
  ],
  templateUrl: './pending-tweet-widget.component.html',
  styleUrls: ['./pending-tweet-widget.component.css']
})
export class PendingTweetWidgetComponent {
  pending = signal<number | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private pendingTweetService: PendingTweetService) {
    this.pendingTweetService.loadPending();
  }

  pendingTweets(){
    return this.pendingTweetService.loadPending();
  }
}
