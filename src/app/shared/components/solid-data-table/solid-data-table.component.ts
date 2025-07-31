/**
 * SOLID Generic Data Table Component
 * Demonstrates SOLID principles in a reusable component
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
  SimpleChanges,
  TemplateRef,
  ContentChild,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { 
  TableColumn, 
  TableConfig, 
  TableAction, 
  SortEvent, 
  SelectionEvent,
  TableDataService,
  TableSelectionService
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
    MatCheckboxModule
  ],
  providers: [
    TableDataService,
    TableSelectionService
  ],
  templateUrl: './solid-data-table.component.html',
  styleUrl: './solid-data-table.component.css'
})
export class SolidDataTableComponent<T = any> implements AfterViewInit, OnChanges {
  // Dependency Injection - Services provided at component level
  constructor(
    private dataService: TableDataService<T>,
    private selectionService: TableSelectionService<T>
  ) {}

  // Input Properties - Interface for external configuration
  @Input() data: T[] = [];
  @Input() columns: TableColumn<T>[] = [];
  @Input() config: TableConfig = {
    showSearch: true,
    showPagination: true,
    showSelection: false,
    multiSelection: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50]
  };
  @Input() actions: TableAction<T>[] = [];

  // Output Events - Loose coupling with parent components
  @Output() rowClick = new EventEmitter<T>();
  @Output() actionClick = new EventEmitter<{ action: TableAction<T>, item: T }>();
  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() selectionChange = new EventEmitter<SelectionEvent<T>>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  // Template References - Open/Closed for custom templates
  @ContentChild('cellTemplate') cellTemplate?: TemplateRef<any>;

  // View Children
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Computed Properties
  readonly displayedColumns = computed(() => {
    const cols: string[] = [];
    
    if (this.config.showSelection) cols.push('select');
    cols.push(...this.columns.map(col => col.key));
    if (this.actions && this.actions.length > 0) cols.push('actions');
    
    return cols;
  });

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
    }
    
    if (changes['config'] && this.config.showSelection) {
      this.selectionService.initializeSelection(this.config.multiSelection);
    }
  }

  // Public methods for template access
  getDataSource(): MatTableDataSource<T> {
    return this.dataService.dataSource();
  }

  getSelectionCount(): number {
    return this.selectionService.selection().selected.length;
  }

  isRowSelected(row: T): boolean {
    return this.selectionService.isSelected(row);
  }

  getColumnValue(element: T, key: string): any {
    return (element as any)[key];
  }

  // Event Handlers - Delegation to services
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataService.applyFilter(filterValue);
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit({
      active: sort.active,
      direction: sort.direction
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  // Selection Methods
  toggleRowSelection(row: T): void {
    this.selectionService.toggleItem(row);
    this.emitSelectionChange();
  }

  toggleAllSelection(): void {
    this.selectionService.toggleAll(this.data);
    this.emitSelectionChange();
  }

  isAllSelected(): boolean {
    return this.selectionService.isAllSelected(this.data.length);
  }

  isPartiallySelected(): boolean {
    return this.selectionService.isPartiallySelected(this.data.length);
  }

  hasSelection(): boolean {
    return this.selectionService.selection().selected.length > 0;
  }

  clearSelection(): void {
    this.selectionService.clear();
    this.emitSelectionChange();
  }

  // Action Methods
  getVisibleActions(item: T): TableAction<T>[] {
    return this.actions.filter(action => 
      !action.visible || action.visible(item)
    );
  }

  isActionDisabled(action: TableAction<T>, item: T): boolean {
    return action.disabled ? action.disabled(item) : false;
  }

  executeAction(action: TableAction<T>, item: T): void {
    this.actionClick.emit({ action, item });
  }

  private emitSelectionChange(): void {
    const selected = this.selectionService.getSelected();
    this.selectionChange.emit({
      selected,
      isAllSelected: this.isAllSelected()
    });
  }
}
