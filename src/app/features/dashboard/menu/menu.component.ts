import { Component, Output, EventEmitter } from '@angular/core';
import { MaterialModule } from '../../../shared/material/material.module';

@Component({
  selector: 'app-menu',
  imports: [MaterialModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  @Output() navigate = new EventEmitter<void>();
  onNavigate() {
    this.navigate.emit();
  }
}
