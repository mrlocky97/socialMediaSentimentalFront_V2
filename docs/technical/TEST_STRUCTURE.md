# Estructura de Tests para Scraping

Este documento describe la estructura de los tests para la funcionalidad de scraping y explica cómo están organizados para máxima mantenibilidad.

## Estructura de Carpetas

```
src/app/
├── tests/                           # Carpeta centralizada para todos los tests
│   ├── unit/                        # Tests unitarios
│   │   ├── services/                # Tests de servicios
│   │   │   ├── backend-api.service.spec.ts
│   │   │   └── scraping.service.spec.ts
│   │   └── utils/                   # Tests de utilidades
│   │       └── string-array.util.spec.ts
│   ├── integration/                 # Tests de integración
│   └── mocks/                       # Datos de prueba compartidos
│       └── scraping.mock.ts
├── core/
│   └── services/                    # Servicios a testear
│       ├── backend-api.service.ts
│       └── scraping.service.ts
└── shared/
    └── utils/                       # Utilidades a testear
        └── string-array.util.ts
```

## Tests Unitarios

### Services

#### `backend-api.service.spec.ts`
- Prueba los métodos de API para scraping:
  - `scrapeHashtags()`
  - `scrapeSearch()`
  - `scrapeUsers()`
- Verifica que las solicitudes HTTP se realicen correctamente con los parámetros adecuados
- Utiliza HttpTestingController para simular respuestas del servidor

#### `scraping.service.spec.ts`
- Prueba la orquestación del proceso de scraping:
  - Procesamiento de datos de campaña
  - Manejo de errores
  - Seguimiento del progreso
- Utiliza spies para simular las llamadas a la API
- Verifica que los datos se procesen correctamente antes de enviarse

### Utils

#### `string-array.util.spec.ts`
- Prueba las utilidades para manipulación de strings y arrays:
  - Conversión de varios tipos de entrada a arrays de strings
  - División de arrays en chunks
  - Normalización y limpieza de datos
  - Manejo de prefijos (# para hashtags, @ para menciones)

## Mocks

### `scraping.mock.ts`
- Proporciona datos de prueba consistentes y reutilizables para todos los tests
- Incluye:
  - Mock de campaña con diferentes parámetros de seguimiento
  - Opciones de scraping predefinidas
  - Respuestas simuladas de la API (éxito y error)
  - Estado inicial de progreso de scraping

## Beneficios de esta Estructura

1. **Separación de Responsabilidades:**
   - Tests separados por tipo de componente (servicios, utilidades)
   - Clara distinción entre tests unitarios e integración

2. **Reutilización:**
   - Datos de prueba centralizados
   - Configuración compartida para tests similares

3. **Mantenibilidad:**
   - Estructura de directorios que refleja la arquitectura de la aplicación
   - Fácil localización de tests relacionados con cada componente

4. **Facilidad para añadir nuevos tests:**
   - Estructura escalable
   - Patrones consistentes

## Convenciones de Nomenclatura

- Archivos de test: `[nombre-archivo].spec.ts`
- Archivos de mock: `[característica].mock.ts`
- Descripciones de test: Descripción clara del comportamiento esperado
- Casos de test agrupados por método/funcionalidad
