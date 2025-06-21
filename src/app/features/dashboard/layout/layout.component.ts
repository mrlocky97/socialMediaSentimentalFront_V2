import { Component } from '@angular/core';
import { DashboardModule } from '../dashboard.module';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [
    DashboardModule,
    RouterOutlet
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {

}
