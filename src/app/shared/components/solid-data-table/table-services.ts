/**
 * Table Interfaces and Services
 * Following SOLID principles with proper separation of concerns
 */
import { Injectable, signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';

// Interface Segregation Principle - Focused interfaces
export interface TableColumn<T = any> {
  key: string; // Changed from keyof T to string for template compatibility
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableConfig {
  showSearch?: boolean;
  showPagination?: boolean;
  showSelection?: boolean;
  multiSelection?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
}

export interface TableAction<T = any> {
  icon: string;
  label: string;
  color?: 'primary' | 'accent' | 'warn';
  visible?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
}

export interface SortEvent {
  active: string;
  direction: 'asc' | 'desc' | '';
}

export interface SelectionEvent<T = any> {
  selected: T[];
  isAllSelected: boolean;
}

// Single Responsibility - Each service handles one concern
@Injectable()
export class TableDataService<T> {
  private readonly _dataSource = signal<MatTableDataSource<T>>(new MatTableDataSource<T>([]));
  private readonly _filteredData = signal<T[]>([]);
  
  readonly dataSource = this._dataSource.asReadonly();
  readonly filteredData = this._filteredData.asReadonly();

  setData(data: T[]): void {
    const source = new MatTableDataSource(data);
    this._dataSource.set(source);
    this._filteredData.set(data);
  }

  applyFilter(filterValue: string): void {
    const source = this._dataSource();
    source.filter = filterValue.trim().toLowerCase();
    this._filteredData.set(source.filteredData);
  }

  connectPaginator(paginator: MatPaginator): void {
    this._dataSource().paginator = paginator;
  }

  connectSort(sort: MatSort): void {
    this._dataSource().sort = sort;
  }
}

@Injectable()
export class TableSelectionService<T> {
  private readonly _selection = signal<SelectionModel<T>>(new SelectionModel<T>(true, []));
  
  readonly selection = this._selection.asReadonly();

  initializeSelection(allowMultiple: boolean = true): void {
    this._selection.set(new SelectionModel<T>(allowMultiple, []));
  }

  isSelected(item: T): boolean {
    return this._selection().isSelected(item);
  }

  isAllSelected(totalItems: number): boolean {
    const selection = this._selection();
    return selection.selected.length === totalItems;
  }

  isPartiallySelected(totalItems: number): boolean {
    const selection = this._selection();
    return selection.selected.length > 0 && selection.selected.length < totalItems;
  }

  toggleItem(item: T): void {
    this._selection().toggle(item);
  }

  toggleAll(items: T[]): void {
    const selection = this._selection();
    if (this.isAllSelected(items.length)) {
      selection.clear();
    } else {
      items.forEach(item => selection.select(item));
    }
  }

  getSelected(): T[] {
    return this._selection().selected;
  }

  clear(): void {
    this._selection().clear();
  }
}
