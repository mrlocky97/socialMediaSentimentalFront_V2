# Integración de Scraping en la Aplicación

Este documento detalla la implementación del módulo de scraping en la aplicación Social Media Sentimental Frontend.

## Arquitectura de la Solución

La integración del scraping sigue el patrón arquitectónico de la aplicación, utilizando NgRx para el manejo del estado y fachadas (facades) para simplificar la interacción con los componentes.

### Componentes clave

1. **ScrapingDispatchService**: Servicio central que determina qué método de scraping usar según el tipo de campaña.

2. **NgRx Store para Scraping**:
   - **Actions**: Define todas las acciones posibles para operaciones de scraping.
   - **Reducer**: Gestiona los cambios de estado basados en las acciones despachadas.
   - **Selectors**: Consulta y deriva datos del estado de scraping.
   - **Effects**: Maneja efectos secundarios como llamadas a la API para acciones de scraping.
   - **Facade**: Proporciona una interfaz simplificada para que los componentes interactúen con el estado de scraping.

3. **Integración en CampaignListComponent**: Se agregó la capacidad de iniciar scraping directamente desde la lista de campañas.

## Flujo de Trabajo

1. **Creación de Campaña con Scraping Automático**:
   - Cuando un usuario crea una campaña, se inicia automáticamente el scraping correspondiente.
   - El método `createScraping` utiliza la fachada de scraping para iniciar el proceso.

2. **Scraping Manual desde la Lista de Campañas**:
   - Un botón "Scrape" se agregó a las acciones de cada campaña.
   - El método `startScraping` maneja la interacción con la fachada de scraping.

3. **Gestión del Estado de Scraping**:
   - El estado mantiene un registro de los scrapings activos por campaña.
   - Se puede rastrear el progreso, resultados y errores de cada operación de scraping.

## Estructura de Archivos

```
src/
  app/
    core/
      services/
        scraping-dispatch.service.ts       # Servicio para despacho de scraping
      store/
        actions/
          scraping.actions.ts              # Acciones para operaciones de scraping
        reducers/
          scraping.reducer.ts              # Reducer para el estado de scraping
        selectors/
          scraping.selectors.ts            # Selectores para consultar el estado
        effects/
          scraping.effects.ts              # Effects para manejar operaciones asíncronas
        fecades/
          scraping.facade.ts               # Fachada para simplificar el acceso al estado
    features/
      campaigns/
        campaign-list/
          campaign-list.component.ts       # Componente integrado con scraping
```

## Tipos de Scraping

La aplicación soporta varios tipos de scraping, correspondientes a los tipos de campaña:

1. **Hashtag Scraping**: Recopila tweets que contienen hashtags específicos.
2. **Keyword Scraping**: Busca tweets que contienen palabras clave específicas.
3. **User Scraping**: Recopila tweets de usuarios específicos.
4. **Mention Scraping**: Encuentra tweets que mencionan a usuarios específicos.

## Gestión de Estado y Progreso

El estado de scraping incluye:

1. **activeScraping**: Mapa de ID de campaña -> booleano de actividad.
2. **progress**: Mapa de ID de campaña -> objeto de progreso.
3. **lastResults**: Mapa de ID de campaña -> últimos resultados.
4. **scrapedTweets**: Mapa de ID de campaña -> tweets obtenidos.
5. **loading**: Estado global de carga.
6. **error**: Mensaje de error global o nulo.

## Uso en Componentes

Para usar el scraping en un componente:

```typescript
constructor(private scrapingFacade: ScrapingFacade) {}

startScraping(campaign: Campaign): void {
  this.scrapingFacade.startScraping(campaign).subscribe({
    next: (action) => {
      // Manejar éxito
    },
    error: (error) => {
      // Manejar error
    }
  });
}
```

## Monitoreo de Progreso

Se puede monitorear el progreso del scraping utilizando los selectores proporcionados por la fachada:

```typescript
this.scrapingFacade.getScrapingProgress(campaignId).subscribe(progress => {
  // Actualizar UI con el progreso
});
```

## Errores Comunes y Soluciones

1. **Error de tipos**: Asegúrese de que las interfaces Campaign y ScrapingProgress estén correctamente definidas.
2. **Múltiples scrapings simultáneos**: El sistema está diseñado para manejar múltiples scrapings simultáneos, pero considere las limitaciones de recursos.
3. **Manejo de errores**: Los errores se manejan a nivel de UI y se registran en la consola para depuración.

## Extensiones Futuras

1. **Panel de monitoreo de scraping**: Crear un panel dedicado para visualizar el progreso de todos los scrapings activos.
2. **Configuración de scraping**: Permitir al usuario configurar parámetros avanzados de scraping.
3. **Programación de scraping**: Implementar scraping programado para ejecutarse en momentos específicos.
