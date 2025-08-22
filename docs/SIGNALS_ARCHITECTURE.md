# Signal-based State Management Architecture

## Overview

Esta implementación introduce un patrón de arquitectura basado en Stores con Angular Signals para mejorar la comunicación entre componentes y la gestión de estado.

## Principios Arquitectónicos

### 1.2 Comunicación entre componentes ✅

**Patrón implementado**: Input/output mínimos con estado elevado a Stores con Signals

```typescript
// ❌ Antes: Props drilling y observables complejos
@Component({})
export class MyComponent {
  @Input() campaigns: Campaign[] = [];
  @Output() campaignSelected = new EventEmitter<Campaign>();
}

// ✅ Ahora: Stores centralizados con signals
@Component({})
export class MyComponent {
  private campaignsStore = inject(CampaignsStore);
  
  readonly campaigns = computed(() => this.campaignsStore.list());
  readonly isLoading = computed(() => this.campaignsStore.loading());
  
  selectCampaign(campaign: Campaign) {
    this.campaignsStore.selectCampaign(campaign); // Action
  }
}
```

## Stores Implementados

### 1. SessionStore: { user, token, isAuthenticated } ✅

**Ubicación**: `src/app/core/state/session.store.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class SessionStore {
  // Computed signals (readonly)
  readonly user = computed(() => this._user());
  readonly token = computed(() => this._token());
  readonly isAuthenticated = computed(() => this._isAuthenticated());
  
  // Actions
  login(credentials) { /* ... */ }
  logout() { /* ... */ }
  updateUser(user) { /* ... */ }
}
```

**Características**:
- Sincronización automática con AuthService
- Computed signals para roles y permisos
- Gestión centralizada de errores
- Métodos de acción para login/logout

### 2. TweetsStore: { items, total, filters, loading, error } ✅

**Ubicación**: `src/app/core/state/tweets.store.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class TweetsStore {
  // Computed signals (readonly)
  readonly items = computed(() => this._items());
  readonly total = computed(() => this._total());
  readonly loading = computed(() => this._loading());
  readonly sentimentCounts = computed(() => /* sentiment analysis */);
  
  // Actions
  loadTweets(filters) { /* ... */ }
  updateFilters(filters) { /* ... */ }
  refresh() { /* ... */ }
}
```

**Características**:
- Filtros reactivos (sentiment, fechas, hashtags)
- Análisis de sentiment automático
- Paginación integrada
- Métricas computadas (top hashtags, menciones)

### 3. CampaignsStore: { list, selected, summary, loading } ✅

**Ubicación**: `src/app/core/state/campaigns.store.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class CampaignsStore {
  // Computed signals (readonly)  
  readonly list = computed(() => this._list());
  readonly selected = computed(() => this._selected());
  readonly summary = computed(() => this._summary());
  readonly filteredList = computed(() => /* filtering logic */);
  
  // Actions
  loadCampaigns() { /* ... */ }
  createCampaign(data) { /* ... */ }
  updateCampaign(id, updates) { /* ... */ }
  selectCampaign(campaign) { /* ... */ }
}
```

**Características**:
- CRUD operations completas
- Filtros y ordenamiento reactivos
- Resumen automático de métricas
- Integración con CampaignService consolidado

## Patrón de Componentes

### Componentes Presentacionales

Los componentes **consumen signals (computed)** y **emiten acciones** a los services/stores:

```typescript
@Component({})
export class CampaignSummaryWidgetComponent {
  private campaignsStore = inject(CampaignsStore);
  
  // ✅ CONSUME: Computed signals (readonly)
  readonly isLoading = computed(() => this.campaignsStore.loading());
  readonly campaigns = computed(() => this.campaignsStore.list());
  readonly summary = computed(() => this.campaignsStore.summary());
  
  // ✅ EMITE: Actions al store
  onRefresh(): void {
    this.campaignsStore.refresh(); // Action dispatch
  }
  
  onCampaignSelect(campaign: Campaign): void {
    this.campaignsStore.selectCampaign(campaign); // Action dispatch  
  }
}
```

### Ejemplo de Migración

**Antes (usando Facade)**:
```typescript
export class CampaignAnalyticsComponent {
  campaignFacade = inject(CampaignFacade);
  currentCampaign = signal<Campaign | null>(null);
  
  ngOnInit() {
    this.campaignFacade.selectCampaign(id).subscribe(campaign => {
      this.currentCampaign.set(campaign); // Manual signal update
    });
  }
}
```

**Después (usando Store)**:
```typescript
export class CampaignAnalyticsComponent {
  private campaignsStore = inject(CampaignsStore);
  private tweetsStore = inject(TweetsStore);
  
  // Computed signals - reactive to store changes
  readonly currentCampaign = computed(() => this.campaignsStore.selected());
  readonly isLoading = computed(() => this.campaignsStore.loading());
  readonly tweetMetrics = computed(() => this.tweetsStore.sentimentCounts());
  
  ngOnInit() {
    this.campaignsStore.loadCampaign(id); // Action dispatch
  }
}
```

## Beneficios Arquitectónicos

### 1. **Comunicación Simplificada**
- Sin prop drilling
- Sin observables complejos en componentes
- Estado reactivo automático

### 2. **Separación de Responsabilidades**
```
Components (Presentation) → Stores (State) → Services (Data)
```

### 3. **Predictabilidad**
- Actions explícitas para cambios de estado  
- Computed signals para reactividad
- Un solo punto de verdad por dominio

### 4. **Performance**
- Change detection optimizada con signals
- Computeds se actualizan solo cuando dependen de cambios
- Menos subscriptions manuales

### 5. **Testabilidad**
```typescript
// Easy mocking and testing
const mockCampaignsStore = {
  list: signal([mockCampaign]),
  loading: signal(false),
  selectCampaign: jasmine.createSpy()
};
```

## Guía de Uso

### 1. Crear un nuevo Store

```typescript
@Injectable({ providedIn: 'root' })
export class MyStore {
  // Private signals (internal state)
  private readonly _items = signal<Item[]>([]);
  private readonly _loading = signal<boolean>(false);
  
  // Public computed signals (readonly)
  readonly items = computed(() => this._items());
  readonly loading = computed(() => this._loading());
  
  // Actions (methods that update state)
  loadItems() {
    this._loading.set(true);
    // API call logic...
  }
}
```

### 2. Usar Store en Componente

```typescript
@Component({})
export class MyComponent {
  private store = inject(MyStore);
  
  // Consume signals
  readonly items = computed(() => this.store.items());
  readonly isEmpty = computed(() => this.store.items().length === 0);
  
  // Emit actions
  onRefresh() {
    this.store.loadItems();
  }
}
```

### 3. Template Binding

```html
<!-- Reactive to store signals -->
@if (isLoading()) {
  <mat-spinner></mat-spinner>
} @else if (isEmpty()) {
  <p>No items found</p>
} @else {
  @for (item of items(); track item.id) {
    <div (click)="onItemSelect(item)">{{ item.name }}</div>
  }
}

<button (click)="onRefresh()">Refresh</button>
```

## Migración Gradual

1. **Fase 1**: Crear stores para dominios principales ✅
2. **Fase 2**: Migrar componentes críticos ✅
3. **Fase 3**: Deprecar facades gradualmente
4. **Fase 4**: Migrar componentes restantes

## Estado Actual

✅ **Completado**:
- SessionStore implementation
- TweetsStore implementation  
- CampaignsStore implementation
- CampaignAnalyticsComponent migrado
- CampaignSummaryWidgetComponent ejemplo
- Build verification successful

🔄 **Próximos Pasos**:
- Migrar más componentes al patrón
- Crear tests para stores
- Agregar stores para otros dominios (Users, Settings, etc.)

## Recursos

- **Stores**: `src/app/core/state/`
- **Ejemplo de migración**: `campaign-analytics.component.ts` 
- **Componente demo**: `campaign-summary-widget.component.ts`
- **Index exports**: `src/app/core/state/index.ts`
