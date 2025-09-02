# Servicio ScrapingDispatch

## Propósito
El servicio `ScrapingDispatchService` actúa como un mediador entre los componentes de la aplicación y los diferentes tipos de scraping que puede realizar el backend. Su principal responsabilidad es determinar qué método de scraping debe utilizarse según el tipo de campaña.

## Cómo funciona
1. El servicio recibe una campaña desde un componente o servicio cliente.
2. Analiza el tipo de campaña para determinar qué método de scraping es apropiado.
3. Convierte el objeto Campaign en un formato adecuado para el backend.
4. Llama al método correspondiente del backend API service.
5. Devuelve el resultado de la operación como un Observable.

## Métodos principales

### dispatchScraping(campaign: Campaign)
Este método principal decide qué tipo de scraping realizar basándose en el campo `type` de la campaña:

- **hashtag**: Inicia scraping por hashtags especificados en la campaña
- **keyword**: Inicia scraping por palabras clave
- **user**: Inicia scraping por usuarios específicos
- **mention**: Inicia scraping por menciones a usuarios

## Conversión de tipos
El servicio maneja la conversión entre:
- El tipo `Campaign` utilizado en el estado de la aplicación
- El formato esperado por el backend para las solicitudes de scraping

## Integración con NgRx
El servicio está diseñado para trabajar con el patrón NgRx Effects:

1. Un componente interactúa con la fachada de scraping
2. La fachada despacha acciones NgRx
3. Los efectos capturan estas acciones y llaman a este servicio
4. El servicio determina el tipo de scraping y llama al API
5. El resultado se convierte en acciones de éxito o error
6. El reducer actualiza el estado de la aplicación

## Manejo de errores
El servicio maneja diferentes escenarios de error:

1. **Tipo de campaña desconocido**: Devuelve un error Observable si el tipo de campaña no está soportado
2. **Errores del backend**: Propaga cualquier error devuelto por el backend al llamante

## Ejemplo de uso

```typescript
import { Component, inject } from '@angular/core';
import { ScrapingDispatchService } from './core/services/scraping-dispatch.service';
import { Campaign } from './core/state/app.state';

@Component({
  selector: 'app-example',
  template: '...'
})
export class ExampleComponent {
  private scrapingDispatchService = inject(ScrapingDispatchService);
  
  startScrapingForCampaign(campaign: Campaign): void {
    this.scrapingDispatchService.dispatchScraping(campaign)
      .subscribe({
        next: (result) => console.log('Scraping started successfully', result),
        error: (error) => console.error('Failed to start scraping', error)
      });
  }
}
```

## Extensibilidad
El servicio está diseñado para ser fácilmente extensible:

1. Nuevos tipos de campaña pueden agregarse extendiendo el switch case en `dispatchScraping`
2. Los métodos de conversión pueden modificarse para manejar nuevos campos o formatos
3. Se pueden agregar métodos adicionales para controlar o monitorear procesos de scraping en curso

## Testing
El servicio está diseñado para ser fácilmente testeable mediante mocks:

```typescript
// Ejemplo de test unitario
describe('ScrapingDispatchService', () => {
  let service: ScrapingDispatchService;
  let mockBackendApiService: jasmine.SpyObj<BackendApiService>;

  beforeEach(() => {
    mockBackendApiService = jasmine.createSpyObj('BackendApiService', [
      'scrapeTweets'
    ]);
    
    TestBed.configureTestingModule({
      providers: [
        ScrapingDispatchService,
        { provide: BackendApiService, useValue: mockBackendApiService }
      ]
    });
    
    service = TestBed.inject(ScrapingDispatchService);
  });
  
  it('should dispatch hashtag scraping', () => {
    const campaign: Campaign = {
      id: 'campaign-1',
      type: 'hashtag',
      // ... otras propiedades
    };
    
    service.dispatchScraping(campaign);
    
    expect(mockBackendApiService.scrapeTweets).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: 'hashtag'
      })
    );
  });
});
```
