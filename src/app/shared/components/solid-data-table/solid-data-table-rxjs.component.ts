/**
 * SOLID Generic Data Table Component with Advanced RxJS Integration
 * Demonstrates SOLID principles with reactive programming patterns
 * 
 * S - Single Responsibility: Only handles table display and basic interactions
 * O - Open/Closed: Extensible through configuration and templates
 * L - Liskov Substitution: Can work with any data type through generics
 * I - Interface Segregation: Uses specific interfaces for different concerns
 * D - Dependency Inversion: Depends on abstractions, not concretions
 */
import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ViewChild, 
  AfterViewInit,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ContentChild,
  computed,
  signal,
  inject,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { 
  Observable,
  combineLatest,
  timer,
  of
} from 'rxjs';
import {
  map,
  switchMap,
  tap,
  debounceTime,
  distinctUntilChanged,
  startWith,
  filter
} from 'rxjs/operators';
import { 
  TableColumn, 
  TableConfig, 
  TableAction, 
  SortEvent, 
  SelectionEvent,
  FilterEvent,
  TableState,
  TableDataService,
  TableSelectionService
} from './table-services';

// Open/Closed Principle - Extensible through configuration
@Component({
  selector: 'app-solid-data-table-rxjs',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  providers: [
    TableDataService,
    TableSelectionService
  ],
  template: `
    <div class="table-container">
      <!-- Table Header with Controls -->
      <div class="table-header" *ngIf="config.showSearch || hasFilters()">
        <div class="search-controls">
          <mat-form-field appearance="outline" *ngIf="config.showSearch">
            <mat-label>Search</mat-label>
            <input matInput 
                   [value]="currentSearchTerm()"
                   (input)="onSearchChange($event)"
                   placeholder="Search in table...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          
          <button mat-button 
                  *ngIf="hasFilters()"
                  (click)="clearAllFilters()"
                  color="warn">
            <mat-icon>clear</mat-icon>
            Clear Filters
          </button>
        </div>

        <!-- Table Stats -->
        <div class="table-stats">
          <span class="item-count">
            {{ filteredItemCount() }} of {{ totalItemCount() }} items
          </span>
          <span class="selection-count" *ngIf="hasSelection()">
            ({{ getSelectionCount() }} selected)
          </span>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div class="loading-container" *ngIf="isLoading()">
        <mat-spinner diameter="40"></mat-spinner>
        <span>Loading...</span>
      </div>

      <!-- Error Display -->
      <div class="error-container" *ngIf="hasError()" class="error-message">
        <mat-icon color="warn">error</mat-icon>
        <span>{{ errorMessage() }}</span>
        <button mat-button (click)="refreshData()" color="primary">
          <mat-icon>refresh</mat-icon>
          Retry
        </button>
      </div>

      <!-- Data Table -->
      <div class="table-wrapper" *ngIf="!isLoading() && !hasError()">
        <table mat-table 
               [dataSource]="getDataSource()" 
               matSort
               (matSortChange)="onSortChange($event)"
               class="full-width">

          <!-- Selection Column -->
          <ng-container matColumnDef="select" *ngIf="config.showSelection">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox 
                *ngIf="config.multiSelection"
                [checked]="isAllSelected()"
                [indeterminate]="isPartiallySelected()"
                (change)="toggleAllSelection()">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let row">
              <mat-checkbox 
                [checked]="isRowSelected(row)"
                (click)="$event.stopPropagation()"
                (change)="toggleRowSelection(row)">
              </mat-checkbox>
            </td>
          </ng-container>

          <!-- Dynamic Data Columns -->
          <ng-container *ngFor="let column of columns" [matColumnDef]="column.key">
            <th mat-header-cell 
                *matHeaderCellDef 
                [mat-sort-header]="column.sortable !== false ? column.key : ''"
                [style.width]="column.width"
                [style.text-align]="column.align || 'left'">
              {{ column.label }}
            </th>
            <td mat-cell 
                *matCellDef="let element" 
                [style.text-align]="column.align || 'left'"
                (click)="onRowClick(element)">
              {{ getFormattedValue(element, column) }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions" *ngIf="actions.length > 0">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let element">
              <button mat-icon-button 
                      *ngFor="let action of getVisibleActions(element)"
                      [disabled]="isActionDisabled(action, element)"
                      [color]="action.color"
                      [title]="action.label"
                      (click)="$event.stopPropagation(); executeAction(action, element)">
                <mat-icon>{{ action.icon }}</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
          <tr mat-row 
              *matRowDef="let row; columns: displayedColumns();"
              [class.selected]="isRowSelected(row)"
              (click)="onRowClick(row)">
          </tr>
        </table>

        <!-- Paginator -->
        <mat-paginator 
          *ngIf="config.showPagination"
          [length]="totalItemCount()"
          [pageSize]="config.pageSize || 10"
          [pageSizeOptions]="config.pageSizeOptions || [5, 10, 25, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </div>

      <!-- Selection Actions Bar -->
      <div class="selection-actions" *ngIf="hasSelection()">
        <span>{{ getSelectionCount() }} items selected</span>
        <button mat-button (click)="clearSelection()">Clear Selection</button>
        <button mat-raised-button color="primary" (click)="exportData()">
          <mat-icon>download</mat-icon>
          Export Selected
        </button>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .search-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .table-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }

    .loading-container, .error-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 32px;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .full-width {
      width: 100%;
    }

    tr.mat-row:hover {
      background-color: #f5f5f5;
    }

    tr.selected {
      background-color: #e3f2fd;
    }

    .selection-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background-color: #f0f0f0;
      border-radius: 4px;
    }

    .error-message {
      color: #f44336;
    }
  `]
})
export class SolidDataTableRxjsComponent<T = any> implements OnInit, AfterViewInit, OnChanges {
  // Dependency Injection - Services provided at component level
  private readonly dataService = inject(TableDataService<T>);
  private readonly selectionService = inject(TableSelectionService<T>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // INPUT/OUTPUT PROPERTIES
  // ================================

  @Input() data: T[] = [];
  @Input() columns: TableColumn<T>[] = [];
  @Input() config: TableConfig = {
    showSearch: true,
    showPagination: true,
    showSelection: false,
    multiSelection: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
    autoRefresh: false,
    refreshInterval: 30000
  };
  @Input() actions: TableAction<T>[] = [];
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  // Output Events - Loose coupling with parent components
  @Output() rowClick = new EventEmitter<T>();
  @Output() actionClick = new EventEmitter<{ action: TableAction<T>, item: T }>();
  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() selectionChange = new EventEmitter<SelectionEvent<T>>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() filterChange = new EventEmitter<FilterEvent>();
  @Output() stateChange = new EventEmitter<Partial<TableState<T>>>();

  // Template References - Open/Closed for custom templates
  @ContentChild('cellTemplate') cellTemplate?: TemplateRef<any>;

  // View Children
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ================================
  // REACTIVE STATE WITH SIGNALS
  // ================================
  
  currentSearchTerm = signal<string>('');
  activeFilters = signal<Map<string, any>>(new Map());
  isRefreshing = signal<boolean>(false);
  lastRefreshTime = signal<Date | null>(null);

  // ================================
  // REACTIVE STREAMS
  // ================================

  // Table state stream combining all reactive data
  readonly tableState$: Observable<Partial<TableState<T>>> = this.dataService.getTableState().pipe(
    tap(state => {
      if (state) {
        this.stateChange.emit(state);
      }
    })
  );

  // Selection change stream
  readonly selectionChanges$ = this.selectionService.getSelectionChange().pipe(
    tap(selection => {
      this.selectionChange.emit(selection);
    })
  );

  // Auto-refresh stream (if enabled)
  readonly autoRefresh$ = timer(0, this.config.refreshInterval || 30000).pipe(
    filter(() => !!this.config.autoRefresh),
    tap(() => {
      this.isRefreshing.set(true);
      this.refreshData();
    })
  );

  // ================================
  // COMPUTED PROPERTIES
  // ================================
  
  readonly displayedColumns = computed(() => {
    const cols: string[] = [];
    
    if (this.config.showSelection) cols.push('select');
    cols.push(...this.columns.map(col => col.key));
    if (this.actions && this.actions.length > 0) cols.push('actions');
    
    return cols;
  });

  readonly isLoading = computed(() => 
    this.loading || this.dataService.isLoading() || this.isRefreshing()
  );

  readonly hasError = computed(() => 
    !!this.error || !!this.dataService.error()
  );

  readonly errorMessage = computed(() => 
    this.error || this.dataService.error() || 'Unknown error'
  );

  readonly hasFilters = computed(() => 
    this.currentSearchTerm().length > 0 || this.activeFilters().size > 0
  );

  readonly filteredItemCount = computed(() => 
    this.dataService.filteredData().length
  );

  readonly totalItemCount = computed(() => 
    this.data.length
  );

  ngOnInit(): void {
    this.initializeReactiveStreams();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataService.connectPaginator(this.paginator);
    }
    if (this.sort) {
      this.dataService.connectSort(this.sort);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataService.setData(this.data);
      this.lastRefreshTime.set(new Date());
    }
    
    if (changes['config'] && this.config.showSelection) {
      this.selectionService.initializeSelection(this.config.multiSelection);
    }

    if (changes['loading']) {
      this.dataService.setLoading(this.loading);
    }

    if (changes['error']) {
      this.dataService.setError(this.error);
    }
  }

  // ================================
  // PUBLIC METHODS
  // ================================

  // Data source access
  getDataSource(): MatTableDataSource<T> {
    return this.dataService.dataSource();
  }

  // Selection methods
  getSelectionCount(): number {
    return this.selectionService.getSelectionCount();
  }

  isRowSelected(row: T): boolean {
    return this.selectionService.isSelected(row);
  }

  getSelectedItems(): T[] {
    return this.selectionService.getSelected();
  }

  // Utility methods
  getColumnValue(element: T, key: string): any {
    return (element as any)[key];
  }

  getFormattedValue(element: T, column: TableColumn<T>): string {
    const value = this.getColumnValue(element, column.key);
    return column.formatter ? column.formatter(value) : String(value);
  }

  // ================================
  // EVENT HANDLERS
  // ================================

  // Search and filtering
  onSearchChange(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.currentSearchTerm.set(filterValue);
    this.dataService.applyFilter(filterValue);
  }

  clearAllFilters(): void {
    this.currentSearchTerm.set('');
    this.activeFilters.set(new Map());
    this.dataService.clearFilters();
  }

  // Row interactions
  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  onSortChange(sort: Sort): void {
    this.dataService.applySorting(sort);
    this.sortChange.emit({
      active: sort.active,
      direction: sort.direction
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  // Selection methods
  toggleRowSelection(row: T): void {
    this.selectionService.toggleItem(row);
  }

  toggleAllSelection(): void {
    this.selectionService.toggleAll(this.dataService.filteredData());
  }

  isAllSelected(): boolean {
    return this.selectionService.isAllSelected(this.dataService.filteredData().length);
  }

  isPartiallySelected(): boolean {
    return this.selectionService.isPartiallySelected(this.dataService.filteredData().length);
  }

  hasSelection(): boolean {
    return this.selectionService.getSelectionCount() > 0;
  }

  clearSelection(): void {
    this.selectionService.clear();
  }

  // Action methods
  getVisibleActions(item: T): TableAction<T>[] {
    return this.actions.filter(action => 
      !action.visible || action.visible(item)
    );
  }

  isActionDisabled(action: TableAction<T>, item: T): boolean {
    return action.disabled ? action.disabled(item) : false;
  }

  executeAction(action: TableAction<T>, item: T): void {
    if (action.confirm) {
      const confirmed = confirm(`Are you sure you want to ${action.label.toLowerCase()}?`);
      if (!confirmed) return;
    }

    this.actionClick.emit({ action, item });
  }

  // Utility methods
  refreshData(): void {
    this.isRefreshing.set(true);
    this.dataService.refreshData();
    
    // Simulate async refresh completion
    setTimeout(() => {
      this.isRefreshing.set(false);
      this.lastRefreshTime.set(new Date());
    }, 1000);
  }

  exportData(): void {
    const data = this.hasSelection() 
      ? this.getSelectedItems()
      : this.dataService.filteredData();
    
    console.log('Exporting data:', data);
    this.snackBar.open('Data export started', 'Close', { duration: 3000 });
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private initializeReactiveStreams(): void {
    // Subscribe to table state changes
    this.tableState$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    // Subscribe to selection changes
    this.selectionChanges$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    // Subscribe to auto-refresh (if enabled)
    if (this.config.autoRefresh) {
      this.autoRefresh$.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
    }
  }
}
