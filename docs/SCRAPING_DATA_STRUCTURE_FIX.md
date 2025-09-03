# Correcciones en la Estructura de Datos del Scraping Automático

## Resumen del Cambio

Se han realizado mejoras en la función `startScraping` del componente `CampaignListComponent` para manejar correctamente diferentes estructuras de datos que pueden llegar cuando se crea una campaña nueva.

## Problema Identificado

Al crear una nueva campaña, el objeto `result` pasado a la función `startScraping` podía tener diferentes estructuras dependiendo del flujo de la aplicación:

1. A veces podía recibir un objeto con formato:
   ```typescript
   {
     payload: { 
       // datos de la campaña, incluyendo type y otros campos 
     }
   }
   ```

2. Otras veces podía recibir un objeto con formato:
   ```typescript
   {
     id: 'campaignId',
     payload: { 
       // datos de la campaña
     }
   }
   ```

Sin embargo, los métodos `startHashtagScraping`, `startKeywordScraping`, etc. en el `ScrapingFacade` esperan siempre la segunda estructura, con el ID explícitamente definido en la raíz del objeto.

## Solución Implementada

1. Se ha agregado lógica para normalizar el objeto `result` antes de pasarlo a los métodos del facade:

```typescript
let normalizedResult = result;

// Caso 1: Es una acción de NgRx con campaignId en result.id y datos en result.payload
if (result.id && result.payload && result.payload.type) {
  normalizedResult = result; // Ya tiene el formato correcto
}
// Caso 2: Es un objeto acción de NgRx con la campaña en payload
else if (result.payload && result.payload.id) {
  normalizedResult = {
    id: result.payload.id,
    payload: result.payload
  };
}
```

2. Se ha modificado la llamada después de la creación de campaña para extraer el ID del objeto `action.payload` cuando sea posible:

```typescript
if (action.payload && action.payload.id) {
  this.startScraping({
    id: action.payload.id,
    payload: result.payload
  });
} else {
  // Si no tenemos el ID correcto, usamos el objeto result como está
  this.startScraping(result);
}
```

3. Se ha actualizado el método `startScraping` para utilizar el objeto normalizado en todas las llamadas al facade:

```typescript
this.scrapingFacade.startHashtagScraping(normalizedResult)
```

## Beneficios

- Mayor robustez al manejar diferentes estructuras de datos
- Prevención de errores durante el proceso de scraping automático
- Mejor interoperabilidad entre el componente y los servicios del facade

## Notas de Implementación

Esta modificación es compatible con versiones anteriores, lo que significa que si otros componentes llaman a `startScraping` con cualquiera de las dos estructuras, el método seguirá funcionando correctamente.
