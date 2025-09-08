import { PageEvent } from "@angular/material/paginator";

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
