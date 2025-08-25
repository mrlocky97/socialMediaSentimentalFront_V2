// Material Design Standalone Imports
// Replace MaterialModule usage with this array

import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Complete Material Design imports for standalone components
 * Usage: Import this array in your standalone component's imports
 *
 * @example
 * ```typescript
 * import { MATERIAL_IMPORTS } from './material-imports';
 *
 * @Component({
 *   imports: [MATERIAL_IMPORTS, ...otherImports]
 * })
 * ```
 */
export const MATERIAL_IMPORTS = [
  // Form Controls
  MatButtonModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatSlideToggleModule,
  MatDatepickerModule,
  MatNativeDateModule,

  // Navigation
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  MatMenuModule,
  MatTabsModule,

  // Layout
  MatCardModule,
  MatGridListModule,
  MatExpansionModule,

  // Data Tables
  MatTableModule,
  MatSortModule,
  MatPaginatorModule,

  // Indicators
  MatProgressSpinnerModule,
  MatProgressBarModule,
  MatBadgeModule,
  MatChipsModule,

  // Popups & Modals
  MatSnackBarModule,
  MatDialogModule,
  MatTooltipModule,
] as const;

/**
 * Essential Material imports for basic components
 * Use this for components that only need basic Material functionality
 */
export const MATERIAL_BASIC = [
  MatButtonModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule,
  MatCardModule,
] as const;

/**
 * Form-specific Material imports
 * Use this for form-heavy components
 */
export const MATERIAL_FORMS = [
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatSlideToggleModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatButtonModule,
  MatIconModule,
] as const;

/**
 * Data table specific Material imports
 * Use this for components with tables
 */
export const MATERIAL_TABLES = [
  MatTableModule,
  MatSortModule,
  MatPaginatorModule,
  MatCheckboxModule,
  MatButtonModule,
  MatIconModule,
  MatProgressSpinnerModule,
  MatFormFieldModule,
  MatInputModule,
] as const;
