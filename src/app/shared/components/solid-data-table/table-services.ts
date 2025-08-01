/**
 * Table Interfaces and Services with Advanced RxJS Patterns
 * Following SOLID principles with reactive programming enhancements
 */
import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { 
  Observable, 
  BehaviorSubject, 
  Subject, 
  combineLatest,
  of,
  merge
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  tap,
  shareReplay,
  filter,
  scan
} from 'rxjs/operators';

// Interface Segregation Principle - Focused interfaces
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  filterType?: 'text' | 'number' | 'date' | 'select';
  formatter?: (value: any) => string;
}

export interface TableConfig {
  showSearch?: boolean;
  showPagination?: boolean;
  showSelection?: boolean;
  multiSelection?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  virtualScrolling?: boolean;
  infiniteScroll?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface TableAction<T = any> {
  icon: string;
  label: string;
  color?: 'primary' | 'accent' | 'warn';
  visible?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
  confirm?: boolean;
}

export interface SortEvent {
  active: string;
  direction: 'asc' | 'desc' | '';
}

export interface SelectionEvent<T = any> {
  selected: T[];
  isAllSelected: boolean;
}

export interface FilterEvent {
  column: string;
  value: any;
  type: 'text' | 'number' | 'date' | 'select';
}

export interface TableState<T = any> {
  data: T[];
  filteredData: T[];
  selectedItems: T[];
  currentSort: SortEvent;
  currentPage: PageEvent;
  searchTerm: string;
  columnFilters: Map<string, any>;
}

// Single Responsibility - Enhanced data service with reactive patterns
@Injectable()
export class TableDataService<T> {
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // REACTIVE STATE WITH SIGNALS
  // ================================
  
  private readonly _dataSource = signal<MatTableDataSource<T>>(new MatTableDataSource<T>([]));
  private readonly _filteredData = signal<T[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalCount = signal<number>(0);

  readonly dataSource = this._dataSource.asReadonly();
  readonly filteredData = this._filteredData.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();

  // ================================
  // RXJS SUBJECTS FOR REACTIVE FLOWS
  // ================================
  
  private readonly dataSubject = new BehaviorSubject<T[]>([]);
  private readonly filterSubject = new BehaviorSubject<string>('');
  private readonly sortSubject = new BehaviorSubject<Sort>({ active: '', direction: '' });
  private readonly columnFilterSubject = new BehaviorSubject<Map<string, any>>(new Map());
  private readonly refreshSubject = new Subject<void>();

  // ================================
  // REACTIVE STREAMS
  // ================================

  // Debounced search stream
  readonly search$ = this.filterSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    tap(term => this.applyGlobalFilter(term)),
    shareReplay(1)
  );

  // Column filtering stream
  readonly columnFilters$ = this.columnFilterSubject.pipe(
    debounceTime(500),
    distinctUntilChanged((prev, curr) => 
      JSON.stringify([...prev.entries()]) === JSON.stringify([...curr.entries()])
    ),
    tap(filters => this.applyColumnFilters(filters)),
    shareReplay(1)
  );

  // Combined data processing stream
  readonly processedData$ = combineLatest([
    this.dataSubject.asObservable(),
    this.search$,
    this.columnFilters$,
    this.sortSubject.asObservable()
  ]).pipe(
    map(([data, searchTerm, filters, sort]) => 
      this.processTableData(data, searchTerm, filters, sort)
    ),
    tap(processedData => {
      this._filteredData.set(processedData);
      this.updateDataSource(processedData);
    }),
    shareReplay(1)
  );

  // Table state stream for complex operations
  readonly tableState$ = combineLatest([
    this.dataSubject.asObservable(),
    this.processedData$,
    this.filterSubject.asObservable(),
    this.sortSubject.asObservable()
  ]).pipe(
    map(([data, filteredData, searchTerm, sort]) => ({
      data,
      filteredData,
      searchTerm,
      currentSort: {
        active: sort.active,
        direction: sort.direction
      } as SortEvent,
      columnFilters: this.columnFilterSubject.value
    } as Partial<TableState<T>>)),
    shareReplay(1)
  );

  constructor() {
    this.initializeReactiveStreams();
  }

  // ================================
  // PUBLIC METHODS
  // ================================

  setData(data: T[]): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._totalCount.set(data.length);
    this.dataSubject.next(data);
    this._isLoading.set(false);
  }

  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
    this._isLoading.set(false);
  }

  applyFilter(filterValue: string): void {
    this.filterSubject.next(filterValue);
  }

  applyColumnFilter(column: string, value: any): void {
    const currentFilters = new Map(this.columnFilterSubject.value);
    if (value === null || value === undefined || value === '') {
      currentFilters.delete(column);
    } else {
      currentFilters.set(column, value);
    }
    this.columnFilterSubject.next(currentFilters);
  }

  clearFilters(): void {
    this.filterSubject.next('');
    this.columnFilterSubject.next(new Map());
  }

  applySorting(sort: Sort): void {
    this.sortSubject.next(sort);
  }

  connectPaginator(paginator: MatPaginator): void {
    this._dataSource().paginator = paginator;
  }

  connectSort(sort: MatSort): void {
    this._dataSource().sort = sort;
    
    // Connect sort changes to reactive stream
    sort.sortChange.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(sortEvent => {
      this.applySorting(sortEvent);
    });
  }

  refreshData(): void {
    this.refreshSubject.next();
  }

  getTableState(): Observable<Partial<TableState<T>>> {
    return this.tableState$;
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private initializeReactiveStreams(): void {
    // Initialize all reactive streams
    this.processedData$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private applyGlobalFilter(filterValue: string): void {
    const source = this._dataSource();
    source.filter = filterValue.trim().toLowerCase();
  }

  private applyColumnFilters(filters: Map<string, any>): void {
    const source = this._dataSource();
    
    // Custom filter predicate for column-specific filtering
    source.filterPredicate = (data: T) => {
      // Global filter first
      const globalFilterMatch = !source.filter || 
        JSON.stringify(data).toLowerCase().includes(source.filter);

      if (!globalFilterMatch) return false;

      // Column filters
      for (const [column, filterValue] of filters.entries()) {
        const cellValue = (data as any)[column];
        if (!this.matchesColumnFilter(cellValue, filterValue)) {
          return false;
        }
      }

      return true;
    };

    // Trigger filter update
    source.filter = source.filter; // This triggers the filter
  }

  private matchesColumnFilter(cellValue: any, filterValue: any): boolean {
    if (filterValue === null || filterValue === undefined || filterValue === '') {
      return true;
    }

    if (typeof filterValue === 'string') {
      return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
    }

    if (typeof filterValue === 'number') {
      return Number(cellValue) === filterValue;
    }

    return cellValue === filterValue;
  }

  private processTableData(
    data: T[], 
    searchTerm: string, 
    filters: Map<string, any>, 
    sort: Sort
  ): T[] {
    let processedData = [...data];

    // Apply global search
    if (searchTerm) {
      processedData = processedData.filter(item =>
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply column filters
    for (const [column, filterValue] of filters.entries()) {
      processedData = processedData.filter(item =>
        this.matchesColumnFilter((item as any)[column], filterValue)
      );
    }

    // Apply sorting
    if (sort.active && sort.direction) {
      processedData = processedData.sort((a, b) => {
        const aValue = (a as any)[sort.active];
        const bValue = (b as any)[sort.active];
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sort.direction === 'asc' ? comparison : -comparison;
      });
    }

    return processedData;
  }

  private updateDataSource(data: T[]): void {
    const source = this._dataSource();
    source.data = data;
  }
}

// Enhanced selection service with reactive patterns
@Injectable()
export class TableSelectionService<T> {
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // REACTIVE STATE WITH SIGNALS
  // ================================
  
  private readonly _selection = signal<SelectionModel<T>>(new SelectionModel<T>(true, []));
  private readonly _selectionMode = signal<'single' | 'multiple'>('multiple');
  
  readonly selection = this._selection.asReadonly();
  readonly selectionMode = this._selectionMode.asReadonly();

  // ================================
  // RXJS SUBJECTS FOR REACTIVE FLOWS
  // ================================
  
  private readonly selectionChangeSubject = new Subject<SelectionEvent<T>>();

  // ================================
  // REACTIVE STREAMS
  // ================================

  readonly selectionChange$ = this.selectionChangeSubject.asObservable().pipe(
    distinctUntilChanged((prev, curr) => 
      prev.selected.length === curr.selected.length &&
      prev.isAllSelected === curr.isAllSelected
    ),
    shareReplay(1)
  );

  // Selection statistics stream
  readonly selectionStats$ = this.selectionChange$.pipe(
    map(selection => ({
      count: selection.selected.length,
      hasSelection: selection.selected.length > 0,
      isAllSelected: selection.isAllSelected,
      percentage: 0 // Will be calculated based on total items
    })),
    shareReplay(1)
  );

  constructor() {
    this.initializeReactiveStreams();
  }

  // ================================
  // PUBLIC METHODS
  // ================================

  initializeSelection(allowMultiple: boolean = true): void {
    const mode = allowMultiple ? 'multiple' : 'single';
    this._selectionMode.set(mode);
    this._selection.set(new SelectionModel<T>(allowMultiple, []));
  }

  isSelected(item: T): boolean {
    return this._selection().isSelected(item);
  }

  isAllSelected(totalItems: number): boolean {
    const selection = this._selection();
    return selection.selected.length === totalItems && totalItems > 0;
  }

  isPartiallySelected(totalItems: number): boolean {
    const selection = this._selection();
    return selection.selected.length > 0 && selection.selected.length < totalItems;
  }

  toggleItem(item: T): void {
    this._selection().toggle(item);
    this.emitSelectionChange();
  }

  selectItem(item: T): void {
    this._selection().select(item);
    this.emitSelectionChange();
  }

  deselectItem(item: T): void {
    this._selection().deselect(item);
    this.emitSelectionChange();
  }

  toggleAll(items: T[]): void {
    const selection = this._selection();
    if (this.isAllSelected(items.length)) {
      selection.clear();
    } else {
      items.forEach(item => selection.select(item));
    }
    this.emitSelectionChange();
  }

  selectAll(items: T[]): void {
    const selection = this._selection();
    items.forEach(item => selection.select(item));
    this.emitSelectionChange();
  }

  getSelected(): T[] {
    return this._selection().selected;
  }

  getSelectionCount(): number {
    return this._selection().selected.length;
  }

  clear(): void {
    this._selection().clear();
    this.emitSelectionChange();
  }

  getSelectionChange(): Observable<SelectionEvent<T>> {
    return this.selectionChange$;
  }

  // ================================
  // PRIVATE METHODS
  // ================================

  private initializeReactiveStreams(): void {
    // Subscribe to selection changes for logging or analytics
    this.selectionChange$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(selection => {
      // Could emit to analytics service, logging, etc.
      console.debug('Selection changed:', selection);
    });
  }

  private emitSelectionChange(): void {
    const selected = this.getSelected();
    const selectionEvent: SelectionEvent<T> = {
      selected,
      isAllSelected: false // Will be calculated by consumer
    };
    this.selectionChangeSubject.next(selectionEvent);
  }
}
