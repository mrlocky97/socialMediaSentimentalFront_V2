import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignWizardComponent } from './campaign-wizard.component';

@Component({
  selector: 'app-campaign-wizard-example',
  standalone: true,
  imports: [
    CommonModule,
    CampaignWizardComponent
  ],
  template: `
    <div class="campaign-wizard-page">
      <app-campaign-wizard></app-campaign-wizard>
    </div>
  `,
  styles: [`
    .campaign-wizard-page {
      min-height: 100vh;
      background: #fafafa;
    }
  `]
})
export class CampaignWizardExampleComponent {
  constructor() {
    console.log('Campaign Wizard Example loaded');
  }
}
