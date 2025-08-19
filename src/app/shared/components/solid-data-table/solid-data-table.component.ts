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
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ContentChild,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  Observable,
  of
} from 'rxjs';
import {
  filter,
  tap
} from 'rxjs/operators';
import {
  FilterEvent,
  SelectionEvent,
  SortEvent,
  TableAction,
  TableColumn,
  TableConfig,
  TableDataService,
  TableSelectionService,
  TableState
} from './table-services';

// Open/Closed Principle - Extensible through configuration
@Component({
  selector: 'app-solid-data-table',
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
  templateUrl: './solid-data-table.component.html',
  styleUrl: './solid-data-table.component.css'
})
export class SolidDataTableComponent<T = any> implements OnInit, AfterViewInit, OnChanges {
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
  tableStats = signal<{
    totalItems: number;
    filteredItems: number;
    selectedItems: number;
    currentPage: number;
  }>({
    totalItems: 0,
    filteredItems: 0,
    selectedItems: 0,
    currentPage: 0
  });

  // ================================
  // REACTIVE STREAMS
  // ================================

  // Table state stream combining all reactive data
  readonly tableState$: Observable<Partial<TableState<T>>> = this.dataService.getTableState().pipe(
    tap(state => {
      if (state) {
        this.stateChange.emit(state);
        this.updateTableStats(state);
      }
    })
  );

  // Selection change stream
  readonly selectionChanges$ = this.selectionService.getSelectionChange().pipe(
    tap(selection => {
      this.selectionChange.emit(selection);
      this.updateSelectionStats(selection);
    })
  );

  // Auto-refresh stream (if enabled) - DESACTIVADO para evitar saturación del backend
  readonly autoRefresh$ = of(null).pipe(
    tap(() => console.log('  Table auto-refresh DESACTIVADO para evitar saturación del backend'))
  );

  // Error handling stream
  readonly errorHandling$ = of(this.dataService.error()).pipe(
    filter(error => !!error),
    tap(error => {
      this.snackBar.open(`Table Error: ${error}`, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
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

  onColumnFilterChange(column: string, value: any): void {
    const newFilters = new Map(this.activeFilters());
    if (value === null || value === undefined || value === '') {
      newFilters.delete(column);
    } else {
      newFilters.set(column, value);
    }

    this.activeFilters.set(newFilters);
    this.dataService.applyColumnFilter(column, value);

    this.filterChange.emit({
      column,
      value,
      type: 'text' // Could be determined by column configuration
    });
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
    this.updatePageStats(event);
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
      // Could integrate with a confirmation dialog service
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
    // Could be extended to export filtered data
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

    // Subscribe to error handling
    this.errorHandling$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private updateTableStats(state: Partial<TableState<T>>): void {
    this.tableStats.update(stats => ({
      ...stats,
      totalItems: state.data?.length || 0,
      filteredItems: state.filteredData?.length || 0
    }));
  }

  private updateSelectionStats(selection: SelectionEvent<T>): void {
    this.tableStats.update(stats => ({
      ...stats,
      selectedItems: selection.selected.length
    }));
  }

  private updatePageStats(pageEvent: PageEvent): void {
    this.tableStats.update(stats => ({
      ...stats,
      currentPage: pageEvent.pageIndex
    }));
  }
}
