import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoModule
  ],
  templateUrl: './generic-table.component.html',
  styleUrl: './generic-table.component.css'
})
export class GenericTableComponent<T extends Record<string, any>> implements AfterViewInit {
  @Input() dataSource: T[] = []; // The table's data (array of type T)

  /**
   * Column definitions passed in. Example:
   * [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }]
   */
  @Input() displayedColumns: { key: keyof T, label: string }[] = [];

  tableData = new MatTableDataSource<T>([]); // Data source for the table

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnChanges() {
    // Cada vez que cambie el input, actualizamos el data source
    this.tableData.data = this.dataSource;
  }

  ngAfterViewInit() {
    this.tableData.sort = this.sort;
    this.tableData.paginator = this.paginator;
  }

  // Extract string keys for Angular Material table bindings
  get columnKeys(): string[] {
    return this.displayedColumns.map(col => col.key as string);
  }

  /**
   * Returns the value for a given column key in the row data.
   * @param row The row data object
   * @param columnKey The key of the column
   */
  getCellValue(row: T, columnKey: keyof T): any {
    return row[columnKey];
  }

  /**
   * Returns the label for a given column key.
   * @param columnKey The key of the column
   */
  getColumnLabel(columnKey: keyof T): string {
    const column = this.displayedColumns.find(col => col.key === columnKey);
    return column ? column.label : '';
  }

  /**
   * Applies a filter to the data source based on the input value.
   * This method filters the data source by checking if any of the values in the row
   * contain the filter value (case-insensitive).
   * @param event The input event containing the filter value
   */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.tableData.filter = filterValue;
  }
  
}
