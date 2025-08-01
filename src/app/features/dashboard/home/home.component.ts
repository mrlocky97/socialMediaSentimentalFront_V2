import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_BASIC } from '../../../shared/material/material-imports';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ...MATERIAL_BASIC
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
