# 🎯 **SOLID Data Table Component - Documentación**

## 📋 **Resumen**

El `SolidDataTableComponent` es un componente genérico y reutilizable que demuestra la implementación de los principios SOLID en Angular. Está diseñado para ser altamente configurable, extensible y fácil de mantener.

## 🏗️ **Principios SOLID Implementados**

### **S - Single Responsibility Principle**
- **`TableDataService`**: Solo maneja datos y filtrado
- **`TableSelectionService`**: Solo maneja selección de filas
- **`SolidDataTableComponent`**: Solo coordina la UI y delegación de eventos

### **O - Open/Closed Principle**
- Extensible a través de configuración (`TableConfig`)
- Templates personalizados para celdas (`cellTemplate`)
- Acciones configurables (`TableAction[]`)

### **L - Liskov Substitution Principle**
- Funciona con cualquier tipo de datos usando generics `<T>`
- Los servicios pueden ser sustituidos sin romper funcionalidad

### **I - Interface Segregation Principle**
- Interfaces focalizadas para diferentes responsabilidades:
  - `TableColumn<T>` - Configuración de columnas
  - `TableConfig` - Configuración general
  - `TableAction<T>` - Acciones disponibles
  - `SortEvent` - Eventos de ordenamiento
  - `SelectionEvent<T>` - Eventos de selección

### **D - Dependency Inversion Principle**
- Dependencia en abstracciones (servicios inyectados)
- Configuración externa en lugar de lógica hardcodeada

## 📁 **Estructura de Archivos**

```
solid-data-table/
├── solid-data-table.component.ts    # Lógica del componente
├── solid-data-table.component.html  # Template HTML
├── solid-data-table.component.css   # Estilos CSS
├── table-services.ts                # Servicios y interfaces
├── campaign-table-example.component.ts # Ejemplo de uso
└── README.md                         # Esta documentación
```

## 🚀 **Uso Básico**

### **1. Importar el Componente**

```typescript
import { SolidDataTableComponent } from './solid-data-table.component';
import { TableColumn, TableConfig, TableAction } from './table-services';

@Component({
  imports: [SolidDataTableComponent],
  // ...
})
export class MyComponent { }
```

### **2. Definir Configuración**

```typescript
export class MyComponent {
  // Datos a mostrar
  data: MyDataType[] = [];

  // Configuración de columnas
  columns: TableColumn<MyDataType>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', sortable: false, align: 'center' }
  ];

  // Configuración general
  config: TableConfig = {
    showSearch: true,
    showPagination: true,
    showSelection: true,
    multiSelection: true,
    pageSize: 10
  };

  // Acciones disponibles
  actions: TableAction<MyDataType>[] = [
    {
      icon: 'edit',
      label: 'Edit',
      color: 'primary',
      visible: (item) => item.status !== 'locked'
    },
    {
      icon: 'delete',
      label: 'Delete',
      color: 'warn',
      disabled: (item) => item.status === 'active'
    }
  ];
}
```

### **3. Template HTML**

```html
<app-solid-data-table
  [data]="data"
  [columns]="columns"
  [config]="config"
  [actions]="actions"
  (rowClick)="onRowClick($event)"
  (actionClick)="onActionClick($event)"
  (selectionChange)="onSelectionChange($event)">
</app-solid-data-table>
```

## ⚙️ **Configuración Avanzada**

### **Templates Personalizados**

```html
<app-solid-data-table [data]="data" [columns]="columns">
  <ng-template #cellTemplate let-element let-column="column" let-value="value">
    @if (column.key === 'status') {
      <span [class]="'status-' + value" class="status-badge">
        {{ value | titlecase }}
      </span>
    } @else if (column.key === 'date') {
      {{ value | date:'MMM dd, yyyy' }}
    } @else {
      {{ value }}
    }
  </ng-template>
</app-solid-data-table>
```

### **Acciones Condicionales**

```typescript
actions: TableAction<User>[] = [
  {
    icon: 'lock',
    label: 'Lock User',
    color: 'warn',
    visible: (user) => user.role !== 'admin',
    disabled: (user) => user.status === 'locked'
  },
  {
    icon: 'admin_panel_settings',
    label: 'Make Admin',
    color: 'primary',
    visible: (user) => user.role === 'user' && user.verified
  }
];
```

### **Eventos de Tabla**

```typescript
// Manejo de eventos
onRowClick(item: MyDataType): void {
  console.log('Row clicked:', item);
  this.router.navigate(['/detail', item.id]);
}

onActionClick(event: { action: TableAction<MyDataType>, item: MyDataType }): void {
  switch (event.action.label) {
    case 'Edit':
      this.editItem(event.item);
      break;
    case 'Delete':
      this.deleteItem(event.item);
      break;
  }
}

onSelectionChange(event: SelectionEvent<MyDataType>): void {
  this.selectedItems = event.selected;
  console.log(`${event.selected.length} items selected`);
}

onSortChange(event: SortEvent): void {
  // Implementar ordenamiento server-side si es necesario
  this.loadData(event.active, event.direction);
}
```

## 🎨 **Personalización de Estilos**

### **CSS Variables**

```css
app-solid-data-table {
  --table-border-color: #e0e0e0;
  --selection-bg-color: #e3f2fd;
  --hover-bg-color: #f9f9f9;
  --header-font-weight: 600;
}
```

### **Clases CSS Personalizadas**

```css
.status-active {
  background-color: #e8f5e8;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.status-inactive {
  background-color: #fff3e0;
  color: #f57c00;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}
```

## 📊 **Interfaces y Tipos**

### **TableColumn<T>**

```typescript
interface TableColumn<T = any> {
  key: string;                    // Clave del campo a mostrar
  label: string;                  // Título de la columna
  sortable?: boolean;             // Si la columna es ordenable
  width?: string;                 // Ancho de la columna
  align?: 'left' | 'center' | 'right'; // Alineación del contenido
}
```

### **TableConfig**

```typescript
interface TableConfig {
  showSearch?: boolean;           // Mostrar barra de búsqueda
  showPagination?: boolean;       // Mostrar paginación
  showSelection?: boolean;        // Mostrar checkboxes de selección
  multiSelection?: boolean;       // Permitir selección múltiple
  pageSize?: number;              // Tamaño de página por defecto
  pageSizeOptions?: number[];     // Opciones de tamaño de página
}
```

### **TableAction<T>**

```typescript
interface TableAction<T = any> {
  icon: string;                   // Icono de Material Icons
  label: string;                  // Texto del tooltip
  color?: 'primary' | 'accent' | 'warn'; // Color del botón
  visible?: (item: T) => boolean; // Función para mostrar/ocultar
  disabled?: (item: T) => boolean; // Función para habilitar/deshabilitar
}
```

## 🔄 **Eventos Disponibles**

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `rowClick` | `EventEmitter<T>` | Emitido cuando se hace clic en una fila |
| `actionClick` | `EventEmitter<{action, item}>` | Emitido cuando se hace clic en una acción |
| `sortChange` | `EventEmitter<SortEvent>` | Emitido cuando cambia el ordenamiento |
| `selectionChange` | `EventEmitter<SelectionEvent<T>>` | Emitido cuando cambia la selección |
| `pageChange` | `EventEmitter<PageEvent>` | Emitido cuando cambia la página |

## 📱 **Responsive Design**

El componente es totalmente responsive e incluye:

- **Scroll horizontal** en pantallas pequeñas
- **Adaptación de controles** para móviles
- **Optimización de espaciado** en diferentes resoluciones

## 🧪 **Testing**

### **Test Unitario Ejemplo**

```typescript
describe('SolidDataTableComponent', () => {
  let component: SolidDataTableComponent<any>;
  let fixture: ComponentFixture<SolidDataTableComponent<any>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SolidDataTableComponent],
      providers: [TableDataService, TableSelectionService]
    });
    
    fixture = TestBed.createComponent(SolidDataTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display data correctly', () => {
    const testData = [{ id: 1, name: 'Test' }];
    component.data = testData;
    component.columns = [{ key: 'name', label: 'Name' }];
    
    fixture.detectChanges();
    
    expect(fixture.debugElement.query(By.css('table'))).toBeTruthy();
  });
});
```

## 🚀 **Performance**

### **Optimizaciones Incluidas**

- ✅ **OnPush Change Detection** - Para mejor rendimiento
- ✅ **TrackBy Functions** - En ngFor loops
- ✅ **Virtual Scrolling** - Para datasets grandes (opcional)
- ✅ **Lazy Loading** - De acciones y templates

### **Recomendaciones**

- Usar **server-side pagination** para datasets > 1000 items
- Implementar **server-side sorting** para mejor UX
- Considerar **virtual scrolling** para tablas con muchas columnas

## 📚 **Ejemplos Adicionales**

Ver el archivo `campaign-table-example.component.ts` para un ejemplo completo de implementación con datos de campañas.

## 🤝 **Contribución**

Para contribuir al componente:

1. Seguir los principios SOLID establecidos
2. Mantener la separación de responsabilidades
3. Añadir tests para nueva funcionalidad
4. Documentar cambios en este README

---

**Este componente es un ejemplo práctico de cómo implementar arquitectura SOLID en Angular, priorizando mantenibilidad, extensibilidad y testabilidad.**
