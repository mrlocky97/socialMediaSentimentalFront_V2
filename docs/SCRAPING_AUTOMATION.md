# Automatización de Scraping en SocialMedia Sentimental

## Resumen

En la plataforma de SocialMedia Sentimental, el proceso de scraping (extracción de datos) ocurre de manera totalmente automatizada después de la creación de una campaña. Este documento detalla el comportamiento actual del sistema.

## Comportamiento del Scraping

### Scraping Automático en Creación de Campañas

Cuando se crea una nueva campaña y esta se guarda correctamente en el sistema, se inicia automáticamente un proceso de scraping adecuado al tipo de campaña:

- Para campañas de tipo `hashtag`: Se inicia scraping de hashtags
- Para campañas de tipo `keyword`: Se inicia scraping de palabras clave
- Para campañas de tipo `user`: Se inicia scraping de usuarios
- Para campañas de tipo `mention`: Se inicia scraping de menciones

Este comportamiento está implementado en el método `startScraping` del componente `CampaignListComponent`, que se llama automáticamente después de una creación exitosa de campaña:

```typescript
// Dentro del método que maneja la creación exitosa de una campaña
this.campaignFacade.createCampaign(result.payload).subscribe({
  next: (action) => {
    if (action.type === '[Campaign] Create Campaign Success') {
      this.snackBar.open(...);
      
      // Inicia el scraping automáticamente
      this.startScraping(result);
    }
  }
});
```

### Proceso Interno del Scraping

El método `startScraping` ejecuta la lógica apropiada dependiendo del tipo de campaña:

```typescript
startScraping(result: any): void {
  if (!result || !result.payload) return;

  switch (result.payload.type) {
    case 'hashtag':
      this.scrapingFacade.startHashtagScraping(result)...
      break;
    case 'keyword':
      this.scrapingFacade.startKeywordScraping(result)...
      break;
    // etc. para otros tipos
  }
}
```

### Notificaciones al Usuario

El sistema notifica al usuario sobre el estado del scraping:

1. **Notificación de éxito** - Se muestra un mensaje cuando el scraping inicia correctamente:
   ```typescript
   this.snackBar.open(
     this.transloco.translate('campaigns.create.scraping_started'),
     this.transloco.translate('common.close'),
     { duration: 3000, panelClass: 'success-snackbar' }
   );
   ```

2. **Notificación de error** - Si ocurre algún error durante el inicio del scraping:
   ```typescript
   this.snackBar.open(
     this.transloco.translate('campaigns.create.scraping_error', { error: error?.message }),
     this.transloco.translate('common.close'),
     { duration: 5000, panelClass: 'error-snackbar' }
   );
   ```

## Decisiones de Diseño

1. **Automatización Completa**: El scraping se inicia automáticamente al crear una campaña, eliminando la necesidad de pasos manuales adicionales.

2. **Sin Botón de Scrape**: El diseño actual no incluye un botón para iniciar manualmente el scraping, ya que esta acción ocurre automáticamente después de la creación.

3. **Enfoque en la Experiencia de Usuario**: Esta implementación simplifica el flujo de trabajo del usuario, permitiéndole crear una campaña y obtener datos inmediatamente sin acciones adicionales.

## Futuras Consideraciones

Si en el futuro se requiere la capacidad de iniciar manualmente el scraping para campañas existentes, se podría:

1. Reintroducir el botón "Scrape" en las acciones de tabla
2. Habilitar el caso 'scrape' en el método `onTableAction`
3. Implementar una política de limitación para evitar solicitudes de scraping excesivas

Sin embargo, la implementación actual prioriza la simplicidad y automatización del proceso.
