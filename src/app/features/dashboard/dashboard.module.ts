// src/app/shared/material.module.ts
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

@NgModule({
  imports: [
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule
  ],
  exports: [
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule
  ]
})
export class DashboardModule { }
