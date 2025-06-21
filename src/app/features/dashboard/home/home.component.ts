import { Component } from '@angular/core';
import { DashboardModule } from '../dashboard.module';

@Component({
  selector: 'app-home',
  imports: [
    DashboardModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
